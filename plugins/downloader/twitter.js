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

const DEFAULT_BASE = 'https://api.jagoanproject.com'
const BASE = String(global.APIs?.jagoan || DEFAULT_BASE).replace(/\/+$/, '')
const API_PATH = '/api/downloader/twitter'

const TW_REGEX = /https?:\/\/(?:www\.|mobile\.)?(?:twitter|x|fxtwitter|vxtwitter|fixupx)\.com\/[^\s]+/i
const TIMEOUT_API = 60_000
const TIMEOUT_DL = 120_000
const MAX_BYTES = 80 * 1024 * 1024
const MAX_ITEMS = 10
const UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'

const isVideoItem = it => /video|gif/i.test(String(it?.type || ''))

const fetchBuffer = async (url, headers) => {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: TIMEOUT_DL,
    maxContentLength: MAX_BYTES,
    maxBodyLength: MAX_BYTES,
    headers
  })
  const buf = Buffer.from(res.data)
  if (!buf.length) throw new Error('File kosong.')
  return buf
}

const cleanTitle = t => String(t || '')
  .replace(/\s*https?:\/\/t\.co\/\w+\s*$/i, '')
  .trim()

const num = n => (n == null ? null : Number(n).toLocaleString('id-ID'))

function buildCaption(d) {
  const a = d.author || {}
  const s = d.stats || {}
  const lines = []
  const who = [a.name, a.username ? `@${a.username}` : ''].filter(Boolean).join(' ')
  if (who) lines.push(`*${who}*`)
  const title = cleanTitle(d.title)
  if (title) lines.push('', title)
  const st = []
  if (s.likes != null) st.push(`♡ ${num(s.likes)}`)
  if (s.retweets != null) st.push(`🔁 ${num(s.retweets)}`)
  if (s.views != null) st.push(`👁 ${num(s.views)}`)
  if (st.length) lines.push('', st.join('  •  '))
  if (d.sourceUrl) lines.push(d.sourceUrl)
  return lines.join('\n').trim()
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const src = (args || []).join(' ') || m.quoted?.text || m.quoted?.caption || ''
  const url = src.match(TW_REGEX)?.[0]
  if (!url) throw `Masukkan link Twitter/X.\nContoh: *${usedPrefix + command} https://x.com/user/status/123456789*`

  const apikey = global.APIKeys?.[BASE] || global.APIKeys?.[DEFAULT_BASE]
  if (!apikey) throw `API key belum diisi. Tambahkan di config.js:\nglobal.APIKeys['${BASE}'] = 'apikey'`

  await m.wait()

  let d
  try {
    const res = await axios.get(BASE + API_PATH, {
      params: { url },
      headers: { Authorization: `Bearer ${apikey}`, 'User-Agent': UA, Accept: 'application/json' },
      timeout: TIMEOUT_API,
      validateStatus: () => true
    })
    const json = res.data
    d = json?.data
    const list = Array.isArray(d?.media) ? d.media.filter(x => x?.url || x?.sourceUrl) : []
    if (res.status !== 200 || json?.status === false || !list.length) {
      console.error('[TWITTER] API error', res.status, JSON.stringify(json)?.slice(0, 300))
      await m.react('❌').catch(() => { })
      throw (res.status !== 200 || json?.status === false)
        ? `${json?.message || 'Gagal mengambil data Twitter/X.'} (HTTP ${res.status})`
        : 'Tidak ada foto/video di tweet ini.'
    }
    d.media = list
  } catch (e) {
    if (typeof e === 'string') throw e
    console.error('[TWITTER]', e.message)
    await m.react('❌').catch(() => { })
    throw `Gagal menghubungi server Twitter downloader: ${e.message}`
  }

  const queue = d.media.slice(0, MAX_ITEMS)

  const items = (await Promise.all(queue.map(async it => {
    const link = it.url || it.sourceUrl
    const headers = link.startsWith(BASE) ? { Authorization: `Bearer ${apikey}`, 'User-Agent': UA } : { 'User-Agent': UA }
    try {
      const buffer = await fetchBuffer(link, headers)
      if (isVideoItem(it)) return { kind: 'video', gif: /gif/i.test(it.type), buffer }
      return { kind: 'image', buffer }
    } catch (e) {
      if (it.sourceUrl && it.sourceUrl !== link) {
        try {
          const buffer = await fetchBuffer(it.sourceUrl, { 'User-Agent': UA })
          if (isVideoItem(it)) return { kind: 'video', gif: /gif/i.test(it.type), buffer }
          return { kind: 'image', buffer }
        } catch { }
      }
      console.error('[TWITTER] media gagal diunduh:', e.message)
      return null
    }
  }))).filter(Boolean)

  if (!items.length) {
    await m.react('❌').catch(() => { })
    throw 'Semua media gagal diunduh.'
  }

  const photos = items.filter(i => i.kind === 'image')
  const videos = items.filter(i => i.kind === 'video')

  try {
    if (!photos.length) {
      const caption = buildCaption(d)
      for (let i = 0; i < videos.length; i++) {
        const v = videos[i]
        await conn.sendMessage(m.chat, {
          video: v.buffer,
          mimetype: 'video/mp4',
          ...(v.gif ? { gifPlayback: true } : {}),
          ...(i === 0 && caption ? { caption } : {})
        }, { quoted: m })
      }
    } else {
      const media = items.map(i => i.kind === 'video'
        ? { video: i.buffer, mimetype: 'video/mp4' }
        : { image: i.buffer })
      const r = await conn.sendAlbum(m.chat, media, { quoted: m })
      if (!r?.sent) throw new Error('Album gagal terkirim ke WhatsApp.')
    }
    await m.react('✅').catch(() => { })
  } catch (e) {
    console.error('[TWITTER] kirim gagal:', e)
    await m.react('❌').catch(() => { })
    throw `Gagal mengirim media: ${e.message}`
  }
}

handler.help = ['twitter <link>', 'x <link>']
handler.tags = ['downloader']
handler.command = /^(twitter|x)$/i
handler.limit = true
handler.register = true

export default handler
