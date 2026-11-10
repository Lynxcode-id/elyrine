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

import { ffmpeg } from './converter.js'

const PTV_MAX_SECONDS = 60

export async function toCircleVideo(buffer) {
  const out = await ffmpeg(buffer, [
    '-vf', 'crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,fps=30',
    '-t', String(PTV_MAX_SECONDS),
    '-map', '0:v:0',
    '-map', '0:a:0?',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '28',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',
    '-ac', '2',
    '-movflags', '+faststart'
  ], 'mp4', 'mp4')
  try { return out.data } finally { out.delete() }
}

export function sendPtv(conn, jid, video, opts = {}) {
  return conn.sendMessage(jid, { video, mimetype: 'video/mp4', ptv: true }, opts)
}
