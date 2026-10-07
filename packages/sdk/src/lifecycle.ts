import type { ProtocolError } from "./errors";

// A signing transport failure is not evidence that the user declined.
export function isWalletRejection(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 4001
  );
}

export type TransactionOutcome<T> =
  | { kind: "confirmed-success"; value: T; signature: string; slot: number }
  | {
      kind: "simulation-rejection";
      logs: string[];
      error: string;
      protocol?: ProtocolError;
    }
  | { kind: "wallet-rejection"; error: string }
  | {
      kind: "on-chain-failure";
      signature: string;
      slot?: number;
      fee?: number;
      logs: string[];
      error: string;
      protocol?: ProtocolError;
    }
  | {
      kind: "unknown";
      signature: string;
      lastValidBlockHeight: number;
      error: string;
    }
  | { kind: "client-rejection"; error: string };
