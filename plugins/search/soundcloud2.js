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

import { haidarGet, sendCard } from '../../lib/haidar.js'

const dur = ms => {
  const t = (ms || 0) / 1000 | 0
  return `${t / 60 | 0}:${String(t % 60).padStart(2, '0')}`
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const q = (text || '').trim()
  if (!q) throw `Masukkan judul lagu / artis.\nContoh: *${usedPrefix + command} lo-fi beats*`

  await m.wait()
  const d = await haidarGet('/api/v1/search/soundcloud', { q })
  const list = (d.tracks || []).slice(0, 8)
  if (!list.length) throw `Lagu "${q}" tidak ditemukan.`

  const caption = [
    '*SOUNDCLOUD SEARCH*',
    '',
    `Query : ${d.q || q}`,
    '',
    ...list.map((x, i) => `*${i + 1}. ${x.title}*\n${x.artist || '-'} • ${dur(x.media?.transcodings?.[0]?.duration)}\n${x.url}`)
  ].join('\n\n')

  const first = list[0]
  await sendCard(conn, m, {
    url: first.url,
    title: first.title,
    description: `${first.artist || 'SoundCloud'} • SoundCloud`,
    caption,
    images: first.cover && [first.cover.replace('-t500x500', '-t500x500'), first.cover],
    fallbackTitle: 'SoundCloud',
    fallbackSub: first.artist
  })
}

handler.help = ['soundcloud2 <judul>']
handler.tags = ['search']
handler.command = /^(soundcloud2|sc2)$/i
handler.limit = true

export default handler
