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

const rewards = {
  limit: 10,
}
const cooldown = 86400000
let handler = async (m,{ conn} ) => {
  let user = global.db.data.users[m.sender]

  if (user.role === 'Free user' && user.limit >= 30) {
    conn.reply(m.chat, 'Free user only have 30 Limit max', m)
    return
  }

  if (new Date - user.lastclaim < cooldown) throw `You have already claimed this daily limit!, wait for *${((user.lastclaim + cooldown) - new Date()).toTimeString()}*`
  let text = ''
  for (let reward of Object.keys(rewards)) {
    if (!(reward in user)) continue
    user[reward] += rewards[reward]
    text += `*+${rewards[reward]}* ${reward}\n`
  }
  conn.reply(m.chat, text.trim(), m)
  user.lastclaim = new Date * 1
}
handler.help = ['claimlimit']
handler.command = /^(claimlimit)$/i

handler.cooldown = cooldown
handler.disabled = true

export default handler