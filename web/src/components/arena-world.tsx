"use client";
import { useEffect, useRef, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { amount, fundDemoMission, settleDemoMission } from "@/lib/authority";
import { short, toBaseUnits } from "@/lib/solana/pdas";
import { ConnectionInstrument, useWorld } from "./world-shell";
import { EvidenceLedger } from "./command-world";
import CapitalNumber from "./capital-number";

export default function ArenaWorld() {
  const w = useWorld();
  const [selected, setSelected] = useState(""),
    [candidate, setCandidate] = useState("B"),
    [reward, setReward] = useState("100"),
    [verifier, setVerifier] = useState(""),
    [result, setResult] = useState(""),
    [creating, setCreating] = useState(false),
    [error, setError] = useState("");
  const [previewResult, setPreviewResult] = useState(false);
  const executionField = useRef<HTMLDivElement>(null);
  const pulseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const s = w.live.snapshot,
    bounty =
      s?.bounties.find((b) => b.publicKey.toBase58() === selected) ??
      s?.bounties[0];
  const submissions =
    s?.submissions.filter((sub) =>
      sub.account.bounty.equals(bounty?.publicKey ?? PublicKey.default),
    ) ?? [];
  const status = w.demo
    ? w.mission
    : bounty?.account.status.settled
      ? "settled"
      : submissions.length
        ? "submitted"
        : bounty
          ? "funded"
          : "ready";
  const value = w.demo
    ? 100_000_000n
    : BigInt(bounty?.account.reward.toString() ?? "0");
  const winner = w.demo
    ? `Submission ${status === "settled" ? w.missionWinner : candidate}`
    : bounty?.account.status.settled
      ? short(bounty.account.winner)
      : "Awaiting verifier";
  const names = w.demo
    ? ["Submission A", "Submission B", "Submission C"]
    : submissions.map((sub) => short(sub.account.agent));
  const submitted = status === "submitted" || status === "settled",
    funded = status !== "ready",
    settled = status === "settled";
  const root = w.model?.nodes.find((n) => n.id === w.model?.root);
  const previousStatus = useRef(status);
  useEffect(() => {
    const before = previousStatus.current;
    previousStatus.current = status;
    clearTimeout(pulseTimer.current);
    if (
      before !== status &&
      !document.hidden &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const event =
        status === "funded"
          ? "fund"
          : status === "settled"
            ? "settle"
            : undefined;
      if (executionField.current && event)
        executionField.current.dataset.pulse = event;
      pulseTimer.current = setTimeout(
        () => {
          if (executionField.current)
            delete executionField.current.dataset.pulse;
        },
        event === "settle" ? 800 : 420,
      );
    } else if (executionField.current)
      delete executionField.current.dataset.pulse;
    return () => clearTimeout(pulseTimer.current);
  }, [status]);
  function choose(index: number) {
    setCandidate(String.fromCharCode(65 + index));
    setPreviewResult(true);
  }
  const hasOwner = !!(
    w.live.demo ||
    w.live.wallet?.publicKey.equals(
      s?.organization.authority ?? PublicKey.default,
    )
  );
  const hasVerifier = !!(
    w.live.demo ||
    w.live.wallet?.publicKey.equals(
      bounty?.account.verifier ?? PublicKey.default,
    )
  );
  async function advance() {
    setError("");
    if (!w.demo) return;
    try {
      const m = w.fixture,
        r = m.nodes.find((n) => n.id === m.root)!;
      if (status === "ready") {
        if (r.available < value)
          throw new Error(
            "Treasury needs 100 USDC available to reserve the mission.",
          );
        w.setFixture(fundDemoMission(m, value));
        w.setMission("funded");
        w.record(
          "Mission funded",
          "100.00 USDC reserved from Root available · demo",
        );
      } else if (status === "funded") {
        w.setMission("submitted");
        w.record(
          "Three submissions committed",
          "A · B · C → verifier gate · demo",
        );
      } else if (status === "submitted") {
        w.setFixture(settleDemoMission(m, value));
        w.setMissionWinner(candidate);
        w.setMission("settled");
        w.record(
          "Verifier selects and settles",
          `Submission ${candidate} · 100.00 USDC payout simulated`,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }
  async function create() {
    if (!s) return;
    await w.live.run(
      "Create funded bounty",
      async () =>
        (
          await w.live
            .forSigner(s.organization.authority)
            .createBounty(
              s,
              toBaseUnits(reward, s.decimals),
              verifier ? new PublicKey(verifier) : s.organization.authority,
            )
        ).signature,
    );
  }
  if (!w.demo && !s)
    return (
      <main className="unconnected-world">
        <div className="unconnected-field">
          <h1>Arena</h1>
          <p>
            Open an organization to inspect funded missions, submitted
            commitments, and verifier settlement.
          </p>
          <div className="empty-root">
            <span>MISSION / UNVERIFIED</span>
            <strong>No account state loaded</strong>
            <small>No settlement or payout assumed.</small>
          </div>
        </div>
        <aside className="bone-instrument">
          <ConnectionInstrument />
        </aside>
      </main>
    );
  return (
    <main className="arena-world">
      <section className="arena-heading">
        <div>
          <h1>Arena</h1>
          <span>
            {w.demo
              ? "MISSION M-001 · SIMULATED EXECUTION"
              : bounty
                ? `BOUNTY ${bounty.account.bountyId.toString()} · ${status.toUpperCase()}`
                : "NO FUNDED MISSIONS"}
          </span>
        </div>
        <p>
          Capital funds a mission.
          <br />
          Submissions converge at a trusted verifier.
          <br />
          One result receives settlement.
        </p>
        <button
          className="text-button"
          onClick={() => {
            if (w.demo) {
              w.reset();
              setPreviewResult(false);
              setError("");
            } else setCreating(!creating);
          }}
        >
          {w.demo ? <RotateCcw size={13} /> : null}
          {w.demo ? "Reset demo" : "Create bounty"}
        </button>
      </section>
      <div className="arena-zones">
        <section className="arena-field">
          <div className="mission-switcher">
            {w.demo ? (
              <span className="chosen">M-001 / Research brief</span>
            ) : (
              s?.bounties.map((b) => (
                <button
                  key={b.publicKey.toBase58()}
                  aria-pressed={bounty?.publicKey.equals(b.publicKey)}
                  onClick={() => setSelected(b.publicKey.toBase58())}
                >
                  Bounty {b.account.bountyId.toString()} ·{" "}
                  {b.account.status.settled ? "Settled" : "Open"}
                </button>
              ))
            )}
            <span>CAPITAL → MISSION ← SUBMISSIONS → VERIFIER</span>
          </div>
          <div
            ref={executionField}
            className={`mission-stage ${status} ${settled ? "resolved" : ""} ${submitted && previewResult && !settled ? "verifier-preview" : ""}`}
            data-testid="mission-execution-field"
          >
            <svg
              className="mission-channels"
              viewBox="0 0 1000 530"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <marker
                  id="mission-arrow"
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0 0L6 3L0 6" fill="context-stroke" />
                </marker>
              </defs>
              <path
                className={`funding-channel ${funded ? "active" : ""}`}
                d="M220 78H460Q480 78 480 98V142"
                markerEnd="url(#mission-arrow)"
              />
              {funded && (
                <path
                  className="financial-pulse funding-pulse"
                  d="M220 78H460Q480 78 480 98V142"
                  pathLength="1"
                />
              )}
              {submitted &&
                names.map((name, i) => (
                  <path
                    key={name}
                    className={`submission-channel ${settled && name === winner ? "selected" : !settled && previewResult && i === candidate.charCodeAt(0) - 65 ? "preview-route" : ""}`}
                    d={`M570 ${344 + i * 62}H${700 + i * 14}V260H780`}
                    pathLength="1"
                    markerEnd="url(#mission-arrow)"
                  />
                ))}
              {submitted && (
                <path
                  className={`verification-channel ${settled ? "active" : previewResult ? "preview-route" : ""}`}
                  d="M650 220H780"
                />
              )}
              {settled && (
                <path
                  className="settlement-channel active"
                  d="M830 260H945V342H780V358"
                  markerEnd="url(#mission-arrow)"
                />
              )}
              {settled && (
                <path
                  className="financial-pulse payout-pulse"
                  d="M830 260H945V342H780V358"
                  pathLength="1"
                />
              )}
            </svg>
            <div className="capital-source">
              <span>CAPITAL SOURCE</span>
              <strong>Treasury</strong>
              <b>
                {root ? (
                  <CapitalNumber
                    value={root.available}
                    decimals={w.model!.decimals}
                  />
                ) : (
                  "Unavailable"
                )}{" "}
                <small>{w.model?.unit}</small>
              </b>
              <small>
                ROOT AVAILABLE
                {w.demo ? " · DEMO" : ""}
              </small>
            </div>
            <span className="funding-track-label">
              {funded ? "FUNDED AUTHORITY" : "CAPITAL RESERVATION"}
              <b>
                {funded
                  ? `${amount(value, w.model!.decimals)} ${w.model?.unit}`
                  : "Awaiting funding"}
              </b>
            </span>
            <div className="contender-lanes">
              {(submitted ? names : ["Awaiting submissions"]).map((name, i) => (
                <button
                  key={name}
                  className={`contender ${settled && name === winner ? "winner" : ""} ${!submitted ? "empty" : ""}`}
                  disabled={!w.demo || !submitted || settled}
                  onClick={() => choose(i)}
                  aria-pressed={
                    w.demo &&
                    previewResult &&
                    candidate === String.fromCharCode(65 + i)
                  }
                >
                  <span>
                    {submitted ? String(i + 1).padStart(2, "0") : "—"}
                  </span>
                  <strong>{name}</strong>
                  <small>
                    {settled && name === winner
                      ? "SELECTED RESULT"
                      : submitted
                        ? previewResult && i === candidate.charCodeAt(0) - 65
                          ? "VERIFIER PREVIEW · UNPAID"
                          : "SUBMISSION COMMITMENT"
                        : "NOT YET SUBMITTED"}
                  </small>
                </button>
              ))}
            </div>
            <div className="mission-basin">
              <span>
                {w.demo
                  ? "MISSION M-001"
                  : bounty
                    ? `BOUNTY ${bounty.account.bountyId.toString()}`
                    : "MISSION"}
              </span>
              <h2>
                {w.demo
                  ? "Research brief"
                  : bounty
                    ? `Funded task ${bounty.account.bountyId.toString()}`
                    : "Awaiting funded work"}
              </h2>
              <span className="mission-status">
                {settled ? "SETTLED" : funded ? "FUNDED" : "NOT FUNDED"}
                {w.demo ? " · DEMO" : ""}
              </span>
              <div className="mission-bounty">
                <small>BOUNTY</small>
                <strong>
                  {funded
                    ? amount(value, w.model!.decimals)
                    : w.demo
                      ? "100.00"
                      : "Not configured"}{" "}
                  <small>{w.model?.unit}</small>
                </strong>
              </div>
            </div>
            <div className="verifier-gate">
              <span>VERIFIER</span>
              <div className="gate-aperture" aria-hidden="true">
                <i />
                <i />
              </div>
              <strong>
                {settled
                  ? `${winner} selected`
                  : submitted
                    ? previewResult
                      ? `Preview ${candidate}`
                      : "Decision required"
                    : "Awaiting entries"}
              </strong>
              <small>
                {w.demo
                  ? "DEMO VERIFIER"
                  : bounty
                    ? short(bounty.account.verifier)
                    : "TRUSTED SIGNER"}
              </small>
            </div>
            {settled && (
              <div className="mission-outcome">
                <span>
                  {w.demo ? "SIMULATED ATOMIC RECEIPT" : "OBSERVED SETTLEMENT"}
                </span>
                <strong>{winner}</strong>
                <b>
                  {amount(value, w.model!.decimals)}{" "}
                  <small>{w.model?.unit}</small>
                </b>
                <small>Verified + settled in one operation</small>
              </div>
            )}
          </div>
          <div className="mission-mobile">
            <div>
              <small>CAPITAL SOURCE</small>
              <strong>
                Treasury →{" "}
                {funded
                  ? `${amount(value, w.model!.decimals)} ${w.model?.unit}`
                  : "available authority"}
              </strong>
            </div>
            <div>
              <small>
                {w.demo
                  ? "MISSION M-001"
                  : bounty
                    ? `BOUNTY ${bounty.account.bountyId.toString()}`
                    : "NO FUNDED MISSION"}
              </small>
              <h2>{w.demo ? "Research brief" : "Funded task"}</h2>
              <span>
                {status.toUpperCase()}
                {w.demo ? " · SIMULATED" : ""}
              </span>
            </div>
            {submitted &&
              names.map((name, i) => (
                <button
                  key={name}
                  disabled={!w.demo || settled}
                  className={settled && name === winner ? "winner" : ""}
                  onClick={() => choose(i)}
                  aria-pressed={
                    previewResult && candidate === String.fromCharCode(65 + i)
                  }
                >
                  {name}
                  <small>
                    {settled && name === winner
                      ? "SELECTED / SETTLED"
                      : previewResult && i === candidate.charCodeAt(0) - 65
                        ? "PREVIEW · UNPAID"
                        : "SUBMISSION → VERIFIER"}
                  </small>
                </button>
              ))}
            <div>
              <small>VERIFIER GATE</small>
              <strong>
                {settled
                  ? `${winner} · verified + settled atomically`
                  : previewResult
                    ? `Preview ${candidate} · not paid`
                    : "Trusted verifier decides"}
              </strong>
            </div>
          </div>
          <div className="arena-method">
            <span>
              {settled ? "SETTLEMENT RESOLVED" : "EXECUTION SEQUENCE"}
            </span>
            <p>
              Funding reserves Root available capital. Submission hashes commit
              results. The trusted verifier selects a submitted winner and pays
              atomically from the shared vault.
            </p>
          </div>
          <EvidenceLedger />
        </section>
        <aside
          className={`bone-instrument arena-instrument ${settled ? "settled" : ""}`}
        >
          <div className="instrument-meta">
            <span>{settled ? "SETTLEMENT" : "MISSION INSTRUMENT"}</span>
            <span>{w.demo ? "DEMO" : status.toUpperCase()}</span>
          </div>
          <h2>
            {settled
              ? winner
              : w.demo
                ? "Research brief"
                : bounty
                  ? `Bounty ${bounty.account.bountyId.toString()}`
                  : "Create a funded mission"}
          </h2>
          <div className="instrument-capital">
            <span>{settled ? "PAYOUT" : "MISSION BOUNTY"}</span>
            <strong>
              {w.demo
                ? "100.00"
                : bounty
                  ? amount(value, w.model!.decimals)
                  : "Unavailable"}{" "}
              <small>{w.model?.unit}</small>
            </strong>
            <p>
              {settled
                ? w.demo
                  ? "Simulated settlement · no onchain transaction"
                  : "Winner recorded in observed bounty account"
                : funded
                  ? "Reserved from Root available"
                  : "Not yet reserved"}
            </p>
          </div>
          <ol className="settlement-checklist">
            {[
              ["Fund mission", funded],
              ["Submit commitments", submitted],
              ["Verifier selects result", settled],
              ["Settle winner payout", settled],
            ].map(([label, done], i) => (
              <li key={String(label)} className={done ? "done" : ""}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <strong>{label}</strong>
                {done ? <Check size={15} /> : <span className="pending-mark" />}
              </li>
            ))}
          </ol>
          {w.demo ? (
            <>
              <button
                className="button dark full"
                disabled={settled}
                onClick={() => void advance()}
              >
                {status === "ready"
                  ? "Fund demo mission"
                  : status === "funded"
                    ? "Submit 3 demo results"
                    : status === "submitted"
                      ? `Select ${candidate} & settle in demo`
                      : "Settlement complete"}
                <ArrowRight size={14} />
              </button>
              {status === "submitted" && (
                <p className="instrument-explainer">
                  Select a submission lane, then simulate verifier selection and
                  atomic payout.
                </p>
              )}
            </>
          ) : (
            <>
              {(!bounty || creating) && (
                <form
                  className="action-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void create();
                  }}
                >
                  <label>
                    Reward
                    <input
                      aria-label="Bounty reward"
                      inputMode="decimal"
                      value={reward}
                      onChange={(e) => setReward(e.target.value)}
                    />
                  </label>
                  <label>
                    Verifier address
                    <input
                      aria-label="Bounty verifier"
                      value={verifier}
                      onChange={(e) => setVerifier(e.target.value)}
                    />
                  </label>
                  <button
                    className="button dark full"
                    disabled={!hasOwner || !w.live.canTransact || !!w.live.busy}
                  >
                    Create funded bounty
                  </button>
                </form>
              )}
              {bounty && !settled && (
                <>
                  <form
                    className="action-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void w.live.run("Submit result commitment", () =>
                        w.live.client.submitResult(bounty.publicKey, result),
                      );
                    }}
                  >
                    <label>
                      Result to commit
                      <input
                        aria-label="Result commitment"
                        value={result}
                        onChange={(e) => setResult(e.target.value)}
                      />
                    </label>
                    <p>Only the SHA-256 commitment is stored.</p>
                    <button
                      className="button dark full"
                      disabled={
                        !w.live.wallet ||
                        !w.live.canTransact ||
                        !!w.live.busy ||
                        !result ||
                        submissions.some((sub) =>
                          sub.account.agent.equals(w.live.wallet!.publicKey),
                        )
                      }
                    >
                      Submit result
                    </button>
                  </form>
                  {submissions.map((sub) => (
                    <div
                      className="real-submission"
                      key={sub.publicKey.toBase58()}
                    >
                      <strong>{short(sub.account.agent)}</strong>
                      <small className="address">
                        SHA-256{" "}
                        {sub.account.resultHash
                          .map((byte) => byte.toString(16).padStart(2, "0"))
                          .join("")}
                      </small>
                      <button
                        className="button dark full"
                        disabled={
                          !hasVerifier || !w.live.canTransact || !!w.live.busy
                        }
                        onClick={() =>
                          void w.live.run("Settle bounty and pay winner", () =>
                            w.live
                              .forSigner(bounty.account.verifier)
                              .settleBounty(s!, bounty.publicKey, sub),
                          )
                        }
                      >
                        Select and settle winner
                      </button>
                    </div>
                  ))}
                </>
              )}
              {!w.live.canTransact && (
                <p className="eligibility-note">
                  Transactions disabled. The current Devnet deployment and IDL
                  are incompatible.
                </p>
              )}
            </>
          )}
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <dl className="details">
            <div>
              <dt>Capital source</dt>
              <dd>Root available</dd>
            </div>
            <div>
              <dt>Verifier</dt>
              <dd>
                {w.demo
                  ? "Simulated trusted signer"
                  : bounty
                    ? short(bounty.account.verifier)
                    : "Not configured"}
              </dd>
            </div>
            <div>
              <dt>Submissions</dt>
              <dd>
                {w.demo
                  ? submitted
                    ? 3
                    : 0
                  : (bounty?.account.submissionCount ?? 0)}
              </dd>
            </div>
            <div>
              <dt>Settlement</dt>
              <dd>{settled ? "Final" : "Awaiting verification"}</dd>
            </div>
          </dl>
          <div className="provenance-note">
            {w.demo
              ? "ALL AMOUNTS AND RESULTS ARE SIMULATED"
              : "Hash commitments do not establish correctness. The verifier is trusted."}
          </div>
        </aside>
      </div>
    </main>
  );
}
