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

import { makeBratVideoSticker } from '../../lib/brat.js'

const handler = async (m, { conn, text, command, prefix }) => {
  text = text || m.quoted?.text || m.quoted?.caption

  if (!text) {
    throw `Masukkan teks atau balas pesan dengan perintah *${prefix + command}*`
  }

  await m.react('⚡').catch(() => {})

  try {
    const sticker = await makeBratVideoSticker(text)

    await conn.sendMessage(m.chat, {
      sticker,
      isAiSticker: true
    }, { quoted: m })

    await m.react('✅').catch(() => {})
  } catch (error) {
    console.error('[ERINE BRATVID]', error?.stack || error)
    await m.react('❌').catch(() => {})
    throw `Gagal memproses brat video: ${error.message || error}`
  }
}

handler.help = ['bratvid <teks>']
handler.tags = ['sticker']
handler.command = /^(bratvid|bratvideo)$/i
handler.limit = true

export default handler
