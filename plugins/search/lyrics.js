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

import sharp from 'sharp'

const API = 'https://api-faa.my.id/faa/lyrics'
const TIMEOUT = 60000

function cleanLyrics(value = '') {
  return String(value)
    .replace(/\[\s*\d{7,}\s*\]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function getHDThumbnail(url) {
  if (!url || !/^https?:\/\//i.test(url)) return null

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      headers: {
        Accept: 'image/jpeg,image/*'
      }
    })

    if (!response.ok) return null

    const contentType = response.headers.get('content-type') || ''

    if (!contentType.startsWith('image/')) return null

    const buffer = Buffer.from(await response.arrayBuffer())

    if (!buffer.length || buffer.length > 15 * 1024 * 1024) {
      return null
    }

    return await sharp(buffer)
      .rotate()
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 85,
        mozjpeg: true
      })
      .toBuffer()
  } catch (error) {
    console.error('[LYRICS THUMBNAIL]', error.message)
    return null
  }
}

const handler = async (m, { conn, args }) => {
  const query = args.join(' ').trim()

  if (!query) {
    throw 'Masukkan judul lagu atau nama penyanyi.\n\nContoh: *.lyrics about you*'
  }

  await m.wait()

  const endpoint = new URL(API)
  endpoint.searchParams.set('q', query)

  const response = await fetch(endpoint, {
    signal: AbortSignal.timeout(TIMEOUT),
    headers: {
      Accept: 'application/json'
    }
  })

  const data = await response.json().catch(() => null)

  if (!response.ok || data?.status !== true || !data?.result) {
    throw data?.message || data?.error || 'Lirik lagu tidak ditemukan.'
  }

  const song = data.result
  const lyrics = cleanLyrics(song.lyrics)

  if (!lyrics) {
    throw 'Lirik lagu tidak tersedia.'
  }

  const title = song.title || 'Unknown Title'
  const artist = song.artist || 'Unknown Artist'
  const album = song.album || '-'
  const genre = song.genre || 'Tidak diketahui'
  const release = song.release_date || '-'

  const shareUrl = /^https?:\/\//i.test(song.share_url || '')
    ? song.share_url
    : ''

  const thumbnail = await getHDThumbnail(song.cover?.hd)

  const caption = [
    '🌷 ERiNE-Ai Lyrics',
    '',
    `Judul : ${title}`,
    `Artist : ${artist}`,
    `Album : ${album}`,
    `Genre : ${genre}`,
    `Release : ${release}`,
    '',
    '✦ Lirik Lagu',
    lyrics,
    '',
    shareUrl ? `Source : ${shareUrl}` : ''
  ].filter(Boolean).join('\n')

  const message = {
    text: caption
  }

  if (shareUrl && thumbnail) {
    message.linkPreview = {
      'matched-text': shareUrl,
      title,
      description: `${artist} • ${album}`,
      previewType: 0,
      jpegThumbnail: thumbnail
    }
  }

  await conn.sendMessage(m.chat, message, {
    quoted: m
  })
}

handler.help = ['lyrics <judul lagu>']
handler.tags = ['search']
handler.command = /^(lyrics|lirik)$/i
handler.limit = true
handler.register = true
handler.wait = true

export default handler
