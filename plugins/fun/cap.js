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

const FOOTER = 'with love, elyra !!'
const pick = a => a[Math.floor(Math.random() * a.length)]
const TEKS = cap => [
    `Ehh ${cap} datang`,
    `Awas gengs ${cap} muncul`,
    `Oalah ${cap} online juga`,
    `Bahaya datang si ${cap}`,
    `Yang ditunggu datang juga`,
    `Waduh ada ${cap}`,
    `Si ${cap} ikut nimbrung`,
    `Loh loh ${cap} nongol`,
    `Hati-hati sama ${cap}`,
    `Akhirnya gerak juga ${cap}`
  ]

const box = (emoji, title, body) => [`${emoji} *${title}*`, '', body, '', FOOTER].join('\n')

let handler = async (m, { conn, text, command, usedPrefix: p = '.' }) => {
  const db = global.db.data
  db.cap ||= {}
  db.cap[m.chat] ||= {}
  const t = String(text || '')
  const who = m.mentionedJid?.[0] || m.quoted?.sender || (t.split(' ')[0].replace(/[^0-9]/g, '') ? t.split(' ')[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)
  if (!who) return m.reply(box('🏷️', 'Cap', `Tag, balas, atau tulis nomor.\n\n♡ ${p}cap @user Si Raja\n♡ ${p}delcap @user`))
  if (/^delcap$/i.test(command)) {
    delete db.cap[m.chat][who]
    return conn.sendMessage(m.chat, { text: box('🏷️', 'Cap Dihapus', `Cap @${who.split('@')[0]} berhasil dihapus.`), mentions: [who] }, { quoted: m })
  }
  const cap = t.replace(/@\d+/g, '').replace(/[0-9]/g, '').trim()
  if (!cap) return m.gagal('Masukkan teks cap.', 'Cap')
  db.cap[m.chat][who] = cap
  return conn.sendMessage(m.chat, { text: box('🏷️', 'Cap Diset', `@${who.split('@')[0]} sekarang bercap *${cap}*`), mentions: [who] }, { quoted: m })
}

handler.before = async function (m, { conn }) {
  if (!m.isGroup || m.fromMe) return
  const cap = global.db?.data?.cap?.[m.chat]?.[m.sender]
  if (!cap) return
  const cd = (global.db.data.capcd ||= {})
  cd[m.chat] ||= {}
  const now = Date.now()
  if (now - (cd[m.chat][m.sender] || 0) < 10 * 60 * 1000) return
  cd[m.chat][m.sender] = now
  await conn.sendMessage(m.chat, { text: pick(TEKS(cap)), mentions: [m.sender] }, { quoted: m })
}

handler.help = ['cap @user <teks>', 'delcap @user']
handler.tags = ['fun']
handler.command = /^(cap|delcap)$/i
handler.group = true
handler.admin = true
handler.register = true

export default handler
