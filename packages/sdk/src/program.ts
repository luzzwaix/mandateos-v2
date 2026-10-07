import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "./mandateos.json";
import type { SigningWallet } from "./types";
import { pacedRpcFetch } from "./rpc";

export const PROGRAM_ADDRESS = idl.address;
export const DEVNET_GENESIS = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
export interface ClientConfig {
  cluster: "devnet";
  rpcUrl: string;
  programId: string | PublicKey;
}
export const REQUIRED_INSTRUCTIONS = [
  "create_organization",
  "deposit",
  "delegate",
  "spend",
  "revoke_branch",
  "reclaim",
  "create_bounty",
  "submit_result",
  "settle_bounty",
] as const;
export function assertCompatibleIdl(config: ClientConfig) {
  if (config.cluster !== "devnet")
    throw new Error("This SDK release supports Devnet only");
  const endpoint = new URL(config.rpcUrl);
  if (!["http:", "https:"].includes(endpoint.protocol))
    throw new Error("RPC URL must use HTTP(S)");
  if (
    new PublicKey(config.programId).toBase58() !== idl.address ||
    !REQUIRED_INSTRUCTIONS.every((name) =>
      idl.instructions.some((i) => i.name === name),
    )
  )
    throw new Error(
      "Transaction disabled: the configured program does not match the source-generated IDL and its nine instructions.",
    );
}
export function connection(config: ClientConfig) {
  assertCompatibleIdl(config);
  return new Connection(config.rpcUrl, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 45_000,
    fetch: pacedRpcFetch,
    disableRetryOnRateLimit: true,
  });
}
export function programFor(
  config: ClientConfig,
  wallet?: SigningWallet,
  rpc?: Connection,
) {
  assertCompatibleIdl(config);
  const transport = rpc ?? connection(config);
  return new Program(
    idl as Idl,
    wallet
      ? new AnchorProvider(transport, wallet, {
          commitment: "confirmed",
          preflightCommitment: "confirmed",
        })
      : { connection: transport },
  );
}
export function explorer(signature: string, config: ClientConfig) {
  assertCompatibleIdl(config);
  return `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=${config.cluster}`;
}
