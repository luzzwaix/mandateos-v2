import { PublicKey } from "@solana/web3.js";
import type { ChainRow, MandateAccount, Snapshot } from "./types";
import { childPda, rootPda } from "./pdas";
import { PROGRAM_ADDRESS } from "./program";

export interface AuthorityInspection {
  local: "active" | "revoked" | "unknown";
  effective: "active" | "revoked" | "blocked" | "unknown";
  /** Canonical order: Root to target. Empty when ancestry cannot be validated. */
  path: ChainRow<MandateAccount>[];
  blockingAncestor?: PublicKey;
  reason?: string;
}
const localStatus = (node: MandateAccount): AuthorityInspection["local"] =>
  node.status.active !== undefined && node.status.revoked === undefined
    ? "active"
    : node.status.revoked !== undefined && node.status.active === undefined
      ? "revoked"
      : "unknown";

/** Derive authority only from a complete, structurally valid account path. */
export function inspectAuthority(
  snapshot: Snapshot,
  target: PublicKey,
): AuthorityInspection {
  const rows = new Map(snapshot.nodes.map((n) => [n.publicKey.toBase58(), n]));
  const node = rows.get(target.toBase58());
  const local = node ? localStatus(node.account) : "unknown";
  const unknown = (reason: string): AuthorityInspection => ({
    local,
    effective: "unknown",
    path: [],
    reason,
  });
  if (!node) return unknown("Mandate account is missing");
  if (rows.size !== snapshot.nodes.length)
    return unknown("Duplicate mandate accounts");
  if (
    !Number.isInteger(snapshot.organization.maxDepth) ||
    snapshot.organization.maxDepth < 1 ||
    snapshot.organization.maxDepth > 4
  )
    return unknown("Invalid organization depth limit");
  if (
    !Number.isInteger(node.account.depth) ||
    node.account.depth < 0 ||
    node.account.depth > snapshot.organization.maxDepth
  )
    return unknown("Invalid target depth");
  const reverse: ChainRow<MandateAccount>[] = [];
  const programId = new PublicKey(PROGRAM_ADDRESS);
  let current = node;
  for (let depth = node.account.depth; depth >= 0; depth--) {
    if (
      !current.account.organization.equals(snapshot.address) ||
      current.account.depth !== depth
    )
      return unknown("Organization or depth mismatch in ancestry");
    if (localStatus(current.account) === "unknown")
      return unknown("Unknown stored mandate status");
    const canonical =
      depth === 0
        ? rootPda(programId, snapshot.address)
        : childPda(
            programId,
            snapshot.address,
            current.account.parent,
            current.account.childIndex,
          );
    if (!current.publicKey.equals(canonical))
      return unknown("Noncanonical mandate address");
    reverse.push(current);
    if (depth === 0) {
      if (
        !current.publicKey.equals(snapshot.organization.rootMandate) ||
        !current.account.parent.equals(PublicKey.default)
      )
        return unknown("Path does not terminate at a valid Root");
    } else {
      const parent = rows.get(current.account.parent.toBase58());
      if (!parent) return unknown("An ancestor account is missing");
      current = parent;
    }
  }
  const path = reverse.reverse();
  if (local === "revoked") return { local, effective: "revoked", path };
  const blocker = path
    .slice(0, -1)
    .find((row) => localStatus(row.account) === "revoked");
  return blocker
    ? { local, effective: "blocked", path, blockingAncestor: blocker.publicKey }
    : { local, effective: "active", path };
}
