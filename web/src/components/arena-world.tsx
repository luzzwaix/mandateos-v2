"use client";
import { useEffect, useRef, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { ArrowRight, RotateCcw } from "lucide-react";
import { amount, fundDemoMission, settleDemoMission } from "@/lib/authority";
import { short, toBaseUnits } from "@/lib/solana/pdas";
import { ConnectionInstrument, useWorld } from "./world-shell";
import { EvidenceLedger } from "./command-world";
import CapitalNumber from "./capital-number";
import { scopedTimeline } from "./authority-motion";
import { operatingMotion } from "./operating-motion";

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
  const previousScene = useRef({
    status,
    previewResult,
    candidate,
    mission: selected,
  });
  useEffect(() => {
    const before = previousScene.current;
    previousScene.current = {
      status,
      previewResult,
      candidate,
      mission: selected,
    };
    const element = executionField.current;
    if (
      !element ||
      (before.status === status &&
        before.previewResult === previewResult &&
        before.candidate === candidate &&
        before.mission === selected)
    )
      return;
    const timeline = scopedTimeline(
      element,
      settled ? "settlement" : previewResult ? "preview" : status,
      settled ? operatingMotion.settlement : operatingMotion.funding,
    );
    const routes = Array.from(element.querySelectorAll(".submission-channel"));
    if (status === "funded" && before.status !== status) {
      timeline.pulse(element.querySelector(".funding-channel"), 560);
      timeline.animate(
        element.querySelector(".mission-basin"),
        [
          { translate: `0 ${operatingMotion.travel}px`, opacity: 0.65 },
          { translate: "0 0", opacity: 1 },
        ],
        operatingMotion.focus,
        operatingMotion.stagger,
      );
      timeline.animate(
        element.querySelector(".mission-bounty"),
        [{ opacity: 0.45 }, { opacity: 1 }],
        260,
        450,
      );
    } else if (status === "submitted" && before.status !== status) {
      routes.forEach((route, i) => {
        timeline.draw(route, 440, i * 100);
        timeline.animate(
          element.querySelector(`[data-arena-label="lane-${i}"]`),
          [{ opacity: 0 }, { opacity: 1 }],
          220,
          i * 100,
        );
      });
      // Mobile has the same commitments and final information without SVG routes.
      Array.from(element.querySelectorAll(".contender")).forEach((lane, i) => {
        timeline.animate(
          lane,
          [
            { translate: `${operatingMotion.travel}px 0`, opacity: 0.6 },
            { translate: "0 0", opacity: 1 },
          ],
          operatingMotion.focus,
          i * operatingMotion.stagger,
        );
      });
    } else if (settled && before.status !== status) {
      timeline.animate(
        element.querySelector(".contender.winner"),
        [{ opacity: 0.5 }, { opacity: 1 }],
        220,
      );
      timeline.animate(
        element.querySelector(".verifier-gate > strong"),
        [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0)" }],
        220,
        280,
      );
      const chosen = routes.find((route) =>
        route.classList.contains("selected"),
      );
      timeline.draw(chosen, 280);
      timeline.pulse(chosen, 280);
      timeline.animate(
        element.querySelector(".gate-aperture i"),
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-9px)", offset: 0.5 },
          { transform: "translateX(0)" },
        ],
        300,
        160,
      );
      timeline.animate(
        element.querySelector(".gate-aperture i:last-child"),
        [
          { transform: "translateX(0)" },
          { transform: "translateX(9px)", offset: 0.5 },
          { transform: "translateX(0)" },
        ],
        300,
        160,
      );
      timeline.pulse(
        element.querySelector(".verifier-pass"),
        200,
        280,
        false,
        "#eee9da",
      );
      timeline.draw(element.querySelector(".verifier-pass"), 200, 280);

      timeline.pulse(
        element.querySelector(".settlement-channel"),
        260,
        480,
        false,
        "#eee9da",
      );
      timeline.draw(element.querySelector(".settlement-channel"), 260, 480);
      timeline.animate(
        element.querySelector(".mission-outcome"),
        [
          { opacity: 0, clipPath: "inset(0 0 100% 0)" },
          { opacity: 1, clipPath: "inset(0 0 0% 0)" },
        ],
        180,
        740,
      );
      timeline.animate(
        element.closest("main")?.querySelector(".event-row"),
        [{ opacity: 0 }, { opacity: 1 }],
        180,
        740,
      );
    } else if (previewResult && !settled) {
      timeline.pulse(
        routes[candidate.charCodeAt(0) - 65],
        operatingMotion.trace,
        0,
        false,
        "#d59b74",
      );
      timeline.animate(
        element.querySelector('.contender[aria-pressed="true"]'),
        [{ translate: `${-operatingMotion.travel}px 0` }, { translate: "0 0" }],
        operatingMotion.focus,
      );
    }
    return timeline.cancel;
  }, [status, previewResult, candidate, selected, settled]);
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
    <main
      className={`arena-world ${w.demo ? "demo-execution" : "account-backed"}`}
    >
      <section className="arena-heading">
        <div>
          <h1>
            Work resolves. <em>To capital.</em>
          </h1>
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
          <ol className="mission-lifecycle" aria-label="Mission lifecycle">
            <li data-complete={funded}>
              Mission <span>{funded ? "funded" : "awaiting funding"}</span>
            </li>
            <li data-complete={submitted}>
              Submissions{" "}
              <span>
                {submitted ? `${names.length} committed` : "awaiting results"}
              </span>
            </li>
            <li
              data-complete={settled}
              data-preview={previewResult && !settled}
            >
              Verifier{" "}
              <span>
                {settled
                  ? "selected winner"
                  : previewResult
                    ? "preview · unpaid"
                    : "awaiting selection"}
              </span>
            </li>
            <li data-complete={settled}>
              Settlement{" "}
              <span>
                {settled ? (w.demo ? "simulated" : "on-chain") : "not settled"}
              </span>
            </li>
          </ol>
          <div
            ref={executionField}
            className={`mission-stage ${status} ${settled ? "resolved" : ""} ${submitted && previewResult && !settled ? "verifier-preview" : ""}`}
            data-testid="mission-execution-field"
          >
            <svg
              className="mission-channels"
              viewBox="0 0 1000 500"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                className={`funding-channel ${funded ? "active" : ""}`}
                pathLength="1"
                d="M465 28V70"
              />
              {submitted &&
                names.map((name, i) => (
                  <path
                    key={name}
                    className={`submission-channel ${settled && name === winner ? "selected" : !settled && previewResult && i === candidate.charCodeAt(0) - 65 ? "preview-route" : ""}`}
                    d={`M245 ${147 + i * 88}H275Q295 ${147 + i * 88} 330 230H352V330H718V230H735`}
                    pathLength="1"
                  />
                ))}
              {settled && names.includes(winner) && (
                <path
                  className="verifier-pass"
                  pathLength="1"
                  d="M735 230H810"
                />
              )}
              {settled && (
                <path
                  className="settlement-channel active"
                  pathLength="1"
                  d="M810 230H895V277H860"
                />
              )}
            </svg>
            <div className="capital-source" data-arena-label="capital">
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
              {funded ? "FUNDED FROM ROOT" : "CAPITAL RESERVATION"}
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
                  data-arena-label={`lane-${i}`}
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
            <div className="mission-basin" data-arena-label="mission">
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
                    ? "Funded task"
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
              <div className="arena-actions">
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
                        Select a submission lane, then simulate verifier
                        selection and atomic payout.
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
                          disabled={
                            !hasOwner || !w.live.canTransact || !!w.live.busy
                          }
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
                              w.live.client.submitResult(
                                bounty.publicKey,
                                result,
                              ),
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
                                sub.account.agent.equals(
                                  w.live.wallet!.publicKey,
                                ),
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
                                .map((byte) =>
                                  byte.toString(16).padStart(2, "0"),
                                )
                                .join("")}
                            </small>
                            <button
                              className="button dark full"
                              disabled={
                                !hasVerifier ||
                                !w.live.canTransact ||
                                !!w.live.busy
                              }
                              onClick={() =>
                                void w.live.run(
                                  "Settle bounty and pay winner",
                                  () =>
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
                        Transactions disabled while deployment, account state,
                        or a previous transaction result remains unverified.
                      </p>
                    )}
                  </>
                )}
                {error && (
                  <p className="error-text" role="alert">
                    {error}
                  </p>
                )}
              </div>
            </div>
            <div className="verifier-gate" data-arena-label="verifier">
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
              <div className="mission-outcome" data-arena-label="outcome">
                <span>
                  {w.demo ? "SIMULATED ATOMIC RECEIPT" : "OBSERVED SETTLEMENT"}
                </span>
                <strong>{winner}</strong>
                <b>
                  {amount(value, w.model!.decimals)}{" "}
                  <small>{w.model?.unit}</small>
                </b>
                <small>Trusted verifier · atomic payout</small>
              </div>
            )}
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
          <EvidenceLedger compact />
        </section>
        <aside
          className={`bone-instrument arena-instrument ${settled ? "settled" : ""}`}
        >
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
          {settled && (
            <p className="settlement-provenance">
              {w.demo
                ? "Simulated settlement · no onchain transaction"
                : "Winner recorded in observed bounty account"}
            </p>
          )}
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
