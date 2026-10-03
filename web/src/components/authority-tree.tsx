"use client";
import { useId, type CSSProperties } from "react";
import {
  amount,
  authorityPath,
  descendantsOf,
  genesis,
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
  spatial = false,
  grant,
  cascade,
  collapsed = [],
}: {
  model: AuthorityModel;
  selected: string;
  onSelect: (id: string) => void;
  preview?: string;
  trace?: boolean;
  spatial?: boolean;
  grant?: string;
  cascade?: number;
  collapsed?: string[];
}) {
  const marker = useId().replace(/:/g, "");
  const canonical = model.nodes.every((n) =>
    genesis().nodes.some((demo) => demo.id === n.id),
  );
  const layoutNodes = canonical ? genesis().nodes : model.nodes;
  const points = new Map<string, { x: number; y: number }>();
  let leaf = 0;
  const visited = new Set<string>();
  const visit = (id: string): number => {
    if (visited.has(id)) return leaf;
    visited.add(id);
    const node = layoutNodes.find((n) => n.id === id)!;
    const children = layoutNodes.filter((n) => n.parent === id);
    const xs = children.map((n) => visit(n.id));
    const x = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : leaf++;
    points.set(id, { x, y: 40 + node.depth * 132 });
    return x;
  };
  if (layoutNodes.some((n) => n.id === model.root)) visit(model.root);
  for (const [id, p] of points)
    points.set(id, {
      x: leaf > 1 ? 190 + p.x * (540 / (leaf - 1)) : 450,
      y: p.y,
    });
  const height = Math.max(530, ...model.nodes.map((n) => n.depth * 132 + 150));
  const path = new Set(authorityPath(model, selected).map((n) => n.id));
  const dimUnrelated =
    trace && !preview && !model.nodes.some((n) => n.local === "revoked");
  const affected = new Set(
    preview ? [preview, ...descendantsOf(model, preview).map((n) => n.id)] : [],
  );
  const hidden = new Set(
    collapsed.flatMap((id) => descendantsOf(model, id).map((n) => n.id)),
  );
  const visible = model.nodes.filter((n) => !hidden.has(n.id));
  const impact = [...affected]
    .map((id) => points.get(id))
    .filter((p): p is { x: number; y: number } => !!p);
  const bounds = impact.length
    ? {
        left: Math.min(...impact.map((p) => p.x)) - 118,
        right: Math.max(...impact.map((p) => p.x)) + 118,
        top: Math.min(...impact.map((p) => p.y)) - 20,
        bottom: Math.max(...impact.map((p) => p.y)) + 110,
      }
    : null;
  return (
    <div
      className={`authority-surface ${spatial ? "spatial" : ""} ${trace ? "tracing" : ""}`}
    >
      <div
        className="authority-map"
        style={{ height }}
        role="group"
        aria-label="Capital authority hierarchy"
      >
        {spatial && (
          <div className="structural-planes" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        )}
        <svg
          className="authority-channels"
          viewBox={`0 0 900 ${height}`}
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
          {bounds && (
            <g className="impact-contour">
              <path
                d={`M${bounds.left + 18} ${bounds.top}H${bounds.right}V${bounds.bottom}H${bounds.left}V${bounds.top}H${bounds.left + 18}`}
              />
              <text x={bounds.left + 14} y={bounds.bottom - 12}>
                AFFECTED BRANCH · PREVIEW
              </text>
            </g>
          )}
          {visible
            .filter((n) => n.parent)
            .map((n) => {
              const p = points.get(n.id),
                parent = points.get(n.parent!);
              if (!p || !parent) return null;
              const d = `M${parent.x} ${parent.y + 86}V${p.y - 25}H${p.x}V${p.y - 3}`;
              const status = statusOf(model, n.id);
              return (
                <g
                  key={n.id}
                  className={`authority-link ${status} ${dimUnrelated && !path.has(n.id) ? "untraced" : ""} ${cascade && status !== "active" ? "cut-propagation" : ""}`}
                  style={
                    {
                      "--delay": `${Math.min(300, n.depth * 80)}ms`,
                    } as CSSProperties
                  }
                >
                  <path d={d} markerEnd={`url(#${marker})`} />
                  {grant === n.id && (
                    <path className="grant-travel" d={d} pathLength="100" />
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
                  left: `${p.x / 9}%`,
                  top: p.y,
                  "--delay": `${Math.min(300, n.depth * 80)}ms`,
                } as CSSProperties
              }
              onClick={() => onSelect(n.id)}
            >
              <div className="plate-heading">
                <strong>{n.name}</strong>
                <span className="depth">D{n.depth}</span>
              </div>
              <div className="capital-rail">
                <span>{amount(n.available, model.decimals)}</span>
                <small>{model.unit}</small>
              </div>
              <div className="plate-foot">
                <span className={`status ${status}`}>{status}</span>
                <span>
                  {status === "blocked"
                    ? `LOCAL ${n.local.toUpperCase()}`
                    : n.id === model.root
                      ? "ROOT AVAILABLE"
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
        {visible.map((n) => {
          const status = statusOf(model, n.id);
          return (
            <button
              key={n.id}
              aria-label={`Select ${n.name} in ledger`}
              aria-pressed={n.id === selected}
              className={`mandate-row ${status} ${affected.has(n.id) ? "preview-affected" : ""} ${n.id === selected ? "selected" : ""}`}
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
