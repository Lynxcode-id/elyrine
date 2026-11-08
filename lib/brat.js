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

import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
import sharp from 'sharp'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { addExif, getStickerWatermark } from './sticker-maker.js'
import { muxAnimatedWebp } from './webp-anim.js'

export const BRAT_CONFIG = {
  theme: 'white',
  blur: 0,
  frameDuration: 400,
  holdDuration: 1200,
  maxWordPerLayer: 1,
  maxWordBeforeReset: [7, 8],
  maxTokens: 40
}

const ASSET_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'store', 'brat')
const FONT_URL = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Font/ARIALN.ttf'
const EMOJI_JSON_URL = 'https://media.githubusercontent.com/media/Ditzzx-vibecoder/entahlah/main/emoji-apple.json'
const FONT_PATH = path.join(ASSET_DIR, 'ARIALN.ttf')
const EMOJI_JSON_PATH = path.join(ASSET_DIR, 'emoji-apple.json')

const THEMES = {
  black: { bg: '#000000', text: '#ffffff' },
  white: { bg: '#ffffff', text: '#000000' },
  green: { bg: '#8ace00', text: '#000000' }
}

const EMOJI_REGEX = /(\p{Emoji_Modifier_Base}\p{Emoji_Modifier}|\p{Emoji_Presentation}️?|\p{Emoji}️|[\u{1F1E0}-\u{1F1FF}]{2}|\p{Extended_Pictographic}️?)/gu
const isEmoji = part => {
  EMOJI_REGEX.lastIndex = 0
  const result = EMOJI_REGEX.test(part)
  EMOJI_REGEX.lastIndex = 0
  return result
}

async function downloadFile(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Gagal mengunduh aset brat (${res.status})`)
  await writeFile(dest, Buffer.from(await res.arrayBuffer()))
}

let emojiMap = null
let assetsPromise = null
const emojiImageCache = new Map()

function prepareAssets() {
  assetsPromise ||= (async () => {
    await mkdir(ASSET_DIR, { recursive: true })
    if (!existsSync(FONT_PATH)) await downloadFile(FONT_URL, FONT_PATH)
    if (!existsSync(EMOJI_JSON_PATH)) await downloadFile(EMOJI_JSON_URL, EMOJI_JSON_PATH)
    GlobalFonts.registerFromPath(FONT_PATH, 'ArialNarrow')
    emojiMap = JSON.parse(readFileSync(EMOJI_JSON_PATH, 'utf-8'))
  })().catch(error => {
    assetsPromise = null
    throw error
  })
  return assetsPromise
}

const emojiToUnicode = emoji => [...emoji].map(c => c.codePointAt(0).toString(16).padStart(4, '0')).join('-')

async function getEmojiImage(emoji) {
  if (emojiImageCache.has(emoji)) return emojiImageCache.get(emoji)
  const base = emojiToUnicode(emoji)
  const stripped = base.replace(/-fe0f/gi, '')
  const variants = [base, stripped, `${stripped}-fe0f`, base.toUpperCase(), stripped.toUpperCase(), `${stripped.toUpperCase()}-FE0F`]
  const key = variants.find(v => emojiMap[v])
  if (!key) return null
  const img = await loadImage(Buffer.from(emojiMap[key], 'base64'))
  emojiImageCache.set(emoji, img)
  return img
}

function measureText(ctx, text, fontSize) {
  let width = 0
  for (const part of text.split(EMOJI_REGEX)) {
    if (!part) continue
    width += isEmoji(part) ? fontSize : ctx.measureText(part).width
  }
  return width
}

async function drawText(ctx, text, x, y, fontSize) {
  let cursor = x
  for (const part of text.split(EMOJI_REGEX)) {
    if (!part) continue
    if (isEmoji(part)) {
      const img = await getEmojiImage(part)
      if (img) ctx.drawImage(img, cursor, y, fontSize, fontSize)
      else ctx.fillText(part, cursor, y)
      cursor += fontSize
    } else {
      ctx.fillText(part, cursor, y)
      cursor += ctx.measureText(part).width
    }
  }
}

function wrapText(ctx, text, maxWidth, fontSize) {
  ctx.font = `${fontSize}px ArialNarrow`
  const lines = []
  let current = ''
  for (const word of text.split(' ')) {
    const test = current ? `${current} ${word}` : word
    if (measureText(ctx, test, fontSize) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

function findFontSize(ctx, text, maxWidth, maxHeight, lineGap) {
  const words = text.split(' ')
  let lo = 10
  let hi = 700
  let best = lo
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const lines = wrapText(ctx, text, maxWidth, mid)
    const longest = Math.max(...words.map(word => measureText(ctx, word, mid)))
    const height = lines.length * (mid + lineGap) - lineGap
    if (longest <= maxWidth && height <= maxHeight) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return best
}

async function renderCanvas(text, { theme, blur }) {
  const colors = THEMES[theme] || THEMES.white
  const size = 1000
  const padding = 80
  const lineGap = 20
  const maxSize = size - padding * 2

  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = colors.bg
  ctx.fillRect(0, 0, size, size)
  if (!text.trim()) return canvas

  const fontSize = findFontSize(ctx, text, maxSize, maxSize, lineGap)
  const lines = wrapText(ctx, text, maxSize, fontSize)

  ctx.fillStyle = colors.text
  ctx.font = `${fontSize}px ArialNarrow`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  if ([1, 2, 3].includes(blur)) ctx.filter = `blur(${blur}px)`

  let y = (size - (lines.length * (fontSize + lineGap) - lineGap)) / 2
  for (const line of lines) {
    await drawText(ctx, line, padding, y, fontSize)
    y += fontSize + lineGap
  }
  return canvas
}

const toWebp = async (canvas, lossless = true) => {
  const png = await canvas.encode('png')
  return sharp(png)
    .resize(512, 512, { fit: 'fill' })
    .webp(lossless ? { lossless: true, effort: 4 } : { quality: 95, effort: 4 })
    .toBuffer()
}

function buildPartialTexts(tokens, { maxWordPerLayer, maxWordBeforeReset }) {
  const step = Math.max(1, maxWordPerLayer)
  const schedule = (Array.isArray(maxWordBeforeReset) ? maxWordBeforeReset : [maxWordBeforeReset]).map(n => Math.max(0, n))
  const partials = []
  let start = 0
  let batch = 0
  while (start < tokens.length) {
    const resetAt = schedule[batch % schedule.length]
    const end = resetAt > 0 ? Math.min(start + resetAt, tokens.length) : tokens.length
    for (let i = start + step; i < end; i += step) partials.push(tokens.slice(start, i).join(' '))
    partials.push(tokens.slice(start, end).join(' '))
    start = end
    batch++
  }
  return partials
}

export async function makeBratSticker(text, { packName, publisher } = {}) {
  await prepareAssets()
  const wm = getStickerWatermark()
  const canvas = await renderCanvas(text, BRAT_CONFIG)
  return addExif(await toWebp(canvas), packName || wm.packName, publisher || wm.publisher)
}

export async function makeBratVideoSticker(text, { packName, publisher } = {}) {
  await prepareAssets()
  const wm = getStickerWatermark()
  const tokens = text.split(' ').filter(Boolean).slice(0, BRAT_CONFIG.maxTokens)
  if (!tokens.length) throw new Error('Teks kosong')

  const partials = buildPartialTexts(tokens, BRAT_CONFIG)
  const canvases = []
  for (const partial of partials) canvases.push(await renderCanvas(partial, BRAT_CONFIG))

  const mux = async lossless => {
    const frames = []
    for (let i = 0; i < canvases.length; i++) {
      frames.push({
        buffer: await toWebp(canvases[i], lossless),
        duration: i === canvases.length - 1 ? BRAT_CONFIG.holdDuration : BRAT_CONFIG.frameDuration
      })
    }
    return muxAnimatedWebp(frames, 512, 512)
  }

  let animated = await mux(true)
  if (animated.length > 900 * 1024) animated = await mux(false)
  return addExif(animated, packName || wm.packName, publisher || wm.publisher)
}