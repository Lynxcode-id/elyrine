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

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const h = global.badMac
  const sql = global.sqlSession
  if (!h || !sql) throw 'BadMacHandler / sesi SQLite belum aktif.'
  const confirm = /^(y|yes|ya)$/i.test(args[0] || '')
  const total = sql.clearKeys(undefined, { dryRun: !confirm })
  const files = { length: total }
  const st = h.getStats()
  if (!confirm) {
    return m.reply(`*Bad MAC saat ini:* ${st.errorCount}/${st.maxRetries}\n*Baris sesi yang akan dihapus:* ${files.length}\n\nSebelum lanjut pastikan hanya 1 proses bot yang jalan (cek \`pm2 ls\` / \`ps\`).\nLanjut: *${usedPrefix + command} yes*`)
  }
  await m.reply(`Dihapus ${files.length} baris sesi. creds/pre-key/app-state aman. Restart...`)
  h.resetErrorCount()
  if (process.send) process.send('reset')
  else m.reply('Jalankan ulang bot secara manual (jangan pakai node main.js langsung; pakai node index.js).')
}
handler.help = ['fixsession']
handler.tags = ['owner']
handler.command = /^(fixsession|clearsession)$/i
handler.rowner = true

export default handler
