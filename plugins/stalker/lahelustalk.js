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
  const username = (text || '').trim().replace(/^@/, '')
  if (!/^[\w.-]{1,40}$/.test(username)) throw `Masukkan username Lahelu.\nContoh: *${usedPrefix + command} zenn*`

  await m.wait()
  const d = await haidarGet('/api/v1/stalker/lahelu', { username })
  const s = d.stats || {}
  const caption = [
    '*LAHELU STALK*',
    '',
    `Username  : ${d.username}`,
    `User ID   : ${d.userId || '-'}`,
    `Upvote    : ${num(s.upvotes)}`,
    `Downvote  : ${num(s.downvotes)}`,
    `Postingan : ${num(s.posts)}`,
    `Followers : ${num(s.followers)}`,
    `Following : ${num(s.following)}`,
    `Koin      : ${num(s.coins)}`,
    `Bergabung : ${d.createdAt ? new Date(d.createdAt).toLocaleDateString('id-ID', { timeZone: 'Asia/Makassar', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}`
  ].join('\n')

  await sendCard(conn, m, {
    url: d.profileUrl || `https://lahelu.com/user/${d.username}`,
    title: `${d.username} • Lahelu`,
    description: `${num(s.followers)} followers • ${num(s.posts)} post`,
    caption,
    images: d.avatar,
    fallbackTitle: 'Lahelu',
    fallbackSub: `@${d.username}`
  })
}

handler.help = ['lahelustalk <username>']
handler.tags = ['stalker']
handler.command = /^(lahelustalk|stalklahelu)$/i
handler.limit = true

export default handler
