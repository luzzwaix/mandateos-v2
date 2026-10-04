"use client";
import { useEffect, useRef, useState } from "react";
import {
  amount,
  authorityPath,
  descendantsOf,
  statusOf,
  type AuthorityModel,
} from "@/lib/authority";
import { authorityLayout, authorityLedger } from "@/lib/authority-layout";

/** The same operational anchors are used at the end of the spatial director. */
export function operationalPoints(model: AuthorityModel, width: number) {
  const layout = authorityLayout(model, width);
  if (layout.canonical) {
    for (const [id, x, depth] of [
      ["treasury", 0.43, 0],
      ["research", 0.35, 1],
      ["operations", 0.82, 1],
      ["data", 0.21, 2],
      ["analysis", 0.5, 2],
      ["scraper", 0.115, 3],
    ] as const)
      layout.points.set(id, { x: width * x, y: 55 + depth * 143 });
  }
  return layout;
}
export default function FlatAuthorityTree({
  model,
  selected,
  onSelect,
  preview,
  trace = false,
  collapsed = [],
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
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    if (surface.current) observer.observe(surface.current);
    return () => observer.disconnect();
  }, []);
  const { points, height } = operationalPoints(model, width);
  const path = new Set(authorityPath(model, selected).map((n) => n.id));
  const hidden = new Set(
    collapsed.flatMap((id) => descendantsOf(model, id).map((n) => n.id)),
  );
  const affected = new Set(
    preview ? [preview, ...descendantsOf(model, preview).map((n) => n.id)] : [],
  );
  const visible = authorityLedger(model).filter((n) => !hidden.has(n.id));
  const impacted = visible
    .filter((n) => affected.has(n.id))
    .map((n) => points.get(n.id))
    .filter((p) => !!p);
  return (
    <div
      className={`flat-authority authority-surface ${trace ? "tracing" : ""}`}
      ref={surface}
    >
      <div
        className="flat-map authority-map"
        style={{ height: Math.max(575, height) }}
      >
        <svg
          className="flat-rails authority-channels"
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          {impacted.length > 0 && (
            <rect
              className="flat-impact"
              x={Math.min(...impacted.map((p) => p.x)) - 23}
              y={Math.min(...impacted.map((p) => p.y)) - 24}
              width={
                Math.max(...impacted.map((p) => p.x)) -
                Math.min(...impacted.map((p) => p.x)) +
                210
              }
              height={
                Math.max(...impacted.map((p) => p.y)) -
                Math.min(...impacted.map((p) => p.y)) +
                92
              }
            />
          )}
          {visible.map((n) => {
            const parent = n.parent ? points.get(n.parent) : undefined,
              p = points.get(n.id);
            if (!parent || !p) return null;
            return (
              <path
                key={n.id}
                data-edge={n.id}
                className={`flat-relation authority-link ${statusOf(model, n.id)} ${path.has(n.id) ? "on-path" : ""}`}
                d={`M${parent.x} ${parent.y + 21}V${p.y - 58}H${p.x}V${p.y - 18}`}
              />
            );
          })}
        </svg>
        {visible.map((n) => {
          const p = points.get(n.id);
          if (!p) return null;
          const status = statusOf(model, n.id);
          return (
            <button
              key={n.id}
              data-testid={`node-${n.id}`}
              data-node-id={n.id}
              className={`flat-node ${status} ${n.id === selected ? "selected" : ""} ${path.has(n.id) ? "on-path" : ""} ${affected.has(n.id) ? "preview-affected" : ""}`}
              style={{ left: p.x, top: p.y }}
              aria-label={`Select ${n.name}`}
              aria-pressed={n.id === selected}
              onClick={() => onSelect(n.id)}
            >
              <i className="authority-dot" />
              <span className="flat-name">{n.name}</span>
              <strong>
                {amount(n.available, model.decimals)}{" "}
                <small>{model.unit}</small>
              </strong>
              <span className={`status ${status}`}>{status}</span>
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
            className={`flat-ledger-node ${statusOf(model, n.id)} ${affected.has(n.id) ? "preview-affected" : ""}`}
            style={{ paddingLeft: 18 + n.depth * 22 }}
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
