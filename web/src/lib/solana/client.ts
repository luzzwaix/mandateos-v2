import {
  AnchorError,
  BorshInstructionCoder,
  BN,
  EventParser,
  utils,
  type Program,
} from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  SendTransactionError,
  type TransactionInstruction,
  type Connection,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  bountyPda,
  childPda,
  organizationPda,
  rootPda,
  submissionPda,
  vaultPda,
} from "./pdas";
import {
  assertCompatibleIdl,
  DEVNET_GENESIS,
  PROGRAM_ADDRESS,
  programFor,
  REQUIRED_INSTRUCTIONS,
} from "./program";
import { verifyProgramBinary } from "./deployment";
import type {
  Activity,
  BountyAccount,
  ChainRow,
  MandateAccount,
  OrganizationAccount,
  SigningWallet,
  Snapshot,
  SubmissionAccount,
  TransactionObserver,
} from "./types";

interface AccountApi<T> {
  fetch(key: PublicKey): Promise<T>;
  all(
    filters?: { memcmp: { offset: number; bytes: string } }[],
  ): Promise<ChainRow<T>[]>;
}
export class ProtocolRejection extends Error {
  constructor(
    message: string,
    public signature: string,
    public logs: string[],
    public code?: string,
    public slot?: number,
    public fee?: number,
  ) {
    super(message);
    this.name = "ProtocolRejection";
  }
}
export class SimulationRejection extends Error {
  readonly signature = undefined;
  constructor(
    message: string,
    public logs: string[],
    public code?: string,
  ) {
    super(message);
    this.name = "SimulationRejection";
  }
}
export class MandateClient {
  readonly program: Program;
  private readonly finalizedActivity = new Map<
    string,
    { slot: number; rows: Activity[] }
  >();
  activityReadError?: string;
  constructor(
    readonly wallet?: SigningWallet,
    private readonly observe?: TransactionObserver,
    rpc?: Connection,
  ) {
    this.program = programFor(wallet, rpc);
  }
  get rpc() {
    return this.program.provider.connection;
  }
  get accounts() {
    return this.program.account as unknown as {
      organization: AccountApi<OrganizationAccount>;
      mandate: AccountApi<MandateAccount>;
      bounty: AccountApi<BountyAccount>;
      submission: AccountApi<SubmissionAccount>;
    };
  }
  async verifyDeployment() {
    const genesis = await this.rpc.getGenesisHash();
    if (genesis !== DEVNET_GENESIS)
      throw new Error(
        "Wrong network: this console only permits Solana Devnet. No transaction will be sent.",
      );
    assertCompatibleIdl();
    const [info, slot] = await Promise.all([
      this.rpc.getAccountInfo(new PublicKey(PROGRAM_ADDRESS), "confirmed"),
      this.rpc.getSlot("confirmed"),
    ]);
    if (!info?.executable)
      throw new Error(
        "Devnet program account not found. Transactions are disabled until this public program address is deployed and its matching IDL is available.",
      );
    await verifyProgramBinary(this.rpc, new PublicKey(PROGRAM_ADDRESS), info);
    return slot;
  }
  async load(
    address: PublicKey,
    onVerified?: (slot: number) => void,
  ): Promise<Snapshot> {
    const slot = await this.verifyDeployment();
    onVerified?.(slot);
    const organization = await this.accounts.organization.fetch(address);
    const filter = [{ memcmp: { offset: 8, bytes: address.toBase58() } }];
    const [nodes, bounties, mint, vault] = await Promise.all([
      this.accounts.mandate.all(filter),
      this.accounts.bounty.all(filter),
      getMint(this.rpc, organization.mint),
      getAccount(this.rpc, organization.vault),
    ]);
    const submissions = (
      await Promise.all(
        bounties.map((b) =>
          this.accounts.submission.all([
            { memcmp: { offset: 8, bytes: b.publicKey.toBase58() } },
          ]),
        ),
      )
    ).flat();
    return {
      address,
      organization,
      nodes,
      bounties,
      submissions,
      decimals: mint.decimals,
      vaultBalance: vault.amount,
    };
  }
  ancestors(
    node: ChainRow<MandateAccount>,
    snapshot: Snapshot,
    writable = false,
  ) {
    const result: {
      pubkey: PublicKey;
      isSigner: boolean;
      isWritable: boolean;
    }[] = [];
    let current = node;
    for (let depth = node.account.depth; depth > 0; depth--) {
      const parent = snapshot.nodes.find((n) =>
        n.publicKey.equals(current.account.parent),
      );
      if (!parent)
        throw new Error("Cannot construct the complete on-chain parent path");
      result.push({
        pubkey: parent.publicKey,
        isSigner: false,
        isWritable: writable,
      });
      current = parent;
    }
    if (!current.publicKey.equals(snapshot.organization.rootMandate))
      throw new Error("Path does not terminate at Root");
    return result;
  }
  async send(tx: Transaction, organization?: PublicKey): Promise<string> {
    await this.verifyDeployment();
    if (!this.wallet) throw new Error("Connect a signing wallet first");
    const allowed = this.program.idl.instructions
      .filter((instruction) =>
        (REQUIRED_INSTRUCTIONS as readonly string[]).includes(
          instruction.name.replace(
            /[A-Z]/g,
            (letter) => `_${letter.toLowerCase()}`,
          ),
        ),
      )
      .map((instruction) => Buffer.from(instruction.discriminator));
    for (const instruction of tx.instructions) {
      if (
        instruction.programId.equals(this.program.programId) &&
        !allowed.some((discriminator) =>
          instruction.data.subarray(0, 8).equals(discriminator),
        )
      )
        throw new Error(
          "Instruction is outside the source-generated MandateOS ABI",
        );
    }
    const latest = await this.rpc.getLatestBlockhash("confirmed");
    tx.feePayer = this.wallet.publicKey;
    tx.recentBlockhash = latest.blockhash;
    const intendedMessage = Buffer.from(tx.serializeMessage());
    this.observe?.({ phase: "awaiting-signature" });
    const signed = await this.wallet.signTransaction(tx);
    if (!Buffer.from(signed.serializeMessage()).equals(intendedMessage))
      throw new Error(
        "Wallet changed the requested transaction; nothing was submitted",
      );
    const wire = signed.serialize();
    if (!signed.signature)
      throw new Error("Wallet returned no payer signature");
    const signedSignature = utils.bytes.bs58.encode(signed.signature);
    this.observe?.({
      phase: "submitting",
      signature: signedSignature,
      lastValidBlockHeight: latest.lastValidBlockHeight,
      organization: organization?.toBase58(),
    });
    let signature: string;
    try {
      signature = await this.rpc.sendRawTransaction(wire, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });
    } catch (e) {
      const sendError =
        e instanceof SendTransactionError ||
        (e instanceof Error && "transactionError" in e && "logs" in e)
          ? (e as SendTransactionError)
          : undefined;
      if (sendError?.logs) {
        const parsed = AnchorError.parse(sendError.logs);
        // The signed packet was rejected by preflight, so it is not Explorer evidence.
        this.observe?.({ phase: "error", signature: undefined });
        throw new SimulationRejection(
          parsed?.error.errorMessage ?? sendError.message,
          sendError.logs,
          parsed?.error.errorCode.code,
        );
      }
      throw e;
    }
    if (signature !== signedSignature)
      throw new Error(
        "RPC returned a different signature. Reconcile the original signed transaction before any new action.",
      );
    this.observe?.({ phase: "pending", signature });
    const result = await this.rpc.confirmTransaction(
      { ...latest, signature },
      "confirmed",
    );
    if (result.value.err) {
      const transaction = await this.rpc
        .getTransaction(signature, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        })
        .catch(() => null);
      const logs = transaction?.meta?.logMessages ?? [];
      const parsed = AnchorError.parse(logs);
      throw new ProtocolRejection(
        parsed?.error.errorMessage ?? JSON.stringify(result.value.err),
        signature,
        logs,
        parsed?.error.errorCode.code,
        transaction?.slot,
        transaction?.meta?.fee,
      );
    }
    this.observe?.({
      phase: "confirmed",
      signature,
      slot: result.context.slot,
    });
    return signature;
  }
  async reconcileSubmission(signature: string, lastValidBlockHeight: number) {
    const statuses = await this.rpc.getSignatureStatuses([signature], {
      searchTransactionHistory: true,
    });
    const status = statuses.value[0];
    if (
      status?.confirmationStatus === "confirmed" ||
      status?.confirmationStatus === "finalized"
    ) {
      const receipt = await this.rpc.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (!receipt?.meta) return { phase: "unknown" as const };
      return {
        phase: receipt.meta.err ? ("failed" as const) : ("confirmed" as const),
        slot: receipt.slot,
        fee: receipt.meta.fee,
        err: receipt.meta.err,
        logs: receipt.meta.logMessages ?? [],
      };
    }
    // Finalized expiry plus absent history and receipt permits review of a new action.
    // This method never signs, forwards or recreates the old action.
    if (
      !status &&
      (await this.rpc.getBlockHeight("finalized")) > lastValidBlockHeight
    ) {
      const receipt = await this.rpc.getTransaction(signature, {
        commitment: "finalized",
        maxSupportedTransactionVersion: 0,
      });
      if (!receipt) return { phase: "expired" as const };
    }
    return { phase: "unknown" as const };
  }
  private signer() {
    assertCompatibleIdl();
    if (!this.wallet) throw new Error("Connect a wallet");
    return this.wallet.publicKey;
  }
  async createOrganization(
    mint: PublicKey,
    id = new BN(Date.now()),
    maxDepth = 4,
  ) {
    const authority = this.signer();
    const organization = organizationPda(this.program.programId, authority, id);
    const tx = await this.program.methods
      .createOrganization(id, maxDepth)
      .accountsStrict({
        authority,
        mint,
        organization,
        root: rootPda(this.program.programId, organization),
        vault: vaultPda(this.program.programId, organization),
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .transaction();
    const signature = await this.send(tx, organization);
    return { organization, signature };
  }
  async deposit(s: Snapshot, amount: BN, source?: PublicKey) {
    return this.send(
      await this.program.methods
        .deposit(amount)
        .accountsStrict({
          authority: this.signer(),
          organization: s.address,
          root: s.organization.rootMandate,
          vault: s.organization.vault,
          mint: s.organization.mint,
          source:
            source ??
            getAssociatedTokenAddressSync(s.organization.mint, this.signer()),
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .transaction(),
    );
  }
  async delegate(
    s: Snapshot,
    parent: ChainRow<MandateAccount>,
    controller: PublicKey,
    amount: BN,
  ) {
    const child = childPda(
      this.program.programId,
      s.address,
      parent.publicKey,
      parent.account.nextChildIndex,
    );
    const tx = await this.program.methods
      .delegate(controller, amount, parent.account.nextChildIndex)
      .accountsStrict({
        controller: this.signer(),
        organization: s.address,
        parent: parent.publicKey,
        child,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts(this.ancestors(parent, s))
      .transaction();
    const signature = await this.send(tx);
    return { child, signature };
  }
  async spend(
    s: Snapshot,
    node: ChainRow<MandateAccount>,
    amount: BN,
    destination: PublicKey,
  ) {
    return this.send(
      await this.program.methods
        .spend(amount)
        .accountsStrict({
          controller: this.signer(),
          organization: s.address,
          node: node.publicKey,
          mint: s.organization.mint,
          vault: s.organization.vault,
          destination,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(this.ancestors(node, s, true))
        .transaction(),
    );
  }
  async revoke(s: Snapshot, target: ChainRow<MandateAccount>) {
    const parent = s.nodes.find((n) =>
      n.publicKey.equals(target.account.parent),
    );
    if (!parent) throw new Error("Root cannot be revoked");
    return this.send(
      await this.program.methods
        .revokeBranch()
        .accountsStrict({
          revoker: this.signer(),
          organization: s.address,
          parent: parent.publicKey,
          target: target.publicKey,
        })
        .remainingAccounts(this.ancestors(parent, s))
        .transaction(),
    );
  }
  async reclaim(s: Snapshot, amount: BN, destination?: PublicKey) {
    const owner = this.signer();
    const ata = getAssociatedTokenAddressSync(s.organization.mint, owner);
    const tx = await this.program.methods
      .reclaim(amount)
      .accountsStrict({
        authority: owner,
        organization: s.address,
        root: s.organization.rootMandate,
        mint: s.organization.mint,
        vault: s.organization.vault,
        destination: destination ?? ata,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();
    if (!destination)
      tx.instructions.unshift(
        createAssociatedTokenAccountIdempotentInstruction(
          owner,
          ata,
          owner,
          s.organization.mint,
        ),
      );
    return this.send(tx);
  }
  async createBounty(
    s: Snapshot,
    reward: BN,
    verifier: PublicKey,
    id = new BN(Date.now()),
  ) {
    const bounty = bountyPda(this.program.programId, s.address, id);
    const signature = await this.send(
      await this.program.methods
        .createBounty(id, reward, verifier)
        .accountsStrict({
          authority: this.signer(),
          organization: s.address,
          root: s.organization.rootMandate,
          bounty,
          systemProgram: SystemProgram.programId,
        })
        .transaction(),
    );
    return { bounty, signature };
  }
  async submitResult(bounty: PublicKey, result: string) {
    const hash = new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(result)),
    );
    const agent = this.signer();
    return this.send(
      await this.program.methods
        .submitResult(Array.from(hash))
        .accountsStrict({
          agent,
          bounty,
          submission: submissionPda(this.program.programId, bounty, agent),
          systemProgram: SystemProgram.programId,
        })
        .transaction(),
    );
  }
  async settleBounty(
    s: Snapshot,
    bounty: PublicKey,
    submission: ChainRow<SubmissionAccount>,
  ) {
    const payer = this.signer();
    const destination = getAssociatedTokenAddressSync(
      s.organization.mint,
      submission.account.agent,
    );
    const tx = await this.program.methods
      .settleBounty()
      .accountsStrict({
        verifier: payer,
        organization: s.address,
        root: s.organization.rootMandate,
        bounty,
        submission: submission.publicKey,
        mint: s.organization.mint,
        vault: s.organization.vault,
        destination,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();
    tx.instructions.unshift(
      createAssociatedTokenAccountIdempotentInstruction(
        payer,
        destination,
        submission.account.agent,
        s.organization.mint,
      ),
    );
    return this.send(tx);
  }
  private receiptIdentity(
    receipt: NonNullable<Awaited<ReturnType<Connection["getTransaction"]>>>,
  ): Partial<Activity> {
    const message = receipt.transaction?.message;
    if (!message) return {};
    try {
      const keys =
        message.version === "legacy"
          ? message.getAccountKeys()
          : message.getAccountKeys({
              accountKeysFromLookups: receipt.meta?.loadedAddresses,
            });
      const ours = message.compiledInstructions
        .map((instruction, index) => ({ instruction, index }))
        .filter(({ instruction }) =>
          keys.get(instruction.programIdIndex)?.equals(this.program.programId),
        );
      // Do not attribute an ambiguous batch or a different instruction's failure to a mandate.
      if (ours.length !== 1) return {};
      const { instruction, index } = ours[0];
      const failure = receipt.meta?.err;
      if (
        failure &&
        (typeof failure !== "object" ||
          !("InstructionError" in failure) ||
          !Array.isArray(failure.InstructionError) ||
          failure.InstructionError[0] !== index)
      )
        return {};
      const decoded = (
        this.program.coder.instruction as BorshInstructionCoder
      ).decode(Buffer.from(instruction.data));
      const schema = this.program.idl.instructions.find(
        (i) => i.name === decoded?.name,
      );
      if (!decoded || !schema) return {};
      const account = (...names: string[]) => {
        const position = schema.accounts.findIndex((a) =>
          names.includes(a.name),
        );
        return position < 0
          ? undefined
          : keys.get(instruction.accountKeyIndexes[position])?.toBase58();
      };
      const decodedAmount = (decoded.data as { amount?: unknown }).amount;
      return {
        action: decoded.name,
        amountBaseUnits:
          decodedAmount instanceof BN
            ? (decodedAmount as BN).toString()
            : undefined,
        mandate: account("node", "target"),
        actor: account(
          "controller",
          "revoker",
          "authority",
          "agent",
          "verifier",
        ),
        feePayer: keys.get(0)?.toBase58(),
      };
    } catch {
      return {}; // Unknown message shape has no inferred identity.
    }
  }
  async activity(
    address: PublicKey,
    bounties: PublicKey[] = [],
    onProgress?: (rows: Activity[]) => void,
    shouldContinue: () => boolean = () => true,
  ): Promise<Activity[]> {
    const observed = (
      await Promise.all(
        [address, ...bounties].map((key) =>
          this.rpc.getSignaturesForAddress(key, { limit: 14 }),
        ),
      )
    ).flat();
    const signatures = [
      ...new Map(observed.map((row) => [row.signature, row])).values(),
    ]
      .sort((a, b) => b.slot - a.slot)
      .slice(0, 20);
    const parser = new EventParser(this.program.programId, this.program.coder);
    this.activityReadError = undefined;
    const rows: Activity[] = [];
    // Stop at the first unreadable receipt instead of leaving a batch of reads
    // queued behind a throttled RPC. Previously fetched finalized evidence stays valid.
    for (const info of signatures) {
      if (!shouldContinue()) break;
      try {
        let fetched = false;
        const result = await (async () => {
          const cached = this.finalizedActivity.get(info.signature);
          if (
            info.confirmationStatus === "finalized" &&
            cached?.slot === info.slot
          )
            return cached.rows;
          const transaction = await this.rpc.getTransaction(info.signature, {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0,
          });
          if (!transaction) return [];
          fetched = true;
          const logs = transaction.meta?.logMessages ?? [];
          const identity = this.receiptIdentity(transaction);
          const programError = AnchorError.parse(logs)?.error;
          const remember = (rows: Activity[]) => {
            if (info.confirmationStatus === "finalized") {
              this.finalizedActivity.set(info.signature, {
                slot: transaction.slot,
                rows,
              });
              if (this.finalizedActivity.size > 200)
                this.finalizedActivity.delete(
                  this.finalizedActivity.keys().next().value!,
                );
            }
            return rows;
          };
          if (transaction.meta?.err ?? info.err)
            return remember([
              {
                ...identity,
                code: identity.action
                  ? programError?.errorCode.code
                  : undefined,
                errorNumber: identity.action
                  ? programError?.errorCode.number
                  : undefined,
                confirmationStatus: info.confirmationStatus,
                signature: info.signature,
                slot: transaction.slot,
                fee: transaction.meta?.fee,
                occurredAt: info.blockTime ? info.blockTime * 1000 : undefined,
                title: "Transaction rejected",
                detail:
                  AnchorError.parse(logs)?.error.errorMessage ??
                  JSON.stringify(transaction.meta?.err ?? info.err),
                status: "rejected" as const,
                logs,
                time: info.blockTime
                  ? new Date(info.blockTime * 1000).toLocaleTimeString()
                  : "confirmed slot",
              },
            ]);
          return remember(
            [...parser.parseLogs(logs)].map((event) => ({
              ...identity,
              confirmationStatus: info.confirmationStatus,
              entity:
                event.data.bounty instanceof PublicKey
                  ? event.data.bounty.toBase58()
                  : undefined,
              signature: info.signature,
              slot: transaction.slot,
              fee: transaction.meta?.fee,
              occurredAt: info.blockTime ? info.blockTime * 1000 : undefined,
              title: event.name
                .replace(/([A-Z])/g, " $1")
                .replace(/_/g, " ")
                .trim()
                .toLowerCase()
                .replace(/^./, (c) => c.toUpperCase()),
              detail: `Confirmed in slot ${info.slot}`,
              status: "confirmed" as const,
              time: info.blockTime
                ? new Date(info.blockTime * 1000).toLocaleTimeString()
                : "confirmed slot",
            })),
          );
        })();
        rows.push(...result);
        if (fetched) onProgress?.([...rows]);
      } catch (e) {
        this.activityReadError = e instanceof Error ? e.message : String(e);
        break;
      }
    }
    return rows;
  }
}

export function instructionTransaction(
  ...instructions: TransactionInstruction[]
) {
  return new Transaction().add(...instructions);
}
