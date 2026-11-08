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

import { getCfg, setNoPrefix, NOPREFIX_MODES } from '../../lib/prefix.js'

const LABEL = {
    off: 'OFF — semua perintah wajib pakai prefix',
    owner: 'OWNER — hanya owner yang boleh tanpa prefix',
    all: 'ALL — semua orang boleh tanpa prefix',
}

let handler = async (m, { args, usedPrefix, command }) => {
    const mode = (args[0] || '').toLowerCase()
    if (!NOPREFIX_MODES.includes(mode)) {
        return m.reply(
            `*NO PREFIX*\nStatus: *${LABEL[getCfg().noprefix]}*\n\n` +
            `${usedPrefix || ''}${command} owner  → hanya owner\n` +
            `${usedPrefix || ''}${command} all    → semua orang\n` +
            `${usedPrefix || ''}${command} off    → matikan`
        )
    }
    setNoPrefix(mode)
    await global.db.write().catch(() => { })
    m.reply(`✅ No-prefix: *${LABEL[mode]}*`)
}
handler.help = ['noprefix <owner|all|off>']
handler.tags = ['owner']
handler.command = /^noprefix$/i
handler.owner = true

export default handler
