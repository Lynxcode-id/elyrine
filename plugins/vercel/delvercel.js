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
    const [name, ok] = (ctx.text || '').trim().split(/\s+/)
    if (!name) return upd(`Contoh: ${p0}delvercel namaproject ya`)
    if (!/^(ya|yes|y)$/i.test(ok || '')) return upd(`Menghapus project tidak bisa dibatalkan.\nKetik: ${p0}delvercel ${name} ya`)
    await api(`/v9/projects/${encodeURIComponent(name)}`, { method: 'DELETE' })
    return upd(`🗑️ Project ${name} dihapus.`)
})

handler.help = ['delvercel']
handler.tags = ['vercel']
handler.command = ['delvercel']

export default handler
