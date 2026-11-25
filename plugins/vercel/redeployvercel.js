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
    const arg = (ctx.text || '').trim()
    if (!arg) return upd(`Contoh: ${p0}redeployvercel namaproject`)
    const name = V.slug(arg.split(/\s+/)[0])
    const { deployments = [] } = await api(`/v6/deployments?app=${encodeURIComponent(name)}&limit=1&target=production`)
    if (!deployments[0]) return upd('Belum ada deployment produksi untuk project itu.')
    const d = await api('/v13/deployments?forceNew=1', { method: 'POST', body: { name, deploymentId: deployments[0].uid, target: 'production' } })
    await upd('🚀 Redeploy berjalan, menunggu build...')
    const done = await V.waitReady(api, d.id)
    return upd(`✅ *REDEPLOY SELESAI*\n${V.siteUrl(done, name)}`)
})

handler.help = ['redeployvercel']
handler.tags = ['vercel']
handler.command = ['redeployvercel']

export default handler
