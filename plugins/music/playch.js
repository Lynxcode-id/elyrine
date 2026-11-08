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
import { fileTypeFromBuffer } from 'file-type'
import { uploadThumbnail, sendThumbnail } from '../../lib/thumbnail.js'
import { listSaluran, findSaluran, getOwnerSaluran, parseChannelInput, labelSaluran } from '../../lib/saluran.js'
import { fetchYtUltra, pickAudio } from '../../scrape/ytultra.js'
import { ffmpeg, isOggOpus, prepareAudioMessage } from '../../lib/converter.js'

const MAX_SIZE = 50 * 1024 * 1024
const MAX_SECONDS = 20 * 60
const FOOTER = 'with love, elyra !!'
const VN_BITRATE = '64k'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
}

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
      const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000, headers: HEADERS })
      let buf = Buffer.from(res.data)
      if (buf.length < 2000) continue
      try {
        const sharp = (await import('sharp')).default
        buf = await sharp(buf).resize(1280, 720, { fit: 'cover', position: 'center' }).jpeg({ quality: 90 }).toBuffer()
      } catch { }
      return buf
    } catch { }
  }
  return null
}

async function toVoiceOpus(buf) {
  if (isOggOpus(buf)) return buf
  const ft = await fileTypeFromBuffer(buf).catch(() => null)
  const out = await ffmpeg(buf, ['-vn', '-map_metadata', '-1', '-c:a', 'libopus', '-b:a', VN_BITRATE, '-vbr', 'on', '-ac', '1', '-ar', '48000', '-application', 'audio'], ft?.ext || 'bin', 'ogg')
  await out.delete()
  return out.data
}

function resolveTarget(arg) {
  const v = String(arg || '').trim()
  if (!v) return null
  if (/^\d{1,3}$/.test(v)) return listSaluran()[Number(v) - 1] || null
  if (v.toLowerCase() === 'owner') return getOwnerSaluran() || null
  const p = parseChannelInput(v)
  return (p?.jid && findSaluran(p.jid)) || null
}

const buildUsage = p => [
  '🌷 *Play Channel*',
  '',
  'Seperti *play*, tapi hasilnya',
  'dikirim sebagai VN ke saluran.',
  '',
  `♡ ${p}playch <judul / link>`,
  `♡ ${p}playch <judul / link> | <nomor|owner|idch>  (khusus owner, pilih saluran lain)`,
  `♡ lihat daftar saluran: ${p}listsaluran`,
  '',
  FOOTER
].join('\n')

let handler = async (m, { conn, text, usedPrefix, isOwner }) => {
  const p = usedPrefix || '.'

  const saluranList = listSaluran()
  if (!saluranList.length) {
    throw `❌ Fitur *playch* belum aktif.\nOwner perlu menambahkan saluran dulu lewat:\n*${p}addsaluran <idch>* atau *${p}addsaluran <idch>|owner*`
  }

  const [queryPart, targetPart] = (text || '').split('|').map(v => v.trim())
  const query = queryPart || ''
  if (!query) throw buildUsage(p)

  let toChannel
  if (targetPart) {
    if (!isOwner) throw '❌ Memilih saluran tujuan hanya untuk owner.'
    toChannel = resolveTarget(targetPart)
    if (!toChannel) throw `❌ Saluran tujuan tidak ditemukan di daftar. Cek ${p}listsaluran dulu.`
  } else {
    toChannel = getOwnerSaluran() || saluranList[0]
  }
  const chat = toChannel.id

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
    console.error('[PLAYCH] pencarian gagal:', err?.message || err)
    await m.react('❌').catch(() => { })
    return m.gagal('Terjadi kesalahan saat mencari di YouTube.', 'YouTube Search')
  }
  if (!v) {
    await m.react('❌').catch(() => { })
    return m.gagal(`Hasil untuk "${query}" tidak ditemukan.`, 'YouTube Search')
  }
  if (v.seconds && v.seconds > MAX_SECONDS) {
    await m.react('❌').catch(() => { })
    return m.gagal(`Durasi video terlalu panjang (${v.timestamp}). Maksimal ${MAX_SECONDS / 60} menit.`, 'Play Channel')
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
      responseType: 'arraybuffer', timeout: 120000, maxContentLength: MAX_SIZE, maxBodyLength: MAX_SIZE, headers: HEADERS
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
    `♡ Format : ${pick.type === 'video' ? 'Video' : 'Voice Note (Opus)'}`,
    `♡ Dikirim ke : ${labelSaluran(toChannel)}`,
    '',
    FOOTER
  ].filter(Boolean).join('\n')

  try {
    const thumb = await getWideThumb(v)
    if (!thumb) throw new Error('thumbnail tidak bisa diambil.')
    const meta = await uploadThumbnail(conn, thumb)
    await sendThumbnail(conn, chat, {
      thumbnail: meta,
      title,
      body: `${v.author?.name || 'YouTube'} • ${v.timestamp || ''}`.trim(),
      url: v.url,
      text: caption
    })
  } catch (err) {
    console.error('[PLAYCH] kartu link preview gagal:', err?.stack || err?.message || err)
    await conn.sendMessage(chat, { text: `${v.url}\n\n${caption}` }).catch(() => { })
  }

  try {
    let payload
    if (pick.type === 'video') {
      const safeName = String(title || 'video').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 80)
      payload = { video: audio, mimetype: mime, fileName: `${safeName}.${fileExt}` }
    } else {
      const opus = await toVoiceOpus(audio)
      const vn = await prepareAudioMessage({ audio: opus, ptt: true })
      payload = { ...vn, ptt: true }
    }
    await conn.sendMessage(chat, payload)
    await m.react('✅').catch(() => { })
    await m.reply(`✅ Terkirim ke saluran *${labelSaluran(toChannel)}*.`)
  } catch (err) {
    console.error('[PLAYCH] gagal mengirim audio:', err?.stack || err?.message || err)
    await m.react('❌').catch(() => { })
    return m.gagal(`Gagal mengirim audio ke saluran ${labelSaluran(toChannel)}: ${err.message}`, 'Play Channel')
  }
}

handler.command = ['playch', 'playsaluran', 'playchannel']
handler.help = ['playch <judul / link>', 'playch <judul / link> | <nomor|owner|idch>']
handler.tags = ['music']
handler.wait = true
handler.limit = true
handler.register = true

export default handler
