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

import { getLimitCfg, setLimitEnabled, quotaOf, nextResetAt, formatCountdown } from '../../lib/limit.js'

let handler = async (m, { args, usedPrefix, command }) => {
    const a = (args[0] || '').toLowerCase()
    const cfg = getLimitCfg()
    if (a === 'on' || a === 'off') {
        setLimitEnabled(a === 'on')
        await global.db.write().catch(() => { })
        return m.reply(`✅ Sistem limit: *${a.toUpperCase()}*` + (a === 'off' ? '\nSemua user bebas limit sampai dinyalakan lagi.' : ''))
    }
    m.reply(
        `*SISTEM LIMIT:* ${cfg.enabled ? 'ON ✅' : 'OFF ⛔'}\n` +
        `Free: ${quotaOf('free')}/hari\nPremium: ${quotaOf('premium')}/hari\nVIP: ${quotaOf('vip')}/hari\nOwner: unlimited\n\n` +
        `Reset 00:00 WITA khusus user dengan limit < ${cfg.resetBelow} (berikutnya ${formatCountdown(nextResetAt() - Date.now())} lagi)\n\n` +
        `${usedPrefix}${command} on | off`
    )
}
handler.help = ['limitsystem <on|off>']
handler.tags = ['owner']
handler.command = /^limitsystem$/i
handler.owner = true

export default handler
