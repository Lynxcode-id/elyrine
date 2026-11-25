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

import { fileTypeFromBuffer } from 'file-type'
import { ffmpeg, prepareAudioMessage } from '../../lib/converter.js'
import { lastCachedMedia } from '../../lib/function.js'

const isMp3 = b => b.length > 3 && ((b[0] === 0xff && (b[1] & 0xe0) === 0xe0) || b.slice(0, 3).toString() === 'ID3')

const BASE = ['-vn', '-sn', '-dn', '-map', '0:a:0', '-map_metadata', '-1']
const MP3 = ['-c:a', 'libmp3lame', '-b:a', '192k']
const TOLERANT = ['-err_detect', 'ignore_err', '-fflags', '+discardcorrupt+genpts']
const RAW_IN = ['-f', 's16le', '-ar', '44100', '-ac', '2']
const NO_AUDIO = /matches no streams|does not contain any stream|no audio|Stream map '0:a:0'/i

export async function convertToMp3(media, ext, ffmpegFn = ffmpeg) {
  const attempts = [
    { name: 'standar', run: () => ffmpegFn(media, ['-vn', '-map_metadata', '-1', '-c:a', 'libmp3lame', '-q:a', '0'], ext, 'mp3') },
    { name: 'aman', run: () => ffmpegFn(media, [...BASE, '-ac', '2', '-ar', '44100', ...MP3], ext, 'mp3') },
    { name: 'mono-toleran', run: () => ffmpegFn(media, [...BASE, '-ac', '1', '-ar', '44100', ...MP3], ext, 'mp3', TOLERANT) },
    {
      name: 'via-pcm', run: async () => {
        const pcm = await ffmpegFn(media, [...BASE, '-ac', '2', '-ar', '44100', '-f', 's16le', '-c:a', 'pcm_s16le'], ext, 'pcm', TOLERANT)
        try { return await ffmpegFn(pcm.data, MP3, 'pcm', 'mp3', RAW_IN) } finally { await pcm.delete() }
      }
    },
    {
      name: 'via-wav', run: async () => {
        const wav = await ffmpegFn(media, [...BASE, '-ac', '2', '-ar', '44100', '-c:a', 'pcm_s16le'], ext, 'wav', TOLERANT)
        try { return await ffmpegFn(wav.data, MP3, 'wav', 'mp3') } finally { await wav.delete() }
      }
    }
  ]
  let lastErr
  for (const a of attempts) {
    try {
      const out = await a.run()
      const data = out.data
      await out.delete()
      if (data?.length > 1024) return { audio: data, mimetype: 'audio/mpeg' }
      lastErr = new Error('hasil konversi terlalu kecil')
    } catch (e) {
      lastErr = e
      console.warn(`[TOMP3] percobaan "${a.name}" gagal: ${e.message}`)
      if (e.stderr) console.warn(`[TOMP3] stderr ffmpeg:\n${e.stderr.trim()}`)
      if (NO_AUDIO.test(`${e.message}\n${e.stderr || ''}`)) throw 'Video/audio ini tidak punya trek suara.'
    }
  }
  try {
    const out = await ffmpegFn(media, [...BASE, '-c:a', 'copy', '-movflags', '+faststart'], ext, 'm4a', TOLERANT)
    const data = out.data
    await out.delete()
    if (data?.length > 1024) return { audio: data, mimetype: 'audio/mp4' }
  } catch (e) {
    console.warn(`[TOMP3] percobaan "salin-audio" gagal: ${e.message}`)
    if (e.stderr) console.warn(`[TOMP3] stderr ffmpeg:\n${e.stderr.trim()}`)
  }
  throw new Error(`Semua metode konversi gagal (${lastErr?.message || 'tanpa pesan'})`)
}

let handler = async (m, { conn, usedPrefix, command }) => {
  const usage = `Balas video / audio / VN dengan perintah *${usedPrefix + command}*`

  const q = m.quoted?.mediaMessage ? m.quoted : (m.mediaMessage ? m : null)

  if (!q && m.quoted && /video|audio|ptv/i.test(m.quoted.mtype || '')) {
    throw 'Media yang kamu balas tidak bisa diunduh (sudah tidak ada di cache bot). Kirim ulang videonya atau jalankan downloader-nya lagi, lalu balas dengan ' + usedPrefix + command + '.'
  }
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
  let mimetype = 'audio/mpeg'
  if (!isMp3(media)) {
    try {
      ({ audio, mimetype } = await convertToMp3(media, ft?.ext || 'bin'))
    } catch (e) {
      throw typeof e === 'string' ? e : `Gagal mengonversi ke MP3: ${e.message}`
    }
  }

  const msg = await prepareAudioMessage({ audio, ptt: false, mimetype })
  await conn.sendMessage(m.chat, { ...msg, ptt: false }, { quoted: m })
}

handler.help = ['tomp3']
handler.tags = ['tools']
handler.command = ['tomp3', 'toaudio']
handler.wait = true
handler.limit = true
handler.register = true

export default handler
