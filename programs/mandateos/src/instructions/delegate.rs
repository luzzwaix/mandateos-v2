use anchor_lang::prelude::*;

use crate::{errors::MandateError, events::MandateDelegated, state::*, validation};

#[derive(Accounts)]
#[instruction(child_controller: Pubkey, amount: u64, child_index: u64)]
pub struct Delegate<'info> {
    #[account(mut)]
    pub controller: Signer<'info>,
    #[account(seeds = [b"organization", organization.authority.as_ref(), &organization.organization_id.to_le_bytes()], bump = organization.bump)]
    pub organization: Account<'info, Organization>,
    #[account(mut, has_one = organization @ MandateError::WrongOrganization,
        has_one = controller @ MandateError::Unauthorized)]
    pub parent: Account<'info, Mandate>,
    #[account(init, payer = controller, space = 8 + Mandate::INIT_SPACE,
        seeds = [b"mandate", organization.key().as_ref(), parent.key().as_ref(), &child_index.to_le_bytes()], bump)]
    pub child: Account<'info, Mandate>,
    pub system_program: Program<'info, System>,
}

pub fn handle_delegate(
    ctx: Context<Delegate>,
    child_controller: Pubkey,
    amount: u64,
    child_index: u64,
) -> Result<()> {
    validation::lineage(
        ctx.accounts.organization.key(),
        &ctx.accounts.organization,
        ctx.accounts.parent.key(),
        &ctx.accounts.parent,
        ctx.remaining_accounts,
        false,
    )?;
    let parent = &mut ctx.accounts.parent;
    validation::available(parent, amount)?;
    require!(
        child_index == parent.next_child_index,
        MandateError::InvalidChildIndex
    );
    let depth = parent
        .depth
        .checked_add(1)
        .ok_or_else(|| error!(MandateError::ArithmeticOverflow))?;
    require!(
        depth <= ctx.accounts.organization.max_depth,
        MandateError::MaxDepthExceeded
    );
    ctx.accounts.child.set_inner(Mandate {
        organization: ctx.accounts.organization.key(),
        parent: parent.key(),
        controller: child_controller,
        depth,
        status: MandateStatus::Active,
        initial_budget: amount,
        self_available: amount,
        subtree_remaining: amount,
        direct_spent: 0,
        next_child_index: 0,
        child_index,
        bump: ctx.bumps.child,
    });
    parent.self_available = validation::sub(parent.self_available, amount)?;
    parent.next_child_index = validation::add(parent.next_child_index, 1)?;
    emit!(MandateDelegated {
        organization: ctx.accounts.organization.key(),
        parent: parent.key(),
        child: ctx.accounts.child.key(),
        controller: child_controller,
        amount,
        depth,
    });
    Ok(())
}
