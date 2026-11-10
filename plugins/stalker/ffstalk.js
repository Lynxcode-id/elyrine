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

const API = (global.APIs?.xrina || 'https://apiii-xrina.my.id') + '/stalker/stalk-ff'

export const formatFF = d => {
  const g = d.guild || {}
  const p = d.pet || {}
  return [
    '*FREE FIRE STALK*',
    '',
    `Nickname   : ${d.nickname || '-'}`,
    `UID        : ${d.uid || '-'}`,
    `Region     : ${d.region || '-'}`,
    `Level      : ${d.level ?? '-'}`,
    `Rank       : ${d.rank ?? '-'} (${d.rankingPoints ?? 0} poin)`,
    `CS Rank    : ${d.csRank ?? '-'}`,
    `Likes      : ${d.liked ?? '-'}`,
    `Guild      : ${g.guildName || '-'} (${g.memberNum ?? 0}/${g.capacity ?? 0})`,
    `Pet        : ${p.name || '-'} · ${p.speciesName || '-'} Lv ${p.level ?? '-'}`,
    `Status     : ${d.ban?.status || '-'}`,
    `Bio        : ${d.social?.signature || '-'}`,
    `Login      : ${d.lastLoginAt ? d.lastLoginAt.slice(0, 10) : '-'}`
  ].join('\n')
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const uid = (text || '').replace(/\D/g, '')
  if (!/^\d{5,15}$/.test(uid)) throw `Masukkan UID Free Fire yang valid.\nContoh: *${usedPrefix + command} 3238006990*`

  await m.wait()
  const { data: res } = await axios.get(API, { params: { uid }, timeout: 30000, validateStatus: () => true })
  if (res?.status !== true || !res.data) throw 'Akun tidak ditemukan atau API sedang gangguan.'

  const d = res.data
  const caption = formatFF(d)
  if (d.avatarUrl) {
    try {
      return await conn.sendMessage(m.chat, { image: { url: d.avatarUrl }, caption }, { quoted: m })
    } catch (e) { console.error('[FFSTALK] avatar gagal:', e.message) }
  }
  return m.reply(caption)
}

handler.help = ['ffstalk <uid>']
handler.tags = ['stalker']
handler.command = /^(ffstalk|stalkff)$/i
handler.owner = true

export default handler
