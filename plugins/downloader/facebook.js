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

const API = 'https://api.nexadev.my.id/api/fb'

function extractUrl(text = '') {
  const match = String(text).match(/https?:\/\/[^\s]+/i)
  return match?.[0]?.replace(/[)\]},.]+$/, '') || null
}

function qualityScore(quality = '') {
  const match = String(quality).match(/(\d{3,4})p/i)
  if (match) return Number(match[1])

  if (/hd/i.test(quality)) return 720
  if (/sd/i.test(quality)) return 360

  return 0
}

const handler = async (m, { conn, args }) => {
  const input = args.join(' ').trim()
  const url = extractUrl(input)

  if (!url) {
    throw 'Masukkan link video Facebook.\n\nContoh: *.fb https://www.facebook.com/share/r/xxxx/*'
  }

  let parsedUrl

  try {
    parsedUrl = new URL(url)
  } catch {
    throw 'Link Facebook tidak valid.'
  }

  if (
    !/facebook\.com$|\.facebook\.com$|^fb\.watch$/i.test(parsedUrl.hostname)
  ) {
    throw 'Link yang diberikan bukan link Facebook.'
  }

  const requestedQuality = input.match(/\b(720p|sd)\b/i)?.[1]

  await m.wait()

  const endpoint = new URL(API)
  endpoint.searchParams.set('url', url)

  const response = await fetch(endpoint, {
    signal: AbortSignal.timeout(120000),
    headers: {
      Accept: 'application/json'
    }
  })

  const data = await response.json().catch(() => null)

  if (!response.ok || data?.status !== true || !Array.isArray(data.data)) {
    throw data?.message || data?.error || 'Gagal mengambil video Facebook.'
  }

  const videos = data.data.filter(item =>
    item?.url &&
    /^https?:\/\//i.test(item.url) &&
    (item.response === undefined || item.response === 200)
  )

  if (!videos.length) {
    throw 'Video Facebook tidak ditemukan.'
  }

  let selected

  if (requestedQuality) {
    selected = videos.find(item =>
      item.quality?.toLowerCase() === requestedQuality.toLowerCase()
    )

    if (!selected) {
      throw `Kualitas ${requestedQuality} tidak tersedia.`
    }
  } else {
    selected = [...videos].sort(
      (a, b) => qualityScore(b.quality) - qualityScore(a.quality)
    )[0]
  }

  await conn.sendMessage(m.chat, {
    video: {
      url: selected.url
    },
    mimetype: 'video/mp4'
  }, {
    quoted: m
  })
}

handler.help = ['facebook <url>', 'fb']
handler.tags = ['downloader']
handler.command = /^(fb|facebook)$/i
handler.limit = true
handler.register = true
handler.wait = true

export default handler
