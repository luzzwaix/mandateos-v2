import { useId } from "react";
import type { V } from "./loom-topology";

export type Projection = (p: V) => [number, number];
const profile = [
  [-0.5, 0],
  [-0.43, 0.09],
  [-0.25, 0.16],
  [0, 0.19],
  [0.25, 0.16],
  [0.43, 0.09],
  [0.5, 0],
  [0.5, -0.23],
  [-0.5, -0.23],
];
function sample(points: V[], t: number): V {
  const f = t * (points.length - 1),
    i = Math.min(points.length - 2, Math.floor(f)),
    u = f - i;
  const a = points[Math.max(0, i - 1)],
    b = points[i],
    c = points[i + 1],
    d = points[Math.min(points.length - 1, i + 2)];
  return [0, 1, 2].map(
    (k) =>
      0.5 *
      (2 * b[k] +
        (-a[k] + c[k]) * u +
        (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * u * u +
        (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * u * u * u),
  ) as V;
}
const point = ([x, y]: [number, number]) => `${x.toFixed(2)},${y.toFixed(2)}`;
export function foldLine(points: V[], project: Projection, z = 0.3) {
  return Array.from({ length: 49 }, (_, i) => {
    const p = sample(points, i / 48);
    p[2] += z;
    return `${i ? "L" : "M"}${point(project(p))}`;
  }).join(" ");
}
// Static vector projection of the cast strip's topology, shoulder, underside
// and taper. No labels, balances or lifecycle state belong to this geometry.
export default function NativeCast({
  points,
  width,
  project,
  taper = 0.7,
  lit = true,
}: {
  points: V[];
  width: number;
  project: Projection;
  taper?: number;
  lit?: boolean;
}) {
  const id = useId().replaceAll(":", "");
  const rows = Array.from({ length: 49 }, (_, i) => {
    const t = i / 48,
      p = sample(points, t),
      before = sample(points, Math.max(0, t - 0.002)),
      after = sample(points, Math.min(1, t + 0.002));
    const dx = after[0] - before[0],
      dy = after[1] - before[1],
      len = Math.hypot(dx, dy) || 1;
    const turn = Math.sin(t * Math.PI * 1.35 - 0.35) * 0.32,
      w = width * (1 - (1 - taper) * t) * (1 + 0.2 * Math.sin(t * Math.PI));
    return profile.map(([u, z]) => {
      const across = u * w * Math.cos(turn) - z * Math.sin(turn),
        rise = u * w * Math.sin(turn) + z * Math.cos(turn);
      return project([
        p[0] - (dy / len) * across,
        p[1] + (dx / len) * across,
        p[2] + rise,
      ]);
    });
  });
  return (
    <g className={`projected-cast ${lit ? "" : "unpowered"}`}>
      <defs>
        <linearGradient
          id={`${id}-metal`}
          x1="0"
          y1="0"
          x2=".8"
          y2="1"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0" stopColor="#718478" />
          <stop offset=".19" stopColor="#d1d3c4" />
          <stop offset=".28" stopColor="#718275" />
          <stop offset=".48" stopColor="#21392e" />
          <stop offset=".72" stopColor="#0c1c15" />
          <stop offset=".91" stopColor="#617a67" />
          <stop offset="1" stopColor="#bbc8b8" />
        </linearGradient>
      </defs>
      {[6, 7, 8, 0, 1, 2, 3, 4, 5].map((face) => {
        const edge = (face + 1) % profile.length;
        const d = `M${rows.map((r) => point(r[face])).join(" L")} L${[...rows]
          .reverse()
          .map((r) => point(r[edge]))
          .join(" L")} Z`;
        return (
          <path
            key={face}
            d={d}
            fill={
              face >= 6
                ? ["#15251d", "#07110d", "#26382c"][face - 6]
                : `url(#${id}-metal)`
            }
            opacity={face < 6 ? 0.68 + face * 0.05 : 1}
            stroke="none"
          />
        );
      })}
      <path
        d={foldLine(points, project, 0.24)}
        fill="none"
        stroke={lit ? "#9daf9c" : "#46524a"}
        strokeWidth=".6"
      />
    </g>
  );
}
