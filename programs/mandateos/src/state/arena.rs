use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Bounty {
    pub organization: Pubkey,
    pub creator: Pubkey,
    pub verifier: Pubkey,
    pub bounty_id: u64,
    pub reward: u64,
    pub status: BountyStatus,
    pub winner: Pubkey,
    pub submission_count: u32,
    pub created_at: i64,
    pub settled_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum BountyStatus {
    Open,
    Settled,
}

#[account]
#[derive(InitSpace)]
pub struct Submission {
    pub bounty: Pubkey,
    pub agent: Pubkey,
    pub result_hash: [u8; 32],
    pub submitted_at: i64,
    pub bump: u8,
}
