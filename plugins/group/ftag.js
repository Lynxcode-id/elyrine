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

let handler = async (m, { conn, text, usedPrefix, command, participants }) => {
    const input = String(text || '').trim()
    const match = input.match(/@(\S+)/)
    if (!match) return m.reply(`❌ Contoh: *${usedPrefix}${command} @nanazx ganteng*`)
    const body = input.replace(match[0], `@${m.chat}`)
    return conn.relayMessage(m.chat, {
        extendedTextMessage: {
            text: body,
            contextInfo: {
                mentionedJid: participants.map(p => p.id),
                groupMentions: [{ groupJid: m.chat, groupSubject: match[1] }]
            }
        }
    }, {})
}

handler.help = ['ftag']
handler.tags = ['group']
handler.command = ['ftag']
handler.group = true
handler.admin = true

export default handler
