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

import axios from 'axios'

const API = String(global.APIs?.apicloud || 'https://api-cloud.my.id').replace(/\/+$/, '')
const MF_REGEX = /^(https?:\/\/)?(www\.)?mediafire\.com\/file\/\S+/i
const MAX_SIZE = 500 * 1024 * 1024

const parseSize = str => {
  const m = String(str || '').match(/([\d.]+)\s*(KB|MB|GB)/i)
  if (!m) return 0
  const n = parseFloat(m[1])
  const unit = m[2].toUpperCase()
  return n * (unit === 'GB' ? 1024 * 1024 * 1024 : unit === 'MB' ? 1024 * 1024 : 1024)
}

const extFromMime = mime => {
  const map = {
    'application/zip': 'zip',
    'application/x-zip-compressed': 'zip',
    'application/x-rar-compressed': 'rar',
    'application/vnd.rar': 'rar',
    'application/pdf': 'pdf',
    'application/vnd.android.package-archive': 'apk',
    'application/x-7z-compressed': '7z',
  }
  return map[String(mime || '').toLowerCase()] || ''
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const url = String(text || '').trim()
  if (!url) return m.reply(`Masukkan link MediaFire-nya, Bang!\nContoh: *${usedPrefix + command}* https://www.mediafire.com/file/xxxx/nama.zip/file`)
  if (!MF_REGEX.test(url)) return m.reply('Link tidak valid! Pastikan itu link MediaFire.')

  const react = e => m.react?.(e)?.catch?.(() => { })
  await react('⏳')

  try {
    const { data: json } = await axios.get(`${API}/downloader/mediafire`, {
      params: { url },
      timeout: 60000
    })

    if (!json?.status || !json?.result?.download?.link_download) {
      throw new Error(json?.message || 'Gagal mengambil data dari MediaFire.')
    }

    const { meta = {}, download = {} } = json.result
    const { link_download: link, size, mimetype } = download
    const title = meta.title || 'file'

    if (size && parseSize(size) > MAX_SIZE) {
      await react('❌')
      return m.reply(`File terlalu besar (${size}). Batas maksimal ${(MAX_SIZE / 1024 / 1024).toFixed(0)} MB.`)
    }

    const ext = extFromMime(mimetype) || (link.split('.').pop().split(/[?#]/)[0] || 'bin')
    const fileName = title.toLowerCase().endsWith('.' + ext.toLowerCase()) ? title : `${title}.${ext}`

    const caption = [
      '*乂 MEDIAFIRE DOWNLOADER*',
      '',
      `• Nama : ${title}`,
      `• Ukuran : ${size || '-'}`,
      `• Tipe : ${mimetype || '-'}`
    ].join('\n')

    await conn.sendFile(m.chat, link, fileName, caption, m, false, { mimetype })
    await react('✅')
  } catch (error) {
    console.error('[MEDIAFIRE]', error?.stack || error?.message || error)
    await react('❌')
    return m.reply(`Gagal mengambil/mengirim file dari MediaFire.\n\nDetail: ${String(error?.message || error).slice(0, 200)}`)
  }
}

handler.help = ['mediafire <link>']
handler.tags = ['downloader']
handler.command = /^(mediafire|mf)$/i

export default handler
