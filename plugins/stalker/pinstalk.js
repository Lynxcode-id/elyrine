/*
  ERINE-AI • ELYRINE
  WhatsApp Bot Multi-Device · Node.js ESM

  Developer   Arman Maulana (Lynx decode)
  Versi       1.0.0
  Lisensi     ELYRINE Source-Available Non-Commercial v1.0
  Copyright   © 2026 Arman Maulana

  Didirikan di atas Elyra Labs & ekosistemnya.
  Komunitas   General District (induk) · INF Project · Elyra Labs
  Engine      elyrine-baileys, fork Baileys yang dikustom
              sesuai kebutuhan bot ini.

  Dilarang menjual, menyewakan, atau merebrand tanpa
  izin tertulis dari developer. Jangan hapus kredit ini.
*/

import { haidarGet, sendCard, num } from '../../lib/haidar.js'

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const username = (text || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?pinterest\.[a-z.]+\//i, '').replace(/\/.*$/, '')
  if (!/^[\w.-]{1,40}$/.test(username)) throw `Masukkan username Pinterest.\nContoh: *${usedPrefix + command} mkmynend0401*`

  await m.wait()
  const d = await haidarGet('/api/v1/stalker/pinterest', { username, pages: 1 })
  const u = d.user_profile || {}
  const pins = (d.pins || []).slice(0, 3).map((x, i) => `${i + 1}. ${x.url}`)
  const caption = [
    '*PINTEREST STALK*',
    '',
    `Username  : ${u.username || username}`,
    `Nama      : ${u.full_name || '-'}`,
    `Followers : ${num(u.follower_count)}`,
    `Following : ${num(u.following_count)}`,
    `Total pin : ${num(d.total_pins)}`,
    `Bio       : ${u.about || '-'}`,
    ...(pins.length ? ['', '*Pin terbaru*', ...pins] : [])
  ].join('\n')

  const img = u.profile_image
  await sendCard(conn, m, {
    url: `https://www.pinterest.com/${u.username || username}/`,
    title: `${u.full_name || u.username || username} • Pinterest`,
    description: `${num(u.follower_count)} followers • ${num(d.total_pins)} pin`,
    caption,
    images: [img && img.replace(/\/\d+x\d+_RS\//, '/736x/'), img && img.replace(/\/\d+x\d+_RS\//, '/originals/'), img],
    fallbackTitle: 'Pinterest',
    fallbackSub: `@${u.username || username}`
  })
}

handler.help = ['pinstalk <username>']
handler.tags = ['stalker']
handler.command = /^(pinstalk|stalkpin|pinterestalk|stalkpinterest)$/i
handler.limit = true

export default handler
