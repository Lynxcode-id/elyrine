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

import { makeSticker } from '../../lib/sticker-maker.js'

const handler = async (m, { conn }) => {
  const q = m.quoted || m
  const mime = q.mimetype || q.msg?.mimetype || ''

  if (!q.download || !/^(image\/|video\/)/i.test(mime)) {
    throw 'Reply atau kirim foto/video dengan perintah *.s* untuk membuat sticker.'
  }

  await m.react('🌱').catch(() => {})

  try {
    const media = await q.download()
    const sticker = await makeSticker({ buffer: media, mimetype: mime })

    await conn.sendMessage(m.chat, {
      sticker,
      isAiSticker: /^image\/(?!webp)/i.test(mime)
    }, { quoted: m })

    await m.react('💐').catch(() => {})
  } catch (error) {
    console.error('[ERINE STICKER]', error?.stack || error)
    await m.react('❌').catch(() => {})
    throw `Gagal membuat sticker: ${error.message || error}`
  }
}

handler.help = ['s']
handler.tags = ['sticker']
handler.command = /^(s|sticker)$/i
handler.limit = true

export default handler
