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

const handler = async (m, { conn, usedPrefix, command }) => {
  const q = m.quoted
  const target = [m, q].find(x => /^image\//i.test(x?.mimetype || x?.msg?.mimetype || '') && typeof x?.download === 'function')
  if (!target) throw `Kirim atau reply foto dengan caption *${usedPrefix + command}*`

  await m.wait()

  const buf = await target.download()
  if (!Buffer.isBuffer(buf) || !buf.length) throw 'Gagal mengunduh foto.'

  const { default: uploadImage } = await import('../../lib/uploader.js')
  const url = await uploadImage(buf).catch(() => null)
  if (!/^https?:\/\//i.test(url || '')) throw 'Gagal mengunggah foto, coba lagi.'

  let media
  try {
    media = await fetchMedia(`${global.APIs?.apicloud || 'https://api-cloud.my.id'}/tools/removebg`, { url })
  } catch (e) {
    console.error('[removebg2]', e.message)
    throw `Remove background gagal (${e.message})`
  }

  await conn.sendFile(m.chat, media.buffer, `removebg.${media.ext}`, '', m)
}

handler.help = ['removebg2']
handler.tags = ['image']
handler.command = /^(removebg2)$/i
handler.register = true

export default handler
