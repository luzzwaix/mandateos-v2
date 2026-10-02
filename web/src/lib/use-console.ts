"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keypair, PublicKey } from "@solana/web3.js";
import { MandateClient, ProtocolRejection } from "./solana/client";
import { initializeDemo, type DemoSession } from "./solana/demo";
import { keypairWallet, connectWallet } from "./solana/wallet";
import type { Activity, SigningWallet, Snapshot } from "./solana/types";

export function useConsole() {
  const [wallet, setWallet] = useState<SigningWallet>();
  const [demo, setDemo] = useState<DemoSession>();
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [organization, setOrganization] = useState(
    process.env.NEXT_PUBLIC_MANDATEOS_ORGANIZATION ?? "",
  );
  const [selected, setSelected] = useState("");
  const [activity, setActivity] = useState<Activity[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [rejection, setRejection] = useState<ProtocolRejection>();
  const [health, setHealth] = useState("Connecting to RPC");
  const [released, setReleased] = useState("");
  const adapterRef = useRef<
    Awaited<ReturnType<typeof connectWallet>>["adapter"] | undefined
  >(undefined);
  const client = useMemo(() => new MandateClient(wallet), [wallet]);
  const addActivity = useCallback(
    (a: Activity) => setActivity((prev) => [a, ...prev].slice(0, 30)),
    [],
  );
  const refresh = useCallback(
    async (address = organization) => {
      if (!address) return;
      const next = await client.load(new PublicKey(address));
      setSnapshot(next);
      setSelected((old) =>
        old && next.nodes.some((n) => n.publicKey.toBase58() === old)
          ? old
          : next.organization.rootMandate.toBase58(),
      );
      const observed = await client.activity(
        next.address,
        next.bounties.map((b) => b.publicKey),
      );
      setActivity((prev) => {
        const persisted = new Set(observed.map((a) => a.signature));
        return [
          ...prev.filter((a) => !a.signature || !persisted.has(a.signature)),
          ...observed,
        ].slice(0, 30);
      });
    },
    [client, organization],
  );
  useEffect(() => {
    let cancelled = false;
    const update = async () => {
      try {
        const slot = await client.verifyDeployment();
        if (!cancelled) setHealth(`LIVE · slot ${slot.toLocaleString()}`);
        if (organization && !cancelled) await refresh();
      } catch (e) {
        if (!cancelled) setHealth(e instanceof Error ? e.message : String(e));
      }
    };
    void update();
    const timer = setInterval(() => {
      if (!busy) void update();
    }, 8_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [client, organization, refresh, busy]);
  async function run(
    title: string,
    task: () => Promise<string | void>,
    address?: string,
  ) {
    if (busy) return;
    setBusy(title);
    setError("");
    setRejection(undefined);
    try {
      const signature = await task();
      if (signature)
        addActivity({
          title,
          signature,
          status: "confirmed",
          detail: "Transaction confirmed",
          time: new Date().toLocaleTimeString(),
        });
      await refresh(address);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      if (e instanceof ProtocolRejection) {
        setRejection(e);
        addActivity({
          title: "Payment rejected",
          detail: `${e.code ?? "Program rejection"}: ${message}`,
          signature: e.signature,
          logs: e.logs,
          status: "rejected",
          time: new Date().toLocaleTimeString(),
        });
      }
    } finally {
      setBusy("");
    }
  }
  function forSigner(address: PublicKey) {
    if (demo) {
      const pair = [
        demo.owner,
        demo.research,
        demo.data,
        demo.scraper,
        demo.search,
      ].find((p) => p.publicKey.equals(address));
      if (!pair)
        throw new Error(
          "This controller's signing key is not in the disposable demo session",
        );
      return new MandateClient(keypairWallet(pair));
    }
    if (!wallet?.publicKey.equals(address))
      throw new Error(
        "Connect the wallet matching this operation's controller",
      );
    return client;
  }
  async function initialize(owner?: Keypair) {
    setReleased("");
    await run("Initializing real localnet demo", async () => {
      const session = await initializeDemo(setBusy, addActivity, owner);
      setDemo(session);
      setWallet(keypairWallet(session.owner));
      setOrganization(session.organization.toBase58());
      const ownerClient = new MandateClient(keypairWallet(session.owner));
      const next = await ownerClient.load(session.organization);
      setSnapshot(next);
      setSelected(next.organization.rootMandate.toBase58());
    });
  }
  async function connect(preference: "Phantom" | "Solflare") {
    await run(`Connecting ${preference}`, async () => {
      const { adapter, wallet: signing } = await connectWallet(preference);
      adapterRef.current = adapter;
      setDemo(undefined);
      setWallet(signing);
    });
  }
  useEffect(() => {
    const adapter = adapterRef.current;
    const disconnected = () => setWallet(undefined);
    adapter?.on?.("disconnect", disconnected);
    adapter?.on?.("accountChanged", disconnected);
    return () => {
      adapter?.removeListener?.("disconnect", disconnected);
      adapter?.removeListener?.("accountChanged", disconnected);
    };
  }, [wallet]);
  async function disconnect() {
    if (adapterRef.current) await adapterRef.current.disconnect();
    adapterRef.current = undefined;
    setWallet(undefined);
    setDemo(undefined);
  }
  const node = snapshot?.nodes.find((n) => n.publicKey.toBase58() === selected);
  return {
    wallet,
    demo,
    snapshot,
    organization,
    setOrganization,
    selected,
    setSelected,
    activity,
    busy,
    error,
    rejection,
    health,
    released,
    setReleased,
    refresh,
    run,
    forSigner,
    initialize,
    connect,
    disconnect,
    client,
    node,
    labels: demo?.labels ?? {},
  };
}
export type ConsoleState = ReturnType<typeof useConsole>;
