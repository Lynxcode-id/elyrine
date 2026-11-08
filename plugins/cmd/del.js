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

let handler = async (m, { conn, usedPrefix, text, command }) => {
    let hash = text
    if (m.quoted && m.quoted.fileSha256) hash = Buffer.from(m.quoted.fileSha256).toString('hex')
    if (!hash) throw `Tidak ada hash`
    let sticker = global.db.data.sticker
    if (sticker[hash] && sticker[hash].locked) throw 'Kamu tidak memiliki izin untuk menghapus perintah stiker ini'
    delete sticker[hash]
    m.reply(`Berhasil!`)
}

handler.help = ['cmd'].map(v => 'del' + v + ' <teks>')
handler.tags = ['database']
handler.command = ['delcmd']

export default handler
