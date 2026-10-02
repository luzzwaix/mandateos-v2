use anchor_lang::prelude::*;

#[event]
pub struct OrganizationCreated {
    pub organization: Pubkey,
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub root: Pubkey,
    pub max_depth: u8,
}

#[event]
pub struct Deposited {
    pub organization: Pubkey,
    pub amount: u64,
}

#[event]
pub struct MandateDelegated {
    pub organization: Pubkey,
    pub parent: Pubkey,
    pub child: Pubkey,
    pub controller: Pubkey,
    pub amount: u64,
    pub depth: u8,
}

#[event]
pub struct Spent {
    pub organization: Pubkey,
    pub mandate: Pubkey,
    pub controller: Pubkey,
    pub destination: Pubkey,
    pub amount: u64,
}

#[event]
pub struct BranchRevoked {
    pub organization: Pubkey,
    pub target: Pubkey,
    pub parent: Pubkey,
    pub revoked_by: Pubkey,
    pub released: u64,
}

#[event]
pub struct CapitalReclaimed {
    pub organization: Pubkey,
    pub destination: Pubkey,
    pub amount: u64,
}

#[event]
pub struct BountyCreated {
    pub organization: Pubkey,
    pub bounty: Pubkey,
    pub creator: Pubkey,
    pub verifier: Pubkey,
    pub reward: u64,
}

#[event]
pub struct ResultSubmitted {
    pub bounty: Pubkey,
    pub submission: Pubkey,
    pub agent: Pubkey,
    pub result_hash: [u8; 32],
}

#[event]
pub struct BountySettled {
    pub organization: Pubkey,
    pub bounty: Pubkey,
    pub winner: Pubkey,
    pub reward: u64,
    pub destination: Pubkey,
}
