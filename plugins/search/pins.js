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
const TOTAL = 10

const fetchBuffer = async url => {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000, maxContentLength: 25 * 1024 * 1024 })
  const buf = Buffer.from(res.data)
  if (!buf.length) throw new Error('File kosong.')
  return buf
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const q = (text || m.quoted?.text || '').trim()
  if (!q) throw `Masukkan kata kunci.\nContoh: *${usedPrefix + command} jkt48 erine*`

  const apikey = global.APIKeys?.[BASE]
  if (!apikey) throw `API key belum diisi. Tambahkan di config.js:\nglobal.APIKeys['${BASE}'] = 'apikey'`

  await m.wait()

  const res = await axios.get(`${BASE}/api/search/pinterest`, {
    params: { q },
    headers: { 'x-apikey': apikey },
    timeout: 60000,
    validateStatus: () => true
  })

  const list = (res.data?.result || []).map(v => v?.image).filter(Boolean)
  if (res.status !== 200 || !list.length) {
    console.error('[PIN] API error', res.status, JSON.stringify(res.data)?.slice(0, 200))
    throw `Gambar tidak ditemukan (HTTP ${res.status}).`
  }

  const images = (await Promise.all(list.slice(0, TOTAL).map(u =>
    fetchBuffer(u).then(image => ({ image })).catch(e => { console.error('[PIN] gagal:', e.message); return null })
  ))).filter(Boolean)
  if (!images.length) throw 'Semua gambar gagal diunduh.'

  let sent = 0
  try {
    const r = await conn.sendAlbum(m.chat, images, { quoted: m })
    sent = r?.sent || 0
  } catch (e) { console.error('[PIN] album error:', e.message) }
  if (!sent) throw 'Album gagal terkirim ke WhatsApp.'
}

handler.help = ['pins <query>']
handler.tags = ['search']
handler.command = /^(pins)$/i
handler.limit = true
handler.register = true

export default handler
