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

import { isGroupJid, findGroup, addGroup, labelGroup, saveDb } from '../../lib/backupsc.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const usage = `Contoh:\n• Di dalam grup: ${usedPrefix}${command}\n• Dari mana saja: ${usedPrefix}${command} 120363xxxxxxxxxx@g.us\n\nGrup yang didaftarkan akan menerima backup SC bot.`
    const raw = (text || '').trim().split(/\s+/)[0]
    const jid = raw || (m.isGroup ? m.chat : '')
    if (!jid) return m.reply(usage)
    if (!isGroupJid(jid)) return m.reply(`❌ ID grup tidak valid. Harus berakhiran @g.us.\n\n${usage}`)

    const dup = findGroup(jid)
    if (dup) return m.reply(`ℹ️ Grup *${labelGroup(dup)}* sudah terdaftar.`)

    let meta
    try { meta = await conn.groupMetadata(jid) } catch (e) {
        return m.reply(`❌ Grup tidak ditemukan atau bot bukan anggotanya${e?.message ? ` (${e.message})` : ''}.`)
    }
    if (!meta?.id) return m.reply('❌ Grup tidak ditemukan.')

    const { entry } = addGroup({ id: meta.id, name: meta.subject })
    await saveDb()
    m.reply(`✅ Grup backup ditambahkan: *${labelGroup(entry)}*\n🆔 \`${entry.id}\``)
}

handler.help = ['addgcbackupsc', 'addgcbackupsc <idgrup>']
handler.tags = ['owner']
handler.command = /^(addgcbackupsc)$/i
handler.owner = true

export default handler
