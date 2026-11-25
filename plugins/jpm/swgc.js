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

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const c = command.toLowerCase()

    if (c === 'stopswgc' || c === 'stopautoswgc') {
        if (!J.stopJob('autoSwgc')) return m.reply('❌ Auto SWGC tidak sedang berjalan.')
        return m.reply('*▢ AUTO SWGC*\n• Status : Dihentikan')
    }
    if (c === 'setdelayswgc' || c === 'setdelayautoswgc') {
        const ms = parseInt(text)
        if (isNaN(ms) || ms < 1000) return m.reply(`Contoh: ${usedPrefix}${command} <ms>  (minimal 1000, contoh: 60000)`)
        J.setCfg('delayAutoSwgc', ms)
        return m.reply(`*▢ DELAY AUTO SWGC*\n• Delay : ${ms}ms\n• Status : Berhasil diubah\n• Info : berlaku untuk autoswgc berikutnya`)
    }

    const media = await J.getMedia(m, ['image', 'video', 'audio'])
    const caption = text || media?.caption || m.quoted?.text || ''
    if (!caption && !media) return m.reply(`Contoh: ${usedPrefix}${command} teks status  (atau reply foto/video/audio)`)

    if (c === 'autoswgc') {
        if (!m.isGroup) return m.reply('❌ Perintah ini hanya bisa dipakai di dalam grup.')
        const delay = J.cfg().delayAutoSwgc
        await m.reply(`*▢ AUTO SWGC AKTIF*\n• Grup : ${m.chat}\n• Interval : setiap ${delay / 1000} detik\n\nHentikan dengan *${usedPrefix}stopswgc*`)
        J.startJob('autoSwgc', delay, async () => {
            await J.sendGroupStatus(conn, m.chat, { text: caption, media })
        })
        return
    }

    if (global.__jpmRunning) return m.reply(`❌ Masih ada proses JPM/SWGC yang berjalan. Tunggu selesai atau ketik *${usedPrefix}stopjpm*.`)
    const list = await J.groups(conn)
    if (!list.length) return m.reply('❌ Tidak ada grup yang bisa dikirimi status.')
    const delay = J.cfg().delayJpm
    const tipe = media ? ({ image: 'Foto', video: 'Video', audio: 'Audio' }[media.kind] || 'Media') : 'Teks'
    await m.reply(`*▢ PROSES SWGC ALL*\n• Total grup : ${list.length}\n• Tipe : ${tipe}\n• Delay : ${delay}ms\n\nHentikan dengan *${usedPrefix}stopjpm*`)
    const { ok, fail } = await J.loop(list, delay, g => J.sendGroupStatus(conn, g.id, { text: caption, media }))
    return m.reply(`*▢ SWGC ALL SELESAI*\n• Total grup : ${list.length}\n• Berhasil : ${ok} grup\n• Gagal : ${fail} grup` + (ok + fail < list.length ? `\n• Dilewati (dihentikan) : ${list.length - ok - fail} grup` : ''))
}

handler.help = ['swgcall', 'autoswgc', 'stopswgc', 'stopautoswgc', 'setdelayswgc', 'setdelayautoswgc']
handler.tags = ['jpm']
handler.command = ['swgcall', 'autoswgc', 'stopswgc', 'stopautoswgc', 'setdelayswgc', 'setdelayautoswgc']
handler.owner = true

export default handler
