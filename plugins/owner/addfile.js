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

import fs from 'fs/promises'
import path from 'path'
import syntaxerror from 'syntax-error'
import { ROOT } from '../../lib/function.js'

const SEG = /^[\w$@][\w$@.\-]*$/
const BLOCKED_TOP = new Set(['node_modules', '.git', 'sessions'])
const BACKUP_DIR = path.join(ROOT, 'store', 'file-backup')
const TEXT_EXT = new Set(['.js', '.mjs', '.cjs', '.json', '.md', '.txt', '.env', '.yml', '.yaml', '.html', '.css', '.py', '.sh', '.ts'])
const MAX_SIZE = 20 * 1024 * 1024

function parseSpec(spec) {
  const parts = String(spec || '').split('|').map(v => v.trim())
  if (!parts.length || parts.some(v => !v)) return { error: 'Format salah, ada bagian kosong di antara "|".' }
  const file = parts.pop()
  const folders = parts
  for (const seg of [...folders, file]) {
    if (seg === '.' || seg === '..' || !SEG.test(seg)) {
      return { error: `Nama tidak valid: *${seg}*\nPakai huruf, angka, _ - . saja (tanpa spasi, slash, atau diawali titik).` }
    }
  }
  if (!path.extname(file)) return { error: `Nama file harus punya ekstensi, mis. *${file}.js*` }
  if (folders.length && BLOCKED_TOP.has(folders[0].toLowerCase())) return { error: `Folder *${folders[0]}* tidak boleh diubah lewat bot.` }
  return { folders, file }
}

const stripFence = code => code
  .replace(/^﻿/, '')
  .replace(/^\s*```[a-z]*\r?\n/i, '')
  .replace(/\r?\n```\s*$/, '')
  .trim() + '\n'

let handler = async (m, { text, usedPrefix, command }) => {
  const [first = '', ...rest] = (text || '').split('\n')
  const usage = [
    '*Tambah / timpa file project*',
    '',
    `♡ ${usedPrefix}${command} lib|namanya.js`,
    `♡ ${usedPrefix}${command} namanya.js`,
    `♡ ${usedPrefix}${command} lib|os|os.js`,
    '',
    'Tanpa "|" = simpan di root project.',
    'Isi file: reply pesan (teks / dokumen / media),',
    'atau tulis kodenya di baris bawah perintah.'
  ].join('\n')
  if (!first.trim()) throw usage

  const parsed = parseSpec(first)
  if (parsed.error) throw `${parsed.error}\n\n${usage}`
  const { folders, file } = parsed

  const rel = [...folders, file].join('/')
  const dir = path.resolve(ROOT, ...folders)
  const full = path.join(dir, file)
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) throw 'Lokasi harus berada di dalam folder project bot.'

  const ext = path.extname(file).toLowerCase()
  const q = m.quoted
  let data = null

  if (q && typeof q.download === 'function') {
    const buf = await q.download().catch(() => null)
    if (!buf?.length) throw 'Gagal mengunduh file dari pesan yang di-reply.'
    data = Buffer.from(buf)
    if (TEXT_EXT.has(ext)) data = Buffer.from(data.toString('utf8').replace(/^﻿/, ''))
  } else {
    const src = (q?.text || rest.join('\n')).trim()
    if (!src) throw `Isi file kosong.\nReply pesan berisi kode/file, atau tulis di baris bawah perintah.\n\n${usage}`
    data = Buffer.from(TEXT_EXT.has(ext) ? stripFence(src) : src)
  }
  if (data.length > MAX_SIZE) throw 'Ukuran file melebihi 20MB.'

  if (ext === '.js' || ext === '.mjs') {
    const err = syntaxerror(data.toString('utf8'), rel, { sourceType: 'module', allowAwaitOutsideFunction: true, allowReturnOutsideFunction: true })
    if (err) throw `❌ Syntax error, file TIDAK disimpan:\n\n${err}`
  } else if (ext === '.json') {
    try { JSON.parse(data.toString('utf8')) } catch (e) { throw `❌ JSON tidak valid, file TIDAK disimpan:\n${e.message}` }
  }

  let existed = false
  let backup = ''
  try {
    const old = await fs.readFile(full)
    existed = true
    await fs.mkdir(BACKUP_DIR, { recursive: true })
    backup = `${Date.now()}_${rel.replace(/\//g, '_')}`
    await fs.writeFile(path.join(BACKUP_DIR, backup), old)
  } catch (e) {
    if (e.code !== 'ENOENT') return m.gagal(`Gagal membaca file lama: ${e.message}`, 'addfile')
  }

  try {
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(full, data)
  } catch (e) {
    return m.gagal(`Gagal menyimpan file: ${e.message}`, 'addfile')
  }

  let status = 'Tersimpan. Lib / file root baru dipakai setelah restart.'
  if (rel.startsWith('plugins/') && ext === '.js') {
    const ok = await global.loadPluginFile(rel.slice('plugins/'.length))
    status = ok ? 'Plugin langsung aktif tanpa restart.' : 'Tersimpan tapi gagal dimuat, cek console.'
  } else if (rel === 'handler.js') {
    await global.reloadHandler?.()
    status = 'Handler di-reload.'
  }

  await m.sukses([
    `♡ File : ${rel}`,
    `♡ Ukuran : ${(data.length / 1024).toFixed(1)} KB`,
    `♡ Mode : ${existed ? 'ditimpa (cadangan: store/file-backup/' + backup + ')' : 'file baru'}`,
    '',
    status
  ].join('\n'))
}

handler.help = ['addfile <folder>|<nama>', 'addfile <nama>']
handler.tags = ['owner']
handler.command = ['addfile', 'simpanfile', 'svfile']
handler.rowner = true

export default handler
