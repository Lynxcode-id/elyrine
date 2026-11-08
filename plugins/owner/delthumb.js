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

import { deleteCustomThumb } from '../../lib/customthumb.js'

let handler = async (m, { usedPrefix }) => {
    if (!deleteCustomThumb()) {
        return m.reply(`⚠️ Tidak ada thumbnail custom yang diset (sudah pakai thumbnail bawaan).\nPasang dengan *${usedPrefix}addthumb*.`)
    }
    return m.reply('✅ Thumbnail custom dihapus. Thumbnail bawaan aktif lagi.')
}

handler.help = ['delthumb']
handler.tags = ['owner']
handler.command = /^(delthumb)$/i
handler.owner = true

export default handler
