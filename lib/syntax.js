/*
  ERINE-AI • ELYRINE
  WhatsApp Bot Multi-Device · Node.js ESM

  Developer   Arman Maulana (Lynx decode)
  Versi       1.0.0
  Lisensi     ELYRINE Source-Available Non-Commercial v1.0
  Copyright   © 2026 Arman Maulana

  Didirikan di atas Elyra Labs & ekosistemnya.
  Komunitas   General District (induk) · INF Project · Elyra Labs
  Engine      elyrine-baileys, fork Baileys yang dikustom
              sesuai kebutuhan bot ini.

  Dilarang menjual, menyewakan, atau merebrand tanpa
  izin tertulis dari developer. Jangan hapus kredit ini.
*/

import { spawnSync } from 'child_process'

export function checkSyntax(code, name = 'file.js', { allowReturn = false } = {}) {
  const src = Buffer.isBuffer(code) ? code.toString('utf8') : String(code)
  const run = s => spawnSync(process.execPath, ['--check', '--input-type=module', '-'], { input: s, encoding: 'utf8', timeout: 20000 })
  let r = run(src)
  if (r.status !== 0 && allowReturn && /Illegal return statement/.test(r.stderr || '')) r = run(`(async()=>{\n${src}\n})`)
  if (r.status === 0) return null
  const lines = String(r.stderr || r.error?.message || 'syntax error').split('\n')
  const cut = lines.findIndex(l => /^\s+at /.test(l))
  const msg = (cut > 0 ? lines.slice(0, cut) : lines).join('\n').replace(/^\[stdin\]/, name).trim()
  return msg || `Syntax error di ${name}`
}
