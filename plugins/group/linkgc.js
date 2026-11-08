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

import { generateWAMessageContent, generateWAMessageFromContent, proto } from 'elyra-baileys'
import { getCustomThumb } from '../../lib/customthumb.js'

let handler = async (m, { conn }) => {
    const code = await conn.groupInviteCode(m.chat)
    if (!code) throw 'Gagal mengambil link grup.'
    const link = 'https://chat.whatsapp.com/' + code

    const meta = await conn.groupMetadata(m.chat).catch(() => null)
    const subject = (meta && meta.subject) || 'Grup ini'
    const total = meta && meta.participants ? meta.participants.length : null

    let img = null
    try {
        const url = await conn.profilePictureUrl(m.chat, 'image')
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
        if (res.ok) img = Buffer.from(await res.arrayBuffer())
    } catch (_) { img = null }
    if (!img) {
        const t = getCustomThumb()
        if (t) img = t.buffer
    }

    const body =
        `*${subject}*\n` +
        (total ? `👥 ${total} anggota\n` : '') +
        `\n🔗 ${link}\n\n` +
        `Tekan *Salin Link* untuk menyalin, atau *Buka Grup* untuk bergabung.`

    try {
        const Msg = proto.Message.InteractiveMessage
        let header
        if (img) {
            const { imageMessage } = await generateWAMessageContent({ image: img }, { upload: conn.waUploadToServer })
            header = Msg.Header.create({ imageMessage, hasMediaAttachment: true })
        } else {
            header = Msg.Header.create({ title: subject, hasMediaAttachment: false })
        }

        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage: Msg.create({
                        header,
                        body: Msg.Body.create({ text: body }),
                        footer: Msg.Footer.create({ text: global.namebot || 'ERINE-AI' }),
                        nativeFlowMessage: Msg.NativeFlowMessage.create({
                            buttons: [
                                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Salin Link', id: 'copy_linkgc', copy_code: link }) },
                                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🚪 Buka Grup', url: link, merchant_url: link }) }
                            ]
                        })
                    })
                }
            }
        }, { quoted: m })
        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
    } catch (err) {
        console.error('[LINKGC] kartu gagal, kirim teks biasa:', err && err.message ? err.message : err)
        await m.reply(link)
    }
}

handler.help = ['linkgc']
handler.tags = ['group']
handler.command = /^linkgc$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
