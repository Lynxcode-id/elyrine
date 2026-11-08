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
    if (!m.quoted) throw 'Tag Pesan!'
    if (!m.quoted.fileSha256) throw 'SHA256 Hash Missing'
    let sticker = db.data.sticker
    let hash = Buffer.from(m.quoted.fileSha256).toString('hex')
    if (!(hash in sticker)) throw 'Hash not found in database'
    sticker[hash].locked = !/^un/i.test(command)
    m.reply('Done!')
} 
handler.help = ['un', ''].map(v => v + 'lockcmd')
handler.tags = ['database']
handler.command = /^(un)?lockcmd$/i

export default handler
