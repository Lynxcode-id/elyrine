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

let handler = async (m, { conn }) => {
    const sql = global.sqlSession
    if (!sql) throw 'Sesi SQLite belum aktif.'
    await m.reply('Tunggu sebentar, sedang mengambil file sesi bot')
    const st = sql.stats()
    await conn.sendMessage(m.chat, { document: Buffer.from(sql.exportCreds()), mimetype: 'application/json', fileName: 'creds.json' }, { quoted: m })
    await m.reply(`*DB sesi:* ${(st.sizeBytes / 1024).toFixed(1)} KB • ${st.totalKeys} key\n` + Object.entries(st.keys).map(([k, n]) => `• ${k}: ${n}`).join('\n'))
}
handler.help = ['getsessi']
handler.tags = ['owner']
handler.command = /^(g(et)?ses?si(on)?(data.json)?)$/i

handler.rowner = true

export default handler
