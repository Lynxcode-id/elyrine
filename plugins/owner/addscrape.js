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

import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import syntaxerror from 'syntax-error'

const SAFE = /^[a-z0-9_][a-z0-9_-]*$/i

let handler = async (m, { text, usedPrefix, command, __dirname }) => {
  const [first = '', ...rest] = (text || '').split('\n')
  const name = first.trim().replace(/\.js$/i, '')
  if (!name) throw `Contoh:\n${usedPrefix + command} hdimage\n(reply kode scrape-nya, atau tulis kodenya di baris bawah)`
  if (!SAFE.test(name)) throw 'Nama hanya boleh huruf, angka, _ dan - (tanpa spasi, titik, atau slash).'

  let code = ((m.quoted && m.quoted.text) || rest.join('\n')).trim()
  code = code.replace(/^```(?:js|javascript)?\n?/i, '').replace(/```$/, '').trim()
  if (!code) throw 'Kode kosong. Reply pesan berisi kode, atau tulis di baris bawah perintah.'

  const err = syntaxerror(code, `${name}.js`, { sourceType: 'module', allowAwaitOutsideFunction: true })
  if (err) throw `❌ Syntax error, scrape TIDAK disimpan:\n\n${err}`

  const dir = join(__dirname, '..', 'scrape')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${name}.js`), code + '\n')
  m.reply(`✅ *scrape/${name}.js* tersimpan.`)
}
handler.help = ['addscrape <nama>']
handler.tags = ['owner']
handler.command = /^(addscrape)$/i
handler.rowner = true

export default handler
