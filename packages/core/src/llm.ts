/**
 * Minimal OpenAI-compatible chat client. Point MOONAI_LLM_BASE_URL / _MODEL at any
 * compatible gateway (OpenAI, Z.AI, etc.); falls back to OpenAI gpt-4o-mini.
 */
const API_KEY = process.env.MOONAI_LLM_API_KEY ?? process.env.OPENAI_API_KEY ?? ''
const BASE_URL = (process.env.MOONAI_LLM_BASE_URL ?? 'https://api.openai.com/v1').replace(
  /\/$/,
  '',
)
const MODEL = process.env.MOONAI_LLM_MODEL ?? 'gpt-4o-mini'

export interface ChatMsg {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function chat(
  messages: ChatMsg[],
  opts: { json?: boolean; temperature?: number } = {},
): Promise<string> {
  if (!API_KEY) throw new Error('set OPENAI_API_KEY (or MOONAI_LLM_API_KEY)')
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: opts.temperature ?? 0.7,
      ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  })
  if (!res.ok) {
    throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>
  }
  return data.choices[0]?.message?.content ?? ''
}

/** Chat with JSON-object response, parsed into `T`. */
export async function chatJSON<T>(messages: ChatMsg[], temperature = 0.7): Promise<T> {
  const raw = await chat(messages, { json: true, temperature })
  return JSON.parse(raw) as T
}
