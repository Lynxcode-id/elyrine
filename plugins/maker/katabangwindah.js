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

import { narrow } from '../../scrape/katabangwindah.js'

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const content = (text || m.quoted?.text || '').trim()
  if (!content) throw `*Contoh:* ${usedPrefix || '.'}${command} mark tidur, besok ban grup lagi`

  await m.react('⏳').catch(() => { })
  const res = await narrow(content)
  if (!res.status) {
    await m.react('❌').catch(() => { })
    return m.gagal(res.message, 'Narrow')
  }

  await conn.sendMessage(m.chat, { image: res.buffer, mimetype: 'image/jpeg' }, { quoted: m })
  await m.react('✅').catch(() => { })
}

handler.help = ['katabangwindah <teks>']
handler.tags = ['maker']
handler.command = /^(katabangwindah)$/i
handler.limit = true

export default handler
