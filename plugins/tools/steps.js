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

import { sendSteps } from '../../lib/steps.js'

const handler = async (m, { conn, args }) => {
  const mode = String(args?.[0] || 'progress').toLowerCase()

  if (!['progress', 'metadata'].includes(mode)) {
    throw `Mode tidak dikenal.\n\nGunakan:\n• .steps progress\n• .steps metadata`
  }

  await sendSteps(conn, m.chat, mode)
}

handler.help = ['steps', 'steps progress', 'steps metadata']
handler.tags = ['tools']
handler.command = /^(steps)$/i
handler.limit = false
handler.register = false

export default handler
