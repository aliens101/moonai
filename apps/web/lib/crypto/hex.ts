// Minimal Sui-free hex helpers for the browser crypto layer.

export type Hex = `0x${string}`

/** Decode a 0x-prefixed (or bare) hex string into bytes. */
export function hexToBytes(hex: string): Uint8Array {
  const s = hex.startsWith('0x') ? hex.slice(2) : hex
  if (s.length % 2 !== 0) {
    throw new Error(`hex string has odd length: ${s.length}`)
  }
  const out = new Uint8Array(s.length / 2)
  for (let i = 0; i < out.length; i++) {
    const byte = Number.parseInt(s.slice(i * 2, i * 2 + 2), 16)
    if (Number.isNaN(byte)) throw new Error('invalid hex string')
    out[i] = byte
  }
  return out
}

/** Encode bytes into a 0x-prefixed hex string. */
export function bytesToHex(bytes: Uint8Array): Hex {
  let s = '0x'
  for (const b of bytes) s += b.toString(16).padStart(2, '0')
  return s as Hex
}
