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

import { createInterface } from 'node:readline/promises'
import { pathToFileURL } from 'node:url'

export const TIKDOWN_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
export const TIKDOWN_HOST = process.env.TIKDOWN_HOST || 'https://tikdown.com'
export const TIKDOWN_ENGINE = 'TikDown.com (Fresh CSRF + Progress API)'

const CREATOR = 'Lynx API'
const MAX_TRY = 3
const RETRY_DELAY = 3000
const POLL_MAX = 40
const POLL_DELAY = 2500
const TRANSIENT_RETRY = 3
const TRANSIENT_DELAY = 1500

const sleep = ms => new Promise(r => setTimeout(r, ms))
const short = v => String(v ?? '').replace(/\s+/g, ' ').slice(0, 80)

export function absUrl(u, base = TIKDOWN_HOST) {
    const s = String(u ?? '').trim()
    if (!s || s === 'undefined' || s === 'null') return null
    try {
        const url = new URL(s, base)
        return /^https?:$/.test(url.protocol) ? url.href : null
    } catch {
        return null
    }
}

function createSession() {
    const cookies = new Map()
    return {
        cookieStr: () => [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; '),
        set: (k, v) => cookies.set(k, v),
        save(res) {
            const list = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : []
            for (const c of list) {
                const [pair] = c.split(';')
                const i = pair.indexOf('=')
                if (i > 0) cookies.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim())
            }
        }
    }
}

async function getToken(session) {
    const res = await fetch(`${TIKDOWN_HOST}/id`, {
        headers: {
            'User-Agent': TIKDOWN_UA,
            'Accept': 'text/html,application/xhtml+xml,*/*',
            'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        },
        signal: AbortSignal.timeout(15000),
        redirect: 'follow'
    })
    session.save(res)
    if (!res.ok) throw new Error(`Halaman TikDown HTTP ${res.status}`)
    const html = await res.text()

    const pick = re => (html.match(re) || [])[1] || null
    const token =
        pick(/<meta[^>]+name=["']csrf(?:-token)?["'][^>]*content=["']([^"']+)["']/i) ||
        pick(/<meta[^>]+content=["']([^"']+)["'][^>]*name=["']csrf(?:-token)?["']/i) ||
        pick(/<input[^>]+name=["']csrf_?[tT]oken["'][^>]*value=["']([^"']+)["']/i) ||
        pick(/<input[^>]+value=["']([^"']+)["'][^>]*name=["']csrf_?[tT]oken["']/i) ||
        pick(/csrf[\w-]*["']?\s*[:=]\s*["']([a-f0-9]{32,64})["']/i)

    if (!token) throw new Error('CSRF token tidak ditemukan (format halaman berubah).')
    session.set('csrfToken', token)
    return token
}

async function api(session, path, body, token) {
    const res = await fetch(`${TIKDOWN_HOST}/api/${path}`, {
        method: 'POST',
        headers: {
            'User-Agent': TIKDOWN_UA,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
            'Cookie': session.cookieStr(),
            'Origin': TIKDOWN_HOST,
            'Referer': `${TIKDOWN_HOST}/id`,
            'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(25000),
        redirect: 'follow'
    })
    session.save(res)
    let data = null
    try { data = JSON.parse(await res.text()) } catch { data = null }
    return { status: res.status, data }
}

async function resolveItem(session, item, token) {
    if (!item.v5Url) {
        if (!item.previewUrl) return null
        const u = absUrl(item.previewUrl)
        if (!u) throw new Error(`previewUrl tidak valid: "${short(item.previewUrl)}"`)
        return u
    }

    let transient = 0
    for (let i = 0; i < POLL_MAX; i++) {
        const r = await api(session, 'progress.php', { v5Url: item.v5Url }, token)
        const d = r.data || {}
        if (d.fileUrl) {
            const u = absUrl(d.fileUrl)
            if (!u) throw new Error(`fileUrl tidak valid: "${short(d.fileUrl)}"`)
            return u
        }
        if (d.status === 'error' || d.status === 'failed') throw new Error(d.message || d.error || 'Proses media gagal.')

        if ([502, 503, 504].includes(r.status)) {
            if (++transient > TRANSIENT_RETRY) throw new Error(`progress HTTP ${r.status}`)
            await sleep(TRANSIENT_DELAY)
            continue
        }
        if (r.status >= 400 && r.status !== 429) throw new Error((d && d.message) || `progress HTTP ${r.status}`)
        await sleep(POLL_DELAY)
    }
    throw new Error('Proses media timeout.')
}

const typeName = t => ({ video: 'Video', audio: 'Audio', image: 'Image' }[t] || 'Media')

function itemLabel(it, n) {
    let q = String(it.quality || '').trim()
    if (!q) q = it.type === 'image' ? `Image ${it.index ?? n}` : typeName(it.type)
    if (it.resolution && !q.includes(String(it.resolution))) q += ` (${it.resolution})`
    return q
}

async function scrapeOnce(targetUrl, log) {
    const session = createSession()

    log('INFO', 'Ambil token CSRF baru dari tikdown.com...')
    const token = await getToken(session)

    log('PROCESS', 'Ekstrak data TikTok...')
    const ex = await api(session, 'extract.php', { url: targetUrl }, token)
    const json = ex.data
    if (!json || json.ok !== true) {
        const msg = json && (json.message || json.error) ? (json.message || json.error) : `HTTP ${ex.status}`
        throw new Error(`Pesan Server: ${msg}`)
    }

    const r = json.result || {}
    const items = r.mediaItems || []
    if (!items.length) throw new Error('Media tidak ditemukan di hasil ekstrak.')

    const downloads = []
    const skipped = []

    for (let n = 0; n < items.length; n++) {
        const it = items[n]
        const label = itemLabel(it, n + 1)
        log('INFO', `Proses ${label}...`)
        try {
            const url = await resolveItem(session, it, token)
            if (!url) throw new Error('URL media kosong')

            const row = {
                quality: label,
                type: it.type,
                extension: it.extension || (it.type === 'audio' ? 'mp3' : it.type === 'image' ? 'jpg' : 'mp4'),
                size: it.fileSize || 'Unknown'
            }
            if (it.duration) row.duration = it.duration
            if (it.type === 'image') row.index = it.index ?? n
            row.url = url
            downloads.push(row)
        } catch (e) {
            log('PROCESS', `Lewati ${label}: ${e.message}`)
            skipped.push(`${label}: ${e.message}`)
        }
    }

    if (!downloads.some(d => d.type === 'video' || d.type === 'image')) {
        throw new Error('Semua media gagal diproses' + (skipped.length ? ` (${skipped.join(' | ')})` : '.'))
    }

    await api(session, 'cooldown.php', { action: 'record' }, token).catch(() => null)
    log('SUCCESS', 'Link berhasil didapat! Merakit output...')

    const u = r.user || {}
    const st = r.stats || {}

    return {
        success: true,
        creator: CREATOR,
        data: {
            id: r.id || '',
            author: u.username || u.name || 'Unknown',
            nickname: u.name || '',
            caption: r.description || r.title || '',
            thumbnail: r.thumbnail || '',
            stats: { views: st.views || '', likes: st.likes || '' },
            link: r.permanentLink || targetUrl,
            total_downloads: downloads.length,
            downloads,
            engine_used: TIKDOWN_ENGINE,
            processed_at: new Date().toISOString()
        }
    }
}

export async function tikdown(targetUrl, { maxTry = MAX_TRY, onLog = null } = {}) {
    const log = (lvl, msg) => { if (typeof onLog === 'function') onLog(lvl, msg) }
    let lastErr
    for (let i = 1; i <= maxTry; i++) {
        try {
            return await scrapeOnce(targetUrl, log)
        } catch (e) {
            lastErr = e
            if (i < maxTry) await sleep(RETRY_DELAY)
        }
    }
    throw lastErr || new Error('Gagal mengambil data TikTok.')
}

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

export function classifyVideo(d) {
    const q = norm(d.quality)
    const noWatermark = /nowatermark|nowm/.test(q) || !q.includes('watermark')
    const isHD = /hd|fhd|uhd|2k|4k/.test(q) || /1080|1440|2160/.test(q)
    return { noWatermark, isHD, score: (noWatermark ? 2 : 0) + (isHD ? 1 : 0) }
}

export async function scrapeTikTok(targetUrl, opts = {}) {
    const { data } = await tikdown(targetUrl, opts)
    const videos = data.downloads.filter(d => d.type === 'video').map(d => {
        const c = classifyVideo(d)
        return { label: d.quality, noWatermark: c.noWatermark, isHD: c.isHD, score: c.score, extension: d.extension, size: d.size, duration: d.duration || '', url: d.url }
    }).sort((a, b) => b.score - a.score)
    const images = data.downloads.filter(d => d.type === 'image').map(d => ({ index: d.index, extension: d.extension, size: d.size, url: d.url }))
        .sort((a, b) => a.index - b.index)
    const a = data.downloads.find(d => d.type === 'audio')
    return {
        id: data.id, author: data.author, nickname: data.nickname, caption: data.caption, thumbnail: data.thumbnail,
        stats: data.stats, link: data.link, videos, images,
        audio: a ? { label: a.quality, extension: a.extension, size: a.size, url: a.url } : null
    }
}

export default scrapeTikTok

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
    let link = process.argv[2]
    if (!link) {
        const rl = createInterface({ input: process.stdin, output: process.stdout })
        link = (await rl.question('> Masukkan Link TikTok: ')).trim()
        rl.close()
    }
    try {
        const res = await tikdown(link, { onLog: (lvl, msg) => console.log(`[${lvl}] ${msg}`) })
        console.log('\n' + JSON.stringify(res, null, 2))
    } catch (e) {
        console.error('[ERROR]', e.message)
        process.exitCode = 1
    }
}
