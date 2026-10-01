use anchor_lang::prelude::*;

use crate::{errors::MandateError, events::BranchRevoked, state::*, validation};

#[derive(Accounts)]
pub struct RevokeBranch<'info> {
    pub revoker: Signer<'info>,
    #[account(seeds = [b"organization", organization.authority.as_ref(), &organization.organization_id.to_le_bytes()], bump = organization.bump)]
    pub organization: Account<'info, Organization>,
    #[account(mut, has_one = organization @ MandateError::WrongOrganization)]
    pub parent: Account<'info, Mandate>,
    #[account(mut, has_one = organization @ MandateError::WrongOrganization)]
    pub target: Account<'info, Mandate>,
}

pub fn handle_revoke_branch(ctx: Context<RevokeBranch>) -> Result<()> {
    let target = &mut ctx.accounts.target;
    require!(
        target.key() != ctx.accounts.organization.root_mandate && target.depth > 0,
        MandateError::CannotRevokeRoot
    );
    require!(
        target.status == MandateStatus::Active,
        MandateError::AlreadyRevoked
    );
    require_keys_eq!(
        target.parent,
        ctx.accounts.parent.key(),
        MandateError::InvalidAncestorPath
    );
    require!(
        ctx.accounts.revoker.key() == ctx.accounts.parent.controller
            || ctx.accounts.revoker.key() == ctx.accounts.organization.authority,
        MandateError::Unauthorized
    );
    validation::lineage(
        ctx.accounts.organization.key(),
        &ctx.accounts.organization,
        ctx.accounts.parent.key(),
        &ctx.accounts.parent,
        ctx.remaining_accounts,
        false,
    )?;
    validation::canonical_node(
        ctx.accounts.organization.key(),
        &ctx.accounts.organization,
        target.key(),
        target,
    )?;
    require!(
        target.depth
            == ctx
                .accounts
                .parent
                .depth
                .checked_add(1)
                .ok_or_else(|| error!(MandateError::ArithmeticOverflow))?,
        MandateError::InvalidAncestorPath
    );
    let released = target.subtree_remaining;
    target.status = MandateStatus::Revoked;
    target.self_available = 0;
    target.subtree_remaining = 0;
    // Capital never left the parent's subtree: only its unreserved authority changes.
    ctx.accounts.parent.self_available =
        validation::add(ctx.accounts.parent.self_available, released)?;
    emit!(BranchRevoked {
        organization: ctx.accounts.organization.key(),
        target: target.key(),
        parent: ctx.accounts.parent.key(),
        revoked_by: ctx.accounts.revoker.key(),
        released
    });
    Ok(())
}
