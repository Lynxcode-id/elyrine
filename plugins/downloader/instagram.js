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

const BASE = global.APIs?.theresav || 'https://api.theresav.eu'
const IG_REGEX = /https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels|tv|share)\/[^\s]+/i
const MAX_SIZE = 80 * 1024 * 1024
const MAX_ITEMS = 20
const UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'

const fetchBuffer = async url => {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 120000,
    maxContentLength: MAX_SIZE,
    maxBodyLength: MAX_SIZE,
    headers: { 'User-Agent': UA }
  })
  const buf = Buffer.from(res.data)
  if (!buf.length) throw new Error('File kosong.')
  return buf
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const src = (args || []).join(' ') || m.quoted?.text || ''
  const url = src.match(IG_REGEX)?.[0]
  if (!url) throw `Masukkan link Instagram.\nContoh: *${usedPrefix + command} https://www.instagram.com/p/xxxx*`

  const apikey = global.APIKeys?.[BASE]
  if (!apikey) throw `API key belum diisi. Tambahkan di config.js:\nglobal.APIKeys['${BASE}'] = 'apikey'`

  await m.wait()

  const res = await axios.get(`${BASE}/api/download/instagram`, {
    params: { url },
    headers: { 'x-apikey': apikey },
    timeout: 60000,
    validateStatus: () => true
  })

  const json = res.data
  const d = json?.data || json?.result || json
  const items = (d?.items || []).filter(i => i?.video || i?.image).slice(0, MAX_ITEMS)

  if (res.status !== 200 || json?.status === false || !items.length) {
    console.error('[IG] API error', res.status, JSON.stringify(json)?.slice(0, 200))
    throw `Gagal mengambil data Instagram (HTTP ${res.status}).${json?.message ? '\n' + json.message : ''}`
  }

  const caption = String(d.caption || d.description || '').trim()

  try {
    if (items.length === 1) {
      const it = items[0]
      const isVid = it.type === 'video' && it.video
      const buf = await fetchBuffer(isVid ? it.video : it.image)
      await conn.sendMessage(m.chat, isVid
        ? { video: buf, mimetype: 'video/mp4', caption }
        : { image: buf, caption }, { quoted: m })
      return m.react('✅').catch(() => { })
    }

    const media = (await Promise.all(items.map(async it => {
      try {
        if (it.type === 'video' && it.video) return { video: await fetchBuffer(it.video), mimetype: 'video/mp4' }
        return { image: await fetchBuffer(it.image) }
      } catch (e) {
        console.error('[IG] media gagal:', e.message)
        return null
      }
    }))).filter(Boolean)
    if (!media.length) throw new Error('Semua media gagal diunduh.')

    let sent = 0
    try {
      const r = await conn.sendAlbum(m.chat, media, { quoted: m })
      sent = r?.sent || 0
    } catch (e) { console.error('[IG] album error:', e.message) }
    if (!sent) throw new Error('Album gagal terkirim ke WhatsApp.')

    if (caption) await conn.sendMessage(m.chat, { text: caption }, { quoted: m })
    await m.react('✅').catch(() => { })
  } catch (e) {
    console.error('[IG]', e)
    await m.react('❌').catch(() => { })
    throw `Gagal mengirim media: ${e.message}`
  }
}

handler.help = ['ig <link>']
handler.tags = ['downloader']
handler.command = /^(ig|instagram)$/i
handler.limit = true
handler.register = true

export default handler
