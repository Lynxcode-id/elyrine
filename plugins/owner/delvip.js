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

import { resolveTarget } from '../../lib/target.js'
import { syncUser } from '../../lib/limit.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const jid = await resolveTarget(m, conn, args)
    if (!jid) throw `Contoh:\n• ${usedPrefix + command} @user\n• ${usedPrefix + command} 6281234567890`
    const u = global.db.data.users[jid]
    if (!u) throw 'User tidak ada di database.'
    u.vip = false
    u.vipTime = 0
    syncUser(u, jid)
    await global.db.write().catch(() => { })
    m.reply('Done! VIP dicabut.')
}
handler.help = ['delvip <nomor>']
handler.tags = ['owner']
handler.command = /^delvip$/i
handler.rowner = true

export default handler
