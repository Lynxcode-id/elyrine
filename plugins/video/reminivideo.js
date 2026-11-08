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

import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'

const MAX_SIZE = 25 * 1024 * 1024
const MAX_DURATION = 60

const isVideo = x => x && /^video\//i.test(x.mimetype || (x.msg && x.msg.mimetype) || '') && typeof x.download === 'function'

const handler = async (m, { conn, usedPrefix, command, __dirname }) => {
  const target = [m, m.quoted].find(isVideo)
  if (!target) throw `Kirim atau reply video dengan caption *${usedPrefix + command}*\nMaksimal ${MAX_DURATION} detik / ${MAX_SIZE / 1024 / 1024}MB.`

  const file = join(__dirname, '..', 'scrape', 'reminivideo.js')
  if (!existsSync(file)) throw `Scrape *reminivideo* belum ada. Tambahkan dulu pakai ${usedPrefix}addscrape reminivideo`

  await m.wait()

  const buf = await target.download()
  if (!Buffer.isBuffer(buf) || !buf.length) throw 'Video gagal diunduh.'
  if (buf.length > MAX_SIZE) throw `Ukuran video terlalu besar (maks ${MAX_SIZE / 1024 / 1024}MB).`

  const dir = join(tmpdir(), 'reminivideo')
  mkdirSync(dir, { recursive: true })
  const input = join(dir, `in_${Date.now()}.mp4`)
  let output = null

  try {
    writeFileSync(input, buf)
    const { enhance } = await import(pathToFileURL(file).href + '?t=' + Date.now())
    const data = await enhance(input, { outDir: dir, maxDuration: MAX_DURATION })
    if (!data || !data.status) {
      console.error('[REMINIVIDEO]', data && data.error)
      throw `Gagal meningkatkan kualitas video.${data && data.error ? '\n' + data.error : ''}`
    }
    output = data.enhanced_video

    const caption = `*Remini Video HD*\n` +
      `Resolusi: ${data.original_resolution} → ${data.output_resolution}\n` +
      `Ukuran: ${data.original_size} → ${data.output_size}\n` +
      `Waktu proses: ${data.processing_time}`
    await conn.sendFile(m.chat, readFileSync(output), 'reminivideo.mp4', caption, m)
  } finally {
    for (const f of [input, output]) {
      try { if (f && existsSync(f)) unlinkSync(f) } catch {}
    }
  }
}

handler.help = ['reminivideo']
handler.tags = ['video']
handler.command = /^(reminivideo|hdvid)$/i
handler.limit = true
handler.register = true

export default handler
