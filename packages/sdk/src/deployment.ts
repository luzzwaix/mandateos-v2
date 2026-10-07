import { PublicKey, type AccountInfo, type Connection } from "@solana/web3.js";
import artifact from "./build-evidence.json";

const loader = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");

// Compare the actual deployed ELF with the artifact built from this source.
// An executable address or a published IDL alone does not prove binary parity.
export async function verifyProgramBinary(
  rpc: Connection,
  address: PublicKey,
  program: AccountInfo<Buffer>,
) {
  if (
    artifact.address !== address.toBase58() ||
    !artifact.sha256 ||
    !artifact.byteLength
  )
    throw new Error(
      "Source build evidence missing or mismatched. Build the intended program before enabling transactions.",
    );
  if (
    !program.owner.equals(loader) ||
    program.data.length !== 36 ||
    program.data.readUInt32LE(0) !== 2
  )
    throw new Error("Unsupported deployed program loader or account layout");
  const programData = new PublicKey(program.data.subarray(4, 36));
  const [canonical] = PublicKey.findProgramAddressSync(
    [address.toBuffer()],
    loader,
  );
  if (!programData.equals(canonical))
    throw new Error("Noncanonical ProgramData account");
  const info = await rpc.getAccountInfo(programData, "confirmed");
  if (
    !info ||
    !info.owner.equals(loader) ||
    info.data.length < 45 + artifact.byteLength ||
    info.data.readUInt32LE(0) !== 3
  )
    throw new Error("Deployed ProgramData missing or invalid");
  const elf = new Uint8Array(info.data.subarray(45, 45 + artifact.byteLength));
  const digest = await crypto.subtle.digest("SHA-256", elf);
  const hash = Array.from(new Uint8Array(digest), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
  if (
    hash !== artifact.sha256 ||
    info.data.subarray(45 + artifact.byteLength).some((n) => n !== 0)
  )
    throw new Error(
      "Deployed binary differs from the source build. Transactions disabled.",
    );
  return {
    programData,
    deployedSlot: info.data.readBigUInt64LE(4).toString(),
    sha256: hash,
  };
}
