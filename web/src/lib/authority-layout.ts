import { genesis, type AuthorityModel } from "./authority";
import { FIXTURE_LABELS } from "./solana/fixture-labels";

// Reuse the approved composition for the exact recorded fixture, while retaining
// real PDA identities for selection, transactions and ancestry validation.
// Names alone never qualify an arbitrary organization for this layout.
export function capitalInstrumentRoles(model: AuthorityModel) {
  const parents: Record<string, string | null> = {
    treasury: null,
    research: "treasury",
    operations: "treasury",
    data: "research",
    analysis: "research",
    scraper: "data",
  };
  const roles: Record<string, string> = {};
  const used = new Set<string>();
  for (const node of model.nodes) {
    const role = Object.prototype.hasOwnProperty.call(parents, node.id)
      ? node.id
      : FIXTURE_LABELS[node.id]?.toLowerCase();
    if (!role || used.has(role)) return undefined;
    roles[node.id] = role;
    used.add(role);
  }
  if (roles[model.root] !== "treasury") return undefined;
  if (
    model.nodes.some(
      (n) => (n.parent ? roles[n.parent] : null) !== parents[roles[n.id]],
    )
  )
    return undefined;
  return roles;
}

export const PLATE_HEIGHT = 86;
export const PLATE_WIDTH = 184;
export const ROOT_WIDTH = 240;
export const ROOT_HEIGHT = 100;
/** Keep each subtree contiguous in the flat mobile ledger, regardless of creation order. */
export function authorityLedger(model: AuthorityModel) {
  const ordered: AuthorityModel["nodes"] = [];
  const visited = new Set<string>();
  const visit = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    const node = model.nodes.find((n) => n.id === id);
    if (!node) return;
    ordered.push(node);
    model.nodes.filter((n) => n.parent === id).forEach((n) => visit(n.id));
  };
  visit(model.root);
  // Retain incomplete records for honest unknown-state presentation.
  model.nodes.forEach((n) => visit(n.id));
  return ordered;
}
export function authorityLayout(model: AuthorityModel, width: number) {
  const canonical = model.nodes.every((n) =>
    genesis().nodes.some((d) => d.id === n.id),
  );
  const points = new Map<string, { x: number; y: number }>();
  if (canonical) {
    for (const [id, x, depth] of [
      ["treasury", 0.55, 0],
      ["research", 0.355, 1],
      ["operations", 0.81, 1],
      ["data", 0.2, 2],
      ["analysis", 0.51, 2],
      ["scraper", 0.2, 3],
    ] as const)
      points.set(id, {
        x:
          width *
          (width < 600 && id === "operations"
            ? 0.84
            : width < 600 && id === "analysis"
              ? 0.48
              : x),
        y: 24 + depth * 132,
      });
  } else {
    let leaf = 0;
    const visited = new Set<string>();
    const visit = (id: string): number => {
      if (visited.has(id)) return leaf;
      visited.add(id);
      const node = model.nodes.find((n) => n.id === id)!;
      const xs = model.nodes
        .filter((n) => n.parent === id)
        .map((n) => visit(n.id));
      const x = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : leaf++;
      points.set(id, { x, y: 24 + node.depth * 132 });
      return x;
    };
    if (model.nodes.some((n) => n.id === model.root)) visit(model.root);
    for (const [id, p] of points)
      points.set(id, {
        x:
          leaf > 1
            ? 120 + (p.x * (Math.max(240, width) - 240)) / (leaf - 1)
            : width / 2,
        y: p.y,
      });
  }
  return {
    points,
    canonical,
    height: Math.max(530, ...model.nodes.map((n) => n.depth * 132 + 134)),
  };
}
