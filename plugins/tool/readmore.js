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
    let [l, r] = text.split`|`
    if (!l) l = ''
    if (!r) r = ''
    conn.reply(m.chat, l + readMore + r, m)
}
handler.help = ['readmore'].map(v => v + ' <teks>|<teks>')
handler.tags = ['tools']
handler.command = /^(spoiler|hidetext|readmore|selengkapnya)$/i

handler.register = true

export default handler

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)