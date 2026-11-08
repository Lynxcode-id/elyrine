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

import { spawn } from 'child_process'
let handler = async (m, { conn, isROwner, text }) => {
    if (!process.send) throw 'Dont: node main.js\nDo: node index.js'
    if (global.conn.user.jid == conn.user.jid) {
    await m.reply('```R E S T A R T . . .```')
    process.send('reset')
  } else throw '_eeeeeiiittsssss..._'
}

handler.help = ['restart']
handler.tags = ['owner']
handler.command = /^(res(tart)?)$/i

handler.rowner = true

export default handler