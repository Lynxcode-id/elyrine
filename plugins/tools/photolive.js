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

import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'
import { prepareWAMessageMedia, generateWAMessageFromContent } from 'elyrine-baileys'

const b = '```'

async function react(conn, m, emoji) {
    try {
        await conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } })
    } catch (e) { }
}

const isVideo = x => typeof x?.download === 'function' && (x.mtype === 'videoMessage' || /^video\//i.test(x.mimetype || x.msg?.mimetype || ''))

function pickVideo(m) {
    if (isVideo(m)) return m
    if (isVideo(m.quoted)) return m.quoted
    return null
}

async function firstFrame(videoBuffer) {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'photolive-'))
    const input = path.join(dir, 'in.mp4')
    const output = path.join(dir, 'out.jpg')
    try {
        await fs.promises.writeFile(input, videoBuffer)
        await new Promise((resolve, reject) => {
            execFile('ffmpeg', ['-y', '-i', input, '-frames:v', '1', '-q:v', '2', output], { timeout: 60000 }, err => err ? reject(err) : resolve())
        })
        const img = await fs.promises.readFile(output)
        if (!img.length) throw new Error('Gagal mengambil frame awal video.')
        return img
    } finally {
        fs.promises.rm(dir, { recursive: true, force: true }).catch(() => { })
    }
}

let handler = async (m, { conn, usedPrefix, command }) => {
    const p = (usedPrefix || '.') + command
    const target = pickVideo(m)

    if (!target) {
        return m.reply(
            `     ꥟   *ᴇxᴀᴍᴘʟᴇ  •  ᴜsᴇ*\n\n` +
            `${b}sᴇɴᴅ ᴏʀ ʀᴇᴘʟʏ ᴠɪᴅᴇᴏ${b}\n` +
            `     ▸   *ᴜsᴀɢᴇ: ${p}*\n` +
            `     ▸   *sᴇɴᴅ/ʀᴇᴘʟʏ ᴠɪᴅᴇᴏ ᴡɪᴛʜ ${p}*\n` +
            `     ▸   *ғᴜɴᴄᴛɪᴏɴ: ᴠɪᴅᴇᴏ ᴅɪᴊᴀᴅɪᴋᴀɴ ʟɪᴠᴇ ᴘʜᴏᴛᴏ, ғᴏᴛᴏ ᴅᴀʀɪ ғʀᴀᴍᴇ ᴀᴡᴀʟ*\n` +
            `     ▸   *ᴜsᴇᴅ ʙʏ: ᴀʟʟ ᴜsᴇʀ*`
        )
    }

    await react(conn, m, '⏳')
    try {
        const videoBuffer = await target.download()
        if (!videoBuffer?.length) throw new Error('Gagal mengunduh video.')

        const image = await firstFrame(videoBuffer)

        const [imageMedia, videoMedia] = await Promise.all([
            prepareWAMessageMedia({ image }, { upload: conn.waUploadToServer }),
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
        console.error('[PHOTOLIVE]', e)
        await react(conn, m, '❌')
        return m.reply(`❌ Gagal membuat Live Photo: ${e.message}`)
    }
}

handler.help = ['photolive']
handler.command = ['photolive']
handler.tags = ['tools']
handler.limit = true
handler.register = true

export default handler
