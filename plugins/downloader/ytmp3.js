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

import axios from 'axios'
import { ytmp3Api } from '../../lib/ytapi.js'

const MAX_SIZE = 50 * 1024 * 1024
const YT_REGEX = /^(https?:\/\/)?((www|m|music)\.)?(youtube\.com|youtu\.be)\/\S+/i

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const url = (text || '').trim().split(/\s+/)[0]
  if (!url) throw `*Contoh:* ${usedPrefix || '.'}${command} https://youtu.be/tGv7CUutzqU`
  if (!YT_REGEX.test(url)) throw 'Link tidak valid, kirim link YouTube.'

  await m.react('⏳').catch(() => { })

  let info
  try {
    info = await ytmp3Api(url)
  } catch (e) {
    await m.react('❌').catch(() => { })
    return m.gagal(`Gagal mengambil audio: ${e.message}`, 'Theresav')
  }

  let audio
  try {
    const res = await axios.get(info.download_url, {
      responseType: 'arraybuffer',
      timeout: 120000,
      maxContentLength: MAX_SIZE,
      maxBodyLength: MAX_SIZE
    })
    audio = Buffer.from(res.data)
  } catch (e) {
    await m.react('❌').catch(() => { })
    const tooBig = /maxContentLength|exceeded/i.test(e.message)
    return m.gagal(tooBig ? 'Ukuran audio melebihi 50MB.' : `Gagal mengunduh audio: ${e.message}`, 'Theresav')
  }

  const safeName = String(info.title || 'audio').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 80)
  await conn.sendMessage(m.chat, {
    audio,
    mimetype: 'audio/mpeg',
    fileName: `${safeName}.mp3`
  }, { quoted: m })

  await m.react('✅').catch(() => { })
  await m.sukses([
    `♡ Judul : ${info.title || '-'}`,
    `♡ Link : ${url}`,
    `♡ Format : MP3`
  ].join('\n'))
}

handler.command = ['ytmp3']
handler.help = ['ytmp3 <link youtube>']
handler.tags = ['downloader']
handler.wait = true
handler.limit = true
handler.register = true

export default handler
