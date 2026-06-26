import { type ChatMessage, runAgent } from '@/lib/agent'
import { getSession } from '@/lib/auth/session'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: ChatMessage[]; walletAddress?: string }
    const messages = (body.messages ?? [])
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: String(m.content ?? '') }))
      .slice(-12) as ChatMessage[]
    if (messages.length === 0) {
      return NextResponse.json({ error: 'no messages' }, { status: 400 })
    }
    // The agent's "my balance / from" subject: the Sui sign-in session address if
    // signed in, otherwise the wallet the browser reports as connected. Reads
    // are public and transfers are signed client-side, so trusting the
    // client-provided address here grants no privilege (it can't move funds).
    const session = await getSession().catch(() => null)
    const walletAddress = session?.address ?? body.walletAddress ?? null
    const result = await runAgent(messages, { authedAddress: walletAddress })
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
