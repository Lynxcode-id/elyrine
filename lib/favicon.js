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

import { AsyncLocalStorage } from 'async_hooks'
import { getThumb, toProtoMeta } from './thumbnail.js'

export const SCOPES = ['all', 'menu']

const als = new AsyncLocalStorage()
const store = () => (global.db.data.favicon ||= { all: '', menu: '' })
const save = () => global.db.write?.().catch(() => { })

export const runScope = (name, fn) => als.run(name, fn)
export const assigned = scope => store()[scope] || ''
export function assign(scope, name) {
    store()[scope] = name
    save()
}
export function unassign(scope) {
    const had = !!store()[scope]
    store()[scope] = ''
    save()
    return had
}
export function unassignName(name) {
    const hit = []
    for (const s of SCOPES) {
        if (store()[s] === name) {
            store()[s] = ''
            hit.push(s)
        }
    }
    if (hit.length) save()
    return hit
}

function currentMeta() {
    const scope = als.getStore()
    const name = (scope && assigned(scope)) || assigned('all')
    if (!name) return null
    const row = getThumb(name, 'favicon')
    return row?.metadata ? toProtoMeta(row.metadata) : null
}

function previewNode(message) {
    const m = message?.ephemeralMessage?.message || message?.viewOnceMessage?.message || message?.viewOnceMessageV2?.message || message
    const ext = m?.extendedTextMessage
    return ext && (ext.matchedText || ext.canonicalUrl) ? ext : null
}

export function patchFavicon(conn) {
    if (conn._faviconPatched) return
    conn._faviconPatched = true
    const original = conn.relayMessage.bind(conn)
    conn.relayMessage = async (jid, message, options) => {
        try {
            const ext = previewNode(message)
            if (ext && !ext.faviconMmsMetadata) {
                const meta = currentMeta()
                if (meta) ext.faviconMmsMetadata = meta
            }
        } catch (e) {
            console.error('[FAVICON]', e?.message || e)
        }
        return original(jid, message, options)
    }
}
