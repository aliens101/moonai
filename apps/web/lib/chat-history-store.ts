// Server-side chat history, keyed by the Sui sign-in-authenticated wallet address, so a
// user's conversations sync across devices/browsers. File-backed (one JSON file
// per wallet) under a data dir OUTSIDE the repo so deploys (git reset) don't wipe
// it. The API layer only ever passes the session address, so a wallet can only
// read/write its own history.
import 'server-only'

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export type TraceItem = { tool: string; args: unknown; result: unknown }
export type Msg = { role: 'user' | 'assistant'; content: string; trace?: TraceItem[] }
export interface Conversation {
  id: string
  title: string
  messages: Msg[]
  createdAt: number
  updatedAt: number
}

const MAX_CONVOS = 100
const MAX_MSGS = 200
const MAX_CONTENT = 24_000
const MAX_TITLE = 80

function dataDir(): string {
  return process.env.MOONAI_CHAT_DATA_DIR || join(homedir(), '.moonai', 'chats')
}

function fileFor(address: string): string {
  // address comes from the verified session; sanitize anyway for path safety.
  const safe = address.toLowerCase().replace(/[^a-z0-9x]/g, '')
  return join(dataDir(), `${safe || 'unknown'}.json`)
}

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.slice(0, max) : ''
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

function sanitizeMsg(m: unknown): Msg | null {
  if (!m || typeof m !== 'object') return null
  const r = (m as { role?: unknown }).role
  if (r !== 'user' && r !== 'assistant') return null
  const out: Msg = { role: r, content: str((m as { content?: unknown }).content, MAX_CONTENT) }
  const trace = (m as { trace?: unknown }).trace
  if (Array.isArray(trace)) {
    out.trace = trace.slice(0, 12).map(t => ({
      tool: str((t as { tool?: unknown })?.tool, 60),
      args: (t as { args?: unknown })?.args ?? null,
      result: (t as { result?: unknown })?.result ?? null,
    }))
  }
  return out
}

function sanitize(input: unknown): Conversation[] {
  if (!Array.isArray(input)) return []
  const out: Conversation[] = []
  for (const c of input.slice(0, MAX_CONVOS)) {
    if (!c || typeof c !== 'object') continue
    const id = str((c as { id?: unknown }).id, 64)
    if (!id) continue
    const messages = (Array.isArray((c as { messages?: unknown }).messages)
      ? ((c as { messages: unknown[] }).messages as unknown[])
      : []
    )
      .slice(-MAX_MSGS)
      .map(sanitizeMsg)
      .filter((m): m is Msg => m !== null)
    out.push({
      id,
      title: str((c as { title?: unknown }).title, MAX_TITLE) || 'New chat',
      messages,
      createdAt: num((c as { createdAt?: unknown }).createdAt),
      updatedAt: num((c as { updatedAt?: unknown }).updatedAt),
    })
  }
  return out
}

export async function readChats(address: string): Promise<Conversation[]> {
  try {
    const raw = await readFile(fileFor(address), 'utf8')
    return sanitize(JSON.parse(raw))
  } catch {
    return []
  }
}

export async function writeChats(address: string, conversations: unknown): Promise<Conversation[]> {
  const clean = sanitize(conversations)
  const dir = dataDir()
  await mkdir(dir, { recursive: true })
  const file = fileFor(address)
  const tmp = `${file}.${process.pid}.tmp`
  await writeFile(tmp, JSON.stringify(clean), 'utf8')
  await rename(tmp, file) // atomic replace
  return clean
}
