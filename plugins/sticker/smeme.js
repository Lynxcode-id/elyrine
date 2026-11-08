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
import path from 'path'
import os from 'os'
import { randomBytes } from 'crypto'
import { execFile } from 'child_process'
import axios from 'axios'
import sharp from 'sharp'
import { makeSticker } from '../../lib/sticker-maker.js'

const ROOT = process.cwd()
const EMOJI_CACHE = path.join(ROOT, 'tmp', 'emoji-cache')
const FONT_PATH = path.join(ROOT, 'font', 'Heading.ttf')
const FONT = "Heading, 'DejaVu Sans', Arial, sans-serif"
const FFMPEG = () => global.ffmpegPath || 'ffmpeg'
const MAX_KB = 480

let canvasLib
async function loadCanvas() {
  if (canvasLib) return canvasLib
  try {
    canvasLib = await import('@napi-rs/canvas')
  } catch {
    throw 'Paket *@napi-rs/canvas* belum terpasang. Jalankan: npm i @napi-rs/canvas'
  }
  if (fs.existsSync(FONT_PATH)) canvasLib.GlobalFonts.registerFromPath(FONT_PATH, 'Heading')
  return canvasLib
}

const tmpFile = ext => path.join(os.tmpdir(), `smeme-${randomBytes(8).toString('hex')}.${ext}`)
const safeUnlink = (...ps) => ps.forEach(p => { try { fs.unlinkSync(p) } catch { } })

function isAnimatedWebp(b) {
  return b?.length > 16 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' && b.includes(Buffer.from('ANIM'))
}

const run = args => new Promise((resolve, reject) =>
  execFile(FFMPEG(), args, (err, _o, stderr) => err ? reject(new Error(String(stderr || err.message).slice(-300))) : resolve()))

const emojiFile = e => [...e].map(c => c.codePointAt(0)).filter(c => c !== 0xfe0f).map(c => c.toString(16)).join('-') + '.png'

async function getEmojiPath(emoji) {
  fs.mkdirSync(EMOJI_CACHE, { recursive: true })
  const local = path.join(EMOJI_CACHE, emojiFile(emoji))
  if (fs.existsSync(local)) return local
  try {
    const r = await axios.get(`https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${emojiFile(emoji)}`, { responseType: 'arraybuffer', timeout: 5000 })
    fs.writeFileSync(local, Buffer.from(r.data))
    return local
  } catch { return null }
}

function toSegments(text) {
  const re = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu
  const parts = []
  let last = 0
  for (const mt of text.matchAll(re)) {
    if (mt.index > last) parts.push({ t: 'text', v: text.slice(last, mt.index) })
    parts.push({ t: 'emoji', v: mt[0] })
    last = mt.index + mt[0].length
  }
  if (last < text.length) parts.push({ t: 'text', v: text.slice(last) })
  return parts
}

async function drawMemeText(ctx, loadImage, rawText, isTop) {
  const text = rawText.trim().toUpperCase()
  const paths = {}
  const emojis = [...new Set(toSegments(text).filter(s => s.t === 'emoji').map(s => s.v))]
  await Promise.all(emojis.map(async e => { paths[e] = await getEmojiPath(e) }))

  const MAX_W = 480
  const MAX_LINES = 3

  const metrics = size => {
    ctx.font = `bold ${size}px ${FONT}`
    const capH = ctx.measureText('H').actualBoundingBoxAscent || size * 0.72
    return { capH, emo: capH * 1.25, gap: size * 0.08, space: ctx.measureText(' ').width }
  }
  const segW = (s, mt) => s.t === 'text' ? ctx.measureText(s.v).width : mt.emo + mt.gap * 2

  const wrap = size => {
    const mt = metrics(size)
    const lines = []
    for (const para of text.split('\n')) {
      let cur = [], curW = 0
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const segs = toSegments(word)
        const ww = segs.reduce((a, s) => a + segW(s, mt), 0)
        if (cur.length && curW + mt.space + ww > MAX_W) {
          lines.push({ segs: cur, w: curW })
          cur = [...segs]; curW = ww
        } else {
          if (cur.length) { cur.push({ t: 'text', v: ' ' }); curW += mt.space }
          cur.push(...segs); curW += ww
        }
      }
      if (cur.length) lines.push({ segs: cur, w: curW })
    }
    return { lines, mt, fits: lines.every(l => l.w <= MAX_W) }
  }

  let size = 72
  let L = wrap(size)
  while ((L.lines.length > MAX_LINES || !L.fits) && size > 28) { size -= 2; L = wrap(size) }

  const { lines, mt } = L
  const lineH = size * 1.12
  ctx.font = `bold ${size}px ${FONT}`
  ctx.textBaseline = 'alphabetic'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(4, size / 7)
  ctx.fillStyle = 'white'
  ctx.strokeStyle = 'black'

  const n = lines.length
  const firstBase = isTop ? 14 + mt.capH : 512 - 18 - (n - 1) * lineH

  for (let i = 0; i < n; i++) {
    const base = firstBase + i * lineH
    let x = (512 - lines[i].w) / 2
    for (const s of lines[i].segs) {
      if (s.t === 'text') {
        ctx.strokeText(s.v, x, base)
        ctx.fillText(s.v, x, base)
        x += ctx.measureText(s.v).width
      } else {
        x += mt.gap
        const p = paths[s.v]
        if (p) try { ctx.drawImage(await loadImage(p), x, base - mt.capH / 2 - mt.emo / 2, mt.emo, mt.emo) } catch { }
        x += mt.emo + mt.gap
      }
    }
  }
}

async function processAnimatedWebp(buffer, canvasBuffer, out) {
  const meta = await sharp(buffer, { animated: true }).metadata()
  const pages = meta.pages || 1
  const delays = meta.delay?.length === pages ? meta.delay : Array(pages).fill(100)
  const dir = path.join(os.tmpdir(), `smeme-frames-${randomBytes(6).toString('hex')}`)
  fs.mkdirSync(dir, { recursive: true })
  try {
    await Promise.all(Array.from({ length: pages }, async (_, i) => {
      const f = await sharp(buffer, { page: i, pages: 1 }).resize(512, 512, { fit: 'cover', position: 'centre' })
        .composite([{ input: canvasBuffer, top: 0, left: 0 }]).png().toBuffer()
      fs.writeFileSync(path.join(dir, `frame_${String(i).padStart(4, '0')}.png`), f)
    }))
    const avg = delays.reduce((a, b) => a + b, 0) / delays.length
    const fps = Math.max(1, Math.min(12, Math.round(1000 / (avg || 100))))
    const enc = q => run(['-y', '-framerate', String(fps), '-i', path.join(dir, 'frame_%04d.png'),
      '-c:v', 'libwebp', '-lossless', '0', '-q:v', String(q), '-compression_level', '4', '-loop', '0', '-an', out])
    await enc(60)
    if (fs.statSync(out).size > MAX_KB * 1024) await enc(35)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

let handler = async (m, { text, conn, usedPrefix, command }) => {
  if (!text) throw `Format: ${usedPrefix + command} <teks atas>|<teks bawah>`

  const q = m.quoted || m
  const mime = (q.msg || q).mimetype || ''
  if (!/^(image|video)\//i.test(mime) || typeof q.download !== 'function') {
    throw `Balas foto/video/sticker dengan perintah\n\n${usedPrefix + command} <teks atas>|<teks bawah>`
  }

  const { createCanvas, loadImage } = await loadCanvas()
  await m.react('🕒').catch(() => { })

  const buffer = await q.download()
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw 'Gagal mengunduh media.'

  const isVideo = mime.startsWith('video/')
  const isGif = mime === 'image/gif'
  const isAnimWebp = mime.startsWith('image/webp') && isAnimatedWebp(buffer)
  const isAnimated = isVideo || isGif || isAnimWebp
  const ext = isVideo ? (mime.split('/')[1]?.split(';')[0] || 'mp4')
    : isGif ? 'gif' : mime.startsWith('image/webp') ? 'webp' : (mime.split('/')[1]?.split(';')[0] || 'jpg')

  const inputPath = tmpFile(ext)
  const canvasPath = tmpFile('png')
  const outputPath = tmpFile('webp')

  try {
    fs.writeFileSync(inputPath, buffer)

    const [topRaw, bottomRaw] = text.split('|')
    const cv = createCanvas(512, 512)
    const ctx = cv.getContext('2d')
    if (topRaw?.trim()) await drawMemeText(ctx, loadImage, topRaw, true)
    if (bottomRaw?.trim()) await drawMemeText(ctx, loadImage, bottomRaw, false)
    const canvasBuffer = cv.toBuffer('image/png')
    fs.writeFileSync(canvasPath, canvasBuffer)

    if (isAnimWebp) {
      await processAnimatedWebp(buffer, canvasBuffer, outputPath)
    } else {
      const encode = ({ fps, duration, quality }) => run([
        '-y', '-analyzeduration', '20M', '-probesize', '10M',
        ...(isAnimated ? ['-t', String(duration)] : []),
        '-i', inputPath, '-i', canvasPath,
        '-filter_complex', `[0:v]fps=${fps},scale=512:512:force_original_aspect_ratio=increase,crop=512:512,format=rgba[base];[base][1:v]overlay=0:0,format=rgba[v]`,
        '-map', '[v]', '-c:v', 'libwebp', '-lossless', '0', '-q:v', String(quality),
        '-compression_level', '4', '-loop', '0', '-an', outputPath
      ])
      await encode({ fps: isAnimated ? 10 : 15, duration: 4, quality: isAnimated ? 55 : 40 })
      if (fs.statSync(outputPath).size > MAX_KB * 1024) {
        await encode({ fps: isAnimated ? 8 : 15, duration: 3, quality: isAnimated ? 30 : 25 })
      }
    }

    let sticker = fs.readFileSync(outputPath)
    try { sticker = await makeSticker({ buffer: sticker, mimetype: 'image/webp' }) } catch (e) { console.error('[SMEME] exif:', e.message) }

    await conn.sendMessage(m.chat, { sticker }, { quoted: m })
    await m.react('✅').catch(() => { })
  } catch (e) {
    console.error('[SMEME]', e?.stack || e)
    await m.react('❌').catch(() => { })
    throw `Gagal memproses meme:\n${e.message || e}`
  } finally {
    safeUnlink(inputPath, canvasPath, outputPath)
  }
}

handler.help = ['smeme <atas>|<bawah>']
handler.tags = ['sticker']
handler.command = /^smeme$/i
handler.limit = true
handler.register = true

export default handler
