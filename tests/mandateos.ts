import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import { readFileSync } from "node:fs";
import {
  createAccount,
  createMint,
  freezeAccount,
  getAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  AccountMeta,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

const U = 1_000_000n;
const bn = (n: bigint | number) => new anchor.BN(n.toString());
const units = (n: number) => BigInt(n) * U;
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const idl = JSON.parse(
  readFileSync("target/idl/mandateos.json", "utf8"),
) as anchor.Idl;
const program = new anchor.Program(idl, provider);
const payer = (provider.wallet as anchor.Wallet).payer;
const batchCount = Number(process.env.MANDATEOS_TEST_BATCH_COUNT ?? "1");
const batchIndex = Number(process.env.MANDATEOS_TEST_BATCH_INDEX ?? "0");
if (
  !Number.isInteger(batchCount) ||
  !Number.isInteger(batchIndex) ||
  batchCount < 1 ||
  batchIndex < 0 ||
  batchIndex >= batchCount
) {
  throw new Error("Invalid test batch selection");
}
let registeredTests = 0;
function testCase(title: string, body: () => Promise<void>) {
  const index = registeredTests++;
  if (index % batchCount === batchIndex) it(title, body);
}

interface MandateData {
  organization: PublicKey;
  parent: PublicKey;
  controller: PublicKey;
  depth: number;
  status: { active?: object; revoked?: object };
  initialBudget: anchor.BN;
  selfAvailable: anchor.BN;
  subtreeRemaining: anchor.BN;
  directSpent: anchor.BN;
  nextChildIndex: anchor.BN;
  childIndex: anchor.BN;
}
interface OrganizationData {
  totalFunded: anchor.BN;
  totalSpent: anchor.BN;
  totalReclaimed: anchor.BN;
}
const data = program.account as unknown as {
  mandate: { fetch(key: PublicKey): Promise<MandateData> };
  organization: { fetch(key: PublicKey): Promise<OrganizationData> };
};
interface NodeRef {
  key: PublicKey;
  controller: Keypair;
  ancestors: PublicKey[];
}
interface Fixture {
  organization: PublicKey;
  root: NodeRef;
  vault: PublicKey;
  source: PublicKey;
  destination: PublicKey;
  mint: PublicKey;
}
let nextOrgId = 1;
let mint: PublicKey;
let wrongMint: PublicKey;
let source: PublicKey;
let recipient: PublicKey;
let wrongRecipient: PublicKey;
let outsider: Keypair;

const metas = (keys: PublicKey[], writable = false): AccountMeta[] =>
  keys.map((pubkey) => ({ pubkey, isSigner: false, isWritable: writable }));
const rootPda = (org: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("mandate"), org.toBuffer(), Buffer.from("root")],
    program.programId,
  )[0];
const childPda = (org: PublicKey, parent: PublicKey, index: anchor.BN) =>
  PublicKey.findProgramAddressSync(
    [
      Buffer.from("mandate"),
      org.toBuffer(),
      parent.toBuffer(),
      index.toArrayLike(Buffer, "le", 8),
    ],
    program.programId,
  )[0];

async function fund(key: PublicKey) {
  await provider.sendAndConfirm(
    new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: key,
        lamports: 100_000_000,
      }),
    ),
  );
}
async function fixture(depositUnits = 1000, maxDepth = 4): Promise<Fixture> {
  const id = bn(nextOrgId++);
  const organization = PublicKey.findProgramAddressSync(
    [
      Buffer.from("organization"),
      payer.publicKey.toBuffer(),
      id.toArrayLike(Buffer, "le", 8),
    ],
    program.programId,
  )[0];
  const root = { key: rootPda(organization), controller: payer, ancestors: [] };
  const vault = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), organization.toBuffer()],
    program.programId,
  )[0];
  await program.methods
    .createOrganization(id, maxDepth)
    .accountsStrict({
      authority: payer.publicKey,
      organization,
      root: root.key,
      vault,
      mint,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  const f = { organization, root, vault, mint, source, destination: recipient };
  if (depositUnits > 0) await deposit(f, units(depositUnits));
  return f;
}
function deposit(
  f: Fixture,
  amount: bigint,
  signer = payer,
  sourceOverride = f.source,
) {
  return program.methods
    .deposit(bn(amount))
    .accountsStrict({
      authority: signer.publicKey,
      organization: f.organization,
      root: f.root.key,
      vault: f.vault,
      mint: f.mint,
      source: sourceOverride,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers(signer === payer ? [] : [signer])
    .rpc();
}
async function delegate(
  f: Fixture,
  parent: NodeRef,
  amount: bigint,
  options: {
    signer?: Keypair;
    path?: AccountMeta[];
    controller?: Keypair;
    index?: anchor.BN;
  } = {},
): Promise<NodeRef> {
  const controller = options.controller ?? Keypair.generate();
  await fund(controller.publicKey);
  const signer = options.signer ?? parent.controller;
  const state = await data.mandate.fetch(parent.key);
  const index = options.index ?? state.nextChildIndex;
  const key = childPda(f.organization, parent.key, index);
  await program.methods
    .delegate(controller.publicKey, bn(amount), index)
    .accountsStrict({
      controller: signer.publicKey,
      organization: f.organization,
      parent: parent.key,
      child: key,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts(options.path ?? metas(parent.ancestors))
    .signers(signer === payer ? [] : [signer])
    .rpc();
  return { key, controller, ancestors: [parent.key, ...parent.ancestors] };
}
function spend(
  f: Fixture,
  node: NodeRef,
  amount: bigint,
  options: {
    signer?: Keypair;
    path?: AccountMeta[];
    destination?: PublicKey;
  } = {},
) {
  const signer = options.signer ?? node.controller;
  return program.methods
    .spend(bn(amount))
    .accountsStrict({
      controller: signer.publicKey,
      organization: f.organization,
      node: node.key,
      vault: f.vault,
      mint: f.mint,
      destination: options.destination ?? f.destination,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(options.path ?? metas(node.ancestors, true))
    .signers(signer === payer ? [] : [signer])
    .rpc();
}
function revoke(
  f: Fixture,
  parent: NodeRef,
  target: NodeRef,
  signer = parent.controller,
  path = metas(parent.ancestors),
) {
  return program.methods
    .revokeBranch()
    .accountsStrict({
      revoker: signer.publicKey,
      organization: f.organization,
      parent: parent.key,
      target: target.key,
    })
    .remainingAccounts(path)
    .signers(signer === payer ? [] : [signer])
    .rpc();
}
function reclaim(
  f: Fixture,
  amount: bigint,
  signer = payer,
  destination = source,
) {
  return program.methods
    .reclaim(bn(amount))
    .accountsStrict({
      authority: signer.publicKey,
      organization: f.organization,
      root: f.root.key,
      vault: f.vault,
      mint: f.mint,
      destination,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers(signer === payer ? [] : [signer])
    .rpc();
}
async function balances(
  node: NodeRef,
  available: number,
  remaining: number,
  spent = 0,
) {
  const state = await data.mandate.fetch(node.key);
  assert.equal(
    state.selfAvailable.toString(),
    units(available).toString(),
    "self_available",
  );
  assert.equal(
    state.subtreeRemaining.toString(),
    units(remaining).toString(),
    "subtree_remaining",
  );
  assert.equal(
    state.directSpent.toString(),
    units(spent).toString(),
    "direct_spent",
  );
  return state;
}
async function expectedError(action: Promise<unknown>, code: string) {
  try {
    await action;
    assert.fail(`Expected on-chain ${code}`);
  } catch (error: unknown) {
    const e = error as {
      error?: { errorCode?: { code: string } };
      logs?: string[];
    };
    const parsed = e.logs ? anchor.AnchorError.parse(e.logs) : null;
    assert.equal(
      e.error?.errorCode?.code ?? parsed?.error.errorCode.code,
      code,
      `Expected program error ${code}, received ${String(error)}`,
    );
  }
}
async function chain(f: Fixture) {
  const research = await delegate(f, f.root, units(400));
  const dataNode = await delegate(f, research, units(150));
  const scraper = await delegate(f, dataNode, units(50));
  return { research, dataNode, scraper };
}
async function snapshot(f: Fixture, nodes: NodeRef[]) {
  return JSON.stringify({
    org: await data.organization.fetch(f.organization),
    nodes: await Promise.all(nodes.map((n) => data.mandate.fetch(n.key))),
    vault: (await getAccount(provider.connection, f.vault)).amount.toString(),
  });
}
async function conservation(f: Fixture) {
  const org = await data.organization.fetch(f.organization);
  const root = await data.mandate.fetch(f.root.key);
  const tracked =
    BigInt(org.totalFunded.toString()) -
    BigInt(org.totalSpent.toString()) -
    BigInt(org.totalReclaimed.toString());
  assert.equal(root.subtreeRemaining.toString(), tracked.toString());
  assert.equal(
    (await getAccount(provider.connection, f.vault)).amount,
    tracked,
  );
}

describe("MandateOS Core — real local validator", () => {
  before(async () => {
    mint = await createMint(
      provider.connection,
      payer,
      payer.publicKey,
      payer.publicKey,
      6,
    );
    wrongMint = await createMint(
      provider.connection,
      payer,
      payer.publicKey,
      null,
      6,
    );
    source = await createAccount(
      provider.connection,
      payer,
      mint,
      payer.publicKey,
    );
    recipient = await createAccount(
      provider.connection,
      payer,
      mint,
      Keypair.generate().publicKey,
    );
    wrongRecipient = await createAccount(
      provider.connection,
      payer,
      wrongMint,
      payer.publicKey,
    );
    await mintTo(
      provider.connection,
      payer,
      mint,
      source,
      payer,
      units(100_000),
    );
    outsider = Keypair.generate();
    await fund(outsider.publicKey);
  });

  testCase(
    "1000 → 400 → 150 → 50; spend 10; revoke Research; blocked descendant; reclaim 990",
    async () => {
      const sourceBefore = (await getAccount(provider.connection, source))
        .amount;
      const destinationBefore = (
        await getAccount(provider.connection, recipient)
      ).amount;
      const f = await fixture(0);
      await balances(f.root, 0, 0);
      await deposit(f, units(1000));
      await balances(f.root, 1000, 1000);
      assert.equal(
        (await getAccount(provider.connection, f.vault)).amount,
        units(1000),
      );
      const research = await delegate(f, f.root, units(400));
      await balances(f.root, 600, 1000);
      await balances(research, 400, 400);
      const dataNode = await delegate(f, research, units(150));
      await balances(f.root, 600, 1000);
      await balances(research, 250, 400);
      await balances(dataNode, 150, 150);
      const scraper = await delegate(f, dataNode, units(50));
      await balances(f.root, 600, 1000);
      await balances(research, 250, 400);
      await balances(dataNode, 100, 150);
      await balances(scraper, 50, 50);
      await spend(f, scraper, units(10));
      await balances(scraper, 40, 40, 10);
      await balances(dataNode, 100, 140);
      await balances(research, 250, 390);
      await balances(f.root, 600, 990);
      assert.equal(
        (await data.organization.fetch(f.organization)).totalSpent.toString(),
        units(10).toString(),
      );
      assert.equal(
        (await getAccount(provider.connection, recipient)).amount -
          destinationBefore,
        units(10),
      );
      const descendantsBefore = await snapshot(f, [dataNode, scraper]);
      await revoke(f, f.root, research);
      const revoked = await balances(research, 0, 0);
      assert.property(revoked.status, "revoked");
      await balances(f.root, 990, 990);
      await balances(dataNode, 100, 140);
      await balances(scraper, 40, 40, 10);
      assert.equal(await snapshot(f, [dataNode, scraper]), descendantsBefore);
      const beforeFailure = await snapshot(f, [
        f.root,
        research,
        dataNode,
        scraper,
      ]);
      await expectedError(spend(f, scraper, units(1)), "AncestorRevoked");
      assert.equal(
        await snapshot(f, [f.root, research, dataNode, scraper]),
        beforeFailure,
      );
      await reclaim(f, units(990));
      await balances(f.root, 0, 0);
      assert.equal((await getAccount(provider.connection, f.vault)).amount, 0n);
      assert.equal(
        (await getAccount(provider.connection, source)).amount,
        sourceBefore - units(10),
      );
      assert.equal(
        (
          await data.organization.fetch(f.organization)
        ).totalReclaimed.toString(),
        units(990).toString(),
      );
      await conservation(f);
    },
  );

  testCase("rejects unauthorized delegation", async () => {
    const f = await fixture();
    await expectedError(
      delegate(f, f.root, units(1), { signer: outsider }),
      "Unauthorized",
    );
  });
  testCase(
    "owner cannot impersonate a child controller for delegation",
    async () => {
      const f = await fixture();
      const a = await delegate(f, f.root, units(10));
      await expectedError(
        delegate(f, a, units(1), { signer: payer }),
        "Unauthorized",
      );
    },
  );
  testCase("rejects unauthorized spending", async () => {
    const f = await fixture();
    const a = await delegate(f, f.root, units(10));
    await expectedError(
      spend(f, a, units(1), { signer: outsider }),
      "Unauthorized",
    );
  });
  testCase(
    "rejects delegation above available capital and rolls back child creation",
    async () => {
      const f = await fixture();
      const before = await snapshot(f, [f.root]);
      const index = (await data.mandate.fetch(f.root.key)).nextChildIndex;
      await expectedError(
        delegate(f, f.root, units(1001)),
        "InsufficientAvailableBudget",
      );
      assert.equal(await snapshot(f, [f.root]), before);
      assert.isNull(
        await provider.connection.getAccountInfo(
          childPda(f.organization, f.root.key, index),
        ),
      );
    },
  );
  testCase("rejects spending above available capital", async () => {
    const f = await fixture();
    const a = await delegate(f, f.root, units(10));
    await expectedError(spend(f, a, units(11)), "InsufficientAvailableBudget");
  });
  testCase("accepts depth 4 and rejects depth 5", async () => {
    const f = await fixture();
    const { scraper } = await chain(f);
    const d = await delegate(f, scraper, units(20));
    assert.equal((await data.mandate.fetch(d.key)).depth, 4);
    await spend(f, d, units(1));
    await conservation(f);
    await expectedError(delegate(f, d, units(1)), "MaxDepthExceeded");
  });
  testCase("respects a smaller organization depth limit", async () => {
    const f = await fixture(1000, 1);
    const a = await delegate(f, f.root, units(10));
    await expectedError(delegate(f, a, units(1)), "MaxDepthExceeded");
  });
  for (const depth of [0, 5])
    testCase(`rejects organization max_depth ${depth}`, async () => {
      await expectedError(fixture(0, depth), "MaxDepthExceeded");
    });
  testCase("rejects malformed ancestor order", async () => {
    const f = await fixture();
    const { scraper } = await chain(f);
    await expectedError(
      spend(f, scraper, units(1), {
        path: metas([...scraper.ancestors].reverse(), true),
      }),
      "InvalidAncestorPath",
    );
  });
  testCase("rejects a missing ancestor", async () => {
    const f = await fixture();
    const { scraper } = await chain(f);
    await expectedError(
      spend(f, scraper, units(1), {
        path: metas(scraper.ancestors.slice(0, 2), true),
      }),
      "InvalidAncestorPath",
    );
  });
  testCase("rejects extra ancestors", async () => {
    const f = await fixture();
    const a = await delegate(f, f.root, units(10));
    await expectedError(
      spend(f, a, units(1), { path: metas([f.root.key, f.root.key], true) }),
      "InvalidAncestorPath",
    );
  });
  testCase("rejects a foreign organization's ancestor", async () => {
    const f = await fixture();
    const other = await fixture();
    const a = await delegate(f, f.root, units(10));
    await expectedError(
      spend(f, a, units(1), { path: metas([other.root.key], true) }),
      "WrongOrganization",
    );
  });
  testCase("rejects duplicate ancestors", async () => {
    const f = await fixture();
    const { scraper } = await chain(f);
    await expectedError(
      spend(f, scraper, units(1), {
        path: metas(
          [scraper.ancestors[0], scraper.ancestors[0], f.root.key],
          true,
        ),
      }),
      "InvalidAncestorPath",
    );
  });
  testCase("rejects substitution of a sibling", async () => {
    const f = await fixture();
    const a = await delegate(f, f.root, units(100));
    const b = await delegate(f, f.root, units(100));
    const c = await delegate(f, a, units(10));
    await expectedError(
      spend(f, c, units(1), { path: metas([b.key, f.root.key], true) }),
      "InvalidAncestorPath",
    );
  });
  testCase("rejects a non-program-owned ancestor", async () => {
    const f = await fixture();
    const a = await delegate(f, f.root, units(10));
    await expectedError(
      spend(f, a, units(1), { path: metas([outsider.publicKey], true) }),
      "InvalidAncestorPath",
    );
  });
  testCase(
    "rejects an Organization account as an ancestor (wrong discriminator)",
    async () => {
      const f = await fixture();
      const a = await delegate(f, f.root, units(10));
      await expectedError(
        spend(f, a, units(1), { path: metas([f.organization], true) }),
        "InvalidAncestorPath",
      );
    },
  );
  testCase("rejects a readonly spending ancestor", async () => {
    const f = await fixture();
    const a = await delegate(f, f.root, units(10));
    await expectedError(
      spend(f, a, units(1), { path: metas(a.ancestors) }),
      "AncestorNotWritable",
    );
  });
  testCase("delegation requires the full active parent path", async () => {
    const f = await fixture();
    const a = await delegate(f, f.root, units(10));
    await expectedError(
      delegate(f, a, units(1), { path: [] }),
      "InvalidAncestorPath",
    );
  });
  testCase(
    "blocks descendant delegation after ancestor revocation",
    async () => {
      const f = await fixture();
      const { research, scraper } = await chain(f);
      await revoke(f, f.root, research);
      await expectedError(delegate(f, scraper, units(1)), "AncestorRevoked");
    },
  );
  testCase("blocks direct spending of a revoked node", async () => {
    const f = await fixture();
    const a = await delegate(f, f.root, units(10));
    await revoke(f, f.root, a);
    await expectedError(spend(f, a, units(1)), "MandateRevoked");
  });
  testCase("rejects double revocation", async () => {
    const f = await fixture();
    const a = await delegate(f, f.root, units(10));
    await revoke(f, f.root, a);
    await expectedError(revoke(f, f.root, a), "AlreadyRevoked");
  });
  testCase("rejects Root revocation", async () => {
    const f = await fixture();
    const a = await delegate(f, f.root, units(10));
    await expectedError(revoke(f, a, f.root, payer), "CannotRevokeRoot");
  });
  testCase("rejects unrelated revokers", async () => {
    const f = await fixture();
    const a = await delegate(f, f.root, units(10));
    await expectedError(revoke(f, f.root, a, outsider), "Unauthorized");
  });
  testCase(
    "permits direct-parent revocation and preserves ancestor totals",
    async () => {
      const f = await fixture();
      const { research, dataNode, scraper } = await chain(f);
      await spend(f, scraper, units(10));
      await revoke(f, research, dataNode);
      await balances(research, 390, 390);
      await balances(f.root, 600, 990);
      await expectedError(spend(f, scraper, units(1)), "AncestorRevoked");
      await conservation(f);
    },
  );
  testCase(
    "permits owner emergency revocation of a non-root branch",
    async () => {
      const f = await fixture();
      const { research, dataNode } = await chain(f);
      await revoke(f, research, dataNode, payer);
      await balances(research, 400, 400);
      await balances(f.root, 600, 1000);
      await conservation(f);
    },
  );
  testCase(
    "rejects revocation under an already-revoked ancestor, including owner emergency",
    async () => {
      const f = await fixture();
      const { research, dataNode, scraper } = await chain(f);
      await revoke(f, f.root, research);
      await expectedError(
        revoke(f, dataNode, scraper, payer),
        "AncestorRevoked",
      );
    },
  );
  testCase("rejects a substituted revocation parent", async () => {
    const f = await fixture();
    const { dataNode, scraper } = await chain(f);
    await expectedError(revoke(f, f.root, scraper), "InvalidAncestorPath");
    assert.property((await data.mandate.fetch(dataNode.key)).status, "active");
  });
  testCase("rejects an incomplete revocation parent path", async () => {
    const f = await fixture();
    const { research, dataNode } = await chain(f);
    await expectedError(
      revoke(f, research, dataNode, payer, []),
      "InvalidAncestorPath",
    );
  });
  testCase(
    "rejects reclaim above Root.self_available, including reserved capital",
    async () => {
      const f = await fixture();
      await delegate(f, f.root, units(400));
      await expectedError(
        reclaim(f, units(601)),
        "InsufficientAvailableBudget",
      );
      await expectedError(
        reclaim(f, units(1000)),
        "InsufficientAvailableBudget",
      );
      await reclaim(f, units(600));
      await balances(f.root, 0, 400);
      await conservation(f);
    },
  );
  testCase("rejects unauthorized reclaim", async () => {
    const f = await fixture();
    await expectedError(reclaim(f, units(1), outsider), "Unauthorized");
  });
  testCase("reclaim destination must be authority-owned", async () => {
    const f = await fixture();
    await expectedError(reclaim(f, units(1), payer, recipient), "Unauthorized");
  });
  testCase("rejects wrong-mint spending", async () => {
    const f = await fixture();
    await expectedError(
      spend(f, f.root, units(1), { destination: wrongRecipient }),
      "InvalidMint",
    );
  });
  testCase("rejects wrong-mint deposit", async () => {
    const f = await fixture();
    await expectedError(
      deposit(f, units(1), payer, wrongRecipient),
      "InvalidMint",
    );
  });
  testCase("rejects wrong-mint reclaim", async () => {
    const f = await fixture();
    await expectedError(
      reclaim(f, units(1), payer, wrongRecipient),
      "InvalidMint",
    );
  });
  testCase("rejects unauthorized deposit", async () => {
    const f = await fixture();
    await expectedError(deposit(f, units(1), outsider), "Unauthorized");
  });
  testCase("rejects funding counter overflow atomically", async () => {
    const f = await fixture();
    const before = await snapshot(f, [f.root]);
    await expectedError(deposit(f, (1n << 64n) - 1n), "ArithmeticOverflow");
    assert.equal(await snapshot(f, [f.root]), before);
  });
  testCase("rejects vault-to-itself spending", async () => {
    const f = await fixture();
    await expectedError(
      spend(f, f.root, units(1), { destination: f.vault }),
      "InvalidDestination",
    );
  });
  for (const operation of [
    "deposit",
    "delegate",
    "spend",
    "reclaim",
  ] as const) {
    testCase(`rejects zero ${operation}`, async () => {
      const f = await fixture();
      const action =
        operation === "deposit"
          ? deposit(f, 0n)
          : operation === "delegate"
            ? delegate(f, f.root, 0n)
            : operation === "spend"
              ? spend(f, f.root, 0n)
              : reclaim(f, 0n);
      await expectedError(action, "InvalidAmount");
    });
  }
  testCase("rejects skipped child indexes", async () => {
    const f = await fixture();
    await expectedError(
      delegate(f, f.root, units(1), { index: bn(5) }),
      "InvalidChildIndex",
    );
  });
  testCase(
    "rolls back target, serialized ancestors, organization and vault on failed token CPI",
    async () => {
      const f = await fixture();
      const { research, dataNode, scraper } = await chain(f);
      const frozen = await createAccount(
        provider.connection,
        payer,
        mint,
        payer.publicKey,
        Keypair.generate(),
      );
      await freezeAccount(provider.connection, payer, frozen, mint, payer);
      const before = await snapshot(f, [f.root, research, dataNode, scraper]);
      try {
        await spend(f, scraper, units(1), { destination: frozen });
        assert.fail("Expected SPL Token CPI failure");
      } catch (error: unknown) {
        const e = error as { logs?: string[] };
        assert.match(
          (e.logs ?? []).join("\n"),
          /frozen|custom program error: 0x11/i,
        );
      }
      assert.equal(
        await snapshot(f, [f.root, research, dataNode, scraper]),
        before,
      );
      assert.equal((await getAccount(provider.connection, frozen)).amount, 0n);
    },
  );
  testCase("Root spending works with an empty ancestor path", async () => {
    const f = await fixture();
    await spend(f, f.root, units(7));
    await balances(f.root, 993, 993, 7);
    await conservation(f);
  });
  testCase(
    "revoke one sibling preserves the other's spending authority",
    async () => {
      const f = await fixture();
      const a = await delegate(f, f.root, units(100));
      const b = await delegate(f, f.root, units(200));
      await revoke(f, f.root, a);
      await spend(f, b, units(10));
      await balances(f.root, 800, 990);
      await balances(b, 190, 190, 10);
      await conservation(f);
    },
  );
  testCase(
    "released capital can be redelegated while stale descendants stay unusable",
    async () => {
      const f = await fixture();
      const { research, scraper } = await chain(f);
      await revoke(f, f.root, research);
      const fresh = await delegate(f, f.root, units(400));
      assert.notEqual(fresh.key.toBase58(), research.key.toBase58());
      await spend(f, fresh, units(1));
      await expectedError(spend(f, scraper, units(1)), "AncestorRevoked");
      await conservation(f);
    },
  );

  const arena = program.account as unknown as {
    bounty: {
      fetch(
        key: PublicKey,
      ): Promise<{
        reward: anchor.BN;
        status: { open?: object; settled?: object };
        winner: PublicKey;
        submissionCount: number;
      }>;
    };
  };
  const bountyPda = (f: Fixture, id: number) =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("bounty"),
        f.organization.toBuffer(),
        bn(id).toArrayLike(Buffer, "le", 8),
      ],
      program.programId,
    )[0];
  const submissionPda = (bounty: PublicKey, agent: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("submission"), bounty.toBuffer(), agent.toBuffer()],
      program.programId,
    )[0];
  function createBounty(f: Fixture, reward = 25, id = 1, authority = payer) {
    return program.methods
      .createBounty(bn(id), bn(units(reward)), payer.publicKey)
      .accountsStrict({
        authority: authority.publicKey,
        organization: f.organization,
        root: f.root.key,
        bounty: bountyPda(f, id),
        systemProgram: SystemProgram.programId,
      })
      .signers(authority === payer ? [] : [authority])
      .rpc();
  }
  function submit(bounty: PublicKey, agent = payer) {
    return program.methods
      .submitResult(Array(32).fill(42))
      .accountsStrict({
        agent: agent.publicKey,
        bounty,
        submission: submissionPda(bounty, agent.publicKey),
        systemProgram: SystemProgram.programId,
      })
      .signers(agent === payer ? [] : [agent])
      .rpc();
  }
  function settle(
    f: Fixture,
    bounty: PublicKey,
    destination: PublicKey,
    options: {
      verifier?: Keypair;
      agent?: PublicKey;
      submission?: PublicKey;
    } = {},
  ) {
    const verifier = options.verifier ?? payer;
    return program.methods
      .settleBounty()
      .accountsStrict({
        verifier: verifier.publicKey,
        organization: f.organization,
        root: f.root.key,
        bounty,
        submission:
          options.submission ??
          submissionPda(bounty, options.agent ?? payer.publicKey),
        vault: f.vault,
        mint: f.mint,
        destination,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers(verifier === payer ? [] : [verifier])
      .rpc();
  }
  async function openBounty() {
    const f = await fixture(100);
    await createBounty(f);
    return { f, bounty: bountyPda(f, 1) };
  }
  testCase(
    "Arena: two submissions settle exactly one winner with conserved reward accounting",
    async () => {
      const { f, bounty } = await openBounty();
      await balances(f.root, 75, 100);
      await conservation(f);
      await submit(bounty);
      await submit(bounty, outsider);
      const destination = await createAccount(
        provider.connection,
        payer,
        mint,
        outsider.publicKey,
        Keypair.generate(),
      );
      await settle(f, bounty, destination, { agent: outsider.publicKey });
      const state = await arena.bounty.fetch(bounty);
      assert.exists(state.status.settled);
      assert.equal(state.winner.toBase58(), outsider.publicKey.toBase58());
      assert.equal(state.submissionCount, 2);
      assert.equal(
        (await getAccount(provider.connection, destination)).amount,
        units(25),
      );
      await balances(f.root, 75, 75, 25);
      assert.equal(
        (await data.organization.fetch(f.organization)).totalSpent.toString(),
        units(25).toString(),
      );
      await conservation(f);
    },
  );
  testCase("Arena: unauthorized bounty creator rejected", async () => {
    const f = await fixture(100);
    await expectedError(createBounty(f, 25, 1, outsider), "Unauthorized");
  });
  testCase("Arena: zero reward rejected", async () => {
    const f = await fixture(100);
    await expectedError(createBounty(f, 0), "InvalidAmount");
  });
  testCase("Arena: cannot reserve active child capital", async () => {
    const f = await fixture(100);
    await delegate(f, f.root, units(80));
    await expectedError(createBounty(f, 25), "InsufficientAvailableBudget");
    await balances(f.root, 20, 100);
    await conservation(f);
  });
  testCase("Arena: reserved reward cannot be reclaimed", async () => {
    const { f } = await openBounty();
    await expectedError(reclaim(f, units(76)), "InsufficientAvailableBudget");
  });
  testCase("Arena: reserved reward cannot be delegated", async () => {
    const { f } = await openBounty();
    await expectedError(
      delegate(f, f.root, units(76)),
      "InsufficientAvailableBudget",
    );
  });
  testCase("Arena: wrong verifier rejected", async () => {
    const { f, bounty } = await openBounty();
    await submit(bounty);
    await expectedError(
      settle(f, bounty, source, { verifier: outsider }),
      "Unauthorized",
    );
  });
  testCase("Arena: non-submitter cannot win", async () => {
    const { f, bounty } = await openBounty();
    await expectedError(
      settle(f, bounty, source, { agent: outsider.publicKey }),
      "AccountNotInitialized",
    );
  });
  testCase(
    "Arena: payout cannot be redirected away from submitted agent",
    async () => {
      const { f, bounty } = await openBounty();
      await submit(bounty);
      await expectedError(settle(f, bounty, recipient), "InvalidWinner");
    },
  );
  testCase("Arena: duplicate submission rejected", async () => {
    const { bounty } = await openBounty();
    await submit(bounty);
    try {
      await submit(bounty);
      assert.fail("Expected PDA initialization rejection");
    } catch (error) {
      assert.match(String(error), /already in use|custom program error: 0x0/i);
    }
    assert.equal((await arena.bounty.fetch(bounty)).submissionCount, 1);
  });
  testCase("Arena: double settlement rejected", async () => {
    const { f, bounty } = await openBounty();
    await submit(bounty);
    await settle(f, bounty, source);
    const before = await snapshot(f, [f.root]);
    await expectedError(settle(f, bounty, source), "BountyNotOpen");
    assert.equal(await snapshot(f, [f.root]), before);
  });
  testCase("Arena: submission after settlement rejected", async () => {
    const { f, bounty } = await openBounty();
    await submit(bounty);
    await settle(f, bounty, source);
    await expectedError(submit(bounty, outsider), "BountyNotOpen");
  });
  testCase("Arena: wrong payout mint rejected", async () => {
    const { f, bounty } = await openBounty();
    await submit(bounty);
    await expectedError(settle(f, bounty, wrongRecipient), "InvalidMint");
  });
  testCase("Arena: submission from a different bounty rejected", async () => {
    const { f, bounty } = await openBounty();
    await submit(bounty);
    await createBounty(f, 25, 2);
    await expectedError(
      settle(f, bountyPda(f, 2), source, {
        submission: submissionPda(bounty, payer.publicKey),
      }),
      "ConstraintSeeds",
    );
  });
  testCase(
    "Arena: failed payout rolls back bounty, Root, organization and vault",
    async () => {
      const { f, bounty } = await openBounty();
      await submit(bounty);
      const frozen = await createAccount(
        provider.connection,
        payer,
        mint,
        payer.publicKey,
        Keypair.generate(),
      );
      await freezeAccount(provider.connection, payer, frozen, mint, payer);
      const before = await snapshot(f, [f.root]);
      try {
        await settle(f, bounty, frozen);
        assert.fail("Expected SPL CPI rejection");
      } catch (error) {
        assert.match(String(error), /frozen|custom program error: 0x11/i);
      }
      assert.equal(await snapshot(f, [f.root]), before);
      assert.exists((await arena.bounty.fetch(bounty)).status.open);
    },
  );
  testCase(
    "Arena: multiple bounty reservations remain consistent through reclaim and settlement",
    async () => {
      const { f, bounty } = await openBounty();
      await createBounty(f, 25, 2);
      await reclaim(f, units(50));
      await balances(f.root, 0, 50);
      await submit(bounty);
      await settle(f, bounty, source);
      await balances(f.root, 0, 25, 25);
      await conservation(f);
      assert.exists((await arena.bounty.fetch(bountyPda(f, 2))).status.open);
    },
  );
});
