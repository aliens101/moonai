import { getSession } from '@/lib/auth/session'

export const runtime = 'nodejs'

export async function POST() {
  const session = await getSession()
  session.destroy()
  return Response.json({ ok: true })
}
