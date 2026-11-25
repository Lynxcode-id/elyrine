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
import { fileTypeFromBuffer } from 'file-type'

const DATA_URI = /^data:[^,]*?(;base64)?,([\s\S]+)$/i

const pickMedia = v => {
  if (!v) return null
  if (typeof v === 'string') {
    const d = v.match(DATA_URI)
    if (d) return { buffer: d[1] ? Buffer.from(d[2], 'base64') : Buffer.from(decodeURIComponent(d[2]), 'binary') }
    return /^https?:\/\//i.test(v) ? { url: v } : null
  }
  if (typeof v === 'object') {
    for (const k of ['url', 'result', 'image', 'video', 'data', 'link']) {
      const r = pickMedia(v[k])
      if (r) return r
    }
  }
  return null
}

const fetchBuffer = (url, params) => axios.get(url, {
  params,
  responseType: 'arraybuffer',
  timeout: 60000,
  maxContentLength: 30 * 1024 * 1024,
  validateStatus: () => true
})

const isMedia = type => type && /^(image|video)\//.test(type.mime)

const handler = async (m, { conn, usedPrefix, command }) => {
  const q = m.quoted
  const target = [m, q].find(x => /^image\//i.test(x?.mimetype || x?.msg?.mimetype || '') && typeof x?.download === 'function')
  if (!target) throw `Kirim atau reply foto dengan caption *${usedPrefix + command}*`

  await m.wait()

  const buf = await target.download()
  if (!Buffer.isBuffer(buf) || !buf.length) throw 'Gagal mengunduh foto.'

  const { default: uploadImage } = await import('../../lib/uploader.js')
  const url = await uploadImage(buf).catch(() => null)
  if (!/^https?:\/\//i.test(url || '')) throw 'Gagal mengunggah foto, coba lagi.'

  const res = await fetchBuffer(`${global.APIs.apicloud}/maker/duarviral`, { url })
  let out = Buffer.from(res.data)
  let type = await fileTypeFromBuffer(out).catch(() => null)

  if (!isMedia(type)) {
    let json
    try { json = JSON.parse(out.toString('utf8')) } catch { }
    const media = pickMedia(json && (json.result ?? json.data ?? json.url))
    if (media?.buffer) {
      out = media.buffer
      type = await fileTypeFromBuffer(out).catch(() => null)
    } else if (media?.url) {
      const r2 = await fetchBuffer(media.url)
      out = Buffer.from(r2.data)
      type = await fileTypeFromBuffer(out).catch(() => null)
    }
  }

  if (!isMedia(type)) {
    const body = out.toString('utf8').slice(0, 200)
    console.error('[duarviral] API error', res.status, body)
    throw `Duar Viral gagal (HTTP ${res.status}): ${body}`
  }

  await conn.sendFile(m.chat, out, `duarviral.${type.ext}`, '', m)
}

handler.help = ['toduar']
handler.tags = ['maker']
handler.command = /^(toduar)$/i
handler.register = true

export default handler
