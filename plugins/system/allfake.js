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
import moment from 'moment-timezone'
import nodeFetch from 'node-fetch'
import { LRU } from '../../lib/lru.js'
import { getCustomThumb, getCustomThumbSmall } from '../../lib/customthumbfake.js'
import { buildSquareLinkPreview } from '../../lib/linkpreview.js'
import { patchFavicon } from '../../lib/favicon.js'
const defaultThumb = fs.readFileSync("./src/erine.webp")
global.fetch = nodeFetch
global.fs = fs

const DEFAULT_PP = './src/avatar_contact.png'
const ppCache = new LRU(500, 30 * 60 * 1000)
const ppFlight = new Set()
function getPP(conn, jid) {
    const hit = ppCache.get(jid)
    if (hit) return hit
    if (!ppFlight.has(jid)) {
        ppFlight.add(jid)
        Promise.resolve(conn.profilePictureUrl(jid, 'image')).then(
            url => ppCache.set(jid, url || DEFAULT_PP),
            () => ppCache.set(jid, DEFAULT_PP, 5 * 60 * 1000)
        ).finally(() => ppFlight.delete(jid))
    }
    return DEFAULT_PP
}
let thumbPath = defaultThumb

let handler = m => m
handler.all = async function (m) {
    thumbPath = (await getCustomThumbSmall()) || defaultThumb
    const pp = getPP(this, m.sender)

    global.doc = pickRandom([
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/msword",
        "application/pdf"
    ])

    global.ucapan = ucapan()
    global.ephemeral = ''

    global.adReply = { contextInfo: {} }

    patchLinkPreview(this)
    patchFavicon(this)

    global.sfb = {
        contextInfo: {
            externalAdReply: {
                title: global.ucapan,
                body: wm,
                thumbnailUrl: pp,
                sourceUrl: sfb
            }
        }
    }

    global.ftroli = {
        key: {
            remoteJid: 'status@broadcast',
            participant: '0@s.whatsapp.net'
        },
        message: {
            orderMessage: {
                itemCount: 999999999999999,
                status: 1,
                surface: 1,
                message: wm,
                orderTitle: wm,
                sellerJid: '0@s.whatsapp.net'
            }
        }
    }

    global.fkontak = {
        key: {
            fromMe: false,
            participant: `0@s.whatsapp.net`,
            ...(m.chat ? {
                remoteJid: `status@broadcast`
            } : {})
        },
        message: {
            contactMessage: {
                displayName: wm,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:XL;${wm},;;;\nFN:${wm},\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabell:Ponsel\nEND:VCARD`,
                jpegThumbnail: thumbPath,
                thumbnail: thumbPath,
                sendEphemeral: true
            }
        }
    }

    global.fvn = {
        key: {
            fromMe: false,
            participant: `0@s.whatsapp.net`,
            ...(m.chat ? {
                remoteJid: "6282127487538-1625305606@g.us"
            } : {})
        },
        message: {
            audioMessage: {
                mimetype: "audio/ogg; codecs=opus",
                seconds: "999999999999",
                ptt: "true"
            }
        }
    }

    global.ftextt = {
        key: {
            fromMe: false,
            participant: `0@s.whatsapp.net`,
            ...(m.chat ? {
                remoteJid: "6282127487538-1625305606@g.us"
            } : {})
        },
        message: {
            extendedTextMessage: {
                text: wm,
                title: wm,
                jpegThumbnail: thumbPath
            }
        }
    }

    global.fliveLoc = {
        key: {
            fromMe: false,
            participant: `0@s.whatsapp.net`,
            ...(m.chat ? {
                remoteJid: "status@broadcast"
            } : {})
        },
        message: {
            liveLocationMessage: {
                caption: "by : WH MODS DEV",
                h: wm,
                jpegThumbnail: thumbPath
            }
        }
    }

    global.fliveLoc2 = {
        key: {
            fromMe: false,
            participant: `0@s.whatsapp.net`,
            ...(m.chat ? {
                remoteJid: "status@broadcast"
            } : {})
        },
        message: {
            liveLocationMessage: {
                title: "WH MODS DEV",
                h: wm,
                jpegThumbnail: thumbPath
            }
        }
    }

    global.ftoko = {
        key: {
            fromMe: false,
            participant: `0@s.whatsapp.net`,
            ...(m.chat ? {
                remoteJid: "6282127487538@s.whatsapp.net"
            } : {})
        },
        message: {
            productMessage: {
                product: {
                    productImage: {
                        mimetype: "image/jpeg",
                        jpegThumbnail: thumbPath
                    },
                    title: wm,
                    description: "Simple Bot Esm",
                    currencyCode: "USD",
                    priceAmount1000: "20000000",
                    retailerId: "Ghost",
                    productImageCount: 1
                },
                businessOwnerJid: `0@s.whatsapp.net`
            }
        }
    }

    global.fdocs = {
        key: {
            participant: '0@s.whatsapp.net'
        },
        message: {
            documentMessage: {
                title: wm,
                jpegThumbnail: thumbPath
            }
        }
    }

    global.fgclink = {
        key: {
            fromMe: false,
            participant: "0@s.whatsapp.net",
            remoteJid: "0@s.whatsapp.net"
        },
        message: {
            groupInviteMessage: {
                groupJid: "6282127487538-1625305606@g.us",
                inviteCode: "null",
                groupName: "Kawan WH MODS DEV",
                caption: wm,
                jpegThumbnail: thumbPath
            }
        }
    }

    global.fgif = {
        key: {
            fromMe: false,
            participant: `0@s.whatsapp.net`,
            ...(m.chat ? {
                remoteJid: "6282127487538-1625305606@g.us"
            } : {})
        },
        message: {
            videoMessage: {
                title: wm,
                h: `Hmm`,
                seconds: '999999999',
                gifPlayback: 'true',
                caption: wm,
                jpegThumbnail: thumbPath
            }
        }
    }
}

export default handler

const LP_URL = 'https://github.com/Lynxcode-id/elyrine'
const LP_TITLE = '୨ৎ ERINE-AI ~ 3ND PROJECT'
const LP_THUMB = 'https://raw.githubusercontent.com/its-dinda/image/main/1793839373037.jpeg'
const LP_VERSION = 'erine-linkpreview-6'
const LP_CACHE_MS = 30 * 60 * 1000
let lpCache = null

async function getLpRaw() {
    const custom = getCustomThumb()
    if (custom) return custom.buffer
    try {
        const mod = await import('../../lib/thumbnail.js')
        const t = mod.getRandomThumb ? mod.getRandomThumb('thumbnail') : null
        if (Buffer.isBuffer(t)) return t
    } catch (e) { }
    try {
        const res = await Promise.race([
            fetch(LP_THUMB).then(r => r.arrayBuffer()),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000))
        ])
        return Buffer.from(res)
    } catch (e) {
        console.error('[ALLFAKE] gagal ambil thumbnail bawaan:', e && e.message ? e.message : e)
        return defaultThumb
    }
}

async function getLinkPreview() {
    const key = (getCustomThumb() || {}).mtimeMs || 0
    if (!lpCache || lpCache.key !== key || Date.now() - lpCache.at > LP_CACHE_MS) {
        const raw = await getLpRaw()
        const linkPreview = await buildSquareLinkPreview({ url: LP_URL, title: LP_TITLE, description: '', image: raw })
        lpCache = { key, at: Date.now(), linkPreview }
    }
    return { ...lpCache.linkPreview, description: global.ucapan || namebot }
}

function patchLinkPreview(conn) {
    if (conn._lpVersion === LP_VERSION) return
    if (!conn._lpOriginalSend) conn._lpOriginalSend = conn.sendMessage.bind(conn)
    const originalSend = conn._lpOriginalSend
    conn._lpVersion = LP_VERSION
    let logged = false

    conn.sendMessage = async (jid, content = {}, options = {}) => {
        try {
            const c = content || {}
            const hasAd = !!(c.contextInfo && c.contextInfo.externalAdReply)
            const plain = typeof c.text === 'string' && c.text.length &&
                !c.linkPreview && !c.edit && !c.react && !c.delete && !c.pin && !c.poll &&
                !c.forward && !c.contacts && !c.protocolMessage &&
                !c.image && !c.video && !c.audio && !c.document && !c.sticker &&
                !c.buttons && !c.templateButtons && !c.sections && !c.nativeFlow &&
                !c.nativeFlowMessage && !c.interactiveMessage &&
                (hasAd || !/https?:\/\//i.test(c.text))
            if (!plain) return await originalSend(jid, content, options)

            const linkPreview = await getLinkPreview()
            const contextInfo = c.contextInfo ? { ...c.contextInfo } : undefined
            if (contextInfo) delete contextInfo.externalAdReply

            const out = {
                ...c,
                text: `${LP_URL}${'\u2063'.repeat(500)}\n\n${c.text}`,
                linkPreview
            }
            if (contextInfo) out.contextInfo = contextInfo
            if (!logged) { logged = true; console.log('[ALLFAKE] link preview aktif -> ' + LP_URL) }
            return await originalSend(jid, out, options)
        } catch (e) {
            console.error('[ALLFAKE] link preview gagal, kirim biasa:', e && e.message ? e.message : e)
            return originalSend(jid, content, options)
        }
    }
}

function ucapan() {
    const time = moment.tz('Asia/Jakarta').format('HH')
    let res = "Selamat malam 🌙"
    if (time >= 4) res = "Selamat pagi 🌄"
    if (time > 10) res = "Selamat siang ☀️"
    if (time >= 15) res = "Selamat sore 🌅"
    if (time >= 18) res = "Selamat malam 🌙"
    return res
}

function pickRandom(list) {
    return list[Math.floor(list.length * Math.random())]
}
