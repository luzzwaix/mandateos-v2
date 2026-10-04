"use client";
import NativeCast, { foldLine, type Projection } from "./native-cast";
import {
  missionSweep,
  missionFunding,
  submissionSweeps,
  verifierSweeps,
  settlementSweep,
  type V,
} from "./loom-topology";
type Props = {
  funded: boolean;
  submitted: boolean;
  settled: boolean;
  preview: boolean;
  candidate: string;
  winner: string;
  names: string[];
  title: string;
  bounty: string;
  unit?: string;
  demo: boolean;
  choose: (index: number) => void;
};
export default function NativeExecution(p: Props) {
  const project: Projection = ([x, y, z]) => [
    (0.993 * x - 0.115 * z - 0.05) * 31 + 9,
    (-0.022 * x + 0.982 * y - 0.189 * z - 3.65) * -37 + 34,
  ];
  const gate = verifierSweeps.map((s) =>
    s.map(([x, y, z]) => [x + 7.65, y + 0.3, z + 0.48] as V),
  );
  const candidate = p.candidate.charCodeAt(0) - 65;
  return (
    <div
      className="mission-mobile native-execution"
      aria-label="Responsive cast mission execution field"
    >
      <svg viewBox="0 0 340 380" aria-hidden="true">
        <NativeCast
          points={missionSweep}
          width={1.16}
          taper={0.8}
          project={project}
        />
        <path
          className={`execution-capital ${p.funded ? "active" : ""}`}
          d={foldLine(missionFunding, project)}
        />
        {submissionSweeps.map((s, i) => (
          <g key={i}>
            <NativeCast
              points={s}
              width={0.37 - i * 0.055}
              taper={1}
              project={project}
              lit={p.submitted}
            />
            <path
              className={`execution-submission ${p.settled && p.names[i] === p.winner ? "winner" : p.preview && i === candidate ? "preview" : ""}`}
              d={foldLine(s, project, 0.34)}
            />
          </g>
        ))}
        {gate.map((s, i) => (
          <NativeCast
            key={i}
            points={s}
            width={0.4}
            taper={0.8}
            project={project}
          />
        ))}
        <NativeCast
          points={settlementSweep}
          width={0.5}
          taper={0.65}
          project={project}
          lit={p.settled}
        />
        {p.settled && (
          <path
            className="execution-settlement"
            d={foldLine(settlementSweep, project, 0.3)}
          />
        )}
      </svg>
      <div className="execution-source">
        <small>CAPITAL SOURCE</small>
        <strong>Treasury</strong>
      </div>
      <div className="execution-mission">
        <small>{p.demo ? "MISSION M-001" : "FUNDED MISSION"}</small>
        <h2>{p.title}</h2>
        <strong>
          {p.bounty} <small>{p.unit}</small>
        </strong>
        <small>
          {p.settled ? "SETTLED" : p.funded ? "FUNDED" : "NOT FUNDED"}
          {p.demo ? " · DEMO" : ""}
        </small>
      </div>
      {p.submitted ? (
        p.names.map((n, i) => (
          <button
            key={n}
            className={`execution-entry ${p.settled && n === p.winner ? "winner" : ""}`}
            style={{ top: `${([72, 110, 182][i] / 380) * 100}%` }}
            disabled={!p.demo || p.settled}
            onClick={() => p.choose(i)}
            aria-pressed={p.preview && i === candidate}
          >
            <strong>{n}</strong>
            <small>
              {p.settled && n === p.winner
                ? "SELECTED / SETTLED"
                : p.preview && i === candidate
                  ? "PREVIEW · UNPAID"
                  : "COMMITMENT"}
            </small>
          </button>
        ))
      ) : (
        <div className="execution-awaiting">
          <strong>Awaiting submissions</strong>
          <small>NO COMMITMENTS</small>
        </div>
      )}
      <div className="execution-verifier">
        <small>VERIFIER</small>
        <strong>
          {p.settled
            ? p.winner
            : p.preview
              ? `Preview ${p.candidate}`
              : "Trusted verifier"}
        </strong>
        <small>
          {p.settled
            ? "VERIFIED + SETTLED"
            : p.preview
              ? "NOT PAID"
              : "DECISION GATE"}
        </small>
      </div>
      {p.settled && (
        <div className="execution-terminal">
          <small>{p.demo ? "SIMULATED RECEIPT" : "OBSERVED SETTLEMENT"}</small>
          <strong>
            {p.bounty} <small>{p.unit}</small>
          </strong>
          <small>{p.winner}</small>
        </div>
      )}
    </div>
  );
}
