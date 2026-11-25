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

import { haidarGet, downloadBuffer, sendCard } from '../../lib/haidar.js'

const MAX = 6

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const q = (text || '').trim()
  if (!q) throw `Masukkan kata kunci.\nContoh: *${usedPrefix + command} anime*`

  await m.wait()
  const d = await haidarGet('/api/v1/search/pixiv', { query: q, page: 1, limit: MAX })
  const list = (d.result || []).slice(0, MAX)
  if (!list.length) throw `Gambar "${q}" tidak ditemukan.`

  const caption = [
    '*PIXIV SEARCH*',
    '',
    `Query : ${d.query || q}`,
    '',
    ...list.map((x, i) => `*${i + 1}. ${x.title}*\n${x.author} • ${x.page_count} hal\n${x.url}`)
  ].join('\n\n')

  const items = (await Promise.all(list.map(x =>
    downloadBuffer(x.image, 25 * 1024 * 1024).then(image => ({ image })).catch(e => { console.error('[PIXIV] gagal:', e.message); return null })
  ))).filter(Boolean)

  if (items.length > 1) {
    items[0].caption = caption
    try {
      const r = await conn.sendAlbum(m.chat, items, { quoted: m })
      if (r?.sent) return
    } catch (e) { console.error('[PIXIV] album error:', e.message) }
  }

  await sendCard(conn, m, {
    url: list[0].url,
    title: list[0].title,
    description: list[0].author,
    caption,
    images: list[0].image,
    fallbackTitle: 'Pixiv',
    fallbackSub: list[0].author
  })
}

handler.help = ['pixiv <kata kunci>']
handler.tags = ['search']
handler.command = /^(pixiv|pixivs)$/i
handler.limit = true

export default handler
