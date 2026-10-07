import { MandateClient as ProtocolClient } from "../../../../packages/sdk/src/client";
import type { Connection } from "@solana/web3.js";
import type { SigningWallet, TransactionObserver } from "./types";
import { clientConfig, connection } from "./program";
export {
  ProtocolRejection,
  SimulationRejection,
  instructionTransaction,
} from "../../../../packages/sdk/src/client";

// UI environment adapter; protocol implementation lives only in the SDK.
export class MandateClient extends ProtocolClient {
  constructor(
    wallet?: SigningWallet,
    observe?: TransactionObserver,
    rpc?: Connection,
  ) {
    super(clientConfig(), wallet, observe, rpc ?? connection());
  }
}
