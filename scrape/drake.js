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

const ASSET_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'store', 'drake')
const BG_URL = 'https://imgflip.com/s/meme/Drake-Hotline-Bling.jpg'
const BG_PATH = path.join(ASSET_DIR, 'Drake-Hotline-Bling.jpg')
const FONT_URL = 'https://cdn.jsdelivr.net/gh/wolfsonliu/web_typography/fonts/arial.ttf'
const FONT_PATH = path.join(ASSET_DIR, 'arial.ttf')
const CANVAS_SIZE = { width: 1200, height: 1200 }
const ZONE_1 = { x: 615, y: 22, w: 571, h: 564 }
const ZONE_2 = { x: 615, y: 623, w: 571, h: 561 }
const MAX_CHARS = 150

let assetsPromise = null

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } })
  if (!res.ok) throw new Error('Gagal mengunduh aset drake (' + res.status + ')')
  await writeFile(dest, Buffer.from(await res.arrayBuffer()))
}

function prepareAssets() {
  if (assetsPromise) return assetsPromise
  assetsPromise = (async () => {
    mkdirSync(ASSET_DIR, { recursive: true })
    if (!existsSync(BG_PATH)) await download(BG_URL, BG_PATH)
    try {
      if (!existsSync(FONT_PATH)) await download(FONT_URL, FONT_PATH)
      GlobalFonts.registerFromPath(FONT_PATH, 'ARIAL')
    } catch (e) {
      console.error('[drake] font gagal dimuat:', e.message)
    }
  })().catch(err => {
    assetsPromise = null
    throw err
  })
  return assetsPromise
}

function drawTextInSafeZone(ctx, text, zone, initialFontSize, fontFamily) {
  let fontSize = initialFontSize
  let lh = fontSize * 1.2
  let out = []
  const minSize = 10

  while (fontSize >= minSize) {
    ctx.font = `400 ${fontSize}px ${fontFamily}`
    lh = fontSize * 1.2
    out = []
    text.split('\n').forEach(p => {
      let cur = ''
      p.split(' ').forEach(w => {
        const t = cur ? cur + ' ' + w : w
        if (ctx.measureText(t).width > zone.w && cur) { out.push(cur); cur = w } else cur = t
      })
      out.push(cur)
    })
    const fitsWidth = out.every(l => ctx.measureText(l).width <= zone.w)
    if (fitsWidth && out.length * lh <= zone.h) break
    fontSize -= 2
  }

  if (fontSize < minSize) {
    fontSize = minSize
    ctx.font = `400 ${fontSize}px ${fontFamily}`
    lh = fontSize * 1.2
  }

  const drawX = zone.x + zone.w / 2
  ctx.save()
  ctx.beginPath()
  ctx.rect(zone.x, zone.y, zone.w, zone.h)
  ctx.clip()
  const startY = zone.y + zone.h / 2 - (out.length * lh) / 2 + lh / 2
  out.forEach((l, i) => ctx.fillText(l, drawX, startY + i * lh))
  ctx.restore()
}

export default async function drake(teks1, teks2) {
  try {
    const clean = v => String(v == null ? '' : v).replace(/[ \t]+/g, ' ').trim().slice(0, MAX_CHARS)
    const t1 = clean(teks1), t2 = clean(teks2)
    if (!t1 || !t2) return { status: false, message: 'Teks kosong' }

    await prepareAssets()

    const canvas = createCanvas(CANVAS_SIZE.width, CANVAS_SIZE.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(await loadImage(BG_PATH), 0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height)
    ctx.fillStyle = '#111111'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    drawTextInSafeZone(ctx, t1, ZONE_1, 110, 'ARIAL, sans-serif')
    drawTextInSafeZone(ctx, t2, ZONE_2, 110, 'ARIAL, sans-serif')

    return { status: true, buffer: await canvas.encode('png') }
  } catch (e) {
    return { status: false, message: (e && e.message) || 'Proses gagal' }
  }
}
