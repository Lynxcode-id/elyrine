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

let handler = async (m, { conn }) => {
    if (!m.isGroup || !String(m.chat || '').endsWith('@g.us')) {
        return m.reply('Perintah ini hanya bisa digunakan di dalam grup WhatsApp.')
    }

    let metadata
    try {
        metadata = await conn.groupMetadata(m.chat)
    } catch (error) {
        console.error('[CEKIDGC] gagal mengambil metadata:', error?.message || error)
        return m.reply('Gagal mengambil informasi grup. Coba lagi beberapa saat.')
    }

    const groupId = String(metadata?.id || m.chat)
    const groupName = metadata?.subject || 'Grup WhatsApp'
    const total = Array.isArray(metadata?.participants)
        ? metadata.participants.length
        : 0

    const body = [
        '*GROUP IDENTIFIER*',
        '',
        `Nama Grup : ${groupName}`,
        `ID Grup : \`${groupId}\``,
        `Anggota : ${total} orang`,
        '',
        'Tekan tombol di bawah untuk menyalin ID grup.'
    ].join('\n')

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
                            title: 'GROUP INFORMATION',
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
                                        display_text: 'Salin ID Grup',
                                        id: 'copy_group_id',
                                        copy_code: groupId
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
        console.error('[CEKIDGC] native flow gagal:', error?.stack || error?.message || error)
        await m.reply(`${body}\n\nID Grup: ${groupId}`)
    }
}

handler.help = ['cekidgc']
handler.tags = ['group']
handler.command = /^cekidgc$/i
handler.group = true

export default handler
