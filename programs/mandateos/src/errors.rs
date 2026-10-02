use anchor_lang::prelude::*;

#[error_code]
pub enum MandateError {
    #[msg("The signer is not authorized for this operation")]
    Unauthorized,
    #[msg("Amount exceeds this mandate's available budget")]
    InsufficientAvailableBudget,
    #[msg("The mandate is revoked")]
    MandateRevoked,
    #[msg("An ancestor is revoked")]
    AncestorRevoked,
    #[msg("Expected the complete ordered canonical parent path to Root")]
    InvalidAncestorPath,
    #[msg("The mandate belongs to another organization")]
    WrongOrganization,
    #[msg("Organization depth must be 1..=4 and delegation cannot exceed it")]
    MaxDepthExceeded,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Root cannot be revoked")]
    CannotRevokeRoot,
    #[msg("The branch has already been revoked")]
    AlreadyRevoked,
    #[msg("Checked accounting arithmetic failed")]
    ArithmeticOverflow,
    #[msg("Token mint does not match the organization's mint")]
    InvalidMint,
    #[msg("Child index must equal the parent's next child index")]
    InvalidChildIndex,
    #[msg("A spending ancestor must be writable")]
    AncestorNotWritable,
    #[msg("The organization vault cannot be a transfer destination")]
    InvalidDestination,
    #[msg("Bounty is already settled")]
    BountyNotOpen,
    #[msg("The selected winner must own the submitted commitment")]
    InvalidWinner,
}
