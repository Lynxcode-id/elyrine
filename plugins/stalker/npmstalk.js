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
  const username = (text || '').trim().replace(/^~/, '')
  if (!/^[\w.-]{1,50}$/.test(username)) throw `Masukkan username npm.\nContoh: *${usedPrefix + command} sindresorhus*`

  await m.wait()
  const d = await haidarGet('/api/v1/stalker/npm', { username, limit: 10 })
  const p = d.profile || {}
  const list = (d.packages || []).slice(0, 10).map((x, i) => `${i + 1}. ${x.name} v${x.version}`)
  const caption = [
    '*NPM STALK*',
    '',
    `Username : ${d.username}`,
    `Email    : ${p.email || '-'}`,
    `Paket    : ${num(d.totalMatch)}`,
    '',
    '*Paket terbaru*',
    ...list
  ].join('\n')

  await sendCard(conn, m, {
    url: p.npmUrl || `https://www.npmjs.com/~${d.username}`,
    title: `${d.username} • npm`,
    description: `${num(d.totalMatch)} paket`,
    caption,
    images: p.avatar,
    fallbackTitle: 'npm',
    fallbackSub: `~${d.username}`
  })
}

handler.help = ['npmstalk <username>']
handler.tags = ['stalker']
handler.command = /^(npmstalk|stalknpm)$/i
handler.limit = true

export default handler
