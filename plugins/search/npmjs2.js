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

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const q = (text || '').trim()
  if (!q) throw `Masukkan nama paket npm.\nContoh: *${usedPrefix + command} elyrine-baileys*`

  await m.wait()
  const d = await haidarGet('/api/v1/search/npmjs', { query: q, limit: 5 })
  const list = d.results || []
  if (!list.length) throw `Paket "${q}" tidak ditemukan.`

  const caption = [
    '*NPM SEARCH*',
    '',
    `Query : ${d.query || q}`,
    `Total : ${Number(d.total || list.length).toLocaleString('id-ID')}`,
    '',
    ...list.map((x, i) => `*${i + 1}. ${x.name}* v${x.version}\n${x.author || '-'}\n${String(x.description || '-').slice(0, 140)}\nhttps://www.npmjs.com/package/${x.name}`)
  ].join('\n\n')

  const first = list[0]
  await sendCard(conn, m, {
    url: `https://www.npmjs.com/package/${first.name}`,
    title: `${first.name} v${first.version}`,
    description: String(first.description || 'npm').slice(0, 100),
    caption,
    fallbackTitle: 'npm',
    fallbackSub: first.name
  })
}

handler.help = ['npmjs2 <paket>']
handler.tags = ['search']
handler.command = /^(npmjs2|npmcari|npmfind2)$/i
handler.limit = true

export default handler
