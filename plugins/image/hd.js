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
import { mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { pathToFileURL } from 'url'

const findUrl = obj => {
  const urls = []
  const walk = (v, k = '') => {
    if (typeof v === 'string' && /^https?:\/\//i.test(v)) urls.push([k, v])
    else if (v && typeof v === 'object') for (const [kk, vv] of Object.entries(v)) walk(vv, kk)
  }
  walk(obj)
  const pick = urls.find(([k]) => /output|result|enhanc/i.test(k) && !/original|input/i.test(k)) ||
    urls.find(([k]) => !/original|input/i.test(k))
  return pick?.[1]
}

const handler = async (m, { conn, __dirname, usedPrefix }) => {
  const root = join(__dirname, '..')
  const dir = join(root, 'scrape')
  mkdirSync(dir, { recursive: true })

  const file = join(dir, 'hdimage.js')
  if (!existsSync(file)) throw `Scrape *hdimage* belum ada. Tambahkan dulu pakai ${usedPrefix}addscrape hdimage`

  const target = [m, m.quoted].find(x => /^image\//i.test(x?.mimetype || x?.msg?.mimetype || '') && typeof x?.download === 'function')
  if (!target) throw 'Kirim atau reply foto dengan perintah ini.'

  await m.wait()

  const buf = await target.download()
  if (!Buffer.isBuffer(buf) || !buf.length) throw 'Foto gagal diunduh.'

  const { default: hdimage } = await import(pathToFileURL(file).href + '?t=' + Date.now())
  const data = await hdimage(buf)

  if (data?.status === false || data?.result?.status !== 1) {
    console.error('[HD]', JSON.stringify(data)?.slice(0, 300))
    throw `Gagal meng-HD-kan foto.${typeof data?.message === 'string' ? '\n' + data.message : ''}`
  }

  const url = findUrl(data.result)
  if (!url) {
    console.error('[HD] URL hasil tidak ditemukan:', JSON.stringify(data)?.slice(0, 500))
    throw 'Proses selesai tapi URL hasil tidak ditemukan, cek console.'
  }

  const out = Buffer.from((await axios.get(url, { responseType: 'arraybuffer', timeout: 120000 })).data)
  await conn.sendFile(m.chat, out, 'hd.jpg', '', m)
}

handler.help = ['hd']
handler.tags = ['image']
handler.command = /^(hd)$/i
handler.limit = true
handler.register = true

export default handler
