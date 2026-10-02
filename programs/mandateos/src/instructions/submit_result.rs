use anchor_lang::prelude::*;

use crate::{errors::MandateError, events::ResultSubmitted, state::*};

#[derive(Accounts)]
pub struct SubmitResult<'info> {
    #[account(mut)]
    pub agent: Signer<'info>,
    #[account(mut, seeds = [b"bounty", bounty.organization.as_ref(), &bounty.bounty_id.to_le_bytes()],
        bump = bounty.bump)]
    pub bounty: Account<'info, Bounty>,
    #[account(init, payer = agent, space = 8 + Submission::INIT_SPACE,
        seeds = [b"submission", bounty.key().as_ref(), agent.key().as_ref()], bump)]
    pub submission: Account<'info, Submission>,
    pub system_program: Program<'info, System>,
}

pub fn handle_submit_result(ctx: Context<SubmitResult>, result_hash: [u8; 32]) -> Result<()> {
    require!(
        ctx.remaining_accounts.is_empty(),
        MandateError::InvalidAncestorPath
    );
    let bounty = &mut ctx.accounts.bounty;
    require!(
        bounty.status == BountyStatus::Open,
        MandateError::BountyNotOpen
    );
    bounty.submission_count = bounty
        .submission_count
        .checked_add(1)
        .ok_or_else(|| error!(MandateError::ArithmeticOverflow))?;
    ctx.accounts.submission.set_inner(Submission {
        bounty: bounty.key(),
        agent: ctx.accounts.agent.key(),
        result_hash,
        submitted_at: Clock::get()?.unix_timestamp,
        bump: ctx.bumps.submission,
    });
    emit!(ResultSubmitted {
        bounty: bounty.key(),
        submission: ctx.accounts.submission.key(),
        agent: ctx.accounts.agent.key(),
        result_hash,
    });
    Ok(())
}
