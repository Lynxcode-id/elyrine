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

/**
 * Terima: 120363xxxxxxxxxx@newsletter | 120363xxxxxxxxxx (angka saja) | link whatsapp.com/channel/<kode>
 * @returns {{ jid?: string, invite?: string } | null}
 */
export function parseChannelInput(input) {
    let v = String(input || '').trim()
    if (!v) return null
    const link = v.match(/whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/i)
    if (link) return { invite: link[1] }
    if (/^\d{10,30}$/.test(v)) v += '@newsletter'
    return JID_RE.test(v) ? { jid: v } : null
}

/**
 * Pendeteksi saluran.
 * @returns {Promise<{ status: 'ok'|'denied'|'unverified'|'notfound', id?: string, name?: string, role?: string, error?: string }>}
 *   ok         → bot OWNER/ADMIN saluran itu (bisa kirim)
 *   denied     → saluran ada, tapi bot cuma follower (tidak bisa kirim)
 *   unverified → tidak bisa dicek (API gagal / role tidak terbaca); id dipakai apa adanya
 *   notfound   → saluran tidak ditemukan
 */
export async function detectChannel(conn, { jid, invite }) {
    let meta
    try {
        meta = invite
            ? await conn.newsletterMetadata('invite', invite)
            : await conn.newsletterMetadata('jid', jid)
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

/**
 * Tambah / perbarui saluran.
 * @returns {{ entry, created: boolean, demoted?: object }}
 */
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