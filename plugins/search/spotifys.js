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

const DEFAULT_API = 'https://api.theresav.eu'
const API_PATH = '/api/search/spotify'
const TIMEOUT = 60000
const MAX_RESULT = 10

function getApiConfig() {
  const baseURL = String(global.APIs?.theresav || DEFAULT_API).replace(/\/+$/, '')
  const apikey = global.APIKeys?.[baseURL] || global.APIKeys?.[DEFAULT_API]
  if (!apikey) throw new Error(`API key tidak ditemukan. Periksa global.APIKeys['${baseURL}'] di config.js.`)
  return { baseURL, apikey }
}

async function getThumbnail(url) {
  if (!url || !/^https?:\/\//i.test(url)) return null
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 20000,
      maxContentLength: 5 * 1024 * 1024,
      maxBodyLength: 5 * 1024 * 1024,
      headers: { Accept: 'image/*' }
    })
    const mime = String(response.headers?.['content-type'] || '').split(';')[0].trim().toLowerCase()
    if (!mime.startsWith('image/')) return null
    return Buffer.from(response.data)
  } catch (error) {
    console.error('[SPOTIFY SEARCH] thumbnail gagal:', error?.message || error)
    return null
  }
}

function formatTrack(track, index, total) {
  return [
    `🎧 *Spotify Search · ${index + 1}/${total}*`,
    '',
    `*${track.name || 'Unknown Title'}*`,
    `Artist : ${track.artists || '-'}`,
    `Album : ${track.album || '-'}`,
    `Duration : ${track.duration || '-'}`,
    '',
    `Spotify : ${track.spotifyUrl || '-'}`,
    `Preview : ${track.previewUrl || 'Tidak tersedia'}`
  ].join('\n')
}

const handler = async (m, { conn, text, args }) => {
  const query = String(text || args?.join(' ') || '').trim()
  if (!query) throw 'Masukkan judul lagu atau nama artist.\nContoh: *.spotify about you*'

  const { baseURL, apikey } = getApiConfig()
  const { data } = await axios.get(`${baseURL}${API_PATH}`, {
    params: { query },
    headers: { 'x-apikey': apikey },
    timeout: TIMEOUT
  })

  if (!data?.status || !Array.isArray(data.result)) {
    throw new Error(data?.message || data?.error || 'Pencarian Spotify gagal.')
  }
  if (!data.result.length) throw new Error(`Lagu untuk pencarian "${query}" tidak ditemukan.`)

  const tracks = data.result.slice(0, MAX_RESULT)
  for (let index = 0; index < tracks.length; index++) {
    const track = tracks[index]
    const caption = formatTrack(track, index, tracks.length)
    const thumbnail = await getThumbnail(track.cover)

    if (thumbnail) {
      await conn.sendMessage(m.chat, {
        image: thumbnail,
        caption
      }, { quoted: m })
    } else {
      await conn.sendMessage(m.chat, { text: caption }, { quoted: m })
    }
  }

  await m.react('✅').catch(() => {})
}

handler.help = ['spotifys <query>']
handler.tags = ['search']
handler.command = /^(spotifys|spsearch)$/i
handler.wait = true
handler.limit = true
handler.register = true

export default handler
