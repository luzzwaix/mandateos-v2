"use client";
import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import {
  ArrowUpRight,
  GitBranch,
  Send,
  Ban,
  ArrowDownToLine,
  ShieldCheck,
} from "lucide-react";
import { formatUnits, short, toBaseUnits } from "@/lib/solana/pdas";
import { effectiveStatus } from "./capital-tree";
import type { ConsoleState } from "@/lib/use-console";

export default function MandateInspector({ state }: { state: ConsoleState }) {
  const [action, setAction] = useState<
    "delegate" | "spend" | "deposit" | "reclaim"
  >("delegate");
  const [amount, setAmount] = useState("25");
  const [address, setAddress] = useState("");
  const { snapshot: s, node, demo, labels, busy, run, forSigner } = state;
  if (!s || !node)
    return (
      <aside className="inspector">
        <ShieldCheck size={24} />
        <h2>Bounded authority.</h2>
        <p>
          Select a mandate to inspect its capital and control its authority.
        </p>
      </aside>
    );
  const status = effectiveStatus(node, s);
  const unit = demo ? "USDC" : "TOKENS";
  const isRoot = node.account.depth === 0;
  const name =
    labels[node.publicKey.toBase58()] ??
    (isRoot ? "Treasury" : "Agent mandate");
  async function execute() {
    if (!s || !node) return;
    await run(
      `${action[0].toUpperCase()}${action.slice(1)} ${amount}`,
      async () => {
        const value = toBaseUnits(amount, s.decimals);
        const client = forSigner(
          action === "deposit" || action === "reclaim"
            ? s.organization.authority
            : node.account.controller,
        );
        if (action === "delegate") {
          const result = await client.delegate(
            s,
            node,
            new PublicKey(address),
            value,
          );
          return result.signature;
        }
        if (action === "spend")
          return client.spend(
            s,
            node,
            value,
            new PublicKey(address || demo?.destination.toBase58() || ""),
          );
        if (action === "deposit")
          return client.deposit(
            s,
            value,
            address ? new PublicKey(address) : undefined,
          );
        return client.reclaim(
          s,
          value,
          address ? new PublicKey(address) : undefined,
        );
      },
    );
  }
  return (
    <aside className="inspector">
      <div className="eyebrow">SELECTED MANDATE</div>
      <div className="inspector-title">
        <h2>{name}</h2>
        <span className={`status ${status}`}>{status}</span>
      </div>
      <p className="mono small">
        {short(node.publicKey)} <ArrowUpRight size={12} />
      </p>
      <dl className="details">
        <div>
          <dt>Controller</dt>
          <dd title={node.account.controller.toBase58()}>
            {short(node.account.controller)}
          </dd>
        </div>
        <div>
          <dt>Depth</dt>
          <dd>
            {node.account.depth} / {s.organization.maxDepth}
          </dd>
        </div>
        <div>
          <dt>Available</dt>
          <dd>
            {formatUnits(node.account.selfAvailable, s.decimals)} {unit}
          </dd>
        </div>
        <div>
          <dt>Subtree remaining</dt>
          <dd>
            {formatUnits(node.account.subtreeRemaining, s.decimals)} {unit}
          </dd>
        </div>
        <div>
          <dt>Direct spent</dt>
          <dd>
            {formatUnits(node.account.directSpent, s.decimals)} {unit}
          </dd>
        </div>
      </dl>
      {status === "blocked" ? (
        <div className="notice blocked">
          <Ban size={16} />
          <p>
            Authority blocked by a revoked ancestor. Stored balances are
            historical.
          </p>
        </div>
      ) : status === "revoked" ? (
        <div className="notice">
          <Ban size={16} />
          <p>This mandate cannot be reactivated.</p>
        </div>
      ) : (
        <>
          <div className="action-tabs">
            {(
              [
                "delegate",
                "spend",
                ...(isRoot ? ["deposit", "reclaim"] : []),
              ] as (typeof action)[]
            ).map((a) => (
              <button
                key={a}
                className={action === a ? "active" : ""}
                onClick={() => {
                  setAction(a);
                  setAddress("");
                }}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="action-form">
            <label>
              Amount <span>{unit}</span>
              <input
                aria-label="Action amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label>
              {action === "delegate"
                ? "Child controller public key"
                : action === "spend"
                  ? "Destination token account"
                  : action === "deposit"
                    ? "Source token account (optional ATA)"
                    : "Destination token account (optional ATA)"}
              <input
                aria-label="Action address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={
                  action === "spend" && demo
                    ? "Demo recipient token account"
                    : "Public address"
                }
              />
            </label>
            <button
              className="button full"
              disabled={!!busy || !state.wallet}
              onClick={() => void execute()}
            >
              {action === "delegate" ? (
                <GitBranch size={14} />
              ) : action === "spend" ? (
                <Send size={14} />
              ) : (
                <ArrowDownToLine size={14} />
              )}
              {action[0].toUpperCase() + action.slice(1)} capital
            </button>
          </div>
          {!isRoot && (
            <button
              className="button danger full"
              disabled={!!busy || !state.wallet}
              onClick={() =>
                void run("Revoke branch", () =>
                  forSigner(
                    state.wallet?.publicKey.equals(
                      s.nodes.find((n) =>
                        n.publicKey.equals(node.account.parent),
                      )?.account.controller ?? s.organization.authority,
                    )
                      ? state.wallet.publicKey
                      : s.organization.authority,
                  ).revoke(s, node),
                )
              }
            >
              <Ban size={14} /> Revoke branch
            </button>
          )}
        </>
      )}
      <div className="inspector-foot">
        <ShieldCheck size={14} />
        <span>Controllers sign. The treasury key stays private.</span>
      </div>
    </aside>
  );
}
