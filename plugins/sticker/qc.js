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

const API = 'https://brat.siputzx.my.id/quoted'
const DEFAULT_PP = 'https://files.catbox.moe/nwvkbt.png'
const MAX_TEXT = 80

export const COLORS = {
  pink: '#f68ac9', blue: '#6cace4', red: '#f44336', green: '#4caf50', yellow: '#ffeb3b',
  purple: '#9c27b0', darkblue: '#0d47a1', lightblue: '#03a9f4', ash: '#9e9e9e', orange: '#ff9800',
  black: '#000000', white: '#ffffff', teal: '#008080', lightpink: '#FFC0CB', chocolate: '#A52A2A',
  salmon: '#FFA07A', magenta: '#FF00FF', tan: '#D2B48C', wheat: '#F5DEB3', deeppink: '#FF1493',
  fire: '#B22222', skyblue: '#00BFFF', brightskyblue: '#1E90FF', hotpink: '#FF69B4',
  lightskyblue: '#87CEEB', seagreen: '#20B2AA', darkred: '#8B0000', orangered: '#FF4500',
  cyan: '#48D1CC', violet: '#BA55D3', mossgreen: '#00FF7F', darkgreen: '#008000', navyblue: '#191970',
  darkorange: '#FF8C00', darkpurple: '#9400D3', fuchsia: '#FF00FF', darkmagenta: '#8B008B',
  darkgray: '#2F4F4F', peachpuff: '#FFDAB9', darkishgreen: '#BDB76B', darkishred: '#DC143C',
  goldenrod: '#DAA520', darkishgray: '#696969', darkishpurple: '#483D8B', gold: '#FFD700', silver: '#C0C0C0'
}

export function toImageBuffer(data) {
  const buf = Buffer.from(data)
  const isImg = buf.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) || buf.slice(0, 4).toString('ascii') === 'RIFF' || buf.slice(0, 2).equals(Buffer.from([0xff, 0xd8]))
  if (isImg) return buf
  const decoded = Buffer.from(buf.toString('utf8'), 'base64')
  return decoded.length ? decoded : null
}

async function profilePic(conn, jid) {
  try { return await conn.profilePictureUrl(jid, 'image') } catch { return DEFAULT_PP }
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const args = (text || '').trim().split(/\s+/).filter(Boolean)
  const colorList = Object.keys(COLORS).join(', ')
  if (!args.length) {
    throw `Format: *${usedPrefix + command} <warna> <teks>*\nContoh: *${usedPrefix + command} pink Hai semuanya!*\nAtau balas pesan lalu ketik *${usedPrefix + command} <warna>*\n\nWarna: ${colorList}`
  }

  const color = args[0].toLowerCase()
  const bg = COLORS[color]
  if (!bg) throw `Warna *${color}* tidak ada.\n\nPilihan: ${colorList}`

  let message = args.slice(1).join(' ')
  if (!message && m.quoted) message = m.quoted.text || m.quoted.body || ''
  if (!message) throw 'Masukkan teks untuk quote.'
  if (message.length > MAX_TEXT) throw `Maksimal ${MAX_TEXT} karakter (sekarang ${message.length}).`

  await m.wait()
  const avatar = await profilePic(conn, m.sender)
  const payload = {
    messages: [{
      from: { id: Math.floor(Math.random() * 10), first_name: m.pushName || 'User', last_name: '', name: '', photo: { url: avatar } },
      text: message,
      entities: [],
      avatar: true,
      media: { url: '' },
      mediaType: '',
      replyMessage: { name: '', text: '', entities: [], chatId: Math.floor(Math.random() * 10) }
    }],
    backgroundColor: bg,
    width: 512, height: 512, scale: 2,
    type: 'quote', format: 'png', emojiStyle: 'apple'
  }

  const { data } = await axios.post(API, payload, { timeout: 60000, responseType: 'arraybuffer' })
  const image = toImageBuffer(data)
  if (!image) throw 'Gagal membuat quote, coba lagi nanti.'

  const sticker = await makeSticker({ buffer: image, mimetype: 'image/png' })
  return conn.sendMessage(m.chat, { sticker }, { quoted: m })
}

handler.help = ['qc <warna> <teks>']
handler.tags = ['sticker']
handler.command = /^(qc)$/i
handler.limit = true
handler.register = true

export default handler
