import { getSession } from '@/lib/auth/session'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getSession()
  return Response.json({
    address: session.address ?? null,
  })
}
