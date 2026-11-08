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

const handler = async (m, { conn, text, usedPrefix, command, __dirname }) => {
  const contoh = `${usedPrefix + command} Femboy | Tomboy`
  const parts = String(text || (m.quoted && (m.quoted.text || m.quoted.caption)) || '').split('|').map(v => v.trim())
  const [t1, t2] = parts
  if (parts.length < 2 || !t1 || !t2) throw `Format: *${usedPrefix + command} teks1 | teks2*\nContoh: *${contoh}*`

  const file = join(__dirname, '..', 'scrape', 'drake.js')
  if (!existsSync(file)) throw `Scrape *drake* belum ada. Tambahkan dulu pakai ${usedPrefix}addscrape drake`

  await m.wait()

  const { default: drake } = await import(pathToFileURL(file).href + '?t=' + Date.now())
  const data = await drake(t1, t2)
  if (!data || !data.status) {
    console.error('[DRAKE]', data && data.message)
    throw `Gagal membuat meme Drake.${data && data.message ? '\n' + data.message : ''}`
  }

  await conn.sendFile(m.chat, data.buffer, 'drake.png', '', m)
}

handler.help = ['drake <teks1 | teks2>']
handler.tags = ['maker']
handler.command = /^(drake)$/i
handler.limit = true
handler.register = true

export default handler
