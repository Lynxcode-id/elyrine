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

import { syncDatabase } from '../../lib/limit.js'

let handler = async (m) => {
    const r = syncDatabase()
    await global.db.write().catch(() => { })
    m.reply(
        `✅ *Database disinkronkan*\n` +
        `User dipindai: ${r.users}\nRole diperbaiki: ${r.role}\nPremium kedaluwarsa: ${r.premiumExpired}\nVIP kedaluwarsa: ${r.vipExpired}\nField diperbaiki: ${r.fields}\n` +
        (r.daily.ran ? `Reset harian: ${r.daily.reset} direset, ${r.daily.kept} dibiarkan` : 'Reset harian: sudah dilakukan hari ini')
    )
}
handler.help = ['syncdb']
handler.tags = ['owner']
handler.command = /^syncdb$/i
handler.owner = true

export default handler
