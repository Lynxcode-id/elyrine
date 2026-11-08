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
import { join, dirname } from 'path'
import syntaxerror from 'syntax-error'

const SAFE = /^[a-z0-9_][a-z0-9_-]*$/i

let handler = async (m, { text, usedPrefix, command, __dirname }) => {
  const [first = '', ...rest] = (text || '').split('\n')
  const spec = first.replace(/--\w+/g, '').trim()
  const parts = spec.split('|').map(v => (v || '').trim())
  const nameRaw = parts.length > 1 ? parts[1] : parts[0]
  const name = (nameRaw || '').replace(/\.js$/i, '')
  let folder = parts.length > 1 ? parts[0].toLowerCase() : ''

  if (!name) throw `Contoh:\n${usedPrefix + command} system|_allfake\n(reply kode plugin-nya, atau tulis kodenya di baris bawah)`
  if (!SAFE.test(name) || (folder && !SAFE.test(folder))) throw 'Folder/nama hanya boleh huruf, angka, _ dan - (tanpa spasi, titik, atau slash).'

  if (!folder) {
    const hit = Object.keys(global.plugins).filter(k => k.split('/').pop() === `${name}.js`)
    if (hit.length !== 1) throw hit.length
      ? `Nama *${name}* ada di beberapa folder:\n${hit.map(v => '• ' + v).join('\n')}\nPakai: ${usedPrefix + command} <folder>|${name}`
      : `Plugin *${name}* belum ada. Pakai: ${usedPrefix + command} <folder>|${name}`
    folder = hit[0].split('/').slice(0, -1).join('/')
  }

  let code = ((m.quoted && m.quoted.text) || rest.join('\n')).trim()
  code = code.replace(/^```(?:js|javascript)?\n?/i, '').replace(/```$/, '').trim()
  if (!code) throw 'Kode plugin kosong. Reply pesan berisi kode, atau tulis di baris bawah perintah.'

  const key = `${folder}/${name}.js`
  const err = syntaxerror(code, key, { sourceType: 'module', allowAwaitOutsideFunction: true })
  if (err) throw `❌ Syntax error, plugin TIDAK disimpan:\n\n${err}`

  const file = join(__dirname, key)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, code + '\n')
  const ok = await global.loadPluginFile(key)
  m.reply(ok ? `✅ *${key}* tersimpan & aktif.` : `⚠️ Tersimpan di plugins/${key} tapi gagal dimuat, cek console.`)
}
handler.help = ['addplugin <folder>|<nama>']
handler.tags = ['owner']
handler.command = /^(addplugin|sp)$/i
handler.rowner = true

export default handler
