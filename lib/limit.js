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

export const WITA_OFFSET = 8 * 60 * 60 * 1000
const DAY = 24 * 60 * 60 * 1000

export const DEFAULT_QUOTA = { free: 15, premium: 100, vip: 500 }
export const TIER_ROLE = { owner: 'Owner', vip: 'VIP user', premium: 'Premium user', free: 'Free user' }

const isNum = x => typeof x === 'number' && !isNaN(x)
const pnJid = v => String(v || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net'

export function getLimitCfg() {
    const data = global.db?.data
    if (!data) return { enabled: true, quota: { ...DEFAULT_QUOTA }, resetBelow: 3, lastResetDay: null }
    const c = data.limitcfg = data.limitcfg || {}
    if (typeof c.enabled !== 'boolean') c.enabled = true
    c.quota = c.quota || {}
    for (const [k, v] of Object.entries(DEFAULT_QUOTA)) if (!isNum(c.quota[k]) || c.quota[k] < 0) c.quota[k] = v
    if (!isNum(c.resetBelow)) c.resetBelow = 3
    if (!isNum(c.lastResetDay)) c.lastResetDay = null
    return c
}
export const isLimitEnabled = () => getLimitCfg().enabled
export const setLimitEnabled = on => { getLimitCfg().enabled = !!on }

export const quotaOf = tier => tier === 'owner' ? Infinity : getLimitCfg().quota[tier] ?? DEFAULT_QUOTA.free

export const witaDay = (ts = Date.now()) => Math.floor((ts + WITA_OFFSET) / DAY)
export const nextResetAt = (ts = Date.now()) => (witaDay(ts) + 1) * DAY - WITA_OFFSET
export function formatCountdown(ms) {
    const s = Math.max(0, Math.floor(ms / 1000))
    return `${Math.floor(s / 3600)} jam ${Math.floor(s % 3600 / 60)} menit`
}

export function ownerJids() {
    const set = new Set((global.owner || []).map(o => pnJid(Array.isArray(o) ? o[0] : o)))
    const bot = global.conn?.user?.jid || global.conn?.user?.id || global.nomorbot
    if (bot) set.add(pnJid(String(bot).split('@')[0].split(':')[0]))
    return set
}

export const isVipActive = (u, now = Date.now()) => (u?.vipTime || 0) > now
export const isPremiumActive = (u, now = Date.now()) => (u?.premiumTime || 0) > now

export function getTier(user, jid, now = Date.now()) {
    if (jid && ownerJids().has(jid)) return 'owner'
    if (isVipActive(user, now)) return 'vip'
    if (isPremiumActive(user, now)) return 'premium'
    return 'free'
}

export function syncUser(user, jid, now = Date.now()) {
    const fix = { premiumExpired: 0, vipExpired: 0, role: 0, fields: 0 }
    if (!user || typeof user !== 'object') return fix
    if (user.premium && !isPremiumActive(user, now)) { user.premium = false; user.premiumTime = 0; fix.premiumExpired++ }
    else if (!user.premium && (user.premiumTime || 0) > 0 && !isPremiumActive(user, now)) user.premiumTime = 0
    if (user.vip && !isVipActive(user, now)) { user.vip = false; user.vipTime = 0; fix.vipExpired++ }
    else if (!user.vip && (user.vipTime || 0) > 0 && !isVipActive(user, now)) user.vipTime = 0
    if (isPremiumActive(user, now) && !user.premium) user.premium = true
    if (isVipActive(user, now) && !user.vip) user.vip = true

    const tier = getTier(user, jid, now)
    if (!isNum(user.exp)) { user.exp = 0; fix.fields++ }
    if (!isNum(user.limit) || user.limit < 0) { user.limit = isFinite(quotaOf(tier)) ? quotaOf(tier) : quotaOf('free'); fix.fields++ }
    if (!isNum(user.afk)) { user.afk = -1; fix.fields++ }
    if (typeof user.banned !== 'boolean') { user.banned = !!user.banned; fix.fields++ }
    if (user.role !== TIER_ROLE[tier]) { user.role = TIER_ROLE[tier]; fix.role++ }
    return fix
}

export function runDailyReset(now = Date.now()) {
    const cfg = getLimitCfg()
    const today = witaDay(now)
    if (cfg.lastResetDay === today) return { ran: false, reset: 0, kept: 0 }
    let reset = 0, kept = 0
    for (const [jid, user] of Object.entries(global.db.data.users || {})) {
        if (!user || typeof user !== 'object') continue
        const tier = getTier(user, jid, now)
        if (tier === 'owner') continue
        if (isNum(user.limit) && user.limit >= cfg.resetBelow) { kept++; continue }
        user.limit = quotaOf(tier)
        reset++
    }
    cfg.lastResetDay = today
    return { ran: true, reset, kept }
}

export function syncDatabase(now = Date.now()) {
    const data = global.db.data
    for (const k of ['users', 'chats', 'stats', 'msgs', 'sticker', 'settings']) if (!data[k] || typeof data[k] !== 'object') data[k] = {}
    getLimitCfg()
    const total = { users: 0, premiumExpired: 0, vipExpired: 0, role: 0, fields: 0 }
    for (const [jid, user] of Object.entries(data.users)) {
        if (!user || typeof user !== 'object') { data.users[jid] = {}; }
        const f = syncUser(data.users[jid], jid, now)
        total.users++
        for (const k of Object.keys(f)) total[k] += f[k]
    }
    return { ...total, daily: runDailyReset(now) }
}

let timer = null
export function startLimitScheduler(log = console.log) {
    if (timer) return
    const fmt = r => `${r.users} user | role diperbaiki ${r.role} | premium exp ${r.premiumExpired} | vip exp ${r.vipExpired} | field ${r.fields}` +
        (r.daily.ran ? ` | reset harian: ${r.daily.reset} direset, ${r.daily.kept} dibiarkan (limit >= ${getLimitCfg().resetBelow})` : ' | reset harian: sudah dilakukan hari ini')
    try {
        log('[limit] sinkronisasi database: ' + fmt(syncDatabase()))
        global.db.write?.().catch?.(console.error)
    } catch (e) { console.error('[limit] sync gagal', e) }
    timer = setInterval(() => {
        try {
            const r = runDailyReset()
            if (r.ran) {
                log(`[limit] reset 00:00 WITA: ${r.reset} user direset, ${r.kept} dibiarkan`)
                global.db.write?.().catch?.(console.error)
            }
        } catch (e) { console.error('[limit] reset gagal', e) }
    }, 30 * 1000)
    timer.unref?.()
}

export function limitSummary(user, jid, isOwner = false) {
    const tier = isOwner ? 'owner' : getTier(user, jid)
    const on = isLimitEnabled()
    const q = quotaOf(tier)
    const unlimited = !on || tier === 'owner'
    return {
        tier,
        role: TIER_ROLE[tier],
        enabled: on,
        unlimited,
        quota: q,
        value: unlimited ? '∞' : String(user?.limit ?? 0),
        full: unlimited ? '∞' : `${user?.limit ?? 0}/${q}`,
    }
}
