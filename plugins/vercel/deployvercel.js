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
import { getMedia } from '../../lib/jpm.js'

let handler = (m, ctx) => V.run(m, ctx, async ({ upd, api, p0 }) => {
    const { command, text = '' } = ctx
    const media = await getMedia(m, ['document'])
    if (!media) return upd(`Kirim atau reply file *.html* / *.zip* dengan caption:\n${p0}${command} namaproject\n\nZip boleh berisi site statis atau project Node (folder api/, package.json, vercel.json).`)

    const name = V.slug(text.trim().split(/\s+/)[0] || media.fileName.replace(/\.[a-z0-9]+$/i, '')) || 'elyrine-' + Date.now().toString(36)
    const files = V.collectFiles(media.buffer, media.fileName, media.mime)
    await upd(`⬆️ Upload ${files.length} file ke Vercel (${name})...`)
    const dep = await api('/v13/deployments?skipAutoDetectionConfirmation=1', {
        method: 'POST',
        body: { name, files, target: 'production', projectSettings: { framework: null } }
    })
    await upd('🔨 Build berjalan, menunggu selesai...')
    const done = await V.waitReady(api, dep.id)
    return upd(`✅ *DEPLOY BERHASIL*\n\nProject : ${name}\nFile    : ${files.length}\nURL     : ${V.siteUrl(done, name)}\n\nKalau project butuh env, set dengan ${p0}envvercel lalu ${p0}redeployvercel ${name}`)
})

handler.help = ['deployvercel']
handler.tags = ['vercel']
handler.command = ['vercel', 'deployvercel']

export default handler
