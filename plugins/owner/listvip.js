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

import { isVipActive } from '../../lib/limit.js'

let handler = async (m) => {
    const now = Date.now()
    const rows = Object.entries(global.db.data.users).filter(([, u]) => isVipActive(u, now)).sort((a, b) => a[1].vipTime - b[1].vipTime)
    m.reply(`*DAFTAR VIP* (${rows.length})\n` + (rows.length ? rows.map(([jid, u], i) => `${i + 1}. wa.me/${jid.split('@')[0]} — ${Math.ceil((u.vipTime - now) / 86400000)} hari lagi`).join('\n') : '_kosong_'))
}
handler.help = ['listvip']
handler.tags = ['owner']
handler.command = /^(listvip|viplist)$/i
handler.owner = true

export default handler
