use anchor_lang::prelude::*;

use crate::{errors::MandateError, state::*};

pub fn add(a: u64, b: u64) -> Result<u64> {
    a.checked_add(b)
        .ok_or_else(|| error!(MandateError::ArithmeticOverflow))
}

pub fn sub(a: u64, b: u64) -> Result<u64> {
    a.checked_sub(b)
        .ok_or_else(|| error!(MandateError::ArithmeticOverflow))
}

pub fn available(node: &Mandate, amount: u64) -> Result<()> {
    require!(amount > 0, MandateError::InvalidAmount);
    require!(
        amount <= node.self_available,
        MandateError::InsufficientAvailableBudget
    );
    Ok(())
}

pub(crate) fn canonical_node(
    organization_key: Pubkey,
    organization: &Organization,
    key: Pubkey,
    node: &Mandate,
) -> Result<()> {
    require_keys_eq!(
        node.organization,
        organization_key,
        MandateError::WrongOrganization
    );
    require!(
        node.depth <= organization.max_depth,
        MandateError::InvalidAncestorPath
    );
    let (expected, bump) = if node.depth == 0 {
        require_keys_eq!(
            key,
            organization.root_mandate,
            MandateError::InvalidAncestorPath
        );
        require_keys_eq!(
            node.parent,
            Pubkey::default(),
            MandateError::InvalidAncestorPath
        );
        require_keys_eq!(
            node.controller,
            organization.authority,
            MandateError::InvalidAncestorPath
        );
        Pubkey::find_program_address(
            &[b"mandate", organization_key.as_ref(), b"root"],
            &crate::ID,
        )
    } else {
        Pubkey::find_program_address(
            &[
                b"mandate",
                organization_key.as_ref(),
                node.parent.as_ref(),
                &node.child_index.to_le_bytes(),
            ],
            &crate::ID,
        )
    };
    require_keys_eq!(key, expected, MandateError::InvalidAncestorPath);
    require!(node.bump == bump, MandateError::InvalidAncestorPath);
    Ok(())
}

/// Path order is direct parent, grandparent, ..., Root. Own deserialization
/// avoids Account lifetimes and Anchor's implicit exit handling for dynamic accounts.
pub fn lineage(
    organization_key: Pubkey,
    organization: &Organization,
    node_key: Pubkey,
    node: &Mandate,
    path: &[AccountInfo<'_>],
    writable: bool,
) -> Result<Vec<Mandate>> {
    canonical_node(organization_key, organization, node_key, node)?;
    require!(
        node.status == MandateStatus::Active,
        MandateError::MandateRevoked
    );
    require!(
        path.len() == usize::from(node.depth),
        MandateError::InvalidAncestorPath
    );
    let mut expected_parent = node.parent;
    let mut expected_depth = node.depth;
    let mut ancestors = Vec::with_capacity(path.len());
    let mut visited = vec![node_key];
    for info in path {
        require_keys_eq!(*info.owner, crate::ID, MandateError::InvalidAncestorPath);
        require!(
            !visited.contains(info.key),
            MandateError::InvalidAncestorPath
        );
        if writable {
            require!(info.is_writable, MandateError::AncestorNotWritable);
        }
        let data = info.try_borrow_data()?;
        let ancestor = Mandate::try_deserialize(&mut &data[..])
            .map_err(|_| error!(MandateError::InvalidAncestorPath))?;
        // Check organization before the key link to distinguish cross-organization paths.
        canonical_node(organization_key, organization, *info.key, &ancestor)?;
        require_keys_eq!(
            *info.key,
            expected_parent,
            MandateError::InvalidAncestorPath
        );
        expected_depth = expected_depth
            .checked_sub(1)
            .ok_or_else(|| error!(MandateError::InvalidAncestorPath))?;
        require!(
            ancestor.depth == expected_depth,
            MandateError::InvalidAncestorPath
        );
        require!(
            ancestor.status == MandateStatus::Active,
            MandateError::AncestorRevoked
        );
        expected_parent = ancestor.parent;
        visited.push(*info.key);
        ancestors.push(ancestor);
    }
    require!(expected_depth == 0, MandateError::InvalidAncestorPath);
    if node.depth > 0 {
        require_keys_eq!(
            *path.last().unwrap().key,
            organization.root_mandate,
            MandateError::InvalidAncestorPath
        );
    }
    Ok(ancestors)
}

pub fn spend_ancestors(
    path: &[AccountInfo<'_>],
    ancestors: &mut [Mandate],
    amount: u64,
) -> Result<()> {
    require!(
        path.len() == ancestors.len(),
        MandateError::InvalidAncestorPath
    );
    for (info, ancestor) in path.iter().zip(ancestors) {
        ancestor.subtree_remaining = sub(ancestor.subtree_remaining, amount)?;
        let mut data = info.try_borrow_mut_data()?;
        ancestor.try_serialize(&mut &mut data[..])?;
    }
    Ok(())
}

#[cfg(test)]
mod tests;
