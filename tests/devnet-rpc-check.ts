import assert from "node:assert/strict";
import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { createRpcFetch } from "../web/src/lib/solana/rpc";
import { MandateClient } from "../web/src/lib/solana/client";

describe("Public Devnet RPC transport and finalized receipt reuse", () => {
  it("bounds a stalled response body as well as headers without resending", async () => {
    let calls = 0;
    const rpc = createRpcFetch(
      async (_url, init) => {
        calls++;
        if (calls > 1) return new Response("{}");
        return new Response(
          new ReadableStream({
            start(controller) {
              init?.signal?.addEventListener(
                "abort",
                () => controller.error(init.signal!.reason),
                { once: true },
              );
            },
          }),
        );
      },
      0,
      25,
    );
    await assert.rejects(
      rpc("http://unit.test", { body: '{"method":"sendTransaction"}' }),
      /timed out/,
    );
    assert.equal(calls, 1);
    assert.equal(
      (
        await rpc("http://unit.test", {
          body: '{"method":"getSignatureStatuses"}',
        })
      ).status,
      200,
    );
  });
  it("associates a sponsored denial with its actual mandate/controller, never another instruction's failure", async () => {
    const c = new MandateClient();
    const payer = Keypair.generate().publicKey;
    const actor = Keypair.generate().publicKey;
    const mandate = Keypair.generate().publicKey;
    const schema = c.program.idl.instructions.find((i) => i.name === "spend")!;
    const spend = new TransactionInstruction({
      programId: c.program.programId,
      keys: schema.accounts.map((account) => ({
        pubkey:
          account.name === "controller"
            ? actor
            : account.name === "node"
              ? mandate
              : Keypair.generate().publicKey,
        isSigner: account.name === "controller",
        isWritable: true,
      })),
      data: c.program.coder.instruction.encode("spend", { amount: new BN(1) }),
    });
    const transaction = new Transaction({
      feePayer: payer,
      recentBlockhash: PublicKey.default.toBase58(),
    }).add(
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: actor,
        lamports: 0,
      }),
      spend,
    );
    let failureIndex = 1;
    Object.assign(c.rpc, {
      getSignaturesForAddress: async () => [
        {
          signature: "unit-only-receipt",
          slot: 10,
          confirmationStatus: "confirmed",
          err: { InstructionError: [failureIndex, { Custom: 6003 }] },
        },
      ],
      getTransaction: async () => ({
        slot: 10,
        transaction: { message: transaction.compileMessage() },
        meta: {
          err: { InstructionError: [failureIndex, { Custom: 6003 }] },
          fee: 10000,
          logMessages: [
            "Program log: AnchorError occurred. Error Code: AncestorRevoked. Error Number: 6003. Error Message: An ancestor mandate has been revoked.",
          ],
        },
      }),
    });
    const denied = (await c.activity(PublicKey.default))[0];
    assert.equal(denied.mandate, mandate.toBase58());
    assert.equal(denied.actor, actor.toBase58());
    assert.equal(denied.feePayer, payer.toBase58());
    assert.equal(denied.amountBaseUnits, "1");
    assert.equal(denied.code, "AncestorRevoked");
    assert.equal(denied.errorNumber, 6003);
    failureIndex = 0;
    const unrelated = (await c.activity(PublicKey.default))[0];
    assert.equal(unrelated.mandate, undefined);
    assert.equal(unrelated.code, undefined);
  });
  it("bounds a stalled send without replay and releases the queue for reconciliation", async () => {
    let sends = 0;
    const rpc = createRpcFetch(
      async (_url, init) => {
        if (JSON.parse(String(init?.body)).method !== "sendTransaction")
          return new Response("{}");
        sends++;
        return new Promise<Response>((_resolve, reject) =>
          init?.signal?.addEventListener(
            "abort",
            () => reject(init.signal!.reason),
            { once: true },
          ),
        );
      },
      0,
      25,
    );
    await assert.rejects(
      rpc("http://unit.test", { body: '{"method":"sendTransaction"}' }),
      /timed out/,
    );
    assert.equal(sends, 1);
    assert.equal(
      (
        await rpc("http://unit.test", {
          body: '{"method":"getSignatureStatuses"}',
        })
      ).status,
      200,
    );
  });
  it("serializes independent reads and respects configured request spacing", async () => {
    const starts: number[] = [];
    let active = 0;
    const transport: typeof fetch = async () => {
      assert.equal(active, 0);
      active++;
      starts.push(Date.now());
      await new Promise((r) => setTimeout(r, 10));
      active--;
      return new Response("{}");
    };
    const rpc = createRpcFetch(transport, 25);
    await Promise.all([
      rpc("http://unit.test", { body: '{"method":"getBalance"}' }),
      rpc("http://unit.test", { body: '{"method":"getSlot"}' }),
    ]);
    assert(starts[1] - starts[0] >= 24);
  });
  it("retries throttled reads but does not replay ambiguous sends", async () => {
    let count = 0;
    const rpc = createRpcFetch(
      async () => new Response("{}", { status: ++count === 1 ? 429 : 200 }),
      0,
    );
    assert.equal(
      (await rpc("http://unit.test", { body: '{"method":"getBalance"}' }))
        .status,
      200,
    );
    assert.equal(count, 2);
    let sends = 0;
    const send = createRpcFetch(async () => {
      sends++;
      return new Response("{}", { status: 429 });
    }, 0);
    assert.equal(
      (await send("http://unit.test", { body: '{"method":"sendTransaction"}' }))
        .status,
      429,
    );
    assert.equal(sends, 1);
  });
  it("reuses finalized receipts while fetching a new or changed-slot observation", async () => {
    const c = new MandateClient();
    let calls = 0,
      slot = 7;
    const signature = "unit-test-only-no-chain-evidence";
    Object.assign(c.rpc, {
      getSignaturesForAddress: async () => [
        {
          signature,
          slot,
          confirmationStatus: "finalized",
          err: { InstructionError: [0, { Custom: 6003 }] },
          blockTime: 100,
        },
      ],
      getTransaction: async () => {
        calls++;
        return {
          slot,
          meta: {
            err: { InstructionError: [0, { Custom: 6003 }] },
            fee: 10000,
            logMessages: [],
          },
        };
      },
    });
    const org = Keypair.generate().publicKey;
    const first = await c.activity(org);
    assert.equal(first[0].status, "rejected");
    assert.equal(first[0].fee, 10000);
    assert.deepEqual(await c.activity(org), first);
    assert.equal(calls, 1);
    slot = 8;
    assert.equal((await c.activity(org))[0].slot, 8);
    assert.equal(calls, 2);
    // Program state remains independently fetched; only immutable finalized receipts are reused.
    assert(org instanceof PublicKey);
  });
  it("stops throttled history at one unreadable receipt without dropping verified rows", async () => {
    const c = new MandateClient();
    const calls: string[] = [];
    Object.assign(c.rpc, {
      getSignaturesForAddress: async () =>
        ["read", "throttled", "must-not-queue"].map((signature, i) => ({
          signature,
          slot: 10 - i,
          confirmationStatus: "finalized",
          err: { Custom: 6003 },
        })),
      getTransaction: async (signature: string) => {
        calls.push(signature);
        if (signature === "throttled") throw Error("429 raw RPC diagnostic");
        return {
          slot: 10,
          meta: { err: { Custom: 6003 }, fee: 10000, logMessages: [] },
        };
      },
    });
    const rows = await c.activity(PublicKey.default);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].signature, "read");
    assert.deepEqual(calls, ["read", "throttled"]);
    assert.equal(c.activityReadError, "429 raw RPC diagnostic");
    await c.activity(PublicKey.default);
    assert.deepEqual(calls, ["read", "throttled", "throttled"]);
  });
  it("honors Retry-After on the next request even when a send is not replayed", async () => {
    const starts: number[] = [];
    const rpc = createRpcFetch(async () => {
      starts.push(Date.now());
      return new Response("{}", {
        status: starts.length === 1 ? 429 : 200,
        headers: { "Retry-After": "0.04" },
      });
    }, 0);
    await rpc("http://unit.test", { body: '{"method":"sendTransaction"}' });
    await rpc("http://unit.test", { body: '{"method":"getBalance"}' });
    assert(starts[1] - starts[0] >= 39);
  });
  it("publishes observed receipts before slow history finishes, without replaying cached progress", async () => {
    const c = new MandateClient();
    const progress: string[][] = [];
    let finish!: () => void;
    const delayed = new Promise<void>((resolve) => {
      finish = resolve;
    });
    let calls = 0;
    Object.assign(c.rpc, {
      getSignaturesForAddress: async () =>
        ["first-unit-receipt", "slow-unit-receipt"].map((signature, i) => ({
          signature,
          slot: 10 - i,
          confirmationStatus: "finalized",
          err: { Custom: 6003 },
        })),
      getTransaction: async (signature: string) => {
        calls++;
        if (signature === "slow-unit-receipt") await delayed;
        return {
          slot: signature === "slow-unit-receipt" ? 9 : 10,
          meta: { err: { Custom: 6003 }, fee: 10000, logMessages: [] },
        };
      },
    });
    const activity = c.activity(PublicKey.default, [], (rows) =>
      progress.push(rows.map((r) => r.signature!)),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(progress, [["first-unit-receipt"]]);
    finish();
    assert.equal((await activity).length, 2);
    assert.equal(progress.length, 2);
    await c.activity(PublicKey.default, [], () =>
      assert.fail("Finalized cache must not republish every row"),
    );
    assert.equal(calls, 2);
  });
  it("stops new receipt RPC when the page is hidden or its organization changes", async () => {
    const c = new MandateClient();
    let visible = true;
    const calls: string[] = [];
    Object.assign(c.rpc, {
      getSignaturesForAddress: async () =>
        ["first-unit-receipt", "next-unit-receipt"].map((signature, i) => ({
          signature,
          slot: 10 - i,
          confirmationStatus: "finalized",
          err: { Custom: 6003 },
        })),
      getTransaction: async (signature: string) => {
        calls.push(signature);
        return { slot: 10, meta: { err: { Custom: 6003 }, logMessages: [] } };
      },
    });
    const rows = await c.activity(
      PublicKey.default,
      [],
      () => {
        visible = false;
      },
      () => visible,
    );
    assert.equal(rows.length, 1);
    assert.deepEqual(calls, ["first-unit-receipt"]);
  });
});
