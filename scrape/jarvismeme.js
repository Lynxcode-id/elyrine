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
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ASSET_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'store', 'jarvismeme')
const BG_URL = 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/Image/jarvismeme.png'
const FONT_URL = 'https://cdn.jsdelivr.net/gh/adrienverge/copr-some-nice-fonts@master/ArialBd.ttf'
const BG_PATH = path.join(ASSET_DIR, 'jarvismeme.png')
const FONT_PATH = path.join(ASSET_DIR, 'ArialBd.ttf')
const CANVAS_SIZE = { width: 735, height: 678 }
const SAFE_ZONE = { x: 20, y: 3, w: 695, h: 237 }
const START_FONT_SIZE = 100
const MAX_CHARS = 200

let assetsPromise = null

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } })
  if (!res.ok) throw new Error('Gagal mengunduh aset jarvismeme (' + res.status + ')')
  await writeFile(dest, Buffer.from(await res.arrayBuffer()))
}

function prepareAssets() {
  if (assetsPromise) return assetsPromise
  assetsPromise = (async () => {
    mkdirSync(ASSET_DIR, { recursive: true })
    if (!existsSync(BG_PATH)) await download(BG_URL, BG_PATH)
    try {
      if (!existsSync(FONT_PATH)) await download(FONT_URL, FONT_PATH)
      GlobalFonts.registerFromPath(FONT_PATH, 'ARIALBD')
    } catch (e) {
      console.error('[jarvismeme] font gagal dimuat:', e.message)
    }
  })().catch(err => {
    assetsPromise = null
    throw err
  })
  return assetsPromise
}

function layoutLines(ctx, text, maxWidth) {
  const lines = []
  for (const paragraph of text.split('\n')) {
    let current = ''
    for (const word of paragraph.split(' ')) {
      const test = current ? current + ' ' + word : word
      if (ctx.measureText(test).width <= maxWidth) {
        current = test
      } else if (current) {
        lines.push(current)
        current = word
        if (ctx.measureText(word).width > maxWidth) return null
      } else {
        return null
      }
    }
    lines.push(current)
  }
  return lines
}

function drawTextInZone(ctx, text, zone) {
  let fontSize = START_FONT_SIZE
  let lines = []
  let lh = fontSize * 1.2

  while (fontSize > 10) {
    lh = fontSize * 1.2
    ctx.font = '500 ' + fontSize + 'px ARIALBD, sans-serif'
    const result = layoutLines(ctx, text, zone.w)
    if (result) {
      lines = result
      if (lines.length * lh <= zone.h) break
    }
    fontSize -= 2
  }

  if (!lines.length) lines = [text]

  ctx.font = '500 ' + fontSize + 'px ARIALBD, sans-serif'
  ctx.fillStyle = '#111111'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  ctx.save()
  ctx.beginPath()
  ctx.rect(zone.x, zone.y, zone.w, zone.h)
  ctx.clip()
  const drawX = zone.x + zone.w / 2
  const startY = zone.y + zone.h / 2 - (lines.length * lh) / 2 + lh / 2
  lines.forEach((line, i) => ctx.fillText(line, drawX, startY + i * lh))
  ctx.restore()
}

export default async function jarvismeme(text) {
  try {
    const clean = String(text == null ? '' : text).replace(/[ \t]+/g, ' ').trim().slice(0, MAX_CHARS)
    if (!clean) return { status: false, message: 'Teks kosong' }

    await prepareAssets()

    const canvas = createCanvas(CANVAS_SIZE.width, CANVAS_SIZE.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(await loadImage(BG_PATH), 0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height)
    drawTextInZone(ctx, clean, SAFE_ZONE)

    return { status: true, buffer: await canvas.encode('png') }
  } catch (e) {
    return { status: false, message: (e && e.message) || 'Proses gagal' }
  }
}
