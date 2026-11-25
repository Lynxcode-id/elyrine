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

import * as L from '../../lib/linode.js'

let handler = async (m, { text, usedPrefix, command }) => {
    const [id, image = L.cfg().image || 'linode/ubuntu22.04'] = String(text || '').trim().split(/\s+/)
    if (!/^\d+$/.test(id || '')) return m.reply(`Contoh: ${usedPrefix}${command} 12345 linode/ubuntu22.04`)
    return L.safe(m, async () => {
        const rootPass = L.genPass()
        await L.call(`/linode/instances/${id}/rebuild`, { method: 'POST', body: { image, root_pass: rootPass } })
        return m.reply(`✅ Linode ID \`${id}\` berhasil di-rebuild.\n\nPassword baru : ${rootPass}\nImage         : ${image}`)
    })
}

handler.help = ['rebuildlinode']
handler.tags = ['linode']
handler.command = ['rebuildlinode']
handler.owner = true

export default handler
