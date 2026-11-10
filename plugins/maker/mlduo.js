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
import { readAlbumMessage } from '../../lib/album.js'
import uploadImage from '../../lib/uploader.js'

const API = (global.APIs?.xrina || 'https://apiii-xrina.my.id') + '/canvas/mlduo'
const TIMEOUT_MS = 120000
const MAX_NAME = 40
const DEBUG = true

const isImageBuffer = b =>
  b?.length > 12 && (
    (b[0] === 0xff && b[1] === 0xd8) ||
    b.slice(1, 4).toString() === 'PNG' ||
    (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP')
  )

const parseNames = text => {
  const [a, b] = (text || '').split('|').map(s => s?.trim())
  return a && b ? [a, b] : null
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const names = parseNames(text)
  if (!names) throw `*Contoh:* ${usedPrefix || '.'}${command} lynx|dinda\n\nBalas album 2 foto dulu, lalu kirim perintah ini.`
  if (names.some(n => n.length > MAX_NAME)) throw `Nama maksimal ${MAX_NAME} karakter.`

  const album = await readAlbumMessage(m, { type: 'image' })
  console.log('[MLDUO]', album.found ? 'album ok' : 'album gagal', album.dbg || '(album.js lama — belum diganti!)')
  if (!album.found) {
    const tag = DEBUG ? `\n\n_dbg: ${album.dbg || 'album.js LAMA'} | ${album.reason}_` : ''
    throw (album.reason === 'no-quote'
      ? 'Balas (reply) album 2 foto dulu, baru kirim perintahnya.'
      : 'Album-nya belum kebaca (mungkin sudah kedaluwarsa / dikirim sebelum bot restart). Kirim ulang album 2 foto, lalu reply lagi.') + tag
  }
  if (!album.images.length) throw 'Album yang di-reply tidak berisi foto.'
  if (album.images.length < 2) {
    throw album.expected > album.images.length || album.failed
      ? `Baru kebaca ${album.images.length} dari ${album.expected} foto. Tunggu sebentar sampai album selesai terkirim, lalu reply lagi.`
      : 'Perlu album berisi 2 foto (yang di-reply cuma 1 foto).'
  }

  await m.react('⏳').catch(() => { })

  try {
    const [img1, img2] = album.images
    const [pp1, pp2] = await Promise.all([uploadImage(img1), uploadImage(img2)])
    if (!pp1 || !pp2) throw new Error('Upload foto gagal.')

    const qs = new URLSearchParams({ name1: names[0], name2: names[1], pp1, pp2 })
    const { data } = await axios.get(`${API}?${qs.toString()}`, {
      responseType: 'arraybuffer',
      timeout: TIMEOUT_MS
    })

    const image = Buffer.from(data)
    if (!isImageBuffer(image)) throw new Error('API tidak mengembalikan gambar.')

    await conn.sendMessage(m.chat, { image }, { quoted: m })
    await m.react('✅').catch(() => { })
  } catch (e) {
    console.error('[MLDUO]', e)
    await m.react('❌').catch(() => { })
    return m.gagal(`Gagal membuat gambar: ${e.response?.data?.message || e.message}`, 'MLDUO')
  }
}

handler.command = ['mlduo']
handler.help = ['mlduo <nama1>|<nama2> (balas album 2 foto)']
handler.tags = ['maker']
handler.wait = true
handler.limit = true
handler.register = true

export default handler
