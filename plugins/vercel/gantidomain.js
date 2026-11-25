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
    const usage = `${p0}gantidomain namaproject domainlama.com domainbaru.com`
    const [proj, a, b] = (ctx.text || '').trim().split(/\s+/)
    if (!proj) return upd(`Contoh: ${usage}`)
    const lama = V.cleanDomain(a)
    const baru = V.cleanDomain(b)
    if (!V.DOMAIN_RE.test(lama) || !V.DOMAIN_RE.test(baru)) return upd(`Contoh: ${usage}`)
    const info = await api(`/v10/projects/${V.pj(proj)}/domains`, { method: 'POST', body: { name: baru } })
    await api(`/v9/projects/${V.pj(proj)}/domains/${V.dj(lama)}`, { method: 'DELETE' }).catch(() => null)
    return upd(`🔁 ${lama} diganti ke *${baru}*\n\n${await V.dnsText(api, baru, info)}`)
})

handler.help = ['gantidomain']
handler.tags = ['vercel']
handler.command = ['gantidomain']

export default handler
