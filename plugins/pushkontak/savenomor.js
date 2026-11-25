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
    const input = String(text || '').trim()
    let target = ''
    let nama = ''

    if (m.isGroup) {
        const mentioned = m.mentionedJid || []
        if (m.quoted?.sender) {
            target = m.quoted.sender
            nama = input
        } else if (mentioned.length) {
            target = mentioned[0]
            nama = input.includes('|') ? input.split('|').slice(1).join('|').trim() : input.replace(/@\d+/g, '').trim()
        } else if (input.includes('|')) {
            const [num, ...rest] = input.split('|')
            const digits = num.replace(/\D/g, '')
            if (digits) target = `${digits}@s.whatsapp.net`
            nama = rest.join('|').trim()
        } else {
            return m.reply(`Contoh:\n${usedPrefix}${command} nama  (reply pesan target)\n${usedPrefix}${command} @tag|nama\n${usedPrefix}${command} 628xxx|nama`)
        }
    } else {
        target = m.chat
        nama = input
    }

    if (!nama) return m.reply('❌ Masukkan nama kontak.')
    if (!target) return m.reply('❌ Tidak dapat menentukan nomor target.')

    const nomor = String(target).split('@')[0].split(':')[0]

    if (typeof conn.addOrEditContact === 'function') {
        await conn.addOrEditContact(target, { fullName: nama, lidJid: target, saveOnPrimaryAddressbook: true })
        return m.reply(`*▢ KONTAK DISIMPAN*\n• Nomor : ${nomor}\n• Nama : ${nama}`)
    }

    await conn.sendMessage(m.chat, {
        contacts: {
            displayName: nama,
            contacts: [{ displayName: nama, vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${nama}\nTEL;type=CELL;type=VOICE;waid=${nomor}:+${nomor}\nEND:VCARD` }]
        }
    }, { quoted: m })
    return m.reply('ℹ️ Versi Baileys ini belum mendukung simpan kontak langsung, jadi kartu kontak dikirim sebagai gantinya.')
}

handler.help = ['savenomor']
handler.tags = ['pushkontak']
handler.command = ['savenomor', 'sv', 'save', 'simpannomor']
handler.owner = true

export default handler
