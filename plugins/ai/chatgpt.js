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
  const prompt = args.join(' ').trim()

  if (!prompt) {
    throw 'Masukkan pertanyaan untuk ChatGPT.\n\nContoh: *.chatgpt halo, siapa kamu?*'
  }

  try {
    const result = await requestTheresav('/api/ai/chatgpt', {
      prompt
    })

    await conn.sendMessage(m.chat, {
      text: result
    }, {
      quoted: m
    })
  } catch (error) {
    console.error('[CHATGPT AI]', error?.stack || error)
    throw `ChatGPT gagal memberikan respons: ${error.message}`
  }
}

handler.help = ['chatgpt <pertanyaan>']
handler.tags = ['ai']
handler.command = /^(chatgpt)$/i
handler.limit = true
handler.wait = true

export default handler
