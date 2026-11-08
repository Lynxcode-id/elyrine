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
import { successText } from '../../lib/respon.js'

const MAX_VIDEOS = 5
const CAPTION_LIMIT = 1000
const FOOTER = 'with love, elyra !!'

function formatNumber(num) {
  if (!num) return '0'
  const suffixes = ['', 'k', 'M', 'B', 'T']
  const numString = Math.abs(num).toString()
  const numDigits = numString.length
  if (numDigits <= 3) return numString

  const suffixIndex = Math.floor((numDigits - 1) / 3)
  let formatted = (num / Math.pow(1000, suffixIndex)).toFixed(1)
  if (formatted.endsWith('.0')) formatted = formatted.slice(0, -2)
  return formatted + suffixes[suffixIndex]
}

const buildUsage = p => [
  '🌷 *YouTube Search*',
  '',
  'Cari video YouTube',
  'langsung dari WhatsApp.',
  '',
  `♡ ${p}yts <pencarian>`,
  `♡ contoh: ${p}yts everything u are hindia`,
  '',
  FOOTER
].join('\n')

const buildHeader = query => [
  '🌷 *YouTube Search*',
  '',
  `Hasil pencarian untuk *${query}*`
].join('\n')

function buildList(p, videos) {
  const items = videos.map((v, i) => [
    `*${i + 1}. ${v.title}*`,
    `♡ Channel : ${v.author?.name || '-'}`,
    `♡ Durasi : ${v.timestamp || '-'}`,
    `♡ Views : ${formatNumber(v.views)}`,
    `♡ Upload : ${v.ago || '-'}`,
    `♡ Link : ${v.url}`
  ].join('\n'))

  return [
    items.join('\n\n'),
    '',
    `♡ ${p}ytmp3 <url> untuk download mp3`,
    '',
    FOOTER
  ].join('\n')
}

let handler = async (m, { conn, text, usedPrefix }) => {
  const p = usedPrefix || '.'
  const query = (text || '').trim()
  if (!query) throw buildUsage(p)

  await m.react('⏳').catch(() => { })

  let videos
  try {
    const result = await yts(query)
    videos = (result?.videos || []).slice(0, MAX_VIDEOS)
  } catch (err) {
    console.error('[YTS] pencarian gagal:', err?.message || err)
    await m.react('❌').catch(() => { })
    return m.gagal('Terjadi kesalahan saat mencari di YouTube.', 'YouTube Search')
  }

  if (!videos.length) {
    await m.react('❌').catch(() => { })
    return m.gagal(`Hasil untuk "${query}" tidak ditemukan.`, 'YouTube Search')
  }

  const header = buildHeader(query)
  const list = buildList(p, videos)
  const full = `${header}\n\n${list}`
  const elapsed = () => Date.now() - (m.startedAt || Date.now())

  try {
    let thumb = null
    try {
      const res = await axios.get(videos[0].thumbnail || videos[0].image, { responseType: 'arraybuffer', timeout: 20000 })
      thumb = Buffer.from(res.data)
    } catch (err) {
      console.error('[YTS] gagal ambil thumbnail:', err?.message || err)
    }

    if (thumb?.length) {
      const wrapped = successText(full, elapsed())
      if (wrapped.length <= CAPTION_LIMIT) {
        await conn.sendMessage(m.chat, { image: thumb, caption: wrapped }, { quoted: m })
      } else {
        await conn.sendMessage(m.chat, { image: thumb, caption: header }, { quoted: m })
        await m.sukses(list)
      }
    } else {
      await m.sukses(full)
    }

    await m.react('✅').catch(() => { })
  } catch (err) {
    console.error('[YTS] gagal mengirim hasil:', err?.stack || err?.message || err)
    await m.react('❌').catch(() => { })
    return m.gagal('Terjadi kesalahan saat mengirim hasil pencarian.', 'YouTube Search')
  }
}

handler.command = ['yts', 'ytsearch', 'youtubesearch']
handler.help = ['yts <pencarian>']
handler.tags = ['search']
handler.wait = true
handler.limit = true

export default handler
