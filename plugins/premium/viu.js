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

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const apikey = global.APIKeys && global.APIKeys[BASE]
  if (!apikey) throw `API key belum diisi. Tambahkan di config.js:\nglobal.APIKeys['${BASE}'] = 'apikey'`

  await m.wait()

  const url = new URL('/api/premium/viu', BASE)
  if (args[0]) url.searchParams.set('device_id', String(args[0]).slice(0, 64))

  let json
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'x-apikey': apikey },
      signal: AbortSignal.timeout(30000)
    })
    json = await res.json().catch(() => null)
    if (!res.ok || !json) throw new Error((json && (json.message || json.error)) || `HTTP ${res.status}`)
  } catch (e) {
    console.error('[VIU]', (e && e.message) || e)
    throw `Gagal mengambil akun.\n${(e && e.message) || e}`
  }

  const r = json.result || {}
  const acc = r.account || {}
  if (!json.status || !acc.email || !acc.password) throw `Gagal mengambil akun.\n${json.message || json.error || 'Data akun kosong dari API'}`

  const body = [
    '*VIU ACCOUNT PREMIUM*',
    '',
    `Status : ${r.status_label || (r.is_new ? 'Akun baru' : 'Akun lama')}`,
    r.device_id ? `Device : ${r.device_id}` : null,
    '',
    `Email : ${acc.email}`,
    `Password : ${acc.password}`,
    '',
    'Tekan tombol di bawah untuk menyalin.'
  ].filter(l => l !== null).join('\n')

  const buttons = [
    { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📧 Salin Email', id: 'copy_epep_email', copy_code: String(acc.email) }) },
    { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '🔑 Salin Password', id: 'copy_epep_pass', copy_code: String(acc.password) }) },
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔄 Buat Lagi', id: usedPrefix + command }) }
  ]

  try {
    const Msg = proto.Message.InteractiveMessage
    const msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: Msg.create({
            header: Msg.Header.create({ title: 'VIU ACCOUNT', hasMediaAttachment: false }),
            body: Msg.Body.create({ text: body }),
            footer: Msg.Footer.create({ text: global.namebot || '© ERINE-AI' }),
            nativeFlowMessage: Msg.NativeFlowMessage.create({ buttons })
          })
        }
      }
    }, { quoted: m })
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
  } catch (e) {
    console.error('[VIU] native flow gagal:', (e && e.message) || e)
    await m.reply(body)
  }
}

handler.help = ['viu']
handler.tags = ['premium']
handler.command = /^(viu)$/i
handler.limit = true
handler.register = true
handler.premium = true

export default handler
