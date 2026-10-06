import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { BN } from "@coral-xyz/anchor";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createInitializeMintInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  getAccount,
} from "@solana/spl-token";
import {
  MandateClient,
  ProtocolRejection,
  SimulationRejection,
} from "../web/src/lib/solana/client";
import { keypairWallet } from "../web/src/lib/solana/wallet";
import {
  explorer,
  PROGRAM_ADDRESS,
  RPC_URL,
} from "../web/src/lib/solana/program";
import { fromSnapshot, statusOf } from "../web/src/lib/authority";

// Disposable Devnet verification only. No production wallet input or replacement program ID.
async function main() {
  const probe = new MandateClient();
  const slot = await probe.verifyDeployment(); // Abort before creating keys if undeployed/mismatched.
  const directory = resolve(".localnet", `devnet-${Date.now()}`);
  mkdirSync(directory, { recursive: true });
  const evidence: Record<string, unknown>[] = [];
  const save = () =>
    writeFileSync(
      resolve(directory, "evidence.json"),
      JSON.stringify(
        {
          rpc: RPC_URL,
          program: PROGRAM_ADDRESS,
          verifiedSlot: slot,
          evidence,
        },
        null,
        2,
      ) + "\n",
    );
  const owner = Keypair.generate(),
    mint = Keypair.generate();
  const controllers = {
    research: Keypair.generate(),
    data: Keypair.generate(),
    scraper: Keypair.generate(),
    operations: Keypair.generate(),
  };
  for (const [name, pair] of Object.entries({ owner, mint, ...controllers })) {
    writeFileSync(
      resolve(directory, `${name}-keypair.json`),
      JSON.stringify(Array.from(pair.secretKey)),
      { flag: "wx", mode: 0o600 },
    );
  }
  const wallet = keypairWallet(owner);
  const originalSign = wallet.signTransaction;
  wallet.signTransaction = async (tx) => {
    if (
      "instructions" in tx &&
      tx.instructions.some((i) =>
        i.keys.some((k) => k.isSigner && k.pubkey.equals(mint.publicKey)),
      )
    )
      tx.partialSign(mint);
    return originalSign(tx);
  };
  const c = new MandateClient(wallet);
  async function receipt(step: string, signature: string) {
    const tx = await c.rpc.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const status = await c.rpc.getSignatureStatus(signature);
    assert(!status.value?.err && !tx?.meta?.err, `${step} failed`);
    evidence.push({
      step,
      result: "transaction confirmed on Devnet",
      signature,
      explorer: explorer(signature),
      slot: tx?.slot ?? status.value?.slot,
      feeLamports: tx?.meta?.fee,
      logs: tx?.meta?.logMessages,
    });
    save();
  }
  evidence.push({
    step: "connect dedicated test signer",
    wallet: owner.publicKey.toBase58(),
    network: "Devnet",
    result:
      "genesis and deployed binary verified; browser extension connection tested separately",
  });
  save();
  const funding = await c.rpc.requestAirdrop(owner.publicKey, 2_000_000_000);
  const airdrop = await c.rpc.confirmTransaction(funding, "confirmed");
  assert(!airdrop.value.err);
  await receipt("fund test wallet through Devnet faucet", funding);
  await receipt(
    "fund controller rent/fees",
    await c.send(
      new Transaction().add(
        ...Object.values(controllers).map((pair) =>
          SystemProgram.transfer({
            fromPubkey: owner.publicKey,
            toPubkey: pair.publicKey,
            lamports: 25_000_000,
          }),
        ),
      ),
    ),
  );
  const source = getAssociatedTokenAddressSync(mint.publicKey, owner.publicKey);
  const recipient = Keypair.generate().publicKey;
  const destination = getAssociatedTokenAddressSync(mint.publicKey, recipient);
  const u = (n: number) => new BN(n).mul(new BN(1_000_000));
  const mintTx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: owner.publicKey,
      newAccountPubkey: mint.publicKey,
      lamports: await c.rpc.getMinimumBalanceForRentExemption(MINT_SIZE),
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(mint.publicKey, 6, owner.publicKey, null),
    createAssociatedTokenAccountIdempotentInstruction(
      owner.publicKey,
      source,
      owner.publicKey,
      mint.publicKey,
    ),
    createAssociatedTokenAccountIdempotentInstruction(
      owner.publicKey,
      destination,
      recipient,
      mint.publicKey,
    ),
    createMintToInstruction(
      mint.publicKey,
      source,
      owner.publicKey,
      1_000_000_000n,
    ),
  );
  await receipt(
    "create classic SPL six-decimal test mint (not USDC)",
    await c.send(mintTx),
  );
  const created = await c.createOrganization(mint.publicKey);
  await receipt("initialize treasury", created.signature);
  let s = await c.load(created.organization);
  const row = (id: string) =>
    s.nodes.find((n) => n.publicKey.toBase58() === id)!;
  const root = s.organization.rootMandate.toBase58();
  const observe = (step: string) => {
    const model = fromSnapshot(s, {});
    evidence.push({
      step,
      result: "fresh Devnet account read",
      organization: s.address.toBase58(),
      mint: s.organization.mint.toBase58(),
      vault: s.organization.vault.toBase58(),
      vaultBaseUnits: s.vaultBalance.toString(),
      nodes: model.nodes.map((n) => ({
        pda: n.id,
        parent: n.parent,
        stored: n.local,
        effective: statusOf(model, n.id),
        available: n.available.toString(),
        remaining: n.remaining.toString(),
      })),
    });
    save();
  };
  await receipt(
    "deposit 1000 test tokens",
    await c.deposit(s, u(1000), source),
  );
  s = await c.load(s.address);
  observe("funded treasury");
  const research = await c.delegate(
    s,
    row(root),
    controllers.research.publicKey,
    u(400),
  );
  await receipt("Root to Research", research.signature);
  s = await c.load(s.address);
  const operations = await c.delegate(
    s,
    row(root),
    controllers.operations.publicKey,
    u(100),
  );
  await receipt("Root to Operations sibling", operations.signature);
  s = await c.load(s.address);
  const rc = new MandateClient(keypairWallet(controllers.research));
  const data = await rc.delegate(
    s,
    row(research.child.toBase58()),
    controllers.data.publicKey,
    u(150),
  );
  await receipt("Research to Data", data.signature);
  s = await c.load(s.address);
  const dc = new MandateClient(keypairWallet(controllers.data));
  const scraper = await dc.delegate(
    s,
    row(data.child.toBase58()),
    controllers.scraper.publicKey,
    u(50),
  );
  await receipt("Data to Scraper", scraper.signature);
  s = await c.load(s.address);
  const sc = new MandateClient(keypairWallet(controllers.scraper));
  await receipt(
    "valid Scraper spend 10",
    await sc.spend(s, row(scraper.child.toBase58()), u(10), destination),
  );
  s = await c.load(s.address);
  assert.equal(s.vaultBalance, 990_000_000n);
  assert.equal((await getAccount(c.rpc, destination)).amount, 10_000_000n);
  observe("before revoke");
  await receipt(
    "revoke Research",
    await c.revoke(s, row(research.child.toBase58())),
  );
  s = await c.load(s.address);
  assert.equal(row(root).account.selfAvailable.toString(), "890000000");
  assert.equal(s.vaultBalance, 990_000_000n);
  const model = fromSnapshot(s, {});
  for (const id of [data.child, scraper.child]) {
    assert(row(id.toBase58()).account.status.active);
    assert.equal(statusOf(model, id.toBase58()), "blocked");
  }
  assert.equal(statusOf(model, operations.child.toBase58()), "active");
  observe("descendant lineage after revoke");
  try {
    await sc.spend(s, row(scraper.child.toBase58()), u(1), destination);
    throw new Error("BUG: revoked descendant spend succeeded");
  } catch (e) {
    if (e instanceof SimulationRejection) {
      assert.equal(e.code, "AncestorRevoked");
      evidence.push({
        step: "attempt descendant spend",
        result: "RPC/program simulation rejected before submission",
        code: e.code,
        message: e.message,
        logs: e.logs,
      });
    } else if (e instanceof ProtocolRejection) {
      assert.equal(e.code, "AncestorRevoked");
      evidence.push({
        step: "attempt descendant spend",
        result: "transaction submitted and failed on-chain",
        signature: e.signature,
        explorer: explorer(e.signature),
        slot: e.slot,
        feeLamports: e.fee,
        code: e.code,
        logs: e.logs,
      });
    } else throw e;
    save();
  }
  s = await c.load(s.address);
  assert.equal(s.vaultBalance, 990_000_000n);
  const oc = new MandateClient(keypairWallet(controllers.operations));
  await receipt(
    "Operations valid spend 5 after Research revoke",
    await oc.spend(s, row(operations.child.toBase58()), u(5), destination),
  );
  s = await c.load(s.address);
  assert.equal(s.vaultBalance, 985_000_000n);
  assert.equal(
    row(operations.child.toBase58()).account.selfAvailable.toString(),
    "95000000",
  );
  observe("unaffected sibling operational");
  await receipt(
    "reclaim only Root available 890",
    await c.reclaim(s, u(890), source),
  );
  s = await c.load(s.address);
  assert.equal(row(root).account.selfAvailable.toString(), "0");
  assert.equal(row(root).account.subtreeRemaining.toString(), "95000000");
  assert.equal(s.vaultBalance, 95_000_000n);
  assert.equal(s.organization.totalReclaimed.toString(), "890000000");
  observe("reclaim preserves Operations reservation");
  console.log(
    `Core Devnet flow passed. Public evidence: ${resolve(directory, "evidence.json")}`,
  );
}
main().catch((e: unknown) => {
  console.error(
    `Devnet flow blocked/failed: ${e instanceof Error ? e.message : String(e)}`,
  );
  process.exitCode = 2;
});
