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

import fs from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import ffmpegFluent from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { createCanvas } from '@napi-rs/canvas'
import { makeSticker } from '../../lib/sticker-maker.js'

ffmpegFluent.setFfmpegPath(global.ffmpegPath || ffmpegInstaller.path)

const SIZE = 512
const FPS = 8
const DURATION = 4

export function drawMemeText(ctx, text, x, y, width, isBottom) {
  if (!text) return
  ctx.fillStyle = 'white'
  ctx.strokeStyle = 'black'
  ctx.textAlign = 'center'
  ctx.textBaseline = isBottom ? 'bottom' : 'top'
  ctx.lineJoin = 'round'
  let fontSize = Math.floor(width / 8)
  ctx.font = `bold ${fontSize}px Impact, Arial`
  while (ctx.measureText(text).width > width - 20 && fontSize > 10) {
    fontSize -= 2
    ctx.font = `bold ${fontSize}px Impact, Arial`
  }
  ctx.lineWidth = Math.floor(fontSize / 6)
  ctx.strokeText(text, x, y)
  ctx.fillText(text, x, y)
}

const run = (cmd) => new Promise((resolve, reject) => {
  cmd.on('end', resolve).on('error', reject).run()
})

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const video = m.quoted?.mediaMessage?.videoMessage ? m.quoted : (m.mediaMessage?.videoMessage ? m : null)
  if (!video) throw `Balas video dulu, lalu ketik:\n*${usedPrefix + command} atas|bawah*\nContoh: *${usedPrefix + command} WIDTH OR HEIGHT|WHY NOT BOTH?*`

  const [top = '', bottom = ''] = (text || '').split('|').map(s => s.trim().toUpperCase())
  if (!top && !bottom) throw `Isi teks atas dan/atau bawah.\nContoh: *${usedPrefix + command} atas|bawah*`

  await m.wait()
  const buffer = await video.download()
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw 'Video gagal diunduh, coba kirim ulang.'

  const id = randomUUID()
  const tmp = os.tmpdir()
  const input = path.join(tmp, `smemevid-${id}.mp4`)
  const overlay = path.join(tmp, `smemevid-${id}.png`)
  const output = path.join(tmp, `smemevid-${id}-out.mp4`)
  const cleanup = () => [input, overlay, output].forEach(f => fs.promises.unlink(f).catch(() => {}))

  try {
    await fs.promises.writeFile(input, buffer)

    const canvas = createCanvas(SIZE, SIZE)
    const ctx = canvas.getContext('2d')
    drawMemeText(ctx, top, SIZE / 2, 10, SIZE, false)
    drawMemeText(ctx, bottom, SIZE / 2, SIZE - 10, SIZE, true)
    await fs.promises.writeFile(overlay, canvas.toBuffer('image/png'))

    await run(
      ffmpegFluent(input)
        .input(overlay)
        .complexFilter([
          `[0:v]crop='min(iw,ih)':'min(iw,ih)',scale=${SIZE}:${SIZE},fps=${FPS}[vid]`,
          '[vid][1:v]overlay=0:0[out]'
        ])
        .outputOptions(['-map [out]', '-an', '-c:v libx264', '-preset fast', '-crf 26', `-t ${DURATION}`, '-pix_fmt yuv420p', '-movflags +faststart'])
        .save(output)
    )

    const videoOut = await fs.promises.readFile(output)
    const sticker = await makeSticker({ buffer: videoOut, mimetype: 'video/mp4' })
    return conn.sendMessage(m.chat, { sticker }, { quoted: m })
  } finally {
    cleanup()
  }
}

handler.help = ['smemevid <atas>|<bawah> (balas video)']
handler.tags = ['sticker']
handler.command = /^(smemevid|smemevideo)$/i
handler.limit = true
handler.register = true

export default handler
