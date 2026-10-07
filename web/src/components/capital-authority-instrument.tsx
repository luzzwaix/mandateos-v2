"use client";
import { useEffect, useRef, useState } from "react";
import {
  amount,
  authorityPath,
  descendantsOf,
  statusOf,
  type AuthorityModel,
} from "@/lib/authority";
import {
  authorityLedger,
  capitalInstrumentRoles,
} from "@/lib/authority-layout";
import { scopedTimeline } from "./authority-motion";
import { operatingMotion as motion } from "./operating-motion";

// Flat counterpart of Story's notched Root and inherited bands. Dimensions
// express ancestry, never token balances or a transfer between agent wallets.
function sleeve(x: number, y: number, width: number, height: number) {
  const mid = y + height / 2;
  return `M${x + 14} ${y}H${x + width}V${y + height}H${x + 14}V${mid + 14}L${x} ${mid}L${x + 14} ${mid - 14}Z`;
}
const rootSeal =
  "M32 0H148Q180 0 180 32V69L162 88L180 107V144Q180 176 148 176H32Q0 176 0 144V107L18 88L0 69V32Q0 0 32 0Z";

export default function CapitalAuthorityInstrument({
  model,
  selected,
  onSelect,
  preview,
  trace = false,
  collapsed = [],
  cascade,
  grant,
}: {
  model: AuthorityModel;
  selected: string;
  onSelect: (id: string) => void;
  preview?: string;
  trace?: boolean;
  collapsed?: string[];
  cascade?: number;
  grant?: string;
}) {
  const surface = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(980);
  const previous = useRef({ model, selected, preview, trace, cascade, grant });
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    if (surface.current) observer.observe(surface.current);
    return () => observer.disconnect();
  }, []);
  const ordered = authorityLedger(model);
  const roles = capitalInstrumentRoles(model);
  const canonical = !!roles;
  const roleOf = (id: string) => roles?.[id] ?? id;
  const dataX = Math.max(468, 218 + (width - 228) * 0.34);
  const points: Record<
    string,
    { x: number; y: number; width: number; height: number }
  > = {
    treasury: { x: 18, y: 70, width: 180, height: 176 },
    research: { x: 236, y: 10, width: 174, height: 98 },
    data: { x: dataX, y: 115, width: 160, height: 104 },
    scraper: { x: width - 178, y: 115, width: 154, height: 104 },
    analysis: { x: dataX, y: 245, width: 190, height: 94 },
    operations: { x: 236, y: 265, width: 212, height: 94 },
  };
  if (canonical)
    model.nodes.forEach((n) => {
      points[n.id] = points[roleOf(n.id)];
    });
  else
    ordered.forEach((node, i) => {
      points[node.id] = {
        x: 20 + node.depth * 170,
        y: i * 112,
        width: 160,
        height: 108,
      };
    });
  const hidden = new Set(
    collapsed.flatMap((id) => descendantsOf(model, id).map((n) => n.id)),
  );
  const visible = ordered.filter((n) => !hidden.has(n.id));
  const ancestry = new Set(authorityPath(model, selected).map((n) => n.id));
  const affected = new Set(
    preview ? [preview, ...descendantsOf(model, preview).map((n) => n.id)] : [],
  );
  useEffect(() => {
    const before = previous.current;
    previous.current = { model, selected, preview, trace, cascade, grant };
    const element = surface.current;
    if (!element) return;
    const failed = model.nodes.filter(
      (n) =>
        statusOf(before.model, n.id) === "active" &&
        statusOf(model, n.id) !== "active",
    );
    const selection = before.selected !== selected || (trace && !before.trace);
    if (
      !failed.length &&
      !selection &&
      before.preview === preview &&
      before.grant === grant
    )
      return;
    const duration = failed.length
      ? motion.cascade
      : preview
        ? motion.impact
        : motion.trace;
    const timeline = scopedTimeline(
      element,
      failed.length ? "cascade" : preview ? "impact" : "trace",
      duration,
    );
    const edge = (id: string) =>
      [...element.querySelectorAll("[data-edge]")].find(
        (e) =>
          e.getAttribute("data-edge") === id &&
          getComputedStyle(e.closest("svg")!).display !== "none",
      );
    if (failed.length) {
      const depth = Math.min(...failed.map((n) => n.depth));
      failed.forEach((n) => {
        const delay = (n.depth - depth) * motion.depthStagger;
        timeline.pulse(edge(n.id), 220, delay, false, "#a66051");
        const frame = [...element.querySelectorAll("[data-frame]")].find(
          (e) => e.getAttribute("data-frame") === n.id,
        );
        timeline.animate(
          frame,
          [{ stroke: "#eee9da" }, { stroke: "#a66051" }],
          250,
          delay,
        );
        const stations = [
          ...element.querySelectorAll("[data-node-id], [data-mobile-node]"),
        ].filter(
          (e) =>
            e.getAttribute("data-node-id") === n.id ||
            e.getAttribute("data-mobile-node") === n.id,
        );
        stations.forEach((station) =>
          timeline.animate(
            station.querySelector(".status"),
            [{ opacity: 0.2 }, { opacity: 1 }],
            180,
            delay,
          ),
        );
      });
      timeline.draw(element.querySelector(".authority-break"), 180);
      // Accounting is already true in the model; reveal it as a separate beat.
      timeline.animate(
        element
          .closest("main")
          ?.querySelector(".treasury-ledger > div:nth-child(2) strong"),
        [{ opacity: 0.25 }, { opacity: 1 }],
        220,
        660,
      );
      timeline.animate(
        element
          .closest("main")
          ?.querySelector(".capital-controls .financial-impact"),
        [{ opacity: 0.25 }, { opacity: 1 }],
        220,
        660,
      );
    } else if (preview && preview !== before.preview) {
      timeline.draw(element.querySelector(".flat-impact"), motion.impact);
    } else if (selection || before.grant !== grant) {
      const chain = authorityPath(model, grant ?? selected).slice(1);
      chain.forEach((n, i) => {
        timeline.draw(edge(n.id), 220, i * 160);
        timeline.pulse(
          edge(n.id),
          220,
          i * 160,
          false,
          statusOf(model, n.id) === "active" ? "#c8d9c5" : "#a66051",
        );
      });
      const focus = element.querySelector(
        '[data-node-id="' + CSS.escape(selected) + '"]',
      );
      timeline.animate(
        focus?.querySelector(".mandate-focus"),
        [{ opacity: 0.25 }, { opacity: 1 }],
        220,
        Math.min(340, chain.length * 130),
      );
    }
    return timeline.cancel;
  }, [model, selected, preview, trace, cascade, grant]);
  const research = model.nodes.find((n) => roleOf(n.id) === "research");
  const routes: Record<string, string> = {
    research: "M198 158H214V64H236",
    operations: "M198 158H214V310H236",
    data: `M410 64H${dataX - 18}V161H${dataX}`,
    analysis: `M410 64H${dataX - 38}V291H${dataX}`,
    scraper: `M${dataX + 160} 161H${width - 178}`,
  };
  return (
    <div
      ref={surface}
      className={`capital-structure instrument-authority ${trace ? "tracing" : ""} ${canonical ? "canonical" : "extended"}`}
    >
      <div className="flat-map" style={{ height: 375 }}>
        <svg
          className="flat-rails"
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          <path
            className="root-body"
            d={rootSeal}
            transform="translate(18 70)"
          />
          {visible
            .filter((n) => n.parent)
            .map((n) => {
              const geometry =
                roleOf(n.id) === "research"
                  ? `M222 5H${width - 8}V110H244V232H${dataX - 22}V340H${dataX - 38}V248H222V172L208 158L222 144Z`
                  : roleOf(n.id) === "data"
                    ? sleeve(dataX - 22, 110, width - dataX + 14, 120)
                    : roleOf(n.id) === "scraper"
                      ? sleeve(width - 190, 110, 182, 120)
                      : roleOf(n.id) === "analysis"
                        ? sleeve(dataX - 22, 235, 236, 106)
                        : sleeve(224, 255, 240, 112);
              return (
                <path
                  key={n.id}
                  data-frame={n.id}
                  data-frame-role={roleOf(n.id)}
                  className={`authority-frame ${statusOf(model, n.id)} ${affected.has(n.id) ? "preview-affected" : ""}`}
                  d={geometry}
                />
              );
            })}
          {preview && (
            <path
              className="flat-impact"
              pathLength="1"
              d={
                roleOf(preview) === "research"
                  ? `M202 0H${width - 1}V347H${dataX - 29}V238H202Z`
                  : roleOf(preview) === "data"
                    ? sleeve(dataX - 29, 103, width - dataX + 27, 134)
                    : sleeve(
                        (points[preview]?.x ?? 0) - 20,
                        (points[preview]?.y ?? 0) - 12,
                        (points[preview]?.width ?? 160) + 40,
                        (points[preview]?.height ?? 104) + 24,
                      )
              }
            />
          )}
          {visible
            .filter((n) => n.parent)
            .map((n) => (
              <path
                key={n.id}
                data-edge={n.id}
                className={`flat-relation ${statusOf(model, n.id)} ${ancestry.has(n.id) ? "on-path" : ""} ${affected.has(n.id) ? "preview-affected" : ""}`}
                pathLength="1"
                d={routes[roleOf(n.id)] ?? ""}
              />
            ))}
          {research?.local === "revoked" && (
            <path
              className="authority-break"
              d="M208 58L220 70M208 70L220 58"
              pathLength="1"
            />
          )}
        </svg>
        {research && (
          <div
            className={`branch-finance ${research.local === "revoked" ? "revoked" : ""}`}
            style={{ left: width - 210, top: 25 }}
          >
            <span>BRANCH REMAINING</span>
            <strong>
              {amount(research.remaining, model.decimals)}{" "}
              <small>{model.unit}</small>
            </strong>
          </div>
        )}
        {visible.map((n) => {
          const p = points[n.id];
          if (!p) return null;
          const status = statusOf(model, n.id);
          return (
            <button
              key={n.id}
              data-testid={`node-${n.id}`}
              data-node-id={n.id}
              data-visual-role={roleOf(n.id)}
              className={`flat-node ${status} ${n.id === selected ? "selected" : ""} ${ancestry.has(n.id) ? "on-path" : ""} ${affected.has(n.id) ? "preview-affected" : ""}`}
              style={{ left: p.x, top: p.y, width: p.width, height: p.height }}
              aria-label={`Select ${n.name}`}
              aria-pressed={n.id === selected}
              onClick={() => onSelect(n.id)}
            >
              <i className="mandate-focus" aria-hidden="true" />
              <span className="flat-name">
                {n.name}
                <small>D{n.depth}</small>
              </span>
              <span className="available-label">
                {status === "blocked" ? "STORED AVAILABLE" : "OWN AVAILABLE"}
              </span>
              <strong>
                {amount(n.available, model.decimals)}{" "}
                <small>{model.unit}</small>
              </strong>
              <span className={`status ${status}`}>{status}</span>
              {roleOf(n.id) === "research" || n.id === model.root ? (
                <span className="subtree-notation">
                  Subtree {amount(n.remaining, model.decimals)} {model.unit}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="flat-mobile" aria-label="Nested authority ledger">
        {visible.map((n) => (
          <button
            key={n.id}
            data-mobile-node={n.id}
            onClick={() => onSelect(n.id)}
            aria-pressed={n.id === selected}
            className={`flat-ledger-node ${statusOf(model, n.id)} ${ancestry.has(n.id) ? "on-path" : ""} ${affected.has(n.id) ? "preview-affected" : ""}`}
            style={{ paddingLeft: 16 + n.depth * 16 }}
          >
            <span>
              <i className="authority-dot" />
              {n.name}
              <small>
                D{n.depth} · {statusOf(model, n.id)}
              </small>
            </span>
            <strong>
              {amount(n.available, model.decimals)} <small>{model.unit}</small>
            </strong>
          </button>
        ))}
      </div>
    </div>
  );
}
