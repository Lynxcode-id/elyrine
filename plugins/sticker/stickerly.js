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
import { makeSticker } from '../../lib/sticker-maker.js'

const BASE = global.APIs?.xrina || 'https://apiii-xrina.my.id'
const SEARCH_API = BASE + '/search/stickerly'
const STICKERLY_PACK_API = BASE + '/download/stickerly'
const SESSION_TTL = 5 * 60 * 1000
const MAX_STICKERS = 30
const sleep = ms => new Promise(r => setTimeout(r, ms))

if (!global.stickerlySessions) global.stickerlySessions = new Map()
const keyOf = m => `${m.chat}|${m.sender}`

export const packUrls = data => {
  const list = data?.stickers || data?.data?.stickers || data?.result?.stickers || data?.data || []
  return (Array.isArray(list) ? list : [])
    .map(x => (typeof x === 'string' ? x : x?.url || x?.image || x?.sticker || x?.link))
    .filter(u => typeof u === 'string' && u.startsWith('http'))
    .slice(0, MAX_STICKERS)
}

export const formatList = (query, items) => [
  `*STICKER.LY · ${query}*`,
  '',
  ...items.map((x, i) => `${i + 1}. ${x.name || 'Tanpa nama'} · ${x.total ?? '?'} stiker · ${x.author || '-'}`),
  '',
  'Balas dengan *angka* (1-' + items.length + ') untuk ambil pack-nya.'
].join('\n')

async function sendPack(conn, m, item) {
  const { data: res } = await axios.get(STICKERLY_PACK_API, {
    params: { url: item.shareUrl }, timeout: 60000, validateStatus: () => true
  })
  const urls = packUrls(res)
  if (!urls.length) throw 'Pack ini kosong atau API pack belum tersedia.'

  const name = item.name || 'Sticker'
  const author = item.author || 'Sticker.ly'
  let sent = 0
  for (const url of urls) {
    try {
      const { data: buf } = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
      const sticker = await makeSticker({
        buffer: Buffer.from(buf), mimetype: 'image/webp', packName: name, publisher: author
      })
      await conn.sendMessage(m.chat, { sticker }, { quoted: m })
      sent++
      await sleep(500)
    } catch (e) { console.error('[STICKERLY] gagal satu stiker:', e.message) }
  }
  if (!sent) throw 'Semua stiker dalam pack gagal dikirim.'
  return sent
}

const handler = async (m, { text, usedPrefix, command }) => {
  const q = (text || '').trim()
  if (!q) throw `Masukkan kata kunci.\nContoh: *${usedPrefix + command} erine jkt48*`

  await m.wait()
  const { data: res } = await axios.get(SEARCH_API, { params: { q }, timeout: 30000, validateStatus: () => true })
  const items = (res?.data || []).filter(x => x?.shareUrl).slice(0, 10)
  if (res?.status !== true || !items.length) throw `Sticker untuk *${q}* tidak ditemukan.`

  global.stickerlySessions.set(keyOf(m), { items, query: q, at: Date.now() })
  return m.reply(formatList(q, items))
}

handler.before = async function (m) {
  const s = global.stickerlySessions?.get(keyOf(m))
  if (!s) return false
  if (Date.now() - s.at > SESSION_TTL) { global.stickerlySessions.delete(keyOf(m)); return false }
  if (!/^\d{1,2}$/.test((m.text || '').trim())) return false

  const n = parseInt(m.text.trim(), 10)
  if (n < 1 || n > s.items.length) return false

  global.stickerlySessions.delete(keyOf(m))
  await m.wait()
  try {
    const sent = await sendPack(this, m, s.items[n - 1])
    await m.reply(`✅ Pack *${s.items[n - 1].name}* terkirim (${sent} stiker).`)
  } catch (e) {
    await m.reply(typeof e === 'string' ? e : `Gagal ambil pack: ${e.message}`)
  }
  return true
}

handler.help = ['stickerly <kata kunci>']
handler.tags = ['sticker']
handler.command = /^(stickerly|stikerly)$/i
handler.limit = true
handler.register = true

export default handler
