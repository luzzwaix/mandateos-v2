"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  MandateClient,
  ProtocolRejection,
  SimulationRejection,
} from "./solana/client";
import { initializeDemo, type DemoSession } from "./solana/demo";
import { keypairWallet, connectWallet } from "./solana/wallet";
import type {
  Activity,
  CapitalTransition,
  SigningWallet,
  Snapshot,
  TransactionState,
  TransactionObserver,
} from "./solana/types";

export function useConsole(enabled = true) {
  const [wallet, setWallet] = useState<SigningWallet>();
  const [demo, setDemo] = useState<DemoSession>();
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [organization, setOrganization] = useState(
    process.env.NEXT_PUBLIC_MANDATEOS_ORGANIZATION ?? "",
  );
  const [selected, setSelected] = useState("");
  const [activity, setActivity] = useState<Activity[]>([]);
  const [busy, setBusy] = useState("");
  const [transaction, setTransaction] = useState<TransactionState>({
    phase: "idle",
    title: "",
  });
  const progressRef = useRef<Partial<TransactionState>>({});
  const reportTransaction = useCallback<TransactionObserver>((progress) => {
    progressRef.current = { ...progressRef.current, ...progress };
    setTransaction((previous) => ({ ...previous, ...progress }));
  }, []);
  const [error, setError] = useState("");
  const [rejection, setRejection] = useState<
    ProtocolRejection | SimulationRejection
  >();
  const [health, setHealth] = useState("Connecting to RPC");
  const [lastRead, setLastRead] = useState<number>();
  const [stale, setStale] = useState(false);
  const [released, setReleased] = useState("");
  const [transition, setTransition] = useState<CapitalTransition>();
  const [revocations, setRevocations] = useState<
    Record<string, CapitalTransition>
  >({});
  const snapshotRef = useRef<Snapshot | undefined>(undefined);
  const transactionRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!transition) return;
    const timer = setTimeout(() => setTransition(undefined), 900);
    return () => clearTimeout(timer);
  }, [transition]);
  const adapterRef = useRef<
    Awaited<ReturnType<typeof connectWallet>>["adapter"] | undefined
  >(undefined);
  const client = useMemo(
    // MandateClient's constructor retains this observer; only async send invokes it.
    // eslint-disable-next-line react-hooks/refs
    () => new MandateClient(wallet, reportTransaction),
    [wallet, reportTransaction],
  );
  const addActivity = useCallback(
    (a: Activity) =>
      setActivity((prev) =>
        [{ ...a, occurredAt: a.occurredAt ?? Date.now() }, ...prev].slice(
          0,
          30,
        ),
      ),
    [],
  );
  const refresh = useCallback(
    async (address = organization) => {
      if (!address) return;
      const next = await client.load(new PublicKey(address));
      const previous = snapshotRef.current;
      if (previous?.address.equals(next.address) && transactionRef.current) {
        const revoked = next.nodes.find(
          (n) =>
            n.account.status.revoked &&
            previous.nodes.some(
              (old) =>
                old.publicKey.equals(n.publicKey) && old.account.status.active,
            ),
        );
        const created = next.nodes.find(
          (n) =>
            !previous.nodes.some((old) => old.publicKey.equals(n.publicKey)),
        );
        const settled = next.bounties.find(
          (b) =>
            b.account.status.settled &&
            previous.bounties.some(
              (old) =>
                old.publicKey.equals(b.publicKey) && old.account.status.open,
            ),
        );
        const spent = next.nodes.find((n) =>
          previous.nodes.some(
            (old) =>
              old.publicKey.equals(n.publicKey) &&
              n.account.directSpent.gt(old.account.directSpent),
          ),
        );
        if (revoked) {
          const descendants = new Set([revoked.publicKey.toBase58()]);
          for (const n of [...next.nodes].sort(
            (a, b) => a.account.depth - b.account.depth,
          )) {
            if (descendants.has(n.account.parent.toBase58()))
              descendants.add(n.publicKey.toBase58());
          }
          descendants.delete(revoked.publicKey.toBase58());
          const old = previous.nodes.find((n) =>
            n.publicKey.equals(revoked.publicKey),
          )!;
          const revocation: CapitalTransition = {
            key: Date.now(),
            kind: "revoke",
            target: revoked.publicKey.toBase58(),
            parent: revoked.account.parent.toBase58(),
            descendants: [...descendants],
            amount: old.account.subtreeRemaining.toString(),
            signature: transactionRef.current,
          };
          setTransition(revocation);
          setRevocations((old) => ({
            ...old,
            [revocation.target]: revocation,
          }));
        } else if (created) {
          setTransition({
            key: Date.now(),
            kind: "delegate",
            target: created.publicKey.toBase58(),
            parent: created.account.parent.toBase58(),
            descendants: [],
            amount: created.account.initialBudget.toString(),
            signature: transactionRef.current,
          });
        } else if (settled) {
          setTransition({
            key: Date.now(),
            kind: "settle",
            target: settled.publicKey.toBase58(),
            descendants: [],
            amount: settled.account.reward.toString(),
            signature: transactionRef.current,
          });
        } else if (spent) {
          const old = previous.nodes.find((n) =>
            n.publicKey.equals(spent.publicKey),
          )!;
          setTransition({
            key: Date.now(),
            kind: "spend",
            target: spent.publicKey.toBase58(),
            descendants: [],
            amount: spent.account.directSpent
              .sub(old.account.directSpent)
              .toString(),
            signature: transactionRef.current,
          });
        } else if (
          next.organization.totalReclaimed.gt(
            previous.organization.totalReclaimed,
          )
        ) {
          setTransition({
            key: Date.now(),
            kind: "reclaim",
            target: next.organization.rootMandate.toBase58(),
            descendants: [],
            amount: next.organization.totalReclaimed
              .sub(previous.organization.totalReclaimed)
              .toString(),
            signature: transactionRef.current,
          });
        }
      }
      snapshotRef.current = next;
      setSnapshot(next);
      setLastRead(Date.now());
      setStale(false);
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
        ]
          .sort((a, b) => (b.occurredAt ?? 0) - (a.occurredAt ?? 0))
          .slice(0, 30);
      });
      return next;
    },
    [client, organization],
  );
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const update = async () => {
      try {
        const slot = await client.verifyDeployment();
        if (!cancelled) setHealth(`LIVE · slot ${slot.toLocaleString()}`);
        if (organization && !cancelled) await refresh();
      } catch (e) {
        if (!cancelled) {
          setHealth(e instanceof Error ? e.message : String(e));
          setStale(true);
        }
      }
    };
    if (!busy) void update();
    const timer = setInterval(() => {
      if (!busy) void update();
    }, 8_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [client, organization, refresh, busy, enabled]);
  async function run(
    title: string,
    task: () => Promise<
      string | void | { signature: string; organization: PublicKey }
    >,
    address?: string,
  ) {
    if (busy) return;
    setBusy(title);
    setTransaction({ phase: "working", title });
    progressRef.current = {};
    setError("");
    setRejection(undefined);
    let confirmedSignature: string | undefined;
    try {
      const outcome = await task();
      const signature =
        typeof outcome === "object" ? outcome.signature : outcome;
      const readAddress =
        typeof outcome === "object" ? outcome.organization.toBase58() : address;
      confirmedSignature = signature || undefined;
      transactionRef.current = signature || undefined;
      if (signature) {
        setTransaction({
          phase: "confirmed",
          title,
          signature,
          slot: progressRef.current.slot,
        });
        addActivity({
          title,
          signature,
          status: "confirmed",
          detail: progressRef.current.slot
            ? `Confirmation observed at RPC slot ${progressRef.current.slot}`
            : "Transaction confirmed",
          slot: progressRef.current.slot,
          time: new Date().toLocaleTimeString(),
        });
      } else setTransaction({ phase: "idle", title: "" });
      await refresh(
        readAddress ?? snapshotRef.current?.address.toBase58() ?? organization,
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(
        confirmedSignature
          ? `Transaction confirmed; account refresh failed: ${message}`
          : message,
      );
      if (
        confirmedSignature ||
        title === "Refresh accounts" ||
        title === "Read organization"
      )
        setStale(true);
      if (!confirmedSignature)
        setTransaction({
          phase:
            !(e instanceof ProtocolRejection) &&
            !(e instanceof SimulationRejection) &&
            (progressRef.current.phase === "pending" ||
              progressRef.current.phase === "submitting")
              ? "unknown"
              : "error",
          title,
          message:
            e instanceof SimulationRejection
              ? `RPC simulation rejected before submission. No confirmed failed transaction. ${e.code ?? ""}: ${message}`
              : !(e instanceof ProtocolRejection) &&
                  (progressRef.current.phase === "pending" ||
                    progressRef.current.phase === "submitting")
                ? progressRef.current.signature
                  ? `Confirmation unknown. Check the submitted signature before retrying. ${message}`
                  : `Submission outcome unknown; RPC returned no signature. Do not assume success or retry automatically. ${message}`
                : e instanceof ProtocolRejection
                  ? `Submitted and failed on-chain; transaction slot ${e.slot ?? "unavailable"}; fee ${e.fee ?? "unavailable"} lamports. ${message}`
                  : progressRef.current.phase === "awaiting-signature"
                    ? `Wallet signing did not complete; no transaction sent. ${message}`
                    : `Rejected before submission. ${message}`,
          signature:
            e instanceof ProtocolRejection
              ? e.signature
              : progressRef.current.signature,
        });
      if (e instanceof ProtocolRejection) {
        setRejection(e);
        addActivity({
          title: "Payment rejected",
          detail: `${e.code ?? "Program rejection"}: ${message}`,
          signature: e.signature,
          slot: e.slot,
          fee: e.fee,
          logs: e.logs,
          status: "rejected",
          time: new Date().toLocaleTimeString(),
        });
      } else if (e instanceof SimulationRejection) {
        setRejection(e);
        addActivity({
          title: "RPC simulation rejected before submission",
          detail: `${e.code ?? "Simulation rejection"}: ${message}. No transaction submitted.`,
          logs: e.logs,
          status: "rejected",
          time: new Date().toLocaleTimeString(),
        });
      }
    } finally {
      transactionRef.current = undefined;
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
      return new MandateClient(keypairWallet(pair), reportTransaction);
    }
    if (!wallet?.publicKey.equals(address))
      throw new Error(
        "Connect the wallet matching this operation's controller",
      );
    return client;
  }
  async function initialize(owner?: Keypair) {
    setReleased("");
    setTransition(undefined);
    setRevocations({});
    snapshotRef.current = undefined;
    await run("Initializing real localnet demo", async () => {
      const session = await initializeDemo(setBusy, addActivity, owner);
      setDemo(session);
      setWallet(keypairWallet(session.owner));
      setOrganization(session.organization.toBase58());
      const ownerClient = new MandateClient(keypairWallet(session.owner));
      const next = await ownerClient.load(session.organization);
      setSnapshot(next);
      snapshotRef.current = next;
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
  const refreshAccounts = useCallback(
    async (address?: string) => {
      await refresh(address);
    },
    [refresh],
  );
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
    transaction,
    canTransact: enabled && !stale && health.startsWith("LIVE"),
    lastRead,
    stale,
    error,
    rejection,
    health,
    released,
    transition,
    revocations,
    setReleased,
    refresh: refreshAccounts,
    revalidate: refresh,
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
