//! `MoonToken` — a CEP-18-style fungible token that is also the **settlement
//! asset for x402 payments** on Casper. On top of the standard token surface
//! (`name` / `symbol` / `decimals`, `balance_of`, `total_supply`, `transfer`,
//! `mint`) it implements **CEP-3009** `transfer_with_authorization`: a payer
//! signs an EIP-712 typed-data authorization off-chain, and any third party
//! (the x402 facilitator) can submit it to move the payer's funds — bounded by
//! a validity window and a single-use nonce.
//!
//! ## How the x402 settlement flow lands here
//!
//! The hosted facilitator (`x402-facilitator.cspr.cloud`, built on
//! `@make-software/casper-x402`) calls this contract's `transfer_with_authorization`
//! entry point by **contract package hash**, paying its own gas. The payer never
//! sends a transaction; they only sign a 32-byte EIP-712 digest with their Casper
//! key. Verification is therefore **Casper-native**: the payer's public key is
//! passed in as an explicit argument, and we check the signature over the digest
//! with the host's `verify_signature` (`casper_types::crypto::verify`, ed25519 /
//! secp256k1). There is no signature address-recovery: the public key is given,
//! so we verify directly. (The `recoverAddress` helper in
//! `@casper-ecosystem/casper-eip-712` is **not** used by the Casper x402 scheme.)
//!
//! ## EIP-712 digest (must match `@casper-ecosystem/casper-eip-712` exactly)
//!
//! `digest = keccak256(0x19 0x01 || domainSeparator || structHash)`
//!
//! Domain (the Casper-native domain, `CASPER_DOMAIN_TYPES`):
//! ```text
//! EIP712Domain(string name,string version,string chain_name,bytes32 contract_package_hash)
//! domainSeparator = keccak256(
//!     keccak256("EIP712Domain(string name,string version,string chain_name,bytes32 contract_package_hash)")
//!     || keccak256(name) || keccak256(version) || keccak256(chain_name)
//!     || contract_package_hash[32]
//! )
//! ```
//!
//! Struct (the x402 `exact` scheme's local type — note `uint256` timestamps,
//! NOT the `casper-eip-712` prebuilt `TransferAuthorization` which uses `uint64`):
//! ```text
//! TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)
//! structHash = keccak256(
//!     keccak256("TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)")
//!     || enc(from) || enc(to) || enc(value) || enc(validAfter) || enc(validBefore) || nonce[32]
//! )
//! ```
//! Field encodings:
//! - `from` / `to`: `address`. The off-chain message passes a 33-byte Casper key
//!   (`00 || account_hash[32]`), and `casper-eip-712`'s `encodeAddress` hashes any
//!   33-byte input as `keccak256(00 || account_hash)`. We reproduce that on-chain.
//! - `value` / `validAfter` / `validBefore`: `uint256`, 32-byte big-endian.
//! - `nonce`: `bytes32`, the raw 32 nonce bytes.
//!
//! The domain's `contract_package_hash` is taken from this contract's own package
//! hash at runtime (`self.env().self_address()`), so the on-chain domain is always
//! self-consistent with the asset the facilitator addresses. `name`, `version`,
//! and `chain_name` are set at install and exposed via getters so the off-chain
//! side can read them back into the EIP-712 domain.

use odra::casper_types::bytesrepr::Bytes;
use odra::casper_types::crypto::PublicKey;
use odra::casper_types::U256;
use odra::prelude::Address;
use odra::prelude::*;
use tiny_keccak::{Hasher, Keccak};

/// CAIP-2 chain name for Casper Testnet, the buildathon network. Used as the
/// EIP-712 domain `chain_name` unless overridden at install.
const DEFAULT_CHAIN_NAME: &str = "casper:casper-test";

#[odra::odra_error]
pub enum MoonTokenError {
    InsufficientBalance = 1,
    /// `block_time < valid_after` — the authorization is not yet usable.
    AuthNotYetValid = 2,
    /// `block_time > valid_before` — the authorization has expired.
    AuthExpired = 3,
    /// This `(from, nonce)` authorization was already settled.
    NonceUsed = 4,
    /// The signature does not verify against `from`'s public key, or the
    /// supplied public key does not hash to `from`.
    InvalidSignature = 5,
    /// `nonce` was not exactly 32 bytes.
    InvalidNonce = 6,
}

#[odra::event]
pub struct Transfer {
    pub from: Address,
    pub to: Address,
    pub amount: U256,
}

/// Emitted when a `transfer_with_authorization` is settled, so indexers
/// (CSPR.cloud) can tie an x402 payment to its replay-protection nonce.
#[odra::event]
pub struct AuthorizationUsed {
    pub from: Address,
    pub to: Address,
    pub amount: U256,
    pub nonce: Bytes,
}

#[odra::module(events = [Transfer, AuthorizationUsed], errors = MoonTokenError)]
pub struct MoonToken {
    balances: Mapping<Address, U256>,
    total_supply: Var<U256>,
    name: Var<String>,
    symbol: Var<String>,
    decimals: Var<u8>,
    chain_name: Var<String>,
    /// `(from, nonce) -> used`. Replay protection for authorizations.
    used_nonces: Mapping<(Address, Bytes), bool>,
}

#[odra::module]
impl MoonToken {
    /// Install the token. Mints the full supply (1,000,000 at 9 decimals) to the
    /// deployer, who can then distribute or `mint` to payers for testing.
    ///
    /// The EIP-712 domain `chain_name` defaults to `casper:casper-test`; the
    /// domain `contract_package_hash` is derived at runtime from this contract's
    /// own package hash. `name` / `version` for the domain come from the token's
    /// `name()` and a fixed `"1"` version (see `version()`).
    pub fn init(&mut self) {
        let supply = U256::from(1_000_000u64) * U256::from(1_000_000_000u64);
        self.total_supply.set(supply);
        self.balances.set(&self.env().caller(), supply);
        self.name.set("Moon AI Token".to_string());
        self.symbol.set("MOON".to_string());
        self.decimals.set(9);
        self.chain_name.set(DEFAULT_CHAIN_NAME.to_string());
    }

    pub fn name(&self) -> String {
        self.name.get_or_default()
    }

    pub fn symbol(&self) -> String {
        self.symbol.get_or_default()
    }

    pub fn decimals(&self) -> u8 {
        self.decimals.get_or_default()
    }

    /// EIP-712 domain `version`. Fixed at `"1"`; the off-chain side passes this
    /// in `PaymentRequirements.extra.version`.
    pub fn version(&self) -> String {
        "1".to_string()
    }

    /// EIP-712 domain `chain_name` (CAIP-2), e.g. `casper:casper-test`.
    pub fn chain_name(&self) -> String {
        self.chain_name.get_or_default()
    }

    pub fn total_supply(&self) -> U256 {
        self.total_supply.get_or_default()
    }

    pub fn balance_of(&self, owner: Address) -> U256 {
        self.balances.get_or_default(&owner)
    }

    /// Whether a `(from, nonce)` authorization has already been settled.
    pub fn authorization_used(&self, from: Address, nonce: Bytes) -> bool {
        self.used_nonces.get_or_default(&(from, nonce))
    }

    /// Mint `amount` new tokens to `to` (open, for the test token).
    pub fn mint(&mut self, to: Address, amount: U256) {
        self.total_supply.set(self.total_supply.get_or_default() + amount);
        self.balances.set(&to, self.balances.get_or_default(&to) + amount);
        self.env().emit_event(Transfer { from: to, to, amount });
    }

    /// Transfer `amount` from the caller to `recipient`.
    pub fn transfer(&mut self, recipient: Address, amount: U256) {
        let from = self.env().caller();
        self.do_transfer(from, recipient, amount);
    }

    /// **CEP-3009.** Settle an off-chain-authorized transfer. Anyone (the x402
    /// facilitator) may call this; the funds move only if the EIP-712 signature
    /// over the canonical digest verifies against `from`'s `public_key`.
    ///
    /// Arg names/types match what `@make-software/casper-x402` builds in
    /// `buildTransferWithAuthorizationArgs`:
    /// - `from`: `Key` (account-hash) — the payer.
    /// - `to`: `Key` (account-hash) — the payee.
    /// - `amount`: `U256` — value to move (the x402 message field `value`).
    /// - `valid_after`: `u64` — unix seconds; usable only at/after this time.
    /// - `valid_before`: `u64` — unix seconds; usable only at/before this time.
    /// - `nonce`: `Bytes` (32 bytes) — replay-protection nonce.
    /// - `public_key`: `PublicKey` — the payer's Casper public key.
    /// - `signature`: `Bytes` (65 bytes) — `[algo_tag | 64-byte signature]`.
    #[allow(clippy::too_many_arguments)]
    pub fn transfer_with_authorization(
        &mut self,
        from: Address,
        to: Address,
        amount: U256,
        valid_after: u64,
        valid_before: u64,
        nonce: Bytes,
        public_key: PublicKey,
        signature: Bytes,
    ) {
        if nonce.len() != 32 {
            self.env().revert(MoonTokenError::InvalidNonce);
        }

        // Validity window (unix seconds). Block time is unix-epoch millis.
        let now = self.env().get_block_time_secs();
        if now < valid_after {
            self.env().revert(MoonTokenError::AuthNotYetValid);
        }
        if now > valid_before {
            self.env().revert(MoonTokenError::AuthExpired);
        }

        // Single-use nonce, scoped to the payer.
        let nonce_key = (from, nonce.clone());
        if self.used_nonces.get_or_default(&nonce_key) {
            self.env().revert(MoonTokenError::NonceUsed);
        }

        // The public key must be `from`'s, and it must have signed the digest.
        let signer: Address = public_key.clone().into();
        if signer != from {
            self.env().revert(MoonTokenError::InvalidSignature);
        }
        let digest = self.transfer_with_authorization_digest(
            from,
            to,
            amount,
            valid_after,
            valid_before,
            &nonce,
        );
        let digest_bytes = Bytes::from(digest.to_vec());
        if !self.env().verify_signature(&digest_bytes, &signature, &public_key) {
            self.env().revert(MoonTokenError::InvalidSignature);
        }

        // All checks passed: mark the nonce used, then move the funds.
        self.used_nonces.set(&nonce_key, true);
        self.do_transfer(from, to, amount);
        self.env().emit_event(AuthorizationUsed { from, to, amount, nonce });
    }

    /// Rebuild the EIP-712 digest for a `TransferWithAuthorization` exactly as
    /// `@casper-ecosystem/casper-eip-712` `hashTypedData(...)` produces it for the
    /// x402 `exact` scheme. Pure; no state read except the domain inputs.
    pub fn transfer_with_authorization_digest(
        &self,
        from: Address,
        to: Address,
        amount: U256,
        valid_after: u64,
        valid_before: u64,
        nonce: &Bytes,
    ) -> [u8; 32] {
        let domain_separator = self.domain_separator();
        let struct_hash =
            transfer_with_authorization_struct_hash(from, to, amount, valid_after, valid_before, nonce);

        // keccak256(0x19 || 0x01 || domainSeparator || structHash)
        let mut buf = Vec::with_capacity(2 + 32 + 32);
        buf.push(0x19);
        buf.push(0x01);
        buf.extend_from_slice(&domain_separator);
        buf.extend_from_slice(&struct_hash);
        keccak256(&buf)
    }

    // --- internal -------------------------------------------------------

    fn do_transfer(&mut self, from: Address, to: Address, amount: U256) {
        let from_balance = self.balances.get_or_default(&from);
        if from_balance < amount {
            self.env().revert(MoonTokenError::InsufficientBalance);
        }
        self.balances.set(&from, from_balance - amount);
        self.balances.set(&to, self.balances.get_or_default(&to) + amount);
        self.env().emit_event(Transfer { from, to, amount });
    }

    /// EIP-712 domain separator for the Casper-native domain. The
    /// `contract_package_hash` is this contract's own package hash.
    fn domain_separator(&self) -> [u8; 32] {
        // The address `value()` is the 32-byte package-hash for a contract.
        let package_hash: [u8; 32] = self.env().self_address().value();
        domain_separator(&self.name(), &self.version(), &self.chain_name(), &package_hash)
    }
}

/// `keccak256` of `data`.
fn keccak256(data: &[u8]) -> [u8; 32] {
    let mut out = [0u8; 32];
    let mut hasher = Keccak::v256();
    hasher.update(data);
    hasher.finalize(&mut out);
    out
}

/// EIP-712 `encodeAddress` for a Casper 33-byte key: `keccak256(00 || account_hash)`.
///
/// `casper-eip-712` hashes any 33-byte address input. The off-chain message uses
/// `00 || account_hash` (account-hash key prefix `00`), so we hash the same.
fn encode_casper_address(address: Address) -> [u8; 32] {
    let mut input = [0u8; 33];
    // input[0] = 0x00 (account-hash key tag), input[1..] = account hash.
    input[1..].copy_from_slice(&address.value());
    keccak256(&input)
}

/// EIP-712 `uint256` encoding: 32-byte big-endian.
fn encode_uint256(value: U256) -> [u8; 32] {
    let mut out = [0u8; 32];
    value.to_big_endian(&mut out);
    out
}

/// The EIP-712 struct hash for `TransferWithAuthorization`.
fn transfer_with_authorization_struct_hash(
    from: Address,
    to: Address,
    amount: U256,
    valid_after: u64,
    valid_before: u64,
    nonce: &Bytes,
) -> [u8; 32] {
    let type_hash = keccak256(
        b"TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)",
    );

    let mut buf = Vec::with_capacity(32 * 7);
    buf.extend_from_slice(&type_hash);
    buf.extend_from_slice(&encode_casper_address(from));
    buf.extend_from_slice(&encode_casper_address(to));
    buf.extend_from_slice(&encode_uint256(amount));
    buf.extend_from_slice(&encode_uint256(U256::from(valid_after)));
    buf.extend_from_slice(&encode_uint256(U256::from(valid_before)));
    // `nonce` is bytes32: the raw 32 bytes, verified length upstream.
    buf.extend_from_slice(nonce.as_slice());
    keccak256(&buf)
}

/// The EIP-712 domain separator for the Casper-native domain
/// (`CASPER_DOMAIN_TYPES`).
fn domain_separator(
    name: &str,
    version: &str,
    chain_name: &str,
    contract_package_hash: &[u8; 32],
) -> [u8; 32] {
    let type_hash = keccak256(
        b"EIP712Domain(string name,string version,string chain_name,bytes32 contract_package_hash)",
    );

    let mut buf = Vec::with_capacity(32 * 5);
    buf.extend_from_slice(&type_hash);
    buf.extend_from_slice(&keccak256(name.as_bytes()));
    buf.extend_from_slice(&keccak256(version.as_bytes()));
    buf.extend_from_slice(&keccak256(chain_name.as_bytes()));
    buf.extend_from_slice(contract_package_hash);
    keccak256(&buf)
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::casper_types::bytesrepr::ToBytes;
    use odra::casper_types::crypto::{sign, SecretKey};
    use odra::host::{Deployer, NoArgs};

    fn supply() -> U256 {
        U256::from(1_000_000u64) * U256::from(1_000_000_000u64)
    }

    #[test]
    fn mint_and_transfer() {
        let env = odra_test::env();
        let mut token = MoonToken::deploy(&env, NoArgs);
        let deployer = env.get_account(0);
        let other = env.get_account(1);

        assert_eq!(token.name(), "Moon AI Token");
        assert_eq!(token.symbol(), "MOON");
        assert_eq!(token.decimals(), 9);
        assert_eq!(token.version(), "1");
        assert_eq!(token.chain_name(), "casper:casper-test");
        assert_eq!(token.total_supply(), supply());
        assert_eq!(token.balance_of(deployer), supply());

        env.set_caller(deployer);
        token.transfer(other, U256::from(500u64));
        assert_eq!(token.balance_of(other), U256::from(500u64));
        assert_eq!(token.balance_of(deployer), supply() - U256::from(500u64));

        token.mint(other, U256::from(50u64));
        assert_eq!(token.balance_of(other), U256::from(550u64));
    }

    #[test]
    fn transfer_over_balance_reverts() {
        let env = odra_test::env();
        let mut token = MoonToken::deploy(&env, NoArgs);
        let other = env.get_account(1);
        env.set_caller(other);
        assert_eq!(
            token.try_transfer(env.get_account(0), U256::from(1u64)).unwrap_err(),
            MoonTokenError::InsufficientBalance.into()
        );
    }

    // --- transfer_with_authorization helpers --------------------------------

    /// A deterministic ed25519 keypair whose account-hash `Address` we can fund.
    fn payer_keypair() -> (SecretKey, PublicKey, Address) {
        // Distinct from the 0..N test-VM genesis keys (which use [i;32] seeds).
        let secret = SecretKey::ed25519_from_bytes([7u8; 32]).unwrap();
        let public = PublicKey::from(&secret);
        let address = Address::from(public.clone());
        (secret, public, address)
    }

    fn nonce32(seed: u8) -> Bytes {
        Bytes::from(vec![seed; 32])
    }

    #[test]
    fn transfer_with_authorization_happy_path() {
        let env = odra_test::env();
        let mut token = MoonToken::deploy(&env, NoArgs);
        let deployer = env.get_account(0);
        let facilitator = env.get_account(2);

        let (secret, public, payer) = payer_keypair();
        let payee = env.get_account(1);

        // Fund the payer from the deployer's supply.
        env.set_caller(deployer);
        token.transfer(payer, U256::from(1_000u64));
        assert_eq!(token.balance_of(payer), U256::from(1_000u64));

        let amount = U256::from(250u64);
        let valid_after = 0u64;
        let valid_before = 10_000_000_000u64; // far future
        let nonce = nonce32(1);

        let digest = token.transfer_with_authorization_digest(payer, payee, amount, valid_after, valid_before, &nonce);
        let signature = sign(digest, &secret, &public);
        let sig_bytes = Bytes::from(signature.to_bytes().unwrap());

        // Anyone (the facilitator) may submit; funds still move from the payer.
        env.set_caller(facilitator);
        token.transfer_with_authorization(
            payer,
            payee,
            amount,
            valid_after,
            valid_before,
            nonce.clone(),
            public.clone(),
            sig_bytes,
        );

        assert_eq!(token.balance_of(payee), U256::from(250u64));
        assert_eq!(token.balance_of(payer), U256::from(750u64));
        assert!(token.authorization_used(payer, nonce));
    }

    #[test]
    fn transfer_with_authorization_rejects_reused_nonce() {
        let env = odra_test::env();
        let mut token = MoonToken::deploy(&env, NoArgs);
        let deployer = env.get_account(0);
        let (secret, public, payer) = payer_keypair();
        let payee = env.get_account(1);

        env.set_caller(deployer);
        token.transfer(payer, U256::from(1_000u64));

        let amount = U256::from(100u64);
        let nonce = nonce32(2);
        let digest = token.transfer_with_authorization_digest(payer, payee, amount, 0, 10_000_000_000, &nonce);
        let sig_bytes = Bytes::from(sign(digest, &secret, &public).to_bytes().unwrap());

        token.transfer_with_authorization(
            payer,
            payee,
            amount,
            0,
            10_000_000_000,
            nonce.clone(),
            public.clone(),
            sig_bytes.clone(),
        );

        // Replaying the same (from, nonce) must revert.
        let err = token
            .try_transfer_with_authorization(
                payer,
                payee,
                amount,
                0,
                10_000_000_000,
                nonce,
                public,
                sig_bytes,
            )
            .unwrap_err();
        assert_eq!(err, MoonTokenError::NonceUsed.into());
    }

    #[test]
    fn transfer_with_authorization_rejects_expired() {
        let env = odra_test::env();
        let mut token = MoonToken::deploy(&env, NoArgs);
        let deployer = env.get_account(0);
        let (secret, public, payer) = payer_keypair();
        let payee = env.get_account(1);

        env.set_caller(deployer);
        token.transfer(payer, U256::from(1_000u64));

        // Advance block time so `valid_before` is in the past.
        env.advance_block_time(20_000); // ms -> 20s
        let amount = U256::from(100u64);
        let nonce = nonce32(3);
        let valid_before = 1u64; // 1 second past epoch, long expired
        let digest = token.transfer_with_authorization_digest(payer, payee, amount, 0, valid_before, &nonce);
        let sig_bytes = Bytes::from(sign(digest, &secret, &public).to_bytes().unwrap());

        let err = token
            .try_transfer_with_authorization(
                payer, payee, amount, 0, valid_before, nonce, public, sig_bytes,
            )
            .unwrap_err();
        assert_eq!(err, MoonTokenError::AuthExpired.into());
    }

    #[test]
    fn transfer_with_authorization_rejects_not_yet_valid() {
        let env = odra_test::env();
        let mut token = MoonToken::deploy(&env, NoArgs);
        let deployer = env.get_account(0);
        let (secret, public, payer) = payer_keypair();
        let payee = env.get_account(1);

        env.set_caller(deployer);
        token.transfer(payer, U256::from(1_000u64));

        let amount = U256::from(100u64);
        let nonce = nonce32(4);
        let valid_after = 10_000_000_000u64; // far future
        let digest = token.transfer_with_authorization_digest(payer, payee, amount, valid_after, 10_000_000_001, &nonce);
        let sig_bytes = Bytes::from(sign(digest, &secret, &public).to_bytes().unwrap());

        let err = token
            .try_transfer_with_authorization(
                payer,
                payee,
                amount,
                valid_after,
                10_000_000_001,
                nonce,
                public,
                sig_bytes,
            )
            .unwrap_err();
        assert_eq!(err, MoonTokenError::AuthNotYetValid.into());
    }

    #[test]
    fn transfer_with_authorization_rejects_bad_signature() {
        let env = odra_test::env();
        let mut token = MoonToken::deploy(&env, NoArgs);
        let deployer = env.get_account(0);
        let (secret, public, payer) = payer_keypair();
        let payee = env.get_account(1);

        env.set_caller(deployer);
        token.transfer(payer, U256::from(1_000u64));

        let amount = U256::from(100u64);
        let nonce = nonce32(5);
        // Sign a DIFFERENT amount than the one submitted -> digest mismatch.
        let bad_digest = token.transfer_with_authorization_digest(payer, payee, U256::from(999u64), 0, 10_000_000_000, &nonce);
        let sig_bytes = Bytes::from(sign(bad_digest, &secret, &public).to_bytes().unwrap());

        let err = token
            .try_transfer_with_authorization(
                payer, payee, amount, 0, 10_000_000_000, nonce, public, sig_bytes,
            )
            .unwrap_err();
        assert_eq!(err, MoonTokenError::InvalidSignature.into());
    }

    #[test]
    fn transfer_with_authorization_rejects_wrong_public_key() {
        let env = odra_test::env();
        let mut token = MoonToken::deploy(&env, NoArgs);
        let deployer = env.get_account(0);
        let (secret, public, payer) = payer_keypair();
        let payee = env.get_account(1);

        env.set_caller(deployer);
        token.transfer(payer, U256::from(1_000u64));

        let amount = U256::from(100u64);
        let nonce = nonce32(6);
        let digest = token.transfer_with_authorization_digest(payer, payee, amount, 0, 10_000_000_000, &nonce);
        let sig_bytes = Bytes::from(sign(digest, &secret, &public).to_bytes().unwrap());

        // A different public key whose account-hash != `from`.
        let other_secret = SecretKey::ed25519_from_bytes([8u8; 32]).unwrap();
        let other_public = PublicKey::from(&other_secret);

        let err = token
            .try_transfer_with_authorization(
                payer,
                payee,
                amount,
                0,
                10_000_000_000,
                nonce,
                other_public,
                sig_bytes,
            )
            .unwrap_err();
        assert_eq!(err, MoonTokenError::InvalidSignature.into());
    }

    #[test]
    fn transfer_with_authorization_rejects_insufficient_balance() {
        let env = odra_test::env();
        let mut token = MoonToken::deploy(&env, NoArgs);
        let (secret, public, payer) = payer_keypair();
        let payee = env.get_account(1);

        // Payer is unfunded.
        let amount = U256::from(100u64);
        let nonce = nonce32(7);
        let digest = token.transfer_with_authorization_digest(payer, payee, amount, 0, 10_000_000_000, &nonce);
        let sig_bytes = Bytes::from(sign(digest, &secret, &public).to_bytes().unwrap());

        let err = token
            .try_transfer_with_authorization(
                payer, payee, amount, 0, 10_000_000_000, nonce, public, sig_bytes,
            )
            .unwrap_err();
        assert_eq!(err, MoonTokenError::InsufficientBalance.into());
    }
}
