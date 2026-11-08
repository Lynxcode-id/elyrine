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

let handler = async (m, { conn, text, participants }) => {
  const fallbackText = (
    m.quoted?.text ||
    m.quoted?.caption ||
    m.quoted?.message?.extendedTextMessage?.text ||
    m.quoted?.message?.conversation ||
    ''
  ).trim()
  const msgText = (text || '').trim() || fallbackText
  if (!msgText) throw 'Masukkan teks setelah perintah atau balas pesan berteks lalu ketik .hidetag'

  const fkontak = {
    "key": {
      "participants": "0@s.whatsapp.net",
      "remoteJid": "status@broadcast",
      "fromMe": false,
      "id": "Halo"
    },
    "message": {
      "contactMessage": {
        "vcard": `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    "participant": "0@s.whatsapp.net"
  }

  await conn.sendMessage(
    m.chat,
    { text: msgText, mentions: participants.map(a => a.id) },
    { quoted: fkontak }
  )
}

handler.help = ['hidetag']
handler.tags = ['group']
handler.command = /^(hidetag)$/i

handler.group = true
handler.admin = true

export default handler
