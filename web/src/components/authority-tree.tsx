"use client";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import CapitalNumber from "./capital-number";
import {
  authorityWorldView,
  authorityVolume,
  plaqueRim,
} from "@/lib/authority-world-view";
import {
  authorityLayout,
  authorityLedger,
  PLATE_WIDTH,
  ROOT_WIDTH,
  ROOT_HEIGHT,
} from "@/lib/authority-layout";
import {
  amount,
  authorityPath,
  descendantsOf,
  statusOf,
  type AuthorityModel,
} from "@/lib/authority";

export function AuthorityTrace({
  model,
  selected,
}: {
  model: AuthorityModel;
  selected: string;
}) {
  const path = authorityPath(model, selected),
    broken = path.find((n) => n.local === "revoked");
  return (
    <ol className="authority-trace" aria-label="Complete authority path">
      {path.map((n) => {
        const status = statusOf(model, n.id);
        return (
          <li key={n.id} className={status}>
            <i />
            <div>
              <strong>{n.name}</strong>
              <span className={`status ${status}`}>
                {n.id === broken?.id ? "REVOKED · BREAK" : status}
              </span>
            </div>
            <span className="trace-amount">
              {amount(n.available, model.decimals)} <small>{model.unit}</small>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
export default function AuthorityTree({
  model,
  selected,
  onSelect,
  preview,
  trace = false,
  traceEpoch = 0,
  spatial = false,
  director = false,
  flatten = false,
  grant,
  cascade,
  collapsed = [],
}: {
  model: AuthorityModel;
  selected: string;
  onSelect: (id: string) => void;
  preview?: string;
  trace?: boolean;
  traceEpoch?: number;
  spatial?: boolean;
  director?: boolean;
  flatten?: boolean;
  grant?: string;
  cascade?: number;
  collapsed?: string[];
}) {
  const marker = useId().replace(/:/g, "");
  const surface = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    if (!surface.current) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
      sync();
    });
    observer.observe(surface.current);
    media.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", sync);
    };
  }, []);
  const flat = authorityLayout(model, width);
  const directed = director && flat.canonical && width >= 780 && !reduceMotion;
  const view = authorityWorldView(model, selected, width, directed ? 1 : 0);
  const { canonical } = flat;
  const points = directed
    ? new Map(view.nodes.map((p) => [p.node.id, p]))
    : flat.points;
  const height = directed ? Math.max(570, view.height + 20) : flat.height;
  const nodeWidth = spatial && width < 600 ? 146 : PLATE_WIDTH;
  const rootWidth = spatial && width < 600 ? 200 : ROOT_WIDTH;
  const ancestry = authorityPath(model, selected);
  const path = new Set(ancestry.map((n) => n.id));
  const brokenDepth =
    model.nodes.find((n) => n.local === "revoked")?.depth ?? 0;
  const dimUnrelated =
    trace && !preview && !model.nodes.some((n) => n.local === "revoked");
  const affected = new Set(
    preview ? [preview, ...descendantsOf(model, preview).map((n) => n.id)] : [],
  );
  const hidden = new Set(
    collapsed.flatMap((id) => descendantsOf(model, id).map((n) => n.id)),
  );
  const visible = model.nodes.filter((n) => !hidden.has(n.id));
  const impact = [...affected].flatMap((id) => {
    const p = points.get(id);
    return p
      ? [{ ...p, half: (id === model.root ? rootWidth : nodeWidth) / 2 }]
      : [];
  });
  const bounds = impact.length
    ? {
        left: Math.min(...impact.map((p) => p.x - p.half)) - 16,
        right: Math.max(...impact.map((p) => p.x + p.half)) + 16,
        top: Math.min(...impact.map((p) => p.y)) - 16,
        bottom: Math.max(...impact.map((p) => p.y)) + 102,
      }
    : null;
  const volumeId =
    preview ??
    (cascade && director
      ? model.nodes.find((n) => n.local === "revoked")?.id
      : undefined);
  const volume = volumeId ? authorityVolume(view, volumeId) : [];
  // One bounded director clock, imperative projection only. The same mounted
  // labels and SVG paths interpolate to Command's actual viewport recipe.
  useEffect(() => {
    const root = surface.current;
    if (!root || !director || !flat.canonical || width < 560 || !flatten)
      return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const box = root.getBoundingClientRect();
    const rail = innerWidth >= 1280 ? 144 : 0;
    const inspector = innerWidth >= 1280 ? 336 : 320;
    const fieldWidth = innerWidth - rail - inspector;
    const command = authorityLayout(model, fieldWidth);
    let frame: number;
    let start: number | undefined;
    const restore = () => {
      for (const p of view.nodes) {
        const label = root.querySelector<HTMLElement>(
          `[data-testid="node-${p.node.id}"]`,
        );
        if (label) {
          label.style.left = `${p.x}px`;
          label.style.top = `${p.y}px`;
        }
        root
          .querySelector(`[data-rim="${p.node.id}"]`)
          ?.setAttribute("d", plaqueRim(p));
        if (p.node.parent) {
          const parent = view.nodes.find(
            (item) => item.node.id === p.node.parent,
          )!;
          const path = `M${parent.x} ${parent.y + parent.height}V${p.y - 20}H${p.x}V${p.y - 3}`;
          root
            .querySelectorAll(`[data-edge="${p.node.id}"] > path`)
            .forEach((edge) => edge.setAttribute("d", path));
        }
      }
    };
    const tick = (now: number) => {
      start ??= now;
      const t =
        reduced || document.hidden ? 1 : Math.min(1, (now - start) / 520);
      const ease = 1 - Math.pow(1 - t, 3);
      const projected = new Map(
        view.nodes.map((p) => {
          const end = command.points.get(p.node.id)!;
          const x = p.x + (rail + end.x - box.left - p.x) * ease;
          const y = p.y + (176 + end.y - box.top - p.y) * ease;
          const label = root.querySelector<HTMLElement>(
            `[data-testid="node-${p.node.id}"]`,
          );
          if (label) {
            label.style.left = `${x}px`;
            label.style.top = `${y}px`;
          }
          root
            .querySelector(`[data-rim="${p.node.id}"]`)
            ?.setAttribute("d", plaqueRim({ ...p, x, y }, 1 - ease));
          return [p.node.id, { ...p, x, y }] as const;
        }),
      );
      for (const p of projected.values()) {
        if (!p.node.parent) continue;
        const parent = projected.get(p.node.parent)!;
        const path = `M${parent.x} ${parent.y + parent.height}V${p.y - 20}H${p.x}V${p.y - 3}`;
        root
          .querySelectorAll(`[data-edge="${p.node.id}"] > path`)
          .forEach((edge) => edge.setAttribute("d", path));
      }
      root.dataset.flatten = String(t);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      restore();
      delete root.dataset.flatten;
    };
    // Read-only view is deterministic from these inputs; no per-frame React state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatten, directed, width, model, selected, director, flat.canonical]);
  const previousVolume = useRef<SVGGElement | null>(null);
  useEffect(() => {
    const root = surface.current;
    if (!root) return;
    if (preview) {
      previousVolume.current =
        (root
          .querySelector<SVGGElement>(".impact-volume")
          ?.cloneNode(true) as SVGGElement) ?? null;
      return;
    }
    const volume = previousVolume.current;
    previousVolume.current = null;
    if (
      !volume ||
      cascade ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    volume.classList.add("volume-exit");
    root.querySelector(".authority-channels")?.appendChild(volume);
    const animation = volume.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 180,
      fill: "forwards",
    });
    animation.finished.then(
      () => volume.remove(),
      () => volume.remove(),
    );
    return () => {
      animation.cancel();
      volume.remove();
    };
  }, [preview, cascade]);
  return (
    <div
      ref={surface}
      className={`authority-surface ${spatial ? "spatial" : ""} ${trace ? "tracing" : ""} ${directed ? "directed-world" : ""} ${directed && trace && !preview && !cascade ? "focus-world" : ""} ${flatten ? "flattening-world" : ""}`}
      data-depth={directed ? "orthographic" : "flat"}
      style={
        {
          "--node-width": `${nodeWidth}px`,
          "--root-width": `${rootWidth}px`,
        } as CSSProperties
      }
    >
      <div
        className="authority-map"
        style={{ height }}
        role="group"
        aria-label="Capital authority hierarchy"
      >
        <svg
          className="authority-channels"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <marker
              id={marker}
              markerWidth="5"
              markerHeight="5"
              refX="4"
              refY="2.5"
              orient="auto"
            >
              <path d="M0 0L5 2.5L0 5" fill="context-stroke" />
            </marker>
          </defs>
          {bounds && !directed && (
            <g className="impact-contour">
              <path
                pathLength="1"
                d={`M${bounds.left + 18} ${bounds.top}H${bounds.right}V${bounds.bottom}H${bounds.left}V${bounds.top}H${bounds.left + 18}`}
              />
              <text x={bounds.left + 14} y={bounds.bottom + 16}>
                AFFECTED BRANCH · PREVIEW
              </text>
            </g>
          )}
          {directed && volume.length > 0 && (
            <g
              className={`impact-contour impact-volume ${cascade && !preview ? "volume-retract" : ""}`}
            >
              {volume.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  pathLength="1"
                  className={i < 4 ? "volume-front" : "volume-back"}
                />
              ))}
            </g>
          )}
          {directed &&
            visible.map((n) => {
              const p = view.nodes.find((p) => p.node.id === n.id)!;
              return (
                <path
                  key={n.id}
                  data-rim={n.id}
                  data-depth={p.z}
                  d={plaqueRim(p)}
                  className={`depth-rim ${statusOf(model, n.id)} ${grant === n.id ? "grant-resolve" : ""} ${cascade && statusOf(model, n.id) !== "active" ? "cut-propagation" : ""}`}
                  style={
                    {
                      "--delay": `${n.depth === 1 ? 0 : n.depth === 2 ? 220 : 340}ms`,
                    } as CSSProperties
                  }
                />
              );
            })}
          {visible
            .filter((n) => n.parent)
            .map((n) => {
              const p = points.get(n.id),
                parent = points.get(n.parent!);
              if (!p || !parent) return null;
              const d = `M${parent.x} ${parent.y + (n.parent === model.root ? ROOT_HEIGHT : 86)}V${p.y - 20}H${p.x}V${p.y - 3}`;
              const status = statusOf(model, n.id);
              return (
                <g
                  key={n.id}
                  data-edge={n.id}
                  className={`authority-link ${status} ${trace && path.has(n.id) ? "on-path" : ""} ${grant === n.id ? "constructing" : ""} ${dimUnrelated && !path.has(n.id) ? "untraced" : ""} ${cascade && status !== "active" ? "cut-propagation" : ""}`}
                  style={
                    {
                      "--delay": `${director ? (n.depth <= brokenDepth + 1 ? 90 : 340) : Math.min(640, Math.max(0, n.depth - brokenDepth) * 80)}ms`,
                      "--trace-delay": `${Math.max(0, ancestry.length - 1 - n.depth) * 70}ms`,
                    } as CSSProperties
                  }
                >
                  <path d={d} pathLength="1" markerEnd={`url(#${marker})`} />
                  {trace && path.has(n.id) && (
                    <path
                      key={`${selected}-${traceEpoch}`}
                      className="trace-resolve"
                      d={d}
                      pathLength="1"
                    />
                  )}
                  {grant === n.id && (
                    <path className="grant-travel" d={d} pathLength="1" />
                  )}
                  {status === "revoked" && (
                    <g
                      className="authority-break"
                      transform={`translate(${p.x},${p.y - 16})`}
                    >
                      <circle r="9" />
                      <path d="M-3 -3L3 3M3 -3L-3 3" />
                    </g>
                  )}
                </g>
              );
            })}
        </svg>
        {visible.map((n) => {
          const p = points.get(n.id);
          if (!p) return null;
          const status = statusOf(model, n.id),
            childCount = descendantsOf(model, n.id).length;
          return (
            <button
              key={n.id}
              data-testid={`node-${n.id}`}
              aria-label={`Select ${n.name}`}
              aria-pressed={n.id === selected}
              className={`mandate-plate ${n.id === model.root ? "root-plate" : ""} ${status} ${n.id === selected ? "selected" : ""} ${dimUnrelated && !path.has(n.id) ? "untraced" : ""} ${affected.has(n.id) ? "preview-affected" : ""} ${grant === n.id ? "grant-resolve" : ""} ${cascade && status !== "active" ? "cut-propagation" : ""}`}
              style={
                {
                  left: p.x,
                  top: p.y,
                  "--delay": `${director ? (n.depth === brokenDepth ? 0 : n.depth === brokenDepth + 1 ? 220 : 340) : Math.min(640, Math.max(0, n.depth - brokenDepth) * 80)}ms`,
                } as CSSProperties
              }
              onClick={() => onSelect(n.id)}
            >
              <div className="plate-heading">
                <strong>{n.name}</strong>
                <span className="depth">D{n.depth}</span>
              </div>
              <div className="capital-rail">
                <CapitalNumber
                  value={n.available}
                  decimals={model.decimals}
                  animate={!director || !cascade}
                />
                <small>{model.unit}</small>
              </div>
              <div className="plate-foot">
                <span className={`status ${status}`}>{status}</span>
                <span>
                  {status === "blocked"
                    ? `LOCAL ${n.local.toUpperCase()}`
                    : n.id === model.root
                      ? "ROOT AVAILABLE"
                      : status === "revoked"
                        ? "LOCAL REVOKED"
                        : "OWN AVAILABLE"}
                </span>
              </div>
              {collapsed.includes(n.id) && (
                <span className="collapsed-count">
                  + {childCount} descendants
                </span>
              )}
            </button>
          );
        })}
        {(preview || model.nodes.some((n) => n.local === "revoked")) &&
          canonical &&
          statusOf(model, "operations") === "active" &&
          !affected.has("operations") && (
            <div className="sibling-note">
              <span className="status active">ACTIVE</span>
              <strong>Operations unaffected</strong>
              <small>Independent Root authority</small>
            </div>
          )}
      </div>
      <div className="mobile-mandates" aria-label="Nested authority ledger">
        {authorityLedger(model)
          .filter((n) => !hidden.has(n.id))
          .map((n) => {
            const status = statusOf(model, n.id);
            return (
              <button
                key={n.id}
                aria-label={`Select ${n.name} in ledger`}
                aria-pressed={n.id === selected}
                className={`mandate-row ${status} ${affected.has(n.id) ? "preview-affected" : ""} ${n.id === selected ? "selected" : ""} ${director && grant === n.id ? "constructing-row" : ""}`}
                style={{ "--depth": n.depth } as CSSProperties}
                onClick={() => onSelect(n.id)}
              >
                <span className="ledger-identity">
                  <small>D{n.depth}</small>
                  <strong>{n.name}</strong>
                  <span className={`status ${status}`}>{status}</span>
                </span>
                <span className="ledger-amount">
                  {amount(n.available, model.decimals)}
                  <small>
                    {model.unit} ·{" "}
                    {status === "blocked" ? "HISTORICAL" : "AVAILABLE"}
                  </small>
                </span>
              </button>
            );
          })}
      </div>
      <div className="tree-key">
        <span>
          <i className="key-line" />
          Authority relation
        </span>
        <span>
          <i className="key-cut" />
          Ancestor break
        </span>
        <span>Amounts are own available · nested budgets are not additive</span>
      </div>
    </div>
  );
}
