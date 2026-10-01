use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

use crate::{errors::MandateError, events::Spent, state::*, validation};

#[derive(Accounts)]
pub struct Spend<'info> {
    pub controller: Signer<'info>,
    #[account(mut, seeds = [b"organization", organization.authority.as_ref(), &organization.organization_id.to_le_bytes()],
        bump = organization.bump, has_one = mint @ MandateError::InvalidMint, has_one = vault)]
    pub organization: Account<'info, Organization>,
    #[account(mut, has_one = organization @ MandateError::WrongOrganization,
        has_one = controller @ MandateError::Unauthorized)]
    pub node: Account<'info, Mandate>,
    pub mint: Account<'info, Mint>,
    #[account(mut, seeds = [b"vault", organization.key().as_ref()], bump = organization.vault_bump,
        token::mint = mint, token::authority = organization)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut, constraint = destination.mint == mint.key() @ MandateError::InvalidMint,
        constraint = destination.key() != vault.key() @ MandateError::InvalidDestination)]
    pub destination: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

pub fn handle_spend(ctx: Context<Spend>, amount: u64) -> Result<()> {
    let mut ancestors = validation::lineage(
        ctx.accounts.organization.key(),
        &ctx.accounts.organization,
        ctx.accounts.node.key(),
        &ctx.accounts.node,
        ctx.remaining_accounts,
        true,
    )?;
    let node = &mut ctx.accounts.node;
    validation::available(node, amount)?;
    node.self_available = validation::sub(node.self_available, amount)?;
    node.subtree_remaining = validation::sub(node.subtree_remaining, amount)?;
    node.direct_spent = validation::add(node.direct_spent, amount)?;
    validation::spend_ancestors(ctx.remaining_accounts, &mut ancestors, amount)?;
    let org = &mut ctx.accounts.organization;
    org.total_spent = validation::add(org.total_spent, amount)?;
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
    emit!(Spent {
        organization: org.key(),
        mandate: node.key(),
        controller: ctx.accounts.controller.key(),
        destination: ctx.accounts.destination.key(),
        amount
    });
    Ok(())
}
