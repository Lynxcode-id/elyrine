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
  const input = String(text || (m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim()
  if (!input) throw `Masukkan teks atau reply pesan.\nContoh: *${usedPrefix + command} Jarvis, tolong bantu aku*`

  const file = join(__dirname, '..', 'scrape', 'jarvismeme.js')
  if (!existsSync(file)) throw `Scrape *jarvismeme* belum ada. Tambahkan dulu pakai ${usedPrefix}addscrape jarvismeme`

  await m.wait()

  const { default: jarvismeme } = await import(pathToFileURL(file).href + '?t=' + Date.now())
  const data = await jarvismeme(input)
  if (!data || !data.status) {
    console.error('[JARVISMEME]', data && data.message)
    throw `Gagal membuat meme Jarvis.${data && data.message ? '\n' + data.message : ''}`
  }

  await conn.sendFile(m.chat, data.buffer, 'jarvismeme.png', '', m)
}

handler.help = ['jarvismeme <teks>']
handler.tags = ['maker']
handler.command = /^(jarvismeme)$/i
handler.limit = true
handler.register = true

export default handler
