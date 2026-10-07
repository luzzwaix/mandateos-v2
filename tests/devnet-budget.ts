// Read-only release planning: public keys, unsigned messages and RPC queries only.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { BN, Program, type Idl } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_CLOCK_PUBKEY,
} from "@solana/web3.js";
import {
  MINT_SIZE,
  ACCOUNT_SIZE,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createInitializeMintInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction,
} from "@solana/spl-token";
import idl from "../packages/sdk/src/mandateos.json";
import manifest from "../packages/sdk/src/build-evidence.json";
import {
  organizationPda,
  rootPda,
  vaultPda,
  childPda,
} from "../web/src/lib/solana/pdas";
import { DEVNET_GENESIS } from "../web/src/lib/solana/program";

const RPC = "https://api.devnet.solana.com";
const PAYER = new PublicKey("3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm");
const PROGRAM = new PublicKey("125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd");
const BUFFER = new PublicKey("3QazcRm23Dm4nHeWzifbPxsBWegxrpr1aJrNUGG4Q8UE");
const SENDER = new PublicKey("C7jMtkonHhz14rBojP7FWSE8xbGjKybA5FLmzTmTGLpo");
const LOADER = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");

// Placeholder addresses size the future messages; these are NOT observed accounts.
const placeholder = (label: string) =>
  new PublicKey(createHash("sha256").update(label).digest());
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const sol = (n: number) =>
  `${Math.floor(n / 1e9)}.${(n % 1e9).toString().padStart(9, "0")}`;
const meta = (pubkey: PublicKey, isWritable = false, isSigner = false) => ({
  pubkey,
  isWritable,
  isSigner,
});

async function messageFee(
  rpc: Connection,
  tx: Transaction,
  payer: PublicKey,
  blockhash: string,
) {
  tx.feePayer = payer;
  tx.recentBlockhash = blockhash;
  const message = tx.compileMessage();
  const result = await rpc.getFeeForMessage(message, "confirmed");
  assert(
    result.value !== null,
    "RPC did not return a fee for the current blockhash",
  );
  return {
    lamports: result.value,
    slot: result.context.slot,
    signers: message.header.numRequiredSignatures,
  };
}

export async function estimateCanonicalFlow(rpc: Connection, payer: PublicKey) {
  assert.equal(await rpc.getGenesisHash(), DEVNET_GENESIS, "Devnet required");
  const program = new Program(idl as Idl, { connection: rpc });
  const organizationSize = program.coder.accounts.size("organization");
  const mandateSize = program.coder.accounts.size("mandate");
  assert.equal(organizationSize, 171);
  assert.equal(mandateSize, 155);
  const beforeSlot = await rpc.getSlot("confirmed");
  const rents = await Promise.all(
    [0, MINT_SIZE, mandateSize, ACCOUNT_SIZE, organizationSize].map(
      async (bytes) => ({
        bytes,
        lamports: await rpc.getMinimumBalanceForRentExemption(
          bytes,
          "confirmed",
        ),
      }),
    ),
  );
  const afterSlot = await rpc.getSlot("confirmed");
  const rent = (bytes: number) =>
    rents.find((r) => r.bytes === bytes)!.lamports;
  const blockhash = (await rpc.getLatestBlockhash("confirmed")).blockhash;
  const roles = ["research", "data", "scraper", "operations"] as const;
  const controllers = Object.fromEntries(
    roles.map((r) => [r, placeholder(r)]),
  ) as Record<(typeof roles)[number], PublicKey>;
  const mint = placeholder("test-mint"),
    recipient = placeholder("token-recipient");
  const source = getAssociatedTokenAddressSync(mint, payer);
  const destination = getAssociatedTokenAddressSync(mint, recipient, true);
  const organization = organizationPda(PROGRAM, payer, new BN(1));
  const root = rootPda(PROGRAM, organization),
    vault = vaultPda(PROGRAM, organization);
  const research = childPda(PROGRAM, organization, root, new BN(0));
  const operations = childPda(PROGRAM, organization, root, new BN(1));
  const data = childPda(PROGRAM, organization, research, new BN(0));
  const scraper = childPda(PROGRAM, organization, data, new BN(0));
  const units = (n: number) => new BN(n * 1_000_000);
  const entries: { step: string; payer: PublicKey; tx: Transaction }[] = [];
  async function delegate(
    step: string,
    signer: PublicKey,
    controller: PublicKey,
    parent: PublicKey,
    child: PublicKey,
    amount: number,
    index: number,
    ancestors: PublicKey[],
  ) {
    entries.push({
      step,
      payer: signer,
      tx: await program.methods
        .delegate(controller, units(amount), new BN(index))
        .accountsStrict({
          controller: signer,
          organization,
          parent,
          child,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(ancestors.map((p) => meta(p)))
        .transaction(),
    });
  }
  async function spend(
    step: string,
    signer: PublicKey,
    node: PublicKey,
    amount: number,
    ancestors: PublicKey[],
  ) {
    entries.push({
      step,
      payer: signer,
      tx: await program.methods
        .spend(units(amount))
        .accountsStrict({
          controller: signer,
          organization,
          node,
          mint,
          vault,
          destination,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(ancestors.map((p) => meta(p, true)))
        .transaction(),
    });
  }
  entries.push({
    step: "create test mint and two ATAs",
    payer,
    tx: new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: mint,
        space: MINT_SIZE,
        lamports: rent(MINT_SIZE),
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(mint, 6, payer, null),
      createAssociatedTokenAccountIdempotentInstruction(
        payer,
        source,
        payer,
        mint,
      ),
      createAssociatedTokenAccountIdempotentInstruction(
        payer,
        destination,
        recipient,
        mint,
      ),
      createMintToInstruction(mint, source, payer, 1_000_000_000n),
    ),
  });
  entries.push({
    step: "initialize treasury",
    payer,
    tx: await program.methods
      .createOrganization(new BN(1), 4)
      .accountsStrict({
        authority: payer,
        mint,
        organization,
        root,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .transaction(),
  });
  entries.push({
    step: "deposit test tokens",
    payer,
    tx: await program.methods
      .deposit(units(1000))
      .accountsStrict({
        authority: payer,
        organization,
        root,
        vault,
        mint,
        source,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction(),
  });
  await delegate(
    "Root to Research",
    payer,
    controllers.research,
    root,
    research,
    400,
    0,
    [],
  );
  await delegate(
    "Root to Operations",
    payer,
    controllers.operations,
    root,
    operations,
    100,
    1,
    [],
  );
  await delegate(
    "Research to Data",
    controllers.research,
    controllers.data,
    research,
    data,
    150,
    0,
    [root],
  );
  await delegate(
    "Data to Scraper",
    controllers.data,
    controllers.scraper,
    data,
    scraper,
    50,
    0,
    [research, root],
  );
  await spend("Scraper spend", controllers.scraper, scraper, 10, [
    data,
    research,
    root,
  ]);
  entries.push({
    step: "revoke Research",
    payer,
    tx: await program.methods
      .revokeBranch()
      .accountsStrict({
        revoker: payer,
        organization,
        parent: root,
        target: research,
      })
      .transaction(),
  });
  await spend(
    "Operations spend after revoke",
    controllers.operations,
    operations,
    5,
    [root],
  );
  entries.push({
    step: "reclaim Root available",
    payer,
    tx: await program.methods
      .reclaim(units(890))
      .accountsStrict({
        authority: payer,
        organization,
        root,
        mint,
        vault,
        destination: source,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction(),
  });
  const fees = await Promise.all(
    entries.map(async (e) => ({
      step: e.step,
      ...(await messageFee(rpc, e.tx, e.payer, blockhash)),
    })),
  );
  // A rejected preflight pays no fee, but fee-payer validation still requires
  // fee headroom above rent. The canonical Scraper already paid its first spend.
  const simulationFeeHeadroomLamports = fees.find(
    (fee) => fee.step === "Scraper spend",
  )!.lamports;
  const controllerFunding = Object.fromEntries(
    roles.map((role) => {
      const cost = sum(
        fees
          .filter((_, i) => entries[i].payer.equals(controllers[role]))
          .map((f) => f.lamports),
      );
      return [
        role,
        rent(0) +
          cost +
          (role === "scraper" ? simulationFeeHeadroomLamports : 0) +
          (["research", "data"].includes(role) ? rent(mandateSize) : 0),
      ];
    }),
  ) as Record<(typeof roles)[number], number>;
  fees.unshift({
    step: "fund four controllers",
    ...(await messageFee(
      rpc,
      new Transaction().add(
        ...roles.map((role) =>
          SystemProgram.transfer({
            fromPubkey: payer,
            toPubkey: controllers[role],
            lamports: controllerFunding[role],
          }),
        ),
      ),
      payer,
      blockhash,
    )),
  });
  const deposits = [
    { account: "organization", count: 1, bytes: organizationSize },
    {
      account: "Root + Research + Data + Scraper + Operations",
      count: 5,
      bytes: mandateSize,
    },
    { account: "classic SPL test mint (not USDC)", count: 1, bytes: MINT_SIZE },
    {
      account: "vault + source ATA + recipient ATA",
      count: 3,
      bytes: ACCOUNT_SIZE,
    },
    { account: "four controller System accounts", count: 4, bytes: 0 },
  ].map((r) => ({
    ...r,
    unitLamports: rent(r.bytes),
    totalLamports: r.count * rent(r.bytes),
  }));
  return {
    rentObservationSlots: [beforeSlot, afterSlot],
    rents,
    deposits,
    fees,
    controllerFunding,
    rentLamports: sum(deposits.map((r) => r.totalLamports)),
    feeLamports: sum(fees.map((f) => f.lamports)),
    simulationFeeHeadroomLamports,
    blockedDescendant:
      "expected preflight simulation rejection; no submitted fee, but Scraper retains one quoted fee above rent for simulation admission",
  };
}

async function main() {
  const rpc = new Connection(RPC, {
    commitment: "confirmed",
    disableRetryOnRateLimit: true,
  });
  assert.equal(await rpc.getGenesisHash(), DEVNET_GENESIS);
  const identity = JSON.parse(
    readFileSync(
      resolve("artifacts/devnet-release/identity-local.json"),
      "utf8",
    ),
  );
  assert.equal(identity.program, PROGRAM.toBase58());
  assert.equal(identity.payer, PAYER.toBase58());
  // Only stat signer files. Do not read them to re-derive their keys.
  const privateFiles = Object.fromEntries(
    Object.entries({
      ...identity.files,
      buffer: resolve(dirname(identity.files.payer), "buffer-keypair.json"),
    }).map(([role, path]) => {
      const s = statSync(path as string);
      return [role, { exists: s.isFile(), modifiedAt: s.mtime.toISOString() }];
    }),
  );
  const elf = readFileSync(resolve("target/deploy/mandateos.so"));
  const hash = createHash("sha256").update(elf).digest("hex");
  assert.equal(hash, manifest.sha256);
  assert.equal(elf.length, manifest.byteLength);
  assert.equal(idl.address, PROGRAM.toBase58());
  assert.equal(manifest.address, idl.address);
  assert(
    readFileSync("programs/mandateos/src/lib.rs", "utf8").includes(
      `declare_id!("${idl.address}")`,
    ),
  );
  const anchor = readFileSync("Anchor.toml", "utf8");
  assert(
    anchor.includes(`[programs.devnet]\nmandateos = "${idl.address}"`) ||
      anchor.includes(`[programs.devnet]\r\nmandateos = "${idl.address}"`),
  );
  const [accounts, payerBalance, senderBalance] = await Promise.all([
    rpc.getMultipleAccountsInfoAndContext([PROGRAM, BUFFER], "confirmed"),
    rpc.getBalanceAndContext(PAYER, "confirmed"),
    rpc.getBalanceAndContext(SENDER, "confirmed"),
  ]);
  assert(
    accounts.value.every((a) => a === null),
    "Program or buffer already exists: recompute for its actual state",
  );
  const beforeSlot = await rpc.getSlot("confirmed");
  const [programRent, dataRent, bufferMinimumRent] = await Promise.all(
    [36, 45 + elf.length, 37 + elf.length].map((n) =>
      rpc.getMinimumBalanceForRentExemption(n, "confirmed"),
    ),
  );
  const afterSlot = await rpc.getSlot("confirmed");
  const bh = (await rpc.getLatestBlockhash("confirmed")).blockhash;
  const tag = (n: number, size = 4) => {
    const b = Buffer.alloc(size);
    b.writeUInt32LE(n);
    return b;
  };
  const write = (offset: number, bytes: Buffer) => {
    const header = tag(1, 16);
    header.writeUInt32LE(offset, 4);
    header.writeBigUInt64LE(BigInt(bytes.length), 8);
    return new TransactionInstruction({
      programId: LOADER,
      keys: [meta(BUFFER, true), meta(PAYER, false, true)],
      data: Buffer.concat([header, bytes]),
    });
  };
  const init = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: PAYER,
      newAccountPubkey: BUFFER,
      space: 37 + elf.length,
      lamports: dataRent,
      programId: LOADER,
    }),
    new TransactionInstruction({
      programId: LOADER,
      keys: [meta(BUFFER, true), meta(PAYER)],
      data: tag(0),
    }),
  );
  const empty = new Transaction({ feePayer: PAYER, recentBlockhash: bh })
    .add(write(0, Buffer.alloc(0)))
    .compileMessage();
  const chunkBytes =
    1232 -
    (1 + empty.header.numRequiredSignatures * 64 + empty.serialize().length) -
    1;
  assert.equal(chunkBytes, 1012, "CLI write sizing must be audited again");
  let writes = 0;
  for (let offset = 0; offset < elf.length; offset += chunkBytes)
    if (elf.subarray(offset, offset + chunkBytes).some((byte) => byte !== 0))
      writes++;
  const programData = PublicKey.findProgramAddressSync(
    [PROGRAM.toBuffer()],
    LOADER,
  )[0];
  const deployData = tag(2, 12);
  deployData.writeBigUInt64LE(BigInt(elf.length), 4);
  const final = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: PAYER,
      newAccountPubkey: PROGRAM,
      space: 36,
      lamports: programRent,
      programId: LOADER,
    }),
    new TransactionInstruction({
      programId: LOADER,
      keys: [
        meta(PAYER, true, true),
        meta(programData, true),
        meta(PROGRAM, true),
        meta(BUFFER, true),
        meta(SYSVAR_RENT_PUBKEY),
        meta(SYSVAR_CLOCK_PUBKEY),
        meta(SystemProgram.programId),
        meta(PAYER, false, true),
      ],
      data: deployData,
    }),
  );
  const [initialFee, writeFee, finalFee] = await Promise.all([
    messageFee(rpc, init, PAYER, bh),
    messageFee(
      rpc,
      new Transaction().add(write(0, elf.subarray(0, chunkBytes))),
      PAYER,
      bh,
    ),
    messageFee(rpc, final, PAYER, bh),
  ]);
  const deploymentFees =
    initialFee.lamports + writes * writeFee.lamports + finalFee.lamports;
  const flow = await estimateCanonicalFlow(rpc, PAYER);
  const reserve = 10_000_000;
  const totalRent = programRent + dataRent + flow.rentLamports;
  const totalFees = deploymentFees + flow.feeLamports;
  // Scraper must retain fee headroom for the rejected-action simulation.
  // This is spendable SOL, neither a rent deposit nor a charged transaction fee.
  const required =
    totalRent + totalFees + flow.simulationFeeHeadroomLamports + reserve;
  const transfer = Math.max(0, required - payerBalance.value);
  const transferFee = await messageFee(
    rpc,
    new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: SENDER,
        toPubkey: PAYER,
        lamports: transfer,
      }),
    ),
    SENDER,
    (await rpc.getLatestBlockhash("confirmed")).blockhash,
  );
  assert(
    senderBalance.value >= transfer + transferFee.lamports,
    "Sender cannot fund this total",
  );
  console.log(
    JSON.stringify(
      {
        observedAt: new Date().toISOString(),
        rpc: RPC,
        commitment: "confirmed",
        genesis: DEVNET_GENESIS,
        roles: {
          program: PROGRAM.toBase58(),
          feePayer: PAYER.toBase58(),
          initialUpgradeAuthority: PAYER.toBase58(),
          buffer: BUFFER.toBase58(),
          bufferAuthority: PAYER.toBase58(),
          sender: SENDER.toBase58(),
        },
        identityVerification:
          "previously independently derived public keys; this run checked public metadata and file stats only, no secret file reads",
        privateFiles,
        binary: { bytes: elf.length, sha256: hash },
        currentAccounts: {
          slot: accounts.context.slot,
          program: "absent",
          buffer: "absent",
        },
        balances: { payer: payerBalance, sender: senderBalance },
        deployment: {
          rentObservationSlots: [beforeSlot, afterSlot],
          programRent,
          dataRent,
          bufferMinimumRent,
          bufferFunding: dataRent,
          bufferRentReusedAtDeployment: true,
          chunkBytes,
          writes,
          transactionCount: writes + 2,
          initialFee,
          writeFee,
          finalFee,
          feeLamports: deploymentFees,
        },
        flow,
        idlPublication: {
          neededByApp: false,
          budgetLamports: 0,
          reason:
            "app uses bundled source-generated IDL and verifies deployed binary",
        },
        arena: {
          included: false,
          reason:
            "settlement not yet verified on Devnet; Core submission scope",
        },
        total: {
          rentDepositsLamports: totalRent,
          feeLamports: totalFees,
          simulationFeeHeadroomLamports: flow.simulationFeeHeadroomLamports,
          reserveLamports: reserve,
          requiredLamports: required,
          requiredSOL: sol(required),
          transferLamports: transfer,
          transferSOL: sol(transfer),
          senderTransferFee: transferFee,
          senderTotalDebitLamports: transfer + transferFee.lamports,
        },
        action:
          "no signing, simulation, submission, transfer or deployment performed",
      },
      null,
      2,
    ),
  );
}
if (require.main === module)
  main().catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
  });
