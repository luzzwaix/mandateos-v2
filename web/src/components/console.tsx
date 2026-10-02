"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { BN } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  ArrowUpRight,
  ArrowRight,
  Wallet,
  Layers3,
  GitBranch,
  Trophy,
  RefreshCw,
  ShieldX,
  Circle,
  LoaderCircle,
  Plus,
  X,
  Copy,
  Check,
} from "lucide-react";
import { useConsole } from "@/lib/use-console";
import {
  LOCAL_DEMO,
  NETWORK,
  PROGRAM_ADDRESS,
  RPC_URL,
  explorer,
} from "@/lib/solana/program";
import { formatUnits, short } from "@/lib/solana/pdas";
import CapitalTree from "./capital-tree";
import MandateInspector from "./mandate-inspector";
import Arena from "./arena";
import ActivityFeed from "./activity";

export default function Console() {
  const state = useConsole();
  const [tab, setTab] = useState<"capital" | "arena">("capital");
  const [walletMenu, setWalletMenu] = useState(false);
  const [loadAddress, setLoadAddress] = useState("");
  const [mint, setMint] = useState("");
  const [manage, setManage] = useState(false);
  const [copied, setCopied] = useState(false);
  const demoImport = useRef<HTMLInputElement>(null);
  async function importDemo(file: File) {
    try {
      const bytes = JSON.parse(await file.text()) as unknown;
      if (
        !Array.isArray(bytes) ||
        bytes.length !== 64 ||
        !bytes.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)
      )
        throw new Error(
          "Select the disposable 64-byte Solana keypair JSON printed by the local demo runner",
        );
      await state.initialize(Keypair.fromSecretKey(Uint8Array.from(bytes)));
    } catch (error) {
      await state.run("Import demo wallet", async () => {
        throw error;
      });
    }
  }
  const {
    snapshot: s,
    demo,
    busy,
    wallet,
    run,
    forSigner,
    node,
    labels,
    health,
  } = state;
  const root = s?.nodes.find((n) =>
    n.publicKey.equals(s.organization.rootMandate),
  );
  const amount = (value?: BN | bigint) =>
    value === undefined ? "—" : formatUnits(value, s?.decimals ?? 6);
  const reserved = root
    ? new BN(
        (
          BigInt(root.account.subtreeRemaining.toString()) -
          BigInt(root.account.selfAvailable.toString())
        ).toString(),
      )
    : undefined;
  const research =
    demo &&
    s?.nodes.find((n) => n.account.controller.equals(demo.research.publicKey));
  const scraper =
    demo &&
    s?.nodes.find((n) => n.account.controller.equals(demo.scraper.publicKey));
  const revoked = !!research?.account.status.revoked;
  async function cascade() {
    if (!s || !research) return;
    const reclaimed = formatUnits(
      research.account.subtreeRemaining,
      s.decimals,
    );
    await run("Revoking Research · waiting for confirmation", async () => {
      const signature = await forSigner(s.organization.authority).revoke(
        s,
        research,
      );
      state.setReleased(reclaimed);
      return signature;
    });
  }
  return (
    <main className="console-shell">
      {LOCAL_DEMO && (
        <input
          ref={demoImport}
          aria-label="Disposable local demo wallet"
          type="file"
          accept=".json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importDemo(file);
            e.target.value = "";
          }}
        />
      )}
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="MandateOS home">
          <span className="brand-mark">
            <Layers3 size={22} />
          </span>
          MANDATE<span>OS</span>
          <em>V2</em>
        </Link>
        <p>Don’t give agents wallets. Give them mandates.</p>
        <div className="header-controls">
          <span className="network">
            <i
              className={
                health.startsWith("LIVE") ? "dot active" : "dot blocked"
              }
            />
            {NETWORK}
          </span>
          <div className="wallet-wrap">
            <button
              className="button subtle"
              onClick={() => setWalletMenu(!walletMenu)}
            >
              <Wallet size={15} />
              {wallet
                ? demo
                  ? "Disposable demo wallet"
                  : short(wallet.publicKey)
                : "Connect wallet"}
            </button>
            {walletMenu && (
              <div className="wallet-menu">
                {wallet ? (
                  <>
                    <small>{wallet.publicKey.toBase58()}</small>
                    <button
                      onClick={() => {
                        void state.disconnect();
                        setWalletMenu(false);
                      }}
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        void state.connect("Phantom");
                        setWalletMenu(false);
                      }}
                    >
                      Connect Phantom <ArrowUpRight size={13} />
                    </button>
                    <button
                      onClick={() => {
                        void state.connect("Solflare");
                        setWalletMenu(false);
                      }}
                    >
                      Connect Solflare <ArrowUpRight size={13} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">
            CAPITAL CONTROL / ORGANIZATION CONSOLE
          </span>
          <h1>Authority has a hierarchy.</h1>
          <p>
            One treasury. Recursive budgets. A single transaction to cut the
            branch.
          </p>
        </div>
        <div className="workspace-actions">
          <button className="button subtle" onClick={() => setManage(!manage)}>
            <Plus size={14} /> Organizations
          </button>
          {LOCAL_DEMO && (
            <button
              className="button"
              disabled={!!busy}
              onClick={() => demoImport.current?.click()}
            >
              <GitBranch size={14} />
              {demo ? "Reset with fresh demo" : "Initialize local demo"}
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
      {manage && (
        <section className="organization-bar">
          <label>
            Open organization
            <input
              aria-label="Organization address"
              placeholder="Organization PDA"
              value={loadAddress}
              onChange={(e) => setLoadAddress(e.target.value)}
            />
          </label>
          <button
            className="button subtle"
            disabled={!!busy || !loadAddress}
            onClick={() =>
              void run("Load organization", async () => {
                new PublicKey(loadAddress);
                state.setOrganization(loadAddress);
                await state.refresh(loadAddress);
              })
            }
          >
            Open
          </button>
          <label>
            Create with SPL mint
            <input
              aria-label="Organization mint"
              value={mint}
              onChange={(e) => setMint(e.target.value)}
              placeholder="Classic SPL mint address"
            />
          </label>
          <button
            className="button"
            disabled={!!busy || !wallet || !mint}
            onClick={() =>
              void run("Create organization", async () => {
                const result = await state.client.createOrganization(
                  new PublicKey(mint),
                );
                state.setOrganization(result.organization.toBase58());
                await state.refresh(result.organization.toBase58());
                return result.signature;
              })
            }
          >
            Create organization
          </button>
          <button
            className="icon-button"
            aria-label="Close organization controls"
            onClick={() => setManage(false)}
          >
            <X size={16} />
          </button>
        </section>
      )}
      <section className="treasury-strip" aria-label="Treasury summary">
        {[
          { label: "TOTAL FUNDED", value: amount(s?.organization.totalFunded) },
          {
            label: "ROOT AVAILABLE",
            value: amount(root?.account.selfAvailable),
            hero: true,
          },
          { label: "RESERVED", value: amount(reserved) },
          { label: "SPENT", value: amount(s?.organization.totalSpent) },
          { label: "RECLAIMED", value: amount(s?.organization.totalReclaimed) },
        ].map((stat) => (
          <div
            className={`treasury-stat ${stat.hero ? "highlight" : ""} ${stat.hero && state.released ? "capital-returned" : ""}`}
            key={stat.label}
          >
            <span>{stat.label}</span>
            <strong key={stat.value}>
              {stat.value}
              <small>{demo ? "DEMO USDC" : "TOKENS"}</small>
            </strong>
            {stat.hero && state.released && (
              <em>+{state.released} returned to Root</em>
            )}
          </div>
        ))}
      </section>
      <div className="workspace-tabs">
        <div className="tabs">
          <button
            className={tab === "capital" ? "active" : ""}
            onClick={() => setTab("capital")}
          >
            <GitBranch size={15} /> Capital tree
          </button>
          <button
            className={tab === "arena" ? "active" : ""}
            onClick={() => setTab("arena")}
          >
            <Trophy size={15} /> Arena Lite{" "}
            {s && s.bounties.length > 0 && (
              <span className="tab-count">{s.bounties.length}</span>
            )}
          </button>
        </div>
        <div className="live-status">
          <span title={RPC_URL}>
            {health.startsWith("LIVE")
              ? health
              : "RPC / deployment unavailable"}
          </span>
          <button
            className="icon-button"
            aria-label="Refresh on-chain state"
            disabled={!!busy}
            onClick={() =>
              void run("Refresh chain state", () => state.refresh())
            }
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>
      {!health.startsWith("LIVE") && (
        <div className="rpc-notice">
          <Circle size={12} />
          <span>{health}</span>
          <small>
            RPC: {RPC_URL} · program {short(PROGRAM_ADDRESS)}
          </small>
        </div>
      )}
      {state.error && !state.rejection && (
        <div role="alert" className="error-banner">
          <ShieldX size={16} />
          {state.error}
        </div>
      )}
      {tab === "capital" ? (
        <div className="capital-layout">
          <section className="tree-section">
            <div className="section-line">
              <h2>Recursive capital authority</h2>
              <span>
                {s
                  ? `${s.nodes.length} MANDATES · MAX DEPTH ${s.organization.maxDepth}`
                  : "ONE SHARED SPL VAULT"}
              </span>
            </div>
            {s ? (
              <CapitalTree
                snapshot={s}
                labels={labels}
                selected={state.selected}
                onSelect={state.setSelected}
                unit={demo ? "USDC" : "TOKENS"}
              />
            ) : (
              <div className="empty-workspace">
                <div className="empty-tree">
                  <Layers3 size={26} />
                  <span />
                  <GitBranch size={23} />
                  <span />
                  <GitBranch size={23} />
                </div>
                <h2>
                  The treasury stays put.
                  <br />
                  Authority flows down.
                </h2>
                <p>
                  Open an organization or initialize a real local demo.
                  <br />
                  Every balance comes from the program’s accounts.
                </p>
                {LOCAL_DEMO && (
                  <button
                    className="button subtle"
                    disabled={!!busy}
                    onClick={() => demoImport.current?.click()}
                  >
                    Initialize local demo <ArrowRight size={14} />
                  </button>
                )}
              </div>
            )}
            {demo && (
              <div className={`cascade-bar ${revoked ? "completed" : ""}`}>
                <div>
                  <span className="eyebrow">CAPITAL CASCADE</span>
                  <strong>
                    {revoked
                      ? "Branch closed. Capital released."
                      : "Revoke Research. Cut the entire branch."}
                  </strong>
                  <p>
                    {revoked
                      ? "Data, Search and Scraper are blocked by lineage validation."
                      : "One transaction returns 390 unused demo USDC to Root."}
                  </p>
                </div>
                <div className="cascade-actions">
                  <button
                    className="button danger"
                    disabled={!!busy || revoked}
                    onClick={() => void cascade()}
                  >
                    {busy.includes("Revoking") ? (
                      <LoaderCircle size={14} className="spin" />
                    ) : (
                      <ShieldX size={14} />
                    )}
                    Revoke Research
                  </button>
                  <button
                    className="button subtle"
                    disabled={!!busy || !revoked}
                    onClick={() => {
                      if (s && scraper)
                        void run("Attempt descendant payment", () =>
                          forSigner(scraper.account.controller).spend(
                            s,
                            scraper,
                            new BN("1000000"),
                            demo.destination,
                          ),
                        );
                    }}
                  >
                    Attempt descendant payment <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            )}
            {state.rejection && (
              <div role="alert" className="rejection-proof">
                <ShieldX size={23} />
                <div>
                  <span className="eyebrow">PAYMENT REJECTED</span>
                  <h3>
                    {state.rejection.code === "AncestorRevoked"
                      ? "Ancestor mandate revoked"
                      : state.rejection.message}
                  </h3>
                  <p>
                    Real transaction attempted. The protocol rejected spending
                    authority.
                  </p>
                  <a
                    href={explorer(state.rejection.signature)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Failed transaction {short(state.rejection.signature)}{" "}
                    <ArrowUpRight size={12} />
                  </a>
                  <details>
                    <summary>Protocol logs</summary>
                    <pre>{state.rejection.logs.join("\n")}</pre>
                  </details>
                </div>
              </div>
            )}
          </section>
          <MandateInspector
            key={node?.publicKey.toBase58() ?? "empty"}
            state={state}
          />
        </div>
      ) : (
        <Arena state={state} />
      )}
      <ActivityFeed activity={state.activity} busy={busy} />
      <footer>
        <span>
          <Layers3 size={13} /> MANDATEOS / COLOSSEUM MVP
        </span>
        {s ? (
          <button
            className="copy-address"
            onClick={() => {
              void navigator.clipboard
                .writeText(s.address.toBase58())
                .then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />} Org{" "}
            {short(s.address)}
          </button>
        ) : (
          <span>Program {short(PROGRAM_ADDRESS)}</span>
        )}
        <span>
          {demo
            ? "Disposable keys stay in this browser tab"
            : "Direct wallet → Solana"}{" "}
          · trusted Arena verifier
        </span>
      </footer>
    </main>
  );
}
