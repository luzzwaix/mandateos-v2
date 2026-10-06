import { Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";
import type { SigningWallet } from "./types";

export function keypairWallet(pair: Keypair): SigningWallet {
  const sign = async <T extends Transaction | VersionedTransaction>(tx: T) => {
    // Root CLI and web dependencies can load separate web3.js module instances.
    if ("partialSign" in tx) tx.partialSign(pair);
    else tx.sign([pair]);
    return tx;
  };
  return {
    publicKey: pair.publicKey,
    signTransaction: sign,
    signAllTransactions: (txs) => Promise.all(txs.map(sign)),
  };
}
interface InjectedWallet extends SigningWallet {
  isPhantom?: boolean;
  connect(): Promise<{ publicKey: SigningWallet["publicKey"] }>;
  disconnect(): Promise<void>;
  on?(event: string, callback: () => void): void;
  removeListener?(event: string, callback: () => void): void;
}
declare global {
  interface Window {
    solana?: InjectedWallet;
    phantom?: { solana?: InjectedWallet };
    solflare?: InjectedWallet;
  }
}
export async function connectWallet(preference: "Phantom" | "Solflare") {
  const adapter =
    preference === "Phantom"
      ? (window.phantom?.solana ??
        (window.solana?.isPhantom ? window.solana : undefined))
      : window.solflare;
  if (!adapter)
    throw new Error(`Install ${preference}, then refresh this page`);
  const result = await adapter.connect();
  return {
    adapter,
    wallet: {
      publicKey: result.publicKey,
      signTransaction: adapter.signTransaction.bind(adapter),
      signAllTransactions: adapter.signAllTransactions.bind(adapter),
    } as SigningWallet,
  };
}
