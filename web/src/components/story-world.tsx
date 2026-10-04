"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import {
  amount,
  authorityPath,
  genesis,
  revokeDemo,
  statusOf,
  type AuthorityModel,
} from "@/lib/authority";
import { AuthorityTrace } from "./authority-tree";
import SpatialLoom from "./spatial-loom";
import { useWorld } from "./world-shell";

const chapters = [
  {
    id: "genesis",
    name: "Genesis",
    title: "DON’T GIVE AGENTS WALLETS. GIVE THEM MANDATES.",
    copy: "One treasury. Recursive authority.",
  },
  {
    id: "recursion",
    name: "Recursion",
    title: "An organization grows. Control stays at the Root.",
    copy: "Research delegates to Data. Data delegates to Scraper. Analysis occupies its own Research branch. Operations holds independent Root authority.",
  },
  {
    id: "trace",
    name: "Trace",
    title: "Permission has a lineage.",
    copy: "Select a mandate. Resolve every ancestor that makes it usable, all the way to the Root.",
  },
  {
    id: "blast",
    name: "Blast Radius",
    title: "See the consequence before the cut.",
    copy: "Research, Data, Analysis and Scraper sit inside one impact boundary. Every mandate stays active during preview.",
  },
  {
    id: "cut",
    name: "Cascade",
    title: "ONE CUT. A WHOLE BRANCH LOSES AUTHORITY.",
    copy: "One local revoke. Descendants fail ancestor validation. Operations continues at the same coordinates, with the same authority.",
  },
  {
    id: "enter",
    name: "Plane Change",
    title: "ENTER COMMAND",
    copy: "Operate the same authority structure. Inspect the capital, review the consequence, and keep the evidence.",
  },
];
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function StoryWorld() {
  const router = useRouter();
  const w = useWorld();
  const [chapter, setChapter] = useState(0);
  const [count, setCount] = useState(1);
  const [grant, setGrant] = useState<string>();
  const [building, setBuilding] = useState(false);
  const [selected, setSelected] = useState("treasury");
  const [settled, setSettled] = useState<AuthorityModel>();
  const [preview, setPreview] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [trace, setTrace] = useState(false);
  const [traceEpoch, setTraceEpoch] = useState(0);
  const [flattening, setFlattening] = useState(false);
  const [delta, setDelta] = useState("");
  const world = useRef<HTMLElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const generation = useRef(0);
  const chapterRef = useRef(0);
  const model = settled ?? genesis(count),
    cut = !!settled;
  const current = chapters[chapter];
  const research = model.nodes.find((n) => n.id === "research");
  const node = model.nodes.find((n) => n.id === selected) ?? model.nodes[0];
  const next = genesis().nodes[count];

  function cancel() {
    generation.current++;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setGrant(undefined);
    setBuilding(false);
    setFlattening(false);
  }
  function later(callback: () => void, ms: number) {
    const token = generation.current;
    timers.current.push(
      setTimeout(() => {
        if (token === generation.current) callback();
      }, ms),
    );
  }
  useEffect(() => {
    const root = world.current;
    const lifetime = generation;
    if (!root) return;
    const stop = () => {
      lifetime.current++;
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setGrant(undefined);
      setBuilding(false);
      setFlattening(false);
    };
    const update = () => {
      if (innerWidth < 1100 || reduced()) return;
      const index = Math.max(
        0,
        Math.min(
          5,
          Math.round(
            (56 - root.getBoundingClientRect().top) / (innerHeight * 0.7),
          ),
        ),
      );
      if (index === chapterRef.current) return;
      stop();
      chapterRef.current = index;
      setChapter(index);
    };
    const hash = () => {
      const id = location.hash.slice(1);
      const index =
        id === "mission" ? 5 : chapters.findIndex((c) => c.id === id);
      if (index >= 0) {
        stop();
        chapterRef.current = index;
        setChapter(index);
        if (innerWidth >= 1100 && !reduced())
          window.scrollTo({
            top: root.offsetTop - 56 + index * innerHeight * 0.7,
            behavior: "instant",
          });
      }
    };
    hash();
    const hidden = () => {
      if (document.hidden) stop();
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("hashchange", hash);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      lifetime.current++;
      timers.current.forEach(clearTimeout);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("hashchange", hash);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);
  function navigate(index: number) {
    cancel();
    chapterRef.current = index;
    setChapter(index);
    history.replaceState(null, "", `#${chapters[index].id}`);
    if (innerWidth >= 1100 && !reduced() && world.current)
      window.scrollTo({
        top: world.current.offsetTop - 56 + index * innerHeight * 0.7,
        behavior: "instant",
      });
  }
  function construct(all = false) {
    if (cut || building || count === 6) return;
    cancel();
    setBuilding(true);
    const last = all ? 6 : count + 1;
    const step = all ? 450 : 1150;
    const immediate = reduced() || innerWidth < 1100;
    const create = (n: number) => {
      const before = genesis(n - 1),
        after = genesis(n),
        child = after.nodes[n - 1];
      const parent = before.nodes.find((p) => p.id === child.parent)!;
      setCount(n);
      setGrant(immediate ? undefined : child.id);
      setSelected(child.id);
      setDelta(
        `${parent.name} −${amount(child.budget)} USDC own available · ${child.name} +${amount(child.budget)}`,
      );
    };
    if (immediate) {
      for (let n = count + 1; n <= last; n++) create(n);
      setBuilding(false);
      return;
    }
    create(count + 1);
    for (let n = count + 2; n <= last; n++)
      later(() => create(n), (n - count - 1) * step);
    later(
      () => {
        setBuilding(false);
        setGrant(undefined);
      },
      (last - count - 1) * step + step,
    );
  }
  function select(id: string) {
    cancel();
    setSelected(id);
    setTrace(true);
    setTraceEpoch((old) => old + 1);
  }
  function inspectImpact() {
    cancel();
    setPreview(true);
    setSelected("research");
    setTrace(false);
  }
  function confirm() {
    if (!preview || count < 6 || cut) return;
    cancel();
    setSettled(revokeDemo(model, "research"));
    setPreview(false);
    setSelected("scraper");
    setTrace(false);
    setDelta("Research capacity released to Treasury · shared vault unchanged");
    navigate(4);
  }
  function reset() {
    cancel();
    setCount(1);
    setSettled(undefined);
    setSelected("treasury");
    setPreview(false);
    setRejected(false);
    setTrace(false);
    setDelta("");
    navigate(0);
  }
  function openCommand() {
    cancel();
    // Preserve any independently funded Arena reservation and lifecycle.
    if (w.mode === "demo") {
      if (w.fixture.reserved === 0n && w.mission === "ready")
        w.setFixture(model);
      w.select(selected);
    }
    if (reduced() || innerWidth < 1100) {
      router.push("/app");
      return;
    }
    setFlattening(true);
    later(() => router.push("/app"), 1200);
  }
  return (
    <main
      ref={world}
      className={`story-world persistent-story ${flattening ? "plane-change" : ""}`}
      data-chapter={current.id}
    >
      <div className="story-stage">
        <div className="story-editorial">
          <nav className="chapter-rail" aria-label="Story chapters">
            {chapters.map((c, i) => (
              <button
                key={c.id}
                aria-current={chapter === i ? "step" : undefined}
                onClick={() => navigate(i)}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {c.name}
              </button>
            ))}
          </nav>
          <div className="chapter-copy">
            {chapter === 0 ? (
              <h1>
                DON’T GIVE
                <br /> AGENTS WALLETS.
                <span>
                  <br /> GIVE THEM
                  <br /> MANDATES.
                </span>
              </h1>
            ) : (
              <h2>{current.title}</h2>
            )}
            <p>{current.copy}</p>
          </div>
          <div className="chapter-action">
            {chapter <= 1 && (
              <button
                className="button bone"
                onClick={() => construct(chapter === 1 || count > 1)}
                disabled={building || cut || count === 6}
              >
                {building
                  ? "Constructing authority…"
                  : count === 6
                    ? "Organization established"
                    : chapter === 0
                      ? count === 1
                        ? "Delegate Research"
                        : "Build demo hierarchy"
                      : "Build demo hierarchy"}
                <ArrowRight size={18} />
              </button>
            )}
            {chapter >= 2 && count < 6 && (
              <>
                <p className="missing-ancestry">
                  {count}/6 mandates exist. Build the missing ancestry to
                  inspect the full organization.
                </p>
                <button
                  className="button bone"
                  disabled={building}
                  onClick={() => construct(true)}
                >
                  {building
                    ? "Constructing authority…"
                    : "Build demo hierarchy"}
                  <ArrowRight size={18} />
                </button>
              </>
            )}
            {chapter === 2 && count === 6 && (
              <button
                className="button subtle"
                onClick={() => select("scraper")}
              >
                Trace Scraper
                <ArrowRight size={18} />
              </button>
            )}
            {(chapter === 3 || chapter === 4) && count === 6 && !cut && (
              <button
                className={`button ${preview ? "copper" : "bone"}`}
                onClick={preview ? confirm : inspectImpact}
              >
                {preview ? "Confirm demo revoke" : "Preview Research revoke"}
                <ArrowRight size={18} />
              </button>
            )}
            {preview && !cut && (chapter === 3 || chapter === 4) && (
              <button className="text-button" onClick={() => setPreview(false)}>
                Cancel preview
              </button>
            )}
            {chapter === 4 && cut && (
              <button
                className="button subtle"
                onClick={() => {
                  select("scraper");
                  setRejected(true);
                }}
              >
                Attempt Scraper spend
                <ArrowRight size={18} />
              </button>
            )}
            {chapter === 5 && (
              <button
                className="button bone"
                disabled={flattening}
                onClick={openCommand}
              >
                {flattening ? "Aligning Command…" : "Open Command"}
                <ArrowRight size={18} />
              </button>
            )}
            <span className="demo-caption">
              INTERACTIVE SIMULATION · NO TRANSACTIONS
            </span>
            {delta && chapter <= 1 && (
              <p className="authority-delta" role="status">
                {delta}
              </p>
            )}
          </div>
          <div className="chapter-navigation">
            <button
              className="text-button"
              disabled={chapter === 0}
              onClick={() => navigate(chapter - 1)}
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <button
              className="text-button"
              disabled={chapter === 5}
              onClick={() => navigate(chapter + 1)}
            >
              Next
              <ArrowRight size={14} />
            </button>
            <button className="text-button" onClick={reset}>
              <RotateCcw size={13} />
              Reset
            </button>
          </div>
          {chapter === 5 && (
            <Link className="story-arena-invitation" href="/arena">
              Capital enters. Work competes. Verification resolves.
              <span>
                Enter Arena
                <ArrowRight size={14} />
              </span>
            </Link>
          )}
        </div>
        <div className="story-specimen">
          <div className="specimen-caption">
            <span>{current.name.toUpperCase()} / AUTHORITY WORLD</span>
            <span>{String(count).padStart(2, "0")} / 06 MANDATES</span>
          </div>
          <div className="story-object">
            <SpatialLoom
              model={model}
              selected={selected}
              onSelect={select}
              chapter={current.id}
              flatten={flattening}
              grant={grant}
              grantDuration={chapter === 0 && count === 2 ? 1150 : 450}
              preview={preview ? "research" : undefined}
              trace={trace}
              traceEpoch={traceEpoch}
              cascade={cut}
            />
          </div>
          <div
            className={`story-instrument ${preview ? "impact" : ""} ${cut ? "cut" : ""}`}
            aria-live="polite"
          >
            {preview ? (
              <>
                <div>
                  <span>BLAST RADIUS / PREVIEW</span>
                  <strong>
                    1 local revoke · 3 descendants would be blocked
                  </strong>
                  <p>Operations unaffected. All mandates still active.</p>
                </div>
                <div>
                  <span>RESEARCH SUBTREE REMAINING</span>
                  <strong>
                    {amount(research!.remaining)} <small>USDC</small>
                  </strong>
                  <p>Authority returns to Treasury. No token transfer.</p>
                </div>
              </>
            ) : cut ? (
              <>
                <div>
                  <span>
                    {rejected
                      ? "EXECUTION REJECTED / SIMULATED"
                      : "AUTHORITY CUT"}
                  </span>
                  <strong>Scraper → Data → Research × → Treasury</strong>
                  <p>
                    Research is revoked. Descendant local records remain active.
                  </p>
                </div>
                <div>
                  <span>CAPITAL RECOVERY</span>
                  <strong>No token transfer shown</strong>
                  <p>
                    390.00 USDC capacity released to Treasury · reclaim is
                    separate.
                  </p>
                </div>
              </>
            ) : trace ? (
              <>
                <div>
                  <span>
                    COMPLETE ANCESTRY / {statusOf(model, node.id).toUpperCase()}
                  </span>
                  <strong>
                    {authorityPath(model, node.id)
                      .map((n) => n.name)
                      .join(" → ")}
                  </strong>
                  <p>No ancestor can be skipped.</p>
                </div>
                <AuthorityTrace model={model} selected={node.id} />
              </>
            ) : (
              <>
                <div>
                  <span>
                    {chapter === 0
                      ? "NEXT BOUNDED MANDATE"
                      : "AUTHORITY / ONE SHARED VAULT"}
                  </span>
                  <strong>
                    {next
                      ? `${next.name} · ${amount(next.budget)} USDC`
                      : "Six mandates. Five authority relations."}
                  </strong>
                  <p>
                    Authority relations allocate capacity. Tokens stay in the
                    shared vault.
                  </p>
                </div>
                {research && (
                  <div>
                    <span>RESEARCH / OWN AVAILABLE</span>
                    <strong>
                      {amount(research.available)} <small>USDC</small>
                    </strong>
                    <p>{amount(research.remaining)} USDC subtree remaining</p>
                  </div>
                )}
              </>
            )}
          </div>
          {(chapter === 5 || flattening) && (
            <aside
              className="plane-inspector bone-instrument"
              aria-label="Plane change inspector"
            >
              <span>SELECTED MANDATE</span>
              <h2>{node.name}</h2>
              <span className={`status ${statusOf(model, node.id)}`}>
                {statusOf(model, node.id)}
              </span>
              <dl className="details">
                <div>
                  <dt>Available</dt>
                  <dd>{amount(node.available)} USDC</dd>
                </div>
                <div>
                  <dt>Subtree remaining</dt>
                  <dd>{amount(node.remaining)} USDC</dd>
                </div>
                <div>
                  <dt>Authority path</dt>
                  <dd>
                    {authorityPath(model, node.id)
                      .map((n) => n.name)
                      .join(" → ")}
                  </dd>
                </div>
              </dl>
            </aside>
          )}
        </div>
      </div>
      <div className="story-scroll-markers" aria-hidden="true">
        {chapters.map((c) => (
          <div key={c.id} id={c.id} />
        ))}
        <div id="mission" />
      </div>
    </main>
  );
}
