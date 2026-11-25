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

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const SAMBUTAN_DIR = path.join(__dirname, '..', 'database', 'musicsambutan')
export const MIN_BYTES = 1024
export const MAX_BYTES = 16 * 1024 * 1024
export const MAX_SOUNDS = 20

const groupKey = jid => String(jid || '').toLowerCase().replace(/[^a-z0-9]/g, '_')
const dirOf = jid => path.join(SAMBUTAN_DIR, groupKey(jid))
const indexOf = jid => path.join(dirOf(jid), 'index.json')

function extOf(mimetype) {
  const mt = String(mimetype || '').toLowerCase()
  if (mt.includes('ogg') || mt.includes('opus')) return 'ogg'
  if (mt.includes('mpeg') || mt.includes('mp3')) return 'mp3'
  if (mt.includes('mp4') || mt.includes('aac') || mt.includes('m4a')) return 'm4a'
  if (mt.includes('wav')) return 'wav'
  return 'bin'
}

function readIndex(jid) {
  try {
    const data = JSON.parse(fs.readFileSync(indexOf(jid), 'utf8'))
    return Array.isArray(data?.sounds) ? data.sounds : []
  } catch {
    return []
  }
}

function writeIndex(jid, sounds) {
  fs.mkdirSync(dirOf(jid), { recursive: true })
  fs.writeFileSync(indexOf(jid), JSON.stringify({ sounds }, null, 2))
}

export function listSounds(jid) {
  const dir = dirOf(jid)
  const alive = readIndex(jid).filter(s => s?.file && fs.existsSync(path.join(dir, s.file)))
  return alive
}

export function addSound(jid, buffer, { mimetype, ptt } = {}) {
  if (!Buffer.isBuffer(buffer) || buffer.length < MIN_BYTES) throw new Error('Audio terlalu kecil atau tidak valid.')
  if (buffer.length > MAX_BYTES) throw new Error(`Audio terlalu besar (maks ${MAX_BYTES / 1024 / 1024} MB).`)

  const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 12)
  const file = `${hash}.${extOf(mimetype)}`
  const sounds = listSounds(jid)
  const idx = sounds.findIndex(s => s.id === hash)

  if (idx === -1 && sounds.length >= MAX_SOUNDS) throw new Error(`Sudah penuh (maks ${MAX_SOUNDS} sound). Hapus dulu salah satu.`)

  fs.mkdirSync(dirOf(jid), { recursive: true })
  fs.writeFileSync(path.join(dirOf(jid), file), buffer)

  const entry = { id: hash, file, mimetype: mimetype || 'audio/mpeg', ptt: !!ptt, size: buffer.length, savedAt: Date.now() }
  if (idx === -1) sounds.push(entry)
  else {
    if (sounds[idx].file !== file) fs.rmSync(path.join(dirOf(jid), sounds[idx].file), { force: true })
    sounds[idx] = entry
  }
  writeIndex(jid, sounds)
  return { status: idx === -1 ? 'added' : 'replaced', entry, total: sounds.length }
}

export function removeSound(jid, which) {
  const sounds = listSounds(jid)
  if (!sounds.length) return { removed: 0, total: 0 }
  const dir = dirOf(jid)

  if (which === 'all') {
    for (const s of sounds) fs.rmSync(path.join(dir, s.file), { force: true })
    writeIndex(jid, [])
    return { removed: sounds.length, total: 0 }
  }

  const n = Number(which)
  if (!Number.isInteger(n) || n < 1 || n > sounds.length) return { removed: 0, total: sounds.length, invalid: true }
  const [gone] = sounds.splice(n - 1, 1)
  fs.rmSync(path.join(dir, gone.file), { force: true })
  writeIndex(jid, sounds)
  return { removed: 1, total: sounds.length, entry: gone }
}

export function readSound(jid, entry) {
  return fs.readFileSync(path.join(dirOf(jid), entry.file))
}

export function pickRandom(jid) {
  const sounds = listSounds(jid)
  if (!sounds.length) return null
  return sounds[crypto.randomInt(sounds.length)]
}

const normMime = entry => {
  const mt = String(entry.mimetype || '').toLowerCase()
  if (mt.includes('ogg') || mt.includes('opus')) return 'audio/ogg; codecs=opus'
  if (mt.includes('mpeg') || mt.includes('mp3')) return 'audio/mpeg'
  if (mt.includes('mp4') || mt.includes('aac') || mt.includes('m4a')) return 'audio/mp4'
  return mt || 'audio/mpeg'
}

export async function sendSound(conn, jid, entry, quoted) {
  const buffer = readSound(jid, entry)
  const opts = quoted ? { quoted } : {}
  try {
    return await conn.sendMessage(jid, { audio: buffer, mimetype: normMime(entry), ptt: !!entry.ptt }, opts)
  } catch (e) {
    console.error('[SAMBUTAN] kirim percobaan 1 gagal:', e?.message || e)
    return await conn.sendMessage(jid, { audio: buffer, mimetype: 'audio/mpeg', ptt: false }, opts)
  }
}

export async function sendWelcomeSound(conn, jid) {
  const entry = pickRandom(jid)
  if (!entry) {
    console.log('[SAMBUTAN] tidak ada audio di grup ini:', jid)
    return false
  }
  try {
    await sendSound(conn, jid, entry)
    console.log('[SAMBUTAN] audio terkirim:', jid)
    return true
  } catch (e) {
    console.error('[SAMBUTAN] kirim sound gagal:', e?.message || e)
    return false
  }
}
