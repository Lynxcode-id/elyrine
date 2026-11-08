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

import chalk from 'chalk'
import { extractButtonId } from '../../lib/buttonresponse.js'

export async function before(m) {
  if (m.isBaileys) return false
  if (!m.message) return false
  if (m.isBypassed) return false

  const id = extractButtonId(m.message)
  if (!id) return false

  m.text = id
  m.isBypassed = true
  console.log(chalk.bgGreen.black(` 🔥 [BUTTON] ${id} `))
  return false
}
