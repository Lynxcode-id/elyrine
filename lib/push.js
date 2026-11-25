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

export const pushKode = (n = 6) => Array.from({ length: n }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('')

export function memberJids(conn, participants) {
    const me = String(conn.user?.id || '').split(':')[0].split('@')[0]
    const out = []
    for (const p of participants || []) {
        const jid = String(p.phoneNumber || p.id || '')
        if (!jid.endsWith('@s.whatsapp.net')) continue
        if (jid.split('@')[0].split(':')[0] === me || out.includes(jid)) continue
        out.push(jid)
    }
    return out
}

export function buildVcf(jids, nameOf) {
    return jids.map((jid, i) => {
        const nomor = String(jid).split('@')[0].split(':')[0]
        const nama = nameOf ? nameOf(jid, i) : `WA[${pushKode(2)}] ${nomor}`
        return ['BEGIN:VCARD', 'VERSION:3.0', `FN:${nama}`, `TEL;type=CELL;type=VOICE;waid=${nomor}:+${nomor}`, 'END:VCARD', ''].join('\n')
    }).join('')
}

export async function sendVcf(conn, to, jids, { fileName, caption = '', nameOf, quoted } = {}) {
    if (!jids.length) return false
    const safe = String(fileName || `kontak_${jids.length}`).replace(/[\\/:*?"<>|]+/g, '_')
    await conn.sendMessage(to, {
        document: Buffer.from(buildVcf(jids, nameOf), 'utf8'),
        fileName: safe.endsWith('.vcf') ? safe : `${safe}.vcf`,
        mimetype: 'text/vcard',
        caption
    }, quoted ? { quoted } : undefined)
    return true
}
