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

const ASSET_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'store', 'twobuttons')
const BG_URL = 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/Image/Two-Buttons.jpg'
const BG_PATH = path.join(ASSET_DIR, 'Two-Buttons.jpg')
const FONTS = [
  { family: 'ARIAL', url: 'https://cdn.jsdelivr.net/gh/wolfsonliu/web_typography/fonts/arial.ttf', file: 'arial.ttf' },
  { family: 'impact', url: 'https://cdn.jsdelivr.net/gh/wolfsonliu/web_typography/fonts/impact.ttf', file: 'impact.ttf' }
]
const CANVAS_SIZE = { width: 600, height: 908 }
const MAX_CHARS = 100

let assetsPromise = null

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } })
  if (!res.ok) throw new Error('Gagal mengunduh aset twobuttons (' + res.status + ')')
  await writeFile(dest, Buffer.from(await res.arrayBuffer()))
}

function prepareAssets() {
  if (assetsPromise) return assetsPromise
  assetsPromise = (async () => {
    mkdirSync(ASSET_DIR, { recursive: true })
    if (!existsSync(BG_PATH)) await download(BG_URL, BG_PATH)
    for (const f of FONTS) {
      try {
        const p = path.join(ASSET_DIR, f.file)
        if (!existsSync(p)) await download(f.url, p)
        GlobalFonts.registerFromPath(p, f.family)
      } catch (e) {
        console.error('[twobuttons] font gagal dimuat:', e.message)
      }
    }
  })().catch(err => {
    assetsPromise = null
    throw err
  })
  return assetsPromise
}

function drawTextInSafeZone(ctx, text, zone, initialFontSize, fontFamily, outlineColor, outlineWidth) {
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
  out.forEach((l, i) => {
    if (outlineColor) {
      ctx.strokeStyle = outlineColor
      ctx.lineWidth = outlineWidth * (fontSize / initialFontSize)
      ctx.strokeText(l, drawX, startY + i * lh)
    }
    ctx.fillText(l, drawX, startY + i * lh)
  })
  ctx.restore()
}

export default async function twobuttons(teks1, teks2, teks3) {
  try {
    const clean = v => String(v == null ? '' : v).replace(/[ \t]+/g, ' ').trim().slice(0, MAX_CHARS)
    const t1 = clean(teks1), t2 = clean(teks2), t3 = clean(teks3)
    if (!t1 || !t2 || !t3) return { status: false, message: 'Teks kosong' }

    await prepareAssets()

    const canvas = createCanvas(CANVAS_SIZE.width, CANVAS_SIZE.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(await loadImage(BG_PATH), 0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height)
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'

    ctx.save()
    ctx.translate(153, 135)
    ctx.rotate(-0.261799)
    ctx.translate(-153, -135)
    ctx.fillStyle = '#111111'
    drawTextInSafeZone(ctx, t1, { x: 69, y: 108, w: 168, h: 54 }, 60, 'ARIAL, sans-serif')
    ctx.restore()

    ctx.save()
    ctx.translate(348, 97.5)
    ctx.rotate(-0.191986)
    ctx.translate(-348, -97.5)
    ctx.fillStyle = '#111111'
    drawTextInSafeZone(ctx, t2, { x: 275, y: 76, w: 146, h: 43 }, 50, 'ARIAL, sans-serif')
    ctx.restore()

    ctx.save()
    ctx.fillStyle = '#ffffff'
    drawTextInSafeZone(ctx, t3, { x: 28, y: 796, w: 542, h: 66 }, 60, 'impact, sans-serif', '#000000', 8)
    ctx.restore()

    return { status: true, buffer: await canvas.encode('png') }
  } catch (e) {
    return { status: false, message: (e && e.message) || 'Proses gagal' }
  }
}
