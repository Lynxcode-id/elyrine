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

import { sendRichCard } from '../../lib/cards/send.js'
import { buildHbdHtml } from '../../lib/cards/hbd.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const name = args.join(' ').trim()
    if (!name) return m.reply(`Contoh: ${usedPrefix}${command} Arman`)
    const from = m.pushName || ''
    return sendRichCard(conn, m, { title: `Happy Birthday ${name}`, html: buildHbdHtml({ name, from }), footer: '© 𝙴𝚁𝙸𝙽𝙴-𝙰𝙸 ~ 𝙷𝙱𝙳', emoji: '🎂', tag: 'HBD' })
}

handler.help = ['hbd <nama>']
handler.tags = ['rich']
handler.command = /^(hbd|ultah|ulangtahun|birthday|happybirthday)$/i
handler.register = true

export default handler
