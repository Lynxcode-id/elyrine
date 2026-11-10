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

const API = (global.APIs?.xrina || 'https://apiii-xrina.my.id') + '/stalker/stalk-yt'

export const formatYT = d => [
  '*YOUTUBE STALK*',
  '',
  `Channel    : ${d.title || '-'}`,
  `Handle     : ${d.username || '-'}`,
  `Subscriber : ${d.subscribers ?? '-'}`,
  `Video      : ${d.videos ?? '-'}`,
  `Deskripsi  : ${d.description || '-'}`,
  `Link       : ${d.channel_url || '-'}`
].join('\n')

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const username = (text || '').trim()
  if (!username) throw `Masukkan handle YouTube.\nContoh: *${usedPrefix + command} @lynxdecode*`

  await m.wait()
  const { data: res } = await axios.get(API, {
    params: { username: username.startsWith('@') ? username : '@' + username },
    timeout: 30000, validateStatus: () => true
  })
  if (res?.status !== true || !res.data) throw 'Channel tidak ditemukan atau API sedang gangguan.'

  const d = res.data
  const caption = formatYT(d)
  if (d.avatar) {
    try {
      return await conn.sendMessage(m.chat, { image: { url: d.avatar }, caption }, { quoted: m })
    } catch (e) { console.error('[YTSTALK] avatar gagal:', e.message) }
  }
  return m.reply(caption)
}

handler.help = ['ytstalk <handle>']
handler.tags = ['stalker']
handler.command = /^(ytstalk|stalkyt)$/i
handler.owner = true

export default handler
