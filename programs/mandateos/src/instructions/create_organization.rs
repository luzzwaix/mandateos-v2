use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::{errors::MandateError, events::OrganizationCreated, state::*};

#[derive(Accounts)]
#[instruction(organization_id: u64)]
pub struct CreateOrganization<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(init, payer = authority, space = 8 + Organization::INIT_SPACE,
        seeds = [b"organization", authority.key().as_ref(), &organization_id.to_le_bytes()], bump)]
    pub organization: Account<'info, Organization>,
    #[account(init, payer = authority, space = 8 + Mandate::INIT_SPACE,
        seeds = [b"mandate", organization.key().as_ref(), b"root"], bump)]
    pub root: Account<'info, Mandate>,
    #[account(init, payer = authority, seeds = [b"vault", organization.key().as_ref()], bump,
        token::mint = mint, token::authority = organization)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_create_organization(
    ctx: Context<CreateOrganization>,
    organization_id: u64,
    max_depth: u8,
) -> Result<()> {
    require!((1..=4).contains(&max_depth), MandateError::MaxDepthExceeded);
    ctx.accounts.organization.set_inner(Organization {
        authority: ctx.accounts.authority.key(),
        mint: ctx.accounts.mint.key(),
        vault: ctx.accounts.vault.key(),
        root_mandate: ctx.accounts.root.key(),
        organization_id,
        max_depth,
        total_funded: 0,
        total_spent: 0,
        total_reclaimed: 0,
        bump: ctx.bumps.organization,
        vault_bump: ctx.bumps.vault,
    });
    ctx.accounts.root.set_inner(Mandate {
        organization: ctx.accounts.organization.key(),
        parent: Pubkey::default(),
        controller: ctx.accounts.authority.key(),
        depth: 0,
        status: MandateStatus::Active,
        initial_budget: 0,
        self_available: 0,
        subtree_remaining: 0,
        direct_spent: 0,
        next_child_index: 0,
        child_index: 0,
        bump: ctx.bumps.root,
    });
    emit!(OrganizationCreated {
        organization: ctx.accounts.organization.key(),
        authority: ctx.accounts.authority.key(),
        mint: ctx.accounts.mint.key(),
        root: ctx.accounts.root.key(),
        max_depth,
    });
    Ok(())
}
