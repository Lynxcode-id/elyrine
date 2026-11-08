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

import { syncUser } from '../../lib/limit.js'

export async function all(m) {
    if (m.chat?.endsWith('broadcast')) return
    const user = global.db.data.users[m.sender]
    if (!user) return
    const fix = syncUser(user, m.sender)
    if (fix.premiumExpired) await m.reply('Waktu premium Kamu sudah habis!')
    if (fix.vipExpired) await m.reply('Waktu VIP Kamu sudah habis!')
}
