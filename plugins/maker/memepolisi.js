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

const API = (global.APIs?.xrina || 'https://apiii-xrina.my.id') + '/canvas/meme-polisi'
const TIMEOUT_MS = 120000
const MAX_USERNAME = 40
const MAX_TEXT = 200

const isImageBuffer = b =>
  b?.length > 12 && (
    (b[0] === 0xff && b[1] === 0xd8) ||
    b.slice(1, 4).toString() === 'PNG' ||
    (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP')
  )

const parseInput = text => {
  const [username, body] = (text || '').split('|').map(s => s?.trim())
  return username && body ? [username, body] : null
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const input = parseInput(text)
  if (!input) throw `*Contoh:* ${usedPrefix || '.'}${command} alaj|jembod`
  const [username, body] = input
  if (username.length > MAX_USERNAME) throw `Username maksimal ${MAX_USERNAME} karakter.`
  if (body.length > MAX_TEXT) throw `Teks maksimal ${MAX_TEXT} karakter.`

  await m.react('⏳').catch(() => { })

  try {
    const qs = new URLSearchParams({ username, text: body })
    const { data } = await axios.get(`${API}?${qs.toString()}`, {
      responseType: 'arraybuffer',
      timeout: TIMEOUT_MS
    })

    const image = Buffer.from(data)
    if (!isImageBuffer(image)) throw new Error('API tidak mengembalikan gambar.')

    await conn.sendMessage(m.chat, { image }, { quoted: m })
    await m.react('✅').catch(() => { })
  } catch (e) {
    console.error('[MEME-POLISI]', e)
    await m.react('❌').catch(() => { })
    return m.gagal(`Gagal membuat meme: ${e.response?.data?.message || e.message}`, 'Meme Polisi')
  }
}

handler.command = ['memepolisi']
handler.help = ['memepolisi <username>|<teks>']
handler.tags = ['maker']
handler.wait = true
handler.limit = true
handler.register = true

export default handler
