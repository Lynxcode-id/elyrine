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

import sharp from 'sharp'
import { sendVideoBadge } from '../../lib/videobadge.js'
import { omdown, fetchBuffer, firstValid } from '../../scrape/omdown.js'

const toJpeg = async (b) => {
  try { return await sharp(b).rotate().jpeg({ quality: 92 }).toBuffer() } catch { return (b[0] === 0xff && b[1] === 0xd8) ? b : null }
}

function buildCaption(d, platform) {
  const s = d.stats || {}
  const lines = ['*[ AIO Downloader ]*', '', `• Platform: ${platform}`]
  if (d.author) lines.push(`• Author: ${d.author}`)
  if (d.durationLabel) lines.push(`• Durasi: ${d.durationLabel}`)
  if (s.views != null) lines.push(`• Views: ${s.views}`)
  if (s.likes != null) lines.push(`• Like: ${s.likes}`)
  if (s.comments != null) lines.push(`• Comment: ${s.comments}`)
  if (s.shares != null) lines.push(`• Share: ${s.shares}`)
  if (d.title) lines.push('', d.title)
  return lines.join('\n')
}

const URL_RE = /https?:\/\/[^\s]+/i

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const src = (text || '').trim() || m.quoted?.text || m.quoted?.msg?.text || m.quoted?.caption || ''
  const url = (src.match(URL_RE) || [])[0]
  if (!url) throw `*Contoh:* ${usedPrefix || '.'}${command} https://vt.tiktok.com/ZSpDHjnAk/\n\nSupport TikTok, Instagram, Facebook, YouTube, Twitter/X, Pinterest, Threads, dll.`

  await m.react('⏳').catch(() => { })

  let platform, data, cookie, videos, audios, photos
  try {
    ;({ platform, data, cookie, videos, audios, photos } = await omdown(url))
  } catch (e) {
    await m.react('❌').catch(() => { })
    return m.gagal(`Gagal mengambil data: ${e.response?.data?.message || e.message}`, 'Omdown')
  }

  if (!videos.length && !audios.length && !photos.length) {
    await m.react('❌').catch(() => { })
    return m.gagal('Format download tidak ditemukan untuk link ini.', 'Omdown')
  }

  try {
    let sentMain = false

    if (!videos.length && photos.length) {
      const raw = await Promise.all(photos.map(u =>
        fetchBuffer(u, cookie, 'image').catch(e => { console.error('[AIO] foto gagal:', e.message); return null })
      ))
      const buffers = (await Promise.all(raw.filter(Boolean).map(toJpeg))).filter(Boolean)
      if (!buffers.length) throw new Error('Semua foto gagal diunduh.')

      let sent = 0
      if (buffers.length > 1) {
        try {
          const r = await conn.sendAlbum(m.chat, buffers.map(image => ({ image })), { quoted: m })
          sent = r?.sent || 0
        } catch (e) { console.error('[AIO] album error:', e.message) }
      }
      if (!sent) {
        for (const image of buffers) {
          try { await conn.sendMessage(m.chat, { image }, { quoted: m }); sent++ } catch (e) { console.error('[AIO] kirim foto error:', e.message) }
        }
      }
      if (!sent) throw new Error('Foto terunduh tapi gagal terkirim ke WhatsApp.')
      sentMain = true
    }

    else if (videos.length) {
      const { buf: video } = await firstValid(videos, cookie, 'video')
      const caption = buildCaption(data, platform)
      try {
        await sendVideoBadge(conn, m.chat, video, { caption, quoted: m })
      } catch (e) {
        console.error('[AIO] badge gagal, kirim video biasa:', e.message)
        await conn.sendMessage(m.chat, { video, caption, mimetype: 'video/mp4' }, { quoted: m })
      }
      sentMain = true
    }

    if (audios.length) {
      try {
        const { buf: audio } = await firstValid(audios, cookie, 'audio')
        await conn.sendMessage(m.chat, { audio, mimetype: 'audio/mpeg', ptt: false }, { quoted: m })
        sentMain = true
      } catch (e) {
        console.error('[AIO] audio gagal:', e.message)
        if (!sentMain) throw e
      }
    }

    if (!sentMain) throw new Error('Tidak ada media yang terkirim.')
    await m.react('✅').catch(() => { })
  } catch (e) {
    console.error('[AIO]', e)
    await m.react('❌').catch(() => { })
    const tooBig = /maxContentLength|exceeded/i.test(e.message)
    return m.gagal(tooBig ? 'Ukuran file melebihi 80MB.' : `Gagal mengirim: ${e.message}`, 'AIO')
  }
}

handler.command = ['aio']
handler.help = ['aio <link>']
handler.tags = ['downloader']
handler.wait = true
handler.limit = true
handler.register = true

export default handler
