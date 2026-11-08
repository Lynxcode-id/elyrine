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

let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})( [0-9]{1,3})?/i;

let handler = async (m, { conn, text, isOwner }) => {
    let [_, code, expired] = text.match(linkRegex) || [];
    if (!code) throw 'Link invalid!\n\nContoh: .join https://chat.whatsapp.com/... 30';
    let res;
    try {
        res = await conn.groupAcceptInvite(code);
    } catch (error) {
        if (error && error.message) {
            if (error.message.includes('not-authorized')) {
                return m.reply(`
Tidak dapat bergabung karena sebelumnya terkena kick
Silahkan tunggu max 7 hari, jangan SPAM!!!

Note: Laporan apapun tentang ini tidak akan ditanggapi oleh Owner
                `);
            } else if (error.message.includes('gone')) {
                return m.reply('Link tidak valid/sudah diatur ulang oleh admin');
            }
        }
        throw error;
    }

    let user = global.db.data.users[m.sender];
    let now = Date.now();
    let maxTime = Math.floor((user.premiumTime - now) / (1000 * 60 * 60 * 24));

    expired = Math.floor(Math.min(maxTime, Math.max(1, isOwner ? (isNumber(expired) ? parseInt(expired) : 0) : 3)));
    if (expired > maxTime) {
        return m.reply(`Max durasi grup mengikuti durasi premium anda\nMaximum hari anda adalah ${maxTime}`);
    }

    m.reply(`Berhasil join grup ${res}${expired ? ` selama ${expired} hari

Jika grup menggunakan persetujuan admin, silahkan ACC nomor ini` : ''}`);
    let chats = global.db.data.chats[res];
    if (!chats) chats = global.db.data.chats[res] = {};
    if (expired) chats.expired = +new Date() + expired * 1000 * 60 * 60 * 24;
};

handler.help = ['join'];
handler.tags = ['owner'];

handler.command = /^join$/i
handler.rowner = false
handler.premium = true

export default handler

const isNumber = (x) => (x = parseInt(x), typeof x === 'number' && !isNaN(x));