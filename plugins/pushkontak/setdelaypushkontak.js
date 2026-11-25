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

let handler = async (m, { text, usedPrefix, command }) => {
    const ms = parseInt(text)
    if (isNaN(ms) || ms < 500) return m.reply(`Contoh: ${usedPrefix}${command} <ms>  (minimal 500, contoh: 2000)`)
    J.setCfg('delayPushKontak', ms)
    return m.reply(`*▢ DELAY PUSH KONTAK*\n• Delay : ${ms}ms\n• Status : Berhasil diubah`)
}

handler.help = ['setdelaypushkontak']
handler.tags = ['pushkontak']
handler.command = ['setdelaypushkontak']
handler.owner = true

export default handler
