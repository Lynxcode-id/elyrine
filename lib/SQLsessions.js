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

import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'

const B = await import('elyra-baileys')
const lib = B.BufferJSON ? B : (B.default ?? B)
const { BufferJSON, initAuthCreds, proto } = lib

const SCHEMA_VERSION = 1

const KNOWN_KEY_TYPES = [
    'app-state-sync-version', 'app-state-sync-key', 'sender-key-memory', 'sender-key',
    'lid-mapping', 'device-list', 'identity-key', 'pre-key', 'session', 'tctoken'
]

export const SIGNAL_SESSION_TYPES = ['session', 'sender-key', 'sender-key-memory']

const encode = (value) => JSON.stringify(value, BufferJSON.replacer)
const decode = (text) => JSON.parse(text, BufferJSON.reviver)

function applyPragmas(db) {
    db.pragma('journal_mode = WAL')
    db.pragma('synchronous = NORMAL')
    db.pragma('busy_timeout = 5000')
    db.pragma('temp_store = MEMORY')
    db.pragma('cache_size = -8000')
    db.pragma('mmap_size = 33554432')
    db.pragma('wal_autocheckpoint = 1000')
    db.pragma('journal_size_limit = 16777216')
}

function migrateSchema(db) {
    const version = db.pragma('user_version', { simple: true })
    if (version >= SCHEMA_VERSION) return
    db.exec(`
        CREATE TABLE IF NOT EXISTS auth_creds (
            id         TEXT PRIMARY KEY,
            value      TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        ) WITHOUT ROWID;

        CREATE TABLE IF NOT EXISTS auth_keys (
            type       TEXT NOT NULL,
            id         TEXT NOT NULL,
            value      TEXT NOT NULL,
            updated_at INTEGER NOT NULL,
            PRIMARY KEY (type, id)
        ) WITHOUT ROWID;
    `)
    db.pragma(`user_version = ${SCHEMA_VERSION}`)
}

function openDatabase(file, { log }) {
    const open = () => {
        const db = new Database(file)
        applyPragmas(db)
        const check = db.pragma('quick_check', { simple: true })
        if (check !== 'ok') throw Object.assign(new Error(`quick_check: ${check}`), { code: 'SQLITE_CORRUPT' })
        migrateSchema(db)
        return db
    }
    try {
        return open()
    } catch (e) {
        const corrupt = /SQLITE_CORRUPT|SQLITE_NOTADB|malformed|not a database/i.test(`${e.code} ${e.message}`)
        if (!corrupt) throw e
        const backup = `${file}.corrupt-${Date.now()}`
        log.warn?.(`[SQLsessions] database rusak (${e.message}). Dipindah ke ${path.basename(backup)}, sesi dibuat ulang → perlu pairing ulang.`)
        for (const suffix of ['', '-wal', '-shm']) {
            try { fs.renameSync(file + suffix, backup + suffix) } catch {}
        }
        return open()
    }
}

function parseLegacyFileName(name) {
    const base = name.replace(/\.json$/i, '')
    for (const type of KNOWN_KEY_TYPES) {
        if (base.startsWith(type + '-')) {
            return { type, id: base.slice(type.length + 1).replace(/__/g, '/') }
        }
    }
    return null
}

function migrateFromFiles(db, dir, log) {
    const credsFile = path.join(dir, 'creds.json')
    if (!fs.existsSync(credsFile)) return { migrated: false }

    const upsertCreds = db.prepare('INSERT OR REPLACE INTO auth_creds (id, value, updated_at) VALUES (?, ?, ?)')
    const upsertKey = db.prepare('INSERT OR REPLACE INTO auth_keys (type, id, value, updated_at) VALUES (?, ?, ?, ?)')
    const now = Date.now()
    let keys = 0, skipped = 0

    db.transaction(() => {
        const raw = fs.readFileSync(credsFile, 'utf8')
        decode(raw)
        upsertCreds.run('creds', raw, now)

        for (const name of fs.readdirSync(dir)) {
            if (name === 'creds.json' || !name.endsWith('.json')) continue
            const parsed = parseLegacyFileName(name)
            if (!parsed) { skipped++; continue }
            try {
                const text = fs.readFileSync(path.join(dir, name), 'utf8')
                decode(text)
                upsertKey.run(parsed.type, parsed.id, text, now)
                keys++
            } catch { skipped++ }
        }
    })()

    log.info?.(`[SQLsessions] migrasi dari file: creds + ${keys} key (${skipped} dilewati). Folder lama tidak diubah.`)
    return { migrated: true, keys, skipped }
}

/**
 * @param {string} dbFile  path file sqlite, mis. 'sessions/erine.sqlite'
 * @param {object} [opts]
 * @param {string} [opts.migrateFrom]  folder useMultiFileAuthState lama untuk diimpor sekali (kalau DB masih kosong)
 * @param {number} [opts.checkpointMs] interval wal_checkpoint, default 5 menit (0 = mati)
 * @param {{info?:Function,warn?:Function}} [opts.logger] default console
 */
export async function useSQLiteAuthState(dbFile, opts = {}) {
    const log = opts.logger ?? { info: (...a) => console.log(...a), warn: (...a) => console.warn(...a) }
    const file = path.resolve(dbFile)
    fs.mkdirSync(path.dirname(file), { recursive: true })

    const db = openDatabase(file, { log })

    const q = {
        getCreds: db.prepare('SELECT value FROM auth_creds WHERE id = ?'),
        putCreds: db.prepare('INSERT INTO auth_creds (id, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'),
        getKey: db.prepare('SELECT value FROM auth_keys WHERE type = ? AND id = ?'),
        putKey: db.prepare('INSERT INTO auth_keys (type, id, value, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(type, id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'),
        delKey: db.prepare('DELETE FROM auth_keys WHERE type = ? AND id = ?'),
        countKeys: db.prepare('SELECT type, COUNT(*) AS n FROM auth_keys GROUP BY type ORDER BY type')
    }

    if (!q.getCreds.get('creds') && opts.migrateFrom) {
        const dir = path.resolve(opts.migrateFrom)
        if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
            try { migrateFromFiles(db, dir, log) } catch (e) { log.warn?.('[SQLsessions] migrasi gagal, mulai sesi baru:', e.message) }
        }
    }

    const row = q.getCreds.get('creds')
    const creds = row ? decode(row.value) : initAuthCreds()
    if (!row) q.putCreds.run('creds', encode(creds), Date.now())

    const writeKeys = db.transaction((data) => {
        const now = Date.now()
        for (const type of Object.keys(data)) {
            const bucket = data[type]
            if (!bucket) continue
            for (const id of Object.keys(bucket)) {
                const value = bucket[id]
                if (value === null || value === undefined) q.delKey.run(type, id)
                else q.putKey.run(type, id, encode(value), now)
            }
        }
    })

    const keys = {
        get(type, ids) {
            const out = {}
            for (const id of ids) {
                const r = q.getKey.get(type, id)
                if (!r) continue
                let value = decode(r.value)
                if (type === 'app-state-sync-key' && value) value = proto.Message.AppStateSyncKeyData.fromObject(value)
                out[id] = value
            }
            return out
        },
        set(data) { writeKeys(data) }
    }

    const state = { creds, keys }
    const saveCreds = async () => { q.putCreds.run('creds', encode(state.creds), Date.now()) }

    let closed = false
    const checkpoint = (mode = 'PASSIVE') => { if (!closed) db.pragma(`wal_checkpoint(${mode})`) }
    const timer = (opts.checkpointMs ?? 5 * 60 * 1000) > 0
        ? setInterval(() => { try { checkpoint('PASSIVE') } catch {} }, opts.checkpointMs ?? 5 * 60 * 1000)
        : null
    timer?.unref?.()

    const store = {
        db,
        file,

        clearKeys(types = SIGNAL_SESSION_TYPES, { dryRun = false } = {}) {
            const list = Array.isArray(types) ? types : [types]
            const marks = list.map(() => '?').join(',')
            if (dryRun) return db.prepare(`SELECT COUNT(*) AS n FROM auth_keys WHERE type IN (${marks})`).get(...list).n
            return db.prepare(`DELETE FROM auth_keys WHERE type IN (${marks})`).run(...list).changes
        },

        stats() {
            const byType = Object.fromEntries(q.countKeys.all().map(r => [r.type, r.n]))
            let sizeBytes = 0
            try { sizeBytes = fs.statSync(file).size } catch {}
            return { file, sizeBytes, keys: byType, totalKeys: Object.values(byType).reduce((a, b) => a + b, 0) }
        },

        exportCreds() { return q.getCreds.get('creds')?.value ?? encode(state.creds) },

        async backup(destFile) { await db.backup(path.resolve(destFile)); return path.resolve(destFile) },

        checkpoint,

        close() {
            if (closed) return
            try { checkpoint('TRUNCATE') } catch {}
            try { db.pragma('optimize') } catch {}
            closed = true
            if (timer) clearInterval(timer)
            try { db.close() } catch {}
        }
    }

    process.once('exit', () => store.close())

    return { state, saveCreds, store }
}

export default useSQLiteAuthState
