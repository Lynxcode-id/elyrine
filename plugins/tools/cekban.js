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

import { haidarGet } from '../../lib/haidar.js'

const handler = async (m, { text, usedPrefix, command }) => {
  let n = String(text || m.quoted?.sender || '').replace(/\D/g, '')
  if (n.startsWith('0')) n = '62' + n.slice(1)
  if (n.length < 8 || n.length > 16) throw `Masukkan nomor WhatsApp.\nContoh: *${usedPrefix + command} 0895326884022*`

  await m.wait()
  const d = (await haidarGet('/api/v1/tools/cekban', { number: n })).result
  if (!d) throw 'Data tidak ditemukan.'
  const x = d.detail || {}
  await m.reply([
    '*CEK BANNED WHATSAPP*',
    '',
    `Nomor      : +${d.phone}`,
    `Status     : ${d.banned ? '🚫 Banned' : '✅ ' + (d.status || 'Safe')}`,
    `Terdaftar  : ${d.exists ? 'Ya' : 'Tidak'}`,
    `Metode     : ${(x.fallback_methods || []).join(', ') || '-'}`,
    `Dicek      : ${x.checked_at ? new Date(x.checked_at).toLocaleString('id-ID', { timeZone: 'Asia/Makassar' }) + ' WITA' : '-'}`
  ].join('\n'))
}

handler.help = ['cekban <nomor>']
handler.tags = ['tools']
handler.command = /^(cekban|cekbanned|cekbanwa)$/i
handler.limit = true

export default handler
