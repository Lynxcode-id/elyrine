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

const API = (global.APIs?.xrina || 'https://apiii-xrina.my.id') + '/stalker/stalk-tiktok'

export const formatTikTok = d => [
  '*TIKTOK STALK*',
  '',
  `Username   : @${d.username || '-'}`,
  `Nama       : ${d.name || '-'}`,
  `Bio        : ${d.bio || '-'}`,
  `Followers  : ${d.followers ?? '-'}`,
  `Following  : ${d.following ?? '-'}`,
  `Likes      : ${d.likes ?? '-'}`,
  `Postingan  : ${d.posts ?? '-'}`,
  `Verified   : ${d.verified ? 'Ya' : 'Tidak'}`,
  `Private    : ${d.private ? 'Ya' : 'Tidak'}`
].join('\n')

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const username = (text || '').trim().replace(/^@/, '')
  if (!/^[A-Za-z0-9._]{1,24}$/.test(username)) throw `Masukkan username TikTok.\nContoh: *${usedPrefix + command} olineonlyy_*`

  await m.wait()
  const { data: res } = await axios.get(API, { params: { username }, timeout: 30000, validateStatus: () => true })
  if (res?.status !== true || !res.data) throw 'Akun tidak ditemukan atau API sedang gangguan.'

  const d = res.data
  const caption = formatTikTok(d)
  if (d.photo) {
    try {
      return await conn.sendMessage(m.chat, { image: { url: d.photo }, caption }, { quoted: m })
    } catch (e) { console.error('[TIKTOKSTALK] foto gagal:', e.message) }
  }
  return m.reply(caption)
}

handler.help = ['tiktokstalk <username>']
handler.tags = ['stalker']
handler.command = /^(tiktokstalk|stalktiktok)$/i
handler.owner = true

export default handler
