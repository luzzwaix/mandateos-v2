"use client";
import { useEffect, useRef, useState } from "react";
import type { BN } from "@coral-xyz/anchor";
import { formatUnits } from "@/lib/solana/pdas";

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
  const [frame, setFrame] = useState(target);
  useEffect(() => {
    const from = previous.current;
    previous.current = target;
    if (from === target) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let animation: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = reduced ? 1 : Math.min(1, (now - start) / 650);
      const ease = BigInt(
        Math.round((1 - Math.pow(1 - progress, 3)) * 1_000_000),
      );
      setFrame(from + ((target - from) * ease) / 1_000_000n);
      if (progress < 1) animation = requestAnimationFrame(tick);
    };
    animation = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animation);
  }, [target]);
  return <span className="capital-number">{formatUnits(frame, decimals)}</span>;
}
