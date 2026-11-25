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

const STATUS = {
    200: '✅ berhasil ditambahkan',
    408: '⏳ baru saja keluar, belum bisa ditambahkan',
    409: 'ℹ️ sudah ada di grup',
    401: '⛔ memblokir nomor ini',
    403: '🔒 privasi dibatasi, undangan dikirim lewat chat pribadi',
    500: '⚠️ gagal ditambahkan'
}

let handler = async (m, { conn, text, usedPrefix, command, groupMetadata }) => {
    const numbers = [...new Set((String(text || '').match(/\d{8,15}/g) || []).map(n => n.replace(/^0/, '62')))]
    if (!numbers.length) return m.reply(`Contoh: ${usedPrefix}${command} 628123456789 628987654321`)
    try {
        const res = await conn.groupParticipantsUpdate(m.chat, numbers.map(n => `${n}@s.whatsapp.net`), 'add')
        const lines = []
        for (const r of res || []) {
            const status = Number(r.status)
            lines.push(`-▢ @${String(r.jid).split('@')[0]} ${STATUS[status] || `kode ${status}`}`)
            if (status === 403) {
                const code = await conn.groupInviteCode(m.chat).catch(() => null)
                if (code) await conn.sendMessage(r.jid, { text: `Kamu diundang ke grup *${groupMetadata?.subject || 'grup'}*:\nhttps://chat.whatsapp.com/${code}` }).catch(() => { })
            }
        }
        return conn.sendMessage(m.chat, { text: `*▢ TAMBAH MEMBER*\n${lines.join('\n')}`, mentions: (res || []).map(r => r.jid) }, { quoted: m })
    } catch (e) {
        return m.reply(`[ ! ] ${e?.message || e}`)
    }
}

handler.help = ['addmember']
handler.tags = ['group']
handler.command = ['addmember']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
