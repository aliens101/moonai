/**
 * Dry-run the arena agents end-to-end (no chain):
 * Philosopher → Director → participant answer → judge panel.
 *   bun run scripts/agents-demo.ts
 */
import {
  craftAnswer,
  generatePersonalities,
  generateQuestion,
  judgePanel,
} from '@moonai/core'

console.log('🌙 Moon AI — agent dry run\n')

const question = await generateQuestion()
console.log('❓ Question:', question, '\n')

const judges = await generatePersonalities(3)
console.log('⚖️  Judges:', judges.map((j) => j.name).join(', '), '\n')

const answer = await craftAnswer(question)
console.log('💬 Answer:', answer, '\n')

const result = await judgePanel(question, answer, judges)
for (const s of result.scores) {
  console.log(`   ${s.judge}: ${s.score}/10 — ${s.reason}`)
}
console.log(`\n🏆 Total: ${result.total}/30`)
