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

export async function resolveTarget(m, conn, tokens) {
    const numTok = tokens.find(t => /^\+?\d{5,}$/.test(t.replace(/[\s-]/g, '')))
    let raw = numTok ? numTok.replace(/\D/g, '') + '@s.whatsapp.net' : (m.mentionedJid?.[0] || m.quoted?.sender || null)
    if (!raw) return null
    let jid = conn.getJid ? conn.getJid(conn.decodeJid ? conn.decodeJid(raw) : raw) : raw
    if (!/@s\.whatsapp\.net$/.test(jid)) {
        const pn = await conn.identity?.resolve?.(jid).catch(() => null)
        if (pn) jid = pn
    }
    return /@s\.whatsapp\.net$/.test(jid) ? jid : null
}
