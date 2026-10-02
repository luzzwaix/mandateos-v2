use anchor_lang::prelude::*;

use crate::{errors::MandateError, events::BountyCreated, state::*, validation};

#[derive(Accounts)]
#[instruction(bounty_id: u64)]
pub struct CreateBounty<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(seeds = [b"organization", organization.authority.as_ref(), &organization.organization_id.to_le_bytes()],
        bump = organization.bump, has_one = authority @ MandateError::Unauthorized)]
    pub organization: Account<'info, Organization>,
    #[account(mut, seeds = [b"mandate", organization.key().as_ref(), b"root"], bump = root.bump,
        address = organization.root_mandate, has_one = organization @ MandateError::WrongOrganization)]
    pub root: Account<'info, Mandate>,
    #[account(init, payer = authority, space = 8 + Bounty::INIT_SPACE,
        seeds = [b"bounty", organization.key().as_ref(), &bounty_id.to_le_bytes()], bump)]
    pub bounty: Account<'info, Bounty>,
    pub system_program: Program<'info, System>,
}

pub fn handle_create_bounty(
    ctx: Context<CreateBounty>,
    bounty_id: u64,
    reward: u64,
    verifier: Pubkey,
) -> Result<()> {
    validation::lineage(
        ctx.accounts.organization.key(),
        &ctx.accounts.organization,
        ctx.accounts.root.key(),
        &ctx.accounts.root,
        ctx.remaining_accounts,
        false,
    )?;
    validation::available(&ctx.accounts.root, reward)?;
    // Reward stays in the one shared vault. Root cannot spend or reclaim
    // this reservation; only settlement converts it into recorded spending.
    ctx.accounts.root.self_available = validation::sub(ctx.accounts.root.self_available, reward)?;
    let bounty = &mut ctx.accounts.bounty;
    bounty.set_inner(Bounty {
        organization: ctx.accounts.organization.key(),
        creator: ctx.accounts.authority.key(),
        verifier,
        bounty_id,
        reward,
        status: BountyStatus::Open,
        winner: Pubkey::default(),
        submission_count: 0,
        created_at: Clock::get()?.unix_timestamp,
        settled_at: 0,
        bump: ctx.bumps.bounty,
    });
    emit!(BountyCreated {
        organization: bounty.organization,
        bounty: bounty.key(),
        creator: bounty.creator,
        verifier,
        reward,
    });
    Ok(())
}
