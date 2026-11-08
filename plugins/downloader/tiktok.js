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
import sharp from 'sharp'
import { sendVideoBadge } from '../../lib/videobadge.js'

const API = (global.APIs?.lynxapis || 'https://lynxapis.my.id') + '/api/downloader/tiktok-v4'
const TT_REGEX = /^(https?:\/\/)?((www|m|vm|vt)\.)?tiktok\.com\/\S+/i
const MAX_SIZE = 80 * 1024 * 1024
const MAX_PHOTOS = 20
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
  Referer: 'https://www.tiktok.com/'
}

const fetchBuffer = async url => {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 120000, maxContentLength: MAX_SIZE, maxBodyLength: MAX_SIZE, headers: HEADERS })
  const buf = Buffer.from(res.data)
  if (!buf.length) throw new Error('File kosong.')
  return buf
}

const isVideo = b => b.length > 12 && (b.slice(4, 8).toString() === 'ftyp' || b.slice(0, 4).toString('hex') === '1a45dfa3')
const isImage = b => b.length > 12 && (
  (b[0] === 0xff && b[1] === 0xd8) ||
  b.slice(1, 4).toString() === 'PNG' ||
  (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') ||
  b.slice(4, 8).toString() === 'ftyp'
)

const toJpeg = async b => {
  try { return await sharp(b).rotate().jpeg({ quality: 92 }).toBuffer() } catch { return (b[0] === 0xff && b[1] === 0xd8) ? b : null }
}

async function fetchValid(urls, check) {
  let lastErr
  for (const u of urls.filter(Boolean)) {
    try {
      const buf = await fetchBuffer(u)
      if (check(buf)) return buf
      lastErr = new Error('Isi file bukan media valid.')
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('Tidak ada URL media.')
}

function buildCaption(d) {
  const lines = [
    '*[ Tiktok Downloader ]*',
    '',
    `• Nickname: ${d.author || '-'}`,
    `• Type: ${d.type || '-'}`,
    `• Like: ${d.stats?.likes ?? '-'}`,
    `• Comment: ${d.stats?.comments ?? '-'}`,
    `• Share: ${d.stats?.shares ?? '-'}`
  ]
  if (d.caption) lines.push('', d.caption)
  return lines.join('\n')
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const url = (text || '').trim().split(/\s+/)[0]
  if (!url) throw `*Contoh:* ${usedPrefix || '.'}${command} https://vt.tiktok.com/ZS4y5vc3F/`
  if (!TT_REGEX.test(url)) throw 'Link tidak valid, kirim link TikTok.'

  await m.react('⏳').catch(() => { })

  let d
  try {
    const { data } = await axios.get(API, { params: { url }, timeout: 60000 })
    if (!data?.status || !data?.data) throw new Error(data?.message || 'API tidak mengembalikan data.')
    d = data.data
  } catch (e) {
    await m.react('❌').catch(() => { })
    return m.gagal(`Gagal mengambil data TikTok: ${e.response?.data?.message || e.message}`, 'Lynx Apis')
  }

  const caption = buildCaption(d)

  try {
    if (d.type === 'photo' || (!d.video_no_wm && !d.video && d.photos?.length)) {
      const urls = (d.photos || []).map(p => p.download_url || p.preview).filter(Boolean).slice(0, MAX_PHOTOS)
      if (!urls.length) throw new Error('Foto tidak ditemukan.')

      const raw = await Promise.all((d.photos || []).slice(0, MAX_PHOTOS).map(p =>
        fetchValid([p.download_url, p.preview], isImage).catch(e => { console.error('[TIKTOK] foto gagal:', e.message); return null })
      ))
      const buffers = (await Promise.all(raw.filter(Boolean).map(toJpeg))).filter(Boolean)
      if (!buffers.length) throw new Error('Semua foto gagal diunduh.')

      let sent = 0
      try {
        const r = await conn.sendAlbum(m.chat, buffers.map(image => ({ image })), { quoted: m })
        sent = r?.sent || 0
      } catch (e) { console.error('[TIKTOK] album error:', e.message) }

      if (!sent) {
        for (const image of buffers) {
          try { await conn.sendMessage(m.chat, { image }, { quoted: m }); sent++ } catch (e) { console.error('[TIKTOK] kirim foto error:', e.message) }
        }
      }
      if (!sent) throw new Error('Foto terunduh tapi gagal terkirim ke WhatsApp.')

      await m.react('✅').catch(() => { })
      return m.sukses(caption)
    }

    const video = await fetchValid([d.video_no_wm, d.video], isVideo)

    try {
      await sendVideoBadge(conn, m.chat, video, { caption, quoted: m })
    } catch (e) {
      console.error('[TIKTOK] badge gagal, kirim video biasa:', e.message)
      await conn.sendMessage(m.chat, { video, caption, mimetype: 'video/mp4' }, { quoted: m })
    }
    await m.react('✅').catch(() => { })
  } catch (e) {
    console.error('[TIKTOK]', e)
    await m.react('❌').catch(() => { })
    const tooBig = /maxContentLength|exceeded/i.test(e.message)
    return m.gagal(tooBig ? 'Ukuran file melebihi 80MB.' : `Gagal mengirim: ${e.message}`, 'TikTok')
  }
}

handler.command = ['tiktok', 'tt']
handler.help = ['tiktok <link tiktok>']
handler.tags = ['downloader']
handler.wait = true
handler.limit = true
handler.register = true

export default handler
