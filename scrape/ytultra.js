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

const ENDPOINT = 'https://api.ytultra.com/ikool/youtube/download'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
  'Origin': 'https://ytultra.com',
  'Referer': 'https://ytultra.com/'
}

function formatTime(s) {
  const sec = Math.round(Number(s))
  if (!sec || isNaN(sec)) return '0:00'
  return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`
}

async function fetchOembedTitle(url) {
  try {
    const { data } = await axios.get(`https://noembed.com/embed?url=${encodeURIComponent(url)}`, { headers: HEADERS, timeout: 5000 })
    return data?.title || null
  } catch {
    return null
  }
}

export async function fetchYtUltra(url) {
  if (!/(youtube\.com|youtu\.be)/i.test(url || '')) throw new Error('URL YouTube tidak valid')

  const { data: res } = await axios.post(ENDPOINT, { url }, { headers: HEADERS, timeout: 60000, validateStatus: () => true })
  if (res?.code !== '0000' || !res?.data) throw new Error(res?.msg || 'Gagal mengambil data dari server YTUltra')

  const info = res.data
  const rawMedias = info.medias || []

  let duration = Number(info.duration || 0)
  if (!duration && rawMedias.length) {
    const m = JSON.stringify(rawMedias).match(/[?&]dur=([\d.]+)/)
    if (m) duration = Math.round(parseFloat(m[1]))
  }

  let title = info.title || await fetchOembedTitle(url)

  const seen = new Set()
  const media = []
  for (const m of rawMedias) {
    if (!m.url) continue
    const rawFmt = m.format || ''
    const isAudio = rawFmt.includes('.m4a') || rawFmt.includes('.mp3') || m.url.includes('mime=audio')
    const ext = rawFmt.match(/\[\.([a-z0-9]+)\]/i)?.[1] || (isAudio ? 'm4a' : 'mp4')

    let size = rawFmt.match(/\(([\d.]+\s*[A-Za-z]+)\)/)?.[1]
    if (!size) {
      const clen = m.fileSize || m.url.match(/[?&]clen=(\d+)/)?.[1]
      size = clen ? `${(Number(clen) / 1048576).toFixed(2)} MB` : null
    }

    const resLabel = rawFmt.split(/[([]/)[0].trim()
    const quality = isAudio ? '128kbps' : (resLabel || '360p')
    const key = `${isAudio ? 'audio' : 'video'}_${quality}_${ext}`
    if (seen.has(key)) continue
    seen.add(key)
    media.push({ type: isAudio ? 'audio' : 'video', quality, ext, size, url: m.url })
  }

  return {
    title: title || null,
    thumbnail: info.imageUrl || null,
    duration,
    durationLabel: formatTime(duration),
    media
  }
}

export function pickAudio(media) {
  return media.find(m => m.type === 'audio' && m.ext === 'm4a')
    || media.find(m => m.type === 'audio')
    || media.find(m => m.type === 'video')
    || null
}
