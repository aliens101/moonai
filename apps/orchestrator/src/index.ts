/**
 * Moon AI — autonomous match runner (the Agent-Chief / orchestrator).
 *
 * The orchestrator (Account 4) opens a match; two fresh competitor agents are
 * funded, register, answer an LLM-generated question, get scored by a randomized
 * AI judge panel, and the winner is settled on-chain (ELO updated). Every step is
 * a real Casper Testnet transaction.
 *
 *   bun run apps/orchestrator/src/index.ts
 *
 * Env: CASPER_SECRET_KEY_PATH (Account 4), MOONAI_ARENA_PACKAGE_HASH,
 *      CSPR_CLOUD_API_KEY, OPENAI_API_KEY.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { accountHashOf, arena, fund, loadSigner, newAgent, txLink } from '@moonai/casper'
import {
  craftAnswer,
  generatePersonalities,
  generateQuestion,
  judgePanel,
} from '@moonai/core'

const PEM = process.env.CASPER_SECRET_KEY_PATH
if (!PEM) throw new Error('set CASPER_SECRET_KEY_PATH (the orchestrator / Account 4 key)')
const orchestrator = loadSigner(PEM)

const COUNTER = '.match-id'
const matchId = existsSync(COUNTER) ? Number(readFileSync(COUNTER, 'utf8')) : 0
const sha = (s: string) => new Bun.CryptoHasher('sha256').update(s).digest('hex')

console.log(`🌙 Moon AI — autonomous match #${matchId}\n`)

// ① orchestrator opens a 0-fee, 2-player match
console.log('① create_match…')
console.log('   ', txLink(await arena.createMatch(orchestrator, 0, 2)))

// ② two fresh competitor agents, funded for gas (a real player brings their own)
const players = [
  {
    name: 'Agent-Alpha',
    key: newAgent(),
    strategy: 'Be bold and decisive — pick a side and defend it with concrete evidence.',
  },
  {
    name: 'Agent-Beta',
    key: newAgent(),
    strategy: 'Be balanced and diplomatic — try to satisfy every perspective at once.',
  },
]
console.log('② funding competitors…')
for (const p of players) await fund(orchestrator, p.key.publicKey, 60)

// ③ competitors register on-chain
console.log('③ register…')
for (const p of players) {
  console.log('   ', p.name, txLink(await arena.register(p.key, matchId)))
}

// ④ Philosopher generates the question; its hash is anchored on-chain
const question = await generateQuestion()
console.log(`\n❓ ${question}`)
console.log(
  '   post_question',
  txLink(await arena.postQuestion(orchestrator, matchId, sha(question))),
)

// ⑤ Director assembles a randomized judge panel
const judges = await generatePersonalities(3)
console.log(`⚖️  judges: ${judges.map((j) => j.name).join(', ')}\n`)

// ⑥ each competitor answers (LLM) + submits on-chain; the panel scores it
const scored: { name: string; accountHash: string; total: number }[] = []
for (const p of players) {
  const answer = await craftAnswer(question, p.strategy)
  console.log(
    '   ',
    p.name,
    'submit_answer',
    txLink(await arena.submitAnswer(p.key, matchId, sha(answer))),
  )
  const panel = await judgePanel(question, answer, judges)
  console.log(
    `      → ${panel.total}/30 (${panel.scores.map((s) => `${s.judge}:${s.score}`).join(' ')})`,
  )
  scored.push({
    name: p.name,
    accountHash: accountHashOf(p.key.publicKey),
    total: panel.total,
  })
}

// ⑦ settle: highest panel total wins
scored.sort((a, b) => b.total - a.total)
const winner = scored[0]
if (!winner) throw new Error('no scored competitors')
console.log(`\n🏆 winner: ${winner.name} — ${winner.total}/30`)
console.log(
  '   settle',
  txLink(await arena.settle(orchestrator, matchId, winner.accountHash, winner.total)),
)

writeFileSync(COUNTER, String(matchId + 1))
console.log('\n✅ match settled on-chain — ELO updated for both competitors.')
