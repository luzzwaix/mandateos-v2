use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

use crate::{errors::MandateError, events::Deposited, state::*, validation};

#[derive(Accounts)]
pub struct Deposit<'info> {
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
    #[account(mut, constraint = source.mint == mint.key() @ MandateError::InvalidMint,
        constraint = source.owner == authority.key() @ MandateError::Unauthorized)]
    pub source: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

pub fn handle_deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(amount > 0, MandateError::InvalidAmount);
    validation::lineage(
        ctx.accounts.organization.key(),
        &ctx.accounts.organization,
        ctx.accounts.root.key(),
        &ctx.accounts.root,
        ctx.remaining_accounts,
        false,
    )?;
    let org = &mut ctx.accounts.organization;
    let root = &mut ctx.accounts.root;
    org.total_funded = validation::add(org.total_funded, amount)?;
    root.initial_budget = validation::add(root.initial_budget, amount)?;
    root.self_available = validation::add(root.self_available, amount)?;
    root.subtree_remaining = validation::add(root.subtree_remaining, amount)?;
    token::transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.source.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount,
        ctx.accounts.mint.decimals,
    )?;
    emit!(Deposited {
        organization: org.key(),
        amount
    });
    Ok(())
}
