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

import { memberJids, sendVcf } from '../../lib/push.js'

let handler = async (m, { conn, text, usedPrefix, command, participants, groupMetadata }) => {
    const nama = String(text || '').trim()
    if (!nama) return m.reply(`Contoh: ${usedPrefix}${command} CustomerList  (nama dasar kontak, hasilnya "CustomerList - 1", "CustomerList - 2", ...)`)

    const members = memberJids(conn, participants)
    if (!members.length) return m.reply('❌ Tidak ada kontak yang bisa disimpan di grup ini.')

    await sendVcf(conn, m.sender, members, {
        fileName: `${nama}_${members.length}kontak`,
        nameOf: (_, i) => `${nama} - ${i + 1}`,
        caption: `*▢ KONTAK DISIMPAN*\n• Nama : ${nama}\n• Total : ${members.length} kontak\n• Grup : ${groupMetadata?.subject || '-'}`
    })

    return m.reply(`*▢ SAVE KONTAK*\n• Total : ${members.length} kontak\n• Status : File VCF dikirim ke chat pribadi`)
}

handler.help = ['savekontak']
handler.tags = ['pushkontak']
handler.command = ['savekontak', 'svkontak', 'savecontact']
handler.owner = true
handler.group = true

export default handler
