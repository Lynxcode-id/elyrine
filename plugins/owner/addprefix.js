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

import { getPrefixList, setPrefixList, validatePrefix, MAX_PREFIX_LEN } from '../../lib/prefix.js'

let handler = async (m, { args, usedPrefix, command }) => {
    if (!args.length) return m.reply(`Contoh:\n${usedPrefix}${command} ~\n${usedPrefix}${command} bot  (prefix kata, harus diikuti spasi: "bot menu")\n\nMaks ${MAX_PREFIX_LEN} karakter. Bisa beberapa sekaligus: ${usedPrefix}${command} ~ @ bot`)
    const list = getPrefixList()
    const added = [], dup = [], bad = []
    for (const raw of args) {
        const v = validatePrefix(raw)
        if (v.error) { bad.push(`${raw} (${v.error})`); continue }
        if (list.includes(v.value)) { dup.push(v.value); continue }
        list.push(v.value); added.push(v.value)
    }
    if (added.length) {
        setPrefixList(list)
        await global.db.write().catch(() => { })
    }
    m.reply([
        added.length && `✅ Ditambah: ${added.map(v => '`' + v + '`').join(' ')}`,
        dup.length && `ℹ️ Sudah ada: ${dup.map(v => '`' + v + '`').join(' ')}`,
        bad.length && `❌ Ditolak: ${bad.join(', ')}`,
    ].filter(Boolean).join('\n'))
}
handler.help = ['addprefix <prefix>']
handler.tags = ['owner']
handler.command = /^addprefix$/i
handler.owner = true

export default handler
