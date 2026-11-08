/*
  ERINE-AI • ELYRINE
  WhatsApp Bot Multi-Device · Node.js ESM

  Developer   Arman Maulana (Lynx decode)
  Versi       1.0.0
  Lisensi     ELYRINE Source-Available Non-Commercial v1.0
  Copyright   © 2026 Arman Maulana

  Didirikan di atas Elyra Labs & ekosistemnya.
  Komunitas   General District (induk) · INF Project · Elyra Labs
  Engine      elyra-baileys, fork Baileys yang dikustom
              sesuai kebutuhan bot ini.

  Dilarang menjual, menyewakan, atau merebrand tanpa
  izin tertulis dari developer. Jangan hapus kredit ini.
*/

const TTL = 10 * 60 * 1000
const cache = new Map()

export const isChannelJid = jid => String(jid || '').endsWith('@newsletter')

export async function isManagedChannel(conn, jid) {
    if ((global.allowChannels || []).includes(jid)) return true
    const hit = cache.get(jid)
    if (hit && Date.now() - hit.at < TTL) return hit.ok
    let ok = false
    try {
        const meta = await conn.newsletterMetadata?.('jid', jid)
        const role = String(
            meta?.viewer_metadata?.role ?? meta?.viewerMetadata?.role ?? meta?.thread_metadata?.viewer_role ?? meta?.role ?? ''
        ).toUpperCase()
        ok = role === 'OWNER' || role === 'ADMIN'
    } catch (e) {
        ok = false
    }
    cache.set(jid, { ok, at: Date.now() })
    return ok
}
