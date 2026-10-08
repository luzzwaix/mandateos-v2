"use client";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Check, Copy } from "lucide-react";
import { scopedTimeline } from "./authority-motion";

/** Same-identity refetches stay still. Information is never held behind animation. */
export function useDetailContinuity(
  scope: RefObject<HTMLElement | null>,
  identity: string,
  enabled = true,
) {
  const previous = useRef(identity);
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = identity;
    if (!enabled || before === identity || !scope.current) return;
    const timeline = scopedTimeline(scope.current, "detail", 240);
    timeline.animate(
      scope.current,
      [
        { opacity: 0.72, translate: "3px 0" },
        { opacity: 1, translate: "0 0" },
      ],
      200,
    );
    return timeline.cancel;
  }, [scope, identity, enabled]);
}

export function CopyAddress({
  address,
  label,
}: {
  address: string;
  label: string;
}) {
  const [feedback, setFeedback] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  async function copy() {
    let message: string;
    try {
      await navigator.clipboard.writeText(address);
      message = "Copied";
    } catch {
      message = "Copy failed · select the address";
    }
    if (!mounted.current) return;
    setFeedback(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFeedback(""), 2400);
  }
  return (
    <div className="copy-feedback">
      <button
        className="copy-address"
        onClick={() => void copy()}
        aria-label={`Copy ${label}`}
      >
        <span>{label}</span>
        {feedback === "Copied" ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <span role="status">{feedback}</span>
    </div>
  );
}

/** Native disclosure semantics and focus are retained. */
export default function DisclosureFeedback({ pathname }: { pathname: string }) {
  useEffect(() => {
    const timelines = new Map<
      HTMLDetailsElement,
      ReturnType<typeof scopedTimeline>
    >();
    const toggle = (event: Event) => {
      const details = event.target;
      if (
        !(details instanceof HTMLDetailsElement) ||
        !details.closest("#main,.wallet-instrument")
      )
        return;
      timelines.get(details)?.cancel();
      timelines.delete(details);
      if (!details.open) return;
      const timeline = scopedTimeline(details, "disclosure", 240);
      for (const child of details.children)
        if (child.tagName !== "SUMMARY")
          timeline.animate(child, [{ opacity: 0.6 }, { opacity: 1 }], 200);
      timelines.set(details, timeline);
      timeline.onCancel(() => timelines.delete(details));
    };
    document.addEventListener("toggle", toggle, true);
    return () => {
      document.removeEventListener("toggle", toggle, true);
      timelines.forEach((timeline) => timeline.cancel());
      timelines.clear();
    };
  }, [pathname]);
  return null;
}
