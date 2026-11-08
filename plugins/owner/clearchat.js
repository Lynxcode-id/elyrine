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

let handler = async (m, { conn, args }) => {
  try {
      if (!args[0]) throw 'Input Jid People/Groups'
      const jid = args[0]
      await conn.chatModify({
        delete: true,
        lastMessages: [{
          key: m.key,
          messageTimestamp: m.messageTimestamp
        }]
      }, jid);
    conn.reply(m.chat, `Success Cler Chat for ${jid}`, m);
  } catch (error) {
    console.error(error);
    conn.reply(m.chat, 'Terjadi Kesalahan Saat Menghapus Chat, Mohon Perhatikan Jidnya', m);
  }
}
handler.help = ['clearchat']
handler.tags = ['owner']
handler.owner = true
handler.command = /^(clearchat)$/i
export default handler
