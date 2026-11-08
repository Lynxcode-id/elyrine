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

import axios from 'axios'
import { fileTypeFromBuffer } from 'file-type'

const DEFAULT_API = 'https://api.theresav.eu'
const API_PATH = '/api/download/pinterest'
const TIMEOUT = 180000
const MAX_SIZE = 150 * 1024 * 1024
const MAX_MEDIA = 30

function getApiConfig() {
  const baseURL = String(global.APIs?.theresav || DEFAULT_API).replace(/\/+$/, '')
  const apikey = global.APIKeys?.[baseURL] || global.APIKeys?.[DEFAULT_API]
  if (!apikey) throw new Error(`API key tidak ditemukan. Periksa global.APIKeys['${baseURL}'] di config.js.`)
  return { baseURL, apikey }
}

function extractPinterestUrl(text = '') {
  const match = String(text).match(/https?:\/\/[^\s]+/i)
  if (!match) return null
  const value = match[0].replace(/[)\]}>,.]+$/, '')
  try {
    const host = new URL(value).hostname.toLowerCase()
    if (host === 'pin.it' || host.endsWith('.pin.it') || host === 'pinterest.com' || host.endsWith('.pinterest.com') || /^pinterest\.[a-z.]+$/i.test(host)) return value
  } catch {}
  return null
}

function collectMedia(data) {
  const found = []
  const seen = new Set()
  const urlKeys = new Set(['download_url', 'downloadurl', 'video_url', 'video', 'image_url', 'image', 'url', 'src', 'file_url'])
  const containerKeys = new Set(['result', 'data', 'downloads', 'download_urls', 'items', 'media', 'medias', 'images', 'videos', 'photos'])

  const visit = (value, hint = '') => {
    if (!value) return
    if (typeof value === 'string') {
      if (/^https?:\/\//i.test(value) && !seen.has(value)) {
        seen.add(value)
        found.push({ url: value, type: hint })
      }
      return
    }
    if (Array.isArray(value)) {
      for (const item of value) visit(item, hint)
      return
    }
    if (typeof value !== 'object') return

    const typeHint = String(value.type || value.media_type || value.kind || hint || '').toLowerCase()
    for (const key of urlKeys) {
      const url = value[key]
      if (typeof url !== 'string' || !/^https?:\/\//i.test(url) || seen.has(url)) continue
      seen.add(url)
      const keyType = key.includes('video') ? 'video' : key.includes('image') || key === 'photo' ? 'image' : typeHint
      found.push({ url, type: keyType })
    }
    for (const [key, child] of Object.entries(value)) {
      if (containerKeys.has(key.toLowerCase()) && child && typeof child === 'object') {
        const childHint = key.toLowerCase() === 'videos' ? 'video' : key.toLowerCase() === 'images' || key.toLowerCase() === 'photos' ? 'image' : typeHint
        visit(child, childHint)
      }
    }
  }

  visit(data, String(data?.type || '').toLowerCase())
  return found.slice(0, MAX_MEDIA)
}

async function fetchMedia(item) {
  const response = await axios.get(item.url, {
    responseType: 'arraybuffer',
    timeout: TIMEOUT,
    maxContentLength: MAX_SIZE,
    maxBodyLength: MAX_SIZE,
    headers: { Accept: 'image/*, video/*, */*' }
  })
  const buffer = Buffer.from(response.data)
  if (!buffer.length) throw new Error('Media Pinterest kosong.')

  const detected = await fileTypeFromBuffer(buffer).catch(() => null)
  const headerMime = String(response.headers?.['content-type'] || '').split(';')[0].trim().toLowerCase()
  const mime = detected?.mime || (headerMime.startsWith('image/') || headerMime.startsWith('video/') ? headerMime : '')
  const type = mime.startsWith('video/') ? 'video' : mime.startsWith('image/') ? 'image' : item.type

  if (type === 'image') return { image: buffer, mimetype: mime || 'image/jpeg' }
  if (type === 'video') return { video: buffer, mimetype: mime || 'video/mp4' }
  throw new Error('Tipe media Pinterest tidak dikenali.')
}

const handler = async (m, { conn, text, args, usedPrefix, command }) => {
  const input = String(text || args?.join(' ') || '').trim()
  const url = extractPinterestUrl(input)
  if (!url) throw `Masukkan link Pinterest yang valid.\nContoh: *${usedPrefix || '.'}${command || 'pin'} https://pin.it/6QMEwc3CM*`

  const { baseURL, apikey } = getApiConfig()
  const { data } = await axios.get(`${baseURL}${API_PATH}`, {
    params: { url },
    headers: { 'x-apikey': apikey },
    timeout: 60000
  })

  if (!data?.status) throw new Error(data?.message || data?.error || 'API Pinterest gagal mengambil media.')

  const candidates = collectMedia(data)
  if (!candidates.length) throw new Error('URL media tidak ditemukan pada respons API Pinterest.')

  const media = await Promise.all(candidates.map(async item => {
    try {
      return await fetchMedia(item)
    } catch (error) {
      console.error('[PINTEREST] media gagal diunduh:', error?.message || error)
      return null
    }
  }))

  const valid = media.filter(Boolean)
  if (!valid.length) throw new Error('Semua media Pinterest gagal diunduh.')

  const images = valid.filter(item => item.image)
  const videos = valid.filter(item => item.video)

  if (images.length) {
    const albumItems = images.map(item => ({ image: item.image, mimetype: item.mimetype }))
    let sent = 0
    if (typeof conn.sendAlbum === 'function') {
      const result = await conn.sendAlbum(m.chat, albumItems, { quoted: m })
      sent = Number(result?.sent || 0)
    }
    if (!sent) {
      for (const item of images) {
        await conn.sendMessage(m.chat, { image: item.image, mimetype: item.mimetype }, { quoted: m })
        sent++
      }
    }
    if (!sent) throw new Error('Foto Pinterest terunduh tetapi gagal dikirim.')
  }

  for (const item of videos) {
    await conn.sendMessage(m.chat, {
      video: item.video,
      mimetype: item.mimetype || 'video/mp4'
    }, { quoted: m })
  }

  await m.react('✅').catch(() => {})
}

handler.help = ['pindl <url>']
handler.tags = ['downloader']
handler.command = /^(pin|pindl)$/i
handler.wait = true
handler.limit = true
handler.register = true

export default handler
