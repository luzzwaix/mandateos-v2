// Operating surfaces only. Story's approved timing remains unchanged.
// Account/fixture state is applied immediately; these durations describe its reveal.
export const operatingMotion = {
  control: 160,
  focus: 260,
  trace: 580,
  impact: 440,
  cascade: 900,
  funding: 740,
  submissions: 580,
  settlement: 940,
  travel: 8,
  stagger: 100,
  depthStagger: 170,
  ease: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;
