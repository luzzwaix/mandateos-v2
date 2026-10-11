# Verified MVP scope — 12 October 2026

Production: <https://mandateos-protocol.vercel.app/>. Public source: <https://github.com/luzzwaix/mandateos-v2>, default branch `docs/github-launch` when audited. Production provenance identifies `f4b0b4de02d4bbe4264391e0da727108597d1459`; the separate local Phantom timeout hotfix is not part of that release.

## Evidence classes

- Story/Demo is simulated and sends no transactions.
- Command/Arena perform public Devnet reads independently of wallet connection. The SDK checks genesis, deployed binary identity, owners/layouts and ancestry. Reads are observations, not promises of later execution success.
- Core denial, sibling spend and Arena settlement receipts are historical finalized CLI transactions. The current browser/worker did not perform them.
- The reference worker has no LLM. Its CLI performs genuine read-only inspection; authorized-payment tests use RPC stubs.

## Current audit

On 12 October, actual Edge inspection covered Story delegation/trace/preview/revoke, Demo → Command handoff, real Scraper `active / blocked`, Research as invalid ancestor, independent Operations, actual Explorer logs, Arena winner preservation, Developers and browser downloads. RPC confirmed historical 6003 in slot 508121984, successful Operations transfer of 5 test tokens in slot 508122111, and 25-token Arena settlement in slot 508122947. No transactions were submitted.

The SDK read-only example ran outside the repository and returned the real ancestry and structured `AncestorRevoked / 6003`. Program/SDK/worker/frontend source trees are unchanged by this documentation/media audit.

**64 local-validator integration tests** are preserved baseline evidence: 48 Core + 16 Arena. They were not rerun for this documentation pass. [Historical verification](DEVNET-RELEASE.md), [deployed MVP proof](DEVNET-MVP-VERIFICATION.md), [receipts](devnet-mvp-proof.json).

## Wallet and security boundaries

Founder reports successful native Phantom Connect. Connect shares a public key and enables signature requests; it does not grant controller rights, create an organization, fund a vault or execute payment. Our extension-free audit browser showed the actual missing-provider error. Native signing and a complete owner-controlled browser lifecycle remain unverified.

Historical organization authority is `3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm`; child controllers may differ. The program requires the legitimate action-specific signer. Another connected wallet cannot bypass that boundary.

The deployed baseline retains the original unbounded provider-connect path. A separate local timeout/cancellation hotfix exists; native failure/root cause and production promotion remain separate work. Wallet-free recording does not depend on it.

Unknown transaction outcomes must be reconciled before a new attempt. Never blindly retry or present Demo data as fresh Devnet evidence. Keep private RPC credentials in execution environments.

The external SDK install on 10 October reported 9 dependency advisories (3 moderate, 6 high); the root install reported 15. These are dated observations, not a current security certification. Dependencies were not upgraded in the documentation sprint.

Classic SPL Token only. Fixture tokens are test tokens, not USDC. Arena uses a trusted verifier and has no bounty cancellation path. No production security audit, mainnet readiness, autonomous payment, adoption or customer revenue is claimed.

## License

The repository is public; no project license has been chosen or added. Public visibility is not an approved open-source license. Choosing a license requires the owner's decision.
