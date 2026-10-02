"use client";
import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { formatUnits, short } from "@/lib/solana/pdas";
import type {
  CapitalTransition,
  ChainRow,
  MandateAccount,
  Snapshot,
} from "@/lib/solana/types";
import CapitalNumber from "./capital-number";

function CapitalPulse({
  path,
  delay = 0.08,
}: {
  path: string;
  delay?: number;
}) {
  const motion = useRef<SVGAnimateMotionElement>(null);
  useEffect(() => {
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
      motion.current?.beginElementAt(delay);
  }, [path, delay]);
  return (
    <circle r="3" className="capital-pulse">
      <animateMotion
        ref={motion}
        path={path}
        dur="0.6s"
        begin="indefinite"
        fill="freeze"
      />
    </circle>
  );
}

export function effectiveStatus(
  node: ChainRow<MandateAccount>,
  snapshot: Snapshot,
): "active" | "revoked" | "blocked" {
  if (node.account.status.revoked) return "revoked";
  let current = node;
  for (let depth = node.account.depth; depth > 0; depth--) {
    const parent = snapshot.nodes.find((n) =>
      n.publicKey.equals(current.account.parent),
    );
    if (!parent || parent.account.status.revoked) return "blocked";
    current = parent;
  }
  return "active";
}

export default function CapitalTree({
  snapshot,
  labels,
  selected,
  onSelect,
  unit = "TOKENS",
  transition,
  entrance = false,
}: {
  snapshot: Snapshot;
  labels: Record<string, string>;
  selected: string;
  onSelect: (id: string) => void;
  unit?: string;
  transition?: CapitalTransition;
  entrance?: boolean;
}) {
  const elements = useRef(new Map<string, HTMLButtonElement>());
  const previousPositions = useRef(new Map<string, { x: number; y: number }>());
  const root = snapshot.nodes.find((n) =>
    n.publicKey.equals(snapshot.organization.rootMandate),
  );
  const positions = new Map<string, { x: number; y: number }>();
  let leaf = 0;
  const visit = (node: ChainRow<MandateAccount>): number => {
    const children = snapshot.nodes
      .filter((n) => n.account.parent.equals(node.publicKey))
      .sort((a, b) => a.account.childIndex.cmp(b.account.childIndex));
    const childY = children.map(visit);
    const y = children.length
      ? childY.reduce((a, b) => a + b, 0) / children.length
      : 76 + leaf++ * 120;
    positions.set(node.publicKey.toBase58(), {
      x: 24 + node.account.depth * 220,
      y,
    });
    return y;
  };
  if (root) visit(root);
  const depth = Math.max(...snapshot.nodes.map((n) => n.account.depth), 0);
  const width = 220 * depth + 226;
  const height = Math.max(232, leaf * 120 + 16);
  const target = snapshot.nodes.find(
    (n) => n.publicKey.toBase58() === transition?.target,
  );
  const spendingPath = new Set<string>();
  if (transition?.kind === "spend" && target) {
    let current = target;
    for (let d = current.account.depth; d > 0; d--) {
      spendingPath.add(current.publicKey.toBase58());
      const parent = snapshot.nodes.find((n) =>
        n.publicKey.equals(current.account.parent),
      );
      if (!parent) break;
      current = parent;
    }
  }
  useLayoutEffect(() => {
    if (
      transition?.kind === "delegate" &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      for (const [id, next] of positions) {
        const old = previousPositions.current.get(id);
        const element = elements.current.get(id);
        if (old && element && (old.x !== next.x || old.y !== next.y))
          element.animate(
            [
              {
                transform: `translate(${old.x - next.x}px, ${old.y - next.y}px)`,
              },
              { transform: "none" },
            ],
            { duration: 350, easing: "cubic-bezier(.16,1,.3,1)" },
          );
      }
    }
    previousPositions.current = positions;
  });
  return (
    <div className={`tree-canvas ${entrance ? "tree-enter" : ""}`}>
      <div className="depth-guide" style={{ minWidth: width, width }}>
        {Array.from({ length: depth + 1 }, (_, d) => (
          <span key={d} style={{ left: 24 + d * 220 }}>
            {d === 0
              ? "ORGANIZATION"
              : `AUTHORITY / ${String(d).padStart(2, "0")}`}
          </span>
        ))}
      </div>
      <div
        className="authority-graph"
        style={{ minWidth: width, width, height }}
        aria-label="Recursive capital hierarchy"
      >
        <svg
          className="capital-connectors"
          width={width}
          height={height}
          aria-hidden="true"
        >
          <defs>
            <marker
              id="capital-arrow"
              markerWidth="5"
              markerHeight="5"
              refX="4"
              refY="2.5"
              orient="auto"
            >
              <path d="M0,0 L5,2.5 L0,5" fill="currentColor" />
            </marker>
          </defs>
          {transition?.signature &&
            root &&
            (transition.kind === "reclaim" ||
              (transition.kind === "spend" &&
                transition.target === root.publicKey.toBase58())) &&
            positions.get(root.publicKey.toBase58()) && (
              <CapitalPulse
                key={transition.key}
                path={`M ${positions.get(root.publicKey.toBase58())!.x} ${positions.get(root.publicKey.toBase58())!.y} H 4`}
              />
            )}
          {snapshot.nodes
            .filter((n) => n.account.depth > 0)
            .map((n) => {
              const id = n.publicKey.toBase58(),
                point = positions.get(id),
                parent = positions.get(n.account.parent.toBase58());
              if (!point || !parent) return null;
              const path = `M ${parent.x + 178} ${parent.y} H ${parent.x + 199} V ${point.y} H ${point.x - 4}`;
              const status = effectiveStatus(n, snapshot);
              const moving = transition?.target === id || spendingPath.has(id);
              const pulsePath =
                transition?.kind === "revoke"
                  ? `M ${point.x - 4} ${point.y} H ${parent.x + 199} V ${parent.y} H ${parent.x + 178}`
                  : path;
              const cascadeDelay = Math.min(
                440,
                Math.max(0, n.account.depth - (target?.account.depth ?? 0)) *
                  120,
              );
              return (
                <g key={id}>
                  <path
                    d={path}
                    className={`connector ${status} ${transition?.kind === "revoke" && transition.descendants.includes(id) ? "connector-collapse" : ""} ${transition?.kind === "delegate" && transition.target === id ? "connector-split" : ""}`}
                    pathLength="100"
                    style={{ animationDelay: `${cascadeDelay}ms` }}
                    markerEnd="url(#capital-arrow)"
                  />
                  {moving && transition?.signature && (
                    <CapitalPulse
                      key={transition.key}
                      path={pulsePath}
                      delay={
                        transition.kind === "spend"
                          ? Math.min(
                              0.2,
                              Math.max(0, n.account.depth - 1) * 0.07,
                            )
                          : 0.08
                      }
                    />
                  )}
                </g>
              );
            })}
        </svg>
        {snapshot.nodes.map((node) => {
          const id = node.publicKey.toBase58(),
            position = positions.get(id);
          if (!position) return null;
          const status = effectiveStatus(node, snapshot),
            isRoot = node.account.depth === 0;
          const name =
            labels[id] ??
            (isRoot ? "Treasury" : `Agent ${short(node.account.controller)}`);
          const affected =
            transition?.kind === "revoke" &&
            (transition.target === id || transition.descendants.includes(id));
          return (
            <button
              key={id}
              ref={(element) => {
                if (element) elements.current.set(id, element);
                else elements.current.delete(id);
              }}
              aria-label={`Select ${name}`}
              aria-pressed={id === selected}
              className={`tree-node ${isRoot ? "root-node" : ""} ${status} ${id === selected ? "selected" : ""} ${affected ? "authority-collapsed" : ""} ${transition?.kind === "delegate" && transition.target === id ? "authority-created" : ""}`}
              style={
                {
                  left: position.x,
                  top: position.y - 54,
                  "--cascade-delay": `${Math.min(440, Math.max(0, node.account.depth - (target?.account.depth ?? 0)) * 120)}ms`,
                  "--assembly-delay": `${Math.min(120, node.account.depth * 40)}ms`,
                } as CSSProperties
              }
              onClick={() => onSelect(id)}
            >
              <div className="node-top">
                <strong>{name}</strong>
                <span
                  className={`status ${status}`}
                  title={
                    status === "blocked"
                      ? "This mandate cannot act because an ancestor was revoked."
                      : undefined
                  }
                >
                  {status}
                </span>
              </div>
              <div className="node-balance">
                <CapitalNumber
                  value={node.account.selfAvailable}
                  decimals={snapshot.decimals}
                />
                <span>{unit}</span>
              </div>
              <div
                className="node-context"
                title="Capital this mandate may spend or delegate."
              >
                {status === "active"
                  ? `Available to ${name}`
                  : status === "blocked"
                    ? "Historical balance · blocked"
                    : "Authority revoked"}
              </div>
              <div
                className="node-subtree"
                title="Unspent capital controlled by this mandate and its descendants."
              >
                <span>
                  {isRoot ? "Shared vault authority" : "Subtree remaining"}
                </span>
                <b>
                  {formatUnits(
                    node.account.subtreeRemaining,
                    snapshot.decimals,
                  )}
                </b>
              </div>
            </button>
          );
        })}
      </div>
      <div className="tree-legend">
        <span>
          <i className="dot active" />
          Active
        </span>
        <span>
          <i className="dot revoked" />
          Revoked
        </span>
        <span>
          <i className="dot blocked" />
          Blocked by ancestor
        </span>
        <span className="vault-note">
          <LockKeyhole size={12} /> One vault. No agent treasury keys.
        </span>
      </div>
    </div>
  );
}

/** A labelled explanation, never presented as observed accounts or balances. */
export function ConceptTree({ entrance = false }: { entrance?: boolean }) {
  return (
    <div
      className={`concept-tree ${entrance ? "tree-enter" : ""}`}
      aria-label="Illustrative capital authority diagram"
    >
      <div className="concept-scroll">
        <div className="concept-graph">
          <svg width="840" height="220" aria-hidden="true">
            <path d="M178 110H222 M400 110H421V58H442 M421 110V168H442 M620 58H664" />
          </svg>
          {[
            {
              name: "Treasury",
              detail: "One controlled vault",
              context: "Capital stays here",
              x: 0,
              y: 62,
            },
            {
              name: "Research",
              detail: "Bounded capital",
              context: "Spend or sub-delegate",
              x: 222,
              y: 62,
            },
            {
              name: "Data",
              detail: "Sub-delegated capital",
              context: "Bound by Research",
              x: 442,
              y: 10,
            },
            {
              name: "Search",
              detail: "Parallel agent",
              context: "Bound by Research",
              x: 442,
              y: 120,
            },
            {
              name: "Scraper",
              detail: "Recursive authority",
              context: "Bound by every ancestor",
              x: 664,
              y: 10,
            },
          ].map((item, i) => (
            <div
              key={item.name}
              className={`concept-node ${i === 0 ? "concept-root" : ""}`}
              style={
                {
                  left: item.x,
                  top: item.y,
                  "--assembly-delay": `${Math.min(120, i * 35)}ms`,
                } as CSSProperties
              }
            >
              <strong>{item.name}</strong>
              <span>{item.detail}</span>
              <small>{item.context}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="concept-revoke">
        <span>Revoke Research</span>
        <ArrowRight size={16} />
        <strong>Descendants lose authority. Unused capital returns.</strong>
      </div>
    </div>
  );
}
