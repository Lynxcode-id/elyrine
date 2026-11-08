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
  const target = [m, m.quoted].find(isImg)
  const quotedText = m.quoted && !isImg(m.quoted) ? (m.quoted.text || m.quoted.caption || '') : ''
  const input = String(text || quotedText || '').trim()
  if (!input && !target) throw `Masukkan teks, atau kirim/reply foto.\nContoh: *${usedPrefix + command} halo semuanya 🌹*`

  const file = join(__dirname, '..', 'scrape', 'igqc.js')
  if (!existsSync(file)) throw `Scrape *igqc* belum ada. Tambahkan dulu pakai ${usedPrefix}addscrape igqc`

  await m.wait()

  let buf = null
  if (target) {
    buf = await target.download()
    if (!Buffer.isBuffer(buf) || !buf.length) throw 'Foto gagal diunduh.'
  }

  const { default: igqc } = await import(pathToFileURL(file).href + '?t=' + Date.now())
  const data = await igqc(input, buf)
  if (!data || !data.status) {
    console.error('[IGQC]', data && data.message)
    throw `Gagal membuat IG Quote Chat.${data && data.message ? '\n' + data.message : ''}`
  }

  await conn.sendFile(m.chat, data.buffer, 'igqc.png', '', m)
}

handler.help = ['igqc <teks>']
handler.tags = ['maker']
handler.command = /^(igqc)$/i
handler.limit = true
handler.register = true

export default handler
