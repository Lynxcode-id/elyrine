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
    const d = await L.call('/linode/instances')
    return m.reply(`📊 *TOTAL LINODE AKTIF*\n${L.LINE}\n${d.results ?? d.data?.length ?? 0} VPS`)
})

handler.help = ['sisalinode']
handler.tags = ['linode']
handler.command = ['sisalinode']
handler.owner = true

export default handler
