/*
  ERINE-AI • ELYRINE
  WhatsApp Bot Multi-Device · Node.js ESM

  Developer   Arman Maulana (Lynx decode)
  Versi       1.0.0
  Lisensi     ELYRINE Source-Available Non-Commercial v1.0
  Copyright   © 2026 Arman Maulana

  Didirikan di atas Elyra Labs & ekosistemnya.
  Komunitas   General District (induk) · INF Project · Elyra Labs
  Engine      elyra-baileys, fork Baileys yang dikustom
              sesuai kebutuhan bot ini.

  Dilarang menjual, menyewakan, atau merebrand tanpa
  izin tertulis dari developer. Jangan hapus kredit ini.
*/

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const handler = async (m, { conn, __dirname, usedPrefix }) => {
  const file = join(__dirname, '..', 'scrape', 'remini.js')
  if (!existsSync(file)) throw `Scrape *remini* belum ada. Tambahkan dulu pakai ${usedPrefix}addscrape remini`

  const target = [m, m.quoted].find(x => /^image\//i.test(x?.mimetype || x?.msg?.mimetype || '') && typeof x?.download === 'function')
  if (!target) throw 'Kirim atau reply foto dengan perintah ini.'

  await m.wait()

  try {
    const buf = await target.download()
    if (!Buffer.isBuffer(buf) || !buf.length) throw new Error('Foto gagal diunduh.')

    const { default: remini } = await import(pathToFileURL(file).href + '?t=' + Date.now())
    const data = await remini(buf)
    if (!data?.status) throw new Error(data?.message || 'Gagal memperbaiki foto.')

    const caption = [
      '✨ *Remini — Foto Diperbaiki*',
      `• Resolusi: ${data.original_resolution} → ${data.output_resolution}`,
      `• Ukuran: ${data.original_size} → ${data.output_size}`,
      `• Engine: ${data.engine}`,
      `• Waktu: ${data.processing_time}`
    ].join('\n')

    await conn.sendFile(m.chat, data.buffer, 'remini.jpg', caption, m)
  } catch (e) {
    console.error('[REMINI]', (e && e.stack) || e)
    throw `Gagal memproses remini: ${(e && e.message) || e}`
  }
}

handler.help = ['remini']
handler.tags = ['image']
handler.command = /^(remini)$/i
handler.limit = true
handler.register = true

export default handler
