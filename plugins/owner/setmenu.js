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

import { MENU_STYLES, getMenuStyleInfo, setMenuStyle } from '../../lib/menustyle.js'

let handler = async (m, { usedPrefix, command, args }) => {
    const cur = getMenuStyleInfo()
    const pick = String(args[0] || (command.match(/\d$/) || [''])[0]).toLowerCase().replace(/^menu/, '').trim()

    if (!pick) {
        const lines = Object.entries(MENU_STYLES).map(([k, v]) => `${Number(k) === cur.style ? '✅' : '▫️'} *${k}* › ${v.name}: ${v.desc}`)
        return m.reply([
            '*SET MENU*',
            '',
            ...lines,
            '',
            `Menu aktif: *${MENU_STYLES[cur.style].name}*`,
            '',
            `Contoh: ${usedPrefix}${command} 1`,
            `             ${usedPrefix}${command} 2`,
            `             ${usedPrefix}${command} 3`
        ].join('\n'))
    }

    if (!MENU_STYLES[pick]) return m.reply(`Pilihan tidak ada. Pakai ${usedPrefix}${command} 1, 2, atau 3`)
    if (cur.style === Number(pick)) return m.reply(`${MENU_STYLES[pick].name} sudah aktif.`)

    try {
        setMenuStyle(pick, m.sender)
    } catch (e) {
        console.error('[SETMENU]', e?.stack || e?.message || e)
        return m.reply(`Gagal menyimpan: ${e?.message || 'unknown'}`)
    }
    return m.reply(`✅ ${MENU_STYLES[pick].name} berhasil disetel dan disimpan permanen (tetap aktif walau bot restart).\nCoba ketik ${usedPrefix}menu`)
}

handler.help = ['setmenu <1|2|3>']
handler.tags = ['owner']
handler.command = /^(setmenu|setmenu1|setmenu2|setmenu3)$/i
handler.owner = true

export default handler
