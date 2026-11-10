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
import sharp from 'sharp'
import uploadImage from '../../lib/uploader.js'

const API = (global.APIs?.xrina || 'https://apiii-xrina.my.id') + '/canvas/ttdm'
const MAX_USER = 40
const MAX_TEXT = 120
const MAX_SIDE = 1024

export async function centerSquare(buffer) {
  const img = sharp(buffer).rotate()
  const { width, height } = await img.metadata()
  const side = Math.min(width, height)
  const left = Math.floor((width - side) / 2)
  const top = Math.floor((height - side) / 2)
  return sharp(buffer)
    .rotate()
    .extract({ left, top, width: side, height: side })
    .resize(Math.min(side, MAX_SIDE), Math.min(side, MAX_SIDE))
    .jpeg({ quality: 92 })
    .toBuffer()
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const [username, ...rest] = (text || '').split('|')
  const name = (username || '').trim()
  const body = rest.join('|').trim()
  if (!name || !body) throw `Balas foto lalu ketik:\n*${usedPrefix + command} username|teks*\nContoh: *${usedPrefix + command} peler jembot|meh ku tetod*`
  if (name.length > MAX_USER) throw `Username maksimal ${MAX_USER} karakter.`
  if (body.length > MAX_TEXT) throw `Teks maksimal ${MAX_TEXT} karakter.`

  const isImage = !!m.quoted?.mediaMessage?.imageMessage
  if (!isImage) throw 'Balas (reply) sebuah foto dulu.'

  await m.wait()
  const original = await m.quoted.download()
  if (!Buffer.isBuffer(original) || !original.length) throw 'Foto gagal diunduh, coba kirim ulang.'

  const square = await centerSquare(original)
  const url = await uploadImage(square)
  if (!url) throw 'Upload foto gagal.'

  const { data, headers } = await axios.get(API, {
    params: { url, username: name, text: body },
    responseType: 'arraybuffer', timeout: 120000, validateStatus: () => true
  })
  const image = Buffer.from(data)
  const mime = String(headers?.['content-type'] || '')
  if (!image.length || !mime.startsWith('image/')) throw 'API tidak mengembalikan gambar.'

  return conn.sendMessage(m.chat, { image }, { quoted: m })
}

handler.help = ['ttdm <username>|<teks> (balas foto)']
handler.tags = ['maker']
handler.command = /^(ttdm)$/i
handler.wait = true
handler.limit = true
handler.register = true

export default handler
