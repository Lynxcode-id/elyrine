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

import { downloadContentFromMessage } from 'elyrine-baileys'

const WRAP = ['viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension', 'ephemeralMessage', 'documentWithCaptionMessage', 'editedMessage']
const MEDIA = { imageMessage: 'image', videoMessage: 'video', audioMessage: 'audio' }
const cache = new Map()
const CACHE_MAX = 300

function unwrap(msg) {
    let cur = msg
    for (let i = 0; i < 6 && cur; i++) {
        const k = WRAP.find(w => cur[w]?.message)
        if (!k) break
        cur = cur[k].message
    }
    return cur
}

function mediaOf(msg) {
    const c = unwrap(msg)
    if (!c) return null
    const key = Object.keys(c).find(k => MEDIA[k])
    return key ? { type: MEDIA[key], node: c[key] } : null
}

const isViewOnce = (msg, found) => !!(msg && (msg.viewOnceMessage || msg.viewOnceMessageV2 || msg.viewOnceMessageV2Extension || found?.node?.viewOnce === true))
const hasPayload = node => !!(node?.mediaKey && (node.directPath || node.url))

async function download(node, type) {
    const stream = await downloadContentFromMessage(node, type)
    const chunks = []
    for await (const c of stream) chunks.push(c)
    return Buffer.concat(chunks)
}

let handler = async (m, { conn }) => {
    const ctx = m.msg?.contextInfo || m.quoted?.contextInfo || {}
    const stanzaId = ctx.stanzaId || m.quoted?.id
    if (!stanzaId && !m.quoted) return m.reply('Reply foto/video/audio sekali lihat yang ingin dibuka.')

    const sources = [
        cache.get(stanzaId)?.message,
        ctx.quotedMessage,
        stanzaId ? conn.loadMessage?.(stanzaId)?.message : null,
        await Promise.resolve(m.getQuotedObj?.()).then(v => v?.message).catch(() => null)
    ]

    let found = null
    for (const src of sources) {
        const f = mediaOf(src)
        if (!f) continue
        if (!found || (!hasPayload(found.node) && hasPayload(f.node))) found = f
        if (hasPayload(found.node)) break
    }
    if (!found) return m.reply('Pesan yang di-reply bukan media (foto/video/audio).')

    let buffer = null
    if (hasPayload(found.node)) buffer = await download(found.node, found.type).catch(() => null)
    if (!buffer?.length && hasPayload(found.node)) {
        try { buffer = await m.quoted.download() } catch { buffer = null }
    }
    if (!buffer?.length) {
        const platform = conn.authState?.creds?.platform || 'tidak diketahui'
        const dipakai = global.__waBrowserUsed ? global.__waBrowserUsed.join(' / ') : 'tidak diketahui'
        const info = `\n\nInfo sesi:\n♡ Browser di config : ${dipakai}\n♡ Platform tertaut   : ${platform}`
        if (!hasPayload(found.node)) {
            return m.reply('Media tidak bisa diambil: WhatsApp tidak mengirim isi media sekali lihat ke bot (mediaKey/url kosong).\n\n' +
                'Perhatikan:\n' +
                '1. Mengganti browser di config TIDAK mengubah sesi yang sudah ada. Hapus folder sesi lalu pairing ulang supaya berlaku.\n' +
                '2. Media sekali lihat yang dikirim SEBELUM pairing ulang tidak bisa dipulihkan. Minta kirim yang baru.\n' +
                '3. Tidak ada jaminan: WhatsApp bisa saja memang tidak mengirim isi media sekali lihat ke perangkat tertaut.' + info)
        }
        return m.reply('Media tidak bisa diunduh walau datanya ada (kemungkinan sudah kedaluwarsa atau koneksi bermasalah). Coba kirim ulang media sekali lihatnya.' + info)
    }

    const caption = found.node.caption || ''
    const payload = found.type === 'audio'
        ? { audio: buffer, mimetype: found.node.mimetype || 'audio/ogg; codecs=opus', ptt: !!found.node.ptt }
        : { [found.type]: buffer, caption, mimetype: found.node.mimetype }
    return conn.sendMessage(m.chat, payload, { quoted: m })
}

handler.before = async function (m) {
    try {
        const found = mediaOf(m.message)
        if (found && isViewOnce(m.message, found) && hasPayload(found.node) && m.id) {
            cache.set(m.id, { message: m.message })
            if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value)
        }
    } catch { }
    return false
}

handler.help = ['rvo']
handler.tags = ['tools']
handler.command = ['rvo', 'readviewonce', 'read', 'readvo']

export default handler
