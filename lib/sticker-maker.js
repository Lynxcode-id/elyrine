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

import sharp from 'sharp'
import webp from 'node-webpmux'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { tmpdir } from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'

const PACK_NAME = () => global.stickpack || 'ERINE-AI • ELYRINE'
const PUBLISHER = () => global.stickauth || 'lynx decode, whatsapp bot baileys'

function exifBuffer(packName = PACK_NAME(), publisher = PUBLISHER()) {
  const meta = {
    'sticker-pack-id': `erine-ai-${Date.now()}`,
    'sticker-pack-name': packName,
    'sticker-pack-publisher': publisher,
    emojis: ['✨']
  }
  const payload = Buffer.from(JSON.stringify(meta), 'utf8')

  const header = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ])

  const exif = Buffer.concat([header, payload])
  exif.writeUIntLE(payload.length, 14, 4)
  return exif
}

async function runFFmpeg(input, output) {
  const args = [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', input,
    '-t', '00:00:10',
    '-an',
    '-vf', 'fps=20,scale=512:512:force_original_aspect_ratio=decrease:flags=lanczos,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=yuva420p',
    '-c:v', 'libwebp',
    '-lossless', '0',
    '-q:v', '90',
    '-compression_level', '6',
    '-loop', '0',
    '-vsync', '0',
    output
  ]

  await new Promise((resolve, reject) => {
    const proc = spawn(global.ffmpegPath || 'ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let stderr = ''
    proc.stderr.on('data', chunk => { stderr += chunk.toString() })
    proc.once('error', reject)
    proc.once('close', code => {
      if (code === 0) return resolve()
      reject(new Error(stderr.trim() || `FFmpeg exited with code ${code}`))
    })
  })
}

export async function addExif(webpBuffer, packName = PACK_NAME(), publisher = PUBLISHER()) {
  const image = new webp.Image()
  await image.load(webpBuffer)
  image.exif = exifBuffer(packName, publisher)
  return image.save(null)
}

async function imageToWebp(buffer, animated) {
  return sharp(buffer, { animated, limitInputPixels: false })
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, effort: 4, loop: 0 })
    .toBuffer()
}

export async function makeSticker({ buffer, mimetype, packName = PACK_NAME(), publisher = PUBLISHER() }) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) {
    throw new TypeError('Media tidak ditemukan atau file kosong.')
  }

  const mime = String(mimetype || '').toLowerCase()

  if (mime.startsWith('video/')) {
    const id = randomBytes(8).toString('hex')
    const input = path.join(tmpdir(), `erine-sticker-${id}.mp4`)
    const output = path.join(tmpdir(), `erine-sticker-${id}.webp`)

    try {
      await fs.writeFile(input, buffer)
      await runFFmpeg(input, output)
      const animatedWebp = await fs.readFile(output)
      return await addExif(animatedWebp, packName, publisher)
    } finally {
      await Promise.all([input, output].map(file => fs.unlink(file).catch(() => {})))
    }
  }

  if (mime === 'image/webp') {
    return addExif(buffer, packName, publisher)
  }

  if (mime.startsWith('image/')) {
    const converted = await imageToWebp(buffer, mime === 'image/gif')
    return addExif(converted, packName, publisher)
  }

  throw new Error('Format tidak didukung. Gunakan foto, video, atau sticker WebP.')
}

export function getStickerWatermark() {
  return { packName: PACK_NAME(), publisher: PUBLISHER() }
}