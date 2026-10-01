#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;
pub mod validation;

use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqkZ5gnk9j8GaZ9epbEYwPqG");

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
}
