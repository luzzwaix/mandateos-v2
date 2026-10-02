import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "./mandateos.json";
import type { SigningWallet } from "./types";

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "http://127.0.0.1:8899";
export const PROGRAM_ADDRESS =
  process.env.NEXT_PUBLIC_MANDATEOS_PROGRAM_ID || idl.address;
const hostname = new URL(RPC_URL).hostname;
export const IS_LOCAL = ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
export const NETWORK = IS_LOCAL
  ? "LOCALNET"
  : hostname === "api.devnet.solana.com"
    ? "DEVNET"
    : "CUSTOM RPC";
export const LOCAL_DEMO =
  IS_LOCAL && process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEMO === "true";
export function connection() {
  return new Connection(RPC_URL, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 45_000,
  });
}
export function programFor(wallet?: SigningWallet) {
  const rpc = connection();
  if (!wallet)
    return new Program(
      { ...idl, address: new PublicKey(PROGRAM_ADDRESS).toBase58() } as Idl,
      { connection: rpc },
    );
  return new Program(
    { ...idl, address: new PublicKey(PROGRAM_ADDRESS).toBase58() } as Idl,
    new AnchorProvider(rpc, wallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    }),
  );
}
export function explorer(signature: string) {
  const cluster = NETWORK === "DEVNET" ? "devnet" : "custom";
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}${cluster === "custom" ? `&customUrl=${encodeURIComponent(RPC_URL)}` : ""}`;
}
