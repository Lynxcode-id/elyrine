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

const VALUES = { off: 0, '1d': 86400, '7d': 604800, '90d': 7776000 }

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const key = String(text || '').trim().toLowerCase()
    const value = VALUES[key]
    if (value === undefined) return m.reply(`Contoh: ${usedPrefix}${command} 1d | 7d | 90d | off`)
    try {
        await conn.groupToggleEphemeral(m.chat, value)
        return m.reply(value ? `Pesan sementara aktif (${key}).` : 'Pesan sementara dimatikan.')
    } catch (e) {
        return m.reply(`[ ! ] ${e?.message || e}`)
    }
}

handler.help = ['ephemeral']
handler.tags = ['group']
handler.command = ['ephemeral', 'setting']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
