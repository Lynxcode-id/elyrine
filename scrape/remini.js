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
 * Name : Remini
 * Creator : Razeerh (adaptasi ERINE-AI)
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Type : Scraper
 * Method : POST (DeepAI, opsional) / lokal (sharp)
 * Description : meningkatkan/memperbaiki kualitas foto (upscale + sharpen)
 *
 * Pemakaian:
 *   const { default: remini } = await import('./scrape/remini.js')
 *   const res = await remini(buffer)        // Buffer | path file
 *   res => { status, buffer, engine, original_resolution, output_resolution,
 *            original_size, output_size, processing_time, message }
 *
 * Engine:
 *   1. DeepAI torch-srgan  → aktif bila process.env.REMINI_DEEPAI_KEY / global.deepaiKey diisi
 *   2. Lokal (sharp)       → fallback otomatis kalau engine 1 gagal / tidak ada key
 */

import axios from 'axios'
import FormData from 'form-data'
import sharp from 'sharp'
import fs from 'fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const DEEPAI_URL = 'https://api.deepai.org/api/torch-srgan'
const MAX_SIDE = 8000
const MAX_INPUT = 30 * 1024 * 1024

const fmtBytes = n => {
  const b = Number(n) || 0
  return b >= 1048576 ? `${(b / 1048576).toFixed(2)}MB` : `${(b / 1024).toFixed(1)}KB`
}

async function deepai(buffer, apiKey) {
  const form = new FormData()
  form.append('image', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' })

  const res = await axios.post(DEEPAI_URL, form, {
    headers: { ...form.getHeaders(), 'Api-Key': apiKey, 'User-Agent': UA },
    timeout: 180000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    validateStatus: () => true
  })

  let d = res.data
  if (typeof d === 'string') { try { d = JSON.parse(d) } catch { d = null } }
  if (!d?.output_url) throw new Error(d?.err || d?.status || `DeepAI gagal (HTTP ${res.status})`)

  const bin = await axios.get(d.output_url, { responseType: 'arraybuffer', timeout: 120000, headers: { 'User-Agent': UA } })
  return Buffer.from(bin.data)
}

async function local(buffer) {
  const meta = await sharp(buffer, { limitInputPixels: false }).metadata()
  if (!meta.width || !meta.height) throw new Error('Dimensi gambar tidak valid')

  const scale = Math.min(2, MAX_SIDE / Math.max(meta.width, meta.height))
  const w = Math.max(1, Math.round(meta.width * scale))
  const h = Math.max(1, Math.round(meta.height * scale))

  return sharp(buffer, { limitInputPixels: false })
    .rotate()
    .resize(w, h, { kernel: 'lanczos3' })
    .sharpen({ sigma: 1.2, m1: 1.0, m2: 2.0 })
    .modulate({ saturation: 1.1, brightness: 1.02 })
    .linear(1.06, -3)
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer()
}

/**
 * @param {Buffer|string} input Buffer foto atau path file
 */
export default async function remini(input) {
  const start = Date.now()
  try {
    let buffer
    if (Buffer.isBuffer(input)) buffer = input
    else if (typeof input === 'string' && fs.existsSync(input)) buffer = fs.readFileSync(input)
    else return { status: false, message: 'Format input tidak didukung (pakai Buffer atau path file)' }

    if (!buffer.length) return { status: false, message: 'Foto kosong' }
    if (buffer.length > MAX_INPUT) return { status: false, message: 'Ukuran foto maksimal 30 MB' }

    const inMeta = await sharp(buffer, { limitInputPixels: false }).metadata().catch(() => null)
    if (!inMeta?.width) return { status: false, message: 'File bukan gambar yang valid' }

    let out = null
    let engine = 'local'
    const key = process.env.REMINI_DEEPAI_KEY || global.deepaiKey

    if (key) {
      try {
        out = await deepai(buffer, key)
        engine = 'deepai'
      } catch (e) {
        console.error('[REMINI] deepai gagal -> fallback lokal:', e?.message || e)
      }
    }

    if (!out) out = await local(buffer)

    const outMeta = await sharp(out).metadata()
    return {
      status: true,
      engine,
      buffer: out,
      original_resolution: `${inMeta.width}x${inMeta.height}`,
      output_resolution: `${outMeta.width}x${outMeta.height}`,
      original_size: fmtBytes(buffer.length),
      output_size: fmtBytes(out.length),
      processing_time: `${((Date.now() - start) / 1000).toFixed(1)}s`
    }
  } catch (e) {
    return { status: false, message: e?.message || 'Proses gagal' }
  }
}
