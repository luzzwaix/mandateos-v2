#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;
pub mod validation;

use instructions::*;

declare_id!("125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd");

#[program]
pub mod mandateos {
    use super::*;

    pub fn create_organization(
        ctx: Context<CreateOrganization>,
        organization_id: u64,
        max_depth: u8,
    ) -> Result<()> {
        instructions::create_organization::handle_create_organization(
            ctx,
            organization_id,
            max_depth,
        )
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handle_deposit(ctx, amount)
    }

    pub fn delegate(
        ctx: Context<Delegate>,
        child_controller: Pubkey,
        amount: u64,
        child_index: u64,
    ) -> Result<()> {
        instructions::delegate::handle_delegate(ctx, child_controller, amount, child_index)
    }

    pub fn spend(ctx: Context<Spend>, amount: u64) -> Result<()> {
        instructions::spend::handle_spend(ctx, amount)
    }

    pub fn revoke_branch(ctx: Context<RevokeBranch>) -> Result<()> {
        instructions::revoke_branch::handle_revoke_branch(ctx)
    }

    pub fn reclaim(ctx: Context<Reclaim>, amount: u64) -> Result<()> {
        instructions::reclaim::handle_reclaim(ctx, amount)
    }

    pub fn create_bounty(
        ctx: Context<CreateBounty>,
        bounty_id: u64,
        reward: u64,
        verifier: Pubkey,
    ) -> Result<()> {
        instructions::create_bounty::handle_create_bounty(ctx, bounty_id, reward, verifier)
    }

    pub fn submit_result(ctx: Context<SubmitResult>, result_hash: [u8; 32]) -> Result<()> {
        instructions::submit_result::handle_submit_result(ctx, result_hash)
    }

    pub fn settle_bounty(ctx: Context<SettleBounty>) -> Result<()> {
        instructions::settle_bounty::handle_settle_bounty(ctx)
    }
}
