"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import CommandContinuity from "./command-continuity";
import DisclosureFeedback from "./experience-feedback";
import { ArrowRight, Wallet, X, ChevronDown } from "lucide-react";
import { useConsole } from "@/lib/use-console";
import { genesis, fromSnapshot, type AuthorityModel } from "@/lib/authority";
import { short } from "@/lib/solana/pdas";
import {
  NETWORK,
  PROGRAM_ADDRESS,
  RPC_URL,
  IDL_COMPATIBLE,
} from "@/lib/solana/program";

function useWorldState() {
  const pathname = usePathname();
  const [mode, setMode] = useState<"demo" | "devnet">("devnet");
  const demo = mode === "demo" || pathname === "/";
  const live = useConsole(!demo);
  const [fixture, setFixture] = useState<AuthorityModel>(() => genesis());
  const [selected, setSelected] = useState("research");
  const [events, setEvents] = useState<
    { title: string; detail: string; status: string }[]
  >([
    {
      title: "Authority established",
      detail: "Treasury → Research → Data → Scraper",
      status: "SIMULATED",
    },
    {
      title: "Sibling isolated",
      detail: "Treasury → Operations · independent branch",
      status: "SIMULATED",
    },
  ]);
  const [cascade, setCascade] = useState(0);
  const [mission, setMission] = useState<
    "ready" | "funded" | "submitted" | "settled"
  >("ready");
  const [missionWinner, setMissionWinner] = useState("B");
  const model = useMemo(
    () =>
      demo
        ? fixture
        : live.snapshot
          ? fromSnapshot(live.snapshot, live.labels)
          : undefined,
    [demo, fixture, live.snapshot, live.labels],
  );
  function record(title: string, detail: string) {
    setEvents((old) =>
      [{ title, detail, status: "SIMULATED" }, ...old].slice(0, 30),
    );
  }
  function reset() {
    setFixture(genesis());
    setSelected("research");
    setCascade(0);
    setMission("ready");
    setMissionWinner("B");
    setEvents([
      {
        title: "Demo reset",
        detail: "Balanced fixture restored · no transactions",
        status: "SIMULATED",
      },
    ]);
  }
  return {
    mode,
    setMode,
    demo,
    live,
    model,
    fixture,
    setFixture,
    selected: demo ? selected : live.selected,
    select: demo ? setSelected : live.setSelected,
    events,
    record,
    reset,
    cascade,
    setCascade,
    mission,
    setMission,
    missionWinner,
    setMissionWinner,
  };
}
type WorldState = ReturnType<typeof useWorldState>;
const WorldContext = createContext<WorldState | null>(null);
export function useWorld() {
  const state = useContext(WorldContext);
  if (!state) throw new Error("World provider missing");
  return state;
}
export function RootAnchor() {
  return (
    <svg
      className="root-anchor"
      width="28"
      height="28"
      viewBox="0 0 28 28"
      aria-hidden="true"
    >
      <path
        d="M3 4h18l4 4v13H3zM14 21v5M9 26h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M8 10h12M8 15h8" stroke="currentColor" />
    </svg>
  );
}
export default function WorldShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const world = useWorldState();
  const pathname = usePathname();
  const router = useRouter();
  const [walletOpen, setWalletOpen] = useState(false);
  const walletButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!walletOpen) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setWalletOpen(false);
        walletButton.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [walletOpen]);
  return (
    <WorldContext.Provider value={world}>
      <a href="#main" className="skip-link">
        Skip to workspace
      </a>
      <header className="world-header">
        <Link href="/" className="wordmark" aria-label="MandateOS Story">
          <RootAnchor />
          <span>MANDATEOS</span>
        </Link>
        <nav aria-label="Product navigation">
          {[
            ["/", "Story"],
            ["/app", "Command"],
            ["/arena", "Arena"],
          ].map(([href, label]) => (
            <Link
              href={href}
              key={href}
              aria-current={pathname === href ? "page" : undefined}
              onClick={(event) => {
                if (
                  pathname === "/" &&
                  href === "/app" &&
                  !event.metaKey &&
                  !event.ctrlKey &&
                  !event.shiftKey &&
                  !event.altKey
                ) {
                  event.preventDefault();
                  window.dispatchEvent(
                    new CustomEvent("mandateos:open-command", {
                      detail: { navigate: () => router.push("/app") },
                    }),
                  );
                }
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="shell-controls">
          <label className="mode-control">
            <span className="sr-only">Product mode</span>
            <select
              aria-label="Product mode"
              value={world.demo ? "demo" : "devnet"}
              disabled={pathname === "/" || !!world.live.busy}
              onChange={(e) => {
                world.setMode(e.target.value as "demo" | "devnet");
                setWalletOpen(false);
              }}
            >
              <option value="demo">DEMO MODE</option>
              <option value="devnet">DEVNET</option>
            </select>
            {pathname !== "/" && <ChevronDown size={12} />}
          </label>
          <button
            ref={walletButton}
            className="wallet-control"
            aria-label={
              world.live.wallet
                ? `Wallet ${short(world.live.wallet.publicKey)}`
                : "Wallet"
            }
            aria-expanded={walletOpen}
            onClick={() => setWalletOpen(!walletOpen)}
          >
            <Wallet size={16} />
            <span>
              {world.live.wallet
                ? short(world.live.wallet.publicKey)
                : "Wallet"}
            </span>
          </button>
        </div>
        {walletOpen && (
          <div className="wallet-popover">
            <div className="section-line">
              <strong>Wallet connection</strong>
              <button
                className="icon-button"
                aria-label="Close wallet menu"
                onClick={() => setWalletOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            {world.demo ? (
              <>
                <p>
                  Demo uses simulated authority. No wallet or signature is
                  required.
                </p>
                <button
                  className="button"
                  onClick={() => {
                    world.setMode("devnet");
                    setWalletOpen(false);
                  }}
                >
                  Open Devnet mode <ArrowRight size={14} />
                </button>
                {pathname === "/" && (
                  <Link href="/app" onClick={() => setWalletOpen(false)}>
                    Continue to Command
                  </Link>
                )}
              </>
            ) : (
              <>
                <p>
                  {world.live.wallet
                    ? world.live.wallet.publicKey.toBase58()
                    : "Connect the controller wallet to act. Public account reads do not require a wallet."}
                </p>
                {world.live.wallet ? (
                  <button
                    className="button"
                    onClick={() => void world.live.disconnect()}
                  >
                    Disconnect
                  </button>
                ) : (
                  <>
                    {(["Phantom", "Solflare"] as const).map((name) => (
                      <button
                        key={name}
                        className="button subtle"
                        disabled={!!world.live.busy}
                        onClick={() => void world.live.connect(name)}
                      >
                        {world.live.busy === `Connecting ${name}`
                          ? "Connecting…"
                          : `Connect ${name}`}
                        <ArrowRight size={14} />
                      </button>
                    ))}
                  </>
                )}
                {world.live.error && (
                  <p className="error-text" role="alert">
                    {world.live.error}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </header>
      <div className="route-plane" id="main" key={pathname} tabIndex={-1}>
        {children}
      </div>
      <footer className="world-footer">
        <span>
          <RootAnchor /> One vault. Recursive authority.
        </span>
        <span>
          {world.demo
            ? "SIMULATED STATE · NO ONCHAIN TRANSACTIONS"
            : `${NETWORK} · ${world.live.stale ? "UNVERIFIED / STALE" : world.live.lastRead ? "CONFIRMED ACCOUNT READS" : "AWAITING ACCOUNT READS"}`}
        </span>
      </footer>
      <CommandContinuity pathname={pathname} />
      <DisclosureFeedback pathname={pathname} />
    </WorldContext.Provider>
  );
}
export function ConnectionInstrument() {
  const { live } = useWorld();
  const [mint, setMint] = useState("");
  const [draftAddress, setAddress] = useState<string>();
  const address = draftAddress ?? live.organization;
  return (
    <section className="connection-instrument">
      <h2>Open an organization</h2>
      <p>
        Read verified accounts or create an organization with the connected
        authority wallet.
      </p>
      {live.snapshot && /^(Reading|Verifying)/.test(live.health) && (
        <p className="refresh-notice" role="status">
          Refreshing accounts · current data stays visible.
        </p>
      )}
      <label>
        Organization address
        <input
          aria-label="Organization address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </label>
      <button
        className="button"
        disabled={!!live.busy || !address}
        onClick={() =>
          void live.run(
            "Read organization",
            async () => {
              const { PublicKey } = await import("@solana/web3.js");
              const selected = new PublicKey(address).toBase58();
              live.setOrganization(selected);
              setAddress(undefined);
              await live.refresh(selected);
            },
            address,
          )
        }
      >
        Read accounts <ArrowRight size={14} />
      </button>
      <details>
        <summary>Create organization</summary>
        <label>
          Classic SPL mint
          <input
            aria-label="Organization mint"
            value={mint}
            onChange={(e) => setMint(e.target.value)}
          />
        </label>
        <button
          className="button"
          disabled={!live.wallet || !live.canCreate || !!live.busy || !mint}
          onClick={() =>
            void live.run("Create organization", async () => {
              const { PublicKey } = await import("@solana/web3.js");
              const result = await live.client.createOrganization(
                new PublicKey(mint),
              );
              live.setOrganization(result.organization.toBase58());
              return result;
            })
          }
        >
          Create organization
        </button>
      </details>
      <dl className="details">
        <div>
          <dt>Network</dt>
          <dd>{NETWORK}</dd>
        </div>
        <div>
          <dt>Program</dt>
          <dd className="address">{PROGRAM_ADDRESS}</dd>
        </div>
        <div>
          <dt>RPC</dt>
          <dd className="address">{RPC_URL}</dd>
        </div>
        <div>
          <dt>IDL compatibility</dt>
          <dd>
            {IDL_COMPATIBLE
              ? "Source ABI matches · deployment checked separately"
              : "Mismatch · actions disabled"}
          </dd>
        </div>
      </dl>
      <p className="connection-status" role="status">
        {live.health}
      </p>
      {live.error && (
        <p className="error-text" role="alert">
          {live.error}
        </p>
      )}
    </section>
  );
}
