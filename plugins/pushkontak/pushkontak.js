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
import { memberJids, pushKode, sendVcf } from '../../lib/push.js'

let handler = async (m, { conn, text, usedPrefix, command, participants, groupMetadata }) => {
    const media = await J.getMedia(m)
    if (!text && !media) return m.reply(`Contoh: ${usedPrefix}${command} pesan yang ingin di-push ke member  (atau reply foto/video + caption)`)

    const jobs = J.jobs()
    if (jobs.pushRunning) return m.reply(`❌ Push kontak sedang berjalan. Ketik *${usedPrefix}stoppush* untuk menghentikan.`)

    const members = memberJids(conn, participants)
    if (!members.length) return m.reply('❌ Tidak ada member yang bisa dituju di grup ini.')

    const delay = J.cfg().delayPushKontak
    jobs.pushRunning = true
    await m.reply(`*▢ PUSH KONTAK*\n• Target : ${members.length} member\n• Delay : ${delay}ms\n• Auto-save : VCF\n\nHentikan dengan *${usedPrefix}stoppush*`)

    const saved = []
    let result
    try {
        result = await J.loop(members, delay, async to => {
            const caption = `${text || ''}\n\n#${pushKode()}`.trim()
            await conn.sendMessage(to, media ? J.mediaContent(media, caption) : { text: caption })
            saved.push(to)
        }, () => !jobs.pushRunning)
    } finally {
        jobs.pushRunning = false
    }

    const subject = groupMetadata?.subject || 'Grup'
    if (saved.length) {
        await sendVcf(conn, m.sender, saved, {
            fileName: `Kontak_${subject.replace(/\s+/g, '_')}_${saved.length}`,
            caption: `*▢ AUTO-SAVE KONTAK*\n• Total : ${saved.length} kontak\n• Grup : ${subject}\n\nImport file ini ke HP untuk menyimpan semua kontak.`
        }).catch(e => console.error('[PUSHKONTAK] gagal kirim VCF:', e?.message || e))
    }

    return m.reply(`*▢ PUSH KONTAK SELESAI*\n• Berhasil : ${result.ok} member\n• Gagal : ${result.fail} member\n• Tersimpan : ${saved.length} kontak (VCF)`)
}

handler.help = ['pushkontak']
handler.tags = ['pushkontak']
handler.command = ['pushkontak', 'puskontak']
handler.owner = true
handler.group = true

export default handler
