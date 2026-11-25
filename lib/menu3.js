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

import { prepareWAMessageMedia, generateWAMessageFromContent } from 'elyrine-baileys'

const THUMB_URL = 'https://raw.githubusercontent.com/its-dinda/image/main/1795090907969.jpeg'
const VIDEO_URL = 'https://raw.githubusercontent.com/its-dinda/image/main/1795092175283.mp4'
const VN_URL = 'https://raw.githubusercontent.com/its-dinda/image/main/1795092245779.mpeg'

const CAPTION_MAX = 3000
const CHUNK_MAX = 3500
const WITA_OFFSET = 8 * 60 * 60 * 1000

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon']
const ACRONYM = new Set(['vps', 'ai', 'dl', 'nsfw', 'rpg', 'jpm'])
const TIER_LABEL = { owner: 'Owner', vip: 'VIP', premium: 'Premium', free: 'User Biasa' }

const HEADER = [
    '   ∧,,,∧     ₊˚⊹ ✦ ⊹˚₊',
    ' (  \u0333• · • \u0333)   𝑬𝑳𝒀𝑹𝑰𝑵𝑬',
    '  /    づ♡   ₊˚⊹ ✦ ⊹˚₊',
    ' / 𝑹𝒆𝒅𝒆𝒇𝒊𝒏𝒊𝒏𝒈 𝑬𝒍𝒆𝒈𝒂𝒏𝒄𝒆, 𝑬𝒎𝒃𝒓𝒂𝒄𝒊𝒏𝒈 𝑰𝒏𝒏𝒐𝒗𝒂𝒕𝒊𝒐𝒏,',
    '𝑬𝒏𝒈𝒊𝒏𝒆𝒆𝒓𝒊𝒏𝒈 𝑻𝒉𝒆 𝑭𝒖𝒕𝒖𝒓𝒆.'
].join('\n')

const FOOTER = [
    '      ∧,,,∧        ₊˚⊹ ✦ ⊹˚₊',
    '    (  \u0333• · • \u0333)       𝐞𝐥𝐲𝐫𝐢𝐧𝐞',
    '    /    づ♡    - ₊˚⊹ ✦ ⊹˚₊'
].join('\n')

const assets = new Map()
let vnCache = null

async function getAsset(url) {
    if (assets.has(url)) return assets.get(url)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status} saat ambil ${url}`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (!buf.length) throw new Error(`Aset kosong: ${url}`)
    assets.set(url, buf)
    return buf
}

export function witaDate(ts = Date.now()) {
    const d = new Date(ts + WITA_OFFSET)
    const y = d.getUTCFullYear(), mo = d.getUTCMonth(), day = d.getUTCDate()
    const days = Math.floor(Date.UTC(y, mo, day) / 86400000)
    return {
        tanggal: `${day} ${BULAN[mo]} ${y}`,
        hari: HARI[d.getUTCDay()],
        pasaran: PASARAN[(((days + 3) % 5) + 5) % 5]
    }
}

const prettyName = n => {
    const s = String(n || '').trim()
    if (!s) return '-'
    return ACRONYM.has(s.toLowerCase()) ? s.toUpperCase() : s[0].toUpperCase() + s.slice(1)
}

const box = (title, lines) => [`┌── ₊˚⊹ ${title}`, ...lines.map(l => `│ ${l}`), '└──'].join('\n')

function buildTop(d) {
    const w = witaDate()
    const mention = `@${String(d.sender).split('@')[0]}`
    const profile = box('PROFILE ──', [
        `Name : ${d.name}`,
        `Status : ${TIER_LABEL[d.tier] || TIER_LABEL.free}`,
        `Limit : ${d.limit}`,
        `Tanggal : ${w.tanggal}`,
        `Hari : ${w.hari}, ${w.pasaran}`,
        'Zone : WITA (UTC+8)'
    ])
    const system = box('SYSTEM ───', [
        `Version : ${d.version}`,
        'Architecture : Plugins ESM',
        'Database : SQLite - LowDB',
        `Plugins : ${d.plugins}`,
        `Runtime : ${d.runtime}`,
        'Engine : elyrine-baileys, engine khusus ELYRINE',
        `Total User : ${d.totalUser}`
    ])
    return `${HEADER}\n\nHaii, ${mention}\n\n${profile}\n\n${system}`
}

function buildBlocks(d) {
    if (d.mode === 'main') {
        return [box('EXPLORE ──', d.cats.map(c => `⌗ ${prettyName(c.name)}`))]
    }
    return d.list.map(c => box(`${String(c.name).toUpperCase()} ──`, c.cmds.map(line => `⌗ ${line}`)))
}

function buildHints(d) {
    return [`↳ ${d.prefix}menu <category>`, `↳ ${d.prefix}menu all`].join('\n')
}

function splitMessages(d) {
    const top = buildTop(d)
    const blocks = buildBlocks(d)
    const hints = buildHints(d)
    const tail = `${hints}\n\n${FOOTER}`

    let caption = top
    const rest = []
    let cur = ''
    for (const b of blocks) {
        if (!rest.length && !cur && caption.length + b.length + 2 + tail.length <= CAPTION_MAX) {
            caption += `\n\n${b}`
            continue
        }
        if (cur && cur.length + b.length + 2 > CHUNK_MAX) { rest.push(cur); cur = '' }
        cur = cur ? `${cur}\n\n${b}` : b
    }
    if (cur) rest.push(cur)

    if (!rest.length) return { caption: `${caption}\n\n${tail}`, rest }
    rest[rest.length - 1] += `\n\n${tail}`
    return { caption, rest }
}

async function sendLivePhoto(conn, m, caption, mentions) {
    const [image, video] = await Promise.all([getAsset(THUMB_URL), getAsset(VIDEO_URL)])
    const [imageMedia, videoMedia] = await Promise.all([
        prepareWAMessageMedia({ image }, { upload: conn.waUploadToServer }),
        prepareWAMessageMedia({ video }, { upload: conn.waUploadToServer })
    ])

    const imgMsg = generateWAMessageFromContent(m.chat, {
        imageMessage: {
            ...imageMedia.imageMessage,
            caption,
            contextInfo: { pairedMediaType: 5, statusSourceType: 0, mentionedJid: mentions }
        }
    }, { userJid: conn.user.id })

    await conn.relayMessage(m.chat, imgMsg.message, { messageId: imgMsg.key.id })

    await conn.relayMessage(m.chat, {
        videoMessage: {
            ...videoMedia.videoMessage,
            contextInfo: { pairedMediaType: 6, statusSourceType: 0 }
        },
        messageContextInfo: {
            messageAssociation: { associationType: 12, parentMessageKey: imgMsg.key }
        }
    }, {})
}

async function sendMenu3Vn(conn, m) {
    try {
        if (!vnCache) {
            const { prepareAudioMessage } = await import('./converter.js')
            const raw = await getAsset(VN_URL)
            vnCache = await prepareAudioMessage({ audio: raw, ptt: true })
        }
        await conn.sendMessage(m.chat, {
            audio: vnCache.audio,
            mimetype: vnCache.mimetype,
            ptt: true,
            waveform: vnCache.waveform,
            seconds: vnCache.seconds
        }, { quoted: m, upload: conn.waUploadToServer })
        return true
    } catch (e) {
        vnCache = null
        console.error('[MENU3] kirim VN gagal:', e?.message || e)
        return false
    }
}

export async function sendMenu3(conn, m, d) {
    const { caption, rest } = splitMessages(d)
    const mentions = [d.sender]

    try {
        await sendLivePhoto(conn, m, caption, mentions)
    } catch (e) {
        console.error('[MENU3] live photo gagal, kirim gambar biasa:', e?.message || e)
        try {
            const image = await getAsset(THUMB_URL)
            await conn.sendMessage(m.chat, { image, caption, mentions }, { quoted: m })
        } catch (e2) {
            console.error('[MENU3] gambar biasa gagal, kirim teks:', e2?.message || e2)
            await conn.sendMessage(m.chat, { text: caption, mentions }, { quoted: m })
        }
    }

    for (const text of rest) await conn.sendMessage(m.chat, { text, mentions }, { quoted: m })

    if (d.mode === 'main') await sendMenu3Vn(conn, m)
    return true
}
