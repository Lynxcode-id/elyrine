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

import { listGroups, removeGroup, labelGroup, saveDb } from '../../lib/backupsc.js'

let handler = async (m, { text, usedPrefix, command }) => {
    const usage = `Contoh:\n• ${usedPrefix}${command} 1  (nomor dari ${usedPrefix}listgcbackupsc)\n• ${usedPrefix}${command} 120363xxxxxxxxxx@g.us\n• Di dalam grup: ${usedPrefix}${command}`
    if (!listGroups().length) return m.reply('ℹ️ Belum ada grup backup terdaftar.')

    const ref = (text || '').trim().split(/\s+/)[0] || (m.isGroup ? m.chat : '')
    if (!ref) return m.reply(usage)

    const removed = removeGroup(ref)
    if (!removed) return m.reply(`❌ Grup tidak ditemukan di daftar.\n\n${usage}`)
    await saveDb()
    m.reply(`🗑️ Grup backup dihapus: *${labelGroup(removed)}*\n🆔 \`${removed.id}\`\nSisa: ${listGroups().length}`)
}

handler.help = ['delgcbackupsc <nomor|idgrup>']
handler.tags = ['owner']
handler.command = /^(delgcbackupsc)$/i
handler.owner = true

export default handler
