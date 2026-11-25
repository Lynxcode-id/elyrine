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
    const [name, ...rest] = arg.split('\n')[0].split(/\s+/).concat(arg.split('\n').slice(1))
    const lines = rest.join('\n').split('\n').map(l => l.trim()).filter(l => /^[A-Za-z_][A-Za-z0-9_]*=/.test(l))
    if (!name || !lines.length) return upd(`Contoh:\n${p0}envvercel namaproject\nGOPAY_EMAIL=a@b.com\nINTERNAL_TOKEN=rahasia\n\n(project harus sudah pernah di-deploy. Pakai di chat pribadi, lalu redeploy.)`)
    const body = lines.map(l => {
        const i = l.indexOf('=')
        return { key: l.slice(0, i), value: l.slice(i + 1).replace(/^["']|["']$/g, ''), type: 'encrypted', target: ['production', 'preview', 'development'] }
    })
    await api(`/v10/projects/${encodeURIComponent(name)}/env?upsert=true`, { method: 'POST', body })
    return upd(`✅ ${body.length} env diset di ${name}: ${body.map(b => b.key).join(', ')}\nJalankan ${p0}redeployvercel ${name} supaya berlaku.`)
})

handler.help = ['envvercel']
handler.tags = ['vercel']
handler.command = ['envvercel']

export default handler
