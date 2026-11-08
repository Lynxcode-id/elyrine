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
import { existsSync, mkdirSync } from 'node:fs'
import { writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ASSET_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'store', 'igqc')
const BG_URL = 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/Image/igqc.png'
const BG_PATH = path.join(ASSET_DIR, 'igqc.png')
const FONT_URL = 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2'
const FONT_PATH = path.join(ASSET_DIR, 'Inter-Regular.ttf')
const EMOJI_URL = 'https://media.githubusercontent.com/media/Ditzzx-vibecoder/entahlah/main/emoji-apple.json'
const EMOJI_PATH = path.join(ASSET_DIR, 'emoji-apple-image.json')
const CANVAS_SIZE = { width: 878, height: 1791 }
const MAX_CHARS = 500
const EMOJI_REGEX = /(\p{Emoji_Modifier_Base}\p{Emoji_Modifier}|\p{Emoji_Presentation}\uFE0F?|\p{Emoji}\uFE0F|[\u{1F1E0}-\u{1F1FF}]{2}|\p{Extended_Pictographic}\uFE0F?)/gu

let assetsPromise = null
let emojiMap = null
const emojiCache = new Map()

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } })
  if (!res.ok) throw new Error('Gagal mengunduh aset igqc (' + res.status + ')')
  const buf = Buffer.from(await res.arrayBuffer())
  if (dest) await writeFile(dest, buf)
  return buf
}

function prepareAssets() {
  if (assetsPromise) return assetsPromise
  assetsPromise = (async () => {
    mkdirSync(ASSET_DIR, { recursive: true })
    if (!existsSync(BG_PATH)) await download(BG_URL, BG_PATH)
    try {
      if (!existsSync(FONT_PATH)) await download(FONT_URL, FONT_PATH)
      GlobalFonts.registerFromPath(FONT_PATH, 'InterRegular')
    } catch (e) {
      console.error('[igqc] font gagal dimuat:', e.message)
    }
    try {
      if (!existsSync(EMOJI_PATH)) await download(EMOJI_URL, EMOJI_PATH)
      emojiMap = JSON.parse(await readFile(EMOJI_PATH, 'utf-8'))
    } catch (e) {
      console.error('[igqc] emoji gagal dimuat:', e.message)
      emojiMap = {}
    }
  })().catch(err => {
    assetsPromise = null
    throw err
  })
  return assetsPromise
}

const toHex = e => [...e].map(c => c.codePointAt(0).toString(16).padStart(4, '0')).join('-')

async function getEmojiImage(emoji) {
  if (emojiCache.has(emoji)) return emojiCache.get(emoji)
  const base = toHex(emoji)
  const stripped = base.replace(/-fe0f/gi, '')
  const variants = [base, stripped, stripped + '-fe0f', base.toUpperCase(), stripped.toUpperCase(), stripped.toUpperCase() + '-FE0F']
  const key = variants.find(v => emojiMap && emojiMap[v])
  if (!key) return null
  const img = await loadImage(Buffer.from(emojiMap[key], 'base64'))
  emojiCache.set(emoji, img)
  return img
}

async function drawAppleEmoji(ctx, emoji, x, y, size) {
  const img = await getEmojiImage(emoji)
  if (!img) return ctx.fillText(emoji, x, y)
  ctx.drawImage(img, x - size / 2, y - size / 2, size, size)
}

const isEmoji = part => { EMOJI_REGEX.lastIndex = 0; const r = EMOJI_REGEX.test(part); EMOJI_REGEX.lastIndex = 0; return r }

function measureTextCustom(ctx, text, fontSize) {
  let w = 0
  for (const part of text.split(EMOJI_REGEX)) {
    if (!part) continue
    w += isEmoji(part) ? fontSize * 1.05 : ctx.measureText(part).width
  }
  return w
}

async function drawTextWithEmojis(ctx, text, x, y, fontSize) {
  let cx = x
  for (const part of text.split(EMOJI_REGEX)) {
    if (!part) continue
    if (isEmoji(part)) {
      const s = fontSize * 1.05
      await drawAppleEmoji(ctx, part, cx + s / 2, y, s)
      cx += s
    } else {
      ctx.fillText(part, cx, y)
      cx += ctx.measureText(part).width
    }
  }
}

function wrapText(ctx, text, maxWidth, fontSize) {
  ctx.font = `${fontSize}px InterRegular`
  const words = text.split(' ')
  const lines = []
  let cur = ''
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    if (word.includes('\n')) {
      const parts = word.split('\n')
      for (let j = 0; j < parts.length; j++) {
        const test = cur + (cur ? ' ' : '') + parts[j]
        if (measureTextCustom(ctx, test, fontSize) > maxWidth && cur) { lines.push(cur); cur = parts[j] } else cur = test
        if (j < parts.length - 1) { lines.push(cur); cur = '' }
      }
      continue
    }
    const test = cur + (cur ? ' ' : '') + word
    if (measureTextCustom(ctx, test, fontSize) > maxWidth && i > 0) { lines.push(cur); cur = word } else cur = test
  }
  if (cur) lines.push(cur)
  return lines
}

function autoTime() {
  const d = new Date()
  const day = new Intl.DateTimeFormat('id-ID', { weekday: 'short', timeZone: 'Asia/Jakarta' }).format(d).replace('.', '').toUpperCase().slice(0, 3)
  const hm = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).format(d).replace(':', '.')
  return `${day} ${hm}`
}

async function toImage(src) {
  if (typeof src === 'string' && /^https?:\/\//i.test(src)) src = await download(src)
  return loadImage(src)
}

export default async function igqc(txt, img, timeStr) {
  try {
    const text = String(txt == null ? '' : txt).replace(/[ \t]+/g, ' ').trim().slice(0, MAX_CHARS)
    const hasTxt = !!text
    const hasImg = !!img
    if (!hasTxt && !hasImg) return { status: false, message: 'Teks dan gambar kosong' }

    await prepareAssets()

    const canvas = createCanvas(CANVAS_SIZE.width, CANVAS_SIZE.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(await loadImage(BG_PATH), 0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height)

    const menuBoxTop = 985
    ctx.fillStyle = '#a1a4a9'
    ctx.font = '20px InterRegular'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(String(timeStr || autoTime()).slice(0, 20), 72, menuBoxTop + 35)

    const maxWidthLimit = 530
    const maxImgWidthLimit = 420
    const minBubbleWidth = 280
    const paddingX = 30
    const paddingY = 22
    const fixedX = 38
    const bubbleBottom = menuBoxTop - 20
    const emCardH = 104
    const minEmCardY = 60

    const imgObj = hasImg ? await toImage(img) : null

    let chatFontSize = 30
    const minFontSize = 12
    let imageScale = 1.0
    let chatLines = [], lineHeight = 0, textBubbleH = 0
    let imgDrawW = 0, imgDrawH = 0
    let textBubbleTop = 0, imgBubbleTop = 0, emCardY = 0, topmostY = 0

    while (chatFontSize >= minFontSize) {
      if (hasTxt) {
        ctx.font = `${chatFontSize}px InterRegular`
        chatLines = wrapText(ctx, text, maxWidthLimit, chatFontSize)
        lineHeight = chatFontSize + 14
        textBubbleH = ((chatLines.length - 1) * lineHeight) + chatFontSize + (paddingY * 2)
        textBubbleTop = bubbleBottom - textBubbleH
      }
      if (hasImg) {
        const aspect = imgObj.width / imgObj.height
        const baseW = Math.min(Math.max(imgObj.width, minBubbleWidth), maxImgWidthLimit)
        imgDrawW = Math.round(baseW * imageScale)
        imgDrawH = Math.round(imgDrawW / aspect)
        imgBubbleTop = (hasTxt ? textBubbleTop - 12 : bubbleBottom) - imgDrawH
      }
      topmostY = hasImg ? imgBubbleTop : textBubbleTop
      emCardY = topmostY - emCardH - 20
      if (emCardY >= minEmCardY) break

      if (hasTxt) chatFontSize -= 1
      else {
        imageScale -= 0.05
        if (imageScale < 0.3) break
      }
    }

    if (hasImg) {
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(fixedX, imgBubbleTop, imgDrawW, imgDrawH, [24])
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(imgObj, fixedX, imgBubbleTop, imgDrawW, imgDrawH)
      ctx.restore()
    }

    if (hasTxt) {
      ctx.font = `${chatFontSize}px InterRegular`
      let longestW = 0
      chatLines.forEach(l => { longestW = Math.max(longestW, measureTextCustom(ctx, l.trim(), chatFontSize)) })
      const bubbleW = Math.max(longestW + paddingX * 2, 180)
      const top = textBubbleTop
      const h = textBubbleH
      const rad = 25

      ctx.fillStyle = '#262628'
      ctx.beginPath()
      ctx.moveTo(fixedX + 8, top)
      ctx.lineTo(fixedX + bubbleW - rad, top)
      ctx.quadraticCurveTo(fixedX + bubbleW, top, fixedX + bubbleW, top + rad)
      ctx.lineTo(fixedX + bubbleW, top + h - rad)
      ctx.quadraticCurveTo(fixedX + bubbleW, top + h, fixedX + bubbleW - rad, top + h)
      ctx.lineTo(fixedX + rad, top + h)
      ctx.quadraticCurveTo(fixedX, top + h, fixedX, top + h - rad)
      ctx.lineTo(fixedX, top + 8)
      ctx.quadraticCurveTo(fixedX, top, fixedX + 8, top)
      ctx.closePath()
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(fixedX + 4, top + 20)
      ctx.quadraticCurveTo(fixedX - 10, top + 4, fixedX - 16, top)
      ctx.quadraticCurveTo(fixedX - 2, top, fixedX + 14, top + 2)
      ctx.closePath()
      ctx.fill()

      ctx.save()
      ctx.fillStyle = '#eff0f4'
      ctx.font = `${chatFontSize}px InterRegular`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      for (let i = 0; i < chatLines.length; i++) {
        const lineY = top + paddingY + i * lineHeight + chatFontSize / 2
        await drawTextWithEmojis(ctx, chatLines[i].trim(), fixedX + paddingX, lineY, chatFontSize)
      }
      ctx.restore()
    }

    const emojis = ['❤️', '😂', '😮', '😢', '😡', '👍']
    const emojiSize = 56
    const emCardW = 600
    const emCardX = fixedX - 6

    ctx.fillStyle = '#222328'
    ctx.beginPath()
    ctx.roundRect(emCardX, emCardY, emCardW, emCardH, [emCardH / 2])
    ctx.fill()

    const startX = emCardX + 52
    const spacingX = 80
    const emojiCY = emCardY + emCardH / 2
    for (let i = 0; i < emojis.length; i++) {
      await drawAppleEmoji(ctx, emojis[i], startX + i * spacingX, emojiCY, emojiSize)
    }

    ctx.fillStyle = '#8e8e93'
    ctx.font = '42px InterRegular'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('+', startX + 6 * spacingX - 2, emCardY + emCardH / 2 - 2)

    return { status: true, buffer: await canvas.encode('png') }
  } catch (e) {
    return { status: false, message: (e && e.message) || 'Proses gagal' }
  }
}
