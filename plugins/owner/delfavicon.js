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

import { deleteThumb, getThumb } from '../../lib/thumbnail.js'
import { SCOPES, unassign, unassignName } from '../../lib/favicon.js'

let handler = async (m, { args, usedPrefix, command }) => {
    const target = String(args[0] || '').trim()
    if (!target) {
        return m.reply(
            `*Format Penggunaan:*\n` +
            `> \`${usedPrefix}${command} all\` lepas favicon dari semua link preview\n` +
            `> \`${usedPrefix}${command} menu\` lepas favicon dari menu\n` +
            `> \`${usedPrefix}${command} <nama>\` hapus favicon dari database`
        )
    }

    if (SCOPES.includes(target.toLowerCase())) {
        const scope = target.toLowerCase()
        return m.reply(unassign(scope) ? `✅ Favicon *${scope}* dilepas.` : `⚠️ Belum ada favicon yang dipasang untuk *${scope}*.`)
    }

    if (!getThumb(target, 'favicon')) return m.reply(`⚠️ Favicon \`${target}\` tidak ditemukan.`)
    deleteThumb(target, 'favicon')
    const released = unassignName(target)
    return m.reply(`✅ Favicon \`${target}\` dihapus${released.length ? ` dan dilepas dari: ${released.join(', ')}` : ''}.`)
}

handler.help = ['delfavicon']
handler.tags = ['owner']
handler.command = /^(delfavicon)$/i
handler.owner = true

export default handler
