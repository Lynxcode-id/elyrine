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
    let chat = global.db.data.chats[m.chat]
    let user = global.db.data.users[m.sender]

    if (!m.isGroup) {
        let limitInfo = `╭━━━━「 *LIMIT INFO* 」━━━━
┃ 👤 *User:* @${m.sender.split('@')[0]}
┃ 🎫 *Your Limit:* ${user.limit || 0}
┃ 👑 *Role:* ${user.role || 'Free user'}
┃ 
┃ 💡 *Note:* Limit system only applies to certain commands
╰━━━━━━━━━━━━━━━━━`

        return conn.reply(m.chat, limitInfo, m, { mentions: [m.sender] })
    }

    let isLimitDisabled = chat && chat.disableLimit
    let status = isLimitDisabled ? '✅ DISABLED (FREE)' : '⚠️ ENABLED (NORMAL)'
    let statusEmoji = isLimitDisabled ? '🎉' : '🎫'

    let groupInfo = `╭━━━━「 *GROUP LIMIT STATUS* 」━━━━
┃ ${statusEmoji} *Limit Status:* ${status}
┃ 
┃ ${isLimitDisabled ? '✨ All members in this group have unlimited access!' : '⚡ Normal limit applies to all non-premium members'}
┃ 
┃ ━━━━━━━━━━━━━━━
┃ 👤 *Your Info:*
┃ 🎫 *Your Limit:* ${user.limit || 0}
┃ 👑 *Role:* ${user.role || 'Free user'}
┃ 
┃ ━━━━━━━━━━━━━━━
┃ 💡 *Admin Commands:*
┃ • \`.disable limit\` - Disable limit (FREE)
┃ • \`.enable limit\` - Enable limit (NORMAL)
╰━━━━━━━━━━━━━━━━━`

    conn.reply(m.chat, groupInfo, m, { mentions: [m.sender] })
}

handler.help = ['limitstatus', 'limitinfo']
handler.tags = ['info', 'group']
handler.command = /^(limitstatus|limitinfo|ceklimit)$/i

export default handler
