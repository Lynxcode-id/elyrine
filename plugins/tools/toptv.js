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

import { toCircleVideo, sendPtv } from '../../lib/ptv.js'

const CHANNEL_JID = '120363400612665352@newsletter'
const CHANNEL_URL = 'https://whatsapp.com/channel/0029VbAnuii6GcGCu73oep1i'

let handler = async (m, { conn, command, usedPrefix }) => {
  const media = m.quoted?.mediaMessage?.videoMessage ? m.quoted : (m.mediaMessage?.videoMessage ? m : null)
  if (!media) {
    throw `⚠️ *CARA PAKAI*\n\n` +
      `Reply atau kirim video lalu ketik:\n` +
      `*${usedPrefix}toptv* (kirim PTV di chat)\n` +
      `*${usedPrefix}toptvch* (upload PTV ke Channel)`
  }

  const isChannel = command.toLowerCase() === 'toptvch'
  await m.react('⏳').catch(() => { })
  await m.reply('🕕 Sedang membuat PTV...')

  try {
    const raw = await media.download()
    if (!Buffer.isBuffer(raw) || !raw.length) throw new Error('video kosong')
    const circle = await toCircleVideo(raw)

    await sendPtv(conn, isChannel ? CHANNEL_JID : m.chat, circle, isChannel ? {} : { quoted: m })

    if (isChannel) await m.reply(`✅ *Sukses mengunggah PTV ke Channel!*\n🔗 *Cek disini:* ${CHANNEL_URL}`)
    await m.react('✅').catch(() => { })
  } catch (e) {
    console.error('[TOPTV]', e)
    await m.react('❌').catch(() => { })
    throw `❌ Gagal: ${e.message}`
  }
}

handler.help = ['toptv', 'toptvch']
handler.tags = ['tools']
handler.command = /^(toptv|toptvch)$/i
handler.limit = true
handler.admin = true

export default handler
