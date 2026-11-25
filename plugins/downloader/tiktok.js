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
import { scrapeTikTok, TIKDOWN_UA, TIKDOWN_HOST } from '../../scrape/tikdown.js'
import { sendVideoBadge } from '../../lib/videobadge.js'
import { omdown, fetchBuffer as omFetch, firstValid as omFirstValid } from '../../scrape/omdown.js'

const TT_REGEX = /^(https?:\/\/)?((www|m|vm|vt)\.)?tiktok\.com\/\S+/i
const MAX_SIZE = 80 * 1024 * 1024

const absUrl = (u, base = TIKDOWN_HOST) => {
  const s = String(u ?? '').trim()
  if (!s || s === 'undefined' || s === 'null') return null
  try {
    const url = new URL(s, base)
    return /^https?:$/.test(url.protocol) ? url.href : null
  } catch { return null }
}

const describeFetchError = (e, u) => {
  let host = ''
  try { host = new URL(u).host } catch { }
  const status = e.response?.status
  return `${e.message}${e.code ? ` [${e.code}]` : ''}${status ? ` HTTP ${status}` : ''}${host ? ` @ ${host}` : ''}`
}

const fetchBuffer = async url => {
  const u = absUrl(url)
  if (!u) throw new Error(`URL media tidak valid: "${String(url ?? '').slice(0, 80)}"`)
  try {
    const res = await axios.get(u, {
      responseType: 'arraybuffer', timeout: 120000, maxContentLength: MAX_SIZE, maxBodyLength: MAX_SIZE,
      headers: { 'User-Agent': TIKDOWN_UA, Referer: `${TIKDOWN_HOST}/` }
    })
    const buf = Buffer.from(res.data)
    if (!buf.length) throw new Error('File kosong.')
    return buf
  } catch (e) {
    throw new Error(describeFetchError(e, u))
  }
}

async function fetchBestVideo(videos) {
  const errs = []
  for (const v of videos) {
    try {
      return { buffer: await fetchBuffer(v.url), picked: v }
    } catch (e) {
      errs.push(`${v.label}: ${e.message}`)
      console.error(`[TIKDOWN] video "${v.label}" gagal/timeout, coba kualitas lain:`, e.message, '| url:', String(v.url).slice(0, 120))
    }
  }
  throw new Error(errs.length ? `Video gagal diunduh (${errs.join(' | ')})` : 'Tidak ada video untuk diunduh.')
}

function buildCaption(d) {
  const lines = [
    '*[ Tiktok Downloader ]*',
    '',
    `• Nickname: ${d.author || '-'}`,
    `• Views: ${d.stats?.views ?? '-'}`,
    `• Like: ${d.stats?.likes ?? '-'}`
  ]
  if (d.caption) lines.push('', d.caption)
  return lines.join('\n')
}

async function prefetchTikdown(url) {
  const d = await scrapeTikTok(url)
  const out = { caption: buildCaption(d), images: [], video: null, audio: null, id: d.id }
  for (const img of d.images) {
    try { out.images.push(await fetchBuffer(img.url)) }
    catch (e) { console.error('[TIKDOWN] foto gagal:', e.message) }
  }
  if (d.videos.length) {
    try { out.video = (await fetchBestVideo(d.videos)).buffer }
    catch (e) { if (!d.images.length) throw e; console.error('[TIKDOWN] video gagal:', e.message) }
  }
  if (d.audio?.url) out.audio = await fetchBuffer(d.audio.url).catch(e => { console.error('[TIKDOWN] audio gagal:', e.message); return null })
  if (!out.images.length && !out.video) throw new Error('Semua media gagal diunduh.')
  return out
}

async function prefetchOmdown(url) {
  const { data, cookie, videos, audios, photos } = await omdown(url)
  const out = { caption: buildCaption({ author: data.author || data.uploader || data.nickname, stats: data.stats, caption: data.title || data.caption }), images: [], video: null, audio: null, id: data.id }
  for (const u of photos) {
    try { out.images.push(await omFetch(u, cookie, 'image')) }
    catch (e) { console.error('[OMDOWN] foto gagal:', e.message) }
  }
  if (videos.length) {
    try { out.video = (await omFirstValid(videos, cookie, 'video')).buf }
    catch (e) { if (!out.images.length) throw e; console.error('[OMDOWN] video gagal:', e.message) }
  }
  if (audios.length) out.audio = await omFirstValid(audios, cookie, 'audio').then(r => r.buf).catch(() => null)
  if (!out.images.length && !out.video) throw new Error('Semua media gagal diunduh.')
  return out
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const url = (text || '').trim().split(/\s+/)[0]
  if (!url) throw `*Contoh:* ${usedPrefix || '.'}${command} https://vt.tiktok.com/ZS4y5vc3F/`
  if (!TT_REGEX.test(url)) throw 'Link tidak valid, kirim link TikTok.'

  await m.react('⏳').catch(() => { })

  let media, engine = 'TikDown'
  try {
    media = await prefetchTikdown(url)
  } catch (e1) {
    console.error('[TIKDOWN] gagal, pakai fallback Omdown:', e1.message)
    try {
      media = await prefetchOmdown(url)
      engine = 'Omdown'
    } catch (e2) {
      console.error('[OMDOWN] fallback gagal:', e2.message)
      await m.react('❌').catch(() => { })
      return m.gagal(`Gagal mengambil video.\n• TikDown: ${e1.message}\n• Omdown: ${e2.message}`, 'TikDown')
    }
  }

  const { caption, images, video, audio, id } = media

  try {
    if (images.length) {
      const items = images.map(image => ({ image }))
      if (video) items.push({ video, mimetype: 'video/mp4' })

      let sent = 0
      try {
        const r = await conn.sendAlbum(m.chat, items, { quoted: m })
        sent = r?.sent || 0
      } catch (e) { console.error('[TIKDOWN] album error:', e.message) }

      if (!sent) {
        for (const item of items) {
          try { await conn.sendMessage(m.chat, item, { quoted: m }); sent++ }
          catch (e) { console.error('[TIKDOWN] kirim item error:', e.message) }
        }
      }
      if (!sent) throw new Error('Media terunduh tapi gagal terkirim ke WhatsApp.')

      await m.react('✅').catch(() => { })
      return
    }

    try {
      await sendVideoBadge(conn, m.chat, video, { caption, quoted: m })
    } catch (e) {
      console.error('[TIKDOWN] badge gagal, kirim video biasa:', e.message)
      await conn.sendMessage(m.chat, { video, caption, mimetype: 'video/mp4' }, { quoted: m })
    }

    if (audio) {
      try {
        await conn.sendMessage(m.chat, { audio, mimetype: 'audio/mpeg', fileName: `${id || 'tiktok'}.mp3` }, { quoted: m })
      } catch (e) { console.error('[TIKDOWN] audio gagal:', e.message) }
    }

    await m.react('✅').catch(() => { })
  } catch (e) {
    console.error('[TIKDOWN]', e)
    await m.react('❌').catch(() => { })
    const tooBig = /maxContentLength|exceeded/i.test(e.message)
    return m.gagal(tooBig ? 'Ukuran file melebihi 80MB.' : `Gagal mengirim: ${e.message}`, engine)
  }
}

handler.command = ['tiktok', 'tt']
handler.help = ['tiktok <link tiktok>']
handler.tags = ['downloader']
handler.wait = true
handler.limit = true
handler.register = true

export default handler
