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

import { randomBytes } from 'crypto'
import { generateWAMessageContent } from 'elyrine-baileys'
import { toPTT } from './converter.js'

const DEFAULTS = { delayJpm: 3000, delayJpmTag: 3000, delayAutoSwgc: 60000, delayPushKontak: 2000 }
export const MIN_INTERVAL = 5000

const sleep = ms => new Promise(r => setTimeout(r, ms))
const store = () => (global.db.data.jpm ||= { cfg: {}, blacklist: [], blAuto: [] })
const save = () => global.db.write?.().catch(() => { })

export const cfg = () => ({ ...DEFAULTS, ...(store().cfg || {}) })
export const setCfg = (key, value) => {
    const s = store()
    s.cfg = { ...(s.cfg || {}), [key]: value }
    save()
}

export const jobs = () => (global.__jpmJobs ||= { autoJpm: null, autoJpmTag: null, autoSwgc: null, pushRunning: false })
export const blacklist = auto => [...(store()[auto ? 'blAuto' : 'blacklist'] || [])]
export const setBlacklist = (auto, list) => {
    store()[auto ? 'blAuto' : 'blacklist'] = [...new Set(list)]
    save()
}

export function parseInterval(raw) {
    const mt = String(raw || '').toLowerCase().match(/^(\d+(?:\.\d+)?)(ms|s|m|h)?$/)
    if (!mt) return null
    return Math.round(parseFloat(mt[1]) * { ms: 1, s: 1e3, m: 6e4, h: 36e5 }[mt[2] || 'ms'])
}

export function splitInterval(text, fallbackMs = 60000) {
    const t = String(text || '').trim()
    const first = t.split(/\s+/)[0] || ''
    const ms = parseInterval(first)
    return ms === null ? { interval: fallbackMs, teks: t } : { interval: ms, teks: t.slice(first.length).trim() }
}

export async function groups(conn, { auto = false } = {}) {
    const all = await conn.groupFetchAllParticipating()
    const skip = new Set([...blacklist(false), ...(auto ? blacklist(true) : [])])
    return Object.values(all).filter(g => !global.db.data.chats[g.id]?.isBanned && !skip.has(g.id))
}

export function tagList(meta) {
    const mentions = (meta.participants || []).map(p => p.id)
    return { mentions, text: mentions.map(id => `@${String(id).split('@')[0].split(':')[0]}`).join(' ') }
}

const KIND = { imageMessage: 'image', videoMessage: 'video', audioMessage: 'audio', documentMessage: 'document', documentWithCaptionMessage: 'document' }

export async function getMedia(m, kinds = ['image', 'video']) {
    const node = [m.quoted, m].find(n => n && KIND[n.mediaType] && kinds.includes(KIND[n.mediaType]))
    if (!node || typeof node.download !== 'function') return null
    const info = node.msg || node.mediaMessage?.[node.mediaType] || {}
    const buffer = await node.download()
    if (!buffer) return null
    return { kind: KIND[node.mediaType], buffer, mime: info.mimetype || '', fileName: info.fileName || 'file', ptt: !!info.ptt, caption: info.caption || '' }
}

export function mediaContent(media, caption = '', mentions) {
    const c = { [media.kind]: media.buffer }
    if (caption && media.kind !== 'audio') c.caption = caption
    if (media.kind !== 'image') c.mimetype = media.mime
    if (media.kind === 'audio') c.ptt = media.ptt
    if (media.kind === 'document') c.fileName = media.fileName
    if (mentions) c.mentions = mentions
    return c
}

export async function loop(targets, delay, send, isStopped = () => false) {
    let ok = 0
    let fail = 0
    global.__jpmRunning = true
    try {
        for (const t of targets) {
            if (isStopped() || global.__jpmStop) break
            try { await send(t); ok++ } catch (e) { fail++; console.error('[JPM]', e?.message || e) }
            await sleep(delay)
        }
    } finally {
        global.__jpmRunning = false
        global.__jpmStop = false
    }
    return { ok, fail }
}

export function startJob(name, ms, tick) {
    const all = jobs()
    stopJob(name)
    let busy = false
    const job = { ms, startedAt: Date.now(), timer: null }
    job.timer = setInterval(async () => {
        if (busy) return
        busy = true
        try { await tick(() => all[name] !== job) } catch (e) { console.error(`[JPM:${name}]`, e?.message || e) } finally { busy = false }
    }, ms)
    all[name] = job
    return job
}

export function stopJob(name) {
    const all = jobs()
    const job = all[name]
    if (!job) return false
    clearInterval(job.timer)
    all[name] = null
    return true
}

const COLORS = [0x1E88E5, 0x25D366, 0xFFD600, 0xFF9800, 0xE53935, 0x8E24AA, 0x9E9E9E, 0x000000, 0x00BCD4]
const NODE = { image: 'imageMessage', video: 'videoMessage', audio: 'audioMessage' }

export async function sendGroupStatus(conn, jid, { text = '', media = null } = {}) {
    let message
    if (media) {
        let payload
        if (media.kind === 'image') payload = { image: media.buffer, caption: text }
        else if (media.kind === 'video') payload = { video: media.buffer, caption: text }
        else if (media.kind === 'audio') {
            const out = await toPTT(media.buffer)
            payload = { audio: out?.data || out, ptt: true, mimetype: 'audio/ogg; codecs=opus' }
        } else throw new Error('Jenis media tidak didukung untuk status grup')
        message = await generateWAMessageContent(payload, { upload: conn.waUploadToServer })
        const node = message[NODE[media.kind]]
        node.contextInfo = { ...(node.contextInfo || {}), isGroupStatus: true }
    } else {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)]
        message = {
            extendedTextMessage: {
                text,
                textArgb: 0xFFFFFFFF,
                backgroundArgb: (0xFF000000 | color) >>> 0,
                font: 7,
                contextInfo: { isGroupStatus: true }
            }
        }
    }
    return conn.relayMessage(jid, { groupStatusMessageV2: { message } }, { messageId: randomBytes(16).toString('hex').toUpperCase() })
}
