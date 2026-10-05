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
import { motionTiming, scopedTimeline } from "./authority-motion";
import { operatingMotion } from "./operating-motion";

/** The same operational anchors are used at the end of the spatial director. */
export const canonicalAnchors = {
  treasury: [0.32, 0],
  research: [0.32, 1],
  operations: [0.76, 1],
  data: [0.32, 2],
  analysis: [0.63, 2],
  scraper: [0.32, 3],
} as const;
export const operatingFrame = {
  gutter: 48,
  gap: 32,
  inspector: 390,
  glyphCenterY: 316,
};
export function operationalPoints(model: AuthorityModel, width: number) {
  const layout = authorityLayout(model, width);
  if (layout.canonical) {
    for (const [id, [x, depth]] of Object.entries(canonicalAnchors))
      layout.points.set(id, { x: width * x, y: 42 + depth * 106 });
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
  cascade = 0,
  grant,
  capital = false,
}: {
  model: AuthorityModel;
  selected: string;
  onSelect: (id: string) => void;
  preview?: string;
  trace?: boolean;
  collapsed?: string[];
  cascade?: number;
  grant?: string;
  capital?: boolean;
}) {
  const surface = useRef<HTMLDivElement>(null);
  const previous = useRef({ model, selected, trace, preview, cascade });
  const [width, setWidth] = useState(980);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    if (surface.current) observer.observe(surface.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const before = previous.current;
    previous.current = { model, selected, trace, preview, cascade };
    const element = surface.current;
    if (!element) return;
    const failed = model.nodes
      .filter(
        (node) =>
          statusOf(before.model, node.id) === "active" &&
          statusOf(model, node.id) !== "active",
      )
      .sort((a, b) => a.depth - b.depth);
    const added = model.nodes.filter(
      (node) => !before.model.nodes.some((old) => old.id === node.id),
    );
    const isSelection = capital && before.selected !== selected;
    const isTrace =
      (trace && (!before.trace || before.selected !== selected)) || isSelection;
    if (
      !failed.length &&
      !added.length &&
      !isTrace &&
      !isSelection &&
      preview === before.preview
    )
      return;
    const timeline = scopedTimeline(
      element,
      failed.length
        ? "cascade"
        : preview
          ? "impact"
          : added.length
            ? "grant"
            : "trace",
      failed.length ? motionTiming.cascade : motionTiming.build,
    );
    const edge = (id: string) =>
      Array.from(element.querySelectorAll("[data-edge]")).find(
        (edge) => edge.getAttribute("data-edge") === id,
      );
    const station = (id: string) =>
      Array.from(
        element.querySelectorAll("[data-node-id], [data-mobile-node]"),
      ).filter(
        (node) =>
          node.getAttribute("data-node-id") === id ||
          node.getAttribute("data-mobile-node") === id,
      );
    if (failed.length) {
      const depth = failed[0].depth;
      failed.forEach((node, i) => {
        const delay =
          (node.depth - depth) *
            (capital ? operatingMotion.depthStagger : 240) +
          i * 65;
        timeline.pulse(
          edge(node.id),
          260,
          delay,
          false,
          capital ? "#883d34" : "#eee9da",
        );
        timeline.animate(
          edge(node.id),
          [
            { stroke: capital ? "#36583d" : "#c8d9c5", strokeDasharray: "1 0" },
            {
              stroke: capital ? "#883d34" : "#687566",
              strokeDasharray:
                node.id === failed[0].id ? ".46 .08 .46" : ".045 .045",
            },
          ],
          240,
          delay,
        );
        station(node.id).forEach((station) => {
          timeline.animate(
            station.querySelector(".authority-segment"),
            [
              { fill: capital ? "#36583d" : "#c8d9c5" },
              { fill: capital ? "#bdc3b1" : "#3d4c3e" },
            ],
            320,
            delay,
          );
          timeline.animate(
            station.querySelector(".status, .flat-ledger-node small"),
            [{ opacity: 0 }, { opacity: 1 }],
            180,
            delay + 180,
          );
          timeline.animate(
            station.querySelector(".authority-dot"),
            [{ backgroundColor: "#c8d9c5" }, { backgroundColor: "#3d4c3e" }],
            320,
            delay,
          );
        });
      });
      const page = element.closest("main");
      timeline.animate(
        page?.querySelector(".treasury-ledger > div:nth-child(2) strong"),
        [{ opacity: 0 }, { opacity: 1 }],
        300,
        900,
      );
      timeline.animate(
        page?.querySelector(".event-row"),
        [{ opacity: 0 }, { opacity: 1 }],
        300,
        900,
      );
    } else if (added.length) {
      added.forEach((node, i) => {
        timeline.draw(edge(node.id), 400, i * 80);
        timeline.pulse(edge(node.id), 400, i * 80);
        station(node.id).forEach((station) =>
          timeline.animate(
            station,
            [{ opacity: 0 }, { opacity: 1 }],
            300,
            400 + i * 80,
          ),
        );
      });
    } else if (preview) {
      timeline.draw(element.querySelector(".flat-impact"), motionTiming.impact);
    } else if (isTrace) {
      authorityPath(model, selected).forEach((node, i) => {
        timeline.draw(edge(node.id), 300, Math.max(0, i - 1) * 130);
        timeline.pulse(
          edge(node.id),
          300,
          Math.max(0, i - 1) * 130,
          false,
          capital ? "#36583d" : "#eee9da",
        );
        station(node.id).forEach((station) =>
          timeline.animate(
            station.querySelector(".authority-segment, .authority-dot"),
            [{ opacity: 0.5 }, { opacity: 1 }],
            220,
            i * 110,
          ),
        );
      });
    }
    if (isSelection && !failed.length) {
      station(selected).forEach((station) =>
        timeline.animate(
          station,
          [
            { translate: `${operatingMotion.travel}px 0`, opacity: 0.65 },
            { translate: "0px 0", opacity: 1 },
          ],
          operatingMotion.focus,
          0,
          operatingMotion.ease,
        ),
      );
      const inspector = element
        .closest("main")
        ?.querySelector(".capital-identity");
      timeline.animate(
        inspector,
        [
          { opacity: 0.5, translate: `0 ${operatingMotion.travel}px` },
          { opacity: 1, translate: "0 0" },
        ],
        operatingMotion.focus,
        operatingMotion.stagger,
      );
    }
    return timeline.cancel;
  }, [model, selected, trace, preview, cascade, grant, capital]);
  const { points } = operationalPoints(model, width);
  const column =
    (width - 64) / Math.max(4, ...model.nodes.map((n) => n.depth + 1));
  const nodeWidth = Math.min(214, column - 24);
  for (const node of model.nodes) {
    const point = points.get(node.id);
    if (point) {
      if (capital) {
        const peers = authorityLedger(model).filter(
          (n) => n.depth === node.depth,
        );
        point.x = 32 + node.depth * column;
        point.y = 52 + peers.findIndex((n) => n.id === node.id) * 148;
      } else point.y = 42 + node.depth * 106;
    }
  }
  const height = Math.max(
    capital ? 320 : 440,
    ...model.nodes.map((n) =>
      capital ? points.get(n.id)!.y + 120 : 42 + n.depth * 106 + 84,
    ),
  );
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
  // Follow each affected depth. A bounding rectangle can accidentally enclose
  // an unaffected sibling beside the selected ancestor.
  const impactRows = [...new Set(impacted.map((p) => p.y))]
    .sort((a, b) => a - b)
    .map((y) => ({
      y,
      left: Math.min(...impacted.filter((p) => p.y === y).map((p) => p.x)) - 30,
      right:
        Math.max(...impacted.filter((p) => p.y === y).map((p) => p.x)) +
        (capital ? nodeWidth + 12 : 195),
    }));
  let impactBoundary = "";
  if (impactRows.length) {
    const first = impactRows[0],
      last = impactRows[impactRows.length - 1];
    impactBoundary = `M${first.left} ${first.y - 28}H${first.right}`;
    for (const row of impactRows.slice(1))
      impactBoundary += `V${row.y - 30}H${row.right}`;
    impactBoundary += `V${last.y + (capital ? 112 : 74)}H${last.left}`;
    for (let i = impactRows.length - 1; i > 0; i--)
      impactBoundary += `V${impactRows[i].y - 30}H${impactRows[i - 1].left}`;
    impactBoundary += "Z";
  }
  return (
    <div
      className={`flat-authority authority-surface ${trace ? "tracing" : ""} ${capital ? "capital-structure" : ""}`}
      ref={surface}
    >
      <div className="flat-map authority-map" style={{ height }}>
        <svg
          className="flat-rails authority-channels"
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          {impacted.length > 0 && (
            <path className="flat-impact" pathLength="1" d={impactBoundary} />
          )}
          {visible.map((n) => {
            const parent = n.parent ? points.get(n.parent) : undefined,
              p = points.get(n.id);
            if (!parent || !p) return null;
            const direction = p.x >= parent.x ? 1 : -1;
            const bend = Math.min(6, Math.abs(p.x - parent.x) / 2);
            // Branch below the parent's financial/status rows, then meet the
            // child's segment. The midpoint crosses ACTIVE at this density.
            const middle = parent.y + 70;
            const route = capital
              ? `M${parent.x + nodeWidth} ${parent.y + 36}H${p.x - 12}V${p.y + 36}H${p.x}`
              : bend < 1
                ? `M${parent.x} ${parent.y + 22}V${p.y - 30}`
                : `M${parent.x} ${parent.y + 22}V${middle - bend}Q${parent.x} ${middle} ${parent.x + direction * bend} ${middle}H${p.x - direction * bend}Q${p.x} ${middle} ${p.x} ${middle + bend}V${p.y - 30}`;
            return (
              <path
                key={n.id}
                data-edge={n.id}
                pathLength="1"
                className={`flat-relation authority-link ${statusOf(model, n.id)} ${path.has(n.id) ? "on-path" : ""} ${affected.has(n.id) ? "preview-affected" : ""}`}
                d={route}
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
              style={{
                left: p.x,
                top: p.y,
                ...(capital ? { width: nodeWidth } : {}),
              }}
              aria-label={`Select ${n.name}`}
              aria-pressed={n.id === selected}
              onClick={() => onSelect(n.id)}
            >
              <svg
                className="authority-segment"
                viewBox="0 0 40 40"
                aria-hidden="true"
              >
                <path
                  d={
                    n.id === model.root
                      ? "M12 4H28Q36 4 36 12V17L32 20L36 23V28Q36 36 28 36H12Q4 36 4 28V23L8 20L4 17V12Q4 4 12 4Z"
                      : "M25 2A18 18 0 0 0 25 38L25 30A10 10 0 0 1 25 10Z"
                  }
                />
              </svg>
              <span className="flat-name">
                {n.name}
                <small>D{n.depth}</small>
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
      <div className="flat-mobile" aria-label="Nested authority ledger">
        {visible.map((n) => (
          <button
            key={n.id}
            data-mobile-node={n.id}
            onClick={() => onSelect(n.id)}
            aria-pressed={n.id === selected}
            className={`flat-ledger-node ${statusOf(model, n.id)} ${path.has(n.id) ? "on-path" : ""} ${affected.has(n.id) ? "preview-affected" : ""}`}
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
