"use client";
import { useEffect, useRef } from "react";
import type { BN } from "@coral-xyz/anchor";
import { amount } from "@/lib/authority";

/** Exact observed balance. Feedback changes emphasis, never the financial digits. */
export default function CapitalNumber({
  value,
  decimals,
  animate = true,
}: {
  value: BN | bigint | string;
  decimals: number;
  animate?: boolean;
}) {
  const target = BigInt(value.toString());
  const previous = useRef(target);
  const digits = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const from = previous.current;
    previous.current = target;
    if (from === target) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const element = digits.current;
    if (!element) return;
    if (!animate || reduced || document.hidden) return;
    const feedback = element.animate([{ opacity: 0.55 }, { opacity: 1 }], {
      duration: 240,
    });
    return () => feedback.cancel();
  }, [target, decimals, animate]);
  return (
    <span className="capital-number">
      <span className="sr-only">{amount(target, decimals)}</span>
      <span aria-hidden="true" ref={digits}>
        {amount(target, decimals)}
      </span>
    </span>
  );
}
