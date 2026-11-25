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

import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import axios from 'axios'

const ASSET_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'store', 'brat')
const FONT_URL = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Font/ARIALN.ttf'
const EMOJI_JSON_URL = 'https://media.githubusercontent.com/media/Ditzzx-vibecoder/entahlah/main/emoji-apple.json'
const FONT_PATH = path.join(ASSET_DIR, 'ARIALN.ttf')
const EMOJI_JSON_PATH = path.join(ASSET_DIR, 'emoji-apple.json')
const FONT_FAMILY = 'ArialNarrow'
const BG_URL = 'https://raw.githubusercontent.com/rzkrohan/image-canvas/refs/heads/main/IMG-20261110-WA0238.jpg'

const WIDTH = 1594
const HEIGHT = 3200
const OFFSET_X = -300
const OFFSET_Y = -650
const AREA_W = 650
const AREA_H = 800
const LINE_SPACING = 1
const STRETCH_X = 1
const STRETCH_Y = 2
const STROKE = 2
const MAX_CHARS = 10
const MAX_WORDS = 2
const MAX_FONT = 400
const MIN_FONT = 20
const MAX_INPUT = 120
const JPEG_QUALITY = 95
const TEXT_COLOR = '#18362F'

const EMOJI_REGEX = /(\p{Emoji_Modifier_Base}\p{Emoji_Modifier}|\p{Emoji_Presentation}\uFE0F?|\p{Emoji}\uFE0F|[\u{1F1E0}-\u{1F1FF}]{2}|\p{Extended_Pictographic}\uFE0F?)/gu

let emojiMap = null
let bgCache = null
let assetsPromise = null
const emojiImageCache = new Map()

async function downloadFile(url, dest) {
  const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 })
  await writeFile(dest, Buffer.from(data))
}

function prepareAssets() {
  if (assetsPromise) return assetsPromise
  assetsPromise = (async () => {
    mkdirSync(ASSET_DIR, { recursive: true })
    if (!existsSync(FONT_PATH)) await downloadFile(FONT_URL, FONT_PATH)
    if (!existsSync(EMOJI_JSON_PATH)) await downloadFile(EMOJI_JSON_URL, EMOJI_JSON_PATH)
    GlobalFonts.registerFromPath(FONT_PATH, FONT_FAMILY)
    emojiMap = JSON.parse(readFileSync(EMOJI_JSON_PATH, 'utf-8'))
  })().catch(e => {
    assetsPromise = null
    throw e
  })
  return assetsPromise
}

async function getBackground() {
  if (bgCache) return bgCache
  const { data } = await axios.get(BG_URL, { responseType: 'arraybuffer', timeout: 30000 })
  bgCache = await loadImage(Buffer.from(data))
  return bgCache
}

const toCodepoints = emoji => [...emoji].map(c => c.codePointAt(0).toString(16).padStart(4, '0')).join('-')

async function getEmojiImage(emoji) {
  if (emojiImageCache.has(emoji)) return emojiImageCache.get(emoji)
  const base = toCodepoints(emoji)
  const stripped = base.replace(/-fe0f/gi, '')
  const variants = [base, stripped, `${stripped}-fe0f`, base.toUpperCase(), stripped.toUpperCase(), `${stripped.toUpperCase()}-FE0F`]
  const key = variants.find(v => emojiMap[v])
  const img = key ? await loadImage(Buffer.from(emojiMap[key], 'base64')) : null
  emojiImageCache.set(emoji, img)
  return img
}

function isEmoji(part) {
  EMOJI_REGEX.lastIndex = 0
  const result = EMOJI_REGEX.test(part)
  EMOJI_REGEX.lastIndex = 0
  return result
}

const splitParts = text => text.split(EMOJI_REGEX).filter(Boolean)

function measureLine(ctx, text, size) {
  let width = 0
  for (const part of splitParts(text)) width += isEmoji(part) ? size : ctx.measureText(part).width
  return width
}

function wrapText(content) {
  const lines = []
  let line = []
  for (const word of content.trim().split(/\s+/)) {
    const total = line.join('').length + word.length
    if (line.length >= MAX_WORDS || total > MAX_CHARS || word.length >= MAX_CHARS) {
      if (line.length) lines.push(line.join(' '))
      line = [word]
    } else {
      line.push(word)
    }
  }
  if (line.length) lines.push(line.join(' '))
  return lines
}

function fitFont(ctx, lines) {
  let size = MAX_FONT
  while (size > MIN_FONT) {
    ctx.font = `${size}px ${FONT_FAMILY}`
    const lineHeight = size * LINE_SPACING * STRETCH_Y
    const widthOk = lines.every(t => measureLine(ctx, t, size) * STRETCH_X + STROKE * STRETCH_X <= AREA_W)
    const heightOk = lines.length * lineHeight <= AREA_H
    if (widthOk && heightOk) break
    size -= 2
  }
  return size
}

async function drawLine(ctx, text, size) {
  let cursor = -measureLine(ctx, text, size) / 2
  for (const part of splitParts(text)) {
    if (isEmoji(part)) {
      const img = await getEmojiImage(part)
      if (img) ctx.drawImage(img, cursor, -size / 2, size, size)
      cursor += size
    } else {
      ctx.strokeText(part, cursor, 0)
      ctx.fillText(part, cursor, 0)
      cursor += ctx.measureText(part).width
    }
  }
}

export async function narrow(text) {
  try {
    const content = String(text || '').trim()
    if (!content) return { status: false, message: 'Teks kosong.' }
    if (content.length > MAX_INPUT) return { status: false, message: `Teks maksimal ${MAX_INPUT} karakter.` }

    await prepareAssets()
    const bg = await getBackground()

    const lines = wrapText(content)
    const canvas = createCanvas(WIDTH, HEIGHT)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT)

    const size = fitFont(ctx, lines)
    const lineHeight = size * LINE_SPACING * STRETCH_Y
    const centerX = WIDTH / 2 + OFFSET_X
    const centerY = HEIGHT / 2 + OFFSET_Y
    const startY = centerY - (lines.length * lineHeight) / 2 + lineHeight / 2

    ctx.font = `${size}px ${FONT_FAMILY}`
    ctx.fillStyle = TEXT_COLOR
    ctx.strokeStyle = TEXT_COLOR
    ctx.lineJoin = 'round'
    ctx.lineWidth = STROKE
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'

    for (let i = 0; i < lines.length; i++) {
      ctx.save()
      ctx.translate(centerX, startY + i * lineHeight)
      ctx.scale(STRETCH_X, STRETCH_Y)
      await drawLine(ctx, lines[i], size)
      ctx.restore()
    }

    return { status: true, buffer: await canvas.encode('jpeg', JPEG_QUALITY) }
  } catch (e) {
    return { status: false, message: e.message }
  }
}
