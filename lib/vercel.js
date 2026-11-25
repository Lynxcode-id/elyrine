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

import AdmZip from 'adm-zip'

const API = 'https://api.vercel.com'
const MAX_TOTAL = 40 * 1024 * 1024
const MAX_FILES = 1500
const SKIP = /(^|\/)(node_modules|\.git|__MACOSX|\.vercel)(\/|$)|(^|\/)\.DS_Store$|(^|\/)\.env(\.(local|production|development))?$/i
const sleep = ms => new Promise(r => setTimeout(r, ms))

export const DOMAIN_RE = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/
export const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-{3,}/g, '--').replace(/^[-.]+|[-.]+$/g, '').slice(0, 52)
export const cleanDomain = s => String(s || '').toLowerCase().trim().replace(/^https?:\/\//, '').replace(/[\/?#].*$/, '').replace(/\.$/, '')
export const pj = s => encodeURIComponent(slug(s))
export const dj = s => encodeURIComponent(s)
export const mask = t => `${t.slice(0, 6)}••••${t.slice(-4)}`

const store = () => (global.db.data.vercel ||= { users: {}, global: null })
const num = jid => String(jid || '').split('@')[0].split(':')[0]
const save = () => global.db.write?.().catch(() => { })

export const ownCred = jid => store().users[num(jid)] || null
export function setOwnCred(jid, cred) {
    const s = store()
    const had = !!s.users[num(jid)]
    s.users[num(jid)] = cred
    save()
    return had
}
export function delOwnCred(jid) {
    const s = store()
    if (!s.users[num(jid)]) return false
    delete s.users[num(jid)]
    save()
    return true
}
export const setGlobalCred = cred => { store().global = cred; save() }
export const globalCred = () => {
    const g = store().global
    if (g?.token) return g
    return { token: global.vercel?.token || '', teamId: global.vercel?.teamId || '' }
}
export const credFor = (jid, isOwner) => ownCred(jid) || (isOwner && globalCred().token ? globalCred() : null)

export async function call(cred, path, { method = 'GET', body } = {}) {
    if (!cred?.token) throw new Error('Token Vercel kamu belum diset. Buka chat pribadi bot lalu ketik: .setvercel <token>\n(buat token di vercel.com/account/tokens)')
    const url = new URL(API + path)
    if (cred.teamId) url.searchParams.set('teamId', cred.teamId)
    const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${cred.token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(120000)
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error?.message || `Vercel HTTP ${res.status}`)
    return data
}

export async function run(m, { conn, isOwner, usedPrefix }, fn) {
    const progress = await m.reply('⏳ Memproses...').catch(() => null)
    const upd = t => (progress?.key ? conn.sendMessage(m.chat, { text: t, edit: progress.key }).catch(() => m.reply(t)) : m.reply(t))
    const cred = credFor(m.sender, isOwner)
    const api = (path, opts) => call(cred, path, opts)
    try {
        return await fn({ upd, api, p0: usedPrefix || '.' })
    } catch (e) {
        return upd(`❌ Gagal: ${e.message}`)
    }
}

export function collectFiles(buf, fileName = '', mimetype = '') {
    const isZip = /\.zip$/i.test(fileName) || /zip/i.test(mimetype) || (buf[0] === 0x50 && buf[1] === 0x4b)
    if (!isZip) {
        const name = /\.html?$/i.test(fileName) || !fileName ? 'index.html' : fileName.replace(/[\\/]/g, '_')
        return [{ file: name, data: buf.toString('base64'), encoding: 'base64' }]
    }
    const entries = new AdmZip(buf).getEntries().filter(e => !e.isDirectory)
    const names = entries.map(e => e.entryName.replace(/\\/g, '/'))
    if (names.some(n => n.startsWith('/') || n.split('/').includes('..'))) throw new Error('Zip berisi path berbahaya, ditolak.')
    const roots = new Set(names.map(n => n.split('/')[0]))
    const strip = roots.size === 1 && names.every(n => n.includes('/'))
    const out = []
    let total = 0
    entries.forEach((e, i) => {
        const rel = strip ? names[i].split('/').slice(1).join('/') : names[i]
        if (!rel || SKIP.test(rel)) return
        total += e.header.size
        if (total > MAX_TOTAL) throw new Error('Isi zip terlalu besar (maks 40 MB setelah diekstrak).')
        out.push({ file: rel, data: e.getData().toString('base64'), encoding: 'base64' })
    })
    if (!out.length) throw new Error('Zip kosong.')
    if (out.length > MAX_FILES) throw new Error(`Terlalu banyak file (${out.length}, maks ${MAX_FILES}).`)
    return out
}

export async function waitReady(api, id) {
    for (let i = 0; i < 60; i++) {
        const d = await api(`/v13/deployments/${id}`)
        if (d.readyState === 'READY') return d
        if (d.readyState === 'ERROR' || d.readyState === 'CANCELED') throw new Error(`Deploy ${d.readyState}: ${d.errorMessage || 'cek log build di dashboard Vercel'}`)
        await sleep(3000)
    }
    throw new Error('Deploy belum selesai setelah 3 menit, cek dashboard Vercel.')
}

export const siteUrl = (d, name) => {
    const alias = (d.alias || []).filter(a => a.endsWith('.vercel.app')).sort((a, b) => a.length - b.length)[0]
    return `https://${alias || d.url || name + '.vercel.app'}`
}

export async function dnsText(api, domain, info = {}) {
    const apexName = info.apexName || domain.split('.').slice(-2).join('.')
    const isApex = apexName === domain
    const c = await api(`/v6/domains/${dj(domain)}/config`).catch(() => null)
    const cname = c?.recommendedCNAME?.[0]?.value || 'cname.vercel-dns.com'
    const ip = [].concat(c?.recommendedIPv4?.[0]?.value || '76.76.21.21')[0]
    const host = isApex ? '@' : domain.slice(0, -(apexName.length + 1))
    let t = '📌 *Atur DNS di tempat domain kamu dibeli:*\n' + (isApex ? `A      @   →  ${ip}\nCNAME  www →  ${cname}` : `CNAME  ${host}  →  ${cname}`)
    if (info.verified === false && info.verification?.length)
        t += '\n\n🔐 *Verifikasi kepemilikan (wajib):*\n' + info.verification.map(v => `${v.type}  ${v.domain}  →  ${v.value}`).join('\n')
    return t + '\n\nDNS butuh beberapa menit sampai jam untuk aktif.'
}
