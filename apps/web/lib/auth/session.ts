// iron-session config for Sui wallet-authed operator sessions.
//
// (Path kept as lib/auth/session.ts for import stability; the auth scheme is now
// Sui personal-message sign-in, not Sign-In-With-Ethereum.)

import 'server-only'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

export type SessionData = {
  /** Authenticated Sui address (0x + 64 hex). */
  address?: string
  /** Single-use nonce for the in-flight sign-in challenge. */
  nonce?: string
  /** ISO timestamp the nonce was issued. */
  issuedAt?: string
}

export const SESSION_COOKIE = 'moonai-console-session'

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET env var missing or too short (need at least 32 chars). See apps/web/.env.local.example.',
    )
  }
  return secret
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), {
    password: getSecret(),
    cookieName: SESSION_COOKIE,
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      // Match max-age of cookie to a sane operator session lifespan.
      maxAge: 60 * 60 * 24 * 7,
    },
  })
}
