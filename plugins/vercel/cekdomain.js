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
    const usage = `${p0}cekdomain namaproject domain.com`
    const [proj, a] = (ctx.text || '').trim().split(/\s+/)
    if (!proj) return upd(`Contoh: ${usage}`)
    const domain = V.cleanDomain(a)
    if (!V.DOMAIN_RE.test(domain)) return upd(`Domain tidak valid.\nContoh: ${usage}`)
    await api(`/v9/projects/${V.pj(proj)}/domains/${V.dj(domain)}/verify`, { method: 'POST' }).catch(() => null)
    const info = await api(`/v9/projects/${V.pj(proj)}/domains/${V.dj(domain)}`)
    const c = await api(`/v6/domains/${V.dj(domain)}/config`).catch(() => null)
    if (info.verified && c && !c.misconfigured) return upd(`✅ ${domain} aktif dan DNS sudah benar.\nhttps://${domain}`)
    return upd(`⏳ ${domain} belum siap (${info.verified ? 'DNS belum mengarah ke Vercel' : 'belum terverifikasi'}).\n\n${await V.dnsText(api, domain, info)}`)
})

handler.help = ['cekdomain']
handler.tags = ['vercel']
handler.command = ['cekdomain']

export default handler
