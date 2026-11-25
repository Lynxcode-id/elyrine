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

import axios from 'axios'
import crypto from 'crypto'

const API = 'https://api.digitalocean.com/v2'
const DEFAULT_PLANS = {
    vps1g1c: { size: 's-1vcpu-1gb', ram: '1GB', cpu: '1 vCPU' },
    vps2g1c: { size: 's-1vcpu-2gb', ram: '2GB', cpu: '1 vCPU' },
    vps2g2c: { size: 's-2vcpu-2gb', ram: '2GB', cpu: '2 vCPU' },
    vps4g2c: { size: 's-2vcpu-4gb', ram: '4GB', cpu: '2 vCPU' },
    vps8g4c: { size: 's-4vcpu-8gb', ram: '8GB', cpu: '4 vCPU' }
}

export const LINE = '─────────────────────'
export const B = t => `*${t}*`
export const sleep = ms => new Promise(r => setTimeout(r, ms))
export const cfg = () => global.digitalocean || {}
export const plans = () => (cfg().plans && Object.keys(cfg().plans).length ? cfg().plans : DEFAULT_PLANS)
export const validId = s => /^\d{4,15}$/.test(String(s || '').trim())
export const publicIp = (d, v = 'v4') => d?.networks?.[v]?.find(n => n.type === 'public')?.ip_address || '-'
export const mask = t => `${t.slice(0, 6)}••••${t.slice(-4)}`
export const fmtDate = iso => new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Makassar', dateStyle: 'long', timeStyle: 'medium' }) + ' WITA'

const store = () => (global.db.data.digitalocean ||= { users: {}, token: '' })
const num = jid => String(jid || '').split('@')[0].split(':')[0]
const save = () => global.db.write?.().catch(() => { })

export const ownToken = jid => store().users[num(jid)] || ''
export function setOwnToken(jid, token) {
    const s = store()
    const had = !!s.users[num(jid)]
    s.users[num(jid)] = token
    save()
    return had
}
export function delOwnToken(jid) {
    const s = store()
    if (!s.users[num(jid)]) return false
    delete s.users[num(jid)]
    save()
    return true
}
export const setGlobalToken = token => { store().token = token; save() }
export const globalToken = () => store().token || cfg().token || ''
export const hasAccess = (m, isOwner) => isOwner || (cfg().sellers || []).map(String).includes(num(m.sender))
export const tokenFor = (m, isOwner) => ownToken(m.sender) || (hasAccess(m, isOwner) ? globalToken() : '')

export async function guard(m, isOwner, prefix) {
    const token = tokenFor(m, isOwner)
    if (token) return token
    await m.reply(`☾ ${B('TOKEN DIGITALOCEAN BELUM DISET')}\n${LINE}\nBuka chat pribadi bot lalu ketik:\n${prefix}setdo <token>\n\nBuat token (Read & Write) di cloud.digitalocean.com/account/api/tokens`)
    return ''
}

export function genPassword(length = 14) {
    const set = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%'
    const bytes = crypto.randomBytes(length)
    let out = ''
    for (let i = 0; i < length; i++) out += set[bytes[i] % set.length]
    return out
}

export async function call(token, method, path, body) {
    try {
        const r = await axios({
            method, url: API + path, data: body, timeout: 30000,
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            validateStatus: () => true
        })
        const ok = r.status >= 200 && r.status < 300
        return { ok, status: r.status, data: r.data, error: ok ? null : (r.data?.message || `HTTP ${r.status}`) }
    } catch (e) {
        return { ok: false, status: 0, data: null, error: e.message }
    }
}

export function errText(prefix, command, r) {
    const hint = r?.status === 401 ? 'Token DigitalOcean salah / kadaluarsa.'
        : r?.status === 404 ? 'ID droplet tidak ditemukan.'
        : r?.status === 422 ? 'Permintaan ditolak DigitalOcean (cek region / paket / hostname).'
        : r?.status === 429 ? 'Terlalu banyak permintaan, coba lagi sebentar.'
        : 'Coba lagi nanti. Kalau terus berulang, hubungi owner.'
    return `☾ ${B('GAGAL')}\n${LINE}\nCommand : ${prefix}${command}\nAlasan  : ${r?.error || 'tidak diketahui'}\n\n${hint}`
}
