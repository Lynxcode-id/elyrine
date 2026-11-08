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

const LID_RE = /@lid$/i
const PN_RE = /@s\.whatsapp\.net$/i
const MAX_CACHE = 5000

export const isLid = (jid) => typeof jid === 'string' && LID_RE.test(jid)
export const isPn = (jid) => typeof jid === 'string' && PN_RE.test(jid)

export function normalizeJid(jid) {
    if (jid === null || jid === undefined) return null
    let s = String(jid).trim()
    if (!s) return null
    s = s.split('/')[0]
    if (!s.includes('@')) {
        const digits = s.replace(/[^0-9]/g, '')
        return digits ? `${digits}@s.whatsapp.net` : null
    }
    const [userPart, serverPart] = s.split('@')
    const user = userPart.split(':')[0]
    const server = serverPart.split(':')[0]
    const srv = server.toLowerCase() === 'c.us' ? 's.whatsapp.net' : server.toLowerCase()
    return user ? `${user}@${srv}` : null
}

class BoundedMap extends Map {
    set(k, v) {
        if (this.size >= MAX_CACHE && !this.has(k)) this.delete(this.keys().next().value)
        return super.set(k, v)
    }
}

/**
 * @param {object} opt
 * @param {import('better-sqlite3').Database} opt.db  handle sqlite (store.db dari SQLsessions)
 * @param {() => any} [opt.getConn]  getter socket aktif (dipakai fallback metadata grup & signal repository)
 */
export function createIdentity({ db, getConn = () => global.conn } = {}) {
    if (!db) throw new Error('createIdentity: db (better-sqlite3) wajib')

    db.exec(`
        CREATE TABLE IF NOT EXISTS contacts (
            lid_jid    TEXT PRIMARY KEY,
            pn_jid     TEXT NOT NULL,
            push_name  TEXT,
            updated_at INTEGER NOT NULL
        ) WITHOUT ROWID;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_pn ON contacts (pn_jid);
    `)

    const q = {
        byLid: db.prepare('SELECT * FROM contacts WHERE lid_jid = ?'),
        byPn: db.prepare('SELECT * FROM contacts WHERE pn_jid = ?'),
        dropPn: db.prepare('DELETE FROM contacts WHERE pn_jid = ? AND lid_jid != ?'),
        upsert: db.prepare(`
            INSERT INTO contacts (lid_jid, pn_jid, push_name, updated_at) VALUES (?, ?, ?, ?)
            ON CONFLICT(lid_jid) DO UPDATE SET
                pn_jid = excluded.pn_jid,
                push_name = COALESCE(excluded.push_name, contacts.push_name),
                updated_at = excluded.updated_at
        `),
        count: db.prepare('SELECT COUNT(*) AS n FROM contacts')
    }
    const write = db.transaction((lid, pn, name) => {
        q.dropPn.run(pn, lid)
        q.upsert.run(lid, pn, name, Math.floor(Date.now() / 1000))
    })

    const lidToPn = new BoundedMap()
    const pnToLid = new BoundedMap()
    const names = new BoundedMap()
    const pending = new Map()

    const syncLegacyMap = (lid, pn) => {
        const conn = getConn?.()
        if (!conn) return
        if (!conn.isLid) conn.isLid = {}
        conn.isLid[lid] = pn
    }

    const remember = (lid, pn, name) => {
        lidToPn.set(lid, pn)
        pnToLid.set(pn, lid)
        if (name) { names.set(lid, name); names.set(pn, name) }
        syncLegacyMap(lid, pn)
    }

    function learn(a, b, pushName) {
        a = normalizeJid(a); b = normalizeJid(b)
        if (!a || !b) return null
        let lid, pn
        if (isLid(a) && isPn(b)) { lid = a; pn = b }
        else if (isPn(a) && isLid(b)) { lid = b; pn = a }
        else return null

        const name = typeof pushName === 'string' && pushName.trim() ? pushName.trim() : null
        const known = lidToPn.get(lid)
        const knownName = names.get(lid)
        if (known === pn && (!name || name === knownName)) return { created: false, updated: false, nameChanged: false }

        let row = q.byLid.get(lid)
        const created = !row
        const changedPn = !!row && row.pn_jid !== pn
        const nameChanged = !!name && name !== row?.push_name
        if (!row || changedPn || nameChanged) {
            try { write(lid, pn, name) } catch (e) { return null }
        }
        remember(lid, pn, name ?? row?.push_name ?? null)
        return { created, updated: changedPn, nameChanged }
    }

    function learnKey(key, pushName) {
        if (!key) return null
        const r1 = learn(key.participant, key.participantAlt, pushName)
        const r2 = learn(key.remoteJid, key.remoteJidAlt, key.participant ? undefined : pushName)
        return r1 ?? r2
    }

    function learnGroup(metadata) {
        const list = metadata?.participants
        if (!Array.isArray(list)) return 0
        let n = 0
        for (const p of list) {
            const ids = [p?.id, p?.lid, p?.jid, p?.phoneNumber, p?.participant].map(normalizeJid).filter(Boolean)
            const lid = ids.find(isLid)
            const pn = ids.find(isPn)
            if (lid && pn && learn(lid, pn)) n++
        }
        return n
    }

    function learnContacts(contacts) {
        for (const c of contacts?.contacts || contacts || []) {
            const ids = [c?.id, c?.lid, c?.phoneNumber, c?.jid].map(normalizeJid).filter(Boolean)
            const lid = ids.find(isLid)
            const pn = ids.find(isPn)
            if (lid && pn) learn(lid, pn, c.notify || c.name || c.verifiedName)
        }
    }

    function fromDb(jid) {
        if (isLid(jid)) {
            const row = q.byLid.get(jid)
            if (row) { remember(row.lid_jid, row.pn_jid, row.push_name); return row.pn_jid }
        } else if (isPn(jid)) {
            const row = q.byPn.get(jid)
            if (row) { remember(row.lid_jid, row.pn_jid, row.push_name); return row.lid_jid }
        }
        return null
    }

    function fromGroups(lid) {
        const conn = getConn?.()
        const chats = conn?.chats
        if (!chats) return null
        for (const chat of Object.values(chats)) {
            const list = chat?.metadata?.participants
            if (!list?.length) continue
            const hit = list.find(p => normalizeJid(p?.lid) === lid || normalizeJid(p?.id) === lid || normalizeJid(p?.jid) === lid)
            if (!hit) continue
            const pn = [hit.phoneNumber, hit.jid, hit.id].map(normalizeJid).find(isPn)
            if (pn) { learn(lid, pn); return pn }
        }
        return null
    }

    function lookupPn(lid) {
        lid = normalizeJid(lid)
        if (!isLid(lid)) return null
        return lidToPn.get(lid) ?? fromDb(lid) ?? fromGroups(lid) ?? null
    }

    function lookupLid(pn) {
        pn = normalizeJid(pn)
        if (!isPn(pn)) return null
        return pnToLid.get(pn) ?? fromDb(pn) ?? null
    }

    function toPn(jid) {
        const n = normalizeJid(jid)
        if (!n) return null
        if (!isLid(n)) return n
        return lookupPn(n)
    }

    const toPnOrSelf = (jid) => toPn(jid) ?? normalizeJid(jid) ?? jid

    async function resolve(jid) {
        const sync = toPn(jid)
        if (sync) return sync
        const lid = normalizeJid(jid)
        if (!isLid(lid)) return null
        if (pending.has(lid)) return pending.get(lid)

        const task = (async () => {
            const conn = getConn?.()
            if (!conn) return null
            const attempts = [
                async () => (await conn.signalRepository?.lidMapping?.getPNForLID?.(lid)),
                async () => (await conn.getPNForLID?.(lid)),
                async () => (await conn.findUserId?.(lid))?.phoneNumber
            ]
            for (const attempt of attempts) {
                try {
                    const pn = normalizeJid(await attempt())
                    if (isPn(pn)) { learn(lid, pn); return pn }
                } catch {}
            }
            return null
        })().finally(() => pending.delete(lid))
        pending.set(lid, task)
        return task
    }

    const number = (jid) => {
        const pn = toPn(jid)
        return pn && isPn(pn) ? pn.split('@')[0] : null
    }

    const tag = (jid) => {
        const n = number(jid)
        if (n) return '@' + n
        const raw = normalizeJid(jid)
        return raw ? '@' + raw.split('@')[0] : '@'
    }

    const name = (jid) => {
        const n = normalizeJid(jid)
        if (!n) return null
        const hit = names.get(n)
        if (hit) return hit
        const lid = isLid(n) ? n : lookupLid(n)
        const pn = isPn(n) ? n : lookupPn(n)
        return (lid && names.get(lid)) || (pn && names.get(pn)) || q.byLid.get(lid ?? '')?.push_name || null
    }

    function contact(jid) {
        const n = normalizeJid(jid)
        const pn = toPn(n)
        const lid = isLid(n) ? n : (pn ? lookupLid(pn) : null)
        return {
            jid: pn ?? n,
            lid: lid ?? null,
            number: pn && isPn(pn) ? pn.split('@')[0] : null,
            tag: tag(n),
            pushName: name(n),
            resolved: !!pn && isPn(pn)
        }
    }

    function normalizeParticipants(list = []) {
        return list.map((p) => {
            if (!p || typeof p !== 'object') return p
            const ids = [p.id, p.lid, p.jid, p.phoneNumber, p.participant].map(normalizeJid).filter(Boolean)
            const lid = ids.find(isLid) ?? null
            let pn = ids.find(isPn) ?? (lid ? lookupPn(lid) : null)
            if (lid && pn) learn(lid, pn)
            if (!pn) return { ...p, lid: p.lid ?? lid }
            return { ...p, id: pn, jid: pn, phoneNumber: pn, lid: lid ?? p.lid ?? null }
        })
    }

    async function resolveMessage(m) {
        if (!m) return m
        learnKey(m.key, m.pushName)

        let sender = m.sender
        let lid = isLid(sender) ? normalizeJid(sender) : null
        if (lid) {
            const pn = await resolve(lid)
            if (pn) {
                sender = pn
                Object.defineProperty(m, 'sender', { value: pn, writable: true, enumerable: true, configurable: true })
            }
        }
        const pn = isPn(sender) ? normalizeJid(sender) : null
        const senderLid = lid ?? (pn ? lookupLid(pn) : null)

        Object.defineProperties(m, {
            senderLid: { value: senderLid, writable: true, enumerable: true, configurable: true },
            senderNumber: { value: pn ? pn.split('@')[0] : null, writable: true, enumerable: true, configurable: true },
            senderTag: { value: tag(sender), writable: true, enumerable: true, configurable: true },
            contact: { get: () => contact(sender), enumerable: true, configurable: true }
        })
        return m
    }

    return {
        isLid, isPn, normalizeJid,
        learn, learnKey, learnGroup, learnContacts,
        lookupPn, lookupLid, toPn, toPnOrSelf, resolve,
        number, tag, name, contact,
        normalizeParticipants, resolveMessage,
        count: () => q.count.get().n
    }
}

export default createIdentity
