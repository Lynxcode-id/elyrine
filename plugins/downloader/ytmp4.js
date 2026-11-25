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
import yts from 'yt-search'
import { generateWAMessageFromContent, proto } from 'elyrine-baileys'

const JEREXD_BASE = global.APIs?.jerexd || 'https://api.jerexd.my.id'
const API = `${JEREXD_BASE}/api/downloader/ytmp4`
const APIKEY = global.APIKeys?.[JEREXD_BASE] || ''
const MAX_SIZE = 300 * 1024 * 1024
const MAX_SECONDS = 20 * 60
const FOOTER = 'with love, elyra !!'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': '*/*'
}

function extractId(text) {
  const m = String(text || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:\S*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/i)
  return m ? m[1] : null
}

async function resolveVideo(query) {
  const id = extractId(query)
  if (id) {
    const v = await yts({ videoId: id })
    if (v && !v.url) v.url = `https://youtu.be/${id}`
    return v
  }
  return ((await yts(query))?.videos || [])[0] || null
}

function buildQualityButtons(p, url) {
  return [
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎬 360p', id: `${p}ytmp4 ${url}|360` }) },
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎬 720p', id: `${p}ytmp4 ${url}|720` }) }
  ]
}

async function sendQualityPrompt(conn, m, p, v) {
  const caption = [
    `♡ Judul : ${v.title}`,
    `♡ Channel : ${v.author?.name || '-'}`,
    `♡ Durasi : ${v.timestamp || '-'}`,
    '',
    'Pilih resolusi video di bawah ini:',
    '',
    FOOTER
  ].join('\n')

  try {
    const msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({ text: caption }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: FOOTER }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons: buildQualityButtons(p, v.url)
            })
          })
        }
      }
    }, { quoted: m })
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
  } catch (err) {
    console.error('[YTMP4] tombol gagal, pakai teks biasa:', err && err.message ? err.message : err)
    await conn.sendMessage(m.chat, {
      text: `${caption}\n\n♡ ${p}ytmp4 ${v.url}|360\n♡ ${p}ytmp4 ${v.url}|720`
    }, { quoted: m })
  }
}

let handler = async (m, { conn, text, usedPrefix }) => {
  const p = usedPrefix || '.'
  const [queryPart, qualityPart] = (text || '').split('|').map(v => v.trim())
  if (!queryPart) throw `❓ Gunakan: ${p}ytmp4 <link/judul YouTube>`

  let v
  try {
    v = await resolveVideo(queryPart)
  } catch (err) {
    console.error('[YTMP4] pencarian gagal:', err && err.message ? err.message : err)
    return m.gagal('Terjadi kesalahan saat mencari di YouTube.', 'YouTube Search')
  }
  if (!v) return m.gagal(`Video untuk "${queryPart}" tidak ditemukan.`, 'YouTube Search')
  if (v.seconds && v.seconds > MAX_SECONDS) return m.gagal(`Durasi video terlalu panjang (${v.timestamp}). Maksimal ${MAX_SECONDS / 60} menit.`, 'YT MP4')

  const quality = qualityPart === '360' || qualityPart === '720' ? qualityPart : null
  if (!quality) return sendQualityPrompt(conn, m, p, v)

  await m.react('⏳').catch(() => { })

  let info
  try {
    const { data } = await axios.get(API, { params: { apikey: APIKEY, url: v.url, quality }, timeout: 60000, headers: HEADERS })
    const dl = data?.result?.downloadUrl || data?.result?.download || data?.result?.download_url || data?.downloadUrl || data?.download || data?.download_url
    if (!data?.status || !dl) throw new Error(data?.message || 'API tidak mengembalikan link download.')
    info = { title: data?.result?.title || data?.title || v.title, downloadUrl: dl, quality: data?.result?.quality || data?.quality || quality }
  } catch (err) {
    await m.react('❌').catch(() => { })
    return m.gagal(`Gagal mengambil video (${quality}p): ${err.response?.data?.message || err.message}`, 'YT MP4')
  }

  let video
  try {
    const res = await axios.get(info.downloadUrl, {
      responseType: 'arraybuffer', timeout: 180000, maxContentLength: MAX_SIZE, maxBodyLength: MAX_SIZE, headers: HEADERS
    })
    video = Buffer.from(res.data)
    if (!video.length) throw new Error('File video kosong.')
  } catch (err) {
    await m.react('❌').catch(() => { })
    const tooBig = /maxContentLength|exceeded/i.test(err.message)
    return m.gagal(tooBig ? 'Ukuran video melebihi 300MB.' : `Gagal mengunduh video: ${err.message}`, 'YT MP4')
  }

  try {
    const safeName = String(info.title || 'video').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 80)
    await conn.sendMessage(m.chat, {
      video,
      mimetype: 'video/mp4',
      fileName: `${safeName}.mp4`,
      caption: [
        `♡ Judul : ${info.title}`,
        `♡ Kualitas : ${info.quality}p`,
        '',
        FOOTER
      ].join('\n')
    }, { quoted: m })
    await m.react('✅').catch(() => { })
  } catch (err) {
    await m.react('❌').catch(() => { })
    return m.gagal(`Gagal mengirim video: ${err.message}`, 'YT MP4')
  }
}

handler.command = ['ytmp4']
handler.help = ['ytmp4 <link/judul YouTube>']
handler.tags = ['downloader']
handler.wait = true
handler.limit = true
handler.register = true

export default handler
