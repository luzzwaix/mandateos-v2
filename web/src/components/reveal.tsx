"use client";
import { useEffect, useRef, type ReactNode } from "react";

/** One intersection, one reveal. Content remains visible if JS or motion is unavailable. */
export default function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (
      !element ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        element.animate(
          [
            { opacity: 0.65, transform: "translateY(8px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 380, easing: "cubic-bezier(.16,1,.3,1)" },
        );
        observer.disconnect();
      },
      { threshold: 0.12 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
