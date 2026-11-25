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

const API = (global.APIs?.theresav || 'https://api.theresav.eu') + '/api/download/threads'
const APIKEY = global.APIKeys?.[global.APIs?.theresav || 'https://api.theresav.eu'] || ''
const TIMEOUT_MS = 60000
const MAX_BYTES = 80 * 1024 * 1024

const URL_RE = /https?:\/\/(www\.)?threads\.(com|net)\/[^\s]+/i

const fetchBuffer = async (url) => {
  const { data } = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: TIMEOUT_MS,
    maxContentLength: MAX_BYTES
  })
  return Buffer.from(data)
}

function pickHighestRes(medias) {
  const groups = new Map()
  for (const med of medias) {
    const key = (med.url || '').split('?')[0].replace(/\/t51\.\d+-\d+\//, '/')
    const area = (med.width || 0) * (med.height || 0)
    const prev = groups.get(key)
    if (!prev || area > prev.area) groups.set(key, { ...med, area })
  }
  return [...groups.values()]
}

let handler = async (m, { conn, text }) => {
  const src = (text || '').trim() || m.quoted?.text || ''
  const url = (src.match(URL_RE) || [])[0]
  if (!url) return

  await m.react('⏳').catch(() => { })

  try {
    const { data } = await axios.get(API, {
      params: { url },
      headers: { 'x-apikey': APIKEY },
      timeout: TIMEOUT_MS
    })

    if (!data?.status || !data?.medias?.length) throw new Error('Tidak ada media ditemukan.')

    const medias = pickHighestRes(data.medias)
    const items = []

    for (const med of medias) {
      try {
        const buffer = await fetchBuffer(med.url)
        items.push(med.type === 'video' ? { video: buffer } : { image: buffer })
      } catch (e) {
        console.error('[THREADS] gagal unduh media:', e.message)
      }
    }

    if (!items.length) throw new Error('Semua media gagal diunduh.')

    const hasPhoto = items.some(i => i.image)
    const hasVideo = items.some(i => i.video)

    if (hasPhoto) {
      await conn.sendAlbum(m.chat, items, { quoted: m })
    } else if (items.length === 1) {
      await conn.sendMessage(m.chat, items[0], { quoted: m })
    } else {
      for (const item of items) await conn.sendMessage(m.chat, item, { quoted: m })
    }

    await m.react('✅').catch(() => { })
  } catch (e) {
    console.error('[THREADS]', e)
    await m.react('❌').catch(() => { })
  }
}

handler.help = ['threads']
handler.command = ['threads']
handler.tags = ['downloader']
handler.wait = true
handler.limit = true
handler.register = true

export default handler
