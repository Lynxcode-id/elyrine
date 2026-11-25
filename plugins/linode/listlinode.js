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
    const { data = [] } = await L.call('/linode/instances')
    if (!data.length) return m.reply(`☁️ *DAFTAR LINODE*\n${L.LINE}\nTidak ada VPS aktif.`)
    return m.reply(`☁️ *DAFTAR LINODE*\n${L.LINE}\n` + data.map((l, i) => `*${i + 1}. ${l.label}*\nID     : ${l.id}\nIP     : ${l.ipv4?.[0] || '-'}\nStatus : ${l.status}`).join('\n\n'))
})

handler.help = ['listlinode']
handler.tags = ['linode']
handler.command = ['listlinode']
handler.owner = true

export default handler
