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

import { generateWAMessageFromContent, proto } from 'elyra-baileys'
import { parseChannelInput } from '../../lib/saluran.js'

const isNewsletterJid = value =>
    /^\d{10,30}@newsletter$/.test(String(value || ''))

function findNewsletterJid(sources) {
    const queue = Array.isArray(sources) ? sources.slice() : [sources]
    const seen = new Set()

    while (queue.length) {
        const value = queue.pop()
        if (!value) continue

        if (typeof value === 'string') {
            if (isNewsletterJid(value.trim())) return value.trim()
            continue
        }

        if (typeof value !== 'object') continue
        if (seen.has(value)) continue
        seen.add(value)

        if (Array.isArray(value)) {
            for (const item of value) queue.push(item)
            continue
        }

        for (const [key, item] of Object.entries(value)) {
            if (
                /newsletter(jid|id)?/i.test(key) &&
                typeof item === 'string' &&
                isNewsletterJid(item.trim())
            ) {
                return item.trim()
            }

            queue.push(item)
        }
    }

    return null
}

let handler = async (m, { conn, text }) => {
    let channelJid = null

    if (isNewsletterJid(m.chat)) {
        channelJid = m.chat
    }

    if (!channelJid && isNewsletterJid(m.quoted?.chat)) {
        channelJid = m.quoted.chat
    }

    if (!channelJid) {
        channelJid = findNewsletterJid([
            m.messages,
            m.message,
            m.msg,
            m.quoted?.messages,
            m.quoted?.fakeObj?.message,
            m.quoted?.fakeObj?.key
        ])
    }

    let target = channelJid
        ? { jid: channelJid }
        : null

    if (!target) {
        const raw = String(text || m.quoted?.text || '').trim()

        const link = raw.match(
            /(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/[A-Za-z0-9_-]+/i
        )

        const jid = raw.match(/\b\d{10,30}@newsletter\b/i)

        const input = link
            ? link[0]
            : jid
                ? jid[0]
                : raw

        target = parseChannelInput(input)
    }

    if (!target) {
        return m.reply(
            '*Cek ID Channel WhatsApp*\n\n' +
            '• Reply pesan channel yang sudah diteruskan ke chat ini.\n' +
            '• Atau gunakan `.cekidch <link channel>` / `.cekidch <ID channel>`.'
        )
    }

    let metadata = null

    try {
        if (typeof conn.newsletterMetadata === 'function') {
            metadata = target.invite
                ? await conn.newsletterMetadata('invite', target.invite)
                : await conn.newsletterMetadata('jid', target.jid)
        }
    } catch (error) {
        console.error('[CEKIDCH] metadata channel:', error?.message || error)

        if (target.invite) {
            return m.reply(
                'Gagal membaca link channel. Pastikan link undangannya masih valid.'
            )
        }
    }

    const channelId = String(metadata?.id || target.jid || '')

    if (!isNewsletterJid(channelId)) {
        return m.reply(
            'ID channel tidak berhasil ditemukan. Coba kirim ID channel secara langsung.'
        )
    }

    const channelName = String(
        metadata?.name ||
        metadata?.thread_metadata?.name?.text ||
        metadata?.threadMetadata?.name?.text ||
        'WhatsApp Channel'
    )

    const subscriberCount =
        metadata?.subscribers ||
        metadata?.thread_metadata?.subscribers_count ||
        metadata?.threadMetadata?.subscribersCount ||
        ''

    const body = [
        '*CHANNEL IDENTIFIER*',
        '',
        `Nama Channel : ${channelName}`,
        `ID Channel : \`${channelId}\``,
        subscriberCount ? `Pengikut : ${subscriberCount}` : '',
        '',
        'Tekan tombol di bawah untuk menyalin ID channel.'
    ].filter(Boolean).join('\n')

    try {
        const Msg = proto.Message.InteractiveMessage

        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: Msg.create({
                        header: Msg.Header.create({
                            title: 'CHANNEL INFORMATION',
                            hasMediaAttachment: false
                        }),
                        body: Msg.Body.create({ text: body }),
                        footer: Msg.Footer.create({
                            text: global.namebot || '© ERINE-AI'
                        }),
                        nativeFlowMessage: Msg.NativeFlowMessage.create({
                            buttons: [
                                {
                                    name: 'cta_copy',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Salin ID Channel',
                                        id: 'copy_channel_id',
                                        copy_code: channelId
                                    })
                                }
                            ]
                        })
                    })
                }
            }
        }, { quoted: m })

        await conn.relayMessage(m.chat, msg.message, {
            messageId: msg.key.id
        })
    } catch (error) {
        console.error('[CEKIDCH] native flow gagal:', error?.stack || error?.message || error)
        await m.reply(`${body}\n\nID Channel: ${channelId}`)
    }
}

handler.help = ['cekidch <reply/link/id>']
handler.tags = ['info']
handler.command = /^cekidch$/i

export default handler
