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

import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import { fileTypeFromBuffer } from 'file-type'
import { baileys, downloadContentFromMessage, generateWAMessageFromContent } from './function.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STORE_DIR = path.join(__dirname, '..', 'store')
const WA_MEDIA_HOST = 'https://mmg.whatsapp.net'

export const REFRESH_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000
const THUMB_FIELDS = [
    'thumbnailDirectPath', 'thumbnailSha256', 'thumbnailEncSha256',
    'mediaKey', 'mediaKeyTimestamp',
    'thumbnailWidth', 'thumbnailHeight', 'mimetype', 'jpegThumbnail'
]
const BYTES_FIELDS = ['thumbnailSha256', 'thumbnailEncSha256', 'mediaKey', 'jpegThumbnail']

if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true })
const db = new Database(path.join(STORE_DIR, 'thumbnail.db'))
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')
db.exec(`
    CREATE TABLE IF NOT EXISTS thumbnails (
        name TEXT NOT NULL,
        jenis TEXT NOT NULL CHECK (jenis IN ('thumbnail', 'favicon')),
        status TEXT NOT NULL DEFAULT 'random' CHECK (status IN ('random', 'private')),
        metadata TEXT NOT NULL,
        expired INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (name, jenis)
    )
`)

const stmtUpsert = db.prepare(`
    INSERT INTO thumbnails (name, jenis, status, metadata, expired, created_at, updated_at)
    VALUES (@name, @jenis, @status, @metadata, @expired, @now, @now)
    ON CONFLICT(name, jenis) DO UPDATE SET
        status = @status, metadata = @metadata, expired = @expired, updated_at = @now
`)
const stmtGet = db.prepare(`SELECT * FROM thumbnails WHERE name = ? AND jenis = ?`)
const stmtRandom = db.prepare(`
    SELECT * FROM thumbnails
    WHERE jenis = ? AND status = 'random' AND (expired IS NULL OR expired > strftime('%s', 'now'))
    ORDER BY RANDOM() LIMIT 1
`)
const stmtList = db.prepare(`SELECT * FROM thumbnails WHERE jenis = ? ORDER BY updated_at DESC`)
const stmtDelete = db.prepare(`DELETE FROM thumbnails WHERE name = ? AND jenis = ?`)

export function saveThumb({ name, jenis, status = 'random', metadata, expired = null }) {
    if (!name || !jenis || !metadata) return null
    const safeStatus = jenis === 'favicon' ? 'random' : (status === 'private' ? 'private' : 'random')
    const clean = String(name).trim()
    stmtUpsert.run({
        name: clean, jenis, status: safeStatus,
        metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
        expired, now: Math.floor(Date.now() / 1000)
    })
    return { name: clean, jenis, status: safeStatus }
}

export function getThumb(name, jenis) {
    const row = stmtGet.get(String(name).trim(), jenis)
    if (!row) return null
    row.metadata = JSON.parse(row.metadata)
    return row
}

export function getRandomThumb(jenis) {
    const row = stmtRandom.get(jenis)
    if (!row) return null
    row.metadata = JSON.parse(row.metadata)
    return row
}

export function listThumbs(jenis) {
    return stmtList.all(jenis).map(row => ({ ...row, metadata: undefined }))
}

export function deleteThumb(name, jenis) {
    return stmtDelete.run(String(name).trim(), jenis).changes > 0
}

export function formatDuration(ms) {
    if (typeof ms !== 'number' || ms < 0) return 'Baru saja'
    const units = [[86_400_000, 'hari'], [3_600_000, 'jam'], [60_000, 'menit'], [1000, 'detik']]
    const parts = []
    let rem = Math.floor(ms)
    for (const [unitMs, label] of units) {
        const val = Math.floor(rem / unitMs)
        if (val > 0) { parts.push(`${val} ${label}`); rem %= unitMs }
    }
    return parts.join(', ') || '0 detik'
}

export function waMediaUrl(directPath) {
    if (!directPath) return null
    if (/^https?:\/\//i.test(directPath)) return directPath
    return `${WA_MEDIA_HOST}${directPath.startsWith('/') ? '' : '/'}${directPath}`
}

export function getUrlExpiry(url) {
    try {
        const oe = new URLSearchParams(String(url).split('?')[1]).get('oe')
        return oe ? new Date(parseInt(oe, 16) * 1000) : null
    } catch {
        return null
    }
}

export async function getMediaAgeMs(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' })
        const lastModified = res.headers.get('last-modified')
        if (!lastModified) return null
        return Date.now() - new Date(lastModified).getTime()
    } catch {
        return null
    }
}

export const fmtWib = (epochSec) =>
    epochSec ? new Date(epochSec * 1000).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-'

function toB64(value) {
    if (value == null) return value
    if (Buffer.isBuffer(value) || value instanceof Uint8Array) return Buffer.from(value).toString('base64')
    if (typeof value === 'object' && Array.isArray(value.data)) return Buffer.from(value.data).toString('base64')
    return value
}

async function toBuffer(input) {
    if (Buffer.isBuffer(input)) return input
    if (input instanceof Uint8Array) return Buffer.from(input)
    if (typeof input === 'string' && /^https?:\/\//i.test(input)) {
        const res = await fetch(input)
        if (!res.ok) throw new Error(`gagal unduh gambar (HTTP ${res.status})`)
        return Buffer.from(await res.arrayBuffer())
    }
    throw new Error('input gambar harus Buffer atau URL http(s).')
}

async function streamToBuffer(stream) {
    if (stream && typeof stream.getReader === 'function') {
        const reader = stream.getReader()
        const chunks = []
        for (;;) {
            const { value, done } = await reader.read()
            if (done) break
            if (value) chunks.push(Buffer.from(value))
        }
        return Buffer.concat(chunks)
    }
    const chunks = []
    for await (const chunk of stream) chunks.push(Buffer.from(chunk))
    return Buffer.concat(chunks)
}

async function imageInfo(buffer, withJpeg) {
    try {
        const J = await import('jimp')
        const Jimp = J.Jimp || J.default?.Jimp || J.default
        const img = await Jimp.read(buffer)
        const width = img.bitmap.width
        const height = img.bitmap.height
        let jpeg = null
        if (withJpeg) {
            const small = img.clone().resize({ w: Math.min(120, width) })
            jpeg = await small.getBuffer('image/jpeg', { quality: 40 })
        }
        return { width, height, jpeg }
    } catch (err) {
        console.error('[THUMB] gagal baca ukuran gambar:', err?.message || err)
        return { width: undefined, height: undefined, jpeg: null }
    }
}

function toProtoMeta(meta = {}) {
    const out = { ...meta }
    delete out.url
    delete out.mimetype
    for (const key of BYTES_FIELDS) {
        if (typeof out[key] === 'string') out[key] = Buffer.from(out[key], 'base64')
    }
    return out
}

function pickFields(src, jenis) {
    const out = {}
    for (const key of THUMB_FIELDS) {
        const val = src?.[key]
        if (val == null) continue
        out[key] = toB64(val)
    }
    if (jenis === 'favicon') delete out.jpegThumbnail
    return out
}

export async function uploadThumbnail(conn, image, { favicon = false, mimetype: mimeOverride } = {}) {
    const B = baileys.encryptedStream ? baileys : (baileys.default || baileys)
    if (typeof B.encryptedStream !== 'function') throw new Error('engine tidak punya encryptedStream.')
    if (typeof conn.waUploadToServer !== 'function') throw new Error('conn.waUploadToServer tidak tersedia.')

    const buffer = await toBuffer(image)
    const mimetype = mimeOverride || (await fileTypeFromBuffer(buffer))?.mime || 'image/jpeg'
    if (!/^image\//.test(mimetype)) throw new Error(`file bukan gambar (${mimetype}).`)

    const info = await imageInfo(buffer, !favicon)
    const enc = await B.encryptedStream(buffer, 'thumbnail-link')

    let up
    try {
        up = await conn.waUploadToServer(enc.encFilePath || enc.encWriteStream, {
            fileEncSha256B64: Buffer.from(enc.fileEncSha256).toString('base64'),
            mediaType: 'thumbnail-link',
            timeoutMs: 60_000
        })
    } finally {
        for (const f of [enc.encFilePath, enc.originalFilePath]) {
            if (f) fs.promises.unlink(f).catch(() => {})
        }
    }
    if (!up?.directPath) throw new Error('server WhatsApp tidak mengembalikan directPath.')

    const result = {
        thumbnailDirectPath: up.directPath,
        thumbnailSha256: toB64(enc.fileSha256),
        thumbnailEncSha256: toB64(enc.fileEncSha256),
        mediaKey: toB64(enc.mediaKey),
        mediaKeyTimestamp: Math.floor(Date.now() / 1000),
        thumbnailWidth: info.width,
        thumbnailHeight: info.height,
        mimetype
    }
    if (up.url) result.url = up.url
    if (!favicon && info.jpeg) result.jpegThumbnail = toB64(info.jpeg)
    return result
}

export async function downloadThumbnail(fields) {
    if (!fields?.mediaKey || !fields?.thumbnailDirectPath) {
        throw new Error('field thumbnail tidak lengkap (butuh mediaKey dan thumbnailDirectPath).')
    }
    const stream = await downloadContentFromMessage({
        mediaKey: Buffer.from(fields.mediaKey, 'base64'),
        directPath: fields.thumbnailDirectPath,
        url: waMediaUrl(fields.thumbnailDirectPath)
    }, 'thumbnail-link')
    const buffer = await streamToBuffer(stream)
    if (!buffer.length) throw new Error('hasil download kosong.')
    return { buffer, mimetype: fields.mimetype || (await fileTypeFromBuffer(buffer))?.mime || 'image/jpeg' }
}

export async function resolveThumbMeta(conn, value, jenis = 'thumbnail') {
    if (value && typeof value === 'object') return { name: null, jenis, status: 'inline', metadata: value }

    const input = String(value ?? '').trim()
    if (!input) throw new Error(`${jenis}: isi dengan nama db, URL gambar, "random", atau objek metadata.`)

    if (/^random$/i.test(input)) {
        const row = getRandomThumb(jenis)
        if (!row) throw new Error(`Tidak ada ${jenis} random yang tersedia di database.`)
        return row
    }
    if (/^https?:\/\//i.test(input)) {
        const metadata = await uploadThumbnail(conn, input, { favicon: jenis === 'favicon' })
        return { name: null, jenis, status: 'upload', metadata }
    }
    const row = getThumb(input, jenis)
    if (!row) throw new Error(`${jenis} \`${input}\` tidak ditemukan di database.`)
    return row
}

export async function sendThumbnail(conn, jid, opts = {}) {
    const { thumbnail, favicon, title, body, url, text, quote, mentions } = opts

    const cleanUrl = String(url ?? '').trim()
    if (!/^https?:\/\//i.test(cleanUrl)) throw new Error(`sendThumbnail: url tidak valid ("${cleanUrl}").`)
    if (!thumbnail) throw new Error('sendThumbnail: parameter thumbnail wajib ada (nama db / url / "random").')

    const thumbRow = await resolveThumbMeta(conn, thumbnail, 'thumbnail')
    const favRow = favicon ? await resolveThumbMeta(conn, favicon, 'favicon') : null

    const ext = {
        title: String(title ?? '').trim() || undefined,
        description: String(body ?? '').trim() || undefined,
        text: `${cleanUrl}${text ? `\n${String(text).trim()}` : ''}`,
        matchedText: cleanUrl,
        previewType: 0,
        inviteLinkGroupTypeV2: 0,
        ...toProtoMeta(thumbRow.metadata)
    }
    if (favRow) ext.faviconMmsMetadata = toProtoMeta(favRow.metadata)
    if (mentions?.length) ext.contextInfo = { mentionedJid: mentions }

    const msg = generateWAMessageFromContent(jid, { extendedTextMessage: ext }, {
        quoted: quote,
        userJid: conn.user?.jid || conn.user?.id
    })
    await conn.relayMessage(jid, msg.message, { messageId: msg.key.id })
    return msg
}

function usage(prefix, command) {
    return (
        `*Format Penggunaan:*\n` +
        `> \`Reply gambar\`\n> \`${prefix}${command} [-private] <nama>\`\n\n` +
        `> \`Reply pesan link-preview\` (metadata diambil dari pesan, tanpa upload ulang)\n> \`${prefix}${command} [-private] <nama>\`\n\n` +
        `> \`Kirim gambar dengan caption\`\n> \`${prefix}${command} [-private] <nama>\`\n\n` +
        `> \`Dari URL gambar\`\n> \`${prefix}${command} [-private] <nama> <url>\`\n\n` +
        `\`-private\` = tidak ikut pool random (khusus thumbnail). Tanpa flag, default *random*.`
    )
}

function harvestPreviewMeta(q, jenis) {
    const etm = q?.vM?.message?.extendedTextMessage || q?.fakeObj?.message?.extendedTextMessage
    if (!etm) return { ok: false, reason: 'pesan yang di-reply bukan pesan link-preview.' }

    const container = jenis === 'favicon' ? (etm.faviconMmsMetadata || null) : (etm.thumbnailDirectPath ? etm : null)
    if (container?.thumbnailDirectPath && container?.mediaKey) {
        return { ok: true, meta: pickFields(container, jenis), cdnUrl: container.url || waMediaUrl(container.thumbnailDirectPath) }
    }
    if (jenis === 'favicon' && etm.thumbnailDirectPath) {
        return { ok: false, reason: 'thumbnail utamanya ada, tapi pesan ini tidak menyimpan faviconMmsMetadata.' }
    }
    return { ok: false, reason: `metadata ${jenis} (directPath/mediaKey) tidak lengkap di pesan ini.` }
}

export async function addThumbFlow(m, { conn, args, usedPrefix, command }, jenis) {
    const isPrivate = args.some(a => a.toLowerCase() === '-private')
    const positional = args.filter(a => !a.startsWith('-'))
    const name = positional[0]?.trim()
    const urlInput = positional.slice(1).join(' ').trim()
    const label = jenis === 'favicon' ? 'Favicon' : 'Thumbnail'

    if (!name) return m.reply(usage(usedPrefix, command))
    if (/^https?:\/\//i.test(name)) return m.reply('Nama harus di depan, URL-nya di belakang.\n\n' + usage(usedPrefix, command))
    if (/^random$/i.test(name)) return m.reply('❌ Nama `random` dipakai sebagai kata kunci khusus. Pakai nama lain ya.')

    const status = jenis === 'favicon' ? 'random' : (isPrivate ? 'private' : 'random')
    const q = m.quoted
    const qMime = (q?.msg || q)?.mimetype || ''
    const isQuotedLink = q && (q.mtype === 'extendedTextMessage' || q.vM?.message?.extendedTextMessage?.thumbnailDirectPath)
    const isQuotedImage = q && /^image\//.test(qMime)
    const selfMime = (m.msg || m)?.mimetype || ''
    const isSelfImage = !q && /^image\//.test(selfMime)

    let meta, expiredEpoch = null, viaUpload = true

    if (isQuotedLink && !isQuotedImage) {
        const harvested = harvestPreviewMeta(q, jenis)
        if (!harvested.ok) {
            return m.reply(`❌ Metadata *${jenis}* gagal diambil: ${harvested.reason}\n\nCoba reply gambar biasa, atau kirim URL gambar langsung.`)
        }
        const expiry = getUrlExpiry(harvested.cdnUrl)
        if (expiry && expiry.getTime() <= Date.now()) {
            return m.reply(`❌ *Gagal:* metadata sudah expired (${expiry.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}).\nCari sumber yang lebih segar.`)
        }
        meta = harvested.meta
        expiredEpoch = expiry ? Math.floor(expiry.getTime() / 1000) : null
        viaUpload = false
    } else {
        let input
        if (isQuotedImage) input = await q.download()
        else if (isSelfImage) input = await m.download()
        else if (urlInput) {
            if (!/^https?:\/\//i.test(urlInput)) return m.reply('URL tidak valid.')
            input = urlInput
        } else return m.reply('Reply gambar / pesan ber-preview, atau sertakan URL gambar.\n\n' + usage(usedPrefix, command))

        try {
            meta = await uploadThumbnail(conn, input, { favicon: jenis === 'favicon' })
        } catch (err) {
            return m.reply(`❌ Gagal upload ${jenis}: ${err.message}`)
        }
        const expiry = getUrlExpiry(meta.url || waMediaUrl(meta.thumbnailDirectPath))
        expiredEpoch = expiry ? Math.floor(expiry.getTime() / 1000) : null
    }

    saveThumb({ name, jenis, status, metadata: meta, expired: expiredEpoch })

    const sisa = expiredEpoch
        ? `${fmtWib(expiredEpoch)} *(sisa ${formatDuration(expiredEpoch * 1000 - Date.now())})*`
        : 'tidak terdeteksi'

    return m.reply(
        `✅ *${label} tersimpan!*\n` +
        `• Nama    : \`${name}\`\n` +
        `• Jenis   : ${jenis}\n` +
        `• Status  : ${status}\n` +
        `• Sumber  : ${viaUpload ? 'upload baru' : 'metadata pesan'}\n` +
        `• Expired : ${sisa}`
    )
}

const inProgress = new Set()

export async function refreshThumbRow(conn, row) {
    const key = `${row.jenis}:${row.name}`
    if (inProgress.has(key)) return { ok: false, name: row.name, jenis: row.jenis, reason: 'sedang di-refresh proses lain.' }
    inProgress.add(key)

    try {
        const old = row.metadata || {}
        if (!old.mediaKey || !old.thumbnailDirectPath) {
            return { ok: false, name: row.name, jenis: row.jenis, reason: 'metadata lama tidak lengkap (mediaKey/directPath hilang).' }
        }
        const ageMs = await getMediaAgeMs(old.url || waMediaUrl(old.thumbnailDirectPath))
        const ageNote = ageMs !== null ? ` *(umur sumber lama ~${Math.floor(ageMs / 86400000)} hari)*` : ''

        const downloaded = await downloadThumbnail(old)
        const fresh = await uploadThumbnail(conn, downloaded.buffer, { favicon: row.jenis === 'favicon', mimetype: downloaded.mimetype })

        const expiry = getUrlExpiry(fresh.url || waMediaUrl(fresh.thumbnailDirectPath))
        saveThumb({
            name: row.name, jenis: row.jenis, status: row.status, metadata: fresh,
            expired: expiry ? Math.floor(expiry.getTime() / 1000) : null
        })
        return {
            ok: true, name: row.name, jenis: row.jenis, ageNote,
            expired: expiry ? expiry.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'tidak terdeteksi'
        }
    } catch (err) {
        return { ok: false, name: row.name, jenis: row.jenis, reason: err.message }
    } finally {
        inProgress.delete(key)
    }
}

async function sweep(conn) {
    const rows = []
    for (const jenis of ['thumbnail', 'favicon']) {
        for (const item of listThumbs(jenis)) {
            const row = getThumb(item.name, jenis)
            if (row) rows.push(row)
        }
    }
    if (!rows.length) return console.log(chalk.gray('[THUMB-AUTO] Database thumbnail kosong — tidak ada yang dicek.'))

    const stale = []
    for (const row of rows) {
        const meta = row.metadata || {}
        if (!meta.mediaKey || !meta.thumbnailDirectPath) continue
        const ageMs = await getMediaAgeMs(meta.url || waMediaUrl(meta.thumbnailDirectPath))
        if (ageMs !== null && ageMs > REFRESH_THRESHOLD_MS) stale.push({ row, ageDays: Math.floor(ageMs / 86400000) })
    }
    if (!stale.length) return console.log(chalk.gray('[THUMB-AUTO] Semua thumbnail masih segar (<7 hari).'))

    console.log(chalk.yellow(`[THUMB-AUTO] ${stale.length} entri berumur >7 hari — refresh di background.`))
    let ok = 0, fail = 0
    for (let i = 0; i < stale.length; i++) {
        const { row, ageDays } = stale[i]
        const res = await refreshThumbRow(conn, row)
        if (res.ok) { ok++; console.log(chalk.green(`[THUMB-AUTO] ✓ ${res.jenis}:${res.name} (~${ageDays} hari -> segar)`)) }
        else { fail++; console.log(chalk.red(`[THUMB-AUTO] ✗ ${row.jenis}:${row.name}: ${res.reason}`)) }
        if (i < stale.length - 1) await new Promise(r => setTimeout(r, 2000))
    }
    console.log(chalk.gray(`[THUMB-AUTO] Selesai — ${ok} sukses, ${fail} gagal.`))
}

let autoStarted = false
export function startThumbAutoRefresh(conn) {
    if (autoStarted) return
    autoStarted = true
    setTimeout(() => {
        sweep(conn).catch(err => console.error(chalk.red('[THUMB-AUTO] Gagal:'), err?.stack || err?.message))
    }, 15_000)
}

export { db as thumbnailsDb }
