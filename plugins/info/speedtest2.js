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

import { haidarGet } from '../../lib/haidar.js'

const handler = async m => {
  await m.wait()
  const d = await haidarGet('/api/v1/tools/speedtest')
  await m.reply([
    '*SPEEDTEST*',
    '',
    `Server   : ${d.server || '-'}`,
    `ISP      : ${d.isp || '-'}`,
    '',
    `Ping     : ${d.latency?.ping || '-'}`,
    `Jitter   : ${d.latency?.jitter || '-'}`,
    `Download : ${d.download?.speed || '-'}`,
    `Upload   : ${d.upload?.speed || '-'}`,
    `Loss     : ${d.packet_loss || '-'}`
  ].join('\n'))
}

handler.help = ['speedtest2']
handler.tags = ['info']
handler.command = /^(speedtest2|netspeed)$/i
handler.limit = true

export default handler
