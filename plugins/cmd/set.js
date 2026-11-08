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

let handler = async (m, { conn, text, usedPrefix, command }) => {
    db.data.sticker = db.data.sticker || {}
    if (!m.quoted) throw 'Balas stiker dengan perintah *${usedPrefix + command}*'
    if (!m.quoted.fileSha256) throw 'SHA256 Hash Missing'
    if (!text) throw `Penggunaan:\n${usedPrefix + command} <teks>\n\nContoh:\n${usedPrefix + command} tes`
    let sticker = db.data.sticker
    let hash = Buffer.from(m.quoted.fileSha256).toString('hex')
    if (sticker[hash] && sticker[hash].locked) throw 'Kamu tidak memiliki izin untuk mengubah perintah stiker ini'
    sticker[hash] = {
        text,
        mentionedJid: m.mentionedJid,
        creator: m.sender,
        at: + new Date,
        locked: false,
    }
    m.reply(`Success!`)
}

handler.help = ['cmd'].map(v => 'set' + v + ' <teks>')
handler.tags = ['database']
handler.command = ['setcmd']

export default handler
