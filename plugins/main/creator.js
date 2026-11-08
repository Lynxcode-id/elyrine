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

let handler = async (m) => {
  const sentMsg = await conn.sendContactArray(m.chat, [
    [`${nomorown}`, `${await conn.getName(nomorown + '@s.whatsapp.net')}`, `💌 Developer Bot`, `Arman Maulana (Lynx decode)`, ``, `🇮🇩 Indonesia`, `📍 General District • INF Project • Elyra Labs`, `👤 Owner ERINE-AI`],
    [`${conn.user.jid.split('@')[0]}`, `${await conn.getName(conn.user.jid)}`, `🎈 Whatsapp Bot`, `📵 Dont Spam`, ``, `🇮🇩 Indonesia`, `📍 ERINE-AI`, `Bot WhatsApp ERINE-AI ☺`]
  ], fkontak)
  await m.reply(`Hello @${m.sender.split(`@`)[0]} Thats my owner, dont spam or i will block u`)
}

handler.help = ['owner', 'creator']
handler.tags = ['main', 'info']
handler.command = /^(owner|creator)/i
export default handler