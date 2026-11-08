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
import { existsSync, readFileSync, mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ASSET_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'store', 'brat')
const FONT_URL = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Font/ARIALN.ttf'
const EMOJI_JSON_URL = 'https://media.githubusercontent.com/media/Ditzzx-vibecoder/entahlah/main/emoji-apple.json'
const FONT_PATH = path.join(ASSET_DIR, 'ARIALN.ttf')
const EMOJI_JSON_PATH = path.join(ASSET_DIR, 'emoji-apple.json')

const DEFAULTS = {
  blur: 0,
  colorOuter: '#dadada',
  colorMid: '#000000',
  bgColor: '#ffffff'
}

const SIZE = 1000
const PADDING = 40
const LINE_GAP = 6
const STACK_GAP_TOP = 4
const STACK_GAP_BOTTOM = 40
const OUTER_START_SIZE = 200
const MID_START_SIZE = 340
const MAX_CHARS = 120

async function downloadFile(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Gagal mengunduh aset brat3 (' + res.status + ')')
  await writeFile(dest, Buffer.from(await res.arrayBuffer()))
}

let emojiMap = null
let assetsPromise = null
const emojiImageCache = new Map()

function prepareAssets() {
  if (assetsPromise) return assetsPromise
  assetsPromise = (async () => {
    mkdirSync(ASSET_DIR, { recursive: true })
    if (!existsSync(FONT_PATH)) await downloadFile(FONT_URL, FONT_PATH)
    if (!existsSync(EMOJI_JSON_PATH)) await downloadFile(EMOJI_JSON_URL, EMOJI_JSON_PATH)
    GlobalFonts.registerFromPath(FONT_PATH, 'ArialNarrow')
    emojiMap = JSON.parse(readFileSync(EMOJI_JSON_PATH, 'utf-8'))
  })().catch(err => {
    assetsPromise = null
    throw err
  })
  return assetsPromise
}

const emojiToUnicode = emoji => [...emoji].map(c => c.codePointAt(0).toString(16).padStart(4, '0')).join('-')

async function getEmojiImage(emoji) {
  if (emojiImageCache.has(emoji)) return emojiImageCache.get(emoji)
  const base = emojiToUnicode(emoji)
  const stripped = base.replace(/-fe0f/gi, '')
  const variants = [base, stripped, stripped + '-fe0f', base.toUpperCase(), stripped.toUpperCase(), stripped.toUpperCase() + '-FE0F']
  const key = variants.find(v => emojiMap[v])
  if (!key) return null
  const img = await loadImage(Buffer.from(emojiMap[key], 'base64'))
  emojiImageCache.set(emoji, img)
  return img
}

const EMOJI_REGEX = /(\p{Emoji_Modifier_Base}\p{Emoji_Modifier}|\p{Emoji_Presentation}\uFE0F?|\p{Emoji}\uFE0F|[\u{1F1E0}-\u{1F1FF}]{2}|\p{Extended_Pictographic}\uFE0F?)/gu
const isEmoji = part => {
  EMOJI_REGEX.lastIndex = 0
  const result = EMOJI_REGEX.test(part)
  EMOJI_REGEX.lastIndex = 0
  return result
}

function measureText(ctx, text, fontSize) {
  let width = 0
  for (const part of text.split(EMOJI_REGEX)) {
    if (!part) continue
    width += isEmoji(part) ? fontSize : ctx.measureText(part).width
  }
  return width
}

async function drawCenteredLine(ctx, text, centerX, y, fontSize) {
  let cursor = centerX - measureText(ctx, text, fontSize) / 2
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
  if (!text) return []
  ctx.font = fontSize + 'px ArialNarrow'
  const lines = []
  let current = ''
  for (const word of text.split(' ')) {
    const test = current ? current + ' ' + word : word
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

function longestWord(ctx, text, fontSize) {
  if (!text) return 0
  ctx.font = fontSize + 'px ArialNarrow'
  return Math.max(...text.split(' ').map(w => measureText(ctx, w, fontSize)))
}

const blockHeight = (lines, fontSize) => (lines.length ? lines.length * (fontSize + LINE_GAP) - LINE_GAP : 0)

export default async function brat3(topText, midText, bottomText, options) {
  try {
    const opt = Object.assign({}, DEFAULTS, options || {})
    const blur = [0, 1, 2, 3].includes(opt.blur) ? opt.blur : 0

    const clean = v => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS)
    const top = clean(topText)
    const mid = clean(midText)
    const bottom = clean(bottomText)
    if (!mid) return { status: false, message: 'Teks tengah kosong' }

    await prepareAssets()

    const maxWidth = SIZE - PADDING * 2
    const maxHeight = SIZE - PADDING * 2

    const canvas = createCanvas(SIZE, SIZE)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = opt.bgColor
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    const centerX = SIZE / 2

    const computeLayout = (outerSize, midSize) => {
      const topLines = wrapText(ctx, top, maxWidth, outerSize)
      const bottomLines = wrapText(ctx, bottom, maxWidth, outerSize)
      const midLines = wrapText(ctx, mid, maxWidth, midSize)

      const topH = blockHeight(topLines, outerSize)
      const midH = blockHeight(midLines, midSize)
      const bottomH = blockHeight(bottomLines, outerSize)
      const gapTop = topLines.length ? STACK_GAP_TOP : 0
      const gapBottom = bottomLines.length ? STACK_GAP_BOTTOM : 0
      const totalH = topH + gapTop + midH + gapBottom + bottomH

      const fits = longestWord(ctx, top, outerSize) <= maxWidth &&
        longestWord(ctx, bottom, outerSize) <= maxWidth &&
        longestWord(ctx, mid, midSize) <= maxWidth &&
        totalH <= maxHeight
      return { fits, topLines, midLines, bottomLines, topH, midH, gapTop, gapBottom, totalH }
    }

    let outerSize = OUTER_START_SIZE
    let midSize = MID_START_SIZE
    let layout = computeLayout(outerSize, midSize)
    while (!layout.fits && outerSize > 6) {
      outerSize -= 2
      midSize -= Math.round(2 * (MID_START_SIZE / OUTER_START_SIZE))
      layout = computeLayout(outerSize, midSize)
    }

    ctx.save()
    if (blur > 0) ctx.filter = 'blur(' + blur + 'px)'

    let cursorY = (SIZE - layout.totalH) / 2

    const drawBlock = async (lines, fontSize, color) => {
      ctx.fillStyle = color
      ctx.font = fontSize + 'px ArialNarrow'
      let y = cursorY
      for (const line of lines) {
        await drawCenteredLine(ctx, line, centerX, y, fontSize)
        y += fontSize + LINE_GAP
      }
    }

    await drawBlock(layout.topLines, outerSize, opt.colorOuter)
    cursorY += layout.topH + layout.gapTop
    await drawBlock(layout.midLines, midSize, opt.colorMid)
    cursorY += layout.midH + layout.gapBottom
    await drawBlock(layout.bottomLines, outerSize, opt.colorOuter)

    ctx.restore()

    return { status: true, buffer: await canvas.encode('png') }
  } catch (e) {
    return { status: false, message: (e && e.message) || 'Proses gagal' }
  }
}
