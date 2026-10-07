import type { ConnectionConfig } from "@solana/web3.js";

function retryDelay(value: string | null) {
  if (!value) return 0;
  if (/^\d+(\.\d+)?$/.test(value.trim()))
    return Math.ceil(Number(value) * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : 0;
}

// Two bounded lanes: receipt bodies cannot hold current account reads hostage.
// Both lanes share launch pacing/backoff; sends are never replayed here.
export function createRpcFetch(
  transport = globalThis.fetch,
  interval = 1000,
  timeoutMs = 15_000,
) {
  const queues = {
    current: Promise.resolve() as Promise<unknown>,
    receipt: Promise.resolve() as Promise<unknown>,
  };
  let launches: Promise<unknown> = Promise.resolve();
  let next = 0;
  let nextReceipt = 0;
  const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const paced: NonNullable<ConnectionConfig["fetch"]> = (url, init) => {
    const method = JSON.parse(String(init?.body)).method;
    const lane = method === "getTransaction" ? "receipt" : "current";
    const task = queues[lane].then(async () => {
      for (let attempt = 0; attempt < 4; attempt++) {
        // Receipt-specific pacing must wait outside the shared launch queue.
        if (lane === "receipt")
          await pause(Math.max(0, nextReceipt - Date.now()));
        const launch = launches.then(async () => {
          while (next > Date.now()) await pause(next - Date.now());
          init?.signal?.throwIfAborted();
          next = Date.now() + interval;
          if (lane === "receipt")
            nextReceipt =
              Date.now() + (interval > 0 ? Math.max(interval, 3500) : 0);
        });
        launches = launch.catch(() => {});
        await launch;
        const controller = new AbortController();
        const timer = setTimeout(
          () =>
            controller.abort(
              new Error(
                `Devnet RPC request timed out after ${timeoutMs} ms. Result unknown; reconcile any saved signature.`,
              ),
            ),
          timeoutMs,
        );
        let response: Response;
        try {
          response = await transport(url, {
            ...init,
            signal: init?.signal
              ? AbortSignal.any([init.signal, controller.signal])
              : controller.signal,
          });
          // Fetch resolves at headers; keep the deadline active until the RPC
          // body is received too, otherwise a stalled payload holds reads forever.
          const body = response.body ? await response.arrayBuffer() : null;
          response = new Response(body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        } finally {
          clearTimeout(timer);
        }
        next = Math.max(
          next,
          Date.now() + retryDelay(response.headers.get("retry-after")),
        );
        if (
          method !== "sendTransaction" &&
          attempt < 3 &&
          (response.status === 429 || response.status >= 500)
        ) {
          next = Math.max(
            next,
            Date.now() +
              Math.max(interval >= 1000 ? 10000 : 500, interval) *
                (attempt + 1),
          );
          continue;
        }
        return response;
      }
      throw Error("RPC read retries exhausted");
    });
    queues[lane] = task.catch(() => {});
    return task;
  };
  return paced;
}
export const pacedRpcFetch = createRpcFetch();
