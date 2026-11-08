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
const DIR = path.join(__dirname, '..', 'store', 'menu-audio')
const DATA = path.join(DIR, 'main.bin')
const META = path.join(DIR, 'main.json')

export const MIN_AUDIO_SIZE = 1024

function guessAudioMime(buffer) {
    const head = buffer.subarray(0, 12)
    if (head.subarray(0, 4).toString('latin1') === 'OggS') return 'audio/ogg; codecs=opus'
    if (head.subarray(4, 8).toString('latin1') === 'ftyp') return 'audio/mp4'
    if (head.subarray(0, 4).toString('latin1') === 'RIFF') return 'audio/wav'
    return 'audio/mpeg'
}

export function getMenuAudioInfo() {
    try {
        if (!fs.existsSync(DATA)) return null
        const buffer = fs.readFileSync(DATA)
        if (!buffer.length) return null
        let meta = {}
        try { meta = JSON.parse(fs.readFileSync(META, 'utf8')) } catch { }
        return { buffer, mimetype: meta.mimetype || guessAudioMime(buffer), ptt: meta.ptt !== false, size: buffer.length }
    } catch {
        return null
    }
}

export function saveMenuAudio(input, meta = {}) {
    const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input)
    if (buffer.length < MIN_AUDIO_SIZE) throw new Error('Audio terlalu kecil atau tidak valid.')

    const mimetype = meta.mimetype || guessAudioMime(buffer)
    const ptt = meta.ptt !== false

    fs.mkdirSync(DIR, { recursive: true })
    fs.writeFileSync(DATA, buffer)
    fs.writeFileSync(META, JSON.stringify({ mimetype, ptt, size: buffer.length, savedAt: Date.now() }))
    return { mimetype, ptt, size: buffer.length }
}

export function removeMenuAudio() {
    let removed = false
    for (const file of [DATA, META]) {
        if (fs.existsSync(file)) { fs.rmSync(file, { force: true }); removed = true }
    }
    return removed
}

export async function sendMenuAudio(conn, chat, quoted) {
    const audio = getMenuAudioInfo()
    if (!audio) return false
    try {
        await conn.sendMessage(chat, {
            audio: audio.buffer,
            mimetype: audio.mimetype,
            ptt: audio.ptt
        }, { quoted, upload: conn.waUploadToServer })
        return true
    } catch (err) {
        console.error('[MENU AUDIO] kirim audio gagal:', err?.message || err)
        return false
    }
}
