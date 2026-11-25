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

import { fileTypeFromBuffer } from 'file-type'

import {
    listSaluran,
    getOwnerSaluran,
    labelSaluran,
    parseChannelInput
} from '../../lib/saluran.js'

import {
    ensureSwch,
    canPostChannelStatus,
    postChannelStatus,
    getNewsletterStatusReceipt
} from '../../lib/swch.js'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const stringify = value => {
    try {
        return JSON.stringify(value ?? {})
    } catch {
        return '[unserializable]'
    }
}

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    try {
        ensureSwch(conn)
    } catch (e) {
        return m.reply(`❌ ${e.message}`)
    }

    let body = text || ''

    let onlyOwner = false
    let target = null

    for (;;) {
        const match = body.match(/^\s*-(o|id)(?:\s+(\S+))?(?=\s|$)/i)

        if (!match) break

        if (match[1].toLowerCase() === 'o') {
            onlyOwner = true
        } else {
            target = parseChannelInput(match[2])

            if (!target?.jid) {
                return m.reply(
                    '❌ ID channel tidak valid.\n\n' +
                    'Contoh: 120363xxxxxxxxxx@newsletter'
                )
            }
        }

        body = body.slice(match[0].length)
    }

    body = body.trim()

    const usage = [
        '*Status Channel (SWCH)*',
        '',
        `• ${usedPrefix}${command} halo`,
        '  Mengirim status teks.',
        '',
        '• Reply foto / video / audio',
        '  Mengirim status media.',
        '',
        `• ${usedPrefix}${command} -o halo`,
        '  Hanya channel OWNER.',
        '',
        `• ${usedPrefix}${command} -id 120363xxx@newsletter halo`,
        '  Mengirim ke channel tertentu.',
        '',
        'Default: semua channel dalam daftar saluran.'
    ].join('\n')

    let targets

    if (target?.jid) {
        targets = [{ id: target.jid }]
    } else if (onlyOwner) {
        const owner = getOwnerSaluran()

        if (!owner) {
            return m.reply(
                `❌ Belum ada saluran OWNER.\n` +
                `Tambahkan menggunakan:\n` +
                `${usedPrefix}addsaluran idch|owner`
            )
        }

        targets = [owner]
    } else {
        targets = listSaluran()

        if (!targets.length) {
            return m.reply(
                `❌ Belum ada saluran.\n` +
                `Tambahkan menggunakan:\n` +
                `${usedPrefix}addsaluran idch|owner`
            )
        }
    }

    const src = m.quoted?.mediaMessage
        ? m.quoted
        : m.mediaMessage
            ? m
            : null

    const fromQuoted = Boolean(src && src === m.quoted)

    let content
    let jenis

    if (!src) {
        const message = body || (
            m.quoted?.text
                ? String(m.quoted.text).trim()
                : ''
        )

        if (!message) return m.reply(usage)

        content = { text: message }
        jenis = 'teks'

    } else {
        const mt = src.mtype

        if (
            mt === 'stickerMessage' ||
            mt === 'documentMessage'
        ) {
            return m.reply(
                '❌ Stiker dan dokumen tidak didukung.\n' +
                'Gunakan teks, foto, video, atau audio.'
            )
        }

        let media

        try {
            media = await src.download()
        } catch (e) {
            return m.reply(
                `❌ Gagal mengunduh media: ${e.message}`
            )
        }

        if (!Buffer.isBuffer(media) || !media.length) {
            return m.reply('❌ Media tidak valid atau kosong.')
        }

        const detected = await fileTypeFromBuffer(media).catch(() => null)

        const mime = String(
            src.mimetype ||
            src.msg?.mimetype ||
            detected?.mime ||
            ''
        )

        const caption = body || (
            fromQuoted
                ? String(src.caption || '').trim()
                : ''
        )

        if (
            mt === 'imageMessage' ||
            /^image\//i.test(mime)
        ) {
            content = {
                image: media,
                ...(caption && { caption })
            }

            jenis = 'foto'

        } else if (
            mt === 'videoMessage' ||
            /^video\//i.test(mime)
        ) {
            content = {
                video: media,
                mimetype: 'video/mp4',
                ...(caption && { caption })
            }

            jenis = 'video'

        } else if (
            mt === 'audioMessage' ||
            /^audio\//i.test(mime)
        ) {
            content = {
                audio: media,
                mimetype: 'audio/mp4'
            }

            jenis = 'audio'

        } else {
            return m.reply(
                `❌ Format media tidak dikenali.\nMIME: ${mime || 'unknown'}`
            )
        }
    }

    const ok = []
    const pending = []
    const fail = []

    for (let i = 0; i < targets.length; i++) {
        const ch = targets[i]

        const label = ch.name || ch.label
            ? labelSaluran(ch)
            : ch.id

        try {
            const capability = await canPostChannelStatus(
                conn,
                ch.id
            )

            if (!capability.canPost) {
                fail.push(
                    `${label}: tidak memiliki CHANNEL_STATUS_PRODUCER.\n` +
                    `  capabilities=[${(capability.capabilities || []).join(', ')}]`
                )

                continue
            }

            const response = await postChannelStatus(
                conn,
                ch.id,
                content,
                {
                    serverIdTimeoutMs: 20000
                }
            )

            const receipt = getNewsletterStatusReceipt(response)

            if (receipt.serverId) {
                ok.push(
                    `${label} (ID: ${receipt.serverId})`
                )
            } else if (receipt.echoReceived) {
                ok.push(
                    `${label} (echo diterima, ID tidak terbaca)`
                )
            } else if (receipt.ackReceived) {
                console.warn('[SWCH] ACK without server ID', {
                    channel: ch.id,
                    ack: receipt.ackAttrs,
                    echo: receipt.echoAttrs
                })

                pending.push(
                    `${label}: ACK diterima, tetapi belum ada konfirmasi penerbitan.\n` +
                    `  ack=${stringify(receipt.ackAttrs)}\n` +
                    `  echo=${stringify(receipt.echoAttrs)}`
                )
            } else {
                fail.push(
                    `${label}: server tidak memberikan ACK maupun echo.`
                )
            }

        } catch (e) {
            const message = String(e?.message || e)

            fail.push(
                `${label}: ${
                    /401|403/.test(message)
                        ? 'ditolak server (401/403), periksa hak admin channel.'
                        : message
                }`
            )
        }

        if (i < targets.length - 1) {
            await sleep(1000)
        }
    }

    const report = []

    if (ok.length) {
        report.push(
            `✅ STATUS ${jenis.toUpperCase()} TERKIRIM (${ok.length})\n` +
            ok.map(item => `• ${item}`).join('\n')
        )
    }

    if (pending.length) {
        report.push(
            `🟡 MENUNGGU VERIFIKASI (${pending.length})\n` +
            pending.map(item => `• ${item}`).join('\n')
        )
    }

    if (fail.length) {
        report.push(
            `❌ GAGAL (${fail.length})\n` +
            fail.map(item => `• ${item}`).join('\n')
        )
    }

    return m.reply(
        report.join('\n\n') || 'Tidak ada hasil pengiriman.'
    )
}

handler.help = [
    'swch <teks>',
    'swch (reply foto/video/audio)'
]

handler.tags = ['owner']

handler.command = /^(swch|statusch)$/i

handler.owner = true

export default handler
