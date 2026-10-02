"use client";
import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import {
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
        <h2>Control the branch.</h2>
        <p>Select a mandate to spend, delegate or revoke its authority.</p>
        <div className="inspector-empty-rule">
          <b>
            {state.canTransact
              ? "One treasury. Every agent bounded."
              : "Waiting for a verified Devnet deployment"}
          </b>
          <span>
            {state.canTransact
              ? "The selected controller signs each capital operation."
              : "A compatible public IDL is required before any capital operation."}
          </span>
        </div>
      </aside>
    );
  const status = effectiveStatus(node, s);
  const unit = demo ? "TEST TOKENS" : "TOKENS";
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
      <div className="inspector-title">
        <h2>{name}</h2>
        <span className={`status ${status}`}>{status}</span>
      </div>
      <p className="small inspector-address">
        Depth {node.account.depth} · {short(node.account.controller)}
      </p>
      <details className="inspector-history">
        <summary>Account details</summary>
        <dl className="details">
          <div>
            <dt>Signing wallet</dt>
            <dd title={node.account.controller.toBase58()}>
              {short(node.account.controller)}
            </dd>
          </div>
          {!isRoot && (
            <div>
              <dt>Allocated budget</dt>
              <dd>
                {formatUnits(node.account.initialBudget, s.decimals)} {unit}
              </dd>
            </div>
          )}
          <div>
            <dt>Direct spent</dt>
            <dd>
              {formatUnits(node.account.directSpent, s.decimals)} {unit}
            </dd>
          </div>
        </dl>
      </details>
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
                ? "Agent wallet address"
                : action === "spend"
                  ? "Destination token account"
                  : action === "deposit"
                    ? "Source token account (optional)"
                    : "Destination token account (optional)"}
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
              disabled={!!busy || !state.wallet || !state.canTransact}
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
              disabled={!!busy || !state.wallet || !state.canTransact}
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
