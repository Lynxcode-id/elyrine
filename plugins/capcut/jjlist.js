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

import { haidarGet } from '../../lib/haidar.js'

const handler = async (m, { text, usedPrefix }) => {
  const q = (text || '').trim()
  await m.wait()
  const d = await haidarGet('/api/v1/capcut/jj-list', q ? { query: q } : {})
  const list = d.templates || []
  if (!list.length) throw q ? `Template "${q}" tidak ditemukan.` : 'Belum ada template.'

  await m.reply([
    '*CAPCUT JEDAG JEDUG*',
    '',
    `Total : ${d.total ?? list.length}`,
    '',
    ...list.map(x => `*${x.no}. ${x.title}*\nResolusi : ${x.resolusi || '-'}\nFoto     : ${x.mediaCount ?? '-'}\nID       : ${x.id}`),
    '',
    `Buat video: reply/kirim foto lalu *${usedPrefix}jjmake <no/id/judul>*`
  ].join('\n\n'))
}

handler.help = ['jjlist [kata kunci]']
handler.tags = ['capcut']
handler.command = /^(jjlist|jjtemplate)$/i
handler.limit = true

export default handler
