"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { Box, Database, FileText, Cog, ChartNoAxesColumn } from "lucide-react";

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
  const previous = useRef({ model, selected, preview, trace, grant, cascade });
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    if (surface.current) {
      setWidth(surface.current.getBoundingClientRect().width);
      observer.observe(surface.current);
    }
    return () => observer.disconnect();
  }, []);
  const roles = capitalInstrumentRoles(model);
  const ordered = authorityLedger(model);
  const hidden = new Set(
    collapsed.flatMap((id) => descendantsOf(model, id).map((n) => n.id)),
  );
  const visible = ordered.filter((n) => !hidden.has(n.id));
  const ancestry = new Set(authorityPath(model, selected).map((n) => n.id));
  const affected = new Set(
    preview ? [preview, ...descendantsOf(model, preview).map((n) => n.id)] : [],
  );
  const compact = width < 700;
  const nodeWidth = compact ? 142 : 210;
  const points: Record<
    string,
    { x: number; y: number; width: number; height: number }
  > = {};
  const fractions: Record<string, number> = {
    treasury: 0.5,
    research: 0.32,
    operations: 0.83,
    data: compact ? 0.21 : 0.18,
    analysis: compact ? 0.76 : 0.5,
    scraper: compact ? 0.21 : 0.18,
  };
  if (roles)
    for (const node of ordered) {
      const root = node.id === model.root;
      const w = root ? 190 : nodeWidth;
      points[node.id] = {
        x: width * fractions[roles[node.id]] - w / 2,
        y: root ? 8 : 188 + (node.depth - 1) * 126,
        width: w,
        height: root ? 164 : 108,
      };
    }
  else {
    const visited = new Set<string>();
    let leaf = 0;
    const slots = new Map<string, number>();
    const visit = (id: string): number => {
      if (visited.has(id)) return leaf;
      visited.add(id);
      const children = model.nodes
        .filter((n) => n.parent === id)
        .map((n) => visit(n.id));
      const position = children.length
        ? children.reduce((a, b) => a + b, 0) / children.length
        : leaf++;
      slots.set(id, position);
      return position;
    };
    visit(model.root);
    for (const node of ordered) if (!visited.has(node.id)) visit(node.id);
    for (const node of ordered) {
      const root = node.id === model.root;
      const w = root ? 156 : nodeWidth;
      const center =
        leaf > 1
          ? nodeWidth / 2 +
            12 +
            ((slots.get(node.id) ?? 0) *
              (Math.max(width, nodeWidth * leaf + 24) - nodeWidth - 24)) /
              (leaf - 1)
          : width / 2;
      points[node.id] = {
        x: center - w / 2,
        y: root ? 8 : 178 + (node.depth - 1) * 120,
        width: w,
        height: root ? 152 : 96,
      };
    }
  }
  // A readable nested ledger replaces miniature geometry on narrow screens.
  if (compact)
    visible.forEach((node, index) => {
      const root = node.id === model.root;
      points[node.id] = {
        x: root ? (width - 190) / 2 : node.depth * 18,
        y: root ? 8 : 190 + (index - 1) * 108,
        width: root ? 190 : width - node.depth * 18 - 4,
        height: root ? 164 : 92,
      };
    });
  const fieldWidth = roles
    ? width
    : Math.max(width, ...Object.values(points).map((p) => p.x + p.width + 8));
  const height = Math.max(
    350,
    ...visible.map((n) => points[n.id].y + points[n.id].height + 20),
  );
  const route = (id: string) => {
    const node = model.nodes.find((n) => n.id === id),
      p = points[id],
      parent = node?.parent ? points[node.parent] : undefined;
    if (!p || !parent) return "";
    const x1 = parent.x + parent.width / 2,
      y1 = parent.y + parent.height,
      x2 = p.x + p.width / 2,
      y2 = p.y;
    const mid = y1 + (y2 - y1) / 2;
    if (Math.abs(x2 - x1) < 1) return `M${x1} ${y1}V${y2}`;
    return `M${x1} ${y1}V${mid}Q${x1} ${mid + 5} ${x1 + (x2 > x1 ? 6 : -6)} ${mid + 5}H${x2 - (x2 > x1 ? 6 : -6)}Q${x2} ${mid + 5} ${x2} ${mid + 11}V${y2}`;
  };
  useEffect(() => {
    const before = previous.current;
    previous.current = { model, selected, preview, trace, grant, cascade };
    const scope = surface.current;
    if (!scope) return;
    const failed = model.nodes.filter(
      (n) =>
        statusOf(before.model, n.id) === "active" &&
        statusOf(model, n.id) !== "active",
    );
    const selection = before.selected !== selected || (!before.trace && trace);
    const newGrant = !!grant && before.grant !== grant;
    if (!failed.length && !selection && !newGrant && before.preview === preview)
      return;
    const timeline = scopedTimeline(
      scope,
      failed.length
        ? "cascade"
        : preview
          ? "impact"
          : newGrant
            ? "grant"
            : "trace",
      failed.length ? 1100 : newGrant ? 700 : 650,
    );
    const edge = (id: string) =>
      scope.querySelector(`[data-edge="${CSS.escape(id)}"]`);
    if (failed.length) {
      const first = Math.min(...failed.map((n) => n.depth));
      for (const n of failed) {
        const delay = (n.depth - first) * 170;
        timeline.animate(
          scope.querySelector(`[data-node-id="${CSS.escape(n.id)}"] .status`),
          [{ opacity: 0.3 }, { opacity: 1 }],
          200,
          delay,
        );
        timeline.draw(edge(n.id), 220, delay);
      }
    } else if (preview && preview !== before.preview) {
      scope
        .querySelectorAll(".flat-impact")
        .forEach((path) => timeline.draw(path, 440));
    } else {
      const path = authorityPath(model, grant ?? selected).slice(1);
      const chain = newGrant ? path.slice(-1) : [...path].reverse();
      chain.forEach((n, i) =>
        timeline.pulse(
          edge(n.id),
          newGrant ? 420 : 200,
          newGrant ? 0 : i * 100,
          !newGrant,
          statusOf(model, n.id) === "active" ? "#b9d8b6" : "#d99080",
        ),
      );
      if (newGrant)
        timeline.animate(
          scope.querySelector(`[data-node-id="${CSS.escape(grant!)}"]`),
          [{ opacity: 0 }, { opacity: 1 }],
          180,
          420,
        );
      timeline.animate(
        scope.closest("main")?.querySelector(".instrument-heading"),
        [{ opacity: 0.5 }, { opacity: 1 }],
        160,
      );
    }
    return timeline.cancel;
  }, [model, selected, preview, trace, grant, cascade]);
  return (
    <div
      ref={surface}
      className={`capital-structure instrument-authority vertical-authority ${trace ? "tracing" : ""}`}
      aria-label="Authority structure"
    >
      <div className="flat-map" style={{ height, minWidth: fieldWidth }}>
        <svg
          className="flat-rails"
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          {visible
            .filter((n) => n.parent && points[n.parent])
            .map((n) => (
              <path
                key={n.id}
                data-edge={n.id}
                className={`flat-relation ${statusOf(model, n.id)} ${ancestry.has(n.id) ? "on-path" : ""} ${affected.has(n.id) ? "preview-affected" : ""}`}
                pathLength="1"
                d={route(n.id)}
              />
            ))}
          {visible
            .filter((n) => affected.has(n.id))
            .map((n) => {
              const p = points[n.id];
              return (
                <path
                  key={n.id}
                  className="flat-impact"
                  pathLength="1"
                  d={`M${p.x - 6} ${p.y - 6}h${p.width + 12}v${p.height + 12}h-${p.width + 12}Z`}
                />
              );
            })}
          {visible.map((n) => {
            const p = points[n.id],
              root = n.id === model.root;
            return root ? (
              <path
                key={n.id}
                className="root-body"
                d={rootSeal}
                transform={`translate(${p.x} ${p.y}) scale(${p.width / 180} ${p.height / 176})`}
              />
            ) : (
              <path
                key={n.id}
                data-frame={n.id}
                className={`authority-frame ${statusOf(model, n.id)}`}
                d={`M${p.x + 10} ${p.y}H${p.x + p.width}V${p.y + p.height}H${p.x}V${p.y + 10}Z`}
              />
            );
          })}
        </svg>
        {visible.map((n) => {
          const p = points[n.id],
            status = statusOf(model, n.id);
          const role = roles?.[n.id];
          const Icon =
            role === "research"
              ? FileText
              : role === "data"
                ? Database
                : role === "scraper"
                  ? Box
                  : role === "analysis"
                    ? ChartNoAxesColumn
                    : Cog;
          return (
            <button
              key={n.id}
              data-testid={`node-${n.id}`}
              data-node-id={n.id}
              data-visual-role={roles?.[n.id] ?? n.id}
              className={`flat-node ${status} ${n.id === selected ? "selected" : ""} ${ancestry.has(n.id) ? "on-path" : ""}`}
              style={{ left: p.x, top: p.y, width: p.width, height: p.height }}
              aria-label={`Select ${n.name}`}
              aria-pressed={n.id === selected}
              onClick={() => onSelect(n.id)}
            >
              <span className="flat-name">
                <span className="node-identity">
                  {n.id === model.root ? (
                    <svg
                      className="node-emblem"
                      viewBox="0 0 62 30"
                      aria-hidden="true"
                    >
                      <path d="M2 27V3L31 18L60 3V27M10 27V16L31 28L52 16V27" />
                    </svg>
                  ) : (
                    <Icon size={19} aria-hidden="true" />
                  )}
                  {n.name}
                </span>
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
