import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";

const bytes = (n: BN | bigint | number) =>
  new BN(n.toString()).toArrayLike(Buffer, "le", 8);
const pda = (program: PublicKey, seeds: Uint8Array[]) =>
  PublicKey.findProgramAddressSync(seeds, program)[0];
export const organizationPda = (
  p: PublicKey,
  authority: PublicKey,
  id: BN | number,
) => pda(p, [Buffer.from("organization"), authority.toBuffer(), bytes(id)]);
export const rootPda = (p: PublicKey, org: PublicKey) =>
  pda(p, [Buffer.from("mandate"), org.toBuffer(), Buffer.from("root")]);
export const vaultPda = (p: PublicKey, org: PublicKey) =>
  pda(p, [Buffer.from("vault"), org.toBuffer()]);
export const childPda = (
  p: PublicKey,
  org: PublicKey,
  parent: PublicKey,
  index: BN,
) =>
  pda(p, [
    Buffer.from("mandate"),
    org.toBuffer(),
    parent.toBuffer(),
    bytes(index),
  ]);
export const bountyPda = (p: PublicKey, org: PublicKey, id: BN) =>
  pda(p, [Buffer.from("bounty"), org.toBuffer(), bytes(id)]);
export const submissionPda = (
  p: PublicKey,
  bounty: PublicKey,
  agent: PublicKey,
) => pda(p, [Buffer.from("submission"), bounty.toBuffer(), agent.toBuffer()]);

export function toBaseUnits(value: string, decimals: number): BN {
  if (!/^\d+(\.\d+)?$/.test(value))
    throw new Error("Enter a positive token amount");
  const [whole, fractional = ""] = value.split(".");
  if (fractional.length > decimals)
    throw new Error(`This mint supports ${decimals} decimal places`);
  const n =
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt(fractional.padEnd(decimals, "0") || "0");
  if (n <= 0n || n > 18_446_744_073_709_551_615n)
    throw new Error("Amount is outside the positive u64 range");
  return new BN(n.toString());
}
export function formatUnits(value: BN | bigint, decimals = 6): string {
  const n = BigInt(value.toString());
  const scale = 10n ** BigInt(decimals);
  const fraction = (n % scale)
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");
  return `${(n / scale).toLocaleString("en-US")}${fraction ? `.${fraction}` : ""}`;
}
export const short = (value: PublicKey | string) => {
  const s = value.toString();
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
};
