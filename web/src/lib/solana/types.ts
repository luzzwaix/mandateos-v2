import type { BN } from "@coral-xyz/anchor";
import type {
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";

export interface SigningWallet {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(
    tx: T,
  ): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[],
  ): Promise<T[]>;
}
export interface OrganizationAccount {
  authority: PublicKey;
  mint: PublicKey;
  vault: PublicKey;
  rootMandate: PublicKey;
  organizationId: BN;
  maxDepth: number;
  totalFunded: BN;
  totalSpent: BN;
  totalReclaimed: BN;
}
export interface MandateAccount {
  organization: PublicKey;
  parent: PublicKey;
  controller: PublicKey;
  depth: number;
  status: { active?: object; revoked?: object };
  selfAvailable: BN;
  subtreeRemaining: BN;
  initialBudget: BN;
  directSpent: BN;
  nextChildIndex: BN;
  childIndex: BN;
}
export interface BountyAccount {
  organization: PublicKey;
  creator: PublicKey;
  verifier: PublicKey;
  bountyId: BN;
  reward: BN;
  status: { open?: object; settled?: object };
  winner: PublicKey;
  submissionCount: number;
  createdAt: BN;
  settledAt: BN;
}
export interface SubmissionAccount {
  bounty: PublicKey;
  agent: PublicKey;
  resultHash: number[];
  submittedAt: BN;
}
export interface ChainRow<T> {
  publicKey: PublicKey;
  account: T;
}
export interface Snapshot {
  address: PublicKey;
  organization: OrganizationAccount;
  nodes: ChainRow<MandateAccount>[];
  bounties: ChainRow<BountyAccount>[];
  submissions: ChainRow<SubmissionAccount>[];
  decimals: number;
  vaultBalance: bigint;
}
export interface Activity {
  slot?: number;
  fee?: number;
  occurredAt?: number;
  entity?: string;
  signature?: string;
  title: string;
  detail: string;
  status: "confirmed" | "rejected" | "pending";
  time: string;
  logs?: string[];
}
export interface CapitalTransition {
  key: number;
  kind: "delegate" | "revoke" | "settle" | "spend" | "reclaim";
  target: string;
  parent?: string;
  descendants: string[];
  amount: string;
  signature?: string;
}
export interface TransactionState {
  phase:
    | "idle"
    | "working"
    | "awaiting-signature"
    | "submitting"
    | "pending"
    | "confirmed"
    | "unknown"
    | "error";
  title: string;
  signature?: string;
  message?: string;
  slot?: number;
}
export type TransactionObserver = (
  progress: Pick<TransactionState, "phase" | "signature" | "slot"> & {
    lastValidBlockHeight?: number;
  },
) => void;
