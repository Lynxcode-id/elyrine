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

import { generateWAMessageFromContent, proto } from 'elyrine-baileys'
import { fetchNewsletterMeta } from '../../lib/saluran.js'

const INVISIBLE = /[\u200B-\u200F\u2060-\u2064\uFEFF]/g
const isNewsletterJid = v => /^\d{10,30}@newsletter$/.test(String(v || ''))

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const react = e => m.react?.(e)?.catch?.(() => { })
    const clean = String(text || m.quoted?.text || '').replace(INVISIBLE, '').trim()

    let jid = null
    if (isNewsletterJid(m.chat)) jid = m.chat
    if (!jid) {
        const fwd =
            m.quoted?.msg?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterJid ||
            m.quoted?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterJid ||
            m.quoted?.fakeObj?.message && JSON.stringify(m.quoted.fakeObj.message).match(/(\d{10,30}@newsletter)/)?.[1]
        if (isNewsletterJid(fwd)) jid = fwd
    }
    if (!jid) jid = clean.match(/\b(\d{10,30}@newsletter)\b/i)?.[1] || null
    const code = !jid ? clean.match(/whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/i)?.[1] : null

    if (!jid && !code) {
        return m.reply(
            `❌ Masukkan link channelnya, Bang!\nContoh: *${usedPrefix + command}* https://whatsapp.com/channel/xxxx\n\n` +
            'Atau reply pesan channel yang diforward / kirim ID `...@newsletter`.'
        )
    }

    await react('⏳')

    let res = null
    try {
        res = await fetchNewsletterMeta(conn, code ? { invite: code } : { jid })
    } catch (error) {
        console.error('[CEKIDCH] newsletterMetadata:', error?.stack || error?.message || error)
        if (code) {
            await react('❌')
            return m.reply(
                '❌ Gagal mendapatkan data channel. Pastikan link benar dan channel bersifat publik.\n\n' +
                `Detail: ${String(error?.message || error).slice(0, 200)}\n\n` +
                'Alternatif: forward satu pesan dari channel itu ke chat ini, lalu reply dengan ' + usedPrefix + command
            )
        }
    }

    const id = String(res?.id || jid || '')
    if (!isNewsletterJid(id)) {
        await react('❌')
        return m.reply('❌ ID channel tidak berhasil ditemukan.')
    }

    const name = res?.name || res?.thread_metadata?.name?.text || res?.threadMetadata?.name?.text || ''
    const subs = res?.subscribers ?? res?.thread_metadata?.subscribers_count ?? res?.threadMetadata?.subscribersCount ?? ''
    const state = res?.state || ''
    const verified = res?.verification === 'VERIFIED'

    const teks = [
        '乂  *C H A N N E L  I N F O*',
        '',
        `┌  ◦ *ID :* ${id}`,
        name && `│  ◦ *Nama :* ${name}`,
        subs !== '' && `│  ◦ *Pengikut :* ${subs}`,
        state && `│  ◦ *Status :* ${state}`,
        `└  ◦ *Verified :* ${verified ? 'Terverifikasi ✅' : 'Tidak'}`
    ].filter(Boolean).join('\n')

    if (isNewsletterJid(m.chat)) {
        await conn.sendMessage(m.chat, { text: teks })
        return react('✅')
    }

    try {
        const IM = proto.Message.InteractiveMessage
        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage: IM.create({
                        body: IM.Body.create({ text: teks }),
                        footer: IM.Footer.create({ text: global.namebot || '© ERINE-AI' }),
                        nativeFlowMessage: IM.NativeFlowMessage.create({
                            buttons: [{
                                name: 'cta_copy',
                                buttonParamsJson: JSON.stringify({ display_text: '📋 Salin ID Channel', id: 'copy_id', copy_code: id })
                            }]
                        })
                    })
                }
            }
        }, { quoted: m })
        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
    } catch (error) {
        console.error('[CEKIDCH] native flow gagal:', error?.stack || error?.message || error)
        await m.reply(teks)
    }
    await react('✅')
}

handler.help = ['cekidch <link/id/reply>']
handler.tags = ['info']
handler.command = /^(idch|cekidch)$/i

export default handler
