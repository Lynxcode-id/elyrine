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

import yts from 'yt-search'
import axios from 'axios'
import { uploadThumbnail, sendThumbnail } from '../../lib/thumbnail.js'
import { fetchYtUltra, pickAudio } from '../../scrape/ytultra.js'

const MAX_SIZE = 50 * 1024 * 1024
const MAX_SECONDS = 60 * 60
const FOOTER = 'with love, elyra !!'

function formatNumber(num) {
  if (!num) return '0'
  const suffixes = ['', 'k', 'M', 'B', 'T']
  const digits = Math.abs(num).toString().length
  if (digits <= 3) return String(num)
  const idx = Math.floor((digits - 1) / 3)
  let f = (num / Math.pow(1000, idx)).toFixed(1)
  if (f.endsWith('.0')) f = f.slice(0, -2)
  return f + suffixes[idx]
}

const buildUsage = p => [
  '🌷 *Play*',
  '',
  'Cari lagu / video YouTube lalu',
  'langsung kirim audionya (MP3).',
  '',
  `♡ ${p}play <judul / link>`,
  `♡ contoh: ${p}play everything u are hindia`,
  '',
  FOOTER
].join('\n')

async function getWideThumb(v) {
  const id = v.videoId
  const candidates = [
    id && `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    id && `https://i.ytimg.com/vi/${id}/sddefault.jpg`,
    v.image, v.thumbnail,
    id && `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
  ].filter(Boolean)

  for (const url of candidates) {
    try {
      const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 })
      let buf = Buffer.from(res.data)
      if (buf.length < 2000) continue
      try {
        const sharp = (await import('sharp')).default
        buf = await sharp(buf).resize(1280, 720, { fit: 'cover', position: 'center' }).jpeg({ quality: 90 }).toBuffer()
      } catch {}
      return buf
    } catch {}
  }
  return null
}

let handler = async (m, { conn, text, usedPrefix }) => {
  const p = usedPrefix || '.'
  const query = (text || '').trim()
  if (!query) throw buildUsage(p)

  await m.react('⏳').catch(() => { })

  let v
  try {
    const idMatch = query.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:\S*&)?v=|shorts\/|embed\/|live\/)|music\.youtube\.com\/watch\?(?:\S*&)?v=)([\w-]{11})/i)
    if (idMatch) {
      v = await yts({ videoId: idMatch[1] })
      if (v && !v.url) v.url = `https://youtu.be/${idMatch[1]}`
    } else {
      v = ((await yts(query))?.videos || [])[0]
    }
  } catch (err) {
    console.error('[PLAY] pencarian gagal:', err?.message || err)
    await m.react('❌').catch(() => { })
    return m.gagal('Terjadi kesalahan saat mencari di YouTube.', 'YouTube Search')
  }
  if (!v) {
    await m.react('❌').catch(() => { })
    return m.gagal(`Hasil untuk "${query}" tidak ditemukan.`, 'YouTube Search')
  }
  if (v.seconds && v.seconds > MAX_SECONDS) {
    await m.react('❌').catch(() => { })
    return m.gagal(`Durasi video terlalu panjang (${v.timestamp}). Maksimal ${MAX_SECONDS / 60} menit.`, 'Play')
  }

  let info, pick
  try {
    info = await fetchYtUltra(v.url)
    pick = pickAudio(info.media)
    if (!pick) throw new Error('Tidak ada link download yang tersedia.')
  } catch (e) {
    await m.react('❌').catch(() => { })
    return m.gagal(`Gagal mengambil audio: ${e.message}`, 'YTUltra')
  }

  let audio
  try {
    const res = await axios.get(pick.url, {
      responseType: 'arraybuffer', timeout: 120000, maxContentLength: MAX_SIZE, maxBodyLength: MAX_SIZE,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36' }
    })
    audio = Buffer.from(res.data)
    if (!audio.length) throw new Error('File audio kosong.')
  } catch (e) {
    await m.react('❌').catch(() => { })
    const tooBig = /maxContentLength|exceeded/i.test(e.message)
    return m.gagal(tooBig ? 'Ukuran audio melebihi 50MB.' : `Gagal mengunduh audio: ${e.message}`, 'YTUltra')
  }

  const title = info.title || v.title
  const mime = pick.type === 'video' ? 'video/mp4' : 'audio/mpeg'
  const fileExt = pick.ext || (pick.type === 'video' ? 'mp4' : 'mp3')
  const caption = [
    `♡ Judul : ${title}`,
    `♡ Channel : ${v.author?.name || '-'}`,
    `♡ Durasi : ${v.timestamp || '-'}`,
    `♡ Views : ${formatNumber(v.views)}`,
    `♡ Upload : ${v.ago || '-'}`,
    `♡ Format : MP3`,
    '',
    FOOTER
  ].join('\n')

  try {
    const thumb = await getWideThumb(v)
    if (!thumb) throw new Error('thumbnail tidak bisa diambil.')
    const meta = await uploadThumbnail(conn, thumb)
    await sendThumbnail(conn, m.chat, {
      thumbnail: meta,
      title,
      body: `${v.author?.name || 'YouTube'} • ${v.timestamp || ''}`.trim(),
      url: v.url,
      text: caption,
      quote: m
    })
  } catch (err) {
    console.error('[PLAY] kartu link preview gagal:', err?.stack || err?.message || err)
    await conn.sendMessage(m.chat, { text: `${v.url}\n\n${caption}` }, { quoted: m }).catch(() => { })
  }

  try {
    const safeName = String(title || 'audio').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 80)
    const payload = pick.type === 'video' ? { video: audio, mimetype: mime, fileName: `${safeName}.${fileExt}` } : { audio, mimetype: mime, fileName: `${safeName}.${fileExt}` }
    await conn.sendMessage(m.chat, payload, { quoted: m })
    await m.react('✅').catch(() => { })
  } catch (err) {
    console.error('[PLAY] gagal mengirim audio:', err?.stack || err?.message || err)
    await m.react('❌').catch(() => { })
    return m.gagal(`Gagal mengirim audio: ${err.message}`, 'Play')
  }
}

handler.command = ['play', 'putar']
handler.help = ['play <judul / link>']
handler.tags = ['music']
handler.wait = true
handler.limit = true
handler.register = true

export default handler
