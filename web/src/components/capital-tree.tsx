"use client";
import {
  GitBranch,
  ShieldCheck,
  Ban,
  LockKeyhole,
  ArrowDownRight,
} from "lucide-react";
import { formatUnits, short } from "@/lib/solana/pdas";
import type { ChainRow, MandateAccount, Snapshot } from "@/lib/solana/types";

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
}: {
  snapshot: Snapshot;
  labels: Record<string, string>;
  selected: string;
  onSelect: (id: string) => void;
  unit?: string;
}) {
  function render(node: ChainRow<MandateAccount>) {
    const id = node.publicKey.toBase58();
    const state = effectiveStatus(node, snapshot);
    const children = snapshot.nodes
      .filter((n) => n.account.parent.equals(node.publicKey))
      .sort((a, b) => a.account.childIndex.cmp(b.account.childIndex));
    const name =
      labels[id] ??
      (node.account.depth === 0
        ? "Treasury"
        : `Agent ${short(node.account.controller)}`);
    return (
      <li key={id} className={`tree-branch ${state}`}>
        <button
          aria-label={`Select ${name}`}
          aria-pressed={id === selected}
          className={`tree-node ${id === selected ? "selected" : ""}`}
          onClick={() => onSelect(id)}
        >
          <div className="node-top">
            <span className="node-icon">
              {node.account.depth === 0 ? (
                <ShieldCheck size={19} />
              ) : state === "blocked" ? (
                <LockKeyhole size={17} />
              ) : state === "revoked" ? (
                <Ban size={17} />
              ) : (
                <GitBranch size={17} />
              )}
            </span>
            <span className="node-identity">
              <strong>{name}</strong>
              <small>
                {node.account.depth === 0
                  ? "ROOT / SHARED VAULT"
                  : `DEPTH ${node.account.depth} · ${short(node.account.controller)}`}
              </small>
            </span>
            <span className={`status ${state}`}>{state}</span>
          </div>
          <div className="node-capital">
            <div>
              <small>SELF AVAILABLE</small>
              <strong>
                {formatUnits(node.account.selfAvailable, snapshot.decimals)}{" "}
                <span>{unit}</span>
              </strong>
            </div>
            <div>
              <small>SUBTREE REMAINING</small>
              <strong>
                {formatUnits(node.account.subtreeRemaining, snapshot.decimals)}{" "}
                <span>{unit}</span>
              </strong>
            </div>
          </div>
          {state === "blocked" && (
            <div className="blocked-note">
              <LockKeyhole size={11} /> Ancestor revoked · historical balances
            </div>
          )}
        </button>
        {children.length > 0 && <ul>{children.map(render)}</ul>}
      </li>
    );
  }
  const root = snapshot.nodes.find((n) =>
    n.publicKey.equals(snapshot.organization.rootMandate),
  );
  return (
    <div className="tree-canvas">
      <div className="canvas-hint">
        <ArrowDownRight size={14} /> Capital stays in one vault. Authority flows
        through the tree.
      </div>
      <ul className="capital-tree">{root && render(root)}</ul>
      <div className="tree-legend">
        <span>
          <i className="dot active" /> Active authority
        </span>
        <span>
          <i className="dot revoked" /> Revoked mandate
        </span>
        <span>
          <i className="dot blocked" /> Blocked descendant
        </span>
      </div>
    </div>
  );
}
