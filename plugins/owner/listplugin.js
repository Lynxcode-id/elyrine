/*
  ERINE-AI • ELYRINE
  WhatsApp Bot Multi-Device · Node.js ESM

  Developer   Arman Maulana (Lynx decode)
  Versi       1.0.0
  Lisensi     ELYRINE Source-Available Non-Commercial v1.0
  Copyright   © 2026 Arman Maulana

  Didirikan di atas Elyra Labs & ekosistemnya.
  Komunitas   General District (induk) · INF Project · Elyra Labs
  Engine      elyra-baileys, fork Baileys yang dikustom
              sesuai kebutuhan bot ini.

  Dilarang menjual, menyewakan, atau merebrand tanpa
  izin tertulis dari developer. Jangan hapus kredit ini.
*/

let handler = async (m, { text }) => {
  const groups = {}
  for (const key of Object.keys(global.plugins)) {
    const [folder, ...r] = key.split('/')
    const k = r.length ? folder : '(root)'
    if (!groups[k]) groups[k] = []
    groups[k].push((r.join('/') || folder).replace(/\.js$/, ''))
  }
  const want = (text || '').trim().toLowerCase()
  const out = Object.entries(groups)
    .filter(([f]) => !want || f === want)
    .map(([f, list]) => `📁 *${f}* (${list.length})\n${list.map(v => '  • ' + v).join('\n')}`)
  m.reply(out.join('\n\n') || 'Folder tidak ditemukan.')
}
handler.help = ['listplugin [folder]']
handler.tags = ['owner']
handler.command = /^(listplugin|lsplugin)$/i
handler.rowner = true

export default handler