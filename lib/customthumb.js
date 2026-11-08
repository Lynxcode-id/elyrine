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

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const THUMB_DIR = path.join(__dirname, '..', 'database')
const NAME_RE = /^thumbnail\.(jpg|png|webp|gif)$/
export const MAX_BYTES = 10 * 1024 * 1024

function ensureDir() {
    if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR, { recursive: true })
}
ensureDir()

function sniffExt(buf) {
    if (!buf || buf.length < 12) return null
    if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpg'
    if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) return 'png'
    if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp'
    if (buf.subarray(0, 4).toString('latin1') === 'GIF8') return 'gif'
    return null
}

function findFile() {
    try {
        return fs.readdirSync(THUMB_DIR).find(f => NAME_RE.test(f)) || null
    } catch {
        return null
    }
}

let rawCache = null
let smallCache = null

export function hasCustomThumb() {
    return !!findFile()
}

/** @returns {{ buffer: Buffer, path: string, ext: string, mtimeMs: number, size: number } | null} */
export function getCustomThumb() {
    const file = findFile()
    if (!file) { rawCache = null; return null }
    const full = path.join(THUMB_DIR, file)
    try {
        const st = fs.statSync(full)
        if (!rawCache || rawCache.file !== file || rawCache.mtimeMs !== st.mtimeMs) {
            rawCache = { file, mtimeMs: st.mtimeMs, buffer: fs.readFileSync(full) }
        }
        return { buffer: rawCache.buffer, path: full, ext: path.extname(file).slice(1), mtimeMs: st.mtimeMs, size: st.size }
    } catch {
        return null
    }
}

export async function getCustomThumbSmall(size = 300) {
    const t = getCustomThumb()
    if (!t) return null
    if (smallCache && smallCache.mtimeMs === t.mtimeMs && smallCache.size === size) return smallCache.buffer
    let out = t.buffer
    try {
        const sharp = (await import('sharp')).default
        out = await sharp(t.buffer).resize(size, size, { fit: 'cover', position: 'center' }).jpeg({ quality: 85 }).toBuffer()
    } catch {}
    smallCache = { mtimeMs: t.mtimeMs, size, buffer: out }
    return out
}

export function saveCustomThumb(buffer) {
    if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('gambar kosong.')
    if (buffer.length > MAX_BYTES) throw new Error('gambar terlalu besar (maks 10 MB).')
    const ext = sniffExt(buffer)
    if (!ext) throw new Error('file bukan gambar yang didukung (jpg/png/webp/gif).')
    ensureDir()
    const target = path.join(THUMB_DIR, `thumbnail.${ext}`)
    const tmp = `${target}.tmp`
    fs.writeFileSync(tmp, buffer)
    for (const f of fs.readdirSync(THUMB_DIR)) {
        if (NAME_RE.test(f)) fs.rmSync(path.join(THUMB_DIR, f), { force: true })
    }
    fs.renameSync(tmp, target)
    rawCache = null
    smallCache = null
    return { path: target, ext, size: buffer.length }
}

/** Hapus thumbnail custom → thumbnail bawaan aktif lagi. @returns {boolean} true kalau ada yang dihapus */
export function deleteCustomThumb() {
    let removed = false
    try {
        for (const f of fs.readdirSync(THUMB_DIR)) {
            if (NAME_RE.test(f)) { fs.rmSync(path.join(THUMB_DIR, f), { force: true }); removed = true }
        }
    } catch {}
    rawCache = null
    smallCache = null
    return removed
}

/** Ambil gambar dari reply / kiriman gambar / URL di teks. @returns {Promise<Buffer|null>} */
export async function getImageInput(m, text) {
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || ''
    if (/^image\//.test(mime)) {
        const buf = await q.download()
        if (buf && buf.length) return buf
    }
    const url = String(text || '').trim().split(/\s+/)[0]
    if (/^https?:\/\//i.test(url)) {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
        if (!res.ok) throw new Error(`gagal unduh gambar (HTTP ${res.status}).`)
        return Buffer.from(await res.arrayBuffer())
    }
    return null
}