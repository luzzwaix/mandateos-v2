// Read-only buffer diagnostics. No keypair files, signing or transaction sends.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Connection, PublicKey } from "@solana/web3.js";

const endpoint = "https://api.devnet.solana.com";
const buffer = new PublicKey("3QazcRm23Dm4nHeWzifbPxsBWegxrpr1aJrNUGG4Q8UE");
const payer = new PublicKey("3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm");
const program = new PublicKey("125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd");
const loader = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");
const [programData] = PublicKey.findProgramAddressSync(
  [program.toBuffer()],
  loader,
);
const allowed = new Set([
  "getGenesisHash",
  "getVersion",
  "getMultipleAccounts",
  "getBalance",
  "getSignaturesForAddress",
  "getSignatureStatuses",
  "getTransaction",
  "getSlot",
  "getLatestBlockhash",
  "getMinimumBalanceForRentExemption",
]);
const audit = [];
const rpc = new Connection(endpoint, {
  commitment: "confirmed",
  disableRetryOnRateLimit: true,
  fetch: async (url, options) => {
    const request = JSON.parse(options.body);
    assert(
      allowed.has(request.method),
      `Forbidden RPC method: ${request.method}`,
    );
    audit.push({ at: new Date().toISOString(), method: request.method });
    return fetch(url, options);
  },
});
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
async function readRpc(call) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await call();
    } catch (e) {
      if (!String(e.message).includes("429") || attempt >= 3) throw e;
      const ms = [5_000, 10_000, 20_000][attempt];
      audit.push({
        at: new Date().toISOString(),
        readOnlyRateLimitBackoffMs: ms,
      });
      console.log(
        `Read-only RPC 429: wait ${ms / 1000}s before retrying the read`,
      );
      await delay(ms);
    }
  }
}
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const outputIndex = process.argv.indexOf("--output-dir");
const directory =
  outputIndex < 0
    ? "artifacts/devnet-release/buffer-diagnostics"
    : process.argv[outputIndex + 1];
assert(
  directory?.startsWith("artifacts/devnet-release/") &&
    !directory.includes("..") &&
    !directory.includes("\\"),
  "Diagnostic output must be a public directory under artifacts/devnet-release",
);
mkdirSync(directory, { recursive: true });
const report = {
  startedAt: new Date().toISOString(),
  rpc: endpoint,
  commitment: "confirmed",
  rpcCalls: audit,
};
const save = () =>
  writeFileSync(
    `${directory}/report.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
try {
  const elf = readFileSync("target/deploy/mandateos.so");
  const manifest = JSON.parse(
    readFileSync("web/src/lib/solana/build-evidence.json", "utf8"),
  );
  assert.equal(elf.length, manifest.byteLength);
  assert.equal(hash(elf), manifest.sha256);
  report.binary = {
    bytes: elf.length,
    sha256: hash(elf),
    matchesBuildManifest: true,
  };
  report.genesis = await readRpc(() => rpc.getGenesisHash());
  assert.equal(report.genesis, "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG");
  report.rpcVersion = await readRpc(() => rpc.getVersion());
  const accounts = await readRpc(() =>
    rpc.getMultipleAccountsInfoAndContext(
      [buffer, program, programData],
      "confirmed",
    ),
  );
  const b = accounts.value[0];
  assert(b && b.owner.equals(loader) && !b.executable);
  assert.equal(b.data.readUInt32LE(0), 1);
  assert.equal(b.data[4], 1);
  const authority = new PublicKey(b.data.subarray(5, 37));
  assert(authority.equals(payer));
  const payload = b.data.subarray(37);
  assert.equal(payload.length, elf.length);
  report.accounts = {
    slot: accounts.context.slot,
    buffer: {
      address: buffer.toBase58(),
      owner: b.owner.toBase58(),
      executable: b.executable,
      state: "Buffer",
      stateTag: 1,
      authority: authority.toBase58(),
      bytes: b.data.length,
      payloadBytes: payload.length,
      lamports: b.lamports,
      payloadSHA256: hash(payload),
      fullMatch: payload.equals(elf),
    },
    program: { address: program.toBase58(), exists: !!accounts.value[1] },
    programData: {
      address: programData.toBase58(),
      exists: !!accounts.value[2],
    },
  };
  report.payerBalance = await readRpc(() =>
    rpc.getBalanceAndContext(payer, "confirmed"),
  );
  writeFileSync(`${directory}/observed-buffer-payload.bin`, payload); // Public program bytes only.
  const chunkSize = 1012;
  const matched = [],
    missing = [];
  let equalBytes = 0,
    firstDifferentByte = null;
  for (let i = 0; i < elf.length; i++) {
    if (elf[i] === payload[i]) equalBytes++;
    else if (firstDifferentByte === null) firstDifferentByte = i;
  }
  for (let offset = 0; offset < elf.length; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, elf.length);
    const row = { offset, bytes: end - offset };
    (elf.subarray(offset, end).equals(payload.subarray(offset, end))
      ? matched
      : missing
    ).push(row);
  }
  report.comparison = {
    chunkSize,
    matched,
    missing,
    equalBytesIncludingUnwrittenZeros: equalBytes,
    firstDifferentByte,
    nextCanonicalWriteOffset: missing[0]?.offset ?? null,
    nextCanonicalAccountByteOffset: missing[0] ? missing[0].offset + 37 : null,
  };
  const history = [];
  let before;
  for (;;) {
    const page = await readRpc(() =>
      rpc.getSignaturesForAddress(
        buffer,
        { limit: 1000, ...(before ? { before } : {}) },
        "confirmed",
      ),
    );
    history.push(...page);
    if (page.length < 1000) break;
    before = page.at(-1).signature;
    await delay(1_500);
  }
  report.historyCompleteForEndpoint = true;
  report.history = history;
  const statuses = await readRpc(() =>
    rpc.getSignatureStatuses(
      history.map((s) => s.signature),
      { searchTransactionHistory: true },
    ),
  );
  report.statusReadSlot = statuses.context.slot;
  report.transactions = [];
  save();
  for (let i = 0; i < history.length; i++) {
    await delay(1_500);
    const s = history[i];
    const tx = await readRpc(() =>
      rpc.getTransaction(s.signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      }),
    );
    assert(tx, `Receipt unavailable: ${s.signature}`);
    const message = tx.transaction.message;
    const keys = message.getAccountKeys({
      accountKeysFromLookups: tx.meta.loadedAddresses,
    });
    const loaderInstructions = [];
    for (const ix of message.compiledInstructions) {
      if (!keys.get(ix.programIdIndex).equals(loader)) continue;
      const data = Buffer.from(ix.data);
      const tag = data.readUInt32LE(0);
      const instruction = {
        tag,
        buffer: keys.get(ix.accountKeyIndexes[0]).toBase58(),
      };
      if (tag === 1) {
        const offset = data.readUInt32LE(4),
          size = Number(data.readBigUInt64LE(8));
        assert.equal(data.length, 16 + size);
        instruction.offset = offset;
        instruction.bytes = size;
        instruction.authority = keys.get(ix.accountKeyIndexes[1]).toBase58();
        instruction.matchesLocalELF = data
          .subarray(16)
          .equals(elf.subarray(offset, offset + size));
        instruction.matchesCurrentBuffer = data
          .subarray(16)
          .equals(payload.subarray(offset, offset + size));
        assert.equal(instruction.buffer, buffer.toBase58());
        assert.equal(instruction.authority, payer.toBase58());
        assert(instruction.matchesLocalELF && instruction.matchesCurrentBuffer);
      }
      loaderInstructions.push(instruction);
    }
    report.transactions.push({
      signature: s.signature,
      slot: tx.slot,
      status: statuses.value[i],
      feeLamports: tx.meta.fee,
      err: tx.meta.err,
      payer: keys.get(0).toBase58(),
      loaderInstructions,
      explorer: `https://explorer.solana.com/tx/${s.signature}?cluster=devnet`,
    });
    save();
    console.log(
      `Read receipt ${i + 1}/${history.length}: ${statuses.value[i]?.confirmationStatus}, err=${JSON.stringify(tx.meta.err)}`,
    );
  }
  const writes = report.transactions.flatMap((t) =>
    t.loaderInstructions
      .filter((i) => i.tag === 1)
      .map((i) => ({
        signature: t.signature,
        ...i,
        status: t.status,
        err: t.err,
        feeLamports: t.feeLamports,
      })),
  );
  writes.sort((a, b) => a.offset - b.offset);
  let contiguous = 0;
  for (const w of writes.filter((w) => !w.err)) {
    if (w.offset <= contiguous)
      contiguous = Math.max(contiguous, w.offset + w.bytes);
  }
  report.writeSummary = {
    discovered: writes.length,
    successful: writes.filter((w) => !w.err).length,
    failed: writes.filter((w) => w.err).length,
    finalized: writes.filter(
      (w) => w.status?.confirmationStatus === "finalized",
    ).length,
    provenWrittenBytes: writes
      .filter((w) => !w.err)
      .reduce((n, w) => n + w.bytes, 0),
    contiguousWrittenPrefixBytes: contiguous,
    firstWriteOffset: writes[0]?.offset,
    lastWriteOffset: writes.at(-1)?.offset,
    writes,
    undiscoveredTransactions:
      "CLI log contains no signatures for unconfirmed/missing writes; their individual submission/error status cannot be reconstructed from confirmed address history",
  };
  report.totalConfirmedFeesLamports = report.transactions
    .filter((t) => !t.err)
    .reduce((n, t) => n + t.feeLamports, 0);
  const finalAccounts = await readRpc(() =>
    rpc.getMultipleAccountsInfoAndContext(
      [buffer, program, programData],
      "confirmed",
    ),
  );
  assert(
    finalAccounts.value[0]?.data.equals(b.data),
    "Buffer changed during read-only diagnostics",
  );
  assert.equal(finalAccounts.value[0]?.lamports, b.lamports);
  report.unchangedAtFinalReadSlot = finalAccounts.context.slot;
  report.completedAt = new Date().toISOString();
  save();
  console.log(
    JSON.stringify(
      {
        completedAt: report.completedAt,
        accounts: report.accounts,
        payerBalance: report.payerBalance,
        comparison: {
          matchedChunks: matched.length,
          missingChunks: missing.length,
          nextCanonicalWriteOffset: missing[0]?.offset,
          nextCanonicalAccountByteOffset: missing[0]?.offset + 37,
          firstDifferentByte,
        },
        writeSummary: { ...report.writeSummary, writes: undefined },
        totalConfirmedFeesLamports: report.totalConfirmedFeesLamports,
        statusReadSlot: report.statusReadSlot,
        unchangedAtFinalReadSlot: report.unchangedAtFinalReadSlot,
      },
      null,
      2,
    ),
  );
} catch (e) {
  report.stopped = { at: new Date().toISOString(), error: e.message };
  save();
  console.error(`Read-only diagnostics stopped: ${e.message}`);
  process.exitCode = 1;
}
