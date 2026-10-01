use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

use crate::{errors::MandateError, events::CapitalReclaimed, state::*, validation};

#[derive(Accounts)]
pub struct Reclaim<'info> {
    pub authority: Signer<'info>,
    #[account(mut, seeds = [b"organization", organization.authority.as_ref(), &organization.organization_id.to_le_bytes()],
        bump = organization.bump, has_one = authority @ MandateError::Unauthorized,
        has_one = mint @ MandateError::InvalidMint, has_one = vault)]
    pub organization: Account<'info, Organization>,
    #[account(mut, seeds = [b"mandate", organization.key().as_ref(), b"root"], bump = root.bump,
        address = organization.root_mandate, has_one = organization @ MandateError::WrongOrganization)]
    pub root: Account<'info, Mandate>,
    pub mint: Account<'info, Mint>,
    #[account(mut, seeds = [b"vault", organization.key().as_ref()], bump = organization.vault_bump,
        token::mint = mint, token::authority = organization)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut, constraint = destination.mint == mint.key() @ MandateError::InvalidMint,
        constraint = destination.owner == authority.key() @ MandateError::Unauthorized,
        constraint = destination.key() != vault.key() @ MandateError::InvalidDestination)]
    pub destination: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

pub fn handle_reclaim(ctx: Context<Reclaim>, amount: u64) -> Result<()> {
    validation::lineage(
        ctx.accounts.organization.key(),
        &ctx.accounts.organization,
        ctx.accounts.root.key(),
        &ctx.accounts.root,
        ctx.remaining_accounts,
        false,
    )?;
    let root = &mut ctx.accounts.root;
    validation::available(root, amount)?;
    root.self_available = validation::sub(root.self_available, amount)?;
    root.subtree_remaining = validation::sub(root.subtree_remaining, amount)?;
    let org = &mut ctx.accounts.organization;
    org.total_reclaimed = validation::add(org.total_reclaimed, amount)?;
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
        amount,
        ctx.accounts.mint.decimals,
    )?;
    emit!(CapitalReclaimed {
        organization: org.key(),
        destination: ctx.accounts.destination.key(),
        amount
    });
    Ok(())
}
