import type { Connection } from "@solana/web3.js";
import {
  PROGRAM_ADDRESS as SOURCE_PROGRAM_ADDRESS,
  assertCompatibleIdl as assertProtocolIdl,
  connection as protocolConnection,
  programFor as protocolProgram,
  explorer as protocolExplorer,
  type ClientConfig,
} from "../../../../packages/sdk/src/program";
import type { SigningWallet } from "./types";
export {
  DEVNET_GENESIS,
  REQUIRED_INSTRUCTIONS,
} from "../../../../packages/sdk/src/program";

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
export const PROGRAM_ADDRESS =
  process.env.NEXT_PUBLIC_MANDATEOS_PROGRAM_ID || SOURCE_PROGRAM_ADDRESS;
export const NETWORK = "DEVNET";
export const IS_LOCAL = false;
export const LOCAL_DEMO = false;
export function clientConfig(): ClientConfig {
  return { cluster: "devnet", rpcUrl: RPC_URL, programId: PROGRAM_ADDRESS };
}
export const IDL_COMPATIBLE = (() => {
  try {
    assertProtocolIdl(clientConfig());
    return true;
  } catch {
    return false;
  }
})();
export function assertCompatibleIdl() {
  assertProtocolIdl(clientConfig());
}
export function connection() {
  return protocolConnection(clientConfig());
}
export function programFor(wallet?: SigningWallet, rpc?: Connection) {
  return protocolProgram(clientConfig(), wallet, rpc);
}
export function explorer(signature: string) {
  return protocolExplorer(signature, clientConfig());
}
