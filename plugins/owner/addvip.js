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
import { quotaOf, syncUser } from '../../lib/limit.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const jid = await resolveTarget(m, conn, args)
    const days = parseInt(args[args.length - 1], 10)
    if (!jid || !days || days <= 0) throw `Contoh:\n• ${usedPrefix + command} @user 30\n• ${usedPrefix + command} 6281234567890 30\n• (reply) ${usedPrefix + command} 30`
    const users = global.db.data.users
    const u = users[jid] = users[jid] || { registered: false, exp: 0, limit: quotaOf('free'), afk: -1, afkReason: '', banned: false }
    const now = Date.now()
    u.vipTime = (u.vipTime > now ? u.vipTime : now) + days * 86400000
    u.vip = true
    syncUser(u, jid)
    u.limit = Math.max(u.limit || 0, quotaOf('vip'))
    await global.db.write().catch(() => { })
    m.reply(`✔️ VIP aktif\n👤 wa.me/${jid.split('@')[0]}\n📆 +${days} hari (sisa ${Math.ceil((u.vipTime - now) / 86400000)} hari)\n🎫 Limit: ${u.limit} (kuota ${quotaOf('vip')}/hari)`)
}
handler.help = ['addvip <nomor> <hari>']
handler.tags = ['owner']
handler.command = /^addvip$/i
handler.rowner = true

export default handler
