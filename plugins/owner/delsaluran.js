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

import { listSaluran, getOwnerSaluran, parseChannelInput, removeSaluran, labelSaluran, saveDb } from '../../lib/saluran.js'

let handler = async (m, { text, usedPrefix, command }) => {
    const usage = `Contoh:\n${usedPrefix}${command} 120363xxxxxxxxxx@newsletter\n${usedPrefix}${command} 2   (nomor urut dari ${usedPrefix}listsaluran)\n${usedPrefix}${command} owner   (hapus saluran owner)\n${usedPrefix}${command} all   (hapus semua)`
    const arg = (text || '').trim()
    if (!arg) return m.reply(usage)

    const list = listSaluran()
    if (!list.length) return m.reply('ℹ️ Belum ada saluran terdaftar.')

    if (arg.toLowerCase() === 'all') {
        const n = list.length
        list.length = 0
        await saveDb()
        return m.reply(`✅ ${n} saluran dihapus dari daftar.`)
    }

    let target
    if (arg.toLowerCase() === 'owner') {
        target = getOwnerSaluran()
        if (!target) return m.reply('ℹ️ Belum ada saluran owner.')
    } else if (/^\d{1,3}$/.test(arg)) {
        target = list[Number(arg) - 1]
        if (!target) return m.reply(`❌ Nomor ${arg} tidak ada. Cek ${usedPrefix}listsaluran`)
    } else {
        const p = parseChannelInput(arg)
        target = p?.jid && list.find(c => c.id === p.jid)
        if (!target) return m.reply(`❌ Saluran tidak ada di daftar. Cek ${usedPrefix}listsaluran`)
    }

    removeSaluran(target.id)
    await saveDb()
    m.reply(`✅ Dihapus: *${labelSaluran(target)}*${target.owner ? ' (👑 OWNER)' : ''}\n🆔 \`${target.id}\`\n\nSisa: ${list.length} saluran.`)
}

handler.help = ['delsaluran <idch|nomor|owner|all>']
handler.tags = ['owner']
handler.command = /^delsaluran$/i
handler.owner = true

export default handler
