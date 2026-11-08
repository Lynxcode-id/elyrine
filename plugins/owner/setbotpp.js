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

let handler = async (m, { conn, args }) => {
  let bot = conn.user.jid
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''
  if (/image/.test(mime)) {
    let img = await q.download()
    if (!img) throw `Fotonya Gak Ada Kak *┰ω┰*`
    conn.updateProfilePicture(bot, img)
    conn.reply(m.chat, 'Selesai Mengganti Profil Bot Kak*>ω<*!', m)
  }
}
handler.help = ['setpp']
handler.tags = ['owner']
handler.command = /^(setpp)$/i
handler.owner = true

export default handler