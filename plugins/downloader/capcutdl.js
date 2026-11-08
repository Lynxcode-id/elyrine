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

const API = 'https://api.nexadev.my.id/api/capcut'
const MAX_SIZE = 150 * 1024 * 1024
const TIMEOUT = 120000

function extractUrl(text = '') {
  const match = String(text).match(/https?:\/\/[^\s]+/i)
  return match?.[0]?.replace(/[)\]},.]+$/, '') || null
}

function extractVideoUrl(html, baseURL) {
  const source = String(html)
    .replace(/\\u0026/gi, '&')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .replace(/\\x26/gi, '&')
    .replace(/\\x3d/gi, '=')

  const candidates = []

  for (const match of source.matchAll(
    /<(?:video|source)\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi
  )) {
    candidates.push(match[1])
  }

  for (const match of source.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0]

    if (!/(?:og:video|twitter:player:stream)/i.test(tag)) continue

    const content = tag.match(/\bcontent=["']([^"']+)["']/i)
    if (content) candidates.push(content[1])
  }

  for (const match of source.matchAll(
    /https?:\/\/[^"'\\\s<>]+?\.(?:mp4|m4v)(?:\?[^"'\\\s<>]*)?/gi
  )) {
    candidates.push(match[0])
  }

  for (const candidate of candidates) {
    try {
      const url = new URL(candidate, baseURL)

      if (/^https?:$/.test(url.protocol)) {
        return url.href
      }
    } catch {}
  }

  return null
}

async function resolveVideo(url, depth = 0) {
  if (depth > 4) {
    throw new Error('Terlalu banyak redirect saat mencari video.')
  }

  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      Accept: 'video/mp4, video/*, application/octet-stream, text/html, */*'
    }
  })

  if (!response.ok) {
    throw new Error(`Gagal membuka video. HTTP ${response.status}`)
  }

  const contentType = (
    response.headers.get('content-type') || ''
  ).split(';')[0].trim().toLowerCase()

  if (
    contentType.startsWith('video/') ||
    contentType === 'application/octet-stream'
  ) {
    const length = Number(response.headers.get('content-length') || 0)

    if (length > MAX_SIZE) {
      throw new Error('Ukuran video melebihi batas 150 MB.')
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    if (!buffer.length) {
      throw new Error('Video yang diterima kosong.')
    }

    if (buffer.length > MAX_SIZE) {
      throw new Error('Ukuran video melebihi batas 150 MB.')
    }

    return buffer
  }

  const body = await response.text()

  if (contentType.includes('json')) {
    try {
      const json = JSON.parse(body)
      const nextURL = findURL(json)

      if (nextURL) {
        return resolveVideo(nextURL, depth + 1)
      }
    } catch {}
  }

  const nextURL = extractVideoUrl(body, response.url)

  if (!nextURL) {
    throw new Error('URL video langsung tidak ditemukan pada halaman CapCut.')
  }

  return resolveVideo(nextURL, depth + 1)
}

function findURL(value, depth = 0) {
  if (!value || depth > 5) return null

  if (typeof value === 'string') {
    return /^https?:\/\//i.test(value) ? value : null
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findURL(item, depth + 1)
      if (found) return found
    }
  }

  if (typeof value === 'object') {
    for (const key of [
      'url',
      'download_url',
      'video_url',
      'play',
      'download',
      'data',
      'result'
    ]) {
      const found = findURL(value[key], depth + 1)
      if (found) return found
    }
  }

  return null
}

const handler = async (m, { conn, args }) => {
  const url = extractUrl(args.join(' '))

  if (!url) {
    throw 'Masukkan link template atau video CapCut.\n\nContoh: *.capcut https://www.capcut.com/tv2/ZSXXSAX2q/*'
  }

  let parsedURL

  try {
    parsedURL = new URL(url)
  } catch {
    throw 'Link CapCut tidak valid.'
  }

  if (!/(^|\.)capcut\.com$/i.test(parsedURL.hostname)) {
    throw 'Link yang diberikan bukan link CapCut.'
  }

  await m.wait()

  const endpoint = new URL(API)
  endpoint.searchParams.set('url', url)

  const response = await fetch(endpoint, {
    signal: AbortSignal.timeout(TIMEOUT),
    headers: {
      Accept: 'application/json'
    }
  })

  const data = await response.json().catch(() => null)

  if (!response.ok || data?.status !== true) {
    throw data?.message || data?.error || 'Gagal mengambil data CapCut.'
  }

  const downloadURL = data.data?.url

  if (!downloadURL || !/^https?:\/\//i.test(downloadURL)) {
    throw 'URL download CapCut tidak ditemukan.'
  }

  const video = await resolveVideo(downloadURL)

  await conn.sendMessage(m.chat, {
    video,
    mimetype: 'video/mp4',
    caption: data.caption || ''
  }, {
    quoted: m
  })
}

handler.help = ['capcutdl <url>']
handler.tags = ['downloader']
handler.command = /^(capcutdl)$/i
handler.limit = true
handler.register = true
handler.wait = true

export default handler
