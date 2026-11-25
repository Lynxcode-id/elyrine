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

import * as J from '../../lib/jpm.js'

let handler = async m => {
    const jobs = J.jobs()
    if (!jobs.pushRunning) return m.reply('❌ Push kontak tidak sedang berjalan.')
    jobs.pushRunning = false
    return m.reply('*▢ PUSH KONTAK*\n• Status : Dihentikan')
}

handler.help = ['stoppush']
handler.tags = ['pushkontak']
handler.command = ['stoppush', 'stoppushkontak', 'stoppus']
handler.owner = true

export default handler
