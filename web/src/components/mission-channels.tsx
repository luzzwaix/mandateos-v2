"use client";
import { useEffect, useState, type RefObject } from "react";

type Geometry = {
  width: number;
  height: number;
  funding: string;
  routes: string[];
  pass: string;
};
// Ports follow the rendered objects, including the vertical mobile sequence.
// ResizeObserver runs on layout changes only; idle screens schedule no frames.
export default function MissionChannels({
  scope,
  count,
  funded,
  settled,
  winnerIndex,
  viewingIndex,
  previewIndex,
}: {
  scope: RefObject<HTMLDivElement | null>;
  count: number;
  funded: boolean;
  settled: boolean;
  winnerIndex: number;
  viewingIndex: number;
  previewIndex: number;
}) {
  const [geometry, setGeometry] = useState<Geometry>();
  useEffect(() => {
    const stage = scope.current;
    if (!stage) return;
    const measure = () => {
      const rect = stage.getBoundingClientRect();
      const box = (selector: string) => {
        const r = stage.querySelector(selector)?.getBoundingClientRect();
        return r
          ? { x: r.x - rect.x, y: r.y - rect.y, w: r.width, h: r.height }
          : undefined;
      };
      const mission = box(".mission-basin"),
        verifier = box(".verifier-gate"),
        outcome = box(".mission-outcome"),
        source = box(".capital-source");
      if (!mission || !verifier || !source) return;
      const vertical = rect.width < 720;
      const link = (
        a: NonNullable<ReturnType<typeof box>>,
        b: NonNullable<ReturnType<typeof box>>,
      ) => {
        if (vertical) {
          const x1 = a.x + a.w / 2,
            y1 = a.y + a.h,
            x2 = b.x + b.w / 2,
            y2 = b.y;
          return `M${x1} ${y1}C${x1} ${(y1 + y2) / 2} ${x2} ${(y1 + y2) / 2} ${x2} ${y2}`;
        }
        const x1 = a.x + a.w,
          y1 = a.y + a.h / 2,
          x2 = b.x,
          y2 = b.y + b.h / 2;
        return `M${x1} ${y1}C${(x1 + x2) / 2} ${y1} ${(x1 + x2) / 2} ${y2} ${x2} ${y2}`;
      };
      const routes = Array.from({ length: count }, (_, i) => {
        const lane = box(`[data-arena-label="lane-${i}"]`);
        return lane ? link(lane, verifier) : "";
      });
      const next = {
        width: rect.width,
        height: rect.height,
        funding: `M${source.x + source.w / 2} ${source.y + source.h}L${mission.x + mission.w / 2} ${mission.y}`,
        routes,
        pass: outcome ? link(verifier, outcome) : "",
      };
      setGeometry((old) =>
        JSON.stringify(old) === JSON.stringify(next) ? old : next,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    stage
      .querySelectorAll(
        ".capital-source,.mission-basin,.contender,.verifier-gate,.mission-outcome",
      )
      .forEach((el) => observer.observe(el));
    measure();
    return () => observer.disconnect();
  }, [scope, count, settled]);
  if (!geometry) return null;
  return (
    <svg
      className="mission-channels"
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      aria-hidden="true"
    >
      <path
        className={`funding-channel ${funded ? "active" : ""}`}
        pathLength="1"
        d={geometry.funding}
      />
      {geometry.routes.map((d, i) => (
        <path
          key={i}
          className={`submission-channel ${settled && i === winnerIndex ? "selected" : ""} ${i === viewingIndex ? "viewed" : ""} ${i === previewIndex ? "preview-route" : ""}`}
          pathLength="1"
          d={d}
        />
      ))}
      {!settled && (
        <path className="settlement-pending" pathLength="1" d={geometry.pass} />
      )}
      {settled && (
        <path
          className="verifier-pass settlement-channel active"
          pathLength="1"
          d={geometry.pass}
        />
      )}
    </svg>
  );
}
