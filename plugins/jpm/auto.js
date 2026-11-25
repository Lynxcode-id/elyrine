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

    if (['stopjpm', 'stopjasher', 'stopjaser'].includes(c)) {
        if (!global.__jpmRunning) return m.reply('❌ Tidak ada JPM yang sedang berjalan.')
        global.__jpmStop = true
        return m.reply('*▢ STOP JPM*\n• Status : Menghentikan proses JPM...')
    }
    if (['stopjpmbasic', 'stopjpmb'].includes(c)) {
        if (!global.__jpmBasicRunning) return m.reply('❌ Tidak ada JPM Basic yang sedang berjalan.')
        global.__jpmBasicStop = true
        return m.reply('*▢ STOP JPM BASIC*\n• Status : Menghentikan JPM Basic...')
    }
    if (c === 'stopautojpm') {
        if (!J.stopJob('autoJpm')) return m.reply('❌ Auto JPM tidak sedang berjalan.')
        return m.reply('*▢ AUTO JPM*\n• Status : Dihentikan')
    }
    if (c === 'stopautojpmtag') {
        if (!J.stopJob('autoJpmTag')) return m.reply('❌ Auto JPM Tag tidak sedang berjalan.')
        return m.reply('*▢ AUTO JPM TAG*\n• Status : Dihentikan')
    }

    const tag = c === 'autojpmtag'
    const media = await J.getMedia(m)
    const { interval, teks } = J.splitInterval(text)
    if (!teks && !media) return m.reply(`Contoh: ${usedPrefix}${command} 5m pesan auto broadcast${tag ? ' tag' : ''}  (interval: 30s / 5m / 1h / 60000)`)
    if (interval < J.MIN_INTERVAL) return m.reply(`❌ Interval minimal ${J.MIN_INTERVAL / 1000} detik.`)

    const cfg = J.cfg()
    const delay = tag ? cfg.delayJpmTag : cfg.delayJpm
    await m.reply(`*▢ AUTO JPM${tag ? ' TAG' : ''} AKTIF*\n• Interval : setiap ${interval / 1000} detik\n• Delay antar grup : ${delay}ms\n• Pesan : ${teks || '[Media]'}\n\nHentikan dengan *${usedPrefix}${tag ? 'stopautojpmtag' : 'stopautojpm'}*`)

    J.startJob(tag ? 'autoJpmTag' : 'autoJpm', interval, async isStopped => {
        const list = await J.groups(conn, { auto: true })
        await J.loop(list, delay, g => {
            if (!tag) return conn.sendMessage(g.id, media ? J.mediaContent(media, teks) : { text: teks })
            const t = J.tagList(g)
            const caption = `${teks}\n${t.text}`
            return conn.sendMessage(g.id, media ? J.mediaContent(media, caption, t.mentions) : { text: caption, mentions: t.mentions })
        }, isStopped)
    })
}

handler.help = ['autojpm', 'autojpmtag', 'stopjpm', 'stopjpmbasic', 'stopautojpm', 'stopautojpmtag']
handler.tags = ['jpm']
handler.command = ['autojpm', 'autojpmtag', 'stopjpm', 'stopjasher', 'stopjaser', 'stopjpmbasic', 'stopjpmb', 'stopautojpm', 'stopautojpmtag']
handler.owner = true

export default handler
