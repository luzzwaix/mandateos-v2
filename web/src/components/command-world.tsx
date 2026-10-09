"use client";
import { useEffect, useRef, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { ArrowRight, RotateCcw, Search, X, ArrowUpRight } from "lucide-react";
import {
  amount,
  authorityPath,
  descendantsOf,
  revokeDemo,
  spendDemo,
  statusOf,
  fromSnapshot,
  impactFingerprint,
  type AuthorityNode,
} from "@/lib/authority";
import { short, toBaseUnits } from "@/lib/solana/pdas";
import { explorer, PROGRAM_ADDRESS, NETWORK } from "@/lib/solana/program";
import { FIXTURE_ORGANIZATION } from "@/lib/solana/fixture-labels";
import AuthorityTree from "./capital-authority-instrument";
import CapitalNumber from "./capital-number";
import { useWorld, ConnectionInstrument } from "./world-shell";
import { CopyAddress, useDetailContinuity } from "./experience-feedback";

export function EvidenceLedger({ compact = false }: { compact?: boolean }) {
  const w = useWorld();
  const [expanded, setExpanded] = useState(false);
  const evidence = useRef<HTMLElement>(null);
  const receiptIdentity = w.demo
    ? `demo:${w.events[0]?.title}:${w.events[0]?.detail}`
    : `devnet:${w.live.transaction.phase}:${w.live.transaction.signature ?? ""}`;
  useDetailContinuity(
    evidence,
    `${receiptIdentity}:${expanded}`,
    w.demo || expanded || w.live.transaction.phase !== "idle",
  );
  const events: {
    title: string;
    detail: string;
    status: string;
    signature?: string;
    logs?: string[];
    slot?: number;
    fee?: number;
  }[] = w.demo
    ? w.events
    : w.live.activity.map((e) => ({
        title: e.title,
        detail: e.detail,
        status: e.status.toUpperCase(),
        signature: e.signature,
        logs: e.logs,
        slot: e.slot,
        fee: e.fee,
      }));
  return (
    <section
      ref={evidence}
      className={`evidence-dock ${compact && !expanded ? "compact" : ""}`}
    >
      <div className="section-line">
        <h2>{w.demo ? "Event sequence" : "Transaction evidence"}</h2>
        <button
          className="text-button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Recent events" : `History (${events.length})`}
        </button>
      </div>
      {!w.demo && (
        <details>
          <summary>Network and account evidence</summary>
          <dl className="details">
            <div>
              <dt>Network</dt>
              <dd>
                {NETWORK} · {w.live.health}
              </dd>
            </div>
            <div>
              <dt>Program from source</dt>
              <dd className="address">{PROGRAM_ADDRESS}</dd>
            </div>
            {w.live.snapshot && (
              <>
                <div>
                  <dt>Organization PDA</dt>
                  <dd className="address">
                    {w.live.snapshot.address.toBase58()}
                  </dd>
                </div>
                <div>
                  <dt>Root PDA</dt>
                  <dd className="address">
                    {w.live.snapshot.organization.rootMandate.toBase58()}
                  </dd>
                </div>
                <div>
                  <dt>Shared vault</dt>
                  <dd className="address">
                    {w.live.snapshot.organization.vault.toBase58()}
                  </dd>
                </div>
                <div>
                  <dt>Devnet test mint</dt>
                  <dd className="address">
                    {w.live.snapshot.organization.mint.toBase58()}
                  </dd>
                </div>
                {w.live.snapshot.address.toBase58() ===
                  FIXTURE_ORGANIZATION && (
                  <div>
                    <dt>Mandate names</dt>
                    <dd>
                      Recorded fixture labels · accounts carry controller and
                      lineage
                    </dd>
                  </div>
                )}
                <div>
                  <dt>Account provenance</dt>
                  <dd>
                    {w.live.stale
                      ? "Stale · refresh required"
                      : "Read from Devnet after confirmed actions"}
                  </dd>
                </div>
              </>
            )}
          </dl>
          {w.live.snapshot && <ConnectionInstrument />}
        </details>
      )}
      {!w.demo && w.live.transaction.phase !== "idle" && (
        <div
          className={`transaction-state ${w.live.transaction.phase}`}
          role="status"
        >
          <strong>
            {w.live.transaction.outcome === "simulation-rejection"
              ? "RPC simulation rejection · not submitted"
              : w.live.transaction.outcome === "wallet-rejection"
                ? "Wallet signing rejected · not sent"
                : w.live.transaction.outcome === "on-chain-failure"
                  ? "Submitted on-chain failure"
                  : w.live.transaction.outcome === "client-rejection"
                    ? "Client rejection · not submitted"
                    : w.live.transaction.phase === "awaiting-signature"
                      ? "Approve in wallet"
                      : w.live.transaction.phase === "submitting"
                        ? "Submitting with preflight"
                        : w.live.transaction.phase === "pending"
                          ? "Pending confirmation"
                          : w.live.transaction.phase === "unknown"
                            ? "Confirmation unknown"
                            : w.live.transaction.phase}
          </strong>
          <span>{w.live.transaction.title}</span>
          {w.live.transaction.slot !== undefined && (
            <span>RPC slot {w.live.transaction.slot}</span>
          )}
          {w.live.transaction.message && <p>{w.live.transaction.message}</p>}
          {w.live.transaction.signature && (
            <a
              href={explorer(w.live.transaction.signature)}
              target="_blank"
              rel="noreferrer"
            >
              View transaction status <ArrowUpRight size={12} />
            </a>
          )}
        </div>
      )}
      <div className="event-table">
        <div className="event-head">
          <span>#</span>
          <span>EVENT / AUTHORITY PATH</span>
          <span>PROVENANCE</span>
        </div>
        {events.slice(0, expanded ? 30 : compact ? 1 : 3).map((e, i) => (
          <div className="event-row" key={`${e.title}-${i}`}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <strong>{e.title}</strong>
              <small>{e.detail}</small>
              {!w.demo && e.slot !== undefined && (
                <small>
                  Slot {e.slot}{" "}
                  {e.fee !== undefined ? `· fee ${e.fee} lamports` : ""}
                </small>
              )}
              {"logs" in e && e.logs && (
                <details>
                  <summary>Program logs</summary>
                  <pre>{e.logs.join("\n")}</pre>
                </details>
              )}
            </div>
            {"signature" in e && e.signature ? (
              <div className="receipt-provenance">
                <span>
                  {e.status === "REJECTED" ? "ON-CHAIN FAILURE" : "CONFIRMED"}
                </span>
                <a
                  href={explorer(e.signature)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${e.title}: ${e.status.toLowerCase()} Devnet transaction`}
                >
                  {short(e.signature)}
                  <ArrowUpRight size={12} />
                </a>
              </div>
            ) : (
              <span>{e.status}</span>
            )}
          </div>
        ))}
      </div>
      {events.length === 0 && (
        <p className="empty-copy">
          No observed transactions. Account reads do not imply execution.
        </p>
      )}
    </section>
  );
}
export default function CommandWorld() {
  const w = useWorld();
  const { model } = w;
  const [trace, setTrace] = useState(false),
    [query, setQuery] = useState(""),
    [preview, setPreview] = useState<string>(),
    [review, setReview] = useState(false),
    [proof, setProof] = useState(false),
    [revalidating, setRevalidating] = useState(false),
    [previewNotice, setPreviewNotice] = useState(""),
    [collapsed, setCollapsed] = useState<string[]>([]);
  const inspector = useRef<HTMLElement>(null),
    previewFingerprint = useRef("");
  const reviewToken = useRef(0);
  const previewFocus = useRef(false);
  const previewTrigger = useRef<HTMLButtonElement>(null);
  const node = model?.nodes.find((n) => n.id === w.selected) ?? model?.nodes[0];
  const root = model?.nodes.find((n) => n.id === model.root);
  const status = model && node ? statusOf(model, node.id) : "unknown";
  const detailGroup = useRef<HTMLDivElement>(null);
  useDetailContinuity(
    detailGroup,
    `${w.demo ? "demo" : "devnet"}:${node?.id}:${status}`,
    !preview,
  );
  const invalidAncestor =
    model && node
      ? authorityPath(model, node.id).find((n) => n.local === "revoked")
      : undefined;
  const controllerMismatch =
    !w.demo &&
    !!w.live.wallet &&
    !!node?.controller &&
    w.live.wallet.publicKey.toBase58() !== node.controller;
  const nodeRejection =
    !w.demo &&
    !!w.live.rejection &&
    w.live.transaction.title.endsWith(node?.id ?? "__no_node__");
  const historicalDenial = !w.demo
    ? w.live.activity.find(
        (receipt) =>
          receipt.mandate === node?.id &&
          receipt.status === "rejected" &&
          receipt.code === "AncestorRevoked",
      )
    : undefined;
  const lastNodeReceipt = !w.demo
    ? w.live.activity.find(
        (receipt) => receipt.mandate === node?.id && receipt.signature,
      )
    : undefined;
  const affected = model && preview ? descendantsOf(model, preview) : [];
  const target = model?.nodes.find((n) => n.id === preview);
  const canRevoke =
    w.demo ||
    !!(
      target &&
      w.live.wallet &&
      w.live.snapshot &&
      (w.live.wallet.publicKey.equals(w.live.snapshot.organization.authority) ||
        w.live.snapshot.nodes.some(
          (n) =>
            n.publicKey.toBase58() === target.parent &&
            n.account.controller.equals(w.live.wallet!.publicKey),
        ))
    );
  const fingerprint = target ? impactFingerprint(model!, target.id) : "";
  const unaffected =
    model?.nodes.filter(
      (n) =>
        n.depth === 1 &&
        n.id !== preview &&
        !affected.some((a) => a.id === n.id) &&
        statusOf(model, n.id) === "active",
    ) ?? [];
  useEffect(() => {
    if (!preview) return;
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        previewFocus.current = true;
        reviewToken.current++;
        setPreview(undefined);
        setReview(false);
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [preview]);
  useEffect(() => {
    if (!preview && previewFocus.current) {
      previewFocus.current = false;
      previewTrigger.current?.focus();
    }
  }, [preview]);
  function cancelPreview() {
    previewFocus.current = true;
    reviewToken.current++;
    setPreview(undefined);
    setReview(false);
  }
  function select(id: string) {
    reviewToken.current++;
    w.select(id);
    if (model?.nodes.find((node) => node.id === id)?.depth === 3)
      setTrace(true);
    if (model) {
      const path = new Set(authorityPath(model, id).map((n) => n.id));
      setCollapsed((old) => old.filter((id) => !path.has(id)));
    }
    setProof(false);
    setPreview(undefined);
    setReview(false);
  }
  function openPreview() {
    if (!node) return;
    reviewToken.current++;
    setPreview(node.id);
    setReview(false);
    setProof(false);
    setCollapsed([]);
    setPreviewNotice("");
  }
  async function revoke() {
    if (!model || !target) return;
    const token = reviewToken.current;
    if (previewFingerprint.current !== fingerprint) {
      setReview(false);
      return;
    }
    if (w.demo) {
      w.setFixture(revokeDemo(model, target.id));
      w.record(
        `Revoke ${target.name}`,
        `${affected.length} descendants effectively blocked · local records unchanged`,
      );
      w.record(
        "Parent capacity released",
        `${amount(target.remaining, model.decimals)} ${model.unit} → ${model.nodes.find((n) => n.id === target.parent)?.name} available · vault unchanged`,
      );
      w.setCascade((old) => old + 1);
      w.select(affected.find((n) => n.name === "Scraper")?.id ?? target.id);
      setTrace(true);
    } else {
      setRevalidating(true);
      try {
        await w.live.client.verifyDeployment();
        const s = await w.live.revalidate();
        if (token !== reviewToken.current) return;
        if (
          !s ||
          impactFingerprint(fromSnapshot(s, w.live.labels), target.id) !==
            previewFingerprint.current ||
          statusOf(fromSnapshot(s, w.live.labels), target.id) !== "active"
        ) {
          setReview(false);
          setPreviewNotice(
            "Account state changed. Review the updated impact before requesting a signature.",
          );
          return;
        }
        const n = s.nodes.find((n) => n.publicKey.toBase58() === target.id)!;
        const parent = s.nodes.find((p) =>
          p.publicKey.equals(n.account.parent),
        )!;
        await w.live.run(`Revoke ${target.name}`, () =>
          w.live
            .forSigner(
              w.live.wallet?.publicKey.equals(parent.account.controller)
                ? parent.account.controller
                : s.organization.authority,
            )
            .revoke(s, n),
        );
      } catch (error) {
        setReview(false);
        setPreviewNotice(
          error instanceof Error ? error.message : String(error),
        );
        return;
      } finally {
        setRevalidating(false);
      }
    }
    setPreview(undefined);
    setReview(false);
  }
  if (!model)
    return (
      <main className="unconnected-world">
        <div className="unconnected-field">
          <h1>Command</h1>
          <p>Read an organization&apos;s capital authority on Devnet. No wallet needed.</p>
          <div className="empty-root">
            <span>ROOT / UNVERIFIED</span>
            <strong>
              {w.live.error
                ? "Account read failed"
                : /^(Reading|Verifying)/.test(w.live.health)
                  ? "Reading account state"
                  : "Awaiting account state"}
            </strong>
            <small>No balances or authority assumed.</small>
          </div>
          <p>
            Devnet state is never replaced with a demo after an RPC failure.
          </p>
        </div>
        <aside className="bone-instrument">
          <ConnectionInstrument />
        </aside>
      </main>
    );
  return (
    <main className="command-world">
      <section className="treasury-ledger" aria-label="Treasury accounting">
        <div>
          <strong>Treasury</strong>
          <small>
            {w.demo ? "SIMULATED ACCOUNT STATE" : "VERIFIED ACCOUNT STATE"}
          </small>
        </div>
        <div>
          <small>ROOT AVAILABLE</small>
          <strong>
            {root ? (
              <CapitalNumber value={root.available} decimals={model.decimals} />
            ) : (
              "Unavailable"
            )}
            <span>{model.unit}</span>
          </strong>
        </div>
        <div>
          <small>SHARED VAULT</small>
          <strong>
            <CapitalNumber value={model.vault} decimals={model.decimals} />
            <span>{model.unit}</span>
          </strong>
        </div>
        <div>
          <small>MANDATES</small>
          <strong>
            {model.nodes.length}
            <span>
              MAX DEPTH {w.demo ? 4 : w.live.snapshot?.organization.maxDepth}
            </span>
          </strong>
        </div>
      </section>
      <div className="command-zones">
        <aside className={`hierarchy-rail ${query ? "searching" : ""}`}>
          <label className="search-field">
            <Search size={13} />
            <input
              aria-label="Find mandate"
              placeholder="Find mandate"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <span className="rail-label">AUTHORITY STRUCTURE</span>
          {model.nodes
            .filter((n) => n.name.toLowerCase().includes(query.toLowerCase()))
            .map((n) => (
              <button
                key={n.id}
                aria-pressed={w.selected === n.id}
                onClick={() => select(n.id)}
                style={{ paddingLeft: 12 + n.depth * 9 }}
              >
                <small>D{n.depth}</small>
                {n.name}
              </button>
            ))}
          <p>
            One vault.
            <br />
            {model.nodes.filter((n) => n.parent).length} authority relations.
            <br />
            No agent vaults.
          </p>
        </aside>
        <section className="command-field">
          <div className="graph-toolbar">
            <h1>
              Authority <em>structure.</em>
            </h1>
            <div>
              <button
                className="text-button mobile-inspect"
                onClick={() => {
                  inspector.current?.scrollIntoView({
                    behavior: matchMedia("(prefers-reduced-motion: reduce)")
                      .matches
                      ? "instant"
                      : "smooth",
                    block: "start",
                  });
                  inspector.current?.focus({ preventScroll: true });
                }}
              >
                Inspect {node?.name ?? "selected mandate"}
              </button>
              <button
                className="text-button"
                onClick={() => select(model.root)}
              >
                Focus Root
              </button>
              <button
                className={`text-button ${trace ? "chosen" : ""}`}
                aria-pressed={trace}
                onClick={() => setTrace(!trace)}
              >
                Authority Trace
              </button>
              <button
                className="text-button"
                disabled={
                  !node || !descendantsOf(model, node.id).length || !!preview
                }
                onClick={() =>
                  setCollapsed(
                    collapsed.includes(node!.id)
                      ? collapsed.filter((id) => id !== node!.id)
                      : [...collapsed, node!.id],
                  )
                }
              >
                {node && collapsed.includes(node.id)
                  ? "Expand branch"
                  : "Collapse branch"}
              </button>
            </div>
          </div>
          {!w.demo && (w.live.stale || w.live.error) && (
            <p className="workspace-alert" role="status">
              {w.live.stale
                ? "Account state is stale. Refresh before execution. "
                : ""}
              {w.live.error}
            </p>
          )}
          {!w.demo && /^(Reading|Verifying)/.test(w.live.health) && (
            <p className="refresh-notice" role="status">
              Refreshing accounts · current data stays visible.
            </p>
          )}
          <div className="selection-register" aria-live="polite">
            <div>
              <span>Inspecting</span>
              <strong>{node?.name}</strong>
              <b className={`status ${status}`}>{status}</b>
            </div>
            <p>
              {invalidAncestor
                ? `${invalidAncestor.name} revoked · dependent authority blocked`
                : "Complete lineage to Root"}
              <small>
                {node &&
                  authorityPath(model, node.id)
                    .map((n) => n.name)
                    .join(" → ")}
              </small>
            </p>
          </div>
          <AuthorityTree
            model={model}
            selected={node?.id ?? model.root}
            onSelect={select}
            preview={preview}
            trace={trace}
            cascade={
              w.demo
                ? w.cascade
                : w.live.transition?.kind === "revoke"
                  ? w.live.transition.key
                  : undefined
            }
            grant={
              w.live.transition?.kind === "delegate"
                ? w.live.transition.target
                : undefined
            }
            collapsed={collapsed}
          />
          <div className="ledger-freshness">
            <small>
              {w.demo
                ? "SIMULATED · NO TRANSACTIONS"
                : w.live.stale
                  ? "STALE · REFRESH REQUIRED"
                  : w.live.lastRead
                    ? `READ ${new Date(w.live.lastRead).toLocaleTimeString()}`
                    : "READ UNAVAILABLE"}
            </small>
            <button
              className="text-button"
              disabled={!!w.live.busy}
              onClick={() => {
                setPreview(undefined);
                setProof(false);
                if (w.demo) w.reset();
                else
                  void w.live.run("Refresh accounts", () => w.live.refresh());
              }}
            >
              <RotateCcw size={12} />
              {w.demo ? "Reset demo" : "Refresh"}
            </button>
          </div>
          {preview ? (
            <div className="impact-summary">
              <div>
                <span>PREVIEW · AUTHORITY UNCHANGED</span>
                <strong>{target?.name} → revoke</strong>
                <p>
                  {affected.map((n) => n.name).join(", ")} → would lose
                  effective authority
                </p>
              </div>
              <div>
                <strong>No transaction submitted.</strong>
                <p>
                  {unaffected.length
                    ? `${unaffected.map((n) => n.name).join(", ")} remains active.`
                    : "Other branches retain their current authority."}{" "}
                  Review before confirming.
                </p>
              </div>
            </div>
          ) : (
            <div className="accounting-note">
              <span>CAPITAL ACCOUNTING</span>
              <p>
                Delegation reserves capacity. Revoke releases it to the parent.
                Tokens stay in the shared vault until spend, reclaim, or
                settlement.
              </p>
            </div>
          )}
        </section>
        <aside
          ref={inspector}
          className={`bone-instrument ${preview ? "impact-instrument" : ""}`}
          aria-label="Mandate inspector"
          tabIndex={-1}
        >
          {target ? (
            <>
              <div className="instrument-meta">
                <span>IMPACT ANALYSIS</span>
                <button
                  className="icon-button"
                  aria-label="Cancel preview"
                  onClick={cancelPreview}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="impact-identity">
                <h2 className="impact-heading">Revoke {target.name}?</h2>
                <span className="preview-label">PREVIEW · NO TRANSACTION</span>
                <div className="instrument-capital">
                  <span>BRANCH REMAINING</span>
                  <strong>
                    {amount(target.remaining, model.decimals)}{" "}
                    <small>{model.unit}</small>
                  </strong>
                  <p>
                    {w.demo ? "Demo account model" : "Observed account"} ·
                    subtree_remaining
                  </p>
                </div>
              </div>
              <div className="impact-scope">
                <div className="impact-count">
                  <strong>1</strong>
                  <div>
                    <b>mandate will be revoked</b>
                    <p>{target.name} · locally active</p>
                  </div>
                </div>
                <div className="impact-count">
                  <strong>{affected.length}</strong>
                  <div>
                    <b>descendants lose effective authority</b>
                    <p>{affected.map((n) => n.name).join(" · ")}</p>
                  </div>
                </div>
                <dl className="details">
                  <div>
                    <dt>Released to</dt>
                    <dd>
                      {model.nodes.find((n) => n.id === target.parent)?.name}{" "}
                      available
                    </dd>
                  </div>
                  <div>
                    <dt>Token transfer</dt>
                    <dd>None on revoke</dd>
                  </div>
                  <div>
                    <dt>Unaffected</dt>
                    <dd>
                      {unaffected.length
                        ? unaffected.map((n) => n.name).join(", ") + " · active"
                        : "No active sibling identified"}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="impact-actions">
                <p className="instrument-explainer">
                  Only the selected mandate is locally revoked. Descendants
                  remain stored and fail ancestor validation.
                </p>
                {previewNotice && (
                  <p className="error-text" role="alert">
                    {previewNotice}
                  </p>
                )}
                {review ? (
                  <div className="revoke-review" role="status">
                    <strong>Review complete</strong>
                    <p>
                      {w.demo ? "Simulate" : "Request wallet approval for"} this
                      branch cut and release{" "}
                      {amount(target.remaining, model.decimals)} {model.unit} of
                      authority to the parent.
                    </p>
                    <button
                      className="button copper full"
                      disabled={
                        revalidating ||
                        !!w.live.busy ||
                        (!w.demo && (!canRevoke || !w.live.canTransact))
                      }
                      onClick={() => void revoke()}
                    >
                      {revalidating
                        ? "Revalidating accounts…"
                        : w.demo
                          ? "Confirm demo revoke"
                          : "Approve revoke in wallet"}
                      <ArrowRight size={16} />
                    </button>
                    {!w.demo && !canRevoke && (
                      <p>
                        Approval requires the parent controller or treasury
                        authority wallet.
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    className="button copper full"
                    onClick={() => {
                      previewFingerprint.current = fingerprint;
                      setReview(true);
                    }}
                  >
                    Review revoke <ArrowRight size={16} />
                  </button>
                )}
                <button
                  className="text-button cancel-button"
                  onClick={cancelPreview}
                >
                  Cancel preview
                </button>
              </div>
            </>
          ) : node ? (
            <>
              <div ref={detailGroup} className="capital-identity">
                <div className="instrument-meta">
                  <span>SELECTED MANDATE</span>
                  <span>D{node.depth}</span>
                </div>
                <div className="instrument-heading">
                  <h2>{node.name}</h2>
                  <span className={`status ${status}`}>{status}</span>
                </div>
                <div className="local-state">
                  LOCAL <b>{node.local.toUpperCase()}</b>
                  <span>
                    EFFECTIVE <b>{status.toUpperCase()}</b>
                  </span>
                </div>
                <dl className="details controller-identity">
                  <div>
                    <dt>ASSIGNEE / CONTROLLER</dt>
                    <dd className="address">
                      {node.controller ??
                        `${node.name} controller · illustrative demo`}
                    </dd>
                  </div>
                </dl>
                <div className="inspector-parent">
                  Parent{" "}
                  <b>
                    {model.nodes.find((n) => n.id === node.parent)?.name ??
                      "Organization authority"}
                  </b>
                </div>
                {controllerMismatch && (
                  <div className="controller-mismatch" role="status">
                    <strong>Execution authority: No</strong>
                    <dl>
                      <dt>Connected wallet</dt>
                      <dd>{w.live.wallet!.publicKey.toBase58()}</dd>
                      <dt>Required controller</dt>
                      <dd>{node.controller}</dd>
                    </dl>
                    <p>
                      This wallet is connected, but it is not the controller
                      authorized for this mandate.
                    </p>
                  </div>
                )}
                <div className="selected-authority-path">
                  <span>AUTHORITY PATH</span>
                  <p>
                    {authorityPath(model, node.id)
                      .map((n) => n.name)
                      .join(" → ")}
                  </p>
                  <small>
                    Earliest invalid ancestor{" "}
                    <b>
                      {authorityPath(model, node.id).find(
                        (n) => n.local === "revoked",
                      )?.name ?? (status === "unknown" ? "Unverified" : "None")}
                    </b>
                  </small>
                </div>
                {!w.demo && (
                  <CopyAddress
                    key={node.id}
                    address={node.id}
                    label={short(node.id)}
                  />
                )}
              </div>
              <div className="capital-finances">
                {
                  <>
                    <div className="instrument-capital">
                      <span>
                        {status === "blocked"
                          ? "STORED AVAILABLE · BLOCKED"
                          : "AVAILABLE"}
                      </span>
                      <strong>
                        <CapitalNumber
                          value={node.available}
                          decimals={model.decimals}
                        />{" "}
                        <small>{model.unit}</small>
                      </strong>
                    </div>
                    <dl className="details">
                      <div>
                        <dt>Subtree remaining</dt>
                        <dd>
                          {amount(node.remaining, model.decimals)} {model.unit}
                        </dd>
                      </div>
                    </dl>
                  </>
                }
              </div>
              <div className="capital-controls">
                {status === "blocked" ? (
                  <>
                    <div className="blocked-proof">
                      <X size={28} />
                      <div>
                        <h3>
                          {proof || nodeRejection || historicalDenial
                            ? "EXECUTION REJECTED"
                            : "AUTHORITY BLOCKED"}
                        </h3>
                        <p>
                          Blocked by revoked ancestor:{" "}
                          <b>
                            {
                              authorityPath(model, node.id).find(
                                (n) => n.local === "revoked",
                              )?.name
                            }
                          </b>
                        </p>
                        <small>
                          {w.demo
                            ? proof
                              ? "SIMULATED PROGRAM OUTCOME · NOT DEVNET EVIDENCE"
                              : "DERIVED DEMO STATE · LOCAL RECORD REMAINS ACTIVE"
                            : nodeRejection
                              ? w.live.transaction.outcome ===
                                "simulation-rejection"
                                ? `RPC PREFLIGHT REJECTION · NOT SENT · NO SIGNATURE · ${w.live.rejection?.code ?? "REJECTED"}`
                                : `ON-CHAIN PROGRAM RESULT · ${w.live.rejection?.code ?? "REJECTED"}`
                              : historicalDenial
                                ? `HISTORICAL ON-CHAIN FAILURE · ${historicalDenial.code} / ${historicalDenial.errorNumber}`
                                : "DERIVED FROM OBSERVED ACCOUNTS · NO EXECUTION ATTEMPTED"}
                        </small>
                        {historicalDenial?.signature && (
                          <div className="receipt-provenance">
                            <span>
                              {historicalDenial.confirmationStatus?.toUpperCase()}{" "}
                              · slot {historicalDenial.slot} · fee{" "}
                              {historicalDenial.fee} lamports
                            </span>
                            <a
                              href={explorer(historicalDenial.signature)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Recorded descendant denial{" "}
                              {short(historicalDenial.signature)}{" "}
                              <ArrowUpRight size={12} />
                            </a>
                            <small>
                              Historical receipt · not an action by this
                              connected wallet
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                    {w.demo ? (
                      <button
                        className="button dark full"
                        onClick={() => {
                          if (w.demo) {
                            setProof(true);
                            w.record(
                              "Descendant execution rejected",
                              `${node.name} blocked by revoked ancestor · simulated`,
                            );
                          }
                        }}
                      >
                        {" "}
                        {w.demo
                          ? "Attempt demo spend"
                          : "Review descendant spend"}
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      <ActionInstrument
                        key={node.id}
                        node={node}
                        blockedProof
                      />
                    )}
                    {!w.demo && (
                      <p>
                        A legitimate controller and destination token account
                        are required.
                      </p>
                    )}
                    <details className="accounting-consequences">
                      <summary>Accounting consequences</summary>
                      <dl className="details financial-impact">
                        <div>
                          <dt>Authority cut</dt>
                          <dd>
                            {w.demo ? "Confirmed in demo" : "Account revoked"}
                          </dd>
                        </div>
                        <div>
                          <dt>Capacity release</dt>
                          <dd>
                            {w.demo
                              ? "Parent available updated"
                              : "Inspect parent account"}
                          </dd>
                        </div>
                        <div>
                          <dt>Reclaim</dt>
                          <dd>Separate operation</dd>
                        </div>
                        <div>
                          <dt>Token movement</dt>
                          <dd>None from revoke</dd>
                        </div>
                      </dl>
                    </details>
                  </>
                ) : status === "revoked" ? (
                  <p className="instrument-explainer">
                    This mandate was locally revoked. Its zeroed capacity was
                    released to its parent. It cannot be reactivated.
                  </p>
                ) : status === "unknown" ? (
                  <p className="instrument-explainer">
                    The complete Root-to-mandate path could not be verified.
                    Refresh accounts before acting.
                  </p>
                ) : (
                  <ActionInstrument key={`${w.demo}-${node.id}`} node={node} />
                )}
                {status === "active" && node.parent && (
                  <button
                    className="button outline-copper full"
                    onClick={openPreview}
                    ref={previewTrigger}
                  >
                    Preview revoke <ArrowRight size={14} />
                  </button>
                )}
              </div>
              <div className="provenance-note">
                {w.demo
                  ? "SIMULATED STATE · NO ONCHAIN TRANSACTION"
                  : "Amounts from observed accounts. Refresh before execution."}
                {lastNodeReceipt?.signature && (
                  <p>
                    Historical {lastNodeReceipt.title.toLowerCase()} ·{" "}
                    {lastNodeReceipt.confirmationStatus ?? "confirmed"} · slot{" "}
                    {lastNodeReceipt.slot}
                    {lastNodeReceipt.amountBaseUnits &&
                      model &&
                      ` · ${lastNodeReceipt.status === "rejected" ? "requested" : "amount"} ${amount(BigInt(lastNodeReceipt.amountBaseUnits), model.decimals)} ${model.unit}`}
                    {" · "}
                    <a
                      href={explorer(lastNodeReceipt.signature)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Observed receipt <ArrowUpRight size={12} />
                    </a>
                  </p>
                )}
              </div>
            </>
          ) : null}
        </aside>
      </div>
      <div className="command-history">
        <EvidenceLedger compact />
      </div>
    </main>
  );
}
function ActionInstrument({
  node,
  blockedProof = false,
}: {
  node: AuthorityNode;
  blockedProof?: boolean;
}) {
  const w = useWorld();
  const [action, setAction] = useState<
      "delegate" | "spend" | "deposit" | "reclaim"
    >(blockedProof ? "spend" : "delegate"),
    [value, setValue] = useState("25"),
    [address, setAddress] = useState(""),
    [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const model = w.model!;
  const canSign =
    w.demo ||
    !!(
      w.live.demo ||
      w.live.wallet?.publicKey.toBase58() ===
        (action === "deposit" || action === "reclaim"
          ? w.live.snapshot?.organization.authority.toBase58()
          : node.controller)
    );
  const disabled =
    !w.demo && (!canSign || !w.live.canTransact || !!w.live.busy);
  const formSurface = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  useDetailContinuity(formSurface, `${open}:${action}:${error}`);
  function closeForm() {
    setOpen(false);
    setError("");
    trigger.current?.focus();
  }
  useEffect(() => {
    if (!open) return;
    formSurface.current
      ?.querySelector<HTMLInputElement>("input")
      ?.focus({ preventScroll: true });
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setError("");
        trigger.current?.focus();
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open, action]);
  async function execute() {
    setError("");
    try {
      const valueBN = toBaseUnits(value, model.decimals),
        n = BigInt(valueBN.toString());
      if (n <= 0n) throw new Error("Enter a positive amount.");
      if (action !== "deposit" && n > node.available)
        throw new Error(
          "Amount exceeds this mandate's observed available authority.",
        );
      if (w.demo) {
        if (action === "spend" || action === "reclaim") {
          w.setFixture(spendDemo(model, node.id, n, action === "reclaim"));
        } else if (action === "delegate") {
          if (node.depth >= 4 || n <= 0n || n > node.available)
            throw new Error(
              "Delegation exceeds available capacity or maximum depth 4.",
            );
          if (!address.trim())
            throw new Error("Enter a name for the simulated mandate.");
          const id = `demo-${Date.now()}`;
          w.setFixture({
            ...model,
            nodes: [
              ...model.nodes.map((p) =>
                p.id === node.id ? { ...p, available: p.available - n } : p,
              ),
              {
                id,
                name: address.trim(),
                parent: node.id,
                depth: node.depth + 1,
                local: "active",
                available: n,
                remaining: n,
                budget: n,
                spent: 0n,
              },
            ],
          });
        } else {
          w.setFixture({
            ...model,
            vault: model.vault + n,
            nodes: model.nodes.map((p) =>
              p.id === model.root
                ? {
                    ...p,
                    available: p.available + n,
                    remaining: p.remaining + n,
                    budget: p.budget + n,
                  }
                : p,
            ),
          });
        }
        w.record(
          `${action[0].toUpperCase() + action.slice(1)} ${amount(n, model.decimals)} ${model.unit}`,
          `${node.name} · simulated accounting`,
        );
        setOpen(false);
        return;
      }
      const s = w.live.snapshot!,
        chain = s.nodes.find((n) => n.publicKey.toBase58() === node.id)!;
      await w.live.run(`${action} ${value} · ${node.id}`, async () => {
        const client = w.live.forSigner(
          action === "deposit" || action === "reclaim"
            ? s.organization.authority
            : chain.account.controller,
        );
        if (action === "delegate")
          return (
            await client.delegate(s, chain, new PublicKey(address), valueBN)
          ).signature;
        if (action === "spend")
          return client.spend(
            s,
            chain,
            valueBN,
            new PublicKey(address || w.live.demo?.destination.toBase58() || ""),
          );
        if (action === "deposit")
          return client.deposit(
            s,
            valueBN,
            address ? new PublicKey(address) : undefined,
          );
        return client.reclaim(
          s,
          valueBN,
          address ? new PublicKey(address) : undefined,
        );
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }
  return (
    <div ref={formSurface} className="action-instrument">
      <div className="action-choices">
        {(
          [
            ...(blockedProof
              ? ["spend"]
              : [
                  "delegate",
                  "spend",
                  ...(node.parent ? [] : ["deposit", "reclaim"]),
                ]),
          ] as (typeof action)[]
        ).map((a) => (
          <button
            key={a}
            className={open && action === a ? "chosen" : ""}
            disabled={
              (a === "delegate" && node.depth >= 4) ||
              (!w.demo &&
                (!w.live.canTransact ||
                  !!w.live.busy ||
                  (!w.live.demo &&
                    w.live.wallet?.publicKey.toBase58() !==
                      (a === "deposit" || a === "reclaim"
                        ? w.live.snapshot?.organization.authority.toBase58()
                        : node.controller))))
            }
            onClick={(event) => {
              trigger.current = event.currentTarget;
              setAction(a);
              setOpen(true);
              setAddress("");
              setError("");
            }}
          >
            {a}
            <ArrowRight size={12} />
          </button>
        ))}
      </div>
      {open && (
        <form
          className="action-form"
          onSubmit={(e) => {
            e.preventDefault();
            void execute();
          }}
        >
          <label>
            Amount · {model.unit}
            <input
              aria-label="Action amount"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputMode="decimal"
            />
          </label>
          {action !== "reclaim" || !w.demo ? (
            <label>
              {w.demo
                ? action === "delegate"
                  ? "Demo mandate name"
                  : "Demo recipient (simulated)"
                : action === "delegate"
                  ? "Controller wallet address"
                  : action === "spend"
                    ? "Destination token account"
                    : "Token account (optional)"}
              <input
                aria-label="Action address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>
          ) : null}
          <p>
            {action === "delegate"
              ? "Reserves only this mandate's available capital."
              : action === "reclaim"
                ? "Transfers only Root available capital to the authority's token account."
                : action === "spend"
                  ? "Reduces remaining capital along the complete authority path."
                  : "Funds the shared SPL Token vault."}
          </p>
          <button className="button dark full" disabled={disabled}>
            {w.demo ? "Simulate" : "Review and sign"} {action}
            <ArrowRight size={14} />
          </button>
          <button type="button" className="text-button" onClick={closeForm}>
            Cancel
          </button>
        </form>
      )}
      {disabled && (
        <p className="eligibility-note">
          {!w.live.canTransact
            ? w.live.transaction.phase === "unknown"
              ? "Resolve the saved signature before another transaction."
              : w.live.stale
                ? "Account state is stale. Refresh before execution."
                : "Waiting for verified Devnet deployment and account reads."
            : !canSign
              ? "Connect the controller wallet for this action."
              : "An operation is pending."}
        </p>
      )}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
