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

import fs from 'fs'
import path from 'path'
import assert from 'assert'
import { checkSyntax } from './lib/syntax.js'
const roots = ['.', 'lib', 'plugins']
const files = []
const walk = (d, deep) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue
    const p = path.join(d, e.name)
    if (e.isDirectory()) { if (deep) walk(p, true) }
    else if (e.name.endsWith('.js')) files.push(p)
  }
}
walk('.', false); walk('lib', true); walk('plugins', true)
for (const f of files) {
  const err = checkSyntax(fs.readFileSync(f, 'utf8'), f, { allowReturn: true })
  assert.ok(!err, err)
}
console.log(`☑️ ${files.length} file OK`)
