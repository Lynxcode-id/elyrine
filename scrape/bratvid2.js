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
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)

const ASSET_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'store', 'brat')
const FONT_URL = 'https://cdn.jsdelivr.net/gh/Napoleon-Fibonacci/assets@main/font/impact.ttf'
const EMOJI_JSON_URL = 'https://media.githubusercontent.com/media/Ditzzx-vibecoder/entahlah/main/emoji-apple.json'
const FONT_PATH = path.join(ASSET_DIR, 'impact.ttf')
const EMOJI_JSON_PATH = path.join(ASSET_DIR, 'emoji-apple.json')

const DEFAULTS = {
  theme: 'white',
  blur: 0,
  holdDuration: 1.5,
  maxTokens: 40,
  concurrency: 6
}

const THEMES = {
  black: { bg: '#000000', text: '#ffffff' },
  white: { bg: '#ffffff', text: '#000000' },
  green: { bg: '#8ace00', text: '#000000' }
}

const FPS = 60
const SIZE = 1000
const MARGIN = 70
const PADDING = 40
const LINE_GAP = 15
const STAGGER_FRAMES = 5
const BOUNCE_FRAMES = 28
const SECOND_HIGHLIGHT_FRAMES = 38

async function downloadFile(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Gagal mengunduh aset bratvid2 (${res.status})`)
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
    GlobalFonts.registerFromPath(FONT_PATH, 'Impact')
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
  const variants = [base, stripped, `${stripped}-fe0f`, base.toUpperCase(), stripped.toUpperCase(), `${stripped.toUpperCase()}-FE0F`]
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
  ctx.font = `${fontSize}px Impact`
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

function findBestFontSize(ctx, text, maxWidth, maxHeight) {
  const words = text.split(' ')
  let lo = 10
  let hi = 700
  let best = lo
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const lines = wrapText(ctx, text, maxWidth, mid)
    const longest = Math.max(...words.map(w => measureText(ctx, w, mid)))
    const height = lines.length * (mid + LINE_GAP) - LINE_GAP
    if (longest <= maxWidth && height <= maxHeight) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return best
}

const easeOutBack = x => {
  const c1 = 1.4
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

function calculateWordLayout(ctx, fullText, maxWidth, maxHeight, boxSize) {
  const fontSize = findBestFontSize(ctx, fullText, maxWidth, maxHeight)
  ctx.font = `${fontSize}px Impact`
  const defaultSpace = ctx.measureText(' ').width

  const lines = wrapText(ctx, fullText, maxWidth, fontSize)
  const totalHeight = lines.length * (fontSize + LINE_GAP) - LINE_GAP
  let currentY = MARGIN + (boxSize - totalHeight) / 2

  const wordLayouts = []
  lines.forEach((line, l) => {
    const words = line.split(' ').filter(Boolean)
    const isLast = l === lines.length - 1
    const totalW = words.reduce((acc, w) => acc + measureText(ctx, w, fontSize), 0)

    let space = defaultSpace
    if (!isLast && words.length > 1) space = (maxWidth - totalW) / (words.length - 1)

    let currentX = MARGIN + PADDING
    for (const word of words) {
      const w = measureText(ctx, word, fontSize)
      wordLayouts.push({ text: word, x: currentX, y: currentY, w })
      currentX += w + space
    }
    currentY += fontSize + LINE_GAP
  })

  return { fontSize, wordLayouts }
}

async function renderCanvas({ wordLayouts, fontSize, wordStates, theme, blur, highlightProgress }) {
  const colors = THEMES[theme] || THEMES.white
  const boxSize = SIZE - MARGIN * 2

  const canvas = createCanvas(SIZE, SIZE)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = colors.bg
  ctx.fillRect(0, 0, SIZE, SIZE)

  ctx.save()
  ctx.beginPath()
  ctx.rect(MARGIN, MARGIN, boxSize, boxSize)
  ctx.clip()

  ctx.fillStyle = colors.text
  ctx.font = `${fontSize}px Impact`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  if (blur > 0) ctx.filter = `blur(${blur}px)`

  for (let i = 0; i < wordLayouts.length; i++) {
    const item = wordLayouts[i]
    const state = wordStates[i]
    if (!state || !state.visible) continue

    const cx = item.x + item.w / 2
    const cy = item.y + fontSize / 2

    ctx.save()
    ctx.globalAlpha = Math.max(0, Math.min(1, state.alpha))
    if (state.scale !== 1) {
      ctx.translate(cx, cy)
      ctx.scale(state.scale, state.scale)
      ctx.translate(-cx, -cy)
    }
    await drawText(ctx, item.text, item.x, item.y, fontSize)
    ctx.restore()
  }

  ctx.filter = 'none'

  if (highlightProgress > 0 && highlightProgress <= 1) {
    const curr = MARGIN - boxSize + highlightProgress * boxSize * 2.8
    const sweepW = boxSize * 0.95
    const grad = ctx.createLinearGradient(curr, curr, curr + sweepW, curr + sweepW)
    grad.addColorStop(0.0, 'rgba(255,255,255,0)')
    grad.addColorStop(0.1, 'rgba(255,255,255,0.35)')
    grad.addColorStop(0.25, 'rgba(255,255,255,0.95)')
    grad.addColorStop(0.38, 'rgba(255,255,255,0.35)')
    grad.addColorStop(0.45, 'rgba(255,255,255,0.05)')
    grad.addColorStop(0.52, 'rgba(255,255,255,0.05)')
    grad.addColorStop(0.6, 'rgba(255,255,255,0.35)')
    grad.addColorStop(0.75, 'rgba(255,255,255,0.95)')
    grad.addColorStop(0.88, 'rgba(255,255,255,0.35)')
    grad.addColorStop(1.0, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(MARGIN, MARGIN, boxSize, boxSize)
  }

  ctx.restore()
  return canvas
}

function buildTasks(wordLayouts, holdDuration) {
  const frameTime = 1 / FPS
  const hidden = { scale: 0, alpha: 0, visible: false }
  const shown = { scale: 1, alpha: 1, visible: true }
  const allShown = wordLayouts.map(() => shown)
  const tasks = []

  tasks.push({ wordStates: wordLayouts.map(() => hidden), highlightProgress: 0, duration: 0.15 })

  const totalBounce = (wordLayouts.length - 1) * STAGGER_FRAMES + BOUNCE_FRAMES
  for (let f = 0; f < totalBounce; f++) {
    const wordStates = wordLayouts.map((_, i) => {
      const cur = f - i * STAGGER_FRAMES
      if (cur < 0) return hidden
      if (cur >= BOUNCE_FRAMES) return shown
      const prog = cur / (BOUNCE_FRAMES - 1)
      return { scale: 0.2 + 0.8 * easeOutBack(prog), alpha: Math.min(1, prog * 1.8), visible: true }
    })
    tasks.push({ wordStates, highlightProgress: (f + 1) / totalBounce, duration: frameTime })
  }

  for (let f = 0; f < SECOND_HIGHLIGHT_FRAMES; f++) {
    tasks.push({ wordStates: allShown, highlightProgress: (f + 1) / SECOND_HIGHLIGHT_FRAMES, duration: frameTime })
  }

  tasks.push({ wordStates: allShown, highlightProgress: 0, duration: holdDuration })
  return tasks
}

export default async function bratvid2(text, options = {}) {
  const opt = { ...DEFAULTS, ...options }
  const theme = THEMES[opt.theme] ? opt.theme : DEFAULTS.theme
  const blur = [0, 1, 2, 3].includes(opt.blur) ? opt.blur : 0
  const holdDuration = Math.max(0.1, Number(opt.holdDuration) || DEFAULTS.holdDuration)
  const concurrency = Math.max(1, Math.min(16, Number(opt.concurrency) || DEFAULTS.concurrency))

  let tmpDir
  try {
    const clean = String(text == null ? '' : text).replace(/\s+/g, ' ').trim()
    const tokens = clean.split(' ').filter(Boolean).slice(0, opt.maxTokens)
    if (!tokens.length) return { status: false, message: 'Teks kosong' }
    const fullText = tokens.join(' ')

    await prepareAssets()

    const boxSize = SIZE - MARGIN * 2
    const maxWidth = boxSize - PADDING * 2
    const maxHeight = boxSize - PADDING * 2

    const dummy = createCanvas(SIZE, SIZE).getContext('2d')
    const { fontSize, wordLayouts } = calculateWordLayout(dummy, fullText, maxWidth, maxHeight, boxSize)
    const tasks = buildTasks(wordLayouts, holdDuration)

    tmpDir = await mkdtemp(path.join(tmpdir(), 'bratvid2-'))
    const framePaths = new Array(tasks.length)

    let next = 0
    const worker = async () => {
      while (next < tasks.length) {
        const i = next++
        const task = tasks[i]
        const canvas = await renderCanvas({ wordLayouts, fontSize, theme, blur, ...task })
        const file = path.join(tmpDir, `frame-${String(i + 1).padStart(5, '0')}.png`)
        await writeFile(file, await canvas.encode('png'))
        framePaths[i] = file
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker))

    const esc = p => p.replace(/'/g, "'\\''")
    const lines = []
    tasks.forEach((task, i) => {
      lines.push(`file '${esc(framePaths[i])}'`, `duration ${task.duration}`)
    })
    lines.push(`file '${esc(framePaths[framePaths.length - 1])}'`)
    const concatPath = path.join(tmpDir, 'concat.txt')
    await writeFile(concatPath, lines.join('\n'))

    const outPath = path.join(tmpDir, 'out.mp4')
    await execFileAsync(global.ffmpegPath || 'ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-f', 'concat', '-safe', '0', '-i', concatPath,
      '-vf', `fps=${FPS},scale=1000:1000`,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      outPath
    ], { maxBuffer: 16 * 1024 * 1024 })

    const buffer = await readFile(outPath)
    const duration = tasks.reduce((acc, t) => acc + t.duration, 0)
    return { status: true, buffer, words: tokens.length, frames: tasks.length, duration }
  } catch (e) {
    return { status: false, message: (e && e.stderr && e.stderr.toString().trim()) || (e && e.message) || 'Proses gagal' }
  } finally {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}
