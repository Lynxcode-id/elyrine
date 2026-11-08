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

import { areJidsSameUser } from 'elyra-baileys'
import { syncUser, quotaOf } from '../../lib/limit.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let rawTarget
    if (m.isGroup) {
        const tokens = (text || '').trim().split(/\s+/).filter(Boolean)
        const first = tokens[0]
        if (first && /\d{5,}/.test(first)) {
            rawTarget = first.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        } else {
            rawTarget = m.mentionedJid?.[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : null)
        }
    } else {
        const [numCandidate] = (text || '').trim().split(/\s+/)
        if (numCandidate) rawTarget = numCandidate.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    }

    if (!rawTarget) throw `Tag/Reply target user or provide a number.\n\nExample:\n• ${usedPrefix + command} @user 7\n• ${usedPrefix + command} 6281234567890 7`

    const decoded = typeof conn.decodeJid === 'function' ? conn.decodeJid(rawTarget) : rawTarget
    let jid = typeof conn.getJid === 'function' ? conn.getJid(decoded) : decoded

    if (m.isGroup && (!/@s\.whatsapp\.net$/.test(jid))) {
        try {
            const meta = (conn.chats?.[m.chat]?.metadata) || (await conn.groupMetadata?.(m.chat))
            const parts = meta?.participants || []
            const raws = parts.flatMap(p => [p?.id, p?.jid, p?.participant, p?.lid]).filter(Boolean).map(String)
            const matches = raws.map(raw => {
                const norm = typeof conn.getJid === 'function' ? conn.getJid(raw) : (raw.decodeJid ? raw.decodeJid() : raw)
                return { raw, norm, ok: areJidsSameUser(norm, jid) }
            }).filter(x => x.ok)
            const pick = matches.find(x => /@s\.whatsapp\.net$/.test(x.raw)) || matches.find(x => /@s\.whatsapp\.net$/.test(x.norm)) || matches[0]
            if (pick) jid = /@s\.whatsapp\.net$/.test(pick.raw) ? pick.raw : pick.norm
        } catch {}
    }

    let daysStr
    if (m.isGroup) {
        const tokens = (text || '').trim().split(/\s+/).filter(Boolean)
        daysStr = tokens.length ? tokens[tokens.length - 1] : undefined
    } else {
        const [, d] = (text || '').trim().split(/\s+/)
        daysStr = d
    }
    const days = parseInt(daysStr, 10)
    if (!days || isNaN(days) || days <= 0) throw `Invalid days.\n\nExample:\n• ${usedPrefix + command} @user 7\n• ${usedPrefix + command} 6281234567890 30`

    const dbRoot = (global.db && global.db.data) ? global.db.data : (global.db = { ...(global.db || {}), data: {} }).data
    if (!dbRoot.users) dbRoot.users = {}
    const users = dbRoot.users

    let dbKey = null
    if (typeof jid === 'string' && /@s\.whatsapp\.net$/.test(jid)) {
        dbKey = jid
    } else {
        const keys = Object.keys(users)
        const found = keys.find(k => {
            if (!/@s\.whatsapp\.net$/.test(k)) return false
            const kNorm = typeof conn.getJid === 'function' ? conn.getJid(k) : (k.decodeJid ? k.decodeJid() : k)
            return areJidsSameUser(kNorm, jid)
        })
        if (found) dbKey = found
    }

    if (!dbKey) throw `User not found in database.`

    if (!users[dbKey]) {
        users[dbKey] = {
            name: (await conn.getName?.(dbKey)) || dbKey.split('@')[0],
            premium: false,
            premiumTime: 0,
            role: 'Free user'
        }
    }

    let userData = users[dbKey]
    const now = Date.now()
    const addMs = 86400000 * days

    if (userData.role === 'Free user') userData.role = 'Premium user'
    if (now < (userData.premiumTime || 0)) userData.premiumTime += addMs
    else userData.premiumTime = now + addMs
    userData.premium = true
    syncUser(userData, dbKey)
    userData.limit = Math.max(userData.limit || 0, quotaOf('premium'))

    const countdown = userData.premiumTime - now
    const displayJid = dbKey
    m.reply(`✔️ Success
📛 Name: ${userData.name || (await conn.getName?.(displayJid)) || displayJid.split('@')[0]}
📆 Days: ${days} day(s)
⏳ Countdown: ${countdown}`)
}

handler.help = ['addprem <phone number> <days>']
handler.tags = ['owner']
handler.command = /^addprem?$/i

handler.rowner = true

export default handler
