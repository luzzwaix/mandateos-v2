use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

use crate::{errors::MandateError, events::BountySettled, state::*, validation};

#[derive(Accounts)]
pub struct SettleBounty<'info> {
    pub verifier: Signer<'info>,
    #[account(mut, seeds = [b"organization", organization.authority.as_ref(), &organization.organization_id.to_le_bytes()],
        bump = organization.bump, has_one = mint @ MandateError::InvalidMint, has_one = vault)]
    pub organization: Box<Account<'info, Organization>>,
    #[account(mut, seeds = [b"mandate", organization.key().as_ref(), b"root"], bump = root.bump,
        address = organization.root_mandate, has_one = organization @ MandateError::WrongOrganization)]
    pub root: Box<Account<'info, Mandate>>,
    #[account(mut, seeds = [b"bounty", organization.key().as_ref(), &bounty.bounty_id.to_le_bytes()],
        bump = bounty.bump, has_one = organization @ MandateError::WrongOrganization,
        has_one = verifier @ MandateError::Unauthorized)]
    pub bounty: Box<Account<'info, Bounty>>,
    #[account(seeds = [b"submission", bounty.key().as_ref(), submission.agent.as_ref()],
        bump = submission.bump, has_one = bounty @ MandateError::InvalidWinner)]
    pub submission: Box<Account<'info, Submission>>,
    pub mint: Box<Account<'info, Mint>>,
    #[account(mut, seeds = [b"vault", organization.key().as_ref()], bump = organization.vault_bump,
        token::mint = mint, token::authority = organization)]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(mut, constraint = destination.mint == mint.key() @ MandateError::InvalidMint,
        constraint = destination.owner == submission.agent @ MandateError::InvalidWinner,
        constraint = destination.key() != vault.key() @ MandateError::InvalidDestination)]
    pub destination: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

pub fn handle_settle_bounty(ctx: Context<SettleBounty>) -> Result<()> {
    validation::lineage(
        ctx.accounts.organization.key(),
        &ctx.accounts.organization,
        ctx.accounts.root.key(),
        &ctx.accounts.root,
        ctx.remaining_accounts,
        false,
    )?;
    let bounty = &mut ctx.accounts.bounty;
    require!(
        bounty.status == BountyStatus::Open,
        MandateError::BountyNotOpen
    );
    let root = &mut ctx.accounts.root;
    root.subtree_remaining = validation::sub(root.subtree_remaining, bounty.reward)?;
    root.direct_spent = validation::add(root.direct_spent, bounty.reward)?;
    let org = &mut ctx.accounts.organization;
    org.total_spent = validation::add(org.total_spent, bounty.reward)?;
    bounty.status = BountyStatus::Settled;
    bounty.winner = ctx.accounts.submission.agent;
    bounty.settled_at = Clock::get()?.unix_timestamp;
    let organization_id = org.organization_id.to_le_bytes();
    let bump = [org.bump];
    let seeds: &[&[u8]] = &[
        b"organization",
        org.authority.as_ref(),
        &organization_id,
        &bump,
    ];
    token::transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.destination.to_account_info(),
                authority: org.to_account_info(),
            },
            &[seeds],
        ),
        bounty.reward,
        ctx.accounts.mint.decimals,
    )?;
    emit!(BountySettled {
        organization: org.key(),
        bounty: bounty.key(),
        winner: bounty.winner,
        reward: bounty.reward,
        destination: ctx.accounts.destination.key(),
    });
    Ok(())
}
