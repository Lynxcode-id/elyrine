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

import axios from 'axios'
import { makeSticker } from '../../lib/sticker-maker.js'

const API = (global.APIs?.xrina || 'https://apiii-xrina.my.id') + '/maker/emojimix'

export const splitEmoji = text => {
  const raw = (text || '').trim()
  const parts = raw.split(/\s*\+\s*|\s+/).filter(Boolean)
  if (parts.length === 2) return parts
  const seg = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(raw)].map(s => s.segment)
  const emojis = seg.filter(s => /\p{Extended_Pictographic}/u.test(s))
  return emojis.length >= 2 ? [emojis[0], emojis[1]] : null
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const pair = splitEmoji(text)
  if (!pair) throw `Masukkan dua emoji.\nContoh: *${usedPrefix + command} 😂🥵*`

  await m.wait()
  const { data: buf, headers } = await axios.get(API, {
    params: { emoji1: pair[0], emoji2: pair[1] },
    responseType: 'arraybuffer', timeout: 60000, validateStatus: () => true
  })
  const image = Buffer.from(buf)
  const mime = String(headers?.['content-type'] || '').split(';')[0] || 'image/png'
  if (!image.length || !mime.startsWith('image/')) throw 'Kombinasi emoji ini belum tersedia.'

  const sticker = await makeSticker({ buffer: image, mimetype: mime })
  return conn.sendMessage(m.chat, { sticker }, { quoted: m })
}

handler.help = ['emojimix <emoji>+<emoji>']
handler.tags = ['sticker']
handler.command = /^(emojimix|emomix)$/i
handler.limit = true
handler.register = true

export default handler
