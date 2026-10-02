import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import idl from "./mandateos.json";
import type { SigningWallet } from "./types";

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
export const PROGRAM_ADDRESS =
  process.env.NEXT_PUBLIC_MANDATEOS_PROGRAM_ID ||
  "CvRjAHwEQbawsH5otEPDjD7dp8S89yWrqano6XSatf63";
export const DEVNET_GENESIS = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
export const NETWORK = "DEVNET";
export const IS_LOCAL = false;
export const LOCAL_DEMO = false;
export const REQUIRED_INSTRUCTIONS = [
  "create_root",
  "reserve_child",
  "spend",
  "revoke_branch",
  "reclaim_budget",
] as const;
export const IDL_COMPATIBLE =
  idl.address === PROGRAM_ADDRESS &&
  REQUIRED_INSTRUCTIONS.every((name) =>
    idl.instructions.some((i) => i.name === name),
  );
export function assertCompatibleIdl() {
  if (!IDL_COMPATIBLE)
    throw new Error(
      "Transaction disabled: the checked-in IDL does not match the requested Devnet program and its five instructions. A matching public IDL and account adapter are required.",
    );
}
export function connection() {
  return new Connection(RPC_URL, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 45_000,
  });
}
export function programFor(wallet?: SigningWallet) {
  const rpc = connection();
  if (!wallet) return new Program(idl as Idl, { connection: rpc });
  return new Program(
    idl as Idl,
    new AnchorProvider(rpc, wallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    }),
  );
}
export function explorer(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}
