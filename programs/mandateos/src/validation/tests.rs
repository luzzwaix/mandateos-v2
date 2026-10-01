use super::*;

struct Stored {
    key: Pubkey,
    owner: Pubkey,
    lamports: u64,
    data: Vec<u8>,
    writable: bool,
}

impl Stored {
    fn new(key: Pubkey, node: &Mandate) -> Self {
        let mut data = vec![0; 8 + Mandate::INIT_SPACE];
        node.try_serialize(&mut &mut data[..]).unwrap();
        Self {
            key,
            owner: crate::ID,
            lamports: 1,
            data,
            writable: true,
        }
    }

    fn info(&mut self) -> AccountInfo<'_> {
        AccountInfo::new(
            &self.key,
            false,
            self.writable,
            &mut self.lamports,
            &mut self.data,
            &self.owner,
            false,
            0,
        )
    }
}

fn organization() -> (Pubkey, Organization, Mandate) {
    let key = Pubkey::new_unique();
    let authority = Pubkey::new_unique();
    let (root, bump) =
        Pubkey::find_program_address(&[b"mandate", key.as_ref(), b"root"], &crate::ID);
    let org = Organization {
        authority,
        mint: Pubkey::new_unique(),
        vault: Pubkey::new_unique(),
        root_mandate: root,
        organization_id: 0,
        max_depth: 4,
        total_funded: 1000,
        total_spent: 0,
        total_reclaimed: 0,
        bump: 0,
        vault_bump: 0,
    };
    let node = Mandate {
        organization: key,
        parent: Pubkey::default(),
        controller: authority,
        depth: 0,
        status: MandateStatus::Active,
        initial_budget: 1000,
        self_available: 600,
        subtree_remaining: 1000,
        direct_spent: 0,
        next_child_index: 1,
        child_index: 0,
        bump,
    };
    (key, org, node)
}

fn child(org: Pubkey, parent: Pubkey, depth: u8, index: u64) -> (Pubkey, Mandate) {
    let (key, bump) = Pubkey::find_program_address(
        &[
            b"mandate",
            org.as_ref(),
            parent.as_ref(),
            &index.to_le_bytes(),
        ],
        &crate::ID,
    );
    (
        key,
        Mandate {
            organization: org,
            parent,
            controller: Pubkey::new_unique(),
            depth,
            status: MandateStatus::Active,
            initial_budget: 400,
            self_available: 250,
            subtree_remaining: 400,
            direct_spent: 0,
            next_child_index: 0,
            child_index: index,
            bump,
        },
    )
}

fn error_name<T>(result: Result<T>) -> String {
    match result {
        Err(anchor_lang::error::Error::AnchorError(e)) => e.error_name,
        Err(e) => panic!("Unexpected error: {e}"),
        Ok(_) => panic!("Expected validation failure"),
    }
}

#[test]
fn checked_arithmetic_rejects_overflow_and_underflow() {
    assert_eq!(error_name(add(u64::MAX, 1)), "ArithmeticOverflow");
    assert_eq!(error_name(sub(0, 1)), "ArithmeticOverflow");
    assert_eq!(add(u64::MAX - 1, 1).unwrap(), u64::MAX);
    assert_eq!(sub(10, 10).unwrap(), 0);
}

#[test]
fn available_budget_rejects_zero_and_excess() {
    let (_, _, root) = organization();
    assert_eq!(error_name(available(&root, 0)), "InvalidAmount");
    assert_eq!(
        error_name(available(&root, 601)),
        "InsufficientAvailableBudget"
    );
    available(&root, 600).unwrap();
}

#[test]
fn root_requires_no_ancestors() {
    let (key, org, root) = organization();
    assert!(lineage(key, &org, org.root_mandate, &root, &[], true)
        .unwrap()
        .is_empty());
}

#[test]
fn full_path_validates_and_serializes_every_ancestor() {
    let (org_key, org, root) = organization();
    let (a_key, a) = child(org_key, org.root_mandate, 1, 0);
    let (b_key, b) = child(org_key, a_key, 2, 0);
    let (c_key, c) = child(org_key, b_key, 3, 0);
    let mut stored = vec![
        Stored::new(b_key, &b),
        Stored::new(a_key, &a),
        Stored::new(org.root_mandate, &root),
    ];
    let infos: Vec<_> = stored.iter_mut().map(Stored::info).collect();
    let mut ancestors = lineage(org_key, &org, c_key, &c, &infos, true).unwrap();
    spend_ancestors(&infos, &mut ancestors, 10).unwrap();
    drop(infos);
    for (entry, expected) in stored.iter().zip([390, 390, 990]) {
        assert_eq!(
            Mandate::try_deserialize(&mut &entry.data[..])
                .unwrap()
                .subtree_remaining,
            expected
        );
    }
}

#[test]
fn missing_ancestor_fails() {
    let (key, org, _) = organization();
    let (a_key, a) = child(key, org.root_mandate, 1, 0);
    assert_eq!(
        error_name(lineage(key, &org, a_key, &a, &[], false)),
        "InvalidAncestorPath"
    );
}

#[test]
fn foreign_organization_fails() {
    let (key, org, _) = organization();
    let (_, foreign, foreign_root) = organization();
    let (a_key, a) = child(key, org.root_mandate, 1, 0);
    let mut stored = Stored::new(foreign.root_mandate, &foreign_root);
    assert_eq!(
        error_name(lineage(key, &org, a_key, &a, &[stored.info()], false)),
        "WrongOrganization"
    );
}

#[test]
fn wrong_owner_fails() {
    let (key, org, root) = organization();
    let (a_key, a) = child(key, org.root_mandate, 1, 0);
    let mut stored = Stored::new(org.root_mandate, &root);
    stored.owner = Pubkey::new_unique();
    assert_eq!(
        error_name(lineage(key, &org, a_key, &a, &[stored.info()], false)),
        "InvalidAncestorPath"
    );
}

#[test]
fn wrong_discriminator_fails() {
    let (key, org, root) = organization();
    let (a_key, a) = child(key, org.root_mandate, 1, 0);
    let mut stored = Stored::new(org.root_mandate, &root);
    stored.data[..8].fill(0);
    assert_eq!(
        error_name(lineage(key, &org, a_key, &a, &[stored.info()], false)),
        "InvalidAncestorPath"
    );
}

#[test]
fn readonly_spending_ancestor_fails() {
    let (key, org, root) = organization();
    let (a_key, a) = child(key, org.root_mandate, 1, 0);
    let mut stored = Stored::new(org.root_mandate, &root);
    stored.writable = false;
    assert_eq!(
        error_name(lineage(key, &org, a_key, &a, &[stored.info()], true)),
        "AncestorNotWritable"
    );
    assert!(lineage(key, &org, a_key, &a, &[stored.info()], false).is_ok());
}

#[test]
fn revoked_ancestor_fails() {
    let (key, org, root) = organization();
    let (a_key, mut a) = child(key, org.root_mandate, 1, 0);
    a.status = MandateStatus::Revoked;
    let (b_key, b) = child(key, a_key, 2, 0);
    let mut stored = [Stored::new(a_key, &a), Stored::new(org.root_mandate, &root)];
    let infos: Vec<_> = stored.iter_mut().map(Stored::info).collect();
    assert_eq!(
        error_name(lineage(key, &org, b_key, &b, &infos, false)),
        "AncestorRevoked"
    );
}

#[test]
fn revoked_target_fails() {
    let (key, org, mut root) = organization();
    root.status = MandateStatus::Revoked;
    assert_eq!(
        error_name(lineage(key, &org, org.root_mandate, &root, &[], false)),
        "MandateRevoked"
    );
}

#[test]
fn invalid_pda_fails() {
    let (key, org, root) = organization();
    assert_eq!(
        error_name(lineage(key, &org, Pubkey::new_unique(), &root, &[], false)),
        "InvalidAncestorPath"
    );
}

#[test]
fn malformed_order_fails() {
    let (key, org, root) = organization();
    let (a_key, a) = child(key, org.root_mandate, 1, 0);
    let (b_key, b) = child(key, a_key, 2, 0);
    let mut stored = [Stored::new(org.root_mandate, &root), Stored::new(a_key, &a)];
    let infos: Vec<_> = stored.iter_mut().map(Stored::info).collect();
    assert_eq!(
        error_name(lineage(key, &org, b_key, &b, &infos, false)),
        "InvalidAncestorPath"
    );
}

#[test]
fn wrong_depth_fails() {
    let (key, org, root) = organization();
    let (a_key, mut a) = child(key, org.root_mandate, 2, 0);
    a.depth = 1;
    let (b_key, b) = child(key, a_key, 3, 0);
    let mut stored = [
        Stored::new(a_key, &a),
        Stored::new(org.root_mandate, &root),
        Stored::new(org.root_mandate, &root),
    ];
    let infos: Vec<_> = stored.iter_mut().map(Stored::info).collect();
    assert_eq!(
        error_name(lineage(key, &org, b_key, &b, &infos, false)),
        "InvalidAncestorPath"
    );
}

#[test]
fn sibling_substitution_fails() {
    let (key, org, root) = organization();
    let (a_key, _) = child(key, org.root_mandate, 1, 0);
    let (sibling_key, sibling) = child(key, org.root_mandate, 1, 1);
    let (b_key, b) = child(key, a_key, 2, 0);
    let mut stored = [
        Stored::new(sibling_key, &sibling),
        Stored::new(org.root_mandate, &root),
    ];
    let infos: Vec<_> = stored.iter_mut().map(Stored::info).collect();
    assert_eq!(
        error_name(lineage(key, &org, b_key, &b, &infos, false)),
        "InvalidAncestorPath"
    );
}
