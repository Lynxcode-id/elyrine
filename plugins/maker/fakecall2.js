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

const handler = async (m, { conn, text, usedPrefix, command, __dirname }) => {
  const contoh = `${usedPrefix + command} Sayangku | 01:32:04`

  const target = [m, m.quoted].find(x => x && /^image\//i.test(x.mimetype || (x.msg && x.msg.mimetype) || '') && typeof x.download === 'function')
  if (!target) throw `Kirim atau reply foto yang mau dijadikan foto profil dengan caption:\n*${contoh}*`

  const raw = String(text || '')
  const idx = raw.lastIndexOf('|')
  const nama = idx >= 0 ? raw.slice(0, idx).trim() : ''
  const durasi = idx >= 0 ? raw.slice(idx + 1).trim() : ''
  if (!nama || !durasi) throw `Format: *${usedPrefix + command} nama | durasi*\nContoh: *${contoh}*`

  const file = join(__dirname, '..', 'scrape', 'fakecall2.js')
  if (!existsSync(file)) throw `Scrape *fakecall2* belum ada. Tambahkan dulu pakai ${usedPrefix}addscrape fakecall2`

  await m.wait()

  const pp = await target.download()
  if (!Buffer.isBuffer(pp) || !pp.length) throw 'Foto gagal diunduh.'

  const { default: fakecall2 } = await import(pathToFileURL(file).href + '?t=' + Date.now())
  const data = await fakecall2(pp, nama, durasi)
  if (!data || !data.status) {
    console.error('[FAKECALL2]', data && data.message)
    throw `Gagal membuat Fake Call Android.${data && data.message ? '\n' + data.message : ''}`
  }

  await conn.sendFile(
    m.chat,
    data.buffer,
    'fakecall2.png',
    `— *FAKE CALL* —\n\n✎ *Nama:* ${nama}\n✎ *Durasi:* ${durasi}`,
    m
  )
}

handler.help = ['fakecall2 <nama | durasi>']
handler.tags = ['maker']
handler.command = /^(fakecall2)$/i
handler.limit = true
handler.register = true

export default handler
