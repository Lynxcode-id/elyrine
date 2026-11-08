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

import fs from 'fs'
let handler = async (m, { conn, text }) => {
    await m.wait()
    let sesi = await fs.readFileSync('./database.json')
    return await conn.sendMessage(m.chat, { document: sesi, mimetype: 'application/json', fileName: 'database.json' }, { quoted: m })
}
handler.help = ['getdb']
handler.tags = ['owner']
handler.command = /^(getdb)$/i

handler.rowner = true

export default handler