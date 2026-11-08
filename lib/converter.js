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

import { spawn } from 'child_process'
import { promises as fsp } from 'fs'
import { randomUUID } from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import { fileTypeFromBuffer } from 'file-type'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TMP_DIR = path.join(__dirname, '..', 'tmp')

export const WAVEFORM_POINTS = 64
const DECODE_MODULE_MAX_BYTES = 8 * 1024 * 1024
const FFMPEG_TIMEOUT_MS = 180_000

export async function ffmpeg(buffer, args = [], ext = 'bin', ext2 = 'bin') {
    if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('ffmpeg: buffer kosong')
    await fsp.mkdir(TMP_DIR, { recursive: true })
    const id = randomUUID()
    const input = path.join(TMP_DIR, `${id}.${ext}`)
    const output = path.join(TMP_DIR, `${id}.out.${ext2}`)
    await fsp.writeFile(input, buffer)

    try {
        await new Promise((resolve, reject) => {
            const proc = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', input, ...args, output], { stdio: ['ignore', 'ignore', 'pipe'] })
            let stderr = ''
            proc.stderr.on('data', d => { if (stderr.length < 4000) stderr += d })
            const timer = setTimeout(() => proc.kill('SIGKILL'), FFMPEG_TIMEOUT_MS)
            proc.on('error', err => { clearTimeout(timer); reject(err.code === 'ENOENT' ? new Error('ffmpeg tidak terpasang') : err) })
            proc.on('close', code => {
                clearTimeout(timer)
                code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}: ${stderr.trim().split('\n').pop() || 'tanpa pesan'}`))
            })
        })
        const data = await fsp.readFile(output)
        if (!data.length) throw new Error('ffmpeg: output kosong')
        return { data, filename: output, delete: () => fsp.unlink(output).catch(() => { }) }
    } catch (e) {
        await fsp.unlink(output).catch(() => { })
        throw e
    } finally {
        await fsp.unlink(input).catch(() => { })
    }
}

async function run(buffer, args, ext, ext2) {
    const out = await ffmpeg(buffer, args, ext, ext2)
    await out.delete()
    return out.data
}

async function sniffExt(buffer) {
    const t = await fileTypeFromBuffer(buffer).catch(() => null)
    return t?.ext || 'bin'
}

export function isOggOpus(buffer) {
    return Buffer.isBuffer(buffer) && buffer.length > 36
        && buffer.toString('latin1', 0, 4) === 'OggS'
        && buffer.toString('latin1', 0, 128).includes('OpusHead')
}

export async function toPTT(buffer, ext) {
    ext ||= await sniffExt(buffer)
    return ffmpeg(buffer, ['-vn', '-map_metadata', '-1', '-c:a', 'libopus', '-b:a', '96k', '-vbr', 'on', '-ac', '1', '-ar', '48000', '-application', 'audio'], ext, 'ogg')
}

export async function toAudio(buffer, ext) {
    ext ||= await sniffExt(buffer)
    return ffmpeg(buffer, ['-vn', '-map_metadata', '-1', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on', '-compression_level', '10'], ext, 'opus')
}

export async function toVideo(buffer, ext) {
    ext ||= await sniffExt(buffer)
    return ffmpeg(buffer, ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-movflags', '+faststart'], ext, 'mp4')
}

const AUDIO_CODECS = {
    opus: { args: b => ['-c:a', 'libopus', '-b:a', b, '-vbr', 'on', '-compression_level', '10'], ext: 'opus' },
    mp3: { args: b => ['-c:a', 'libmp3lame', '-b:a', b], ext: 'mp3' },
    aac: { args: b => ['-c:a', 'aac', '-b:a', b], ext: 'm4a' }
}

export async function compressAudio(buffer, { codec = 'opus', bitrate = '64k', mono = false, sampleRate } = {}) {
    const c = AUDIO_CODECS[codec]
    if (!c) throw new Error(`compressAudio: codec "${codec}" tidak didukung (${Object.keys(AUDIO_CODECS).join(', ')})`)
    const args = ['-vn', '-map_metadata', '-1', ...c.args(bitrate)]
    if (mono) args.push('-ac', '1')
    if (sampleRate) args.push('-ar', String(sampleRate))
    const data = await run(buffer, args, await sniffExt(buffer), c.ext)
    return { data, ext: c.ext, ratio: data.length / buffer.length }
}

export async function compressVideo(buffer, { crf = 28, maxHeight = 720, preset = 'veryfast', audioBitrate = '96k', fps } = {}) {
    const vf = [`scale=-2:'min(${maxHeight},ih)'`]
    if (fps) vf.push(`fps=${fps}`)
    const args = ['-c:v', 'libx264', '-preset', preset, '-crf', String(crf), '-vf', vf.join(','), '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', audioBitrate, '-movflags', '+faststart']
    const data = await run(buffer, args, await sniffExt(buffer), 'mp4')
    return { data, ext: 'mp4', ratio: data.length / buffer.length }
}

export async function compressImage(buffer, { quality = 75, maxSize = 1280, format = 'jpg' } = {}) {
    const scale = `scale='if(gt(iw,ih),min(${maxSize},iw),-2)':'if(gt(iw,ih),-2,min(${maxSize},ih))'`
    const args = format === 'webp'
        ? ['-vf', scale, '-frames:v', '1', '-c:v', 'libwebp', '-quality', String(quality)]
        : ['-vf', scale, '-frames:v', '1', '-q:v', String(Math.max(2, Math.round(31 - quality * 0.29)))]
    const ext = format === 'webp' ? 'webp' : 'jpg'
    const data = await run(buffer, args, await sniffExt(buffer), ext)
    return { data, ext, ratio: data.length / buffer.length }
}

let decoderPromise
function loadDecoder() {
    decoderPromise ??= (async () => {
        for (const name of ['audio-decode', '@audio/decode']) {
            try {
                const mod = await import(name)
                const fn = typeof mod.default === 'function' ? mod.default : (mod.decode ?? mod.default?.decode)
                if (typeof fn === 'function') return fn
            } catch {}
        }
        return null
    })()
    return decoderPromise
}

function extractChannels(decoded) {
    let channels = []
    if (Array.isArray(decoded?.channelData)) channels = decoded.channelData
    else if (ArrayBuffer.isView(decoded?.channelData)) channels = [decoded.channelData]
    else if (typeof decoded?.getChannelData === 'function' && decoded?.numberOfChannels) {
        channels = Array.from({ length: decoded.numberOfChannels }, (_, i) => decoded.getChannelData(i))
    }
    channels = channels.filter(c => c && c.length > 0)
    const sampleRate = Number(decoded?.sampleRate)
    if (!channels.length || !(sampleRate > 0)) throw new Error('decoder: sampel/sample rate tidak terbaca')
    return { channels, sampleRate }
}

function buildWaveform(channels) {
    const total = Math.max(...channels.map(c => c.length))
    const block = total / WAVEFORM_POINTS
    const avg = new Float64Array(WAVEFORM_POINTS)
    let peak = 0
    for (let i = 0; i < WAVEFORM_POINTS; i++) {
        const start = Math.floor(i * block)
        const end = Math.min(total, Math.max(start + 1, Math.floor((i + 1) * block)))
        let sum = 0, n = 0
        for (const ch of channels) {
            for (let s = start; s < end && s < ch.length; s++) {
                const v = ch[s]
                if (Number.isFinite(v)) { sum += Math.abs(v); n++ }
            }
        }
        avg[i] = n ? sum / n : 0
        if (avg[i] > peak) peak = avg[i]
    }
    const waveform = new Uint8Array(WAVEFORM_POINTS)
    if (peak > 0) for (let i = 0; i < WAVEFORM_POINTS; i++) waveform[i] = Math.max(0, Math.min(100, Math.round((avg[i] / peak) * 100)))
    return { waveform, total }
}

async function decodeViaFfmpeg(buffer) {
    const out = await ffmpeg(buffer, ['-vn', '-ac', '1', '-ar', '8000', '-f', 'f32le', '-acodec', 'pcm_f32le'], await sniffExt(buffer), 'f32le')
    await out.delete()
    const pcm = out.data
    const aligned = pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.length - (pcm.length % 4))
    return { channels: [new Float32Array(aligned)], sampleRate: 8000 }
}

/**
 * Waveform VN dari buffer audio apa pun (mp3/ogg/opus/m4a/wav/…).
 * @returns {Promise<{ waveform: Uint8Array, seconds: number }>}
 */
export async function generateWaveform(buffer) {
    if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('generateWaveform: buffer audio kosong')

    let decoded = null
    const decode = buffer.length <= DECODE_MODULE_MAX_BYTES ? await loadDecoder() : null
    if (decode) {
        try {
            const raw = await decode(buffer)
            const { channels, sampleRate } = extractChannels(raw)
            const dur = Number(raw?.duration)
            decoded = { channels, seconds: dur > 0 ? dur : Math.max(...channels.map(c => c.length)) / sampleRate }
        } catch {}
    }
    if (!decoded) {
        const { channels, sampleRate } = await decodeViaFfmpeg(buffer)
        decoded = { channels, seconds: channels[0].length / sampleRate }
    }

    const { waveform } = buildWaveform(decoded.channels)
    return { waveform, seconds: Math.max(1, Math.round(decoded.seconds)) }
}

async function audioMimetype(buffer) {
    if (isOggOpus(buffer)) return 'audio/ogg; codecs=opus'
    const t = await fileTypeFromBuffer(buffer).catch(() => null)
    if (t?.mime?.startsWith('audio/')) return t.mime === 'audio/opus' ? 'audio/ogg; codecs=opus' : t.mime
    return 'audio/mpeg'
}

/**
 * Lengkapi pesan audio sebelum dikirim: waveform + durasi SELALU ada.
 * - ptt true  : pastikan ogg/opus (sudah opus → TIDAK di-encode ulang, jadi tanpa penurunan kualitas).
 * - ptt false : isi audio dibiarkan apa adanya (tanpa kompres), hanya ditambah waveform/seconds.
 * @param {{ audio: Buffer, ptt?: boolean, mimetype?: string, waveform?: Uint8Array, seconds?: number }} msg
 */
export async function prepareAudioMessage(msg) {
    let audio = msg.audio
    if (!Buffer.isBuffer(audio) || !audio.length) throw new Error('prepareAudioMessage: audio harus Buffer')

    let mimetype = msg.mimetype
    if (msg.ptt) {
        if (!isOggOpus(audio)) {
            const out = await toPTT(audio)
            audio = out.data
            await out.delete()
        }
        mimetype = 'audio/ogg; codecs=opus'
    } else {
        mimetype ||= await audioMimetype(audio)
    }

    let { waveform, seconds } = msg
    if (!waveform || !seconds) {
        const gen = await generateWaveform(audio)
        waveform ||= gen.waveform
        seconds ||= gen.seconds
    }
    return { audio, mimetype, waveform, seconds }
}
