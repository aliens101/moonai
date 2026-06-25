import { describe, expect, test } from 'bun:test'
import {
  clampScore,
  generatePersonalities,
  generateQuestion,
  type JudgeScore,
  tallyPanel,
} from './agents'

describe('clampScore (unit)', () => {
  test('rounds and clamps into 0..10', () => {
    expect(clampScore(7.4)).toBe(7)
    expect(clampScore(7.6)).toBe(8)
    expect(clampScore(-5)).toBe(0)
    expect(clampScore(42)).toBe(10)
  })
})

describe('tallyPanel (unit)', () => {
  const s = (score: number): JudgeScore => ({ judge: 'x', score, reason: '' })
  test('sums each judge score (0..30 for a 3-judge panel)', () => {
    expect(tallyPanel([s(8), s(3), s(6)])).toBe(17)
    expect(tallyPanel([s(10), s(10), s(10)])).toBe(30)
    expect(tallyPanel([])).toBe(0)
  })
})

// Integration: hits the real LLM. Opt-in (costs API tokens):
//   RUN_LLM_TESTS=1 bun test
const LLM = process.env.RUN_LLM_TESTS === '1' && !!process.env.OPENAI_API_KEY
const llmSuite = LLM ? describe : describe.skip
llmSuite('agents (integration, live LLM)', () => {
  test('Philosopher returns a non-empty question', async () => {
    const q = await generateQuestion()
    expect(q.length).toBeGreaterThan(5)
  }, 30000)
  test('Director returns N distinct judges', async () => {
    const judges = await generatePersonalities(3)
    expect(judges.length).toBe(3)
    expect((judges[0]?.name ?? '').length).toBeGreaterThan(0)
  }, 30000)
})
