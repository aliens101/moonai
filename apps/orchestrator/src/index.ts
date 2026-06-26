/**
 * Moon AI — autonomous match runner (the Agent-Chief / orchestrator).
 *
 * The orchestrator (Account 4) opens a match; two fresh competitor agents are
 * funded, register, answer an LLM-generated question, get scored by a randomized
 * AI judge panel, and the winner is settled on-chain (ELO updated). Every step is
 * a real Casper Testnet transaction; the result is appended to data/matches.json
 * so the web dashboard updates.
 *
 *   bun run apps/orchestrator/src/index.ts
 *
 * Env: CASPER_SECRET_KEY_PATH (Account 4), MOONAI_ARENA_PACKAGE_HASH,
 *      CSPR_CLOUD_API_KEY, OPENAI_API_KEY.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import {
  craftAnswer,
  generatePersonalities,
  generateQuestion,
  judgePanel,
} from '@moonai/core'
import {
  accountHashOf,
  arena,
  fund,
  loadSigner,
  newAgent,
  txLink,
} from '@moonai/plugin-onchain'

interface MatchRecord {
  id: number
  question: string
  judges: string[]
  players: {
    name: string
    total: number
    scores: { judge: string; score: number }[]
    submitTx: string
  }[]
  winner: string
  tx: { create: string; post: string; settle: string }
}

const PEM = process.env.CASPER_SECRET_KEY_PATH
if (!PEM) throw new Error('set CASPER_SECRET_KEY_PATH (the orchestrator / Account 4 key)')
const orchestrator = loadSigner(PEM)

const COUNTER = '.match-id'
const DATA = 'data/matches.json'
const matchId = existsSync(COUNTER) ? Number(readFileSync(COUNTER, 'utf8')) : 0
const sha = (s: string) => new Bun.CryptoHasher('sha256').update(s).digest('hex')

console.log(`🌙 Moon AI — autonomous match #${matchId}\n`)

// ① orchestrator opens a 0-fee, 2-player match
console.log('① create_match…')
const createTx = await arena.createMatch(orchestrator, 0, 2)
console.log('   ', txLink(createTx))

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
const postTx = await arena.postQuestion(orchestrator, matchId, sha(question))
console.log('   post_question', txLink(postTx))

// ⑤ Director assembles a randomized judge panel
const judges = await generatePersonalities(3)
console.log(`⚖️  judges: ${judges.map((j) => j.name).join(', ')}\n`)

// ⑥ each competitor answers (LLM) + submits on-chain; the panel scores it
const playerRecords: MatchRecord['players'] = []
const ranking: { name: string; accountHash: string; total: number }[] = []
for (const p of players) {
  const answer = await craftAnswer(question, p.strategy)
  const submitTx = await arena.submitAnswer(p.key, matchId, sha(answer))
  console.log('   ', p.name, 'submit_answer', txLink(submitTx))
  const panel = await judgePanel(question, answer, judges)
  console.log(
    `      → ${panel.total}/30 (${panel.scores.map((s) => `${s.judge}:${s.score}`).join(' ')})`,
  )
  playerRecords.push({
    name: p.name,
    total: panel.total,
    scores: panel.scores.map((s) => ({ judge: s.judge, score: s.score })),
    submitTx,
  })
  ranking.push({
    name: p.name,
    accountHash: accountHashOf(p.key.publicKey),
    total: panel.total,
  })
}

// ⑦ settle: highest panel total wins
ranking.sort((a, b) => b.total - a.total)
const winner = ranking[0]
if (!winner) throw new Error('no scored competitors')
console.log(`\n🏆 winner: ${winner.name} — ${winner.total}/30`)
const settleTx = await arena.settle(
  orchestrator,
  matchId,
  winner.accountHash,
  winner.total,
)
console.log('   settle', txLink(settleTx))

// persist the match record so the dashboard updates
const record: MatchRecord = {
  id: matchId,
  question,
  judges: judges.map((j) => j.name),
  players: playerRecords,
  winner: winner.name,
  tx: { create: createTx, post: postTx, settle: settleTx },
}
let all: MatchRecord[] = []
try {
  all = JSON.parse(readFileSync(DATA, 'utf8')) as MatchRecord[]
} catch {
  /* first match */
}
all.push(record)
writeFileSync(DATA, `${JSON.stringify(all, null, 2)}\n`)
writeFileSync(COUNTER, String(matchId + 1))

console.log(
  '\n✅ match settled on-chain + recorded → data/matches.json (dashboard updates).',
)
