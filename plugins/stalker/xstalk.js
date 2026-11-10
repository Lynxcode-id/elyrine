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

const API = (global.APIs?.xrina || 'https://apiii-xrina.my.id') + '/stalker/stalk-x'

export const formatX = d => [
  '*X (TWITTER) STALK*',
  '',
  `Username   : @${d.username || '-'}`,
  `Nama       : ${d.name || '-'}`,
  `Bio        : ${d.description || '-'}`,
  `Followers  : ${d.followers ?? '-'}`,
  `Following  : ${d.following ?? '-'}`,
  `Postingan  : ${d.posts ?? '-'}`,
  `Bergabung  : ${d.joined || '-'}`,
  `Link       : ${d.profile_url || '-'}`
].join('\n')

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const username = (text || '').trim().replace(/^@/, '')
  if (!/^[A-Za-z0-9_]{1,15}$/.test(username)) throw `Masukkan username X.\nContoh: *${usedPrefix + command} erine*`

  await m.wait()
  const { data: res } = await axios.get(API, { params: { username }, timeout: 30000, validateStatus: () => true })
  if (res?.status !== true || !res.data) throw 'Akun tidak ditemukan atau API sedang gangguan.'

  const d = res.data
  const caption = formatX(d)
  const pic = d.avatar_hd || d.avatar
  if (pic) {
    try {
      return await conn.sendMessage(m.chat, { image: { url: pic }, caption }, { quoted: m })
    } catch (e) { console.error('[XSTALK] avatar gagal:', e.message) }
  }
  return m.reply(caption)
}

handler.help = ['xstalk <username>']
handler.tags = ['stalker']
handler.command = /^(xstalk|stalkx)$/i
handler.owner = true

export default handler
