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

import { addThumbFlow, getThumb } from '../../lib/thumbnail.js'
import { SCOPES, assign } from '../../lib/favicon.js'

let handler = async (m, ctx) => {
    const { args, usedPrefix, command } = ctx
    const scope = String(args[0] || '').toLowerCase()
    if (!SCOPES.includes(scope)) {
        return m.reply(
            `*Format Penggunaan:*\n` +
            `> \`${usedPrefix}${command} all <nama>\` favicon di semua link preview\n` +
            `> \`${usedPrefix}${command} menu <nama>\` favicon hanya di link preview menu\n\n` +
            `Reply gambar / kirim gambar dengan caption / sertakan URL gambar.\n` +
            `Nama yang sudah tersimpan bisa dipakai ulang tanpa gambar.`
        )
    }

    const rest = args.slice(1)
    const name = (rest.find(a => !a.startsWith('-')) || `favicon-${scope}`).trim()
    const hasSource = !!(m.quoted || /^image\//.test((m.msg || m)?.mimetype || '') || rest.some(a => /^https?:\/\//i.test(a)))

    if (!hasSource && getThumb(name, 'favicon')) {
        assign(scope, name)
        return m.reply(`✅ Favicon \`${name}\` dipasang untuk *${scope}*.`)
    }

    const startedAt = Math.floor(Date.now() / 1000)
    await addThumbFlow(m, { ...ctx, args: [name, ...rest.filter(a => a !== name)], command }, 'favicon')

    const row = getThumb(name, 'favicon')
    if (!row || row.updated_at < startedAt) return
    assign(scope, name)
    return m.reply(`✅ Favicon \`${name}\` aktif untuk *${scope}*.`)
}

handler.help = ['addfavicon']
handler.tags = ['owner']
handler.command = /^(addfavicon)$/i
handler.owner = true

export default handler
