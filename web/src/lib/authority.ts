import type { Snapshot } from "./solana/types";

export type AuthorityStatus = "active" | "revoked" | "blocked" | "unknown";
export interface AuthorityNode {
  id: string;
  name: string;
  parent: string | null;
  depth: number;
  local: "active" | "revoked";
  available: bigint;
  remaining: bigint;
  budget: bigint;
  spent: bigint;
  controller?: string;
}
export interface AuthorityModel {
  nodes: AuthorityNode[];
  root: string;
  decimals: number;
  unit: string;
  vault: bigint;
  spent: bigint;
  reclaimed: bigint;
  reserved: bigint;
}
const units = (value: number) => BigInt(value) * 1_000_000n;
export function genesis(count = 6): AuthorityModel {
  const definitions = [
    ["treasury", "Treasury", null, 0, 1590, 1590],
    ["research", "Research", "treasury", 1, 390, 390],
    ["operations", "Operations", "treasury", 1, 200, 200],
    ["data", "Data", "research", 2, 90, 90],
    ["analysis", "Analysis", "research", 2, 50, 50],
    ["scraper", "Scraper", "data", 3, 30, 30],
  ] as const;
  const nodes: AuthorityNode[] = definitions
    .slice(0, count)
    .map(([id, name, parent, depth, available, remaining]) => ({
      id,
      name,
      parent,
      depth,
      local: "active",
      available: units(available),
      remaining: units(remaining),
      budget: units(remaining),
      spent: 0n,
    }));
  for (const child of nodes) {
    const parent = nodes.find((n) => n.id === child.parent);
    if (parent) parent.available -= child.remaining;
  }
  return {
    nodes,
    root: "treasury",
    decimals: 6,
    unit: "USDC",
    vault: units(1590),
    spent: 0n,
    reclaimed: 0n,
    reserved: 0n,
  };
}
export function fromSnapshot(
  snapshot: Snapshot,
  labels: Record<string, string>,
): AuthorityModel {
  return {
    root: snapshot.organization.rootMandate.toBase58(),
    decimals: snapshot.decimals,
    unit: "TOKENS",
    vault: snapshot.vaultBalance,
    spent: BigInt(snapshot.organization.totalSpent.toString()),
    reclaimed: BigInt(snapshot.organization.totalReclaimed.toString()),
    reserved: snapshot.bounties
      .filter((b) => b.account.status.open)
      .reduce((sum, b) => sum + BigInt(b.account.reward.toString()), 0n),
    nodes: snapshot.nodes.map(({ publicKey, account: a }) => ({
      id: publicKey.toBase58(),
      name:
        labels[publicKey.toBase58()] ??
        (a.depth === 0
          ? "Treasury"
          : `Mandate ${a.childIndex.toString()} · D${a.depth}`),
      parent: a.depth === 0 ? null : a.parent.toBase58(),
      depth: a.depth,
      local: a.status.revoked ? "revoked" : "active",
      available: BigInt(a.selfAvailable.toString()),
      remaining: BigInt(a.subtreeRemaining.toString()),
      budget: BigInt(a.initialBudget.toString()),
      spent: BigInt(a.directSpent.toString()),
      controller: a.controller.toBase58(),
    })),
  };
}
export function authorityPath(
  model: AuthorityModel,
  id: string,
): AuthorityNode[] {
  const chain: AuthorityNode[] = [],
    seen = new Set<string>();
  let node = model.nodes.find((n) => n.id === id);
  while (node && !seen.has(node.id)) {
    seen.add(node.id);
    chain.unshift(node);
    if (!node.parent) break;
    node = model.nodes.find((n) => n.id === node!.parent);
  }
  return chain;
}
export function statusOf(model: AuthorityModel, id: string): AuthorityStatus {
  const node = model.nodes.find((n) => n.id === id);
  if (!node) return "unknown";
  if (node.local === "revoked") return "revoked";
  const path = authorityPath(model, id);
  if (
    path[0]?.id !== model.root ||
    path.length !== node.depth + 1 ||
    path.some((n, i) => n.depth !== i)
  )
    return "unknown";
  return path.some((n) => n.local === "revoked") ? "blocked" : "active";
}
export function descendantsOf(
  model: AuthorityModel,
  id: string,
): AuthorityNode[] {
  return model.nodes.filter(
    (n) =>
      n.id !== id &&
      authorityPath(model, n.id).some((ancestor) => ancestor.id === id),
  );
}
export function impactFingerprint(model: AuthorityModel, id: string): string {
  const node = model.nodes.find((n) => n.id === id);
  return JSON.stringify(
    [node, ...descendantsOf(model, id)].map(
      (n) =>
        n && [
          n.id,
          n.parent,
          n.depth,
          n.local,
          n.controller,
          n.available.toString(),
          n.remaining.toString(),
        ],
    ),
  );
}
export function fundDemoMission(
  model: AuthorityModel,
  value: bigint,
): AuthorityModel {
  const root = model.nodes.find((n) => n.id === model.root);
  if (
    !root ||
    statusOf(model, root.id) !== "active" ||
    value <= 0n ||
    value > root.available
  )
    throw new Error("Mission funding exceeds Root available capital.");
  return {
    ...model,
    reserved: model.reserved + value,
    nodes: model.nodes.map((n) =>
      n.id === root.id ? { ...n, available: n.available - value } : n,
    ),
  };
}
export function settleDemoMission(
  model: AuthorityModel,
  value: bigint,
): AuthorityModel {
  if (value <= 0n || value > model.reserved || value > model.vault)
    throw new Error("Settlement exceeds reserved capital.");
  return {
    ...model,
    reserved: model.reserved - value,
    vault: model.vault - value,
    spent: model.spent + value,
    nodes: model.nodes.map((n) =>
      n.id === model.root
        ? { ...n, remaining: n.remaining - value, spent: n.spent + value }
        : n,
    ),
  };
}
export function revokeDemo(model: AuthorityModel, id: string): AuthorityModel {
  const target = model.nodes.find((n) => n.id === id);
  if (!target?.parent || statusOf(model, id) !== "active")
    throw new Error("Only an active non-Root branch can be revoked.");
  return {
    ...model,
    nodes: model.nodes.map((n) =>
      n.id === id
        ? { ...n, local: "revoked", available: 0n, remaining: 0n }
        : n.id === target.parent
          ? { ...n, available: n.available + target.remaining }
          : n,
    ),
  };
}
export function spendDemo(
  model: AuthorityModel,
  id: string,
  amount: bigint,
  reclaim = false,
): AuthorityModel {
  const node = model.nodes.find((n) => n.id === id);
  if (!node || statusOf(model, id) !== "active")
    throw new Error("Execution rejected by invalid authority path.");
  if (amount <= 0n || amount > node.available || (reclaim && id !== model.root))
    throw new Error("Amount exceeds available authority or is not positive.");
  const path = new Set(authorityPath(model, id).map((n) => n.id));
  return {
    ...model,
    vault: model.vault - amount,
    spent: model.spent + (reclaim ? 0n : amount),
    reclaimed: model.reclaimed + (reclaim ? amount : 0n),
    nodes: model.nodes.map((n) => ({
      ...n,
      available: n.available - (n.id === id ? amount : 0n),
      remaining: n.remaining - (path.has(n.id) ? amount : 0n),
      spent: n.spent + (n.id === id && !reclaim ? amount : 0n),
    })),
  };
}
export function amount(value: bigint, decimals = 6): string {
  const scale = 10n ** BigInt(decimals),
    whole = value / scale;
  const fraction = (value % scale)
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");
  return `${whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction.padEnd(2, "0")}`;
}
