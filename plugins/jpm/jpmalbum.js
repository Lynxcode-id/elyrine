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
import { sendAlbumMessage } from '../../lib/album.js'

const MAX = 10
const buf = () => (global.__jpmAlbum ||= [])

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const [first = '', ...rest] = String(text || '').trim().split(/\s+/)
    const act = first.toLowerCase()

    if (act === 'add') {
        const media = await J.getMedia(m)
        if (!media) return m.reply(`❌ Reply foto/video dengan *${usedPrefix}${command} add*.`)
        if (buf().length >= MAX) return m.reply(`❌ Album penuh (maks ${MAX} media).`)
        buf().push(media)
        return m.reply(`✅ Media ditambahkan. Antrean album: ${buf().length}/${MAX}\nKirim dengan *${usedPrefix}${command} <caption>*`)
    }
    if (act === 'reset') { global.__jpmAlbum = []; return m.reply('✅ Antrean album dikosongkan.') }
    if (act === 'list') return m.reply(`*▢ ANTREAN ALBUM*\n• Media : ${buf().length}/${MAX}`)

    const list = [...buf()]
    const quoted = await J.getMedia(m)
    if (quoted && !list.length) list.push(quoted)
    if (!list.length) return m.reply(`*▢ JPM ALBUM*\n\n1. Reply foto/video lalu *${usedPrefix}${command} add* (ulangi per media)\n2. Kirim: *${usedPrefix}${command} <caption>*\n\nAtau reply satu media langsung dengan *${usedPrefix}${command} <caption>*.`)
    if (global.__jpmRunning) return m.reply(`❌ JPM sedang berjalan. Ketik *${usedPrefix}stopjpm* untuk menghentikan.`)

    const caption = [first, ...rest].join(' ').trim()
    const groups = await J.groups(conn)
    if (!groups.length) return m.reply('❌ Tidak ada grup yang bisa dituju.')
    const delay = J.cfg().delayJpm
    await m.reply(`*▢ JPM ALBUM*\n• Media : ${list.length}\n• Target : ${groups.length} grup\n• Delay : ${delay}ms\n\nHentikan dengan *${usedPrefix}stopjpm*`)

    const items = list.map((v, i) => ({ [v.kind]: v.buffer, caption: i === 0 ? caption : '', mimetype: v.mime || (v.kind === 'video' ? 'video/mp4' : 'image/jpeg') }))
    const { ok, fail } = await J.loop(groups, delay, g => sendAlbumMessage(conn, g.id, items))
    global.__jpmAlbum = []
    return m.reply(`*▢ JPM ALBUM SELESAI*\n• Berhasil : ${ok} grup\n• Gagal : ${fail} grup`)
}

handler.help = ['jpmalbum']
handler.tags = ['jpm']
handler.command = ['jpmalbum', 'jpmab', 'jaseralbum']
handler.owner = true

export default handler
