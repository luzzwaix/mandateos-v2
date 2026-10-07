"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw, Check, Scissors } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  amount,
  authorityPath,
  genesis,
  revokeDemo,
  statusOf,
  type AuthorityModel,
} from "@/lib/authority";
import { useWorld } from "./world-shell";
import { motionTiming, scopedTimeline } from "./authority-motion";

const stages = [
  "Root",
  "Research",
  "Trace",
  "Blast Radius",
  "Cascade",
  "Operations",
  "Proof",
];
const descriptions = [
  "One Solana treasury. Mandates give agent controllers bounded, delegable authority. Keep control at the Root.",
  "Research can delegate within its mandate. Every new permission inherits the limits above it.",
  "Scraper answers to Data. Data answers to Research. Every path must reach the Root.",
  "One Research revoke reaches three descendants. Operations sits outside the boundary.",
  "Research is revoked. Its descendants lose effective authority. Operations continues.",
  "Operations inherits directly from Root. Research’s revocation does not cut this independent path.",
  "Scraper remains locally active, but Research is its earliest invalid ancestor. This walkthrough is simulated; inspect Devnet for actual evidence.",
];
const walkthroughDelays = [2000, 3000, 3000, 3000, 3000, 3000, 3000];
const polar = (radius: number, angle: number) => {
  const radians = (angle * Math.PI) / 180;
  return [390 + radius * Math.cos(radians), 360 + radius * Math.sin(radians)];
};
function sector(inner: number, outer: number, start: number, end: number) {
  const a = polar(outer, start),
    b = polar(outer, end),
    c = polar(inner, end),
    d = polar(inner, start);
  const large = end - start > 180 ? 1 : 0;
  return `M ${a} A ${outer} ${outer} 0 ${large} 1 ${b} L ${c} A ${inner} ${inner} 0 ${large} 0 ${d} Z`;
}
function authorityArc(radius: number, start: number, end: number) {
  return `M ${polar(radius, start)} A ${radius} ${radius} 0 ${Math.abs(end - start) > 180 ? 1 : 0} ${end > start ? 1 : 0} ${polar(radius, end)}`;
}
const shapes = [
  {
    id: "research",
    inner: 140,
    outer: 208,
    start: -169,
    end: 14,
    x: 386,
    y: 184,
    delay: 0,
    joint: -90,
    dx: 0,
    dy: -16,
  },
  {
    id: "operations",
    inner: 140,
    outer: 208,
    start: 30,
    end: 168,
    x: 390,
    y: 529,
    delay: 0,
    joint: 90,
    dx: 36,
    dy: 44,
  },
  {
    id: "data",
    inner: 220,
    outer: 279,
    start: -169,
    end: -73,
    x: 230,
    y: 173,
    delay: 300,
    joint: -150,
    dx: -22,
    dy: -52,
  },
  {
    id: "analysis",
    inner: 220,
    outer: 279,
    start: -68,
    end: 14,
    x: 614,
    y: 251,
    delay: 420,
    joint: -35,
    dx: 38,
    dy: -24,
  },
  {
    id: "scraper",
    inner: 291,
    outer: 345,
    start: -169,
    end: -73,
    x: 201,
    y: 106,
    delay: 660,
    joint: -150,
    dx: -44,
    dy: -104,
  },
];
const pointOn = (
  shape: (typeof shapes)[number],
  radius: number,
  angle: number,
) => {
  const p = polar(radius, angle);
  return [p[0] + shape.dx, p[1] + shape.dy];
};
// The contour follows the stepped outer inheritance boundary; Operations is outside.
const impactContour = () => {
  const research = shapes[0],
    data = shapes[2],
    analysis = shapes[3],
    scraper = shapes[4];
  return `M ${pointOn(scraper, 352, -173)} A352 352 0 0 1 ${pointOn(scraper, 352, -73)} L ${pointOn(data, 286, -73)} L ${pointOn(analysis, 286, -68)} A286 286 0 0 1 ${pointOn(analysis, 286, 18)} L ${pointOn(research, 127, 18)} A127 127 0 1 0 ${pointOn(research, 127, -173)} Z`;
};

function AuthoritySeal({
  model,
  grant,
  traced,
  preview,
  cut,
  selected,
  onSelect,
}: {
  model: AuthorityModel;
  grant?: string;
  traced: boolean;
  preview: boolean;
  cut: boolean;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const surface = useRef<HTMLDivElement>(null);
  const previousMotion = useRef({ cut, preview, traced, selected, grant });
  const expanded = model.nodes.length > 1;
  const ledgerNodes: AuthorityModel["nodes"] = [];
  const visitLedger = (id: string) => {
    const node = model.nodes.find((item) => item.id === id);
    if (!node || ledgerNodes.includes(node)) return;
    ledgerNodes.push(node);
    for (const child of model.nodes.filter((item) => item.parent === id))
      visitLedger(child.id);
  };
  visitLedger(model.root);
  const path = authorityPath(model, selected).map((n) => n.id);
  const grantParent = model.nodes.find((node) => node.id === grant)?.parent;
  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    const previous = previousMotion.current;
    previousMotion.current = { cut, preview, traced, selected, grant };
    const newGrant = grant && grant !== previous.grant;
    if (
      !newGrant &&
      !(cut && !previous.cut) &&
      !(preview && !previous.preview) &&
      !(traced && (!previous.traced || selected !== previous.selected))
    )
      return;
    const timeline = scopedTimeline(
      element,
      cut ? "cascade" : preview ? "impact" : traced ? "trace" : "grant",
      cut || grant === "recursion" ? motionTiming.cascade : motionTiming.build,
    );
    if (newGrant && grant === "recursion") {
      // State is already complete. Only its visual explanation is sequenced.
      for (const shape of shapes.filter((shape) => shape.id !== "research")) {
        const node = element.querySelector(`[data-authority-id="${shape.id}"]`);
        const delay =
          shape.id === "operations" ? 0 : shape.id === "scraper" ? 440 : 220;
        timeline.pulse(node?.querySelector(".authority-joint"), 260, delay);
        timeline.animate(
          node?.querySelector(".mandate-surface"),
          [{ opacity: 0.15 }, { opacity: 1 }],
          260,
          delay + 240,
        );
        node
          ?.querySelectorAll(".authority-rail")
          .forEach((rail) => timeline.draw(rail, 300, delay + 240));
        timeline.animate(
          node?.querySelector(".seal-label"),
          [{ opacity: 0 }, { opacity: 1 }],
          180,
          delay + 480,
        );
      }
    } else if (newGrant && grant) {
      const route = element.querySelector(".grant-path");
      timeline.pulse(route, 420);
      const node = element.querySelector(`[data-authority-id="${grant}"]`);
      timeline.animate(node, [{ opacity: 0 }, { opacity: 1 }], 120, 420);
      node
        ?.querySelectorAll(".authority-rail")
        .forEach((rail) => timeline.draw(rail, 310, 430));
      timeline.animate(
        node?.querySelector(".seal-label"),
        [
          { opacity: 0, clipPath: "inset(0 0 100% 0)" },
          { opacity: 1, clipPath: "inset(0)" },
        ],
        150,
        630,
      );
      timeline.animate(
        element.querySelector(
          `[data-authority-id="${grantParent}"] .root-disc, [data-authority-id="${grantParent}"] .mandate-surface`,
        ),
        [
          { strokeWidth: 1 },
          { strokeWidth: 4, offset: 0.3 },
          { strokeWidth: 1 },
        ],
        320,
      );
      timeline.draw(node?.querySelector(".mandate-ink"), 440, 300);
      timeline.animate(
        node?.querySelector(".mandate-ink"),
        [{ opacity: 1 }, { opacity: 0 }],
        440,
        300,
      );
    } else if (cut) {
      for (const shape of shapes.filter((shape) => shape.id !== "operations")) {
        const node = element.querySelector(`[data-authority-id="${shape.id}"]`);
        node?.querySelectorAll(".authority-rail").forEach((rail) =>
          timeline.animate(
            rail,
            [
              { stroke: "#c8d9c5", strokeDasharray: "1 0" },
              {
                stroke: shape.id === "research" ? "#d97d72" : "#637166",
                strokeDasharray: ".035 .045",
              },
            ],
            360,
            shape.delay,
          ),
        );
        timeline.animate(
          node?.querySelector(".mandate-cut-source"),
          [{ opacity: 1 }, { opacity: 0 }],
          430,
          shape.delay,
        );
        const displacement =
          shape.id === "research"
            ? "translate(0px, -36px)"
            : `translate(${shape.dx - shape.delay / 30}px, ${shape.dy - shape.delay / 20}px)`;
        timeline.animate(
          node,
          [
            { transform: `translate(${shape.dx}px, ${shape.dy}px)` },
            { transform: displacement },
          ],
          520,
          shape.delay,
        );
        timeline.animate(
          node?.querySelector(".seal-label"),
          [{ opacity: 0.65 }, { opacity: 1 }],
          220,
          shape.delay + 200,
        );
      }
      timeline.animate(
        element.querySelector(".cut-mark"),
        [
          { transform: "scaleY(.15)", opacity: 0 },
          { transform: "scaleY(1.3)", opacity: 1, offset: 0.4 },
          { transform: "scaleY(1)", opacity: 1 },
        ],
        360,
      );
      timeline.animate(
        element.closest("main")?.querySelector(".story-capacity"),
        [{ opacity: 0 }, { opacity: 1 }],
        320,
        900,
      );
    } else if (preview) {
      timeline.draw(
        element.querySelector(".blast-boundary"),
        motionTiming.impact,
      );
    } else if (traced) {
      timeline.draw(
        element.querySelector(".trace-ray path"),
        motionTiming.trace,
      );
      Array.from(element.querySelectorAll(".trace-ray circle")).forEach(
        (point, i) =>
          timeline.animate(
            point,
            [{ opacity: 0 }, { opacity: 1 }],
            140,
            i * 130,
          ),
      );
      ["treasury", "research", "data", "scraper"].forEach((id, i) => {
        timeline.animate(
          element.closest("main")?.querySelector(`[data-lineage-id="${id}"]`),
          [
            { opacity: 0.35, clipPath: "inset(0 100% 0 0)" },
            { opacity: 1, clipPath: "inset(0)" },
          ],
          220,
          i * 130,
        );
        element
          .querySelectorAll(`[data-authority-id="${id}"] .authority-rail`)
          .forEach((rail) => timeline.draw(rail, 340, i * 130));
        timeline.animate(
          element.querySelector(
            `[data-authority-id="${id}"] .root-disc, [data-authority-id="${id}"] .mandate-surface`,
          ),
          [
            { strokeWidth: 0.7 },
            { strokeWidth: 3, offset: 0.35 },
            { strokeWidth: 1.5 },
          ],
          320,
          i * 150,
        );
      });
    }
    return timeline.cancel;
  }, [grant, grantParent, traced, preview, cut, selected]);
  return (
    <div
      ref={surface}
      className={`authority-seal ${expanded ? "expanded" : "root-only"} ${traced ? "tracing" : ""} ${preview ? "previewing" : ""} ${cut ? "severed" : ""}`}
    >
      <svg
        viewBox="-35 -135 815 800"
        aria-label="Nested authority boundaries: Treasury contains Research and Operations. Research contains Data and Analysis; Data contains Scraper."
      >
        <defs>
          <linearGradient id="authority-bone" x1="0" y1="0" x2="0.85" y2="1">
            <stop stopColor="#faf5e7" />
            <stop offset="0.55" stopColor="#eee9da" />
            <stop offset="1" stopColor="#b8c1ac" />
          </linearGradient>
          {shapes.map((shape, index) => (
            <linearGradient
              key={shape.id}
              id={`authority-${shape.id}`}
              x1="0"
              y1="0"
              x2="0.65"
              y2="1"
            >
              <stop stopColor={index === 1 ? "#273e32" : "#30443a"} />
              <stop
                offset="0.45"
                stopColor={index === 1 ? "#1c3026" : "#23382d"}
              />
              <stop offset="1" stopColor="#14241c" />
            </linearGradient>
          ))}
          <linearGradient id="authority-copper" x1="0" y1="0" x2="0.6" y2="1">
            <stop stopColor="#efd0ae" />
            <stop offset="0.5" stopColor="#d59b74" />
            <stop offset="1" stopColor="#a87350" />
          </linearGradient>
          <filter
            id="authority-shadow"
            x="-25%"
            y="-25%"
            width="150%"
            height="165%"
          >
            <feDropShadow
              dx="0"
              dy="12"
              stdDeviation="10"
              floodColor="#040b07"
              floodOpacity="0.48"
            />
          </filter>
          <pattern
            id="lost-authority"
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(35)"
          >
            <path d="M 0 0 V 7" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <g className="seal-registration" aria-hidden="true">
          {[0, 180, 270].map((angle) => {
            const a = polar(358, angle),
              b = polar(369, angle);
            return <path key={angle} d={`M ${a} L ${b}`} />;
          })}
        </g>
        <g
          className="seal-root"
          data-authority-id="treasury"
          data-name="Treasury"
          data-available={amount(model.nodes[0].available)}
        >
          <path
            className="root-relief"
            d="M338 252 H442 Q498 252 498 308 V334 L472 360 L498 386 V412 Q498 468 442 468 H338 Q282 468 282 412 V386 L308 360 L282 334 V308 Q282 252 338 252 Z"
            transform="translate(0 8)"
          />
          <path
            className="root-edge"
            d="M338 252 H442 Q498 252 498 308 V334 L472 360 L498 386 V412 Q498 468 442 468 H338 Q282 468 282 412 V386 L308 360 L282 334 V308 Q282 252 338 252 Z"
          />
          <path
            className="root-disc"
            d="M338 252 H442 Q498 252 498 308 V334 L472 360 L498 386 V412 Q498 468 442 468 H338 Q282 468 282 412 V386 L308 360 L282 334 V308 Q282 252 338 252 Z"
          />
          <path
            className="root-emblem"
            d="M 361 310 V 287 L 390 302 L 419 287 V 310 M 369 310 V 300 L 390 311 L 411 300 V 310"
          />
          <text className="root-name" x="390" y="357" textAnchor="middle">
            ROOT
          </text>
          <text className="root-value" x="390" y="386" textAnchor="middle">
            {amount(model.vault)}
          </text>
          <text className="root-unit" x="390" y="408" textAnchor="middle">
            USDC · ONE TREASURY
          </text>
        </g>
        {shapes.map((shape) => {
          const node = model.nodes.find((n) => n.id === shape.id);
          if (!node) return null;
          const affected = shape.id !== "operations";
          const status = statusOf(model, node.id);
          return (
            <g
              key={shape.id}
              data-authority-id={shape.id}
              className={`seal-mandate ${shape.id} ${affected ? "dependent" : "independent"} ${grant === shape.id ? "granting" : ""} ${traced && path.includes(shape.id) ? "on-path" : ""}`}
              style={
                {
                  "--cascade-delay": `${shape.delay}ms`,
                  "--layer-x": `${shape.dx}px`,
                  "--layer-y": `${shape.dy}px`,
                } as CSSProperties
              }
              data-parent-id={node.parent}
              data-name={node.name}
              data-available={amount(node.available, model.decimals)}
              role="button"
              tabIndex={0}
              aria-label={`Inspect ${node.name}`}
              aria-pressed={selected === node.id}
              onClick={() => onSelect(node.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(node.id);
                }
              }}
            >
              <path
                className="authority-joint"
                d={(() => {
                  const parent = shapes.find((s) => s.id === node.parent);
                  const a = parent
                    ? pointOn(parent, parent.outer - 2, shape.joint)
                    : polar(108, shape.joint);
                  const b = polar(shape.inner + 2, shape.joint);
                  return `M ${a[0] - shape.dx} ${a[1] - shape.dy} L ${b}`;
                })()}
              />
              <path
                className="mandate-relief"
                d={sector(shape.inner, shape.outer, shape.start, shape.end)}
                transform="translate(0 7)"
              />
              <path
                className="mandate-surface"
                d={sector(shape.inner, shape.outer, shape.start, shape.end)}
              />
              {[shape.start + 2, shape.end - 2].map((end, index) => (
                <path
                  key={index}
                  className="authority-rail"
                  pathLength="1"
                  d={authorityArc(shape.inner + 5, shape.joint, end)}
                />
              ))}
              {cut && affected && (
                <path
                  className="mandate-cut-source"
                  d={sector(shape.inner, shape.outer, shape.start, shape.end)}
                />
              )}
              <path
                className="mandate-hatch"
                d={sector(shape.inner, shape.outer, shape.start, shape.end)}
              />
              <path
                className="mandate-ink"
                pathLength="1"
                d={sector(shape.inner, shape.outer, shape.start, shape.end)}
              />
              <g
                key={status}
                className="seal-label"
                transform={`translate(${shape.x} ${shape.y})`}
              >
                <text className="mandate-name" textAnchor="middle" y="0">
                  {node.name}
                </text>
                <text className="mandate-value" textAnchor="middle" y="20">
                  {cut && affected
                    ? status === "revoked"
                      ? "REVOKED"
                      : "BLOCKED"
                    : `${amount(node.budget, model.decimals)} USDC`}
                </text>
              </g>
            </g>
          );
        })}
        {preview && (
          <path className="blast-boundary" pathLength="1" d={impactContour()} />
        )}
        {grant &&
          grant !== "recursion" &&
          (() => {
            const shape = shapes.find((shape) => shape.id === grant)!;
            const node = model.nodes.find((node) => node.id === grant)!;
            const parent = shapes.find((shape) => shape.id === node.parent);
            const origin = parent
              ? pointOn(parent, (parent.inner + parent.outer) / 2, shape.joint)
              : polar(75, shape.joint);
            return (
              <path
                className="grant-path"
                d={`M ${origin} L ${pointOn(shape, (shape.inner + shape.outer) / 2, shape.joint)}`}
              />
            );
          })()}
        {traced && !cut && (
          <g key={selected} className="trace-ray" aria-hidden="true">
            <path
              d={`M ${polar(90, -150)} L ${pointOn(shapes[0], 174, -150)} L ${pointOn(shapes[2], 250, -150)} L ${pointOn(shapes[4], 318, -150)}`}
              pathLength="1"
            />
            {[
              polar(90, -150),
              pointOn(shapes[0], 174, -150),
              pointOn(shapes[2], 250, -150),
              pointOn(shapes[4], 318, -150),
            ].map((p, i) => {
              return (
                <circle
                  key={i}
                  cx={p[0]}
                  cy={p[1]}
                  r="5"
                  style={{ animationDelay: `${i * 350}ms` }}
                />
              );
            })}
          </g>
        )}
        {cut && (
          <g className="cut-mark" aria-hidden="true">
            <path d="M382 216 L398 226 M382 228 L398 238" />
            <path className="cut-gap" d="M390 207V214 M390 242V251" />
          </g>
        )}
      </svg>
      <div
        className="seal-controls"
        aria-label="Authority ledger"
        style={{ visibility: expanded ? "visible" : "hidden" }}
      >
        {ledgerNodes.map((node) => (
          <button
            key={node.id}
            aria-pressed={selected === node.id}
            style={{ "--mandate-depth": node.depth } as CSSProperties}
            onClick={() => onSelect(node.id)}
          >
            {node.name === "Treasury" ? "Root" : node.name}
            <span className="seal-control-status">
              {statusOf(model, node.id)}
            </span>
            <span className="seal-control-amount">
              {amount(node.available, model.decimals)} {model.unit}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function StoryWorld() {
  const router = useRouter(),
    w = useWorld();
  const [stage, setStage] = useState(0),
    [count, setCount] = useState(1);
  const [grant, setGrant] = useState<string>();
  const [traced, setTraced] = useState(false),
    [preview, setPreview] = useState(false);
  const [settled, setSettled] = useState<AuthorityModel>(),
    [selected, setSelected] = useState("treasury");
  const [playing, setPlaying] = useState(false);
  const [walkStarted, setWalkStarted] = useState(false);
  const [walkStep, setWalkStep] = useState(0);
  const [walkRun, setWalkRun] = useState(0);
  const goToWalkStep = useCallback((step: number) => {
    setWalkStep(step);
    setCount(step === 0 ? 1 : step === 1 ? 2 : 6);
    setGrant(step === 1 ? "research" : step === 2 ? "recursion" : undefined);
    setTraced(step === 3);
    setPreview(step === 4);
    setSettled(step >= 5 ? revokeDemo(genesis(6), "research") : undefined);
    setSelected(
      step === 0
        ? "treasury"
        : step === 1 || step === 4
          ? "research"
          : step === 6
            ? "operations"
            : "scraper",
    );
    setStage([0, 1, 1, 2, 3, 4, 5, 6][step]);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      goToWalkStep(walkStep + 1);
      if (walkStep + 1 === 7) setPlaying(false);
    }, walkthroughDelays[walkStep]);
    const pause = () => setPlaying(false);
    document.addEventListener("visibilitychange", pause);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", pause);
    };
  }, [playing, walkStep, walkRun, goToWalkStep]);
  function runWalkthrough() {
    setWalkRun((run) => run + 1);
    setWalkStarted(true);
    goToWalkStep(0);
    setPlaying(true);
  }
  const model = settled ?? genesis(count),
    cut = !!settled;
  useEffect(() => {
    const sync = () => {
      if (w.mode === "demo") {
        if (w.fixture.reserved === 0n && w.mission === "ready")
          w.setFixture(model);
        w.select(selected);
      }
    };
    window.addEventListener("mandateos:open-command", sync);
    return () => window.removeEventListener("mandateos:open-command", sync);
  }, [w, model, selected]);
  function delegate() {
    if (count > 1) return;
    setCount(2);
    setGrant("research");
    setSelected("research");
    setStage(1);
  }
  function build() {
    if (count === 6) return;
    setCount(6);
    setGrant("recursion");
  }
  function trace() {
    setGrant(undefined);
    setStage(2);
    setTraced(true);
    setPreview(false);
    setSelected("scraper");
  }
  function blast() {
    setStage(3);
    setTraced(false);
    setPreview(true);
    setSelected("research");
  }
  function confirm() {
    if (!preview || cut) return;
    setSettled(revokeDemo(model, "research"));
    setStage(4);
    setPreview(false);
    setTraced(false);
    setSelected("scraper");
    w.record(
      "Research revoked",
      "Data · Analysis · Scraper effectively blocked · Operations remains active · demo",
    );
    w.record(
      "Parent capacity released",
      `${amount(model.nodes.find((node) => node.id === "research")!.remaining)} USDC → Root available · vault unchanged · demo`,
    );
  }
  function reset() {
    setPlaying(false);
    setWalkStarted(false);
    setStage(0);
    setCount(1);
    setGrant(undefined);
    setTraced(false);
    setPreview(false);
    setSettled(undefined);
    setSelected("treasury");
  }
  function openCommand() {
    window.dispatchEvent(
      new CustomEvent("mandateos:open-command", {
        detail: { navigate: () => router.push("/app") },
      }),
    );
  }
  function inspect(id: string) {
    setPlaying(false);
    setSelected(id);
    if (count === 6 && !cut && !preview) {
      setTraced(id === "scraper");
    }
  }
  const cta =
    count === 1
      ? "Delegate Research"
      : count < 6
        ? "Delegate further"
        : stage < 2
          ? "Trace Scraper"
          : stage === 2
            ? "Preview Research revoke"
            : stage === 3
              ? "Confirm demo revoke"
              : "Inspect authority in Command";
  const action =
    count === 1
      ? delegate
      : count < 6
        ? build
        : stage < 2
          ? trace
          : stage === 2
            ? blast
            : stage === 3
              ? confirm
              : openCommand;
  return (
    <main
      className={`mandate-story ${preview ? "is-preview" : ""} ${cut ? "is-cut" : ""}`}
      data-stage={stage}
    >
      <div className="story-composition">
        <section className="story-voice">
          <div className="story-title" key={stage}>
            {stage === 0 ? (
              <h1>
                Give them
                <br />
                <em>mandates.</em>
              </h1>
            ) : stage === 1 ? (
              <h1>
                Authority.
                <br />
                <em>Inherited.</em>
              </h1>
            ) : stage === 2 ? (
              <h1>
                Every grant.
                <br />
                <em>One origin.</em>
              </h1>
            ) : stage === 3 ? (
              <h1>
                Know the
                <br />
                <em>consequence.</em>
              </h1>
            ) : stage === 4 ? (
              <h1>
                One cut.
                <br />
                <em>Control stays.</em>
              </h1>
            ) : stage === 5 ? (
              <h1>
                Operations.
                <br />
                <em>Still active.</em>
              </h1>
            ) : (
              <h1>
                Trace the cut.
                <br />
                <em>Inspect proof.</em>
              </h1>
            )}
            <p>{descriptions[stage]}</p>
          </div>
          <div className="story-action-block">
            <button
              className="story-primary walkthrough-start"
              onClick={runWalkthrough}
            >
              <span>Run the 20-second authority walkthrough</span>
              <ArrowRight size={20} aria-hidden="true" />
            </button>
            <span className="story-demo">
              Interactive demo — no transactions
            </span>
            <div
              className="walkthrough-controls"
              aria-label="Walkthrough controls"
            >
              {walkStarted && (
                <>
                  <button
                    onClick={() => setPlaying(!playing)}
                    disabled={walkStep === 7}
                  >
                    {playing ? "Pause walkthrough" : "Resume walkthrough"}
                  </button>
                  <button
                    disabled={walkStep === 7}
                    onClick={() => {
                      setPlaying(false);
                      goToWalkStep(walkStep + 1);
                    }}
                  >
                    Next step
                  </button>
                  <span role="status">
                    {walkStep + 1} / 8 ·{" "}
                    {playing
                      ? "Playing"
                      : walkStep === 7
                        ? "Complete"
                        : "Paused"}
                  </span>
                </>
              )}
            </div>
            <button
              className="story-step-action"
              onClick={() => {
                setPlaying(false);
                setWalkStarted(false);
                action();
              }}
            >
              <span>{cta}</span>
              {stage === 3 ? <Scissors size={19} /> : <ArrowRight size={20} />}
            </button>
            {preview && (
              <button
                className="story-cancel"
                onClick={() => {
                  setPreview(false);
                  setStage(2);
                  setTraced(true);
                }}
              >
                Cancel preview
              </button>
            )}
            <div className="story-product-links">
              <button onClick={openCommand}>
                Open Command <ArrowRight size={14} />
              </button>
              <Link href="/arena">
                Open Arena <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="story-context" aria-live="polite">
            <span className="context-index">
              {String(stage + 1).padStart(2, "0")} / 07
            </span>
            <div>
              <strong>
                {stage === 0
                  ? "Capital stays in one place."
                  : stage === 1
                    ? "Authority moves. Tokens don’t."
                    : stage === 2
                      ? "No ancestor can be skipped."
                      : stage === 3
                        ? "Preview only. All mandates active."
                        : "A local cut. An inherited consequence."}
              </strong>
              <p>
                {stage === 0
                  ? "Agents control mandates. Capital stays in the shared vault."
                  : stage === 1
                    ? "Each child remains bounded by its parent."
                    : stage === 2
                      ? "Root → Research → Data → Scraper"
                      : stage === 3
                        ? "Research + Data + Analysis + Scraper"
                        : "Root → Research (revoked) → Data → Scraper"}
              </p>
              {cut && (
                <small className="story-capacity">
                  <b>
                    +
                    {amount(
                      genesis(6).nodes.find((node) => node.id === "research")!
                        .remaining,
                    )}{" "}
                    USDC capacity released
                  </b>
                  Root available {amount(model.nodes[0].available)} USDC · vault
                  unchanged
                </small>
              )}
            </div>
          </div>
        </section>
        <section className="story-exhibit" aria-label="Authority demonstration">
          <div className="exhibit-topline">
            <span>MANDATEOS / RECURSIVE AUTHORITY</span>
            <span>
              {cut
                ? "BRANCH REVOKED"
                : preview
                  ? "IMPACT PREVIEW"
                  : traced
                    ? "LINEAGE VERIFIED"
                    : "AUTHORITY INHERITANCE"}
              <i />
            </span>
          </div>
          <AuthoritySeal
            model={model}
            grant={grant}
            traced={traced}
            preview={preview}
            cut={cut}
            selected={selected}
            onSelect={inspect}
          />
          {(traced || cut) && (
            <ol className="story-lineage" aria-label="Scraper authority path">
              {authorityPath(model, "scraper").map((node) => (
                <li
                  key={node.id}
                  data-lineage-id={node.id}
                  data-status={statusOf(model, node.id)}
                >
                  <strong>
                    {node.name === "Treasury" ? "Root" : node.name}
                  </strong>
                  <span>{statusOf(model, node.id)}</span>
                </li>
              ))}
            </ol>
          )}
          {stage === 6 && (
            <div className="story-evidence" role="status">
              <strong>SIMULATED DENIAL · NOT SENT · NO SIGNATURE</strong>
              <p>
                Scraper: locally active, effectively blocked by Research. No RPC
                or finalized 6003 receipt was produced by this demo.
              </p>
              <Link href="/app">
                Inspect current Devnet accounts and receipt provenance{" "}
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
          <div className="exhibit-caption">
            <div>
              <span>
                {preview
                  ? "WITHIN BLAST RADIUS"
                  : cut
                    ? "EFFECTIVE AUTHORITY LOST"
                    : "ONE SHARED TREASURY"}
              </span>
              <strong>
                {preview
                  ? "4 mandates"
                  : cut
                    ? "Research + 3 descendants"
                    : "1,590.00"}
                {!preview && !cut && <small> USDC</small>}
              </strong>
            </div>
            <div className={cut || preview ? "sibling-proof" : "capital-proof"}>
              <span>
                {cut || preview
                  ? "OPERATIONS / INDEPENDENT"
                  : "ROOT / OWN AVAILABLE"}
              </span>
              <strong>
                {cut || preview ? (
                  <>
                    <Check size={16} /> 200 USDC · Active
                  </>
                ) : (
                  <>
                    {amount(model.nodes[0].available)}
                    <small> USDC</small>
                  </>
                )}
              </strong>
            </div>
          </div>
          {(traced || cut) && (
            <div className="story-mobile-consequence">
              <p>
                {cut
                  ? "Root → Research (revoked) → Data → Scraper"
                  : "Root → Research → Data → Scraper"}
              </p>
              {cut && (
                <small>
                  Root available {amount(model.nodes[0].available)} USDC · vault
                  unchanged
                </small>
              )}
            </div>
          )}
        </section>
      </div>
      <footer className="story-bottom">
        <nav aria-label="Story progress">
          {stages.map((name, i) => (
            <button
              key={name}
              disabled={i !== 0 && (i > stage || cut)}
              aria-current={i === stage ? "step" : undefined}
              onClick={() => {
                setPlaying(false);
                if (i === 0) reset();
                else if (i === 2) trace();
                else if (i === 3) blast();
                else {
                  setStage(i);
                  setTraced(false);
                  setPreview(false);
                }
              }}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {name}
            </button>
          ))}
        </nav>
        <button className="story-reset" onClick={reset}>
          <RotateCcw size={14} /> Replay story
        </button>
      </footer>
    </main>
  );
}
