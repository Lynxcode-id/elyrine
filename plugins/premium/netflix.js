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

const BASE = (global.APIs && global.APIs.theresav) || 'https://api.theresav.eu'

const handler = async (m, { conn, usedPrefix, command }) => {
  const apikey = global.APIKeys && global.APIKeys[BASE]
  if (!apikey) throw `API key belum diisi. Tambahkan di config.js:\nglobal.APIKeys['${BASE}'] = 'apikey'`

  await m.wait()

  let json
  try {
    const res = await fetch(new URL('/api/premium/netflix', BASE), {
      method: 'GET',
      headers: { 'x-apikey': apikey },
      signal: AbortSignal.timeout(30000)
    })
    json = await res.json().catch(() => null)
    if (!res.ok || !json) throw new Error((json && (json.message || json.error)) || `HTTP ${res.status}`)
  } catch (e) {
    console.error('[NETFLIX]', (e && e.message) || e)
    throw `Gagal mengambil akun.\n${(e && e.message) || e}`
  }

  const r = json.result || {}
  const links = r.links || {}
  if (!json.status || !r.token) throw `Gagal mengambil akun.\n${json.message || json.error || 'Data kosong dari API'}`

  const body = [
    '*NETLIX PREMIUM ACCOUNT*',
    '',
    `Plan : ${r.plan || '-'}`,
    `Quality : ${r.quality || '-'}`,
    `Country : ${r.country || '-'}`,
    `Expires : ${r.expires || '-'}`,
    '',
    `Token : ${r.token}`,
    '',
    'Tekan tombol di bawah untuk membuka link.'
  ].join('\n')

  const buttons = []
  if (r.url) buttons.push({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🔗 Buka URL', url: r.url }) })
  if (links.pc) buttons.push({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '💻 Link PC', url: links.pc }) })
  if (links.android) buttons.push({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📱 Link Android', url: links.android }) })
  if (links.tv) buttons.push({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📺 Link TV', url: links.tv }) })
  buttons.push({ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '🔑 Salin Token', id: 'copy_nat_token', copy_code: String(r.token) }) })
  buttons.push({ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔄 Buat Lagi', id: usedPrefix + command }) })

  try {
    const Msg = proto.Message.InteractiveMessage
    const msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: Msg.create({
            header: Msg.Header.create({ title: 'NETFLIX ACCOUNT', hasMediaAttachment: false }),
            body: Msg.Body.create({ text: body }),
            footer: Msg.Footer.create({ text: global.namebot || '© ERINE-AI' }),
            nativeFlowMessage: Msg.NativeFlowMessage.create({ buttons })
          })
        }
      }
    }, { quoted: m })
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
  } catch (e) {
    console.error('[NETFLIX] native flow gagal:', (e && e.message) || e)
    await m.reply(body)
  }
}

handler.help = ['netflix']
handler.tags = ['premium']
handler.command = /^(nftoken|neflix)$/i
handler.limit = true
handler.register = true
handler.premium = true

export default handler
