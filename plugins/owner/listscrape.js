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

import { readdirSync, statSync, mkdirSync } from 'fs'
import { join } from 'path'

let handler = async (m, { __dirname }) => {
  const dir = join(__dirname, '..', 'scrape')
  mkdirSync(dir, { recursive: true })
  const files = readdirSync(dir).filter(f => f.endsWith('.js')).sort()
  if (!files.length) return m.reply('Folder scrape masih kosong.')
  const list = files.map((f, i) => `${i + 1}. ${f} (${(statSync(join(dir, f)).size / 1024).toFixed(1)} KB)`).join('\n')
  m.reply(`📂 *Daftar scrape* (${files.length})\n\n${list}`)
}
handler.help = ['listscrape']
handler.tags = ['owner']
handler.command = /^(listscrape)$/i
handler.rowner = true

export default handler
