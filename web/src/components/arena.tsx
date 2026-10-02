"use client";
import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import {
  Trophy,
  Fingerprint,
  ArrowUpRight,
  Plus,
  Check,
  Send,
} from "lucide-react";
import { formatUnits, short, toBaseUnits } from "@/lib/solana/pdas";
import type { ConsoleState } from "@/lib/use-console";

export default function Arena({ state }: { state: ConsoleState }) {
  const [reward, setReward] = useState("25");
  const [verifier, setVerifier] = useState("");
  const [result, setResult] = useState(
    "Research report: agent infrastructure landscape, sources and evaluation.",
  );
  const { snapshot: s, demo, busy, wallet, run, forSigner } = state;
  if (!s)
    return (
      <section className="arena-empty">
        <Trophy size={32} />
        <h2>Capital becomes coordinated work.</h2>
        <p>
          Open an organization to create funded tasks and settle a winner
          on-chain.
        </p>
      </section>
    );
  return (
    <section className="arena-workspace">
      <div className="arena-header">
        <div>
          <span className="eyebrow">ARENA LITE</span>
          <h2>
            Fund work. Verify results.
            <br />
            <span>Pay one winner.</span>
          </h2>
        </div>
        <p>
          Rewards stay reserved in the shared vault.
          <br />
          The configured verifier is a trusted signer.
        </p>
      </div>
      <div className="bounty-create">
        <div>
          <strong>Create a funded bounty</strong>
          <small>Reward is reserved from Root available capital.</small>
        </div>
        <label>
          Reward{" "}
          <input
            aria-label="Bounty reward"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label>
          Verifier{" "}
          <input
            aria-label="Bounty verifier"
            value={verifier}
            onChange={(e) => setVerifier(e.target.value)}
            placeholder={short(s.organization.authority)}
          />
        </label>
        <button
          className="button"
          disabled={!wallet || !!busy}
          onClick={() =>
            void run(
              "Create funded bounty",
              async () =>
                (
                  await forSigner(s.organization.authority).createBounty(
                    s,
                    toBaseUnits(reward, s.decimals),
                    verifier
                      ? new PublicKey(verifier)
                      : s.organization.authority,
                  )
                ).signature,
            )
          }
        >
          <Plus size={14} /> Create bounty
        </button>
      </div>
      {s.bounties.length === 0 && (
        <div className="empty-bounty">
          <Fingerprint size={30} />
          <h3>No funded tasks yet</h3>
          <p>
            Create the demo bounty for 25 demo USDC. Submit two commitments,
            then select a winner.
          </p>
        </div>
      )}
      {s.bounties.map((b) => {
        const settled = !!b.account.status.settled;
        const submissions = s.submissions.filter((sub) =>
          sub.account.bounty.equals(b.publicKey),
        );
        return (
          <article key={b.publicKey.toBase58()} className="bounty">
            <div className="bounty-title">
              <div>
                <span className="eyebrow">BOUNTY {short(b.publicKey)}</span>
                <h3>Map the autonomous agent landscape</h3>
              </div>
              <span className={`status ${settled ? "active" : "open"}`}>
                {settled ? "Settled" : "Open"}
              </span>
              <div className="bounty-reward">
                <strong>{formatUnits(b.account.reward, s.decimals)}</strong>
                <small>{demo ? "DEMO USDC" : "TOKEN"} REWARD</small>
              </div>
            </div>
            <div className="bounty-meta">
              <span>
                Verifier{" "}
                <b title={b.account.verifier.toBase58()}>
                  {short(b.account.verifier)}
                </b>
              </span>
              <span>
                Commitments <b>{b.account.submissionCount}</b>
              </span>
              <span>
                Settlement <b>{settled ? "Final" : "Pending verification"}</b>
              </span>
            </div>
            {!settled && (
              <div className="submission-input">
                <label>
                  Result to commit{" "}
                  <input
                    aria-label={`Result for ${short(b.publicKey)}`}
                    value={result}
                    onChange={(e) => setResult(e.target.value)}
                  />
                </label>
                <small>Only its SHA-256 hash is stored on-chain.</small>
                <div className="submission-actions">
                  {demo ? (
                    <>
                      {["research", "search"].map((role) => (
                        <button
                          key={role}
                          className="button subtle"
                          disabled={
                            !!busy ||
                            submissions.some((sub) =>
                              sub.account.agent.equals(
                                demo[role as "research" | "search"].publicKey,
                              ),
                            )
                          }
                          onClick={() =>
                            void run(`Submit ${role} commitment`, () =>
                              forSigner(
                                demo[role as "research" | "search"].publicKey,
                              ).submitResult(b.publicKey, `${role}: ${result}`),
                            )
                          }
                        >
                          <Send size={13} /> Submit {role} result
                        </button>
                      ))}
                    </>
                  ) : (
                    <button
                      className="button subtle"
                      disabled={
                        !!busy ||
                        !wallet ||
                        submissions.some((sub) =>
                          sub.account.agent.equals(wallet.publicKey),
                        )
                      }
                      onClick={() =>
                        void run("Submit result commitment", () =>
                          state.client.submitResult(b.publicKey, result),
                        )
                      }
                    >
                      <Send size={13} /> Submit result
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="submission-list">
              {submissions.map((sub, i) => {
                const winner =
                  settled && b.account.winner.equals(sub.account.agent);
                const identity =
                  demo && sub.account.agent.equals(demo.research.publicKey)
                    ? "Research agent"
                    : demo && sub.account.agent.equals(demo.search.publicKey)
                      ? "Search agent"
                      : short(sub.account.agent);
                const hash = sub.account.resultHash
                  .map((byte) => byte.toString(16).padStart(2, "0"))
                  .join("");
                return (
                  <div
                    className={`submission ${winner ? "winner" : ""}`}
                    key={sub.publicKey.toBase58()}
                  >
                    <span className="submission-rank">
                      {winner ? <Trophy size={17} /> : `0${i + 1}`}
                    </span>
                    <div>
                      <strong>{identity}</strong>
                      <small title={hash}>SHA-256 {hash.slice(0, 16)}…</small>
                    </div>
                    {winner ? (
                      <span className="winner-label">
                        <Check size={14} /> Winner · paid{" "}
                        {formatUnits(b.account.reward, s.decimals)}{" "}
                        {demo ? "USDC" : "TOKENS"}
                      </span>
                    ) : (
                      !settled && (
                        <button
                          className="button tiny"
                          disabled={!!busy || !wallet}
                          onClick={() =>
                            void run("Settle bounty and pay winner", () =>
                              forSigner(b.account.verifier).settleBounty(
                                s,
                                b.publicKey,
                                sub,
                              ),
                            )
                          }
                        >
                          Select winner <ArrowUpRight size={13} />
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
            {settled && (
              <div className="settlement-proof">
                <Trophy size={16} />
                <span>
                  Winner: {short(b.account.winner)} · reward paid from the
                  shared vault · settlement final
                </span>
              </div>
            )}
          </article>
        );
      })}
      <p className="arena-footnote">
        Arena participants prove control of their signing key. Bounty
        verification is trusted; commitments do not prove useful work.
      </p>
    </section>
  );
}
