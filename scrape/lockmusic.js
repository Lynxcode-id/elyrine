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
import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const STORE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'store', 'lockmusic')

export const DEFAULTS = {
  title: 'moment',
  artist: 'Vierre Cloud',
  cover: '',
  label: '',
  time: '',
  date: '',
  debug: false
}

const TIMEZONE = 'Asia/Makassar'
const MAX_TITLE = 80
const MAX_ARTIST = 60
const MAX_LABEL = 40

const ASSETS = {
  dir: STORE_DIR,
  template: 'https://raw.githubusercontent.com/its-dinda/image/main/1795334890548.jpeg',
  fontBases: [
    'https://cdn.jsdelivr.net/gh/sahibjotsaggu/San-Francisco-Pro-Fonts@master/',
    'https://raw.githubusercontent.com/sahibjotsaggu/San-Francisco-Pro-Fonts/master/'
  ],
  sf: { regular: 'SF-Pro-Text-Regular.otf', bold: 'SF-Pro-Text-Bold.otf' },
  fontFallback: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
  emoji: 'https://media.githubusercontent.com/media/Ditzzx-vibecoder/entahlah/main/emoji-apple.json'
}

const W = 1080
const H = 1920
const L = {
  cx: W / 2,
  date: { base: 150, size: 50, maxW: 920 },
  clock: { base: 365, refText: '00:00', refWidth: 650 },
  cover: { x: 128, y: 450, w: 823, h: 823, r: 12 },
  title: { base: 1411, size: 40, maxW: 640 },
  artist: { base: 1452, size: 37, maxW: 640 }
}
const COLOR = { white: '#ffffff', artist: 'rgb(196,196,196)' }

const FAMILY = {}
const warn = (...a) => console.warn('[lockmusic]', ...a)
const font = (size, weight) => `${size}px ${FAMILY[weight || 'regular'] || FAMILY.regular || 'sans-serif'}, Helvetica, Arial, sans-serif`

function drawText(ctx, text, x, y, size, weight, color) {
  ctx.save()
  ctx.fillStyle = color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.font = font(size, weight)
  ctx.fillText(text, x, y)
  if (weight === 'bold' && !FAMILY.bold) {
    ctx.strokeStyle = color
    ctx.lineWidth = size * 0.035
    ctx.lineJoin = 'round'
    ctx.strokeText(text, x, y)
  }
  ctx.restore()
}

const rawUrl = u => u.replace(/^https?:\/\/github\.com\/([^/]+\/[^/]+)\/blob\//, 'https://raw.githubusercontent.com/$1/')

async function fetchBuf(url) {
  const res = await fetch(rawUrl(url), { headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow', signal: AbortSignal.timeout(60000) })
  if (!res.ok) throw new Error(res.status + ' ' + url)
  return Buffer.from(await res.arrayBuffer())
}

async function cached(url, file) {
  const dest = join(ASSETS.dir, file)
  if (existsSync(dest)) return dest
  await mkdir(dirname(dest), { recursive: true })
  await writeFile(dest, await fetchBuf(url))
  return dest
}

function registerFont(path, fam) {
  try {
    GlobalFonts.registerFromPath(path, fam)
    return GlobalFonts.has ? GlobalFonts.has(fam) : true
  } catch (e) {
    return false
  }
}

async function ensureFonts() {
  if (FAMILY.regular && FAMILY.bold) return
  for (const w of ['regular', 'bold']) {
    if (FAMILY[w]) continue
    for (const base of ASSETS.fontBases) {
      try {
        if (registerFont(await cached(base + ASSETS.sf[w], 'fonts/' + ASSETS.sf[w]), 'LM' + w)) {
          FAMILY[w] = 'LM' + w
          break
        }
      } catch (e) {
        continue
      }
    }
  }
  if (!FAMILY.regular) {
    try {
      if (registerFont(await cached(ASSETS.fontFallback, 'fonts/Inter-Regular.ttf'), 'LMInter')) FAMILY.regular = 'LMInter'
    } catch (e) {
      warn('font gagal diambil, pakai font sistem: ' + e.message)
    }
  }
}

let emojiMap = null
const emojiCache = new Map()

async function loadEmojiMap() {
  if (emojiMap) return emojiMap
  try {
    emojiMap = JSON.parse(await readFile(await cached(ASSETS.emoji, 'emoji-apple.json'), 'utf-8'))
  } catch (e) {
    warn('emoji json gagal diambil, emoji pakai font sistem: ' + e.message)
    emojiMap = {}
  }
  return emojiMap
}

const emojiToUnicode = e => [...e].map(c => c.codePointAt(0).toString(16).padStart(4, '0')).join('-')

async function getEmojiImage(emoji) {
  if (emojiCache.has(emoji)) return emojiCache.get(emoji)
  const map = await loadEmojiMap()
  const base = emojiToUnicode(emoji)
  const noFe = base.replace(/-fe0f/gi, '')
  const key = [base, noFe, noFe + '-fe0f', base.toUpperCase(), noFe.toUpperCase(), noFe.toUpperCase() + '-FE0F'].find(v => map[v])
  let img = null
  if (key) {
    try {
      img = await loadImage(Buffer.from(map[key], 'base64'))
    } catch (e) {
      img = null
    }
  }
  emojiCache.set(emoji, img)
  return img
}

async function drawAppleEmoji(ctx, emoji, cx, cy, size, color) {
  const img = await getEmojiImage(emoji)
  if (!img) {
    ctx.save()
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = size * 0.85 + 'px sans-serif'
    ctx.fillText(emoji, cx, cy)
    ctx.restore()
    return
  }
  ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size)
}

const SEGMENTER = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
const EMOJI_TEST = /\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|⃣/u
const emojiAdv = fs => fs * 1.05

function toRuns(text) {
  const runs = []
  for (const { segment } of SEGMENTER.segment(text)) {
    const e = EMOJI_TEST.test(segment)
    const last = runs[runs.length - 1]
    if (!e && last && !last.e) last.t += segment
    else runs.push({ t: segment, e })
  }
  return runs
}

function measureRuns(ctx, text, fs, weight) {
  ctx.font = font(fs, weight || 'regular')
  let w = 0
  for (const r of toRuns(text)) w += r.e ? emojiAdv(fs) : ctx.measureText(r.t).width
  return w
}

async function drawRuns(ctx, text, x, base, fs, weight, color) {
  let cx = x
  for (const r of toRuns(text)) {
    if (r.e) {
      await drawAppleEmoji(ctx, r.t, cx + emojiAdv(fs) / 2, base - fs * 0.32, emojiAdv(fs), color)
      cx += emojiAdv(fs)
    } else {
      drawText(ctx, r.t, cx, base, fs, weight, color)
      ctx.font = font(fs, weight)
      cx += ctx.measureText(r.t).width
    }
  }
}

async function drawCentered(ctx, text, cx, base, fs, weight, color) {
  const w = measureRuns(ctx, text, fs, weight)
  await drawRuns(ctx, text, cx - w / 2, base, fs, weight, color)
}

function ellipsize(ctx, s, maxW, fs, weight) {
  if (measureRuns(ctx, s, fs, weight) <= maxW) return s
  const g = [...SEGMENTER.segment(s)].map(x => x.segment)
  while (g.length && measureRuns(ctx, g.join('').trimEnd() + '…', fs, weight) > maxW) g.pop()
  return g.join('').trimEnd() + '…'
}

function fitSize(ctx, text, weight, targetW) {
  ctx.font = font(100, weight)
  const w = ctx.measureText(text).width
  return w ? 100 * targetW / w : 100
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawCover(ctx, img, x, y, w, h) {
  const s = Math.max(w / img.width, h / img.height)
  const sw = w / s
  const sh = h / s
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h)
}

async function loadSrc(src, label) {
  if (!src) return null
  try {
    if (Buffer.isBuffer(src)) return await loadImage(src)
    if (/^https?:\/\//.test(src)) return await loadImage(await fetchBuf(src))
    return await loadImage(await readFile(resolve(process.cwd(), src)))
  } catch (e) {
    warn(label + ' gagal dibaca, dilewati: ' + e.message)
    return null
  }
}

function wita(now = new Date()) {
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now)
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, weekday: 'short', day: 'numeric' }).formatToParts(now)
  const get = t => (parts.find(p => p.type === t) || { value: '' }).value
  return { time, date: get('weekday') + ' ' + get('day') }
}

let templateImg = null

async function loadTemplate() {
  if (templateImg) return templateImg
  const ext = (ASSETS.template.split('?')[0].match(/\.(png|jpe?g|webp)$/i) || [0, 'jpeg'])[1].toLowerCase()
  templateImg = await loadImage(await cached(ASSETS.template, 'template-9x16.' + ext))
  return templateImg
}

async function renderLock(opts) {
  const I = Object.assign({}, DEFAULTS, opts || {})
  const now = wita()
  const time = String(I.time || now.time).trim()
  const date = String(I.date || now.date).trim()

  await ensureFonts()
  if (EMOJI_TEST.test(I.title + I.artist + I.label)) await loadEmojiMap()

  const tpl = await loadTemplate()
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  const s = Math.max(W / tpl.width, H / tpl.height)
  ctx.drawImage(tpl, (W - tpl.width * s) / 2, (H - tpl.height * s) / 2, tpl.width * s, tpl.height * s)

  const clockSize = fitSize(ctx, L.clock.refText, 'bold', L.clock.refWidth)
  const topLine = ellipsize(ctx, [date, String(I.label || '').trim()].filter(Boolean).join(' '), L.date.maxW, L.date.size, 'bold')
  await drawCentered(ctx, topLine, L.cx, L.date.base, L.date.size, 'bold', COLOR.white)
  await drawCentered(ctx, time, L.cx, L.clock.base, clockSize, 'bold', COLOR.white)

  const cover = await loadSrc(I.cover, 'cover')
  if (cover) {
    const c = L.cover
    ctx.save()
    roundRect(ctx, c.x - 2, c.y - 2, c.w + 4, c.h + 4, c.r + 2)
    ctx.clip()
    drawCover(ctx, cover, c.x - 2, c.y - 2, c.w + 4, c.h + 4)
    ctx.restore()
  }

  const title = ellipsize(ctx, String(I.title), L.title.maxW, L.title.size, 'bold')
  const artist = ellipsize(ctx, String(I.artist), L.artist.maxW, L.artist.size, 'regular')
  await drawCentered(ctx, title, L.cx, L.title.base, L.title.size, 'bold', COLOR.white)
  await drawCentered(ctx, artist, L.cx, L.artist.base, L.artist.size, 'regular', COLOR.artist)

  if (I.debug) {
    ctx.save()
    ctx.strokeStyle = 'rgba(255,0,0,0.7)'
    ctx.lineWidth = 1
    for (const y of [L.date.base, L.clock.base, L.title.base, L.artist.base]) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }
    ctx.strokeRect(L.cover.x, L.cover.y, L.cover.w, L.cover.h)
    ctx.beginPath()
    ctx.moveTo(L.cx, 0)
    ctx.lineTo(L.cx, H)
    ctx.stroke()
    ctx.restore()
  }

  return canvas.encode('jpeg', 95)
}

export default async function lockmusic(options) {
  try {
    const opt = Object.assign({}, options || {})
    opt.title = String(opt.title == null ? '' : opt.title).trim().slice(0, MAX_TITLE)
    opt.artist = String(opt.artist == null ? '' : opt.artist).trim().slice(0, MAX_ARTIST)
    opt.label = String(opt.label == null ? '' : opt.label).trim().slice(0, MAX_LABEL)
    if (!opt.title) return { status: false, message: 'Judul lagu kosong' }
    if (!opt.artist) return { status: false, message: 'Nama artis kosong' }
    if (!opt.cover) return { status: false, message: 'Foto cover kosong' }

    const buffer = await renderLock(opt)
    return { status: true, buffer }
  } catch (e) {
    return { status: false, message: (e && e.message) || 'Proses gagal' }
  }
}
