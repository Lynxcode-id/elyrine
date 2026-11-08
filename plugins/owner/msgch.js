/*
  ERINE-AI • ELYRINE
  WhatsApp Bot Multi-Device · Node.js ESM

  Developer   Arman Maulana (Lynx decode)
  Versi       1.0.0
  Lisensi     ELYRINE Source-Available Non-Commercial v1.0
  Copyright   © 2026 Arman Maulana

  Didirikan di atas Elyra Labs & ekosistemnya.
  Komunitas   General District (induk) · INF Project · Elyra Labs
  Engine      elyra-baileys, fork Baileys yang dikustom
              sesuai kebutuhan bot ini.

  Dilarang menjual, menyewakan, atau merebrand tanpa
  izin tertulis dari developer. Jangan hapus kredit ini.
*/

import { fileTypeFromBuffer } from 'file-type'
import { ffmpeg, isOggOpus, prepareAudioMessage, toVideo } from '../../lib/converter.js'
import { listSaluran, getOwnerSaluran, labelSaluran } from '../../lib/saluran.js'

const VN_BITRATE = '64k'
const PTV_SIZE = 640
const PTV_MAX_SECONDS = 60

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function toVoiceOpus(buf) {
    if (isOggOpus(buf)) return buf
    const ft = await fileTypeFromBuffer(buf).catch(() => null)
    const out = await ffmpeg(buf, ['-vn', '-map_metadata', '-1', '-c:a', 'libopus', '-b:a', VN_BITRATE, '-vbr', 'on', '-ac', '1', '-ar', '48000', '-application', 'audio'], ft?.ext || 'bin', 'ogg')
    await out.delete()
    return out.data
}

async function toCircleVideo(buf) {
    const ft = await fileTypeFromBuffer(buf).catch(() => null)
    const vf = `crop='min(iw,ih)':'min(iw,ih)',scale=${PTV_SIZE}:${PTV_SIZE},format=yuv420p`
    const out = await ffmpeg(buf, ['-t', String(PTV_MAX_SECONDS), '-vf', vf, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart'], ft?.ext || 'bin', 'mp4')
    await out.delete()
    return out.data
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let body = text || '', onlyOwner = false, forcePtv = false
    for (; ;) {
        const f = body.match(/^\s*-(o|ptv)(?=\s|$)/i)
        if (!f) break
        if (f[1].toLowerCase() === 'o') onlyOwner = true; else forcePtv = true
        body = body.slice(f[0].length)
    }
    body = body.trim()

    const usage = [
        `*Kirim ke saluran*`,
        `• ${usedPrefix}${command} halo  → kirim teks`,
        `• reply VN / audio  → otomatis jadi VN opus`,
        `• reply foto / video / video bulat (ptv)`,
        `• reply video + ${usedPrefix}${command} -ptv  → kirim sebagai video bulat`,
        `• ${usedPrefix}${command} -o ...  → hanya ke saluran OWNER (default: semua saluran)`,
        `Teks setelah perintah jadi caption foto/video.`,
    ].join('\n')

    const all = listSaluran()
    if (!all.length) return m.reply(`❌ Belum ada saluran. Tambah dulu:\n${usedPrefix}addsaluran idch|owner`)
    let targets = all
    if (onlyOwner) {
        const o = getOwnerSaluran()
        if (!o) return m.reply(`❌ Belum ada saluran OWNER. Set dulu:\n${usedPrefix}addsaluran idch|owner`)
        targets = [o]
    }

    const src = m.quoted?.mediaMessage ? m.quoted : (m.mediaMessage ? m : null)
    const fromQuoted = src && src === m.quoted
    let content, jenis

    if (!src) {
        const t = body || (m.quoted?.text ? String(m.quoted.text).trim() : '')
        if (!t) return m.reply(usage)
        content = { text: t }
        jenis = 'teks'
    } else {
        const mt = src.mtype
        if (mt === 'stickerMessage' || mt === 'documentMessage') return m.reply('❌ Stiker / dokumen belum didukung. Pakai teks, VN/audio, foto, video, atau video bulat.')
        const mime = String(src.mimetype || src.msg?.mimetype || '')
        const kind = mt === 'ptvMessage' ? 'ptv'
            : mt === 'imageMessage' ? 'image'
                : mt === 'videoMessage' ? (forcePtv ? 'ptv' : 'video')
                    : mt === 'audioMessage' ? 'audio'
                        : /^image\//.test(mime) ? 'image'
                            : /^video\//.test(mime) ? (forcePtv ? 'ptv' : 'video')
                                : /^audio\//.test(mime) ? 'audio' : null
        if (!kind) return m.reply('❌ Jenis media tidak dikenali.')

        let media
        try { media = await src.download() } catch (e) { return m.reply(`❌ Gagal mengunduh media: ${e.message}`) }
        if (!Buffer.isBuffer(media) || !media.length) return m.reply('❌ Gagal mengunduh media.')

        const caption = body || (fromQuoted ? String(src.caption || '').trim() : '')

        try {
            if (kind === 'audio') {
                const opus = await toVoiceOpus(media)
                const msg = await prepareAudioMessage({ audio: opus, ptt: true })
                content = { ...msg, ptt: true }
                jenis = 'VN'
            } else if (kind === 'image') {
                content = { image: media, ...(caption && { caption }) }
                jenis = 'foto'
            } else if (kind === 'video') {
                const ft = await fileTypeFromBuffer(media).catch(() => null)
                let vid = media
                if (ft?.mime !== 'video/mp4') { const out = await toVideo(media, ft?.ext); vid = out.data; await out.delete() }
                content = { video: vid, mimetype: 'video/mp4', ...(caption && { caption }) }
                jenis = 'video'
            } else {
                content = { video: await toCircleVideo(media), mimetype: 'video/mp4', ptv: true }
                jenis = 'video bulat (ptv)'
            }
        } catch (e) {
            return m.reply(`❌ Gagal memproses ${kind}: ${e.message}`)
        }
    }

    const ok = [], fail = []
    for (let i = 0; i < targets.length; i++) {
        const ch = targets[i]
        try {
            try {
                await conn.sendMessage(ch.id, content)
            } catch (e) {
                if (!content.ptv) throw e
                const { ptv, ...biasa } = content
                await conn.sendMessage(ch.id, biasa)
                ok.push(`${labelSaluran(ch)} (ptv ditolak, dikirim sebagai video biasa)`)
                continue
            }
            ok.push(labelSaluran(ch))
        } catch (e) {
            fail.push(`${labelSaluran(ch)}: ${e?.message || e}`)
        }
        if (i < targets.length - 1) await sleep(800)
    }

    m.reply([
        ok.length && `✅ ${jenis} terkirim ke ${ok.length} saluran:\n${ok.map(v => '• ' + v).join('\n')}`,
        fail.length && `❌ Gagal ${fail.length} saluran:\n${fail.map(v => '• ' + v).join('\n')}`,
    ].filter(Boolean).join('\n\n'))
}

handler.help = ['msgch <teks>', 'msgch (reply VN/foto/video/ptv)']
handler.tags = ['owner']
handler.command = /^(msgch)$/i
handler.owner = true

export default handler
