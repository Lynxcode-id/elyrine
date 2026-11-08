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

import { unlinkSync, existsSync } from 'fs'
import { join } from 'path'

let handler = async (m, { conn, __dirname, args, text, usedPrefix, command }) => {
  const keys = Object.keys(global.plugins).map(v => v.replace(/\.js$/, ''))
  if (!text) throw `Contoh: ${usedPrefix + command} downloader/tiktok`
  const key = args[0].replace(/\.js$/, '')
  if (!keys.includes(key)) return m.reply(`*🗃️ NOT FOUND!*\n\n${keys.map(v => ' ' + v).join('\n')}`)
  const file = join(__dirname, key + '.js')
  if (existsSync(file)) unlinkSync(file)
  delete global.plugins[key + '.js']
  conn.reply(m.chat, `Success deleted "plugins/${key}.js"`, m)
}
handler.help = ['df']
handler.tags = ['owner']
handler.command = /^(df|d(el)?(ete)?(file))$/i
handler.owner = true

export default handler
