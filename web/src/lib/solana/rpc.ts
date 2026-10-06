import type { ConnectionConfig } from "@solana/web3.js";

function retryDelay(value: string | null) {
  if (!value) return 0;
  if (/^\d+(\.\d+)?$/.test(value.trim()))
    return Math.ceil(Number(value) * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : 0;
}

// All console connections share this limiter. It serializes HTTP requests,
// honors provider backoff and never repeats an ambiguous send automatically.
export function createRpcFetch(transport = globalThis.fetch, interval = 1000) {
  let queue: Promise<unknown> = Promise.resolve();
  let next = 0;
  let nextReceipt = 0;
  const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const paced: NonNullable<ConnectionConfig["fetch"]> = (url, init) => {
    const task = queue.then(async () => {
      const method = JSON.parse(String(init?.body)).method;
      for (let attempt = 0; attempt < 4; attempt++) {
        await pause(
          Math.max(
            0,
            next - Date.now(),
            method === "getTransaction" ? nextReceipt - Date.now() : 0,
          ),
        );
        next = Date.now() + interval;
        if (method === "getTransaction")
          nextReceipt =
            Date.now() + (interval > 0 ? Math.max(interval, 3500) : 0);
        const response = await transport(url, init);
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
    queue = task.catch(() => {});
    return task;
  };
  return paced;
}
export const pacedRpcFetch = createRpcFetch();
