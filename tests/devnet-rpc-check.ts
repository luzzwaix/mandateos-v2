import assert from "node:assert/strict";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createRpcFetch } from "../web/src/lib/solana/rpc";
import { MandateClient } from "../web/src/lib/solana/client";

describe("Public Devnet RPC transport and finalized receipt reuse", () => {
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
});
