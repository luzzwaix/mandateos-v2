import { BN } from "@coral-xyz/anchor";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { MandateClient } from "./client";
import { LOCAL_DEMO } from "./program";
import { keypairWallet } from "./wallet";
import type { Activity } from "./types";

export interface DemoSession {
  owner: Keypair;
  research: Keypair;
  data: Keypair;
  scraper: Keypair;
  search: Keypair;
  organization: PublicKey;
  destination: PublicKey;
  labels: Record<string, string>;
}
export async function initializeDemo(
  onProgress: (text: string) => void,
  onActivity: (activity: Activity) => void,
  fundedOwner?: Keypair,
): Promise<DemoSession> {
  if (!LOCAL_DEMO)
    throw new Error(
      "Disposable signing is enabled only on an explicitly enabled localhost RPC",
    );
  const owner = fundedOwner ?? Keypair.generate();
  const research = Keypair.generate(),
    data = Keypair.generate(),
    scraper = Keypair.generate(),
    search = Keypair.generate();
  const client = new MandateClient(keypairWallet(owner));
  await client.verifyDeployment();
  onProgress("Funding disposable local signers");
  const record = (title: string, signature: string) =>
    onActivity({
      title,
      signature,
      status: "confirmed",
      detail: "Confirmed on local validator",
      time: new Date().toLocaleTimeString(),
    });
  if (!fundedOwner) {
    const latest = await client.rpc.getLatestBlockhash();
    const airdrop = await client.rpc.requestAirdrop(
      owner.publicKey,
      1_000_000_000,
    );
    const funded = await client.rpc.confirmTransaction(
      { signature: airdrop, ...latest },
      "confirmed",
    );
    if (funded.value.err) throw new Error("Local faucet failed");
    record("Local signer funded", airdrop);
  } else if ((await client.rpc.getBalance(owner.publicKey)) < 1_000_000_000)
    throw new Error(
      "Select the funded disposable wallet printed by npm run demo:local",
    );
  record(
    "Controller accounts funded",
    await client.send(
      new Transaction().add(
        ...[research, data, scraper, search].map((pair) =>
          SystemProgram.transfer({
            fromPubkey: owner.publicKey,
            toPubkey: pair.publicKey,
            lamports: 200_000_000,
          }),
        ),
      ),
    ),
  );
  onProgress("Creating a normal six-decimal SPL demo mint");
  const confirmations = {
    commitment: "confirmed" as const,
    preflightCommitment: "confirmed" as const,
  };
  const mint = await createMint(
    client.rpc,
    owner,
    owner.publicKey,
    null,
    6,
    undefined,
    confirmations,
  );
  const source = await getOrCreateAssociatedTokenAccount(
    client.rpc,
    owner,
    mint,
    owner.publicKey,
    false,
    "confirmed",
    confirmations,
  );
  const destination = await getOrCreateAssociatedTokenAccount(
    client.rpc,
    owner,
    mint,
    Keypair.generate().publicKey,
    false,
    "confirmed",
    confirmations,
  );
  await mintTo(
    client.rpc,
    owner,
    mint,
    source.address,
    owner,
    1_000_000_000n,
    [],
    confirmations,
  );
  onProgress("Creating organization and funding Root with 1,000 test tokens");
  const created = await client.createOrganization(mint);
  record("Organization created", created.signature);
  let snapshot = await client.load(created.organization);
  record(
    "Deposited 1,000 test tokens",
    await client.deposit(snapshot, new BN("1000000000"), source.address),
  );
  snapshot = await client.load(created.organization);
  const root = snapshot.nodes.find((n) =>
    n.publicKey.equals(snapshot.organization.rootMandate),
  )!;
  onProgress("Delegating Research 400 → Data 150 → Scraper 50");
  const r = await client.delegate(
    snapshot,
    root,
    research.publicKey,
    new BN("400000000"),
  );
  record("Research delegated 400", r.signature);
  snapshot = await client.load(created.organization);
  const researchClient = new MandateClient(keypairWallet(research));
  const researchNode = snapshot.nodes.find((n) => n.publicKey.equals(r.child))!;
  const d = await researchClient.delegate(
    snapshot,
    researchNode,
    data.publicKey,
    new BN("150000000"),
  );
  record("Data delegated 150", d.signature);
  snapshot = await client.load(created.organization);
  const searchNode = await researchClient.delegate(
    snapshot,
    snapshot.nodes.find((n) => n.publicKey.equals(r.child))!,
    search.publicKey,
    new BN("100000000"),
  );
  record("Search delegated 100", searchNode.signature);
  snapshot = await client.load(created.organization);
  const s = await new MandateClient(keypairWallet(data)).delegate(
    snapshot,
    snapshot.nodes.find((n) => n.publicKey.equals(d.child))!,
    scraper.publicKey,
    new BN("50000000"),
  );
  record("Scraper delegated 50", s.signature);
  snapshot = await client.load(created.organization);
  onProgress("Scraper pays 10; updating its complete lineage");
  record(
    "Scraper spent 10",
    await new MandateClient(keypairWallet(scraper)).spend(
      snapshot,
      snapshot.nodes.find((n) => n.publicKey.equals(s.child))!,
      new BN("10000000"),
      destination.address,
    ),
  );
  return {
    owner,
    research,
    data,
    scraper,
    search,
    organization: created.organization,
    destination: destination.address,
    labels: {
      [root.publicKey.toBase58()]: "Treasury",
      [r.child.toBase58()]: "Research",
      [d.child.toBase58()]: "Data",
      [s.child.toBase58()]: "Scraper",
      [searchNode.child.toBase58()]: "Search",
    },
  };
}
