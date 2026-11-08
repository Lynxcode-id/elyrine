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
    if (!args[0] || (!/\d+/.test(args[0]) && !/[dhm]/.test(args[0]))) {
        throw `Masukkan angka mewakili jumlah waktu!\nMisal: ${usedPrefix + command} 30m`;
    }

    let who;
    if (m.isGroup) who = args[1] ? args[1] : m.chat;
    else who = args[1];

    let match = args[0].match(/(\d+)([dhm])/);
    if (!match) throw 'Format waktu tidak valid. Gunakan "d" untuk hari, "h" untuk jam, atau "m" untuk menit. Contoh: 30m, 1h, 2d.';

    let timeValue = parseInt(match[1]);
    let timeUnit = match[2].toLowerCase();

    let milliseconds;
    switch (timeUnit) {
        case 'd':
            milliseconds = timeValue * 24 * 60 * 60 * 1000;
            break;
        case 'h':
            milliseconds = timeValue * 60 * 60 * 1000;
            break;
        case 'm':
            milliseconds = timeValue * 60 * 1000;
            break;
        default:
            throw 'Waktu tidak valid. Gunakan "d" untuk hari, "h" untuk jam, atau "m" untuk menit.';
    }

    var now = new Date() * 1;
    if (now < global.db.data.chats[who].expired) global.db.data.chats[who].expired = milliseconds;
    else global.db.data.chats[who].expired = now + milliseconds;

    let timeUnitText;
    switch (timeUnit) {
        case 'd':
            timeUnitText = 'hari';
            break;
        case 'h':
            timeUnitText = 'jam';
            break;
        case 'm':
            timeUnitText = 'menit';
            break;
    }

    conn.reply(m.chat, `Berhasil menetapkan hari kadaluarsa untuk Grup ini selama ${args[0]} ${timeUnitText}.\n\nHitung Mundur: ${msToDate(global.db.data.chats[who].expired - now)}`, m);
}

handler.help = ['addsewa <waktu>']
handler.tags = ['owner']
handler.command = /^(setexpired|addsewa|tambahsewa|nyewa)$/i
handler.rowner = true
handler.group = true

export default handler

function msToDate(ms) {
    let days = Math.floor(ms / (24 * 60 * 60 * 1000));
    let daysms = ms % (24 * 60 * 60 * 1000);
    let hours = Math.floor((daysms) / (60 * 60 * 1000));
    let hoursms = ms % (60 * 60 * 1000);
    let minutes = Math.floor((hoursms) / (60 * 1000));
    return days + " hari " + hours + " jam " + minutes + " menit";
}
