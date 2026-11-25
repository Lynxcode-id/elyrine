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

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { readAlbumMessage } from '../../lib/album.js'

const FLAG_RE = /--(time|date|debug)(?:=(\S+))?/gi

function parseFlags(raw) {
  const flags = {}
  const text = raw.replace(FLAG_RE, (_, key, val) => {
    flags[key.toLowerCase()] = val === undefined ? true : val
    return ''
  }).replace(/\s{2,}/g, ' ').trim()
  return { flags, text }
}

const mimeOf = m => m.mimetype || (m.msg && m.msg.mimetype) || ''

async function downloadIfImage(target) {
  if (!target || !/^image\//i.test(mimeOf(target)) || typeof target.download !== 'function') return null
  try {
    return await target.download()
  } catch (e) {
    return null
  }
}

async function pickCover(m) {
  const direct = await downloadIfImage(m)
  if (direct) return direct
  const quoted = await downloadIfImage(m.quoted)
  if (quoted) return quoted

  let album = null
  try {
    album = await readAlbumMessage(m, { type: 'image' })
  } catch (e) {
    console.error('[LOCKMUSIC] readAlbumMessage error:', (e && e.message) || e)
  }
  if (album && album.found && album.images.length) return album.images[0]
  return null
}

const handler = async (m, { conn, text, usedPrefix, command, __dirname }) => {
  const contoh = `${usedPrefix + command} moment | Vierre Cloud | Lynx ☆`

  const raw = String(text || (m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim()
  if (!raw) throw `Format: *${usedPrefix + command} judul lagu | nama artis | teks atas*\nContoh: *${contoh}*\n\nReply atau kirim 1 foto buat cover di tengah.`

  const { flags, text: fields } = parseFlags(raw)

  const [title = '', artist = '', ...rest] = fields.split('|').map(v => v.trim())
  const label = rest.join(' | ').trim()
  if (fields.indexOf('|') < 0) throw `Pisahkan judul lagu dan nama artis dengan tanda *|*\nContoh: *${contoh}*`
  if (!title || !artist) throw `Judul lagu dan nama artis tidak boleh kosong.\nContoh: *${contoh}*`

  const file = join(__dirname, '..', 'scrape', 'lockmusic.js')
  if (!existsSync(file)) throw `Scrape *lockmusic* belum ada. Tambahkan dulu pakai ${usedPrefix}addscrape lockmusic`

  const cover = await pickCover(m)
  if (!cover) throw `Kirim atau reply 1 foto buat cover di tengah.\nContoh: kirim foto dengan caption *${contoh}*`

  const opt = { title, artist, label, cover, debug: !!flags.debug }
  if (typeof flags.time === 'string') opt.time = flags.time.replace('.', ':')
  if (typeof flags.date === 'string') opt.date = flags.date.replace(/_/g, ' ')

  await m.react('⚡').catch(() => {})

  try {
    const { default: lockmusic } = await import(pathToFileURL(file).href + '?t=' + Date.now())
    const data = await lockmusic(opt)
    if (!data || !data.status) throw new Error((data && data.message) || 'Gagal membuat lockscreen')

    await conn.sendFile(m.chat, data.buffer, 'lockmusic.jpg', '', m)
    await m.react('✅').catch(() => {})
  } catch (error) {
    console.error('[LOCKMUSIC]', (error && error.stack) || error)
    await m.react('❌').catch(() => {})
    throw `Gagal memproses lockscreen: ${(error && error.message) || error}`
  }
}

handler.help = ['lockmusic <judul | artis | teks atas> (reply/kirim foto)']
handler.tags = ['maker']
handler.command = /^(lockmusic|flock|fakelockmusic)$/i
handler.limit = true
handler.register = true

export default handler
