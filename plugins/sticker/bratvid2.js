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
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { addExif, getStickerWatermark } from '../../lib/sticker-maker.js'

const MAX_STICKER = 950 * 1024
const ATTEMPTS = [
  { fps: 24, quality: 80 },
  { fps: 20, quality: 65 },
  { fps: 16, quality: 50 },
  { fps: 12, quality: 40 }
]

const runFFmpeg = (args) => new Promise((resolve, reject) => {
  const proc = spawn(global.ffmpegPath || 'ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] })
  let stderr = ''
  proc.stderr.on('data', c => { stderr += c.toString() })
  proc.once('error', reject)
  proc.once('close', code => code === 0 ? resolve() : reject(new Error(stderr.trim() || `FFmpeg exit ${code}`)))
})

async function mp4ToWebp(mp4) {
  const dir = await mkdtemp(join(tmpdir(), 'bratvid2-stk-'))
  const input = join(dir, 'in.mp4')
  const output = join(dir, 'out.webp')
  try {
    await writeFile(input, mp4)
    let result
    for (const { fps, quality } of ATTEMPTS) {
      await runFFmpeg([
        '-hide_banner', '-loglevel', 'error', '-y',
        '-i', input,
        '-t', '00:00:10',
        '-an',
        '-vf', `fps=${fps},scale=512:512:flags=lanczos`,
        '-c:v', 'libwebp',
        '-lossless', '0',
        '-q:v', String(quality),
        '-compression_level', '6',
        '-loop', '0',
        '-vsync', '0',
        output
      ])
      result = await readFile(output)
      if (result.length <= MAX_STICKER) break
    }
    return result
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

const handler = async (m, { conn, text, command, usedPrefix, __dirname }) => {
  text = text || m.quoted?.text || m.quoted?.caption
  if (!text) throw `Masukkan teks atau balas pesan dengan perintah *${usedPrefix + command}*`

  const file = join(__dirname, '..', 'scrape', 'bratvid2.js')
  if (!existsSync(file)) throw `Scrape *bratvid2* belum ada. Tambahkan dulu pakai ${usedPrefix}addscrape bratvid2`

  await m.react('⚡').catch(() => {})

  try {
    const { default: bratvid2 } = await import(pathToFileURL(file).href + '?t=' + Date.now())
    const data = await bratvid2(text)
    if (!data?.status) throw new Error(data?.message || 'Gagal membuat video')

    const wm = getStickerWatermark()
    const sticker = await addExif(await mp4ToWebp(data.buffer), wm.packName, wm.publisher)

    await conn.sendMessage(m.chat, { sticker, isAiSticker: true }, { quoted: m })
    await m.react('✅').catch(() => {})
  } catch (error) {
    console.error('[ERINE BRATVID2]', error?.stack || error)
    await m.react('❌').catch(() => {})
    throw `Gagal memproses brat video 2: ${error.message || error}`
  }
}

handler.help = ['bratvid2 <teks>']
handler.tags = ['sticker']
handler.command = /^(bratvid2)$/i
handler.limit = true
handler.register = true

export default handler
