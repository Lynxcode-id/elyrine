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

let handler = async (m, { conn, args, usedPrefix, command }) => {
  await conn.groupUpdateSubject(m.chat, `${args.join(" ")}`);
  m.reply('Sukses mengganti nama group')
}

handler.help = ['setgcname']
handler.tags = ['group']
handler.command = /^setgcname$/i
handler.owner = false
handler.premium = false
handler.group = true
handler.private = false
handler.register = false
handler.admin = true
handler.botAdmin = true

export default handler