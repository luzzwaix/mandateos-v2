"use client";
import { authorityPath, statusOf } from "@/lib/authority";
import type { LoomProps } from "./spatial-loom";
import CapitalNumber from "./capital-number";
import NativeCast, { foldLine, type Projection } from "./native-cast";
import { instruments, parentIndexes, type V } from "./loom-topology";

const fullLabels: Record<string, [number, number]> = {
  treasury: [180, 80],
  research: [0, 207],
  operations: [245, 278],
  data: [0, 335],
  analysis: [222, 375],
  scraper: [145, 441],
};
export default function NativeAuthority(p: LoomProps) {
  const source = p.model.nodes.length === 1;
  const project: Projection = ([x, y, z]) =>
    source
      ? [
          (0.993 * x - 0.115 * z - 4.8) * 58 + 175,
          (-0.022 * x + 0.982 * y - 0.189 * z - 3.38) * -58 + 137,
        ]
      : [
          (0.8 * x - 0.6 * z - 2.8) * 39 + 171,
          (-0.022 * x + 0.982 * y - 0.189 * z - 5.45) * -39 + 22,
        ];
  const pathIds = new Set(authorityPath(p.model, p.selected).map((n) => n.id));
  const present = new Set(p.model.nodes.map((n) => n.id));
  const nodeStatus = (id: string) => statusOf(p.model, id);
  const height = source ? 285 : 525;
  return (
    <div
      className={`native-authority ${source ? "source-only" : ""}`}
      style={{ aspectRatio: `340/${height}` }}
      aria-label="Responsive cast authority structure"
    >
      <svg viewBox={`0 0 340 ${height}`} aria-hidden="true">
        {instruments
          .filter((d) => present.has(d.id))
          .map((d, i) => (
            <g key={d.id}>
              {i > 0 && (
                <NativeCast
                  points={[
                    i === 2
                      ? instruments[0].sweep.at(-1)!
                      : instruments[parentIndexes[i]].outlet,
                    d.inlet,
                  ]}
                  width={d.width * 0.85}
                  project={project}
                  taper={0.94}
                />
              )}
              <NativeCast
                points={d.sweep}
                width={d.width}
                taper={i === 0 ? 0.85 : 0.35}
                project={project}
                lit={nodeStatus(d.id) === "active"}
              />
            </g>
          ))}
        {instruments
          .filter((d) => present.has(d.id))
          .map((d, i) => {
            const status = nodeStatus(d.id),
              traced = p.trace && pathIds.has(d.id);
            const connection: V[] =
              i > 0
                ? [
                    i === 2
                      ? instruments[0].sweep.at(-1)!
                      : instruments[parentIndexes[i]].outlet,
                    d.inlet,
                  ]
                : [];
            return (
              <g
                key={d.id}
                className={`native-flow ${status} ${traced ? "traced" : ""}`}
              >
                {connection.length > 0 && (
                  <path
                    d={foldLine(connection, project, 0.15)}
                    className={status === "revoked" ? "native-cut" : ""}
                  />
                )}
                <path d={foldLine(d.sweep, project)} />
              </g>
            );
          })}
        {!source &&
          instruments
            .filter((d) => present.has(d.id) && d.id !== "treasury")
            .map((d) => {
              const [x, y] = fullLabels[d.id],
                target = project(d.sweep[1]);
              const left = d.id === "research" || d.id === "data";
              return (
                <path
                  key={d.id}
                  className="native-guide"
                  d={`M${x + (left ? 104 : 0)} ${y + 8}H${target[0] + (left ? -9 : 9)}L${target.join(" ")}`}
                />
              );
            })}
        {p.preview && (
          <path
            className="native-impact"
            d="M114 174L164 187L198 245L212 309L246 357L162 373L162 421L111 425L102 367L88 321L91 271L91 217Z"
          />
        )}
      </svg>
      {p.model.nodes.map((n) => {
        const [x, y] = source
            ? [112, 113]
            : (fullLabels[n.id] ?? [3, n.depth * 140]),
          status = nodeStatus(n.id);
        return (
          <button
            key={n.id}
            data-node-id={n.id}
            data-mobile-node={n.id}
            className={`native-station ${status} ${p.selected === n.id ? "selected" : ""}`}
            style={{
              left: `${(x / 340) * 100}%`,
              top: `${(y / height) * 100}%`,
            }}
            onClick={() => p.onSelect(n.id)}
            aria-label={`Select ${n.name}`}
            aria-pressed={p.selected === n.id}
          >
            <span className="native-name">
              {n.name}
              <i>D{n.depth}</i>
            </span>
            <strong>
              <CapitalNumber value={n.available} decimals={p.model.decimals} />
              <small>{p.model.unit}</small>
            </strong>
            <small className={`status ${status}`}>{status}</small>
          </button>
        );
      })}
    </div>
  );
}
