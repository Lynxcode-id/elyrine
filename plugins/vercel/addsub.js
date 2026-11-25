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
    const usage = `${p0}addsub namaproject sub domain.com`
    const [proj, sub, main] = (ctx.text || '').trim().split(/\s+/)
    if (!proj) return upd(`Contoh: ${usage}`)
    const domain = V.cleanDomain(main ? `${sub}.${main}` : sub)
    if (!V.DOMAIN_RE.test(domain)) return upd(`Domain tidak valid.\nContoh: ${usage}`)
    const info = await api(`/v10/projects/${V.pj(proj)}/domains`, { method: 'POST', body: { name: domain } })
    return upd(`✅ *${domain}* ditambahkan ke ${V.slug(proj)}\n\n${await V.dnsText(api, domain, info)}\n\nSetelah DNS diset: ${p0}cekdomain ${V.slug(proj)} ${domain}`)
})

handler.help = ['addsub']
handler.tags = ['vercel']
handler.command = ['addsub']

export default handler
