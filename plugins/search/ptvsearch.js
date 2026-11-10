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
import { toCircleVideo, sendPtv } from '../../lib/ptv.js'

const LYNX = (global.APIs?.lynxapis || 'https://lynxapis.my.id') + '/api/downloader/tiktok-v4'
const SESSION_TTL = 5 * 60 * 1000
const MAX_SIZE = 80 * 1024 * 1024
const MAX_LIST = 10
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
  Referer: 'https://www.tiktok.com/'
}

if (!global.ptvSearchSessions) global.ptvSearchSessions = new Map()
const keyOf = m => `${m.chat}|${m.sender}`

const isVideo = b => b?.length > 12 && (b.slice(4, 8).toString() === 'ftyp' || b.slice(0, 4).toString('hex') === '1a45dfa3')
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }
const clip = (s, n = 70) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s }

async function fetchBuffer(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 120000, maxContentLength: MAX_SIZE, maxBodyLength: MAX_SIZE, headers: HEADERS })
  const buf = Buffer.from(res.data)
  if (!buf.length) throw new Error('File kosong.')
  return buf
}

async function fetchVideo(urls) {
  let lastErr
  for (const u of urls.filter(Boolean)) {
    try {
      const buf = await fetchBuffer(u)
      if (isVideo(buf)) return buf
      lastErr = new Error('Isi file bukan video.')
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('Tidak ada URL video.')
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const q = (text || '').trim()
  if (!q) throw `Masukkan kata kunci.\nContoh: *${usedPrefix + command} erine jkt48*`

  const base = global.APIs?.yonz
  const apikey = global.APIKeys?.[base]
  if (!base || !apikey) throw 'API Yonz atau API key belum dikonfigurasi di config.js.'

  await m.react('🔎').catch(() => { })
  try {
    const url = new URL('/search/tiktok/v2', base)
    url.search = new URLSearchParams({ apikey, query: q, lang: 'en' })
    const json = await fetch(url).then(r => r.json())
    if (!json?.status || !Array.isArray(json.result) || !json.result.length) throw 'Video TikTok tidak ditemukan.'

    const seen = new Set()
    const pool = json.result.filter(v => v?.url && !seen.has(v.url) && seen.add(v.url))
    const items = shuffle(pool).slice(0, MAX_LIST)

    global.ptvSearchSessions.set(keyOf(m), { items, at: Date.now() })

    const caption = [
      '🎬 *ERINE-AI • PTV SEARCH*',
      '',
      `◦ Query : ${json.input || q}`,
      `◦ Total : ${pool.length}`,
      '',
      ...items.map((v, i) => `*${i + 1}.* @${v.author || 'Unknown'}\n${clip(v.title || 'Tanpa judul')}`),
      '',
      `Balas dengan *angka* (1-${items.length}) untuk dibuat PTV.`
    ].join('\n\n')

    const first = items.find(v => v.cover)
    await conn.sendMessage(m.chat, {
      text: caption,
      contextInfo: first ? {
        externalAdReply: {
          title: clip(first.title || 'TikTok Search', 60),
          body: `@${first.author || 'TikTok'} • PTV Search`,
          mediaType: 1,
          thumbnailUrl: first.cover,
          sourceUrl: first.url,
          renderLargerThumbnail: true,
          showAdAttribution: false
        }
      } : undefined
    }, { quoted: m })
    await m.react('💐').catch(() => { })
  } catch (e) {
    await m.react('❌').catch(() => { })
    throw `Gagal mencari TikTok: ${e.message || e}`
  }
}

handler.before = async function (m) {
  const s = global.ptvSearchSessions?.get(keyOf(m))
  if (!s) return false
  if (Date.now() - s.at > SESSION_TTL) { global.ptvSearchSessions.delete(keyOf(m)); return false }
  if (!/^\d{1,2}$/.test((m.text || '').trim())) return false

  const n = parseInt(m.text.trim(), 10)
  if (n < 1 || n > s.items.length) return false
  global.ptvSearchSessions.delete(keyOf(m))

  await m.react('⏳').catch(() => { })
  try {
    const { data: res } = await axios.get(LYNX, { params: { url: s.items[n - 1].url }, timeout: 60000 })
    const d = res?.data
    if (!res?.status || !d) throw new Error(res?.message || 'API tidak mengembalikan data.')
    if (!d.video_no_wm && !d.video) throw new Error('Konten ini slide foto, bukan video.')

    const raw = await fetchVideo([d.video_no_wm, d.video])
    const circle = await toCircleVideo(raw)
    await sendPtv(this, m.chat, circle, { quoted: m })
    await m.react('✅').catch(() => { })
  } catch (e) {
    console.error('[PTVSEARCH]', e)
    await m.react('❌').catch(() => { })
    await m.reply(`❌ Gagal membuat PTV: ${e.response?.data?.message || e.message}`)
  }
  return true
}

handler.help = ['ptvsearch <kata>']
handler.tags = ['search']
handler.command = /^(ptvsearch)$/i
handler.limit = true

export default handler
