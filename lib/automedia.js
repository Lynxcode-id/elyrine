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

const MEDIA = /^(image|video|audio)\//
const DATA_URI = /^data:[^,]*?(;base64)?,([\s\S]+)$/i
const B64 = /^[A-Za-z0-9+/_-]+={0,2}$/
const PRIORITY = ['result', 'url', 'image', 'video', 'audio', 'data', 'link', 'base64', 'file', 'output']
const MAX_SIZE = 30 * 1024 * 1024

const get = (url, params) => axios.get(url, {
  params,
  responseType: 'arraybuffer',
  timeout: 60000,
  maxContentLength: MAX_SIZE,
  validateStatus: () => true
})

const detect = async buf => {
  const t = buf?.length ? await fileTypeFromBuffer(buf).catch(() => null) : null
  return t && MEDIA.test(t.mime) ? { mime: t.mime, ext: t.ext } : null
}

const candidates = (v, out = [], depth = 0) => {
  if (depth > 6 || v == null) return out
  if (typeof v === 'string') out.push(v)
  else if (Array.isArray(v)) v.forEach(x => candidates(x, out, depth + 1))
  else if (typeof v === 'object') {
    const keys = Object.keys(v).sort((a, b) => {
      const ia = PRIORITY.indexOf(a.toLowerCase()), ib = PRIORITY.indexOf(b.toLowerCase())
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
    })
    keys.forEach(k => candidates(v[k], out, depth + 1))
  }
  return out
}

const decode = str => {
  const s = String(str).trim()
  const d = s.match(DATA_URI)
  if (d) return { buffer: d[1] ? Buffer.from(d[2], 'base64') : Buffer.from(decodeURIComponent(d[2]), 'binary') }
  if (/^https?:\/\/\S+$/i.test(s)) return { url: s }
  const clean = s.replace(/\s+/g, '')
  if (clean.length >= 64 && B64.test(clean)) return { buffer: Buffer.from(clean.replace(/-/g, '+').replace(/_/g, '/'), 'base64') }
  return null
}

const resolve = async (buf, depth = 0) => {
  const direct = await detect(buf)
  if (direct) return { buffer: buf, ...direct }

  const text = buf.toString('utf8').trim()
  let list
  try { list = candidates(JSON.parse(text)) } catch { list = [text] }

  for (const c of list) {
    const d = decode(c)
    if (d?.buffer) {
      const t = await detect(d.buffer)
      if (t) return { buffer: d.buffer, ...t }
    } else if (d?.url && depth < 2) {
      try {
        const r = await get(d.url)
        const found = await resolve(Buffer.from(r.data), depth + 1)
        if (found) return found
      } catch { }
    }
  }
  return null
}

const errorText = (buf, status) => {
  const text = buf.toString('utf8').trim()
  let msg = text
  try {
    const j = JSON.parse(text)
    msg = j.message || j.error || j.msg || JSON.stringify(j)
  } catch { }
  return `HTTP ${status}: ${String(msg).slice(0, 200)}`
}

export async function fetchMedia(url, params) {
  const res = await get(url, params)
  const buf = Buffer.from(res.data)
  const found = await resolve(buf)
  if (!found) throw new Error(errorText(buf, res.status))
  return found
}
