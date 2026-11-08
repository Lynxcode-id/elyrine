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

import fetch from 'node-fetch';

let handler = m => m;

handler.before = async (m) => {
    if (!m.isGroup) return
    let chat = global.db.data.chats[m.chat];
    if (chat.simi && !chat.isBanned) {
        if (/^.*false|disnable|(turn)?off|0/i.test(m.text)) return;
        if (!m.text) return;
        if (m.isCommand || (global.prefix instanceof RegExp && global.prefix.test(m.text))) return;

        const url = `https://o.simsimi.com/api/chats?lc=id&ft=1&normalProb=2&reqText=${encodeURIComponent(m.text)}&talkCnt=0`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch SimSimi response.');

            const json = await res.json();

            if (json.respSentence) {
                m.reply(json.respSentence);
            } else {
                m.reply('SimSimi tidak memahami pesan Anda.');
            }
        } catch (error) {
            console.error('Error:', error);
            m.reply('Terjadi kesalahan saat memproses permintaan.');
        }

        return !0;
    }
    return true;
};

export default handler;
