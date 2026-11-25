/*
  ERINE-AI • ELYRINE
  WhatsApp Bot Multi-Device · Node.js ESM

  Developer   Arman Maulana (Lynx decode)
  Versi       1.0.0
  Lisensi     ELYRINE Source-Available Non-Commercial v1.0
  Copyright   © 2026 Arman Maulana

  Didirikan di atas Elyra Labs & ekosistemnya.
  Komunitas   General District (induk) · INF Project · Elyra Labs
  Engine      elyrine-baileys, fork Baileys yang dikustom
              sesuai kebutuhan bot ini.

  Dilarang menjual, menyewakan, atau merebrand tanpa
  izin tertulis dari developer. Jangan hapus kredit ini.
*/

import { findSaluran } from './saluran.js'

const OK_TTL = 10 * 60 * 1000
const FAIL_TTL = 30 * 1000
const cache = new Map()

export const isChannelJid = jid => String(jid || '').endsWith('@newsletter')

const roleOf = meta => String(
    meta?.viewer_metadata?.role ?? meta?.viewerMetadata?.role ?? meta?.thread_metadata?.viewer_role ?? meta?.role ?? ''
).toUpperCase()

export async function isManagedChannel(conn, jid) {
    if (findSaluran(jid)) return true
    if ((global.allowChannels || []).includes(jid)) return true
    const hit = cache.get(jid)
    if (hit && Date.now() - hit.at < hit.ttl) return hit.ok
    let ok = false
    try {
        const meta = await conn.newsletterMetadata?.('jid', jid)
        const role = roleOf(meta)
        ok = role === 'OWNER' || role === 'ADMIN'
    } catch (e) {
        ok = false
    }
    cache.set(jid, { ok, at: Date.now(), ttl: ok ? OK_TTL : FAIL_TTL })
    return ok
}
