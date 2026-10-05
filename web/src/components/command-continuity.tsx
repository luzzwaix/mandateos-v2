"use client";
import { useEffect, useRef } from "react";
import { motionTiming, scopedTimeline } from "./authority-motion";
import { canonicalAnchors, operatingFrame } from "./flat-authority-tree";

/** Flatten the actual Story SVG before navigation. No snapshot, flight or overlay. */
export default function CommandContinuity({ pathname }: { pathname: string }) {
  const cleanup = useRef<() => void>(() => {});
  useEffect(() => {
    const project = (event: Event) => {
      const navigate = (event as CustomEvent<{ navigate?: () => void }>).detail
        ?.navigate;
      if (!navigate) return;
      cleanup.current();
      const svg = document.querySelector<SVGSVGElement>(
        ".authority-seal > svg",
      );
      const matrix = svg?.getScreenCTM();
      if (
        !svg ||
        !matrix ||
        innerWidth < 1100 ||
        matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        navigate();
        return;
      }
      const scene = svg.closest("main")!;
      scene.classList.add("projecting");
      const timeline = scopedTimeline(scene, "projection", 1600);
      const inverse = matrix.inverse();
      const unit = 1 / matrix.a;
      // Same field dimensions and canonical anchors as the operational tree.
      const fieldWidth =
        innerWidth -
        operatingFrame.gutter * 2 -
        operatingFrame.gap -
        operatingFrame.inspector;
      const originals: {
        element: SVGElement;
        d?: string | null;
        style: string | null;
      }[] = [];
      const additions: SVGElement[] = [];
      const positions = new Map<string, DOMPoint>();
      const save = (element: SVGElement) =>
        originals.push({
          element,
          d:
            element instanceof SVGPathElement
              ? element.getAttribute("d")
              : undefined,
          style: element.getAttribute("style"),
        });
      svg
        .querySelectorAll<SVGElement>(
          ".seal-label,.root-name,.root-value,.root-unit,.root-emblem,.root-edge,.root-relief,.mandate-relief,.mandate-hatch,.mandate-ink,.authority-rail,.authority-joint,.trace-ray,.cut-mark,.blast-boundary,.seal-registration",
        )
        .forEach((element) => {
          save(element);
          element.style.transition = "none";
          element.style.animation = "none";
          element.style.visibility = "hidden";
          element.style.opacity = "0";
        });
      const groups = Array.from(
        svg.querySelectorAll<SVGGElement>("[data-authority-id]"),
      );
      groups.forEach((group) => {
        const id = group.dataset.authorityId!;
        const anchor = canonicalAnchors[id as keyof typeof canonicalAnchors];
        if (!anchor) return;
        const target = new DOMPoint(
          operatingFrame.gutter + fieldWidth * anchor[0],
          operatingFrame.glyphCenterY + anchor[1] * 106,
        ).matrixTransform(inverse);
        positions.set(id, target);
        const before = getComputedStyle(group).transform;
        save(group);
        group.style.transition = "none";
        group.style.transformOrigin = "390px 360px";
        const scale = id === "treasury" ? (41.6 * unit) / 216 : 1;
        const transform = `translate(${target.x - 390}px,${target.y - 360}px) scale(${scale})`;
        group.style.transform = transform;
        timeline.animate(
          group,
          [{ transform: before }, { transform }],
          motionTiming.handoff,
        );
        const face = group.querySelector<SVGPathElement>(
          ".root-disc,.mandate-surface",
        )!;
        save(face);
        face.style.filter = "none";
        face.style.transition = "none";
        face.style.fill =
          id === "treasury"
            ? "#eee9da"
            : id === "operations"
              ? "#c8d9c5"
              : scene.classList.contains("is-cut")
                ? "#3d4c3e"
                : "#c8d9c5";
        if (id !== "treasury") {
          const from = face.getAttribute("d")!;
          const outer = 23.4 * unit,
            inner = 13 * unit;
          const to = `M390 ${360 + outer} A${outer} ${outer} 0 0 1 390 ${360 - outer} L390 ${360 - inner} A${inner} ${inner} 0 0 0 390 ${360 + inner} Z`;
          face.setAttribute("d", to);
          timeline.animate(
            face,
            [{ d: `path("${from}")` }, { d: `path("${to}")` }],
            motionTiming.handoff,
          );
        }
      });
      const ns = "http://www.w3.org/2000/svg";
      groups.forEach((group) => {
        const id = group.dataset.authorityId!,
          point = positions.get(id);
        if (!point) return;
        const parent = positions.get(group.dataset.parentId!);
        if (parent) {
          const rail = document.createElementNS(ns, "path");
          const mid = (parent.y + point.y) / 2;
          rail.setAttribute(
            "d",
            `M${parent.x} ${parent.y + 35 * unit} C${parent.x} ${mid} ${point.x} ${mid} ${point.x} ${point.y - 24 * unit}`,
          );
          rail.setAttribute("fill", "none");
          rail.setAttribute(
            "stroke",
            id === "operations" ? "#c8d9c5" : "#71816f",
          );
          rail.setAttribute("stroke-width", String(2 * unit));
          rail.setAttribute("pathLength", "1");
          if (scene.classList.contains("is-cut") && id !== "operations")
            rail.setAttribute("stroke-dasharray", ".045 .045");
          svg.prepend(rail);
          additions.push(rail);
          timeline.draw(rail, 380, 100);
        }
        [group.dataset.name!, `${group.dataset.available} USDC`].forEach(
          (value, i) => {
            const label = document.createElementNS(ns, "text");
            label.textContent = value;
            label.setAttribute("x", String(point.x + 30 * unit));
            label.setAttribute("y", String(point.y + (i ? 32 : 3) * unit));
            label.style.cssText = `fill:#eee9da;font-family:var(--${i ? "mono" : "sans"});font-size:${(i ? 22 : 20) * unit}px;opacity:1`;
            svg.append(label);
            additions.push(label);
            timeline.animate(label, [{ opacity: 0 }, { opacity: 1 }], 140, 600);
          },
        );
      });
      let finished = false;
      const restore = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        timeline.cancel();
        originals.forEach(({ element, d, style }) => {
          if (d !== undefined && d !== null) element.setAttribute("d", d);
          if (style === null) element.removeAttribute("style");
          else element.setAttribute("style", style);
        });
        additions.forEach((element) => element.remove());
        scene.classList.remove("projecting");
      };
      // Keep the final projection in place until React commits the destination.
      const timer = setTimeout(navigate, 760);
      cleanup.current = restore;
    };
    window.addEventListener("mandateos:open-command", project);
    return () => {
      window.removeEventListener("mandateos:open-command", project);
      cleanup.current();
    };
  }, []);
  useEffect(() => () => cleanup.current(), [pathname]);
  return null;
}
