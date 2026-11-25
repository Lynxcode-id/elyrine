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

import { prepareWAMessageMedia, generateWAMessageFromContent } from 'elyrine-baileys'

const sessions = new Map()
const SESSION_TTL = 5 * 60 * 1000
const b = '```'

function cleanupSessions() {
    const now = Date.now()
    for (const [key, val] of sessions) {
        if (now - val.timestamp > SESSION_TTL) sessions.delete(key)
    }
}

async function react(conn, m, emoji) {
    try {
        await conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } })
    } catch (e) { }
}

const kindOf = x => {
    if (typeof x?.download !== 'function') return null
    const mime = x.mimetype || x.msg?.mimetype || ''
    if (x.mtype === 'imageMessage' || /^image\//i.test(mime)) return 'imageMessage'
    if (x.mtype === 'videoMessage' || /^video\//i.test(mime)) return 'videoMessage'
    return null
}

function pickMedia(m) {
    const own = kindOf(m)
    if (own) return { type: own, download: m.download.bind(m) }
    const q = kindOf(m.quoted)
    if (q) return { type: q, download: m.quoted.download.bind(m.quoted) }
    return null
}

let handler = async (m, { conn, usedPrefix, command }) => {
    cleanupSessions()

    const p = (usedPrefix || '.') + command
    const sender = m.sender
    const session = sessions.get(sender)
    const target = pickMedia(m)

    if (!target) {
        if (session) {
            const sisa = Math.ceil((SESSION_TTL - (Date.now() - session.timestamp)) / 60000)
            return m.reply(
                `✅ *Step 1 selesai* — Gambar sudah disimpan.\n\n` +
                `Sekarang kirim/reply *video* dengan caption *${p}*\n` +
                `_(sesi kadaluarsa dalam ${sisa} menit)_`
            )
        }
        return m.reply(
            `     ꥟   *ᴇxᴀᴍᴘʟᴇ  •  ᴜsᴇ*\n\n` +
            `${b}sᴇɴᴅ ᴏʀ ʀᴇᴘʟʏ ɪᴍᴀɢᴇ ᴛʜᴇɴ ᴠɪᴅᴇᴏ${b}\n` +
            `     ▸   *ᴜsᴀɢᴇ: ${p}*\n` +
            `     ▸   *sᴛᴇᴘ 1: sᴇɴᴅ/ʀᴇᴘʟʏ ɪᴍᴀɢᴇ ᴡɪᴛʜ ${p}*\n` +
            `     ▸   *sᴛᴇᴘ 2: sᴇɴᴅ/ʀᴇᴘʟʏ ᴠɪᴅᴇᴏ ᴡɪᴛʜ ${p}*\n` +
            `     ▸   *ғᴜɴᴄᴛɪᴏɴ: ᴄᴏᴍʙɪɴᴇ ɪᴍᴀɢᴇ ᴀɴᴅ ᴠɪᴅᴇᴏ ɪɴᴛᴏ ᴀ ʟɪᴠᴇ ᴘʜᴏᴛᴏ*\n` +
            `     ▸   *ᴜsᴇᴅ ʙʏ: ᴀʟʟ ᴜsᴇʀ*`
        )
    }

    if (target.type === 'imageMessage') {
        await react(conn, m, '⏳')
        try {
            const image = await target.download()
            if (!image?.length) throw new Error('Gambar kosong.')
            sessions.set(sender, { image, timestamp: Date.now() })
            await react(conn, m, '✅')
            return m.reply(
                `✅ *Gambar disimpan!*\n\n` +
                `Sekarang kirim atau reply *video* dengan caption *${p}*\n` +
                `_(sesi otomatis hapus dalam 5 menit)_`
            )
        } catch (e) {
            console.error('[PHOTOLIVE2]', e)
            await react(conn, m, '❌')
            return m.reply(`❌ Gagal mengunduh gambar: ${e.message}`)
        }
    }

    if (target.type === 'videoMessage') {
        if (!session) {
            return m.reply(
                `⚠️ Belum ada gambar tersimpan.\n` +
                `Kirim dulu gambar dengan *${p}*, baru video.`
            )
        }

        await react(conn, m, '⏳')
        sessions.delete(sender)

        try {
            const videoBuffer = await target.download()
            if (!videoBuffer?.length) throw new Error('Gagal mengunduh video.')

            const [imageMedia, videoMedia] = await Promise.all([
                prepareWAMessageMedia({ image: session.image }, { upload: conn.waUploadToServer }),
                prepareWAMessageMedia({ video: videoBuffer }, { upload: conn.waUploadToServer })
            ])

            const imgMsg = generateWAMessageFromContent(
                m.chat,
                {
                    imageMessage: {
                        ...imageMedia.imageMessage,
                        contextInfo: {
                            pairedMediaType: 5,
                            statusSourceType: 0
                        }
                    }
                },
                { userJid: conn.user.id }
            )

            await conn.relayMessage(m.chat, imgMsg.message, { messageId: imgMsg.key.id })

            await conn.relayMessage(
                m.chat,
                {
                    videoMessage: {
                        ...videoMedia.videoMessage,
                        contextInfo: {
                            pairedMediaType: 6,
                            statusSourceType: 0
                        }
                    },
                    messageContextInfo: {
                        messageAssociation: {
                            associationType: 12,
                            parentMessageKey: imgMsg.key
                        }
                    }
                },
                {}
            )

            return react(conn, m, '✅')
        } catch (e) {
            console.error('[PHOTOLIVE2]', e)
            await react(conn, m, '❌')
            return m.reply(`❌ Gagal membuat Live Photo2: ${e.message}`)
        }
    }
}

handler.help = ['photolive2']
handler.command = ['photolive2']
handler.tags = ['tools']
handler.limit = true
handler.register = true

export default handler
