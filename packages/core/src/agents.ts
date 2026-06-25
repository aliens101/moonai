/**
 * Moon AI arena agents (LLM-backed):
 *  - Philosopher  → generates the competition question
 *  - Director     → generates N distinct judge personalities
 *  - Judge        → scores an answer 0..10 through its persona's lens
 *  - judgePanel   → runs all judges, totals 0..(10*N)  (3 judges → 0..30)
 *  - craftAnswer  → a reference participant (players bring their own strategy)
 */
import { chat, chatJSON } from './llm'

export interface Personality {
  name: string
  description: string
}
export interface JudgeScore {
  judge: string
  score: number
  reason: string
}
export interface PanelResult {
  total: number
  scores: JudgeScore[]
}

/** Philosopher — one short, provocative, genuinely debatable question. */
export async function generateQuestion(): Promise<string> {
  const { question } = await chatJSON<{ question: string }>(
    [
      {
        role: 'system',
        content:
          'You are the Philosopher in an autonomous AI debate arena. Produce ONE short, provocative, genuinely debatable question (crypto/tech/economics/philosophy) with no single correct answer. Respond as JSON: {"question": string}.',
      },
      { role: 'user', content: 'Generate a fresh competition question.' },
    ],
    1.0,
  )
  return question.trim()
}

/** Director — N distinct, opinionated judge personas. */
export async function generatePersonalities(n: number): Promise<Personality[]> {
  const { judges } = await chatJSON<{ judges: Personality[] }>(
    [
      {
        role: 'system',
        content: `You are the Director. Invent ${n} DISTINCT, strongly-opinionated judge personas for a debate arena (e.g. "Crypto Bull", "L2 Maxi", "Skeptical Academic"). Each judges every answer through its own biases. Respond as JSON: {"judges": [{"name": string, "description": string}]}.`,
      },
      { role: 'user', content: `Create ${n} judges.` },
    ],
    1.0,
  )
  return judges.slice(0, n)
}

/** Judge — score 0..10 through a persona's biased lens. */
export async function judge(
  question: string,
  answer: string,
  p: Personality,
): Promise<JudgeScore> {
  const r = await chatJSON<{ score: number; reason: string }>(
    [
      {
        role: 'system',
        content: `You are a debate judge. Persona: ${p.name} — ${p.description}. Score the answer 0..10 strictly through your persona's biases. Respond as JSON: {"score": number, "reason": string}.`,
      },
      {
        role: 'user',
        content: `Question: ${question}\n\nAnswer: ${answer}\n\nScore it.`,
      },
    ],
    0.3,
  )
  const score = Math.max(0, Math.min(10, Math.round(r.score)))
  return { judge: p.name, score, reason: r.reason }
}

/** Run the full panel; total is the sum of each judge's 0..10. */
export async function judgePanel(
  question: string,
  answer: string,
  personalities: Personality[],
): Promise<PanelResult> {
  const scores = await Promise.all(personalities.map((p) => judge(question, answer, p)))
  const total = scores.reduce((s, j) => s + j.score, 0)
  return { total, scores }
}

/** Reference participant — players replace this with their own agent + strategy. */
export async function craftAnswer(
  question: string,
  strategy = 'Argue persuasively with concrete evidence; satisfy multiple perspectives at once.',
): Promise<string> {
  const out = await chat(
    [
      {
        role: 'system',
        content: `You are a competitor in an autonomous AI debate arena. Strategy: ${strategy} Keep it under 120 words.`,
      },
      { role: 'user', content: `Question: ${question}\n\nWrite your best answer.` },
    ],
    { temperature: 0.8 },
  )
  return out.trim()
}
