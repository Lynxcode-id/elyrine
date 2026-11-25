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

import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { haidarGet, sendCard } from '../../lib/haidar.js'

const MAX_SIZE = 50 * 1024 * 1024

function hlsToMp4(url, out) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', url, '-c', 'copy', '-bsf:a', 'aac_adtstoasc', '-movflags', '+faststart', out], { stdio: ['ignore', 'ignore', 'pipe'] })
    let err = ''
    const t = setTimeout(() => { p.kill('SIGKILL'); reject(new Error('Timeout unduh video.')) }, 120000)
    p.stderr.on('data', c => { err += c })
    p.on('error', e => { clearTimeout(t); reject(e.code === 'ENOENT' ? new Error('ffmpeg tidak terpasang') : e) })
    p.on('close', code => { clearTimeout(t); code === 0 ? resolve() : reject(new Error(err.trim().split('\n').pop() || `ffmpeg exit ${code}`)) })
  })
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  let q = (text || '').trim()
  const pick = q.match(/\s(\d{1,2})$/)
  if (pick) q = q.slice(0, pick.index).trim()
  if (!q) throw `Masukkan kata kunci.\nContoh: *${usedPrefix + command} anime*\nPilih hasil ke-N: *${usedPrefix + command} anime 3*`

  await m.wait()
  const d = await haidarGet('/api/v1/search/pinterest-video', { q })
  const list = (d.results || []).filter(x => x.video_hls || x.video_mp4)
  if (!list.length) throw `Video "${q}" tidak ditemukan.`

  const idx = Math.min(Math.max(Number(pick?.[1] || 1), 1), list.length) - 1
  const v = list[idx]
  const caption = [
    '*PINTEREST VIDEO*',
    '',
    `Query  : ${d.q || q}`,
    `Hasil  : ${idx + 1}/${list.length}`,
    `Judul  : ${v.title || '-'}`,
    `Deskripsi : ${String(v.description || '-').slice(0, 160)}`,
    `Like   : ${(v.stats?.likes ?? 0).toLocaleString('id-ID')}`,
    `Pinner : ${v.pinner?.username || '-'}`,
    `Link   : ${v.url}`
  ].join('\n')

  await sendCard(conn, m, {
    url: v.url,
    title: v.title || `Pinterest • ${q}`,
    description: v.pinner?.full_name || v.pinner?.username || 'Pinterest',
    caption,
    images: [v.image_original, v.image, v.thumbnail],
    fallbackTitle: 'Pinterest',
    fallbackSub: q
  })

  const out = join(tmpdir(), `pinvid_${Date.now()}.mp4`)
  try {
    if (v.video_mp4) {
      await conn.sendMessage(m.chat, { video: { url: v.video_mp4 }, mimetype: 'video/mp4', caption: v.title || q }, { quoted: m })
    } else {
      await hlsToMp4(v.video_hls, out)
      const st = await fs.stat(out)
      if (st.size > MAX_SIZE) throw new Error('Ukuran video melebihi 50MB.')
      await conn.sendMessage(m.chat, { video: await fs.readFile(out), mimetype: 'video/mp4', caption: v.title || q }, { quoted: m })
    }
  } finally {
    fs.unlink(out).catch(() => { })
  }
}

handler.help = ['pinvid <kata kunci> [nomor]']
handler.tags = ['search']
handler.command = /^(pinvid|pinvideo|pinterestvideo)$/i
handler.limit = true

export default handler
