import assert from "node:assert/strict";
import { Connection, PublicKey, type Message } from "@solana/web3.js";
import { estimateCanonicalFlow } from "./devnet-budget";
import { DEVNET_GENESIS } from "../web/src/lib/solana/program";

const payer = new PublicKey("3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm");
describe("Read-only canonical funding plan (RPC stubs)", () => {
  it("rejects a different genesis before requesting rents or fees", async () => {
    const rpc = {
      getGenesisHash: async () => "wrong-network",
    } as unknown as Connection;
    await assert.rejects(estimateCanonicalFlow(rpc, payer), /Devnet required/);
  });
  it("funds nested controllers and covers the complete flow when RPC fees rise", async () => {
    const calls: Message[] = [];
    const rpc = {
      getGenesisHash: async () => DEVNET_GENESIS,
      getSlot: async () => 123,
      getMinimumBalanceForRentExemption: async (bytes: number) =>
        128_000 + bytes * 10,
      getLatestBlockhash: async () => ({
        blockhash: PublicKey.default.toBase58(),
      }),
      getFeeForMessage: async (message: Message) => {
        calls.push(message);
        return {
          context: { slot: 123 },
          value: message.header.numRequiredSignatures * 7_000,
        };
      },
      // No signer, send, simulate or airdrop API is available in this stub.
    } as unknown as Connection;
    const plan = await estimateCanonicalFlow(rpc, payer);
    assert.equal(calls.length, 12);
    assert.equal(plan.feeLamports, 91_000);
    for (const role of ["research", "data"] as const)
      assert.equal(plan.controllerFunding[role] - 129_550 - 7_000, 128_000);
    assert.equal(plan.simulationFeeHeadroomLamports, 7_000);
    assert.equal(plan.controllerFunding.scraper - 7_000, 128_000 + 7_000);
    assert.equal(plan.controllerFunding.operations - 7_000, 128_000);
    const funded = Object.values(plan.controllerFunding).reduce(
      (a, b) => a + b,
      0,
    );
    const nestedRentAndFees = 2 * 129_550 + 4 * 7_000;
    assert.equal(funded - nestedRentAndFees, 4 * 128_000 + 7_000);
    assert.equal(plan.rentLamports, 1_807_230);
  });
});
