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

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`Contoh: ${usedPrefix}${command} Deskripsi baru (ketik "hapus" untuk mengosongkan)`)
    try {
        await conn.groupUpdateDescription(m.chat, text.trim().toLowerCase() === 'hapus' ? '' : text.trim())
        return m.reply('Deskripsi grup berhasil diubah.')
    } catch (e) {
        return m.reply(`[ ! ] ${e?.message || e}`)
    }
}

handler.help = ['setdescgc']
handler.tags = ['group']
handler.command = ['setdescgc']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
