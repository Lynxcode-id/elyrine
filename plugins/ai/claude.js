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

import { requestTheresav } from '../../lib/theresav-ai.js'

const handler = async (m, { conn, args }) => {
  const text = args.join(' ').trim()

  if (!text) {
    throw 'Masukkan pertanyaan untuk Claude.\n\nContoh: *.claude jelaskan apa itu JavaScript*'
  }

  try {
    const result = await requestTheresav('/api/ai/claude', {
      text
    })

    await conn.sendMessage(m.chat, {
      text: result
    }, {
      quoted: m
    })
  } catch (error) {
    console.error('[CLAUDE AI]', error?.stack || error)
    throw `Claude gagal memberikan respons: ${error.message}`
  }
}

handler.help = ['claude <pertanyaan>']
handler.tags = ['ai']
handler.command = /^claude$/i
handler.limit = true
handler.wait = true

export default handler
