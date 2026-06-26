import { verifySuiSignIn } from '@/lib/auth/messages'
import { getSession } from '@/lib/auth/session'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await getSession()
  const expectedNonce = session.nonce
  if (!expectedNonce) {
    return Response.json({ ok: false, reason: 'no nonce issued' }, { status: 400 })
  }

  let body: { address?: string; message?: string; signature?: string } = {}
  try {
    body = (await req.json()) as typeof body
  } catch {
    return Response.json({ ok: false, reason: 'invalid json' }, { status: 400 })
  }
  if (!body.address || !body.message || !body.signature) {
    return Response.json(
      { ok: false, reason: 'missing address, message, or signature' },
      { status: 400 },
    )
  }

  const result = await verifySuiSignIn({
    address: body.address,
    message: body.message,
    signature: body.signature,
    expectedNonce,
  })
  if (!result.ok) {
    return Response.json({ ok: false, reason: result.reason }, { status: 401 })
  }

  session.address = result.address
  // Rotate the nonce so the same signed message cannot be replayed.
  session.nonce = undefined
  await session.save()
  return Response.json({ ok: true, address: result.address })
}
