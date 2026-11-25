/*
  ERINE-AI • ELYRINE
  WhatsApp Bot Multi-Device · Node.js ESM

  Developer   Arman Maulana (Lynx decode)
  Versi       1.0.0
  Lisensi     ELYRINE Source-Available Non-Commercial v1.0
  Copyright   © 2026 Arman Maulana

  Didirikan di atas Elyra Labs & ekosistemnya.
  Komunitas   General District (induk) · INF Project · Elyra Labs
  Engine      elyrine-baileys, fork Baileys yang dikustom
              sesuai kebutuhan bot ini.

  Dilarang menjual, menyewakan, atau merebrand tanpa
  izin tertulis dari developer. Jangan hapus kredit ini.
*/

let handler = async (m, { conn }) => {
    const g = global.db.data.chats[m.chat]?.absen || {}
    const top = Object.entries(g).sort((a, b) => b[1].streak - a[1].streak || b[1].total - a[1].total).slice(0, 10)
    if (!top.length) return m.reply('Belum ada yang absen di grup ini. Mulai dengan .absen')
    return conn.sendMessage(m.chat, {
        text: `📅 *TOP STREAK ABSEN*\n\n${top.map(([id, u], i) => `${i + 1}. @${id} — 🔥 ${u.streak} hari (total ${u.total}x)`).join('\n')}`,
        mentions: top.map(([, u]) => u.jid)
    }, { quoted: m })
}

handler.help = ['topabsen']
handler.tags = ['group']
handler.command = ['topabsen']
handler.group = true

export default handler
