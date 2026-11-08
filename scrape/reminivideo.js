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

/**
 * Name : Remini Video HD
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Type : Scraper (ESM)
 * Description : meningkatkan kualitas video (upscale + denoise + sharpen) via ffmpeg
 *
 * enhance(inputPath, { outDir, maxDuration, maxSide }) →
 *   sukses: { status: true, enhanced_video, output_filename, original_resolution, output_resolution,
 *             original_size, output_size, original_duration, enhancement_scale, processing_time, ... }
 *   gagal : { status: false, error }
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_OUT = path.join(ROOT, '..', 'store', 'reminivideo')
const FFMPEG_TIMEOUT_MS = Number(process.env.REMINI_V2_FFMPEG_TIMEOUT || 10 * 60 * 1000)
const ENHANCE_ATTEMPTS = Number(process.env.REMINI_V2_ENHANCE_ATTEMPTS || 2)

const sleep = ms => new Promise(r => setTimeout(r, ms))
const log = (tag, msg) => console.error(`[reminivideo][${tag}] ${msg}`)

function fmtBytes(b) {
  b = Number(b) || 0
  if (b >= 1073741824) return (b / 1073741824).toFixed(2) + ' GB'
  if (b >= 1048576) return (b / 1048576).toFixed(2) + ' MB'
  return (b / 1024).toFixed(2) + ' KB'
}

function fmtMmss(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0))
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')
}

async function withRetry(label, attempts, fn) {
  let lastErr
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn(i)
    } catch (e) {
      lastErr = e
      if (i < attempts) {
        log('retry', `${label} gagal (${i}/${attempts}): ${e.message}`)
        await sleep(1000 * i)
      }
    }
  }
  throw lastErr || new Error(label + ' failed')
}

let ffmpegBin = null
let ffprobeBin = null

function which(name) {
  try {
    const w = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], { encoding: 'utf8' })
    return (w.stdout || '').split('\n').map(s => s.trim()).find(s => s && fs.existsSync(s)) || null
  } catch {
    return null
  }
}

async function getFfmpeg() {
  if (ffmpegBin) return ffmpegBin
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) return (ffmpegBin = process.env.FFMPEG_PATH)
  try {
    const mod = await import('@ffmpeg-installer/ffmpeg')
    const p = (mod.default || mod).path
    if (p && fs.existsSync(p)) return (ffmpegBin = p)
  } catch {}
  ffmpegBin = which('ffmpeg')
  if (!ffmpegBin) throw new Error('ffmpeg tidak ditemukan (pasang ffmpeg atau @ffmpeg-installer/ffmpeg)')
  return ffmpegBin
}

function getFfprobe() {
  if (ffprobeBin !== null) return ffprobeBin || null
  if (process.env.FFPROBE_PATH && fs.existsSync(process.env.FFPROBE_PATH)) return (ffprobeBin = process.env.FFPROBE_PATH)
  ffprobeBin = which('ffprobe') || ''
  return ffprobeBin || null
}

function run(bin, args, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = '', err = ''
    child.stdout.on('data', d => (out += d))
    child.stderr.on('data', d => (err += d))
    child.on('error', reject)
    const t = setTimeout(() => { try { child.kill('SIGKILL') } catch {} ; reject(new Error('timeout')) }, timeout)
    child.on('close', code => { clearTimeout(t); resolve({ code, out, err }) })
  })
}

const parseFps = s => {
  const m = String(s || '').match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/)
  const v = m ? Number(m[1]) / (Number(m[2]) || 1) : Number(s)
  return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null
}

async function probeWithFfprobe(bin, file) {
  const { out } = await run(bin, ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,avg_frame_rate,r_frame_rate,duration', '-show_entries', 'format=duration', '-of', 'json', file])
  const j = JSON.parse(out || '{}')
  const streams = j.streams || []
  const v = streams.find(s => s.codec_type === 'video')
  if (!v) throw new Error('tidak ada video stream')
  return {
    width: Number(v.width), height: Number(v.height),
    duration: Number(v.duration || (j.format && j.format.duration)) || null,
    fps: parseFps(v.avg_frame_rate) || parseFps(v.r_frame_rate),
    audio: streams.some(s => s.codec_type === 'audio')
  }
}

async function probeWithFfmpeg(file) {
  const { err } = await run(await getFfmpeg(), ['-hide_banner', '-i', file])
  const d = err.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/)
  const v = err.match(/Video:.*?,\s*(\d{2,5})x(\d{2,5})/)
  if (!v) throw new Error('tidak ada video stream')
  const f = err.match(/(\d+(?:\.\d+)?)\s*fps/)
  return {
    width: Number(v[1]), height: Number(v[2]),
    duration: d ? Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]) : null,
    fps: f ? Number(f[1]) : null,
    audio: /Audio:/.test(err)
  }
}

async function probeVideoFile(file) {
  const bin = getFfprobe()
  let meta = null
  if (bin) {
    try { meta = await probeWithFfprobe(bin, file) } catch (e) { log('probe', 'ffprobe gagal: ' + e.message) }
  }
  if (!meta) meta = await probeWithFfmpeg(file)
  if (!meta.width || !meta.height) throw new Error('metadata video tidak valid')
  return meta
}

function runFfmpeg(bin, input, output, filter, meta) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y', '-hide_banner', '-nostdin', '-loglevel', 'error',
      '-i', input, '-vf', filter,
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
      ...(meta.audio ? ['-c:a', 'aac', '-b:a', '128k'] : ['-an']),
      '-movflags', '+faststart', output
    ]
    const child = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let err = ''
    child.stderr.on('data', d => { err += d; if (err.length > 4000) err = err.slice(-2000) })
    child.on('error', reject)
    const t = setTimeout(() => { try { child.kill('SIGKILL') } catch {} ; reject(new Error('ffmpeg timeout')) }, FFMPEG_TIMEOUT_MS)
    child.on('close', code => {
      clearTimeout(t)
      if (code === 0 && fs.existsSync(output) && fs.statSync(output).size > 1024) resolve()
      else reject(new Error(`ffmpeg exit ${code}: ${err.trim().split('\n').pop().slice(0, 200)}`))
    })
  })
}

async function localEnhance(input, output, meta, maxSide) {
  const bin = await getFfmpeg()
  const factor = Math.min(2, maxSide / Math.max(meta.width, meta.height))
  const scale = factor > 1.05
    ? `scale=trunc(iw*${factor.toFixed(3)}/2)*2:trunc(ih*${factor.toFixed(3)}/2)*2:flags=lanczos`
    : 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
  const chains = [
    `${scale},hqdn3d=1:0.8:6:6,unsharp=5:5:0.8:5:5:0.4,eq=contrast=1.06:saturation=1.10:brightness=0.02`,
    `${scale},unsharp=5:5:0.8:5:5:0.4`,
    scale
  ]
  let lastErr
  for (let i = 0; i < chains.length; i++) {
    try {
      await runFfmpeg(bin, input, output, chains[i], meta)
      return { upscaled: factor > 1.05 }
    } catch (e) {
      lastErr = e
      log('engine', `filter #${i + 1} gagal: ${e.message}`)
      try { fs.unlinkSync(output) } catch {}
    }
  }
  throw lastErr || new Error('semua filter ffmpeg gagal')
}

export async function enhance(inputPath, opts = {}) {
  const started = Date.now()
  const outDir = opts.outDir || DEFAULT_OUT
  const maxDuration = opts.maxDuration || 0
  const maxSide = opts.maxSide || 1920
  const job_id = `video_enhance_${Date.now().toString(36)}`

  try {
    if (!inputPath || !fs.existsSync(inputPath)) throw new Error('file input tidak ditemukan')
    const inStat = fs.statSync(inputPath)
    const meta = await probeVideoFile(inputPath)
    if (maxDuration && meta.duration && meta.duration > maxDuration) {
      throw new Error(`durasi video ${fmtMmss(meta.duration)} melebihi batas ${fmtMmss(maxDuration)}`)
    }

    fs.mkdirSync(outDir, { recursive: true })
    const base = path.basename(inputPath).replace(/\.[^.]+$/, '')
    const output_filename = `${base}_hd.mp4`
    const outPath = path.join(outDir, output_filename)
    try { fs.unlinkSync(outPath) } catch {}

    const eng = await withRetry('enhance', ENHANCE_ATTEMPTS, () => localEnhance(inputPath, outPath, meta, maxSide))

    const outStat = fs.statSync(outPath)
    const outMeta = await probeVideoFile(outPath)
    if (eng.upscaled && outMeta.width <= meta.width) throw new Error('output tidak ter-upscale')

    return {
      status: true,
      feature: 'AI Video Enhancer',
      enhanced_video: path.resolve(outPath),
      output_filename,
      original_size: fmtBytes(inStat.size),
      output_size: fmtBytes(outStat.size),
      original_resolution: `${meta.width}x${meta.height}`,
      output_resolution: `${outMeta.width}x${outMeta.height}`,
      original_duration: fmtMmss(meta.duration),
      output_duration: fmtMmss(outMeta.duration),
      original_fps: meta.fps,
      output_fps: outMeta.fps,
      enhancement_scale: `${Math.round((outMeta.width / meta.width) * 100) / 100}x`,
      processing_time: `${((Date.now() - started) / 1000).toFixed(1)}s`,
      job_id,
      error: null
    }
  } catch (e) {
    return { status: false, feature: 'AI Video Enhancer', job_id, error: String((e && e.message) || e), processing_time: `${((Date.now() - started) / 1000).toFixed(1)}s` }
  }
}

export default enhance
