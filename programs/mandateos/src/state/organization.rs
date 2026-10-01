use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Organization {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub root_mandate: Pubkey,
    pub organization_id: u64,
    pub max_depth: u8,
    pub total_funded: u64,
    pub total_spent: u64,
    pub total_reclaimed: u64,
    pub bump: u8,
    pub vault_bump: u8,
}
