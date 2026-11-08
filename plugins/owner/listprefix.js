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

import { getCfg, getPrefixList } from '../../lib/prefix.js'

let handler = async (m) => {
    const cfg = getCfg()
    const list = getPrefixList()
    const shown = list.map(v => v === '‎' ? '‎(LRM)' : v)
    m.reply(
        `*DAFTAR PREFIX* (${list.length}${cfg.list ? ', custom' : ', bawaan'})\n` +
        (list.length ? shown.map(v => '`' + v + '`').join('  ') : '_kosong_') +
        `\n\n*No-prefix:* ${cfg.noprefix.toUpperCase()}`
    )
}
handler.help = ['listprefix']
handler.tags = ['owner']
handler.command = /^listprefix$/i
handler.owner = true

export default handler
