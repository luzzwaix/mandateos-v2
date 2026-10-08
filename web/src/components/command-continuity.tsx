"use client";
import { useEffect, useRef } from "react";
import { scopedTimeline } from "./authority-motion";

/** One Root travels; the destination cannot overlap its presentation snapshot. */
export default function CommandContinuity({ pathname }: { pathname: string }) {
  const cleanup = useRef<() => void>(() => {});
  useEffect(() => {
    const project = (event: Event) => {
      cleanup.current();
      const navigate = (event as CustomEvent<{ navigate?: () => void }>).detail
        ?.navigate;
      const source = document.querySelector<SVGGraphicsElement>(".seal-root");
      const scene = document.querySelector<SVGSVGElement>(
        ".authority-seal > svg",
      );
      if (
        !source ||
        !scene ||
        document.hidden ||
        matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        navigate?.();
        return;
      }
      const rootRect = source.getBoundingClientRect(),
        sceneRect = scene.getBoundingClientRect();
      const overlay = document.createElement("div");
      overlay.className = "mandate-story authority-handoff";
      overlay.setAttribute("aria-hidden", "true");
      const seal = document.createElement("div");
      seal.className = scene.parentElement!.className;
      const snapshot = scene.cloneNode(true) as SVGSVGElement;
      snapshot.removeAttribute("aria-label");
      snapshot.querySelectorAll("[tabindex],[role]").forEach((node) => {
        node.removeAttribute("tabindex");
        node.removeAttribute("role");
      });
      snapshot.style.cssText = `position:fixed;left:${sceneRect.left}px;top:${sceneRect.top}px;width:${sceneRect.width}px;height:${sceneRect.height}px;min-height:0;margin:0;transform-origin:${rootRect.left - sceneRect.left}px ${rootRect.top - sceneRect.top}px`;
      seal.append(snapshot);
      overlay.append(seal);
      document.body.append(overlay);
      document.body.dataset.authorityHandoff = "flight";
      const timeline = scopedTimeline(overlay, "handoff", 1000);
      // Retire all non-Root geometry as one layer, including cut annotations.
      const retiring = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g",
      );
      for (const child of Array.from(snapshot.children)) {
        if (
          child.tagName.toLowerCase() !== "defs" &&
          !child.matches(".seal-root")
        )
          retiring.append(child);
      }
      retiring.style.opacity = "0";
      snapshot.prepend(retiring);
      timeline.animate(retiring, [{ opacity: 1 }, { opacity: 0 }], 140);
      let frame = 0,
        resolved = false;
      let flight: Animation | undefined;
      const resolve = () => {
        const target = document.querySelector<HTMLElement>(
          '.command-world [data-visual-role="treasury"]',
        );
        if (!target || resolved) return;
        resolved = true;
        observer.disconnect();
        const rect = target.getBoundingClientRect();
        const transform = `translate(${rect.left - rootRect.left}px,${rect.top - rootRect.top}px) scale(${rect.width / rootRect.width},${rect.height / rootRect.height})`;
        flight = snapshot.animate(
          [{ transform: "translate(0,0) scale(1)" }, { transform }],
          {
            duration: 480,
            easing: "cubic-bezier(0.16,1,0.3,1)",
            fill: "forwards",
          },
        );
        flight.onfinish = timeline.cancel;
        timeline.animate(
          document.querySelector(".command-world .capital-identity"),
          [{ opacity: 0.65 }, { opacity: 1 }],
          220,
          120,
        );
      };
      const observer = new MutationObserver(() => {
        if (
          !resolved &&
          document.querySelector('.command-world [data-visual-role="treasury"]')
        ) {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(resolve);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      document.addEventListener("pointerdown", timeline.cancel, {
        once: true,
        passive: true,
      });
      document.addEventListener("keydown", timeline.cancel, { once: true });
      timeline.onCancel(() => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        flight?.cancel();
        overlay.remove();
        delete document.body.dataset.authorityHandoff;
        document.removeEventListener("pointerdown", timeline.cancel);
        document.removeEventListener("keydown", timeline.cancel);
      });
      cleanup.current = timeline.cancel;
      navigate?.();
      resolve();
    };
    window.addEventListener("mandateos:open-command", project);
    return () => {
      window.removeEventListener("mandateos:open-command", project);
      cleanup.current();
    };
  }, []);
  useEffect(() => {
    if (pathname !== "/" && pathname !== "/app") cleanup.current();
  }, [pathname]);
  return null;
}
