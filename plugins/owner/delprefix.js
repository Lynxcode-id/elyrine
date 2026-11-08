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

import { getCfg, getPrefixList, setPrefixList } from '../../lib/prefix.js'

let handler = async (m, { args, usedPrefix, command }) => {
    if (!args.length) return m.reply(`Contoh:\n${usedPrefix}${command} ~\n${usedPrefix}${command} ~ @ bot\n${usedPrefix}${command} reset  (kembali ke prefix bawaan)`)
    if (args.length === 1 && args[0].toLowerCase() === 'reset') {
        setPrefixList(null)
        await global.db.write().catch(() => { })
        return m.reply('✅ Prefix dikembalikan ke bawaan.')
    }
    const list = getPrefixList()
    const removed = [], missing = []
    for (const v of args) {
        const i = list.indexOf(v)
        if (i < 0) missing.push(v)
        else { list.splice(i, 1); removed.push(v) }
    }
    if (!list.length && getCfg().noprefix === 'off') {
        return m.reply(`❌ Ditolak: itu menghapus prefix terakhir dan no-prefix sedang OFF, bot jadi tidak bisa dipanggil.\nAktifkan dulu: ${usedPrefix}noprefix owner`)
    }
    if (removed.length) {
        setPrefixList(list)
        await global.db.write().catch(() => { })
    }
    m.reply([
        removed.length && `✅ Dihapus: ${removed.map(v => '`' + v + '`').join(' ')}`,
        missing.length && `ℹ️ Tidak ditemukan: ${missing.map(v => '`' + v + '`').join(' ')}`,
    ].filter(Boolean).join('\n'))
}
handler.help = ['delprefix <prefix>']
handler.tags = ['owner']
handler.command = /^delprefix$/i
handler.owner = true

export default handler
