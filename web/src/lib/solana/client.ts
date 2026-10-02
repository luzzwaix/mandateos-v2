import { AnchorError, BN, EventParser, type Program } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  type TransactionInstruction,
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
import { programFor } from "./program";
import type {
  Activity,
  BountyAccount,
  ChainRow,
  MandateAccount,
  OrganizationAccount,
  SigningWallet,
  Snapshot,
  SubmissionAccount,
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
  ) {
    super(message);
    this.name = "ProtocolRejection";
  }
}
export class MandateClient {
  readonly program: Program;
  constructor(readonly wallet?: SigningWallet) {
    this.program = programFor(wallet);
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
    const info = await this.rpc.getAccountInfo(this.program.programId);
    if (!info?.executable)
      throw new Error(
        "Program is not deployed at this RPC/address. Start the local demo validator or configure a deployed program.",
      );
    return this.rpc.getSlot("confirmed");
  }
  async load(address: PublicKey): Promise<Snapshot> {
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
  async send(tx: Transaction): Promise<string> {
    if (!this.wallet) throw new Error("Connect a signing wallet first");
    const latest = await this.rpc.getLatestBlockhash("confirmed");
    tx.feePayer = this.wallet.publicKey;
    tx.recentBlockhash = latest.blockhash;
    const signed = await this.wallet.signTransaction(tx);
    // Broadcasting with preflight disabled records genuine rejected demo payments
    // in the ledger, rather than stopping at client simulation.
    const signature = await this.rpc.sendRawTransaction(signed.serialize(), {
      skipPreflight: true,
      maxRetries: 3,
    });
    const result = await this.rpc.confirmTransaction(
      { ...latest, signature },
      "confirmed",
    );
    if (result.value.err) {
      const transaction = await this.rpc.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      const logs = transaction?.meta?.logMessages ?? [];
      const parsed = AnchorError.parse(logs);
      throw new ProtocolRejection(
        parsed?.error.errorMessage ?? JSON.stringify(result.value.err),
        signature,
        logs,
        parsed?.error.errorCode.code,
      );
    }
    return signature;
  }
  private signer() {
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
    const signature = await this.send(tx);
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
  async activity(
    address: PublicKey,
    bounties: PublicKey[] = [],
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
    return (
      await Promise.all(
        signatures.map(async (info) => {
          const transaction = await this.rpc.getTransaction(info.signature, {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0,
          });
          if (!transaction) return [];
          const logs = transaction.meta?.logMessages ?? [];
          if (info.err)
            return [
              {
                signature: info.signature,
                title: "Transaction rejected",
                detail:
                  AnchorError.parse(logs)?.error.errorMessage ??
                  JSON.stringify(info.err),
                status: "rejected" as const,
                logs,
                time: info.blockTime
                  ? new Date(info.blockTime * 1000).toLocaleTimeString()
                  : "confirmed slot",
              },
            ];
          return [...parser.parseLogs(logs)].map((event) => ({
            signature: info.signature,
            title: event.name
              .replace(/([A-Z])/g, " $1")
              .replace(/_/g, " ")
              .trim(),
            detail: `Confirmed in slot ${info.slot}`,
            status: "confirmed" as const,
            time: info.blockTime
              ? new Date(info.blockTime * 1000).toLocaleTimeString()
              : "confirmed slot",
          }));
        }),
      )
    ).flat();
  }
}

export function instructionTransaction(
  ...instructions: TransactionInstruction[]
) {
  return new Transaction().add(...instructions);
}
