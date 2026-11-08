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

let handler = async (m, { conn, text }) => {
    if (!text) throw 'Who wants to be unbanned?'
    let who;
    if (m.isGroup) {
        if (m.mentionedJid.length > 0) {
            who = m.mentionedJid[0];
        } else {
            let cleanedNumber = text.replace(/\D/g, ''); 
            who = `${cleanedNumber}@s.whatsapp.net`;
        }
    } else {
        let cleanedNumber = text.replace(/\D/g, '');
        who = `${cleanedNumber}@s.whatsapp.net`;
    }

    let users = db.data.users;
    if (!users[who]) throw 'Pengguna tidak ditemukan';

    users[who].banned = false;
    conn.reply(m.chat, `Pengguna dengan nomor ${who} telah diunban!`, m);
}

handler.help = ['unban <nomor>']
handler.tags = ['owner']
handler.command = /^unban(user)?$/i
handler.rowner = true

export default handler
