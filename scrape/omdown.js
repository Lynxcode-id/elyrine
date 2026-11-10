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

// Scrape by lynx decode
// Dont change credits !

import axios from 'axios'

const BASE_URL = 'https://www.omdown.site'
const DEFAULT_ACTION_ID = '70bdf567b035b52eef5ff3bc5200fe2a46704cd1e2'
const ROUTER_STATE = '%5B%22%22%2C%7B%22children%22%3A%5B%5B%22locale%22%2C%22id%22%2C%22d%22%2Cnull%5D%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2Cnull%2Cnull%2C4096%5D%7D%2Cnull%2Cnull%2C4112%5D%7D%2Cnull%2Cnull%2C4112%5D'
const UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
const LANG = 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'

const MAX_SIZE = 80 * 1024 * 1024
const MAX_PHOTOS = 20
const COOKIE_TTL = 10 * 60 * 1000

const PLATFORMS = [
  [/(^|\.)tiktok\.com$/i, 'TikTok'],
  [/(^|\.)douyin\.com$/i, 'Douyin'],
  [/(^|\.)(instagram\.com|instagr\.am)$/i, 'Instagram'],
  [/(^|\.)(facebook\.com|fb\.watch|fb\.com)$/i, 'Facebook'],
  [/(^|\.)(youtube\.com|youtu\.be)$/i, 'YouTube'],
  [/(^|\.)(twitter\.com|x\.com|t\.co)$/i, 'Twitter'],
  [/(^|\.)threads\.(net|com)$/i, 'Threads'],
  [/(^|\.)(pinterest\.[a-z.]+|pin\.it)$/i, 'Pinterest'],
  [/(^|\.)snapchat\.com$/i, 'Snapchat'],
  [/(^|\.)reddit\.com$/i, 'Reddit'],
  [/(^|\.)(capcut\.com)$/i, 'CapCut'],
  [/(^|\.)(likee\.video|likee\.com)$/i, 'Likee'],
  [/(^|\.)soundcloud\.com$/i, 'SoundCloud'],
  [/(^|\.)spotify\.com$/i, 'Spotify'],
  [/(^|\.)vimeo\.com$/i, 'Vimeo'],
  [/(^|\.)bilibili\.(com|tv)$/i, 'Bilibili'],
  [/(^|\.)dailymotion\.com$/i, 'Dailymotion'],
  [/(^|\.)twitch\.tv$/i, 'Twitch'],
  [/(^|\.)tumblr\.com$/i, 'Tumblr']
]

const detectPlatform = (url) => {
  let host = ''
  try { host = new URL(url).hostname } catch { return null }
  for (const [re, name] of PLATFORMS) if (re.test(host)) return name
  const base = host.replace(/^www\./, '').split('.')[0]
  return base ? base[0].toUpperCase() + base.slice(1) : null
}

function parseRSC(buf) {
  const rows = {}
  let pos = 0
  while (pos < buf.length) {
    const colon = buf.indexOf(0x3a, pos)
    if (colon === -1) break
    const id = buf.toString('utf8', pos, colon)
    if (!/^[0-9a-f]+$/i.test(id)) {
      const nl = buf.indexOf(0x0a, pos)
      if (nl === -1) break
      pos = nl + 1
      continue
    }
    pos = colon + 1
    if (buf[pos] === 0x54) {
      const comma = buf.indexOf(0x2c, pos)
      const len = parseInt(buf.toString('utf8', pos + 1, comma), 16)
      const start = comma + 1
      rows[id] = buf.subarray(start, start + len).toString('utf8')
      pos = start + len
    } else {
      let nl = buf.indexOf(0x0a, pos)
      if (nl === -1) nl = buf.length
      rows[id] = buf.toString('utf8', pos, nl)
      pos = nl + 1
    }
  }
  return rows
}

function resolveRefs(node, rows) {
  if (typeof node === 'string') {
    if (node === '$undefined') return undefined
    const m = node.match(/^\$([0-9a-f]+)$/i)
    if (m && rows[m[1]] !== undefined) return rows[m[1]]
    return node
  }
  if (Array.isArray(node)) return node.map(n => resolveRefs(n, rows))
  if (node && typeof node === 'object') {
    const out = {}
    for (const k of Object.keys(node)) out[k] = resolveRefs(node[k], rows)
    return out
  }
  return node
}

function findResult(rows) {
  for (const id of Object.keys(rows)) {
    const val = rows[id]
    if (typeof val !== 'string' || val[0] !== '{') continue
    try {
      const obj = JSON.parse(val)
      if (obj && obj.success !== undefined) return resolveRefs(obj, rows)
    } catch { }
  }
  return null
}

let cookieCache = { value: '', at: 0 }
let actionCache = null

async function getCookies(force = false) {
  if (process.env.OMDOWN_COOKIE) return process.env.OMDOWN_COOKIE
  if (!force && cookieCache.value && Date.now() - cookieCache.at < COOKIE_TTL) return cookieCache.value
  try {
    const r = await axios.get(BASE_URL + '/id', {
      timeout: 30000,
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': LANG }
    })
    const value = (r.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ')
    cookieCache = { value, at: Date.now() }
    return value
  } catch {
    return cookieCache.value || ''
  }
}

async function discoverActionId() {
  try {
    const { data: html } = await axios.get(BASE_URL + '/id', { timeout: 30000, headers: { 'User-Agent': UA, 'Accept-Language': LANG } })
    const srcs = [...String(html).matchAll(/\/_next\/static\/[^"'\s]+?\.js/g)].map(m => m[0])
    const uniq = [...new Set(srcs)].slice(0, 25)
    for (const s of uniq) {
      try {
        const { data: js } = await axios.get(BASE_URL + s, { timeout: 30000, headers: { 'User-Agent': UA }, responseType: 'text' })
        const m = String(js).match(/createServerReference\)?\(\s*["']([0-9a-f]{40,})["']/)
        if (m) return m[1]
      } catch { }
    }
  } catch { }
  return null
}

const currentActionId = () => actionCache || global.omdownActionId || process.env.OMDOWN_ACTION_ID || DEFAULT_ACTION_ID

async function callOmdown(url, platform, actionId, cookie) {
  const res = await axios.post(BASE_URL + '/', JSON.stringify([url, platform, 'id']), {
    timeout: 60000,
    headers: {
      Accept: 'text/x-component',
      'Accept-Language': LANG,
      'Content-Type': 'text/plain;charset=UTF-8',
      'next-action': actionId,
      'next-router-state-tree': ROUTER_STATE,
      Origin: BASE_URL,
      Referer: BASE_URL + '/id',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Ch-Ua-Mobile': '?1',
      'Sec-Ch-Ua-Platform': '"Android"',
      'User-Agent': UA,
      ...(cookie ? { Cookie: cookie } : {})
    },
    responseType: 'arraybuffer',
    validateStatus: () => true
  })
  return findResult(parseRSC(Buffer.from(res.data)))
}

async function scrape(url, platform) {
  let cookie = await getCookies()
  let result = await callOmdown(url, platform, currentActionId(), cookie)

  if (!result) {
    cookie = await getCookies(true)
    const fresh = await discoverActionId()
    if (fresh) { actionCache = fresh; global.omdownActionId = fresh }
    result = await callOmdown(url, platform, currentActionId(), cookie)
  }

  if (!result) throw new Error('Hasil tidak terbaca (next-action omdown kemungkinan berubah).')
  if (!result.success) throw new Error(result.error || result.message || 'Omdown menolak link ini.')
  return { data: result.data || {}, cookie }
}

const IMG_EXT = /^(jpe?g|png|webp|heic)$/i
const AUD_EXT = /^(mp3|m4a|aac|ogg|opus|wav)$/i
const WM = /(dengan|with)\s*watermark/i
const NOWM = /(tanpa|no|without)\s*watermark/i

const toAbs = (u) => (typeof u === 'string' && u.startsWith('/') ? BASE_URL + u : u)

function classify(f) {
  const kind = String(f.kind || '').toLowerCase()
  const ext = String(f.ext || '').toLowerCase()
  if (kind === 'image' || kind === 'photo' || IMG_EXT.test(ext)) return 'image'
  if (kind === 'audio' || AUD_EXT.test(ext)) return 'audio'
  if (kind === 'file') return null
  return 'video'
}

function pickMedia(data) {
  const formats = (data.formats || []).filter(f => f && f.downloadUrl && f.kind !== 'file')
  const groups = { video: [], audio: [], image: [] }
  for (const f of formats) {
    const c = classify(f)
    if (c) groups[c].push({ ...f, downloadUrl: toAbs(f.downloadUrl) })
  }

  const score = f => (NOWM.test(f.label || '') ? 0 : WM.test(f.label || '') ? 2 : 1)
  groups.video.sort((a, b) => score(a) - score(b))

  groups.audio.sort((a, b) => (/sound|musik|music/i.test(b.label || '') ? 1 : 0) - (/sound|musik|music/i.test(a.label || '') ? 1 : 0))

  const photoUrls = groups.image.map(f => f.downloadUrl)
  for (const key of ['images', 'photos', 'slides', 'pictures']) {
    if (!Array.isArray(data[key])) continue
    for (const p of data[key]) {
      const u = typeof p === 'string' ? p : (p?.downloadUrl || p?.download_url || p?.url || p?.preview)
      if (u) photoUrls.push(toAbs(u))
    }
  }
  const photos = [...new Set(photoUrls)].slice(0, MAX_PHOTOS)

  return { videos: groups.video, audios: groups.audio, photos }
}

async function fetchBuffer(url, cookie, kind) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 120000,
    maxContentLength: MAX_SIZE,
    maxBodyLength: MAX_SIZE,
    headers: {
      'User-Agent': UA,
      Accept: '*/*',
      'Accept-Language': LANG,
      Referer: BASE_URL + '/id',
      Range: 'bytes=0-',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Dest': kind === 'audio' ? 'audio' : kind === 'image' ? 'image' : 'video',
      ...(cookie ? { Cookie: cookie } : {})
    },
    validateStatus: s => s === 200 || s === 206
  })
  const buf = Buffer.from(res.data)
  if (buf.length < 512) throw new Error('File kosong / terlalu kecil.')
  return buf
}

async function firstValid(list, cookie, kind) {
  let lastErr
  for (const f of list) {
    try { return { buf: await fetchBuffer(f.downloadUrl, cookie, kind), fmt: f } } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('Tidak ada format yang bisa diunduh.')
}

export { detectPlatform, fetchBuffer, firstValid, MAX_PHOTOS }

export async function omdown(url) {
  const platform = detectPlatform(url)
  if (!platform) throw new Error('Link tidak valid.')
  const { data, cookie } = await scrape(url, platform)
  return { platform, data, cookie, ...pickMedia(data) }
}

export default omdown
