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

const API = (global.APIs?.xrina || 'https://apiii-xrina.my.id') + '/stalker/stalk-ig'

export const formatIG = d => [
  '*INSTAGRAM STALK*',
  '',
  `Username   : @${d.username || '-'}`,
  `Nama       : ${d.full_name || '-'}`,
  `Private    : ${d.is_private ? 'Ya' : 'Tidak'}`,
  `Verified   : ${d.is_verified ? 'Ya' : 'Tidak'}`,
  `Followers  : ${d.followers ?? '-'}`,
  `Following  : ${d.following ?? '-'}`,
  `Postingan  : ${d.posts_count ?? '-'}`,
  `Bio        : ${d.biography || '-'}`,
  `Link       : ${d.external_url || '-'}`
].join('\n')

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const username = (text || '').trim().replace(/^@/, '')
  if (!/^[A-Za-z0-9._]{1,30}$/.test(username)) throw `Masukkan username Instagram.\nContoh: *${usedPrefix + command} lynxdecode*`

  await m.wait()
  const { data: res } = await axios.get(API, { params: { username }, timeout: 30000, validateStatus: () => true })
  if (res?.status !== true || !res.data) throw 'Akun tidak ditemukan atau API sedang gangguan.'

  const d = res.data
  const caption = formatIG(d)
  if (d.profile_pic_url) {
    try {
      return await conn.sendMessage(m.chat, { image: { url: d.profile_pic_url }, caption }, { quoted: m })
    } catch (e) { console.error('[IGSTALK] foto gagal:', e.message) }
  }
  return m.reply(caption)
}

handler.help = ['igstalk <username>']
handler.tags = ['stalker']
handler.command = /^(igstalk|stalkig)$/i
handler.owner = true

export default handler
