// Bounded UI timelines. Account/demo state stays authoritative throughout.
export const motionTiming = {
  control: 160,
  trace: 560,
  build: 780,
  impact: 700,
  cascade: 1360,
  handoff: 720,
  settlement: 1500,
};
export const settleEase = "cubic-bezier(0.16, 1, 0.3, 1)";

export function scopedTimeline(scope: Element, name: string, duration: number) {
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const enabled = !media.matches && !document.hidden;
  const animations: Animation[] = [];
  const temporary: Element[] = [];
  const cleanup: (() => void)[] = [];
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  function cancel() {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    animations.forEach((animation) => animation.cancel());
    temporary.forEach((element) => element.remove());
    scope.removeAttribute("data-motion");
    media.removeEventListener("change", onPreference);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("resize", cancel);
    cleanup.forEach((finish) => finish());
  }
  function onPreference() {
    if (media.matches) cancel();
  }
  function onVisibility() {
    if (document.hidden) cancel();
  }
  function animate(
    element: Element | null | undefined,
    frames: Keyframe[],
    ms: number,
    delay = 0,
    easing = settleEase,
  ) {
    if (!enabled || stopped || !element) return;
    animations.push(
      element.animate(frames, {
        duration: ms,
        delay,
        easing,
        fill: "backwards",
      }),
    );
  }
  function draw(element: Element | null | undefined, ms: number, delay = 0) {
    animate(
      element,
      [
        { strokeDasharray: "1 1", strokeDashoffset: "1" },
        { strokeDasharray: "1 1", strokeDashoffset: "0" },
      ],
      ms,
      delay,
    );
  }
  function pulse(
    element: Element | null | undefined,
    ms: number,
    delay = 0,
    reverse = false,
    color = "#eee9da",
  ) {
    if (!enabled || stopped || !(element instanceof SVGPathElement)) return;
    const pulse = element.cloneNode(false) as SVGPathElement;
    pulse.removeAttribute("id");
    pulse.removeAttribute("data-edge");
    pulse.setAttribute("class", "authority-motion-pulse");
    pulse.setAttribute("pathLength", "1");
    pulse.style.cssText = `fill:none;stroke:${color};stroke-width:3;stroke-linecap:round;stroke-dasharray:.12 .88;opacity:0;pointer-events:none`;
    element.parentNode?.appendChild(pulse);
    temporary.push(pulse);
    animate(
      pulse,
      [
        { strokeDashoffset: reverse ? "-1" : "1", opacity: 0 },
        {
          strokeDashoffset: reverse ? "-.85" : ".85",
          opacity: 1,
          offset: 0.12,
        },
        {
          strokeDashoffset: reverse ? ".12" : "-.12",
          opacity: 1,
          offset: 0.88,
        },
        { strokeDashoffset: reverse ? ".22" : "-.22", opacity: 0 },
      ],
      ms,
      delay,
      "linear",
    );
  }
  if (enabled) {
    scope.setAttribute("data-motion", name);
    media.addEventListener("change", onPreference);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", cancel);
    timer = setTimeout(cancel, duration);
  }
  return {
    animate,
    draw,
    pulse,
    cancel,
    onCancel: (finish: () => void) => cleanup.push(finish),
  };
}
