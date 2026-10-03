"use client";
import { useEffect, useRef } from "react";
import type { BN } from "@coral-xyz/anchor";
import { amount } from "@/lib/authority";

/** Interpolate between two observed balances; first load always shows the real value. */
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
    if (!animate || reduced || document.hidden) {
      element.textContent = amount(target, decimals);
      return;
    }
    let animation: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = document.hidden ? 1 : Math.min(1, (now - start) / 240);
      const ease = BigInt(
        Math.round((1 - Math.pow(1 - progress, 3)) * 1_000_000),
      );
      // Keep intermediate digits at the observed asset precision. Never
      // expose arbitrary micro-unit fractions from the easing calculation.
      const precision = Math.min(
        decimals,
        Math.max(
          2,
          amount(from, decimals).split(".")[1]?.length ?? 0,
          amount(target, decimals).split(".")[1]?.length ?? 0,
        ),
      );
      const quantum = 10n ** BigInt(Math.max(0, decimals - precision));
      const raw = from + ((target - from) * ease) / 1_000_000n;
      element.textContent = amount(
        progress === 1 ? target : (raw / quantum) * quantum,
        decimals,
      );
      if (progress < 1) animation = requestAnimationFrame(tick);
    };
    animation = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animation);
      element.textContent = amount(target, decimals);
    };
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
