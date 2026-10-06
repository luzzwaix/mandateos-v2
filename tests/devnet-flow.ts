import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";
import { homedir } from "node:os";
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
  getMint,
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
import type {
  SigningWallet,
  TransactionObserver,
} from "../web/src/lib/solana/types";
import { estimateCanonicalFlow } from "./devnet-budget";

let captureFailure: ((error: unknown) => void) | undefined;

// Disposable Devnet verification only. --wallet accepts an existing dedicated
// test wallet only within MandateOS's private directory outside the repository.
async function main() {
  const probe = new MandateClient();
  const slot = await probe.verifyDeployment(); // Abort before creating keys if undeployed/mismatched.
  const run = `lifecycle-${Date.now()}`;
  const directory = resolve("artifacts", "devnet-release", run);
  mkdirSync(directory, { recursive: true });
  const privateRoot = resolve(
    process.env.LOCALAPPDATA ?? homedir(),
    "MandateOS",
    "devnet-private",
  );
  const privateRelative = relative(resolve(), privateRoot);
  assert(
    privateRelative.startsWith("..") || isAbsolute(privateRelative),
    "Devnet signing material must remain outside the repository",
  );
  const privateDirectory = resolve(privateRoot, run);
  mkdirSync(privateDirectory, { recursive: true });
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
  const walletArgument = process.argv.indexOf("--wallet");
  const walletPath =
    walletArgument < 0 ? undefined : process.argv[walletArgument + 1];
  if (walletArgument >= 0 && !walletPath)
    throw Error("--wallet requires a local path");
  if (walletPath) {
    const child = relative(privateRoot, resolve(walletPath));
    assert(
      child && !child.startsWith("..") && !isAbsolute(child),
      "Use a dedicated Devnet test wallet in the external MandateOS private directory",
    );
  }
  const owner = walletPath
      ? Keypair.fromSecretKey(
          Uint8Array.from(JSON.parse(readFileSync(walletPath, "utf8"))),
        )
      : Keypair.generate(),
    mint = Keypair.generate();
  const controllers = {
    research: Keypair.generate(),
    data: Keypair.generate(),
    scraper: Keypair.generate(),
    operations: Keypair.generate(),
  };
  for (const [name, pair] of Object.entries({ owner, mint, ...controllers })) {
    if (name === "owner" && walletPath) continue; // Never copy an existing signer.
    writeFileSync(
      resolve(privateDirectory, `${name}-keypair.json`),
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
  let lastProgress: Parameters<TransactionObserver>[0] | undefined;
  const observedClient = (signer: SigningWallet, role: string) =>
    new MandateClient(signer, (progress) => {
      lastProgress = progress;
      evidence.push({
        step: "transaction transport observation",
        signer: role,
        phase: progress.phase,
        signature: progress.signature,
        rpcObservationSlot: progress.slot,
      });
      save();
    });
  captureFailure = (error) => {
    const failure =
      error instanceof ProtocolRejection || error instanceof SimulationRejection
        ? {
            result:
              error instanceof ProtocolRejection
                ? "transaction submitted and failed on-chain"
                : "RPC/program simulation rejected before submission",
            signature: error.signature,
            code: error.code,
            logs: error.logs,
            ...(error instanceof ProtocolRejection
              ? { slot: error.slot, feeLamports: error.fee }
              : {}),
          }
        : {
            result:
              "verification stopped; inspect recorded transport observations for submission/confirmation state",
          };
    evidence.push({
      step: "verification stopped",
      ...failure,
      lastTransportObservation: lastProgress,
      message: error instanceof Error ? error.message : String(error),
    });
    save();
  };
  const c = observedClient(wallet, "treasury authority");
  async function receipt(step: string, signature: string) {
    const tx = await c.rpc.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const status = await c.rpc.getSignatureStatus(signature);
    evidence.push({
      step,
      result:
        tx?.meta?.err || status.value?.err
          ? "transaction submitted and failed on-chain"
          : "receipt observation; confirmation checked after persistence",
      signature,
      explorer: explorer(signature),
      slot: tx?.slot ?? status.value?.slot,
      feeLamports: tx?.meta?.fee,
      logs: tx?.meta?.logMessages,
      metaErr: tx?.meta?.err ?? null,
      status,
    });
    save();
    assert(!status.value?.err && !tx?.meta?.err, `${step} failed`);
    assert(
      tx ||
        ["confirmed", "finalized"].includes(
          status.value?.confirmationStatus ?? "",
        ),
      `${step}: confirmation receipt unavailable`,
    );
    evidence[evidence.length - 1].result = "transaction confirmed on Devnet";
    save();
  }
  evidence.push({
    step: "connect dedicated test signer",
    wallet: owner.publicKey.toBase58(),
    network: "Devnet",
    result:
      "genesis and deployed binary verified; dedicated script signer (browser extension connection unverified)",
  });
  save();
  const balance = await c.rpc.getBalance(owner.publicKey);
  evidence.push({ step: "dedicated wallet balance", balanceLamports: balance });
  save();
  const budget = await estimateCanonicalFlow(c.rpc, owner.publicKey);
  const payerRentFloor = budget.rents.find((r) => r.bytes === 0)!.lamports;
  assert(
    balance >=
      budget.rentLamports +
        budget.feeLamports +
        budget.simulationFeeHeadroomLamports +
        payerRentFloor,
    "Dedicated Devnet payer is underfunded for the complete flow; fund it explicitly before retrying",
  );
  evidence.push({
    step: "canonical flow budget checked before submission",
    budget,
  });
  save();
  await receipt(
    "fund controller rent/fees",
    await c.send(
      new Transaction().add(
        ...Object.entries(controllers).map(([role, pair]) =>
          SystemProgram.transfer({
            fromPubkey: owner.publicKey,
            toPubkey: pair.publicKey,
            lamports:
              budget.controllerFunding[role as keyof typeof controllers],
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
  const verifiedMint = await getMint(
    c.rpc,
    mint.publicKey,
    "confirmed",
    TOKEN_PROGRAM_ID,
  );
  assert.equal(verifiedMint.decimals, 6);
  assert.equal(verifiedMint.supply, 1_000_000_000n);
  assert(verifiedMint.mintAuthority?.equals(owner.publicKey));
  assert.equal(verifiedMint.freezeAuthority, null);
  evidence.push({
    step: "verify actual test mint",
    mint: mint.publicKey.toBase58(),
    tokenProgram: TOKEN_PROGRAM_ID.toBase58(),
    decimals: verifiedMint.decimals,
    supplyBaseUnits: verifiedMint.supply.toString(),
    isUSDC: false,
  });
  save();
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
  observe("initialized treasury");
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
  observe("Research delegation read");
  const operations = await c.delegate(
    s,
    row(root),
    controllers.operations.publicKey,
    u(100),
  );
  await receipt("Root to Operations sibling", operations.signature);
  s = await c.load(s.address);
  observe("Operations delegation read");
  const rc = observedClient(keypairWallet(controllers.research), "Research");
  const data = await rc.delegate(
    s,
    row(research.child.toBase58()),
    controllers.data.publicKey,
    u(150),
  );
  await receipt("Research to Data", data.signature);
  s = await c.load(s.address);
  observe("Data delegation read");
  const dc = observedClient(keypairWallet(controllers.data), "Data");
  const scraper = await dc.delegate(
    s,
    row(data.child.toBase58()),
    controllers.scraper.publicKey,
    u(50),
  );
  await receipt("Data to Scraper", scraper.signature);
  s = await c.load(s.address);
  observe("Scraper delegation read");
  const sc = observedClient(keypairWallet(controllers.scraper), "Scraper");
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
      // Preserve the actual preflight error even when the expected-code assertion fails.
      evidence.push({
        step: "descendant rejection observed before assertion",
        result: "RPC/program simulation rejected before submission",
        code: e.code ?? null,
        message: e.message,
        logs: e.logs,
      });
      save();
      assert.equal(e.code, "AncestorRevoked");
      evidence.push({
        step: "attempt descendant spend",
        result: "RPC/program simulation rejected before submission",
        code: e.code,
        message: e.message,
        logs: e.logs,
      });
    } else if (e instanceof ProtocolRejection) {
      evidence.push({
        step: "descendant rejection observed before assertion",
        result: "transaction submitted and failed on-chain",
        signature: e.signature,
        slot: e.slot,
        feeLamports: e.fee,
        code: e.code ?? null,
        message: e.message,
        logs: e.logs,
      });
      save();
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
  const oc = observedClient(
    keypairWallet(controllers.operations),
    "Operations",
  );
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
  captureFailure?.(e);
  console.error(
    `Devnet flow blocked/failed: ${e instanceof Error ? e.message : String(e)}`,
  );
  process.exitCode = 2;
});
