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

import axios from 'axios'
import FormData from 'form-data'
import { fileTypeFromBuffer } from 'file-type'
import { readAlbumMessage } from './album.js'
import { prepareWAMessageMedia } from 'elyrine-baileys'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const esc = s => String(s ?? '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]))

export const haidarBase = () => (global.APIs?.haidarxd || 'https://api.haidarxd.my.id').replace(/\/+$/, '')
export const num = n => (n === undefined || n === null || n === '') ? '-' : Number(n).toLocaleString('id-ID')

export async function haidarGet(path, params = {}) {
  const base = haidarBase()
  const key = global.APIKeys?.[base]
  if (!key) throw new Error('API key HaidarApis belum diisi di config.js (global.APIKeys).')
  const { data, status } = await axios.get(base + path, {
    params,
    timeout: 45000,
    validateStatus: () => true,
    headers: { Authorization: `Bearer ${key}`, 'User-Agent': UA }
  })
  const ok = data && (data.status === 'success' || data.status === true) && data.data
  if (!ok) throw new Error(data?.message || data?.error || `API HaidarApis gagal (HTTP ${status}).`)
  return data.data
}

async function fetchImage(urls) {
  for (const u of [].concat(urls).filter(Boolean)) {
    try {
      const r = await axios.get(u, { responseType: 'arraybuffer', timeout: 20000, headers: { 'User-Agent': UA } })
      const b = Buffer.from(r.data)
      if (b.length > 1500) return b
    } catch { }
  }
  return null
}

async function toBanner(raw, w, h, title, sub) {
  const sharp = (await import('sharp')).default
  if (raw) {
    const bg = await sharp(raw).resize(w, h, { fit: 'cover' }).blur(40).modulate({ brightness: 0.7 }).toBuffer()
    const fg = await sharp(raw).resize(h - 40, h - 40, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
    return sharp(bg).composite([{ input: fg, gravity: 'center' }]).jpeg({ quality: 92 }).toBuffer()
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cb3837"/><stop offset="1" stop-color="#7a1f1f"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="46%" fill="#fff" font-family="sans-serif" font-size="96" font-weight="700" text-anchor="middle">${esc(title).slice(0, 28)}</text><text x="50%" y="62%" fill="#ffd9d9" font-family="sans-serif" font-size="44" text-anchor="middle">${esc(sub).slice(0, 48)}</text></svg>`
  return sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer()
}

export async function sendCard(conn, m, { url, title, description, caption, images, fallbackTitle, fallbackSub }) {
  const chat = m.chat
  const W = 1280, H = 720
  try {
    const banner = await toBanner(await fetchImage(images), W, H, fallbackTitle || title, fallbackSub || description)
    const { imageMessage: image } = await prepareWAMessageMedia({ image: banner }, { upload: conn.waUploadToServer, mediaTypeOverride: 'thumbnail-link', jid: chat, newsletter: String(chat).endsWith('@newsletter') })
    image.width = W
    image.height = H
    return await conn.sendMessage(chat, {
      text: `${url}\n\n${caption}`,
      linkPreview: {
        'canonical-url': url,
        canonicalUrl: url,
        'matched-text': url,
        matchedText: url,
        title,
        description,
        previewType: 0,
        jpegThumbnail: image.jpegThumbnail,
        highQualityThumbnail: image,
        linkPreviewMetadata: { linkMediaDuration: 0, socialMediaPostType: 0 }
      }
    }, { quoted: m })
  } catch (err) {
    console.error('[HAIDAR] kartu HQ gagal, fallback:', err?.message || err)
    try {
      const thumbnail = await toBanner(await fetchImage(images), 640, 360, fallbackTitle || title, fallbackSub || description)
      return await conn.sendLinkPreview(chat, { text: caption, url, title, description, thumbnail, thumbnailSize: 320 })
    } catch (err2) {
      console.error('[HAIDAR] fallback gagal, kirim teks:', err2?.message || err2)
      return conn.sendMessage(chat, { text: `${url}\n\n${caption}` }, { quoted: m })
    }
  }
}

const auth = () => {
  const base = haidarBase()
  const key = global.APIKeys?.[base]
  if (!key) throw new Error('API key HaidarApis belum diisi di config.js (global.APIKeys).')
  return { base, headers: { Authorization: `Bearer ${key}`, 'User-Agent': UA } }
}

export async function haidarPostForm(path, fields = {}, files = []) {
  const { base, headers } = auth()
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) form.append(k, String(v))
  for (const [i, f] of files.entries()) {
    const ft = await fileTypeFromBuffer(f).catch(() => null)
    const ext = ft?.ext || 'jpg'
    form.append('image', f, { filename: `foto${i + 1}.${ext}`, contentType: ft?.mime || 'image/jpeg' })
  }
  const { data, status } = await axios.post(base + path, form, {
    timeout: 120000,
    maxBodyLength: Infinity,
    validateStatus: () => true,
    headers: { ...headers, ...form.getHeaders() }
  })
  const ok = data && (data.status === 'success' || data.status === true) && data.data
  if (!ok) throw new Error(data?.message || data?.error || `API HaidarApis gagal (HTTP ${status}).`)
  return data.data
}

const isImg = t => t && /^image\//i.test(t.mimetype || t.msg?.mimetype || '') && typeof t.download === 'function'

export async function pickImages(m, max = 10) {
  const out = []
  for (const t of [m, m.quoted]) {
    if (isImg(t)) {
      try { out.push(await t.download()) } catch { }
    }
  }
  if (out.length) return out.slice(0, max)
  try {
    const album = await readAlbumMessage(m, { type: 'image' })
    if (album?.found && album.images.length) return album.images.slice(0, max)
  } catch (e) {
    console.error('[HAIDAR] readAlbumMessage error:', e?.message || e)
  }
  return []
}

export function findVideo(obj, depth = 0) {
  if (!obj || depth > 5) return null
  if (typeof obj === 'string') return /^https?:\/\/\S+$/i.test(obj) && /(\.mp4|\.mov|\.webm|video)/i.test(obj) ? obj : null
  if (typeof obj !== 'object') return null
  for (const k of ['video', 'video_url', 'url', 'result', 'output', 'raw']) {
    const r = findVideo(obj[k], depth + 1)
    if (r) return r
  }
  for (const v of Object.values(obj)) {
    const r = findVideo(v, depth + 1)
    if (r) return r
  }
  return null
}

export const taskStatus = d => String(d?.status ?? d?.raw?.status ?? '').toLowerCase()

export async function downloadBuffer(url, max = 60 * 1024 * 1024) {
  const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 120000, maxContentLength: max, maxBodyLength: max, headers: { 'User-Agent': UA } })
  return Buffer.from(r.data)
}
