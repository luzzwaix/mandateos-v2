import assert from "node:assert/strict";
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import {
  Connection,
  Keypair,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { AnchorError, utils } from "@coral-xyz/anchor";
const bs58 = utils.bytes.bs58;
import {
  DEVNET_GENESIS,
  RPC_URL,
  explorer,
} from "../web/src/lib/solana/program";

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
export function retryAfter(value: string | null, now = Date.now()) {
  if (!value) return 0;
  if (/^\d+(\.\d+)?$/.test(value.trim()))
    return Math.ceil(Number(value) * 1000);
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed - now) : 0;
}
export function requireAncestorFailure(value: {
  err: unknown;
  logs?: string[] | null;
}) {
  assert.deepEqual(value.err, { InstructionError: [0, { Custom: 6003 }] });
  assert.equal(
    AnchorError.parse(value.logs ?? [])?.error.errorCode.code,
    "AncestorRevoked",
  );
}
type Entry = Record<string, any>;

// CLI evidence transport. Product transactions keep their existing preflight policy.
// All calls, including account fetches issued by Anchor, share one HTTP limiter.
export class EvidenceTransport {
  readonly connection: Connection;
  readonly entries: Record<string, Entry>;
  private queue: Promise<unknown> = Promise.resolve();
  private next = 0;
  constructor(
    readonly directory: string,
    readonly interval = 900,
  ) {
    mkdirSync(directory, { recursive: true });
    const file = join(directory, "checkpoint.json");
    this.entries = (() => {
      try {
        return JSON.parse(readFileSync(file, "utf8"));
      } catch (e: any) {
        if (e.code !== "ENOENT") throw e;
        return {};
      }
    })();
    this.connection = new Connection(RPC_URL, {
      commitment: "finalized",
      disableRetryOnRateLimit: true,
      fetch: (url, init) => {
        const task = this.queue.then(async () => {
          assert.equal(String(url), "https://api.devnet.solana.com");
          const request = JSON.parse(String(init?.body));
          for (let attempt = 0; attempt < 5; attempt++) {
            await delay(Math.max(0, this.next - Date.now()));
            const started = Date.now();
            this.next = started + interval;
            let response: Response;
            try {
              response = await fetch(url, {
                ...init,
                signal: AbortSignal.timeout(20_000),
              });
            } catch (error) {
              this.log({
                kind: "rpc-transport-error",
                method: request.method,
                started,
                attempt,
                error: String(error),
              });
              // Any send error is ambiguous: reconciliation owns all forwarding.
              if (request.method === "sendTransaction" || attempt === 4)
                throw error;
              this.next = Math.max(
                this.next,
                Date.now() + 5000 * (attempt + 1),
              );
              continue;
            }
            const body = await response.clone().text();
            let parsed: any;
            try {
              parsed = JSON.parse(body);
            } catch {
              /* preserve raw body */
            }
            const wait = retryAfter(response.headers.get("retry-after"));
            this.next = Math.max(this.next, Date.now() + wait);
            this.log({
              kind: "rpc-response",
              method: request.method,
              started,
              attempt,
              httpStatus: response.status,
              headers: Object.fromEntries(response.headers),
              rawBody: body,
            });
            if (
              request.method !== "sendTransaction" &&
              attempt < 4 &&
              (response.status === 429 ||
                response.status >= 500 ||
                parsed?.error?.code === -32005)
            ) {
              this.next = Math.max(
                this.next,
                Date.now() + 5000 * (attempt + 1),
              );
              continue;
            }
            return response;
          }
          throw Error("Bounded read retries exhausted");
        });
        this.queue = task.catch(() => {});
        return task;
      },
    });
  }
  log(event: Entry) {
    appendFileSync(
      join(this.directory, "rpc.jsonl"),
      JSON.stringify({ time: new Date().toISOString(), ...event }) + "\n",
    );
  }
  save(step: string, patch: Entry) {
    this.entries[step] = { ...this.entries[step], ...patch };
    writeFileSync(
      join(this.directory, "checkpoint.json"),
      JSON.stringify(this.entries, null, 2) + "\n",
    );
  }
  async genesis() {
    assert.equal(await this.connection.getGenesisHash(), DEVNET_GENESIS);
  }
  async execute(
    step: string,
    tx: Transaction,
    signers: Keypair[],
    expectedAncestorFailure = false,
  ) {
    await this.genesis();
    let entry = this.entries[step];
    if (!entry?.signature) {
      const latest = await this.connection.getLatestBlockhash("confirmed");
      tx.feePayer = signers[0].publicKey;
      tx.recentBlockhash = latest.blockhash;
      const quote = await this.connection.getFeeForMessage(
        tx.compileMessage(),
        "confirmed",
      );
      const balance = await this.connection.getBalance(
        signers[0].publicKey,
        "confirmed",
      );
      const floor = await this.connection.getMinimumBalanceForRentExemption(0);
      this.save(step, {
        phase: "before-signing",
        feePayer: tx.feePayer.toBase58(),
        signerPublicKeys: signers.map((k) => k.publicKey.toBase58()),
        quote,
        payerBalance: balance,
        rentFloor: floor,
        expectedAncestorFailure,
        latest,
      });
      assert(
        quote.value !== null && balance >= floor + quote.value,
        "Payer has no fee headroom",
      );
      tx.sign(...signers);
      assert(tx.verifySignatures());
      const wire = tx.serialize();
      const signature = bs58.encode(tx.signature!);
      const publicWireFile = join(this.directory, `${signature}.bin`);
      writeFileSync(publicWireFile, wire, { flag: "wx" });
      this.save(step, {
        phase: "signed-not-submitted",
        signature,
        publicWireFile,
        wireSha256: createHash("sha256").update(wire).digest("hex"),
        signingIntents: 1,
      });
      // Simulation and receipt are durably saved before any assertion.
      // The legacy web3 overload replaces blockhash; simulate the saved exact wire instead.
      const simulation = await this.connection.simulateTransaction(
        VersionedTransaction.deserialize(wire),
        {
          sigVerify: true,
          commitment: "confirmed",
          replaceRecentBlockhash: false,
        },
      );
      this.save(step, { simulation });
      if (expectedAncestorFailure) requireAncestorFailure(simulation.value);
      else
        assert.equal(
          simulation.value.err,
          null,
          `${step}: simulation rejected before submission`,
        );
      entry = this.entries[step];
    }
    assert.equal(entry.expectedAncestorFailure, expectedAncestorFailure);
    assert(
      entry.simulation,
      "Saved simulation required before submission/recovery",
    );
    if (expectedAncestorFailure) requireAncestorFailure(entry.simulation.value);
    else assert.equal(entry.simulation.value.err, null);
    const wire = readFileSync(entry.publicWireFile);
    assert.equal(
      createHash("sha256").update(wire).digest("hex"),
      entry.wireSha256,
    );
    assert.equal(
      bs58.encode(Transaction.from(wire).signature!),
      entry.signature,
    );
    let lastForward = 0;
    const deadline = Date.now() + 180_000;
    while (Date.now() < deadline) {
      const statuses = await this.connection.getSignatureStatuses(
        [entry.signature],
        { searchTransactionHistory: true },
      );
      const status = statuses.value[0];
      this.save(step, { statusObservation: statuses });
      if (status?.confirmationStatus === "finalized") {
        const receipt = await this.connection.getTransaction(entry.signature, {
          commitment: "finalized",
          maxSupportedTransactionVersion: 0,
        });
        this.save(step, {
          phase: "finalized",
          receipt,
          explorer: explorer(entry.signature),
        });
        if (!receipt?.meta) {
          await delay(1000);
          continue;
        }
        if (expectedAncestorFailure)
          requireAncestorFailure({
            err: receipt.meta.err,
            logs: receipt.meta.logMessages,
          });
        else assert.equal(receipt.meta.err, null, `${step} failed on-chain`);
        this.save(step, { verified: true });
        console.log(
          `${step}: finalized slot ${receipt.slot}, fee ${receipt.meta.fee}, signature ${entry.signature}`,
        );
        return receipt;
      }
      if (!status) {
        const height = await this.connection.getBlockHeight("confirmed");
        this.save(step, { reconciliationHeight: height });
        if (height > entry.latest.lastValidBlockHeight) {
          this.save(step, { phase: "expired-unresolved" });
          throw Error(
            `${step}: expired with absent history status; reconcile account state before any new signature`,
          );
        }
        if (Date.now() - lastForward >= 20_000) {
          this.save(step, {
            phase: "forwarding-identical-wire",
            forwards: (this.entries[step].forwards ?? 0) + 1,
            skipPreflight: expectedAncestorFailure,
            preflightException: expectedAncestorFailure
              ? "User explicitly requested an included failed descendant transaction; saved simulation must be AncestorRevoked/6003"
              : undefined,
          });
          let returned: string | undefined;
          try {
            returned = await this.connection.sendRawTransaction(wire, {
              skipPreflight: expectedAncestorFailure,
              preflightCommitment: "confirmed",
              maxRetries: 0,
            });
            this.save(step, { returnedSignature: returned, phase: "pending" });
          } catch (error) {
            this.save(step, {
              sendError: String(error),
              phase: "ambiguous-send-reconciling",
            });
          }
          if (returned !== undefined) assert.equal(returned, entry.signature);
          lastForward = Date.now();
        }
      }
      await delay(1000);
    }
    this.save(step, { phase: "timeout-unresolved" });
    throw Error(
      `${step}: unresolved signature ${entry.signature}; no fresh signing`,
    );
  }
}
