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

import fetch from 'node-fetch'

const handler = async (m, { text, usedPrefix, command }) => {
  if (!text) throw `*Example:* ${usedPrefix + command} 112.90.150.204`;
  await m.wait()
  try {
    let res = await fetch(`https://ipwho.is/${text}`).then(result => result.json());
    await conn.sendMessage(m.chat, { location: { degreesLatitude: res.latitude, degreesLongitude: res.longitude }},{ ephemeralExpiration: 604800 });
    await delay(2000);
    m.sukses(JSON.stringify(res, null, 2));
  } catch (e) { 
    throw new Error(`IP ${text} not found!`);
  }
}

handler.command = handler.help = ['ip']
handler.tags = ['tools']

handler.limit = true
handler.register = true

export default handler

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}