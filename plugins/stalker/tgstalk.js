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

const API = (global.APIs?.xrina || 'https://apiii-xrina.my.id') + '/stalker/stalk-telegram'

export const formatTG = d => [
  '*TELEGRAM STALK*',
  '',
  `Username   : @${d.username || '-'}`,
  `Nama       : ${d.display_name || d.full_title || '-'}`,
  `Bio        : ${d.bio || '-'}`,
  `Label      : ${d.label || '-'}`,
  `Fake       : ${d.flags?.fake ? 'Ya' : 'Tidak'}`,
  `Scam       : ${d.flags?.scam ? 'Ya' : 'Tidak'}`,
  `Link       : ${d.source_url || '-'}`
].join('\n')

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const username = (text || '').trim().replace(/^@/, '')
  if (!/^[A-Za-z0-9_]{4,32}$/.test(username)) throw `Masukkan username Telegram.\nContoh: *${usedPrefix + command} lynxmanuelz4*`

  await m.wait()
  const { data: res } = await axios.get(API, { params: { username }, timeout: 30000, validateStatus: () => true })
  if (res?.status !== true || !res.data) throw 'Akun tidak ditemukan atau API sedang gangguan.'

  const d = res.data
  const caption = formatTG(d)
  if (d.avatar_url) {
    try {
      return await conn.sendMessage(m.chat, { image: { url: d.avatar_url }, caption }, { quoted: m })
    } catch (e) { console.error('[TGSTALK] avatar gagal:', e.message) }
  }
  return m.reply(caption)
}

handler.help = ['tgstalk <username>']
handler.tags = ['stalker']
handler.command = /^(tgstalk|stalktg)$/i
handler.owner = true

export default handler
