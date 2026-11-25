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
  const handle = (text || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?youtube\.com\/@?/i, '').replace(/\/.*$/, '')
  if (!/^[\w.-]{1,60}$/.test(handle)) throw `Masukkan handle YouTube.\nContoh: *${usedPrefix + command} mrbeast*`

  await m.wait()
  const d = await haidarGet('/api/v1/stalker/youtube', { handle, videos: true })
  const c = d.channel || {}
  const s = d.stats || {}
  const vids = (d.videos || []).slice(0, 5).map((v, i) => `${i + 1}. ${v.title}\n   ${v.views} • ${v.published} • ${v.duration}\n   ${v.url}`)
  const caption = [
    '*YOUTUBE STALK*',
    '',
    `Channel    : ${c.name || '-'}`,
    `Handle     : ${c.handle || '-'}`,
    `Subscriber : ${s.subscribersFmt || num(s.subscribers)}`,
    `Total view : ${num(s.totalChannelViews)}`,
    `Negara     : ${c.country || '-'}`,
    `Bergabung  : ${(c.joinedDate || '-').replace(/^Joined\s*/i, '')}`,
    `Rata² view : ${num(d.recentFeedAnalytics?.avgViews)}`,
    '',
    '*Video terbaru*',
    ...vids
  ].join('\n')

  await sendCard(conn, m, {
    url: (c.canonicalUrl || `https://www.youtube.com/@${handle}`).replace(/^http:/, 'https:'),
    title: `${c.name || handle} • YouTube`,
    description: `${s.subscribersFmt || num(s.subscribers)}`,
    caption,
    images: c.avatar,
    fallbackTitle: c.name || 'YouTube',
    fallbackSub: c.handle || `@${handle}`
  })
}

handler.help = ['ytstalk2 <handle>']
handler.tags = ['stalker']
handler.command = /^(ytstalk2|stalkyt2)$/i
handler.limit = true

export default handler
