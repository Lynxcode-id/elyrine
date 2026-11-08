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

let handler = async (m, { conn }) => {
  try {
    let rest = await conn.groupRevokeInvite(m.chat);
    let linked = 'https://chat.whatsapp.com/' + rest;

    m.reply(linked);
  } catch (error) {
    console.error(error);
    m.reply('Failed to retrieve group invite link');
  }
};

handler.help = ['revoke'];
handler.tags = ['group'];
handler.command = /^re(voke|new)(invite|link)?$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
