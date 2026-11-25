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

import * as L from '../../lib/linode.js'

let handler = async (m, { text, usedPrefix, command }) => {
    const id = String(text || '').trim().split(/\s+/)[0]
    if (!/^\d+$/.test(id)) return m.reply(`Contoh: ${usedPrefix}${command} 12345`)
    return L.safe(m, async () => {
        const l = await L.call(`/linode/instances/${id}`)
        return m.reply(`🔍 *DETAIL LINODE*\n${L.LINE}\nID     : ${l.id}\nLabel  : ${l.label}\nStatus : ${l.status}\nRegion : ${l.region}\nType   : ${l.type}\nIP     : ${l.ipv4?.join(', ') || '-'}`)
    })
}

handler.help = ['cekvpslinode']
handler.tags = ['linode']
handler.command = ['cekvpslinode']
handler.owner = true

export default handler
