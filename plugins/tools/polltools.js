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

import { createRequire } from 'module'
import { spawn } from 'child_process'
import { promises as fsp } from 'fs'
import os from 'os'
import path from 'path'
import zlib from 'zlib'
import { fileTypeFromBuffer } from 'file-type'
import sharp from 'sharp'
import { prepareAudioMessage } from '../../lib/converter.js'

const require = createRequire(import.meta.url)

const ICON = { image: '🖼️', pdf: '📕', video: '🎬', audio: '🎵', other: '📄' }
const MAX_ITEMS = 30
const MAX_FILE = 50 * 1024 * 1024
const MAX_TOTAL = 150 * 1024 * 1024
const TTL = 2 * 60 * 60 * 1000

const fmtSize = n => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`)
const numArg = (v, def, min, max) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def }
const safeName = (s, def) => (String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60) || def)
const stamp = () => Date.now().toString(36)
const POOL = new Map()
const pool = {
  list(jid) {
    const e = POOL.get(jid)
    if (!e) return []
    if (Date.now() - e.at > TTL) { POOL.delete(jid); return [] }
    return e.items
  },
  add(jid, item) {
    const items = this.list(jid)
    if (items.length >= MAX_ITEMS) throw `Keranjang penuh (maks ${MAX_ITEMS} file). Olah dulu atau kosongkan dengan .kumpul reset`
    if (items.reduce((s, i) => s + i.buffer.length, 0) + item.buffer.length > MAX_TOTAL) throw `Total ukuran keranjang melebihi ${fmtSize(MAX_TOTAL)}. Olah dulu atau kosongkan dengan .kumpul reset`
    items.push(item)
    POOL.set(jid, { items, at: Date.now() })
    return items.length
  },
  remove(jid, n) {
    const items = this.list(jid)
    if (!Number.isInteger(n) || n < 1 || n > items.length) return false
    items.splice(n - 1, 1)
    return true
  },
  clear(jid) { POOL.delete(jid) }
}
setInterval(() => { const now = Date.now(); for (const [k, v] of POOL) if (now - v.at > TTL) POOL.delete(k) }, 10 * 60 * 1000).unref?.()

const mine = (jid, kind) => pool.list(jid).filter(i => (Array.isArray(kind) ? kind.includes(i.kind) : !kind || i.kind === kind))
const need = (items, n, what) => { if (items.length < n) throw `Butuh minimal ${n} ${what} di keranjang. Tambah dengan reply file lalu ketik .kumpul` }

function spawnFfmpeg(args, timeout) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'] })
    let err = ''
    p.stderr.on('data', d => { if (err.length < 4000) err += d })
    const t = setTimeout(() => p.kill('SIGKILL'), timeout)
    p.on('error', e => { clearTimeout(t); reject(e.code === 'ENOENT' ? new Error('ffmpeg tidak terpasang') : e) })
    p.on('close', code => {
      clearTimeout(t)
      if (code === 0) return resolve()
      reject(new Error(`ffmpeg exit ${code}: ${err.trim().split('\n').pop() || 'tanpa pesan'}`))
    })
  })
}

async function withTmp(bufs, fn) {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'pooltools-'))
  try {
    const ins = []
    for (let i = 0; i < bufs.length; i++) {
      const ft = await fileTypeFromBuffer(bufs[i]).catch(() => null)
      const p = path.join(dir, `in${i}.${ft?.ext || 'bin'}`)
      await fsp.writeFile(p, bufs[i])
      ins.push(p)
    }
    return await fn(ins, dir)
  } finally {
    fsp.rm(dir, { recursive: true, force: true }).catch(() => { })
  }
}

const runMulti = (bufs, outExt, build, timeout) => withTmp(bufs, async (ins, dir) => {
  const out = path.join(dir, `out.${outExt}`)
  await spawnFfmpeg(build(ins, out), timeout)
  const data = await fsp.readFile(out)
  if (!data.length) throw new Error('hasil kosong')
  return data
})

const hasAudio = buf => withTmp([buf], (ins) => new Promise(resolve => {
  const p = spawn('ffmpeg', ['-hide_banner', '-i', ins[0]], { stdio: ['ignore', 'ignore', 'pipe'] })
  let err = ''
  p.stderr.on('data', d => { err += d })
  p.on('error', () => resolve(false))
  p.on('close', () => resolve(/Stream #\d+:\d+.*Audio:/.test(err)))
}))

async function blurFit(buf, W, H) {
  const base = await sharp(buf, { failOn: 'none' }).rotate().resize(W, H, { fit: 'cover' }).blur(30).modulate({ brightness: 0.6 }).jpeg({ quality: 80 }).toBuffer()
  const fg = await sharp(buf, { failOn: 'none' }).rotate().resize(W, H, { fit: 'inside' }).toBuffer()
  return sharp(base).composite([{ input: fg, gravity: 'centre' }]).jpeg({ quality: 88 }).toBuffer()
}

function imagesToPdf(pages) {
  const chunks = []
  const offs = []
  let off = 0
  const push = b => { const buf = Buffer.isBuffer(b) ? b : Buffer.from(b, 'latin1'); chunks.push(buf); off += buf.length }
  const obj = (n, parts) => { offs[n] = off; push(`${n} 0 obj\n`); parts.forEach(push); push('\nendobj\n') }
  const total = 2 + pages.length * 3
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  obj(1, ['<< /Type /Catalog /Pages 2 0 R >>'])
  obj(2, [`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ')}] >>`])
  pages.forEach((pg, i) => {
    const base = 3 + i * 3
    const land = pg.w > pg.h * 1.15
    const [pw, ph] = land ? [842, 595] : [595, 842]
    const mg = 24
    const s = Math.min((pw - mg * 2) / pg.w, (ph - mg * 2) / pg.h)
    const w = pg.w * s, h = pg.h * s
    const content = `q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${((pw - w) / 2).toFixed(2)} ${((ph - h) / 2).toFixed(2)} cm /Im0 Do Q`
    obj(base, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${base + 2} 0 R >> >> /Contents ${base + 1} 0 R >>`])
    obj(base + 1, [`<< /Length ${content.length} >>\nstream\n${content}\nendstream`])
    obj(base + 2, [`<< /Type /XObject /Subtype /Image /Width ${pg.w} /Height ${pg.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.jpg.length} >>\nstream\n`, pg.jpg, '\nendstream'])
  })
  const xref = off
  let x = `xref\n0 ${total + 1}\n0000000000 65535 f \n`
  for (let n = 1; n <= total; n++) x += `${String(offs[n]).padStart(10, '0')} 00000 n \n`
  push(x + `trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`)
  return Buffer.concat(chunks)
}

const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0 }

function makeZip(files) {
  const d = new Date()
  const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)
  const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
  const locals = []
  const centrals = []
  let offset = 0
  for (const f of files) {
    const name = Buffer.from(f.name, 'utf8')
    const raw = f.data
    const def = zlib.deflateRawSync(raw, { level: 6 })
    const useDef = def.length < raw.length
    const data = useDef ? def : raw
    const method = useDef ? 8 : 0
    const crc = crc32(raw)
    const lh = Buffer.alloc(30)
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(method, 8)
    lh.writeUInt16LE(dosTime, 10); lh.writeUInt16LE(dosDate, 12); lh.writeUInt32LE(crc, 14)
    lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(name.length, 26); lh.writeUInt16LE(0, 28)
    locals.push(lh, name, data)
    const ch = Buffer.alloc(46)
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(method, 10)
    ch.writeUInt16LE(dosTime, 12); ch.writeUInt16LE(dosDate, 14); ch.writeUInt32LE(crc, 16)
    ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(name.length, 28)
    ch.writeUInt32LE(offset, 42)
    centrals.push(ch, name)
    offset += 30 + name.length + data.length
  }
  const cd = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, cd, end])
}

const mimeOf = x => x?.mimetype || x?.msg?.mimetype || ''
async function getFile(m) {
  const q = [m, m.quoted].find(x => x && typeof x.download === 'function' && mimeOf(x))
  if (!q) return null
  let buffer
  try { buffer = await q.download() } catch (e) { throw `Gagal mengunduh media: ${e.message}` }
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw 'Gagal mengunduh media.'
  if (buffer.length > MAX_FILE) throw `File terlalu besar (${fmtSize(buffer.length)}). Maks ${fmtSize(MAX_FILE)} per file.`
  const mime = mimeOf(q)
  const ft = await fileTypeFromBuffer(buffer).catch(() => null)
  const fm = ft?.mime || mime
  let kind = 'other'
  if (/^image\//.test(fm)) kind = 'image'
  else if (fm === 'application/pdf') kind = 'pdf'
  else if (/^audio\//.test(mime) || /^audio\//.test(fm)) kind = 'audio'
  else if (/^video\//.test(fm)) kind = 'video'
  const ext = ft?.ext || (mime.split('/')[1] || 'bin').split(';')[0]
  const name = safeName(q.fileName || q.msg?.fileName, '') || `${kind}-${stamp()}.${ext}`
  return { buffer, name, kind, mime: fm }
}

const specs = {
  kumpul: async (m, c) => {
    const a = (c.args[0] || '').toLowerCase()
    const jid = m.sender
    if (a === 'reset' || a === 'kosong') { pool.clear(jid); return { text: '🗑️ Keranjang dikosongkan.' } }
    if (a === 'hapus') {
      const n = Number(c.args[1])
      return { text: pool.remove(jid, n) ? `🗑️ Item #${n} dihapus.` : 'Nomor item tidak ada. Lihat daftar dengan .kumpul list' }
    }
    if (a === 'list' || a === 'daftar') {
      const items = pool.list(jid)
      if (!items.length) return { text: 'Keranjang kosong. Reply file dengan .kumpul untuk menambah.' }
      return { text: [`📦 *KERANJANG MEDIA — ${items.length} FILE*`, '', ...items.map((i, n) => `${n + 1}. ${ICON[i.kind]} ${i.name} (${fmtSize(i.buffer.length)})`), '', '🛠️ *OLAH*', '.pdfbuat • .kolase • .slideshow • .zipkan', '.gabungvideo • .gabungaudio • .mixav', '.kumpul hapus <no> • .kumpul reset'].join('\n') }
    }
    const f = await getFile(m)
    if (!f) {
      const n = pool.list(jid).length
      return { text: `📦 Keranjang: ${n} file.\n\nReply sebuah file/gambar/video/audio dengan *${c.usedPrefix}kumpul* untuk menambahkannya, ulangi untuk file lain, lalu olah dengan:\n.pdfbuat  .kolase  .slideshow  .zipkan  .gabungvideo  .gabungaudio  .mixav\n\n.kumpul list • .kumpul hapus <no> • .kumpul reset` }
    }
    const n = pool.add(jid, f)
    return { text: `✅ Ditambahkan #${n}: ${ICON[f.kind]} ${f.name}\nTotal keranjang: ${n} file. Lanjut tambah, atau olah (.kumpul list untuk daftar).` }
  },

  pdfbuat: async (m, c) => {
    const items = mine(m.sender, ['image', 'pdf'])
    need(items, 1, 'gambar/PDF')
    let out, pageCount
    if (!items.some(i => i.kind === 'pdf')) {
      const pages = []
      for (const it of items) {
        const r = await sharp(it.buffer, { failOn: 'none' }).rotate().flatten({ background: '#ffffff' }).toColourspace('srgb').jpeg({ quality: 90 }).toBuffer({ resolveWithObject: true })
        pages.push({ jpg: r.data, w: r.info.width, h: r.info.height })
      }
      out = imagesToPdf(pages)
      pageCount = pages.length
    } else {
      let PDFDocument
      try { ({ PDFDocument } = require('pdf-lib')) } catch { throw 'Menggabung file PDF butuh paket pdf-lib. Jalankan: npm i pdf-lib\n(Kalau isi keranjang hanya gambar, tidak perlu paket tambahan.)' }
      const doc = await PDFDocument.create()
      for (const it of items) {
        if (it.kind === 'pdf') {
          const src = await PDFDocument.load(it.buffer, { ignoreEncryption: true, updateMetadata: false })
          const pages = await doc.copyPages(src, src.getPageIndices())
          pages.forEach(p => doc.addPage(p))
        } else {
          const jpg = await sharp(it.buffer, { failOn: 'none' }).rotate().flatten({ background: '#ffffff' }).jpeg({ quality: 90 }).toBuffer()
          const img = await doc.embedJpg(jpg)
          const land = img.width > img.height * 1.15
          const [pw, ph] = land ? [842, 595] : [595, 842]
          const page = doc.addPage([pw, ph])
          const s = Math.min((pw - 48) / img.width, (ph - 48) / img.height)
          page.drawImage(img, { x: (pw - img.width * s) / 2, y: (ph - img.height * s) / 2, width: img.width * s, height: img.height * s })
        }
      }
      out = Buffer.from(await doc.save())
      pageCount = doc.getPageCount()
    }
    return { document: out, fileName: `${safeName(c.args.join(' ').replace(/\.pdf$/i, ''), 'dokumen')}.pdf`, mimetype: 'application/pdf', caption: `✅ PDF dibuat: ${pageCount} halaman • ${fmtSize(out.length)}` }
  },

  kolase: async (m, c) => {
    const items = mine(m.sender, 'image')
    need(items, 2, 'gambar')
    const list = items.slice(0, 16)
    const cols = Math.min(list.length, Math.round(numArg(c.args[0], Math.ceil(Math.sqrt(list.length)), 1, 6)))
    const rows = Math.ceil(list.length / cols)
    const cell = cols >= 4 ? 420 : 560
    const gap = 14
    const W = cols * cell + (cols + 1) * gap
    const H = rows * cell + (rows + 1) * gap
    const comps = []
    for (let i = 0; i < list.length; i++) {
      const t = await sharp(list[i].buffer, { failOn: 'none' }).rotate().resize(cell, cell, { fit: 'cover', position: 'attention' }).jpeg({ quality: 90 }).toBuffer()
      comps.push({ input: t, left: gap + (i % cols) * (cell + gap), top: gap + Math.floor(i / cols) * (cell + gap) })
    }
    const img = await sharp({ create: { width: W, height: H, channels: 3, background: '#ffffff' } }).composite(comps).jpeg({ quality: 92 }).toBuffer()
    return { image: img, caption: `🖼️ Kolase ${list.length} foto (${cols}×${rows})${items.length > 16 ? '\nMaks 16 foto per kolase.' : ''}` }
  },

  slideshow: async (m, c) => {
    const items = mine(m.sender, 'image').slice(0, 15)
    need(items, 2, 'gambar')
    const d = numArg(c.args[0], 3, 1, 8)
    const fade = Math.min(0.6, d / 3)
    const frames = []
    for (const it of items) frames.push(await blurFit(it.buffer, 1280, 720))
    const aud = mine(m.sender, 'audio')[0]
    const total = items.length * d - (items.length - 1) * fade
    const bufs = aud ? [...frames, aud.buffer] : frames
    const out = await runMulti(bufs, 'mp4', (ins, o) => {
      const args = []
      frames.forEach((_, i) => args.push('-loop', '1', '-framerate', '25', '-t', String(d), '-f', 'image2', '-i', ins[i]))
      if (aud) args.push('-i', ins[frames.length])
      let f = ''
      let last = '0:v'
      for (let i = 1; i < frames.length; i++) {
        f += `[${last}][${i}:v]xfade=transition=fade:duration=${fade.toFixed(2)}:offset=${(i * (d - fade)).toFixed(2)}[x${i}];`
        last = `x${i}`
      }
      f += `[${last}]format=yuv420p[v]`
      args.push('-filter_complex', f, '-map', '[v]')
      if (aud) args.push('-map', `${frames.length}:a`, '-af', `afade=t=out:st=${Math.max(0, total - 1.5).toFixed(2)}:d=1.5`, '-c:a', 'aac', '-b:a', '128k', '-t', total.toFixed(2))
      args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-movflags', '+faststart', o)
      return args
    }, 240000)
    return { video: out, caption: `🎞️ Slideshow ${items.length} foto • ${total.toFixed(0)} detik${aud ? ' • + musik' : ''}` }
  },

  zipkan: async (m, c) => {
    const items = pool.list(m.sender)
    need(items, 1, 'file')
    const used = new Set()
    const files = items.map((it, i) => {
      let n = it.name
      if (used.has(n)) n = `${i + 1}-${n}`
      used.add(n)
      return { name: n, data: it.buffer }
    })
    const out = makeZip(files)
    return { document: out, fileName: `${safeName(c.args.join(' ').replace(/\.zip$/i, ''), 'arsip')}.zip`, mimetype: 'application/zip', caption: `🗜️ ${items.length} file → ${fmtSize(out.length)}` }
  },

  gabungvideo: async (m) => {
    const items = mine(m.sender, 'video').slice(0, 6)
    need(items, 2, 'video')
    const withAudio = (await Promise.all(items.map(i => hasAudio(i.buffer)))).every(Boolean)
    const out = await runMulti(items.map(i => i.buffer), 'mp4', (ins, o) => {
      const args = []
      ins.forEach(f => args.push('-i', f))
      let f = ''
      ins.forEach((_, i) => {
        f += `[${i}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=30,format=yuv420p[v${i}];`
        if (withAudio) f += `[${i}:a]aresample=44100,aformat=channel_layouts=stereo[a${i}];`
      })
      f += ins.map((_, i) => `[v${i}]${withAudio ? `[a${i}]` : ''}`).join('') + `concat=n=${ins.length}:v=1:a=${withAudio ? 1 : 0}[v]${withAudio ? '[a]' : ''}`
      args.push('-filter_complex', f, '-map', '[v]')
      if (withAudio) args.push('-map', '[a]', '-c:a', 'aac', '-b:a', '128k')
      args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '25', '-movflags', '+faststart', o)
      return args
    }, 300000)
    return { video: out, caption: `🎬 ${items.length} video digabung${withAudio ? '' : ' (tanpa suara: ada video tanpa audio)'}` }
  },

  gabungaudio: async (m) => {
    const items = mine(m.sender, 'audio').slice(0, 12)
    need(items, 2, 'audio')
    const out = await runMulti(items.map(i => i.buffer), 'mp3', (ins, o) => {
      const args = []
      ins.forEach(f => args.push('-i', f))
      args.push('-filter_complex', ins.map((_, i) => `[${i}:a]aresample=44100,aformat=channel_layouts=stereo[a${i}]`).join(';') + `;${ins.map((_, i) => `[a${i}]`).join('')}concat=n=${ins.length}:v=0:a=1[a]`, '-map', '[a]', '-c:a', 'libmp3lame', '-b:a', '160k', o)
      return args
    }, 240000)
    return { audio: out, caption: `🎵 ${items.length} audio digabung` }
  },

  mixav: async (m) => {
    const v = mine(m.sender, 'video')[0]
    const a = mine(m.sender, 'audio')[0]
    if (!v || !a) throw 'Butuh 1 video dan 1 audio di keranjang. Tambah dengan reply lalu .kumpul'
    const out = await runMulti([v.buffer, a.buffer], 'mp4', (ins, o) => ['-i', ins[0], '-i', ins[1], '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', o], 240000)
    return { video: out, caption: '🎧 Audio dipasang pada video (suara asli diganti, durasi mengikuti yang terpendek)' }
  }
}

const HEAVY = new Set(['pdfbuat', 'kolase', 'slideshow', 'zipkan', 'gabungvideo', 'gabungaudio', 'mixav'])

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const cmd = command.toLowerCase()
  const fn = specs[cmd]
  if (!fn) return
  if (HEAVY.has(cmd)) await m.wait?.().catch?.(() => { })
  let r
  try {
    r = await fn(m, { args, usedPrefix })
  } catch (e) {
    if (typeof e === 'string') throw e
    console.error(`[POOLTOOLS:${cmd}]`, e?.stack || e?.message || e)
    throw `Gagal memproses (${cmd}): ${e?.message || 'unknown'}`
  }
  if (r.text) return m.reply(r.text)
  if (r.document) return conn.sendMessage(m.chat, { document: r.document, fileName: r.fileName, mimetype: r.mimetype, caption: r.caption }, { quoted: m })
  if (r.image) return conn.sendMessage(m.chat, { image: r.image, caption: r.caption }, { quoted: m })
  if (r.video) return conn.sendMessage(m.chat, { video: r.video, mimetype: 'video/mp4', caption: r.caption }, { quoted: m })
  if (r.audio) {
    try {
      const msg = await prepareAudioMessage({ audio: r.audio, ptt: false, mimetype: 'audio/mpeg' })
      await conn.sendMessage(m.chat, { ...msg, ptt: false }, { quoted: m })
    } catch {
      await conn.sendMessage(m.chat, { audio: r.audio, mimetype: 'audio/mpeg' }, { quoted: m })
    }
    return m.reply(r.caption)
  }
}

handler.help = ['kumpul', 'pdfbuat', 'kolase', 'slideshow', 'zipkan', 'gabungvideo', 'gabungaudio', 'mixav']
handler.tags = ['tools']
handler.command = /^(kumpul|pdfbuat|kolase|slideshow|zipkan|gabungvideo|gabungaudio|mixav)$/i
handler.register = true

export default handler
