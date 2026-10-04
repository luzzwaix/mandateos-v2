export type V = [number, number, number];
export type Instrument = {
  id: string;
  position: V;
  anchor: V;
  inlet: V;
  outlet: V;
  sweep: V[];
  width: number;
};
// Only presentation geometry. Each fold is attached to its actual parent;
// there is no balance, capacity or lifecycle state in this scene inventory.
export const instruments: Instrument[] = [
  {
    id: "treasury",
    position: [0, 0, 0],
    anchor: [4.2, 3.48, 1.9],
    inlet: [6.7, 4.3, 0.7],
    outlet: [4.15, 1.7, 1.4],
    width: 1.3,
    sweep: [
      [6.7, 4.3, -0.6],
      [5.65, 5.05, -0.1],
      [3.7, 4.8, 0.65],
      [2.95, 3.55, 1.3],
      [3.3, 2.05, 1.4],
      [4.15, 1.7, 1.4],
      [5.6, 2.13, 1.25],
    ],
  },
  {
    id: "research",
    position: [3.1, 1.15, 1.15],
    anchor: [-1.1, 0.38, 1.6],
    inlet: [3.1, 1.15, 1.15],
    outlet: [2.92, -0.62, 0.8],
    width: 1.25,
    sweep: [
      [3.1, 1.15, 1.15],
      [2.65, 0.2, 1.08],
      [2.75, -0.58, 0.8],
      [2.92, -0.92, 0.65],
    ],
  },
  {
    id: "operations",
    position: [6.6, 1.95, 1.1],
    anchor: [8.5, 1.6, 1.8],
    inlet: [6.6, 1.95, 1.1],
    outlet: [7.15, -0.25, 0.9],
    width: 0.86,
    sweep: [
      [6.6, 1.95, 1.1],
      [7.65, 1.65, 1.05],
      [8.02, 0.78, 0.92],
      [8.02, -0.75, 0.9],
    ],
  },
  {
    id: "data",
    position: [2.02, -1.55, 0.28],
    anchor: [-1.9, -2.1, 0.65],
    inlet: [2.02, -1.55, 0.28],
    outlet: [2.25, -2.85, -0.12],
    width: 0.78,
    sweep: [
      [2.02, -1.55, 0.28],
      [1.72, -2.18, 0.05],
      [2.02, -2.66, -0.08],
      [2.25, -2.85, -0.12],
    ],
  },
  {
    id: "analysis",
    position: [4.62, -1.18, 0.18],
    anchor: [6.18, -1.82, 0.6],
    inlet: [4.62, -1.18, 0.18],
    outlet: [5.28, -2.75, -0.15],
    width: 0.58,
    sweep: [
      [4.62, -1.18, 0.18],
      [5.15, -1.65, 0.06],
      [5.5, -2.5, -0.15],
    ],
  },
  {
    id: "scraper",
    position: [1.55, -3.6, -0.7],
    anchor: [3.4, -4.08, -0.45],
    inlet: [1.55, -3.6, -0.7],
    outlet: [2.7, -4.45, -0.95],
    width: 0.45,
    sweep: [
      [1.55, -3.6, -0.7],
      [1.4, -4.0, -0.8],
      [1.85, -4.45, -0.95],
    ],
  },
];
export const colors = {
  mint: "#b9efdb",
  copper: "#efab75",
  red: "#ff625b",
  bone: "#ede9df",
  brass: "#ecc28a",
};
export const parentIndexes = [-1, 0, 0, 1, 1, 3] as const;
export const blockLevels = [0, 0, 0, 1, 1, 2] as const;
export const missionSweep: V[] = [
  [3.3, 2.05, 0.7],
  [1.3, 2, 1],
  [0.45, 0.8, 1.35],
  [0.8, -0.7, 1.4],
  [2.2, -1.25, 1.1],
  [3.45, -0.55, 0.7],
];
export const missionFunding: V[] = [
  [0.8, 3.5, 1.5],
  [0.65, 2.75, 1.5],
  [1.15, 2.1, 1.38],
  [1.4, 1.6, 1.4],
];
export const submissionSweeps: V[][] = [0, 1, 2].map((i) => [
  [3.55, 1.75 - i * 1.5, 0.65 - i * 0.2],
  [4.9, 1.75 - i * 1.5, 0.65 - i * 0.2],
  [6.4, 0.7 - i * 0.5, 0.35],
  [7.45, 0.35 - i * 0.17, 0.35],
]);
export const verifierSweeps: V[][] = [
  [
    [-0.18, -0.9, 0],
    [-0.58, -0.6, 0],
    [-0.58, 1.65, 0],
    [0.08, 2, 0],
  ],
  [
    [0.18, -0.9, 0],
    [0.6, -1.23, 0],
    [0.6, -2.05, 0],
    [1.6, -2.05, 0],
  ],
];
export const settlementSweep: V[] = [
  [7.8, 0.2, 0.65],
  [8.75, 0.05, 0.7],
  [9.4, -0.65, 0.8],
  [9.2, -1.65, 0.8],
  [8.6, -2.25, 0.65],
];
