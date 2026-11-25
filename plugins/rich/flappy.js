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
import { buildFlappyHtml } from '../../lib/cards/flappy.js'

let handler = async (m, { conn }) => {
    const nama = m.pushName || String(m.sender).split('@')[0]
    await sendRichCard(conn, m, { title: 'Flappy Live', html: buildFlappyHtml({ playerName: nama }), footer: '© 𝙴𝚁𝙸𝙽𝙴-𝙰𝙸 ~ 𝙵𝙻𝙰𝙿𝙿𝚈', emoji: '🐤', tag: 'FLAPPY' })
}

handler.help = ['flappy']
handler.tags = ['rich']
handler.command = /^(flappy|flappylive)$/i
handler.register = true

export default handler
