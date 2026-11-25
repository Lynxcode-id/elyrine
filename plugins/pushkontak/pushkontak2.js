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

import * as J from '../../lib/jpm.js'
import { memberJids, pushKode } from '../../lib/push.js'

let handler = async (m, { conn, text, usedPrefix, command, participants }) => {
    const [pesan, nama] = String(text || '').split('|').map(s => s.trim())
    if (!pesan || !nama) return m.reply(`Contoh: ${usedPrefix}${command} Halo semuanya!|TokoBaru   (format: pesan|namakontak)`)

    const jobs = J.jobs()
    if (jobs.pushRunning) return m.reply(`❌ Push kontak sedang berjalan. Ketik *${usedPrefix}stoppush* untuk menghentikan.`)

    const members = memberJids(conn, participants).filter(id => id !== m.sender)
    if (!members.length) return m.reply('❌ Tidak ada member yang bisa dituju di grup ini.')

    const delay = J.cfg().delayPushKontak
    jobs.pushRunning = true
    await m.reply(`*▢ PUSH KONTAK 2*\n• Target : ${members.length} member\n• Nama kontak : ${nama}\n• Delay : ${delay}ms\n\nHentikan dengan *${usedPrefix}stoppush*`)

    let res
    try {
        res = await J.loop(members, delay, async to => {
            const nomor = to.split('@')[0]
            await conn.sendMessage(to, { text: `${pesan}\n\n#${pushKode()}` })
            await conn.sendMessage(to, {
                contacts: {
                    displayName: nama,
                    contacts: [{ displayName: nama, vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${nama} - ${nomor}\nTEL;type=CELL;type=VOICE;waid=${nomor}:+${nomor}\nEND:VCARD` }]
                }
            })
        }, () => !jobs.pushRunning)
    } finally {
        jobs.pushRunning = false
    }
    return m.reply(`*▢ PUSH KONTAK 2 SELESAI*\n• Berhasil : ${res.ok} member\n• Gagal : ${res.fail} member`)
}

handler.help = ['pushkontak2']
handler.tags = ['pushkontak']
handler.command = ['pushkontak2', 'puskontak2', 'push2']
handler.owner = true
handler.group = true

export default handler
