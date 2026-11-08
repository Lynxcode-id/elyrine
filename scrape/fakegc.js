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

/**
 * ✧ Name     : fake gc ios
 * ✧ Creator  : Rin imup
 * ✧ Category : Canvas
 * ✧ Sumber   : https://whatsapp.com/channel/0029Vb6EHtR5Ui2gHMW9zX2x
 * (credit asli)
 */
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
import { existsSync, mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import axios from 'axios'

const ASSET_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'store', 'fakegc')
const BG_PATH = path.join(ASSET_DIR, 'bg_fakegc.jpg')
const FONT_PATH = path.join(ASSET_DIR, 'Inter.woff2')
const BG_URL = 'https://raw.githubusercontent.com/ryyntwx/Image-rinn/refs/heads/main/IMG-20260825-WA0312.jpg'
const FONT_URL = 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2'

const MAX_NAME_WIDTH = 900

let assetsPromise = null

async function download(url, dest) {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
  await writeFile(dest, Buffer.from(res.data))
}

function prepareAssets() {
  if (assetsPromise) return assetsPromise
  assetsPromise = (async () => {
    mkdirSync(ASSET_DIR, { recursive: true })
    if (!existsSync(BG_PATH)) await download(BG_URL, BG_PATH)
    try {
      if (!existsSync(FONT_PATH)) await download(FONT_URL, FONT_PATH)
      GlobalFonts.registerFromPath(FONT_PATH, 'Inter')
    } catch (e) {
      console.error('[fakegc] font Inter gagal dimuat:', e.message)
    }
  })().catch(err => {
    assetsPromise = null
    throw err
  })
  return assetsPromise
}

export default async function fakegc(ppBuffer, namaGrup, anggota) {
  try {
    const nama = String(namaGrup || '').trim()
    const member = String(anggota || '').trim()
    if (!Buffer.isBuffer(ppBuffer) || !ppBuffer.length) return { status: false, message: 'Foto tidak valid' }
    if (!nama || !member) return { status: false, message: 'Nama grup dan jumlah anggota wajib diisi' }

    await prepareAssets()

    const bgImg = await loadImage(BG_PATH)
    const ppImg = await loadImage(ppBuffer)

    const canvas = createCanvas(bgImg.width, bgImg.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)

    const cx = 538
    const cy = 362
    const r = 162
    const side = Math.min(ppImg.width, ppImg.height)
    const sx = (ppImg.width - side) / 2
    const sy = (ppImg.height - side) / 2
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2, true)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(ppImg, sx, sy, side, side, cx - r, cy - r, r * 2, r * 2)
    ctx.restore()

    let nameSize = 64
    ctx.font = `900 ${nameSize}px Inter, sans-serif`
    while (nameSize > 24 && ctx.measureText(nama).width > MAX_NAME_WIDTH) {
      nameSize -= 2
      ctx.font = `900 ${nameSize}px Inter, sans-serif`
    }
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(nama, 540, 602)

    const prefixText = 'Grup • '
    ctx.font = '500 37px Inter, sans-serif'
    const prefixWidth = ctx.measureText(prefixText).width
    const totalWidth = prefixWidth + ctx.measureText(member).width
    const startX = 548 - totalWidth / 2

    ctx.textAlign = 'left'
    ctx.fillStyle = '#8E8E93'
    ctx.fillText(prefixText, startX, 684)
    ctx.fillStyle = '#34C759'
    ctx.fillText(member, startX + prefixWidth, 684)

    return { status: true, buffer: await canvas.encode('png') }
  } catch (e) {
    return { status: false, message: (e && e.message) || 'Proses gagal' }
  }
}
