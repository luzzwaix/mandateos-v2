# Devnet deployment attempt — stopped, 6 October 2026

The authorized deployment command was invoked **once**, at 11:56:09 UTC. It exited with code **1** at 11:57:21 UTC:

```text
Data writes to account failed: Custom error: Max retries exceeded
```

No deployment was repeated, no buffer was closed, and no Core lifecycle transaction was sent. The error is a CLI upload/transport failure, not evidence of a confirmed failed final deployment transaction. No final deployment signature was returned.

## Funding and preflight

The user's incoming Devnet transfer was found by recipient history and parsed from RPC: **2.4 SOL**, sender `C7jMtkonHhz14rBojP7FWSE8xbGjKybA5FLmzTmTGLpo`, recipient `3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm`, finalized at slot **508084295**, fee **79,934 lamports**. It exceeded the planned release budget by 17,114,120 lamports and funded the correct payer.

[Confirmed funding transfer](https://explorer.solana.com/tx/3RHLL62vSte46DnHx9vYSTVpRpYEnijLhiMttpEfZTHttYCvLh7fSvQSak2TUE6qBpQzJv5u8ZkLsg37ToG5AzGN?cluster=devnet)

Before deployment, explicit `https://api.devnet.solana.com` returned the expected Devnet genesis. Program/buffer absence was checked at slot **508084737**, payer **2,400,000,000 lamports** at **508084739**. CLI-derived program, payer and buffer public keys matched the existing identities. Nothing changed the Program ID or authority.

The current ELF was still **462,984 bytes**, SHA256 `ecf178ec3a259f3d1ddd48441b86ce9470ae3db74aa60ab7e8fadcae089edd35`. Preflight was enabled; command flags and public attempt metadata are saved in ignored release artifacts. No replacement program key was generated.

## Read-only state after failure

Observed at **11:58:14 UTC**, commitment `confirmed`, state/balance slot **508085375**:

| Account                                                              | Result                                                       |
| -------------------------------------------------------------------- | ------------------------------------------------------------ |
| Program `125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd`               | Absent; executable program not established                   |
| Canonical ProgramData `5n3oHHm4RxzchLBpcM3MXZG4WeQdAkGf6mEQourVw9J2` | Absent; deployed upgrade authority cannot be verified        |
| Buffer `3QazcRm23Dm4nHeWzifbPxsBWegxrpr1aJrNUGG4Q8UE`                | Exists, upgradeable-loader-owned, 463,021 bytes, state tag 1 |
| Actual buffer authority                                              | `3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm`               |
| Buffer rent deposit                                                  | 2,352,837,560 lamports / **2.352837560 SOL**                 |
| Payer balance                                                        | 47,072,440 lamports / **0.047072440 SOL**                    |

Comparison of public buffer bytes with the unchanged ELF found **16 matching 1,012-byte upload chunks**, **442 missing chunks**. Buffer history returned **17 successful finalized transactions**, zero confirmed failed transactions in that returned history. Unconfirmed/submission outcomes for other chunks are not established by this history; no signatures are invented for them.

Two individual receipts were fetched and verified with no transaction error:

| Observed receipt              |      Slot | Fee lamports | Explorer                                                                                                                                                                                                                           |
| ----------------------------- | --------: | -----------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Buffer initialization         | 508084866 |       10,000 | [3g7KWtpcvEwrLjG5WWrnUeptrX3tCJFrNxgwESkgqqwrypJLu4Jrkd2FbaNWKDPYLkaY619QuN7MX1mo6nArjDFt](https://explorer.solana.com/tx/3g7KWtpcvEwrLjG5WWrnUeptrX3tCJFrNxgwESkgqqwrypJLu4Jrkd2FbaNWKDPYLkaY619QuN7MX1mo6nArjDFt?cluster=devnet) |
| Latest confirmed upload write | 508084875 |        5,000 | [4RYUPrxpeK7vLjYu2KEUjJWFCLyRtVC2MhERg9U4id5VUMo3GunaakLcgexsGgevvecZc29YT18d67yvMCwpERvr](https://explorer.solana.com/tx/4RYUPrxpeK7vLjYu2KEUjJWFCLyRtVC2MhERg9U4id5VUMo3GunaakLcgexsGgevvecZc29YT18d67yvMCwpERvr?cluster=devnet) |

Funding minus the observed buffer deposit and payer balance equals **90,000 lamports**. This reconciles with one 10,000-lamport initialization and sixteen 5,000-lamport writes. The first attempted read-only fetch of all individual receipts encountered RPC **429 Too Many Requests**. A later authorized [paced read-only diagnosis](DEVNET-BUFFER-DIAGNOSTICS.md) fetched all seventeen receipts and verified that 90,000-lamport sum, every write offset/payload and finalized status. The later 429 does not establish the cause of the earlier CLI failure; the deploy log contains no 429.

Core delegation, spend, revoke, descendant rejection, Operations action and reclaim are **not started/unverified on Devnet**. Arena settlement is **not verified**. No browser-wallet success or submission-video success is claimed. Frozen screens and contract semantics remain untouched.

Public local evidence: ignored `artifacts/devnet-release/transfer-verification.json`, `funded-predeploy.json`, `deploy-attempt-once.json`, `deploy-attempt-once.log`, `deploy-result.json`, `deploy-failure-state.json`. Existing private program/payer/buffer files are preserved outside Git. The attempt marker prevents blindly invoking the prepared deployment again. No push, merge, branch switch, reset or new checkpoint occurred; branch remains `devnet-integration`, HEAD `f5b7965dbac9f4b634bfb5eccc6b146046218f68`.
