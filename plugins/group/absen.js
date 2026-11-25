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

const BONUS = { 7: 10000, 14: 25000, 30: 75000, 60: 150000, 100: 300000, 200: 750000, 365: 2000000 }
const base = s => Math.min(1000 + s * 200, 5000)
const rupiah = n => 'Rp' + Number(n).toLocaleString('id-ID')
const wibDate = () => new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)
const dayDiff = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)

let handler = async (m, { conn }) => {
    const chat = global.db.data.chats[m.chat] ||= {}
    const g = chat.absen ||= {}
    const me = String(m.sender).split('@')[0]
    const today = wibDate()
    const u = g[me] ||= { streak: 0, total: 0, last: null, best: 0, jid: m.sender }
    u.jid = m.sender
    if (u.last === today) return m.reply(`Kamu sudah absen hari ini ✅\n🔥 Streak: ${u.streak} hari`)

    u.streak = u.last && dayDiff(u.last, today) === 1 ? u.streak + 1 : 1
    u.last = today
    u.total++
    u.best = Math.max(u.best, u.streak)
    const reward = base(u.streak)
    const bonus = BONUS[u.streak] || 0
    const user = global.db.data.users[m.sender] ||= {}
    user.money = (user.money || 0) + reward + bonus
    const next = Object.keys(BONUS).map(Number).find(d => d > u.streak)

    return conn.sendMessage(m.chat, {
        text: `╭─▣「 *ABSEN HARIAN* 」▣─╮\n┃ 👤 @${me}\n┃ 🔥 Streak : ${u.streak} hari\n┃ 🏅 Terbaik: ${u.best} hari\n┃ 📆 Total  : ${u.total}x\n╰─────────────➤\n💰 Hadiah: ${rupiah(reward)}${bonus ? `\n🎉 *BONUS HARI KE-${u.streak}*: +${rupiah(bonus)}` : ''}${next ? `\n\n_Bonus berikutnya di hari ke-${next} (${next - u.streak} hari lagi)_` : ''}`,
        mentions: [m.sender]
    }, { quoted: m })
}

handler.help = ['absen']
handler.tags = ['group']
handler.command = ['absen']
handler.group = true

export default handler
