/** Event durations override the M3 baseline for the explicit MandateOS brief.
 * Sequencing uses Motion Design Agent's deliberate 200ms depth interval;
 * construction is strictly ordered: authority first, endpoint resolution next.
 */
export const loomMotion = {
  genesis: 850,
  recursion: 550,
  trace: 650,
  impact: 500,
  cascade: 1100,
  plane: 850,
  settlement: 850,
  depthInterval: 200,
} as const;
export const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const resolveEase = (n: number) => 1 - Math.pow(1 - clamp(n), 4);
