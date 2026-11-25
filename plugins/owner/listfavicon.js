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

import { listThumbs, fmtWib } from '../../lib/thumbnail.js'
import { SCOPES, assigned } from '../../lib/favicon.js'

let handler = async m => {
    const rows = listThumbs('favicon')
    const pasang = SCOPES.map(s => `• ${s} : ${assigned(s) ? `\`${assigned(s)}\`` : '-'}`).join('\n')
    if (!rows.length) return m.reply(`*FAVICON*\n\n${pasang}\n\nBelum ada favicon tersimpan.`)
    const daftar = rows.map((r, i) => `${i + 1}. \`${r.name}\` · ${r.expired ? fmtWib(r.expired) : 'tanpa expired'}`).join('\n')
    return m.reply(`*FAVICON*\n\n${pasang}\n\n*Tersimpan (${rows.length})*\n${daftar}`)
}

handler.help = ['listfavicon']
handler.tags = ['owner']
handler.command = /^(listfavicon)$/i
handler.owner = true

export default handler
