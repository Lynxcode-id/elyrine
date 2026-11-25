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

import * as V from '../../lib/vercel.js'

let handler = (m, ctx) => V.run(m, ctx, async ({ upd, api }) => {
    const { projects = [] } = await api('/v9/projects?limit=30')
    if (!projects.length) return upd('Belum ada project di akun Vercel ini.')
    return upd('▲ *PROJECT VERCEL*\n\n' + projects.map((p, i) => `${i + 1}. ${p.name}\n   https://${p.targets?.production?.alias?.[0] || p.name + '.vercel.app'}`).join('\n'))
})

handler.help = ['listvercel']
handler.tags = ['vercel']
handler.command = ['listvercel']

export default handler
