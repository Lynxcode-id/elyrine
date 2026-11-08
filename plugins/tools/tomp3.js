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

import { fileTypeFromBuffer } from 'file-type'
import { ffmpeg, prepareAudioMessage } from '../../lib/converter.js'
import { lastCachedMedia } from '../../lib/function.js'

const isMp3 = b => b.length > 3 && ((b[0] === 0xff && (b[1] & 0xe0) === 0xe0) || b.slice(0, 3).toString() === 'ID3')

let handler = async (m, { conn, usedPrefix, command }) => {
  const usage = `Balas video / audio / VN dengan perintah *${usedPrefix + command}*`

  const q = m.quoted?.mediaMessage ? m.quoted : (m.mediaMessage ? m : null)
  let media
  try {
    if (q) media = await q.download()
    else {
      const last = lastCachedMedia(m.chat)
      console.log('[TOMP3] info reply tidak ada → fallback media terakhir:', last ? last.key : 'tidak ada')
      if (!last) throw usage
      media = await conn.downloadM(last.node, last.key.replace('Message', ''))
    }
  } catch (e) {
    throw typeof e === 'string' ? e : `Gagal mengunduh media: ${e.message}`
  }
  if (!Buffer.isBuffer(media) || !media.length) throw 'Gagal mengunduh media.'

  const ft = await fileTypeFromBuffer(media).catch(() => null)
  if (ft && !/^(video|audio)\//.test(ft.mime)) throw `File yang diunduh bukan video/audio (terdeteksi: ${ft.mime})`

  let audio = media
  if (!isMp3(media)) {
    const out = await ffmpeg(media, ['-vn', '-map_metadata', '-1', '-c:a', 'libmp3lame', '-q:a', '0'], ft?.ext || 'bin', 'mp3')
    audio = out.data
    await out.delete()
  }

  const msg = await prepareAudioMessage({ audio, ptt: false, mimetype: 'audio/mpeg' })
  await conn.sendMessage(m.chat, { ...msg, ptt: false }, { quoted: m })
}

handler.help = ['tomp3']
handler.tags = ['tool']
handler.command = ['tomp3', 'toaudio']
handler.wait = true
handler.limit = true
handler.register = true

export default handler
