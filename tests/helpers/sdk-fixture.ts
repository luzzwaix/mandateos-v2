import { BN } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  PROGRAM_ADDRESS,
  rootPda,
  childPda,
  type Snapshot,
} from "../../packages/sdk/src";
const key = () => Keypair.generate().publicKey;
export function authorityFixture(): Snapshot {
  const address = key(),
    controller = key(),
    root = rootPda(new PublicKey(PROGRAM_ADDRESS), address);
  const row = (
    publicKey: PublicKey,
    parent: PublicKey,
    depth: number,
    childIndex = 0,
  ) => ({
    publicKey,
    account: {
      organization: address,
      parent,
      controller,
      depth,
      status: { active: {} },
      selfAvailable: new BN(100),
      subtreeRemaining: new BN(100),
      initialBudget: new BN(100),
      directSpent: new BN(0),
      nextChildIndex: new BN(0),
      childIndex: new BN(childIndex),
    },
  });
  const program = new PublicKey(PROGRAM_ADDRESS);
  const research = row(childPda(program, address, root, new BN(0)), root, 1),
    data = row(
      childPda(program, address, research.publicKey, new BN(0)),
      research.publicKey,
      2,
    );
  return {
    address,
    organization: {
      authority: controller,
      mint: key(),
      vault: key(),
      rootMandate: root,
      organizationId: new BN(1),
      maxDepth: 4,
      totalFunded: new BN(500),
      totalSpent: new BN(0),
      totalReclaimed: new BN(0),
    },
    nodes: [
      row(root, PublicKey.default, 0),
      research,
      data,
      row(
        childPda(program, address, data.publicKey, new BN(0)),
        data.publicKey,
        3,
      ),
      row(childPda(program, address, root, new BN(1)), root, 1, 1),
    ],
    bounties: [],
    submissions: [],
    decimals: 6,
    vaultBalance: 500n,
  };
}
