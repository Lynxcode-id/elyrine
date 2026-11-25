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

import * as L from '../../lib/linode.js'

let handler = async m => L.safe(m, async () => {
    const d = await L.call('/account')
    return m.reply(`💰 *SALDO AKUN LINODE*\n${L.LINE}\nBalance : $${Number(d.balance || 0).toFixed(2)}\nUninvoiced : $${Number(d.balance_uninvoiced || 0).toFixed(2)}`)
})

handler.help = ['saldolinode']
handler.tags = ['linode']
handler.command = ['saldolinode']
handler.owner = true

export default handler
