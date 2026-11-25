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

import { fetchMedia } from '../../lib/automedia.js'

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const names = (text || '').split('|').map(v => v.trim()).filter(Boolean).slice(0, 5).map(v => v.slice(0, 30))

  if (!names.length) throw `Contoh: *${usedPrefix + command} Lynx|Firman|Dinda|Farhan|Nov*\nNama 1-5 pemain.`

  await m.wait()

  const params = { template: 9, json: 0 }
  names.forEach((n, i) => { params[`name${i + 1}`] = n })

  let media
  try {
    media = await fetchMedia(`${global.APIs?.apicloud || 'https://api-cloud.my.id'}/maker/fakeffsquad`, params)
  } catch (e) {
    console.error('[fffive]', e.message)
    throw `Gagal membuat gambar (${e.message})`
  }

  await conn.sendFile(m.chat, media.buffer, `fffive.${media.ext}`, 'Squad 5 pemain', m)
}

handler.help = ['fffive <nama1>|<nama2>|<nama3>|<nama4>|<nama5>']
handler.tags = ['maker']
handler.command = /^(fffive)$/i
handler.register = true

export default handler
