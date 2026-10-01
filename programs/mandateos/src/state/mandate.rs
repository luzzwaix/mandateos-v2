use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Mandate {
    pub organization: Pubkey,
    pub parent: Pubkey,
    pub controller: Pubkey,
    pub depth: u8,
    pub status: MandateStatus,
    pub initial_budget: u64,
    pub self_available: u64,
    pub subtree_remaining: u64,
    pub direct_spent: u64,
    pub next_child_index: u64,
    pub child_index: u64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum MandateStatus {
    Active,
    Revoked,
}
