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

const JID_RE = /^\d{10,30}@newsletter$/

export function getStore() {
    const data = global.db?.data
    if (!data) return { list: [] }
    const s = data.saluran = data.saluran || {}
    if (!Array.isArray(s.list)) s.list = []
    return s
}

export const listSaluran = () => getStore().list
export const findSaluran = jid => listSaluran().find(c => c.id === jid)
export const getOwnerSaluran = () => listSaluran().find(c => c.owner)

export function parseChannelInput(input) {
    let v = String(input || '').replace(/[\u200B-\u200F\u2060-\u2064\uFEFF]/g, '').trim()
    if (!v) return null
    const link = v.match(/whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/i)
    if (link) return { invite: link[1] }
    if (/^\d{10,30}$/.test(v)) v += '@newsletter'
    return JID_RE.test(v) ? { jid: v } : null
}

const MEX_METADATA_QUERY = '6620195908089573'

export function parseMexContent(content) {
    const buf = Buffer.isBuffer(content) ? content : Buffer.from(content ?? '', typeof content === 'string' ? 'binary' : undefined)
    const text = buf.toString('utf8')
    const start = text.indexOf('{')
    if (start >= 0) {
        try {
            const j = JSON.parse(text.slice(start))
            const n = j?.data?.xwa2_newsletter || j?.data?.xwa2_newsletter_metadata || Object.values(j?.data || {})[0]
            if (n?.id) return {
                id: n.id,
                name: n.thread_metadata?.name?.text || '',
                subscribers: n.thread_metadata?.subscribers_count ?? '',
                state: n.state?.type || '',
                verification: n.thread_metadata?.verification || '',
                viewer_metadata: n.viewer_metadata || undefined,
            }
        } catch { }
    }
    const latin = buf.toString('latin1')
    const m = latin.match(/(\d{10,30})@newsletter/) || latin.match(/(?:^|[^\d])(120363\d{8,})(?!\d)/)
    if (m) return { id: m[1] + '@newsletter', _raw: true }
    const err = new Error('respons newsletter tidak bisa dibaca (hex: ' + buf.subarray(0, 40).toString('hex') + ')')
    err.rawHex = buf.toString('hex')
    throw err
}

async function rawNewsletterMeta(conn, { jid, invite }) {
    const { getBinaryNodeChild } = await import('elyrine-baileys')
    const node = await conn.query({
        tag: 'iq',
        attrs: { type: 'get', xmlns: 'w:mex', to: 's.whatsapp.net' },
        content: [{
            tag: 'query',
            attrs: { query_id: MEX_METADATA_QUERY },
            content: Buffer.from(JSON.stringify({
                variables: {
                    fetch_creation_time: true,
                    fetch_full_image: true,
                    fetch_viewer_metadata: true,
                    input: { key: invite || jid, type: invite ? 'INVITE' : 'JID' }
                }
            }), 'utf-8')
        }]
    })
    const child = getBinaryNodeChild(node, 'result')
    if (!child?.content) throw new Error('respons newsletter kosong')
    return parseMexContent(child.content)
}

export async function fetchNewsletterMeta(conn, { jid, invite }) {
    let first
    try {
        const meta = await conn.newsletterMetadata(invite ? 'invite' : 'jid', invite || jid)
        if (meta) return meta
    } catch (e) { first = e }
    try {
        return await rawNewsletterMeta(conn, { jid, invite })
    } catch (e) {
        console.error('[NEWSLETTER] engine:', first?.message || first, '| raw:', e?.message || e)
        throw first || e
    }
}

export async function detectChannel(conn, { jid, invite }) {
    let meta
    try {
        meta = await fetchNewsletterMeta(conn, { jid, invite })
    } catch (e) {
        const msg = String(e?.message || e)
        if (/not.?found|404|does not exist|invalid/i.test(msg)) return { status: 'notfound', error: msg }
        return { status: 'unverified', id: jid, error: msg }
    }
    if (!meta) return { status: 'notfound' }

    const id = meta.id || jid
    const name = String(meta.name ?? meta.thread_metadata?.name?.text ?? meta.threadMetadata?.name?.text ?? '').trim()
    const role = String(
        meta.viewer_metadata?.role ?? meta.viewerMetadata?.role ?? meta.thread_metadata?.viewer_role ?? meta.role ?? ''
    ).toUpperCase()

    if (!id) return { status: 'unverified', name, role, error: 'id saluran tidak terbaca dari metadata' }
    if (role === 'OWNER' || role === 'ADMIN') return { status: 'ok', id, name, role }
    if (role) return { status: 'denied', id, name, role }
    return { status: 'unverified', id, name, role }
}

export function upsertSaluran({ id, name, owner = false }) {
    const list = listSaluran()
    let entry = list.find(c => c.id === id)
    let created = false
    if (!entry) {
        entry = { id, name: name || '', owner: false, addedAt: Date.now() }
        list.push(entry)
        created = true
    } else if (name) entry.name = name

    let demoted
    if (owner) {
        for (const c of list) if (c !== entry && c.owner) { c.owner = false; demoted = c }
        entry.owner = true
    }
    return { entry, created, demoted }
}

export function removeSaluran(id) {
    const list = listSaluran()
    const i = list.findIndex(c => c.id === id)
    if (i < 0) return null
    return list.splice(i, 1)[0]
}

export const labelSaluran = c => c.name || c.id
export const saveDb = () => global.db?.write?.().catch(() => { })
