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

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { addExif, getStickerWatermark } from '../../lib/sticker-maker.js'

const handler = async (m, { conn, text, usedPrefix, command, __dirname }) => {
  const input = String(text || (m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim()
  const contoh = `${usedPrefix + command} bego | anak hebat | goblok`

  if (!input) throw `Format: *${usedPrefix + command} atas | tengah | bawah*\nContoh: *${contoh}*\n\nTeks saja (tanpa |) akan jadi teks tengah.`

  const parts = input.split('|').map(v => v.trim())
  let top = ''
  let mid = ''
  let bottom = ''
  if (parts.length === 1) mid = parts[0]
  else if (parts.length === 3) [top, mid, bottom] = parts
  else throw `Pakai 3 bagian dipisah *|* (atas | tengah | bawah), atau teks saja untuk bagian tengah.\nContoh: *${contoh}*`

  if (!mid) throw 'Teks bagian tengah tidak boleh kosong.'

  const file = join(__dirname, '..', 'scrape', 'brat3.js')
  if (!existsSync(file)) throw `Scrape *brat3* belum ada. Tambahkan dulu pakai ${usedPrefix}addscrape brat3`

  await m.react('⚡').catch(() => {})

  try {
    const { default: brat3 } = await import(pathToFileURL(file).href + '?t=' + Date.now())
    const data = await brat3(top, mid, bottom)
    if (!data || !data.status) throw new Error((data && data.message) || 'Gagal membuat gambar')

    const webp = await sharp(data.buffer)
      .resize(512, 512, { fit: 'fill' })
      .webp({ lossless: true, effort: 4 })
      .toBuffer()

    const wm = getStickerWatermark()
    const sticker = await addExif(webp, wm.packName, wm.publisher)

    await conn.sendMessage(m.chat, { sticker, isAiSticker: true }, { quoted: m })
    await m.react('✅').catch(() => {})
  } catch (error) {
    console.error('[ERINE BRAT3]', (error && error.stack) || error)
    await m.react('❌').catch(() => {})
    throw `Gagal memproses brat3: ${(error && error.message) || error}`
  }
}

handler.help = ['brat3 <atas | tengah | bawah>']
handler.tags = ['sticker']
handler.command = /^(brat3)$/i
handler.limit = true
handler.register = true

export default handler
