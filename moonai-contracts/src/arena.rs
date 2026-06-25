//! Moon AI — **Agent Arena**.
//!
//! A parimutuel competition for autonomous AI agents. The flow:
//!
//! 1. The **orchestrator** opens a match with an entry fee and a minimum number
//!    of players (`create_match`).
//! 2. Agents **register** by paying the entry fee, which accrues to the match
//!    prize pool (`register`, payable).
//! 3. Once enough players have joined, the orchestrator posts the question
//!    (`post_question`); each agent submits one answer (`submit_answer`).
//! 4. An off-chain panel of AI judges scores every answer 0..=30. The
//!    orchestrator anchors the result on-chain (`settle`) and the winner pulls
//!    the pool (`claim`).
//!
//! A lightweight on-chain **ELO** rating follows each agent across matches, so
//! the arena builds a persistent, verifiable skill record (the Moon-AI twist).
//!
//! Trust model (MVP): the orchestrator is a trusted authority for posting
//! questions and settling. Everything it does emits a CES event, so results are
//! transparent and auditable off-chain. Decentralized resolution is future work.

use odra::casper_types::U512;
use odra::prelude::*;

#[odra::odra_error]
pub enum ArenaError {
    NotOwner = 1,
    NotOrchestrator = 2,
    MatchNotFound = 3,
    MatchNotOpen = 4,
    AlreadyRegistered = 5,
    WrongEntryFee = 6,
    NotEnoughPlayers = 7,
    NotInProgress = 8,
    NotRegistered = 9,
    AlreadyAnswered = 10,
    NotSettled = 11,
    NotWinner = 12,
    AlreadyClaimed = 13,
    ScoreOutOfRange = 14,
    WinnerNotParticipant = 15,
    NoPrize = 16,
}

#[odra::event]
pub struct MatchCreated {
    pub match_id: u64,
    pub entry_fee: U512,
    pub min_players: u32,
}

#[odra::event]
pub struct PlayerRegistered {
    pub match_id: u64,
    pub player: Address,
    pub prize_pool: U512,
}

#[odra::event]
pub struct QuestionPosted {
    pub match_id: u64,
    pub question_hash: String,
}

#[odra::event]
pub struct AnswerSubmitted {
    pub match_id: u64,
    pub player: Address,
    pub answer_hash: String,
}

#[odra::event]
pub struct MatchSettled {
    pub match_id: u64,
    pub winner: Address,
    pub winner_score: u8,
    pub prize: U512,
}

#[odra::event]
pub struct PrizeClaimed {
    pub match_id: u64,
    pub winner: Address,
    pub amount: U512,
}

/// Status codes (1-based so the `0` default means "match not found").
const ST_OPEN: u8 = 1;
const ST_IN_PROGRESS: u8 = 2;
const ST_SETTLED: u8 = 3;

const MAX_SCORE: u8 = 30;
const ELO_START: u64 = 1000;
const ELO_DELTA: u64 = 25;

#[odra::module(
    events = [MatchCreated, PlayerRegistered, QuestionPosted, AnswerSubmitted, MatchSettled, PrizeClaimed],
    errors = ArenaError
)]
pub struct Arena {
    owner: Var<Address>,
    orchestrator: Var<Address>,
    next_match_id: Var<u64>,
    // --- per-match state (keyed by match_id) ---
    status: Mapping<u64, u8>,
    entry_fee: Mapping<u64, U512>,
    min_players: Mapping<u64, u32>,
    prize_pool: Mapping<u64, U512>,
    player_count: Mapping<u64, u32>,
    player_at: Mapping<(u64, u32), Address>,
    registered: Mapping<(u64, Address), bool>,
    question_hash: Mapping<u64, String>,
    answered: Mapping<(u64, Address), bool>,
    answer_hash: Mapping<(u64, Address), String>,
    score: Mapping<(u64, Address), u8>,
    winner: Mapping<u64, Address>,
    claimed: Mapping<u64, bool>,
    // --- agent stats across matches (the ELO twist) ---
    elo: Mapping<Address, u64>,
    wins: Mapping<Address, u64>,
    played: Mapping<Address, u64>,
}

#[odra::module]
impl Arena {
    /// Install the arena. The deployer becomes the `owner` (admin / kill-switch);
    /// `orchestrator` is the authority that posts questions and settles matches.
    pub fn init(&mut self, orchestrator: Address) {
        self.owner.set(self.env().caller());
        self.orchestrator.set(orchestrator);
        self.next_match_id.set(0);
    }

    /// Owner-only: rotate the orchestrator key.
    pub fn set_orchestrator(&mut self, orchestrator: Address) {
        self.assert_owner();
        self.orchestrator.set(orchestrator);
    }

    /// Orchestrator-only: open a new match. `min_players` is floored at 2.
    pub fn create_match(&mut self, entry_fee: U512, min_players: u32) -> u64 {
        self.assert_orchestrator();
        let id = self.next_match_id.get_or_default();
        self.next_match_id.set(id + 1);
        let min_p = if min_players < 2 { 2 } else { min_players };
        self.status.set(&id, ST_OPEN);
        self.entry_fee.set(&id, entry_fee);
        self.min_players.set(&id, min_p);
        self.prize_pool.set(&id, U512::zero());
        self.player_count.set(&id, 0);
        self.env().emit_event(MatchCreated { match_id: id, entry_fee, min_players: min_p });
        id
    }

    /// Register the caller into an open match by paying exactly the entry fee.
    /// The fee accrues to the match prize pool.
    #[odra(payable)]
    pub fn register(&mut self, match_id: u64) {
        self.assert_status(match_id, ST_OPEN, ArenaError::MatchNotOpen);
        let player = self.env().caller();
        if self.registered.get_or_default(&(match_id, player)) {
            self.env().revert(ArenaError::AlreadyRegistered);
        }
        let fee = self.entry_fee.get_or_default(&match_id);
        if self.env().attached_value() != fee {
            self.env().revert(ArenaError::WrongEntryFee);
        }
        self.registered.set(&(match_id, player), true);
        let idx = self.player_count.get_or_default(&match_id);
        self.player_at.set(&(match_id, idx), player);
        self.player_count.set(&match_id, idx + 1);
        let pool = self.prize_pool.get_or_default(&match_id) + fee;
        self.prize_pool.set(&match_id, pool);
        self.env().emit_event(PlayerRegistered { match_id, player, prize_pool: pool });
    }

    /// Orchestrator-only: post the question once `min_players` have joined. Moves
    /// the match into the answering phase.
    pub fn post_question(&mut self, match_id: u64, question_hash: String) {
        self.assert_orchestrator();
        self.assert_status(match_id, ST_OPEN, ArenaError::MatchNotOpen);
        if self.player_count.get_or_default(&match_id) < self.min_players.get_or_default(&match_id) {
            self.env().revert(ArenaError::NotEnoughPlayers);
        }
        self.question_hash.set(&match_id, question_hash.clone());
        self.status.set(&match_id, ST_IN_PROGRESS);
        self.env().emit_event(QuestionPosted { match_id, question_hash });
    }

    /// Registered-player-only: submit one answer for an in-progress match.
    pub fn submit_answer(&mut self, match_id: u64, answer_hash: String) {
        self.assert_status(match_id, ST_IN_PROGRESS, ArenaError::NotInProgress);
        let player = self.env().caller();
        if !self.registered.get_or_default(&(match_id, player)) {
            self.env().revert(ArenaError::NotRegistered);
        }
        if self.answered.get_or_default(&(match_id, player)) {
            self.env().revert(ArenaError::AlreadyAnswered);
        }
        self.answered.set(&(match_id, player), true);
        self.answer_hash.set(&(match_id, player), answer_hash.clone());
        self.env().emit_event(AnswerSubmitted { match_id, player, answer_hash });
    }

    /// Orchestrator-only: anchor the result. Records the winner + winning score,
    /// updates every participant's ELO, and opens the pool for claiming.
    pub fn settle(&mut self, match_id: u64, winner: Address, winner_score: u8) {
        self.assert_orchestrator();
        self.assert_status(match_id, ST_IN_PROGRESS, ArenaError::NotInProgress);
        if winner_score > MAX_SCORE {
            self.env().revert(ArenaError::ScoreOutOfRange);
        }
        if !self.registered.get_or_default(&(match_id, winner)) {
            self.env().revert(ArenaError::WinnerNotParticipant);
        }
        self.score.set(&(match_id, winner), winner_score);
        self.winner.set(&match_id, winner);
        self.status.set(&match_id, ST_SETTLED);

        // ELO: winner gains, everyone else loses (floored at 0).
        let n = self.player_count.get_or_default(&match_id);
        let mut i = 0u32;
        while i < n {
            if let Some(p) = self.player_at.get(&(match_id, i)) {
                let cur = self.elo_of(p);
                self.played.set(&p, self.played.get_or_default(&p) + 1);
                if p == winner {
                    self.elo.set(&p, cur + ELO_DELTA);
                    self.wins.set(&p, self.wins.get_or_default(&p) + 1);
                } else {
                    self.elo.set(&p, cur.saturating_sub(ELO_DELTA));
                }
            }
            i += 1;
        }

        let prize = self.prize_pool.get_or_default(&match_id);
        self.env().emit_event(MatchSettled { match_id, winner, winner_score, prize });
    }

    /// Winner-only: withdraw the prize pool of a settled match (pull payment).
    pub fn claim(&mut self, match_id: u64) {
        self.assert_status(match_id, ST_SETTLED, ArenaError::NotSettled);
        let caller = self.env().caller();
        let winner = match self.winner.get(&match_id) {
            Some(w) => w,
            None => self.env().revert(ArenaError::NotSettled),
        };
        if caller != winner {
            self.env().revert(ArenaError::NotWinner);
        }
        if self.claimed.get_or_default(&match_id) {
            self.env().revert(ArenaError::AlreadyClaimed);
        }
        let prize = self.prize_pool.get_or_default(&match_id);
        if prize.is_zero() {
            self.env().revert(ArenaError::NoPrize);
        }
        self.claimed.set(&match_id, true);
        self.env().transfer_tokens(&caller, &prize);
        self.env().emit_event(PrizeClaimed { match_id, winner: caller, amount: prize });
    }

    // --- views ---
    pub fn get_status(&self, match_id: u64) -> u8 {
        self.status.get_or_default(&match_id)
    }
    pub fn get_prize_pool(&self, match_id: u64) -> U512 {
        self.prize_pool.get_or_default(&match_id)
    }
    pub fn get_player_count(&self, match_id: u64) -> u32 {
        self.player_count.get_or_default(&match_id)
    }
    pub fn get_winner(&self, match_id: u64) -> Option<Address> {
        self.winner.get(&match_id)
    }
    pub fn get_score(&self, match_id: u64, player: Address) -> u8 {
        self.score.get_or_default(&(match_id, player))
    }
    pub fn is_registered(&self, match_id: u64, player: Address) -> bool {
        self.registered.get_or_default(&(match_id, player))
    }
    pub fn get_elo(&self, agent: Address) -> u64 {
        self.elo_of(agent)
    }
    /// `(wins, matches_played)` for an agent.
    pub fn get_record(&self, agent: Address) -> (u64, u64) {
        (self.wins.get_or_default(&agent), self.played.get_or_default(&agent))
    }
    pub fn get_orchestrator(&self) -> Address {
        self.must_orchestrator()
    }

    // --- internal ---
    fn elo_of(&self, agent: Address) -> u64 {
        let e = self.elo.get_or_default(&agent);
        if e == 0 { ELO_START } else { e }
    }
    fn must_owner(&self) -> Address {
        match self.owner.get() {
            Some(a) => a,
            None => self.env().revert(ArenaError::NotOwner),
        }
    }
    fn must_orchestrator(&self) -> Address {
        match self.orchestrator.get() {
            Some(a) => a,
            None => self.env().revert(ArenaError::NotOrchestrator),
        }
    }
    fn assert_owner(&self) {
        if self.env().caller() != self.must_owner() {
            self.env().revert(ArenaError::NotOwner);
        }
    }
    fn assert_orchestrator(&self) {
        if self.env().caller() != self.must_orchestrator() {
            self.env().revert(ArenaError::NotOrchestrator);
        }
    }
    fn assert_status(&self, match_id: u64, expected: u8, err: ArenaError) {
        let s = self.status.get_or_default(&match_id);
        if s == 0 {
            self.env().revert(ArenaError::MatchNotFound);
        }
        if s != expected {
            self.env().revert(err);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, HostRef};

    fn deploy() -> (odra::host::HostEnv, ArenaHostRef, Address) {
        let env = odra_test::env();
        let orchestrator = env.get_account(0);
        let arena = Arena::deploy(&env, ArenaInitArgs { orchestrator });
        (env, arena, orchestrator)
    }

    #[test]
    fn full_match_flow() {
        let (env, mut arena, orchestrator) = deploy();
        let alice = env.get_account(1);
        let bob = env.get_account(2);
        let entry = U512::from(1000u64);

        env.set_caller(orchestrator);
        let mid = arena.create_match(entry, 2);
        assert_eq!(arena.get_status(mid), ST_OPEN);

        env.set_caller(alice);
        arena.with_tokens(entry).register(mid);
        env.set_caller(bob);
        arena.with_tokens(entry).register(mid);
        assert_eq!(arena.get_player_count(mid), 2);
        assert_eq!(arena.get_prize_pool(mid), U512::from(2000u64));

        env.set_caller(orchestrator);
        arena.post_question(mid, "q-hash".to_string());
        assert_eq!(arena.get_status(mid), ST_IN_PROGRESS);

        env.set_caller(alice);
        arena.submit_answer(mid, "alice-answer".to_string());
        env.set_caller(bob);
        arena.submit_answer(mid, "bob-answer".to_string());

        env.set_caller(orchestrator);
        arena.settle(mid, alice, 27);
        assert_eq!(arena.get_status(mid), ST_SETTLED);
        assert_eq!(arena.get_winner(mid), Some(alice));
        assert_eq!(arena.get_score(mid, alice), 27);
        assert_eq!(arena.get_elo(alice), ELO_START + ELO_DELTA);
        assert_eq!(arena.get_elo(bob), ELO_START - ELO_DELTA);
        assert_eq!(arena.get_record(alice), (1, 1));

        env.set_caller(alice);
        let before = env.balance_of(&alice);
        arena.claim(mid);
        assert_eq!(env.balance_of(&alice) - before, U512::from(2000u64));
    }

    #[test]
    fn rejects_non_orchestrator_create() {
        let (env, mut arena, _) = deploy();
        let mallory = env.get_account(1);
        env.set_caller(mallory);
        assert_eq!(
            arena.try_create_match(U512::from(1u64), 2).unwrap_err(),
            ArenaError::NotOrchestrator.into()
        );
    }

    #[test]
    fn rejects_wrong_entry_fee() {
        let (env, mut arena, orchestrator) = deploy();
        let alice = env.get_account(1);
        env.set_caller(orchestrator);
        let mid = arena.create_match(U512::from(1000u64), 2);
        env.set_caller(alice);
        assert_eq!(
            arena.with_tokens(U512::from(999u64)).try_register(mid).unwrap_err(),
            ArenaError::WrongEntryFee.into()
        );
    }

    #[test]
    fn rejects_question_without_enough_players() {
        let (env, mut arena, orchestrator) = deploy();
        let alice = env.get_account(1);
        env.set_caller(orchestrator);
        let mid = arena.create_match(U512::from(1000u64), 2);
        env.set_caller(alice);
        arena.with_tokens(U512::from(1000u64)).register(mid);
        env.set_caller(orchestrator);
        assert_eq!(
            arena.try_post_question(mid, "q".to_string()).unwrap_err(),
            ArenaError::NotEnoughPlayers.into()
        );
    }

    #[test]
    fn rejects_double_claim_and_non_winner() {
        let (env, mut arena, orchestrator) = deploy();
        let alice = env.get_account(1);
        let bob = env.get_account(2);
        let entry = U512::from(500u64);
        env.set_caller(orchestrator);
        let mid = arena.create_match(entry, 2);
        env.set_caller(alice);
        arena.with_tokens(entry).register(mid);
        env.set_caller(bob);
        arena.with_tokens(entry).register(mid);
        env.set_caller(orchestrator);
        arena.post_question(mid, "q".to_string());
        env.set_caller(alice);
        arena.submit_answer(mid, "a".to_string());
        env.set_caller(bob);
        arena.submit_answer(mid, "b".to_string());
        env.set_caller(orchestrator);
        arena.settle(mid, alice, 20);

        // bob (loser) cannot claim
        env.set_caller(bob);
        assert_eq!(arena.try_claim(mid).unwrap_err(), ArenaError::NotWinner.into());
        // alice claims once, second claim reverts
        env.set_caller(alice);
        arena.claim(mid);
        assert_eq!(arena.try_claim(mid).unwrap_err(), ArenaError::AlreadyClaimed.into());
    }

    #[test]
    fn rejects_score_out_of_range() {
        let (env, mut arena, orchestrator) = deploy();
        let alice = env.get_account(1);
        let bob = env.get_account(2);
        let entry = U512::from(100u64);
        env.set_caller(orchestrator);
        let mid = arena.create_match(entry, 2);
        env.set_caller(alice);
        arena.with_tokens(entry).register(mid);
        env.set_caller(bob);
        arena.with_tokens(entry).register(mid);
        env.set_caller(orchestrator);
        arena.post_question(mid, "q".to_string());
        assert_eq!(
            arena.try_settle(mid, alice, 31).unwrap_err(),
            ArenaError::ScoreOutOfRange.into()
        );
    }
}
