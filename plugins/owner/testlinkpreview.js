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

import { sendWideLinkPreview, sendSquareLinkPreview } from '../../lib/linkpreview.js'

const DEMO_URL = 'https://github.com/Lynx-decode/ERINE-AI'
const DEMO_IMG = 'https://raw.githubusercontent.com/its-dinda/image/main/1794457295780.jpeg'
const DEMO_TITLE = 'ERINE-AI ~ 3ND PROJECT'
const DEMO_DESC = 'ҽɾιɳҽ-αι 3ɳԃ'

let handler = async (m, { conn, text }) => {
  const mode = String(text || '').trim().toLowerCase()
  const common = { url: DEMO_URL, title: DEMO_TITLE, description: DEMO_DESC, image: DEMO_IMG, quoted: m, mentions: [m.sender] }

  if (['small', 'kecil', '1:1', 'square'].includes(mode)) {
    await sendSquareLinkPreview(conn, m.chat, { ...common, text: 'Tes link preview kecil (1:1).' })
    return
  }
  if (['wide', 'lebar', '16:9', 'besar'].includes(mode)) {
    await sendWideLinkPreview(conn, m.chat, { ...common, text: 'Tes link preview lebar (16:9).' })
    return
  }

  await sendWideLinkPreview(conn, m.chat, { ...common, text: 'Tes link preview lebar (16:9).' })
  await sendSquareLinkPreview(conn, m.chat, { ...common, text: 'Tes link preview kecil (1:1).' })
}

handler.help = ['testlinkpreview <wide|small>']
handler.tags = ['owner']
handler.command = /^(testlinkpreview)$/i
handler.owner = true

export default handler
