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
  const [folderRaw, nameRaw] = (text || '').split('|').map(v => (v || '').trim())
  const folder = (folderRaw || '').toLowerCase()
  const name = (nameRaw || '').replace(/\.js$/i, '')

  if (!folder || !name) throw `Contoh:\n${usedPrefix + command} image|iqc`
  if (!SAFE.test(folder) || !SAFE.test(name)) throw 'Folder/nama hanya boleh huruf, angka, _ dan -.'

  const key = `${folder}/${name}.js`
  const file = join(__dirname, key)
  if (!existsSync(file)) throw `Plugin *${key}* tidak ditemukan.`

  unlinkSync(file)
  delete global.plugins[key]
  m.reply(`✅ *${key}* dihapus.`)
}
handler.help = ['delplugin <folder>|<nama>']
handler.tags = ['owner']
handler.command = /^(delplugin|dp)$/i
handler.rowner = true

export default handler
