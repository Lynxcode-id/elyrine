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
    const spec = L.types()[command.toLowerCase()]
    const label = String(text || '').trim().split(/\s+/)[0]
    if (!label) return m.reply(`Contoh: ${usedPrefix}${command} myserver`)
    return L.safe(m, async () => {
        const c = L.cfg()
        const rootPass = L.genPass()
        const created = await L.call('/linode/instances', {
            method: 'POST',
            body: { label, region: c.region || 'ap-south', type: spec.type, image: c.image || 'linode/ubuntu22.04', root_pass: rootPass, backups_enabled: false }
        })
        await m.reply(`☁️ *MEMBUAT LINODE*\n${L.LINE}\nID    : ${created.id}\nLabel : ${label}\nSpek  : ${spec.ram} RAM\n\nTunggu sekitar 60 detik.`)
        await new Promise(r => setTimeout(r, 60000))
        const info = await L.call(`/linode/instances/${created.id}`)
        return m.reply(`✅ *LINODE ${spec.ram} BERHASIL DIBUAT*\n${L.LINE}\nID       : ${created.id}\nLabel    : ${label}\nIP       : ${info.ipv4?.[0] || 'Pending'}\nUser     : root\nPassword : ${rootPass}\nRAM      : ${spec.ram}\nRegion   : ${info.region || c.region || 'ap-south'}`)
    })
}

handler.help = ['linode2gb', 'linode4gb', 'linode8gb', 'linode16gb']
handler.tags = ['linode']
handler.command = Object.keys((await import('../../lib/linode.js')).types())
handler.owner = true

export default handler
