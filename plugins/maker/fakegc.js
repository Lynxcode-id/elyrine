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
  const contoh = `${usedPrefix + command} RIN MD OFFICIAL | 2 anggota`

  const target = [m, m.quoted].find(x => x && /^image\//i.test(x.mimetype || (x.msg && x.msg.mimetype) || '') && typeof x.download === 'function')
  if (!target) throw `Kirim atau reply foto profil grup dengan caption:\n*${contoh}*`

  const [nama, anggota] = String(text || '').split('|').map(v => v.trim())
  if (!nama || !anggota) throw `Format: *${usedPrefix + command} Nama Grup | Jumlah Anggota*\nContoh: *${contoh}*`

  const file = join(__dirname, '..', 'scrape', 'fakegc.js')
  if (!existsSync(file)) throw `Scrape *fakegc* belum ada. Tambahkan dulu pakai ${usedPrefix}addscrape fakegc`

  await m.wait()

  const pp = await target.download()
  if (!Buffer.isBuffer(pp) || !pp.length) throw 'Foto gagal diunduh.'

  const { default: fakegc } = await import(pathToFileURL(file).href + '?t=' + Date.now())
  const data = await fakegc(pp, nama, anggota)
  if (!data || !data.status) {
    console.error('[FAKEGC]', data && data.message)
    throw `Gagal membuat Fake GC iOS.${data && data.message ? '\n' + data.message : ''}`
  }

  await conn.sendFile(
    m.chat,
    data.buffer,
    'fakegc.png',
    `— *FAKE GC IOS* —\n\n✎ *Grup :* ${nama}\n✎ *Anggota :* ${anggota}`,
    m
  )
}

handler.help = ['fakegc <nama grup | anggota>']
handler.tags = ['maker']
handler.command = /^(fakegc)$/i
handler.limit = true
handler.register = true

export default handler
