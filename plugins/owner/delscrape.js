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

import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'

const SAFE = /^[a-z0-9_][a-z0-9_-]*$/i

let handler = async (m, { text, usedPrefix, command, __dirname }) => {
  const name = (text || '').trim().replace(/\.js$/i, '')
  if (!name) throw `Contoh: ${usedPrefix + command} hdimage`
  if (!SAFE.test(name)) throw 'Nama hanya boleh huruf, angka, _ dan -.'

  const file = join(__dirname, '..', 'scrape', `${name}.js`)
  if (!existsSync(file)) throw `Scrape *${name}* tidak ditemukan.`
  unlinkSync(file)
  m.reply(`✅ *scrape/${name}.js* dihapus.`)
}
handler.help = ['delscrape <nama>']
handler.tags = ['owner']
handler.command = /^(delscrape)$/i
handler.rowner = true

export default handler
