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

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const isImg = x => x && /^image\//i.test(x.mimetype || (x.msg && x.msg.mimetype) || '') && typeof x.download === 'function'

const handler = async (m, { conn, text, usedPrefix, command, __dirname }) => {
  const cmd = command.toLowerCase()
  const file = join(__dirname, '..', 'scrape', 'nanobanana.js')
  if (!existsSync(file)) throw `Scrape *nanobanana* belum ada. Tambahkan dulu pakai ${usedPrefix}addscrape nanobanana`

  const target = [m, m.quoted].find(isImg)
  const input = String(text || (m.quoted && !isImg(m.quoted) ? m.quoted.text : '') || '').trim()
  const [prompt, style] = input.split('|').map(v => v.trim())

  const needImg = cmd !== 'nanobanana' && cmd !== 'nbanana'
  if (needImg && !target) throw `Kirim atau reply foto dengan caption *${usedPrefix + command}*`
  if (!needImg && !prompt) throw `Masukkan prompt, atau kirim/reply foto + prompt untuk edit.\nContoh: *${usedPrefix + command} cyberpunk warrior | Cyberpunk*\n(style opsional: Realistic, Anime, Cyberpunk, 3D, dll)`

  await m.wait()

  let buf = null
  if (target) {
    buf = await target.download()
    if (!Buffer.isBuffer(buf) || !buf.length) throw 'Foto gagal diunduh.'
  }

  const nb = (await import(pathToFileURL(file).href + '?t=' + Date.now())).default
  const opts = style ? { style } : {}
  let res
  try {
    if (cmd === 'nbupscale') res = await nb.upscale(buf, { scale: 2 })
    else if (cmd === 'nbremovebg') res = await nb.removeBg(buf)
    else if (buf) res = await nb.imageToImage(buf, prompt || 'enhance image', opts)
    else res = await nb.textToImage(prompt, opts)
  } catch (e) {
    console.error('[NANOBANANA]', e)
    throw `Gagal memproses.\n${(e && e.message) || e}\n\nCatatan: filter NSFW server sensitif, gambar bisa ditolak (false positive).`
  }
  if (!res || !res.url) throw 'Hasil kosong dari server.'

  const name = cmd === 'nbremovebg' ? 'nobg.png' : 'nanobanana.png'
  await conn.sendFile(m.chat, res.url, name, prompt ? `*Prompt:* ${prompt}` : '', m)
}

handler.help = ['nanobanana <prompt | style>', 'nbupscale']
handler.tags = ['image']
handler.command = /^(nanobanana|nbupscale)$/i
handler.limit = true
handler.register = true

export default handler
