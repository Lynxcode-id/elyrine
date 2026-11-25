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

import { getBinaryNodeChild } from 'elyrine-baileys'
import * as J from '../../lib/jpm.js'

const MAP = {
    jpm: 'jpm',
    jpmtag: 'tag',
    jpmht: 'ht',
    jpmbasic: 'basic', jpmb: 'basic', jaser2: 'basic',
    jpmupdate: 'update', updatejpm: 'update', broadcastupdate: 'update', shareupdate: 'update',
    jpmch: 'ch', jpmchannel: 'ch'
}

async function fetchChannels(conn) {
    const out = []
    try {
        const result = await conn.query({
            tag: 'iq',
            attrs: { id: conn.generateMessageTag(), type: 'get', xmlns: 'w:mex', to: '@s.whatsapp.net' },
            content: [{
                tag: 'query',
                attrs: { query_id: '6388546374527196' },
                content: new TextEncoder().encode(JSON.stringify({ variables: {} }))
            }]
        })
        const child = getBinaryNodeChild(result, 'result')
        if (!child?.content) return out
        const parsed = JSON.parse(child.content.toString())
        const list = parsed?.data?.xwa2_newsletter_subscribed || parsed?.data?.newsletter_subscribed || parsed?.data?.subscribed || []
        for (const ch of list) if (ch.id) out.push({ id: ch.id, name: ch.thread_metadata?.name?.text || ch.name || 'Unknown' })
    } catch (e) { console.error('[JPMCH]', e?.message || e) }
    return out
}

async function run(m, title, targets, delay, send, { unit = 'grup', tipe, isStopped } = {}) {
    await m.reply(`*▢ PROSES ${title}*\n• Total ${unit} : ${targets.length}\n• Tipe : ${tipe}\n• Delay : ${delay}ms`)
    const { ok, fail } = await J.loop(targets, delay, send, isStopped)
    return m.reply(`*▢ ${title} SELESAI*\n• Berhasil : ${ok} ${unit}\n• Gagal : ${fail} ${unit}`)
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const key = MAP[command.toLowerCase()]
    const basic = key === 'basic'
    if (basic ? global.__jpmBasicRunning : global.__jpmRunning)
        return m.reply(`❌ JPM sedang berjalan. Ketik *${usedPrefix}${basic ? 'stopjpmbasic' : 'stopjpm'}* untuk menghentikan.`)
    const usage = arg => m.reply(`Contoh: ${usedPrefix}${command} ${arg}`)
    const cfg = J.cfg()

    if (key === 'update') {
        if (!text) return usage('v3.0 | ✨ Fitur Baru:\\n- Anime   (pakai \\n untuk baris baru)')
        let version = global.versi || 'v1.0'
        let changelog = text
        if (text.includes('|')) {
            const [v, ...rest] = text.split('|')
            version = v.trim() || version
            changelog = rest.join('|').trim()
        }
        if (!changelog) return m.reply('❌ Changelog tidak boleh kosong.')
        const list = await J.groups(conn)
        if (!list.length) return m.reply('❌ Tidak ada grup yang bisa dituju.')
        const tanggal = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Makassar', day: '2-digit', month: 'long', year: 'numeric' })
        const pesan = `🚀 *UPDATE !! | ${version}*\n\n📅 *Tanggal:* ${tanggal}\n\n*CHANGELOG:*\n${changelog.replace(/\\n/g, '\n')}\n\n*CATATAN TERBARU:*\n> 💡 Ketik *${usedPrefix}menu* untuk melihat fitur-fitur ini.\n> 📢 _Terima kasih telah menggunakan ${global.namebot || 'bot'}_`
        await m.reply(`*▢ JPM UPDATE*\n• Versi : ${version}\n• Target : ${list.length} grup\n• Delay : ${cfg.delayJpm}ms`)
        const { ok, fail } = await J.loop(list, cfg.delayJpm, g => conn.sendMessage(g.id, { text: pesan }))
        return m.reply(`*▢ JPM UPDATE SELESAI*\n• Berhasil : ${ok} grup\n• Gagal : ${fail} grup`)
    }

    if (key === 'ht') {
        const media = await J.getMedia(m, ['image', 'video', 'document', 'audio'])
        const caption = text || media?.caption || m.quoted?.text || ''
        if (!caption && !media) return usage('pesan  (atau kirim/reply foto, video, dokumen, audio)')
        const list = await J.groups(conn)
        const tipe = media ? media.kind.toUpperCase() + (caption ? ' + Teks' : '') : 'Teks (HideTag)'
        return run(m, 'JPM HIDETAG', list, cfg.delayJpmTag, g => {
            const { mentions } = J.tagList(g)
            return conn.sendMessage(g.id, media ? J.mediaContent(media, caption, mentions) : { text: caption, mentions })
        }, { tipe })
    }

    if (key === 'basic') {
        const media = await J.getMedia(m)
        const pesan = text || m.quoted?.text || ''
        if (!pesan && !media) return usage('pesan broadcast  (atau reply foto/video + caption)')
        const list = await J.groups(conn)
        if (!list.length) return m.reply('❌ Tidak ada grup yang bisa dituju.')
        global.__jpmBasicRunning = true
        global.__jpmBasicStop = false
        try {
            return await run(m, 'JPM BASIC', list, cfg.delayJpm, g =>
                conn.sendMessage(g.id, media ? J.mediaContent(media, pesan) : { text: pesan }),
                { tipe: media ? 'Media + Teks' : 'Teks', isStopped: () => global.__jpmBasicStop })
        } finally {
            global.__jpmBasicRunning = false
            global.__jpmBasicStop = false
        }
    }

    const media = await J.getMedia(m)
    if (!text && !media) return usage(key === 'ch' ? 'pesan ke semua channel  (atau reply foto/video + caption)' : 'pesan broadcast  (atau reply foto/video + caption)')
    const tipe = media ? 'Media + Teks' : 'Teks'

    if (key === 'ch') {
        const channels = await fetchChannels(conn)
        if (!channels.length) return m.reply('❌ Tidak ada channel yang ditemukan / bot belum mengikuti channel apa pun.')
        return run(m, 'JPM CHANNEL', channels, cfg.delayJpm, ch =>
            conn.sendMessage(ch.id, media ? J.mediaContent(media, text) : { text }), { unit: 'channel', tipe })
    }

    const list = await J.groups(conn)
    if (key === 'tag') {
        return run(m, 'JPM TAG', list, cfg.delayJpmTag, g => {
            const tag = J.tagList(g)
            const caption = `${text}\n${tag.text}`
            return conn.sendMessage(g.id, media ? J.mediaContent(media, caption, tag.mentions) : { text: caption, mentions: tag.mentions })
        }, { tipe })
    }

    return run(m, 'JPM', list, cfg.delayJpm, g =>
        conn.sendMessage(g.id, media ? J.mediaContent(media, text) : { text }), { tipe })
}

handler.help = ['jpm', 'jpmtag', 'jpmht', 'jpmbasic', 'jpmupdate', 'jpmch']
handler.tags = ['jpm']
handler.command = Object.keys(MAP)
handler.owner = true

export default handler
