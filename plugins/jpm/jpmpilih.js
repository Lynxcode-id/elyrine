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

const TTL = 10 * 60 * 1000
const sessions = () => (global.__jpmPilih ||= {})

let handler = async (m, { conn }) => {
    const list = await J.groups(conn)
    if (!list.length) return m.reply('❌ Bot tidak berada di grup manapun.')
    sessions()[m.sender] = { step: 'nomor', chat: m.chat, groups: list.map(g => ({ id: g.id, name: g.subject || g.id })), at: Date.now() }
    const rows = list.map((g, i) => `*${i + 1}.* ${g.subject || g.id}`).join('\n')
    return m.reply(`*▢ JPM PILIH GRUP*\n• Total : ${list.length} grup\n• Balas nomor grup, pisah titik/koma. Contoh: *1.2.3* atau *1,2,3*\n• Ketik *batal* untuk membatalkan\n\n${rows}`)
}

handler.before = async function (m, { conn, isOwner }) {
    if (!isOwner || m.fromMe) return false
    const st = sessions()[m.sender]
    if (!st || st.chat !== m.chat) return false
    if (Date.now() - st.at > TTL) { delete sessions()[m.sender]; return false }

    const input = String(m.text || '').trim()
    if (/^(batal|cancel)$/i.test(input)) {
        delete sessions()[m.sender]
        await m.reply('✅ JPM pilih dibatalkan.')
        return true
    }

    if (st.step === 'nomor') {
        if (!/^[\d\s.,]+$/.test(input)) return false
        const picked = [...new Set(input.split(/[.,\s]+/).map(v => parseInt(v) - 1))]
            .filter(i => i >= 0 && i < st.groups.length)
            .map(i => st.groups[i])
        if (!picked.length) { await m.reply('❌ Nomor tidak valid. Coba lagi.'); return true }
        sessions()[m.sender] = { ...st, step: 'pesan', picked, at: Date.now() }
        const names = picked.map((g, i) => `*${i + 1}.* ${g.name}`).join('\n')
        await m.reply(`*▢ GRUP DIPILIH*\n• Total : ${picked.length} grup\n\n${names}\n\n📝 Sekarang kirim pesan yang ingin di-broadcast (teks, atau foto/video dengan caption):`)
        return true
    }

    if (st.step === 'pesan') {
        if (/^[.!#/]/.test(input)) return false
        const media = await J.getMedia(m)
        if (!input && !media) return false
        delete sessions()[m.sender]
        const delay = J.cfg().delayJpm
        await m.reply(`*▢ JPM DIMULAI*\n• Target : ${st.picked.length} grup\n• Delay : ${delay}ms`)
        const { ok, fail } = await J.loop(st.picked, delay, g =>
            conn.sendMessage(g.id, media ? J.mediaContent(media, input) : { text: input }))
        await m.reply(`*▢ JPM SELESAI*\n• Berhasil : ${ok} grup\n• Gagal : ${fail} grup`)
        return true
    }
    return false
}

handler.help = ['jpmpilih']
handler.tags = ['jpm']
handler.command = ['jpmpilih']
handler.owner = true

export default handler
