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

import crypto from 'crypto'

const API = 'https://api.linode.com/v4'

export const cfg = () => global.linode || {}
export const LINE = '─────────────────────'
export const types = () => cfg().types || {
    linode2gb: { type: 'g6-standard-1', ram: '2GB' },
    linode4gb: { type: 'g6-standard-2', ram: '4GB' },
    linode8gb: { type: 'g6-standard-4', ram: '8GB' },
    linode16gb: { type: 'g6-standard-8', ram: '16GB' }
}

export function genPass(length = 14) {
    const set = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%'
    const bytes = crypto.randomBytes(length)
    return Array.from(bytes, b => set[b % set.length]).join('')
}

export async function call(path, { method = 'GET', body } = {}) {
    const token = cfg().token
    if (!token) throw new Error('Token Linode belum diisi di config.js (global.linode.token)')
    const res = await fetch(API + path, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(60000)
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.errors?.[0]?.reason || `Linode HTTP ${res.status}`)
    return data
}

export async function safe(m, fn) {
    try {
        return await fn()
    } catch (e) {
        return m.reply(`☁️ *LINODE GAGAL*\n${LINE}\n${e.message}`)
    }
}

export const idAction = (path, { method = 'POST', done, body } = {}) => async (m, { text, usedPrefix, command }) => {
    const id = String(text || '').trim().split(/\s+/)[0]
    if (!/^\d+$/.test(id)) return m.reply(`Contoh: ${usedPrefix}${command} 12345  (ID dari ${usedPrefix}listlinode)`)
    return safe(m, async () => {
        await call(path(id), { method, body: body ? body(text) : undefined })
        return m.reply(`✅ Linode ID \`${id}\` ${done}`)
    })
}
