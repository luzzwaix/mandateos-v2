"use client";
import { useEffect, useRef } from "react";
import type { BN } from "@coral-xyz/anchor";
import { amount } from "@/lib/authority";

/** Interpolate between two observed balances; first load always shows the real value. */
export default function CapitalNumber({
  value,
  decimals,
}: {
  value: BN | bigint | string;
  decimals: number;
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
    if (reduced || document.hidden) {
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
      element.textContent = amount(
        from + ((target - from) * ease) / 1_000_000n,
        decimals,
      );
      if (progress < 1) animation = requestAnimationFrame(tick);
    };
    animation = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animation);
      element.textContent = amount(target, decimals);
    };
  }, [target, decimals]);
  return (
    <span className="capital-number">
      <span className="sr-only">{amount(target, decimals)}</span>
      <span aria-hidden="true" ref={digits}>
        {amount(target, decimals)}
      </span>
    </span>
  );
}
