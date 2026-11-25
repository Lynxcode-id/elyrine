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

let handler = (m, ctx) => V.run(m, ctx, async ({ upd, api, p0 }) => {
    const [proj] = (ctx.text || '').trim().split(/\s+/)
    if (!proj) return upd(`Contoh: ${p0}listdomain namaproject`)
    const { domains = [] } = await api(`/v9/projects/${V.pj(proj)}/domains`)
    if (!domains.length) return upd(`Project ${proj} belum punya domain.`)
    return upd(`🌐 *DOMAIN ${V.slug(proj)}*\n\n` + domains.map(d => `${d.verified ? '✅' : '⏳'} ${d.name}${d.redirect ? ` → ${d.redirect}` : ''}`).join('\n'))
})

handler.help = ['listdomain']
handler.tags = ['vercel']
handler.command = ['listdomain']

export default handler
