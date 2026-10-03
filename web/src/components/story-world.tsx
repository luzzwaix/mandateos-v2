"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import {
  amount,
  genesis,
  revokeDemo,
  type AuthorityModel,
} from "@/lib/authority";
import AuthorityTree, { AuthorityTrace } from "./authority-tree";
import { useWorld } from "./world-shell";

const sequence = [
  "treasury",
  "research",
  "operations",
  "data",
  "analysis",
  "scraper",
];
export default function StoryWorld() {
  const w = useWorld();
  const [count, setCount] = useState(1),
    [grant, setGrant] = useState<string>(),
    [selected, setSelected] = useState("treasury"),
    [cutSelected, setCutSelected] = useState("research"),
    [settled, setSettled] = useState<AuthorityModel>(),
    [preview, setPreview] = useState(false),
    [cut, setCut] = useState(false),
    [rejected, setRejected] = useState(false),
    [trace, setTrace] = useState(false),
    [delta, setDelta] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const model = settled ?? genesis(count),
    next = genesis().nodes[count];
  function delegate() {
    if (count >= 6 || grant) return;
    const id = sequence[count];
    setGrant(id);
    setCount(count + 1);
    setSelected(id);
    setDelta("");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDelta(
        `+${amount(genesis(count + 1).nodes.find((n) => n.id === id)!.budget)} USDC`,
      );
      setGrant(undefined);
      return;
    }
    timer.current = setTimeout(() => {
      setDelta(
        `+${amount(genesis(count + 1).nodes.find((n) => n.id === id)!.budget)} USDC`,
      );
      setGrant(undefined);
    }, 700);
  }
  function reset() {
    clearTimeout(timer.current);
    setCount(1);
    setGrant(undefined);
    setSelected("treasury");
    setCutSelected("research");
    setSettled(undefined);
    setPreview(false);
    setCut(false);
    setRejected(false);
    setTrace(false);
    setDelta("");
  }
  function full() {
    clearTimeout(timer.current);
    setCount(6);
    setGrant(undefined);
    setSelected("scraper");
    setSettled(undefined);
    setCut(false);
    setPreview(false);
    setRejected(false);
  }
  return (
    <main className="story-world">
      <section className="story-hero" id="genesis">
        <div className="story-editorial">
          <h1>
            DON’T GIVE <br />
            AGENTS WALLETS.
            <br />
            <span>
              GIVE THEM <br />
              MANDATES.
            </span>
          </h1>
          <p>
            One treasury.
            <br />
            Recursive authority.
          </p>
          <div className="genesis-action">
            <button
              className="button bone"
              disabled={!!grant || count === 6}
              onClick={delegate}
            >
              {grant
                ? "Authority propagating…"
                : count === 6
                  ? "Organization established"
                  : count === 1
                    ? "Delegate authority"
                    : `Delegate ${next?.name}`}
              <ArrowRight size={19} />
            </button>
            <div className="demo-caption">
              INTERACTIVE DEMO · NO TRANSACTIONS
            </div>
          </div>
          <div className="grant-readout" aria-live="polite">
            <span>
              {delta ? "DELEGATED AUTHORITY" : "NEXT BOUNDED MANDATE"}
            </span>
            <strong>{delta || `${next?.name ?? "Six mandates"}`}</strong>
            <small>
              {delta
                ? "SIMULATED CAPACITY · TOKENS STAY IN ONE VAULT"
                : count < 6
                  ? `${amount(next!.budget)} USDC · DEMO ALLOCATION`
                  : "THE COMPLETE ORGANIZATION IS INTERACTIVE"}
            </small>
          </div>
          <div className="story-reset">
            <button className="text-button" onClick={reset}>
              <RotateCcw size={12} />
              Reset
            </button>
            <button className="text-button" onClick={full}>
              Show full organization <ArrowRight size={13} />
            </button>
          </div>
        </div>
        <div className="story-specimen">
          <div className="specimen-caption">
            <span>AUTHORITY GENESIS</span>
            <span>ONE HUMAN · ONE ROOT</span>
          </div>
          <AuthorityTree
            model={model}
            selected={selected}
            onSelect={setSelected}
            spatial
            grant={grant}
          />
          <div className="specimen-bottom">
            <span>{String(count).padStart(2, "0")} / 06 MANDATES</span>
            <span>AUTHORITY RELATIONS · NOT TOKEN TRANSFERS</span>
          </div>
        </div>
        <div className="scene-index" aria-label="Story scenes">
          {[
            ["genesis", "Root"],
            ["recursion", "Recursion"],
            ["trace", "Trace"],
            ["cut", "Cascade"],
            ["mission", "Arena"],
            ["enter", "Command"],
          ].map(([id, label], i) => (
            <a key={id} href={`#${id}`}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {label}
            </a>
          ))}
        </div>
      </section>
      <section className="story-recursion" id="recursion">
        <div className="story-section-title">
          <h2>
            An organization grows.
            <br />
            Control stays at the Root.
          </h2>
        </div>
        <div className="recursive-explanation">
          <p>
            Research can delegate to Data. Data can delegate to Scraper. Every
            action still depends on the complete authority path.
          </p>
          <div className="recursion-ledger">
            <div>
              <strong>
                390.00 <small>USDC</small>
              </strong>
              <span>Research subtree</span>
            </div>
            <div>
              <strong>
                250.00 <small>USDC</small>
              </strong>
              <span>Research own available</span>
            </div>
            <p>
              250 own + 90 Data subtree + 50 Analysis = 390 remaining.
              <br />
              Nested authority is never counted twice.
            </p>
          </div>
          <button
            className="text-button"
            onClick={() => {
              full();
              document.getElementById("genesis")?.scrollIntoView({
                behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "instant"
                  : "smooth",
              });
            }}
          >
            Build the full hierarchy <ArrowRight size={15} />
          </button>
        </div>
      </section>
      <section className="story-control-scene" id="trace">
        <div className="story-section-title">
          <h2>Permission has a lineage.</h2>
          <p>Select a mandate. Trace the authority that makes it usable.</p>
          <button
            className="button subtle"
            onClick={() => {
              full();
              setTrace(true);
            }}
          >
            Trace Scraper <ArrowRight size={15} />
          </button>
        </div>
        <div className="story-trace">
          <AuthorityTrace
            model={genesis()}
            selected={trace ? "scraper" : "research"}
          />
          <p>
            Root → Research → Data → Scraper.
            <br />
            No ancestor can be skipped.
          </p>
        </div>
      </section>
      <section className="story-cut-scene" id="cut">
        <div className="cut-editorial">
          <h2>
            Cut one branch.
            <br />
            Keep the rest alive.
          </h2>
          <p>
            Research loses authority. Data, Analysis, and Scraper fail ancestor
            validation. Operations continues.
          </p>
          <button
            className={`button ${preview ? "copper" : "bone"}`}
            disabled={cut}
            onClick={() => {
              if (!preview) {
                setPreview(true);
                setSettled(genesis());
                setCount(6);
                setSelected("research");
                setCutSelected("research");
              } else {
                setSettled(revokeDemo(genesis(), "research"));
                setCut(true);
                setPreview(false);
                setSelected("scraper");
                setCutSelected("scraper");
              }
            }}
          >
            {cut
              ? "Research revoked in demo"
              : preview
                ? "Confirm demo revoke"
                : "Preview Research revoke"}
            <ArrowRight size={15} />
          </button>
          {cut && (
            <button className="button subtle" onClick={() => setRejected(true)}>
              Attempt Scraper spend <ArrowRight size={15} />
            </button>
          )}
          <p className="demo-caption">
            SIMULATED STATE · NO ONCHAIN TRANSACTION
          </p>
        </div>
        <div className="cut-specimen">
          <AuthorityTree
            model={cut ? settled! : genesis()}
            selected={cutSelected}
            onSelect={setCutSelected}
            preview={preview ? "research" : undefined}
            trace={cut}
            cascade={cut ? 1 : undefined}
          />
          {cut ? (
            <div className="story-proof">
              <strong>
                {rejected
                  ? "EXECUTION REJECTED"
                  : "EFFECTIVE AUTHORITY BLOCKED"}
              </strong>
              <span>Scraper → blocked by revoked ancestor: Research</span>
              <small>
                SIMULATED OUTCOME · Capacity released to Treasury, no token
                transfer.
              </small>
            </div>
          ) : (
            <div className="cut-forecast">
              <span>
                {preview
                  ? "PREVIEW · ALL MANDATES STILL ACTIVE"
                  : "SELECT THE BRANCH BEFORE EXECUTION"}
              </span>
              <strong>
                1 local revoke / 3 descendants blocked / Operations unaffected
              </strong>
            </div>
          )}
        </div>
      </section>
      <section className="story-mission-scene" id="mission">
        <div>
          <h2>
            Capital enters.
            <br />
            Work competes.
            <br />
            Verification resolves.
          </h2>
        </div>
        <div className="mission-preview">
          <div className="mini-mission-source">
            Treasury<span>100.00 USDC · DEMO</span>
          </div>
          <div className="mini-mission">
            Funded mission
            <span>Three submissions → trusted verifier → one result</span>
          </div>
          <Link href="/arena" className="button bone">
            Enter Arena <ArrowRight size={16} />
          </Link>
          <small>
            Simulated settlement. Real Arena uses the existing shared vault.
          </small>
        </div>
      </section>
      <section className="story-enter" id="enter">
        <div>
          <h2>
            One human.
            <br />A fleet of agents.
            <br />A treasury under control.
          </h2>
        </div>
        <div>
          <p>
            Operate the same authority structure. Inspect the capital, review
            the consequence, and keep the evidence.
          </p>
          <Link
            href="/app"
            className="button bone"
            onClick={() => w.setMode("demo")}
          >
            Open Command <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
