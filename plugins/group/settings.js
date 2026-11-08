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

let handler = async (m, { conn, args, usedPrefix, command }) => {
    let isClose = {
        'open': 'not_announcement',
        'close': 'announcement',
        'unlock': 'unlocked',
        'lock': 'locked',
    }[(args[0] || '')]
    if (isClose === undefined)
        throw `
*Format salah! Contoh :*
  *○ ${usedPrefix + command} close*
  *○ ${usedPrefix + command} open*
  *○ ${usedPrefix + command} unlock*
  *○ ${usedPrefix + command} lock*
`.trim()
    await conn.groupSettingUpdate(m.chat, isClose)
}
handler.help = ['group *open / close*']
handler.tags = ['group']
handler.command = /^(group)$/i

handler.admin = true
handler.botAdmin = true

export default handler
