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

let handler = async (m, { conn }) => {
    await conn.fetchBlocklist().then(async data => {
        let txt = `*「  Daftar Nomor Yang Diblokir  」*\n\n*Total:* ${data.length}\n\n┌─\n`
        for (let i of data) {
            txt += `├ @${i.split("@")[0]}\n`
        }
        txt += "└────"
        return conn.reply(m.chat, txt, m, { mentions: await conn.parseMention(txt) })
    }).catch(err => {
        console.log(err);
        throw 'tidak ada yang diblokir!'
    })
}
handler.tags = ['info']
handler.help = ['blocklist']
handler.command = /^(blocklist)$/i

handler.owner = true

export default handler
