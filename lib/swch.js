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

import * as baileys from 'elyrine-baileys'
import pino from 'pino'

const FACTORIES = {
    sendNewsletterStatus: ['makeNewsletterStatusSender', true],
    sendNewsletterStatusReaction: ['makeNewsletterStatusReactionSender', false],
    revokeNewsletterStatus: ['makeNewsletterStatusRevokeSender', false],
    getNewsletterStatuses: ['makeNewsletterStatusFetcher', false],
    getNewsletterStatusUpdates: ['makeNewsletterStatusUpdatesFetcher', false],
}

const attached = new WeakSet()

let logger

const getLogger = () => {
    if (!logger) logger = pino({ level: 'silent' })
    return logger
}

export function ensureSwch(conn) {
    if (!conn || typeof conn !== 'object') {
        throw new Error('Socket WhatsApp tidak valid.')
    }

    if (typeof conn.sendNewsletterStatus === 'function') {
        attached.add(conn)
        return true
    }

    if (attached.has(conn)) {
        attached.delete(conn)
    }

    const log = getLogger()
    const config = {
        logger: log,
        options: { logger: log }
    }

    for (const [method, [factory, needConfig]] of Object.entries(FACTORIES)) {
        if (typeof conn[method] === 'function') continue

        const make = baileys[factory]

        if (typeof make !== 'function') {
            if (method === 'sendNewsletterStatus') {
                throw new Error(
                    `elyrine-baileys tidak menyediakan ${factory}.`
                )
            }

            continue
        }

        try {
            conn[method] = needConfig
                ? make(conn, config)
                : make(conn)
        } catch (e) {
            throw new Error(
                `Gagal memasang ${factory}: ${e.message}`
            )
        }
    }

    attached.add(conn)
    return true
}

function normalizeCapabilities(value, result = []) {
    if (!value) return result

    if (typeof value === 'string') {
        result.push(value)
        return result
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            normalizeCapabilities(item, result)
        }

        return result
    }

    if (typeof value === 'object') {
        const name = value.name ?? value.capability

        if (typeof name === 'string') {
            result.push(name)
        }

        for (const key of ['capabilities', 'items', 'data', 'result']) {
            if (value[key]) {
                normalizeCapabilities(value[key], result)
            }
        }
    }

    return result
}

export async function canPostChannelStatus(conn, jid) {
    ensureSwch(conn)

    if (typeof conn.newsletterCanPostStatus === 'function') {
        return conn.newsletterCanPostStatus(jid)
    }

    if (typeof conn.newsletterAdminCapabilities !== 'function') {
        return {
            canPost: true,
            unchecked: true,
            capabilities: []
        }
    }

    try {
        const raw = await conn.newsletterAdminCapabilities(jid)

        const capabilities = normalizeCapabilities(raw)

        if (!capabilities.length) {
            return {
                canPost: true,
                unchecked: true,
                capabilities
            }
        }

        return {
            canPost: capabilities.some(
                item => /STATUS_PRODUCER/i.test(item)
            ),
            capabilities
        }
    } catch (e) {
        return {
            canPost: true,
            unchecked: true,
            capabilities: [],
            error: String(e?.message || e)
        }
    }
}

function findServerId(value, depth = 0) {
    if (
        !value ||
        typeof value !== 'object' ||
        depth > 8
    ) return null

    const keys = [
        'newsletterStatusServerId',
        'serverId',
        'server_id',
        'statusServerId',
        'status_server_id'
    ]

    for (const key of keys) {
        const id = value[key]

        if (
            (typeof id === 'string' || typeof id === 'number') &&
            String(id).trim()
        ) {
            return String(id)
        }
    }

    for (const item of Object.values(value)) {
        const found = findServerId(item, depth + 1)

        if (found) return found
    }

    return null
}

export function getNewsletterStatusReceipt(res = {}) {
    const serverId = (
        res.newsletterStatusServerId ||
        findServerId(res)
    )

    const ack =
        res.newsletterStatusResponse ||
        res.response ||
        (res.attrs?.class === 'status' ? res : null)

    const delivered =
        res.newsletterStatusDelivered ||
        res.delivered ||
        null

    return {
        serverId: serverId || null,

        ackReceived: Boolean(ack || res.ackReceived),

        echoReceived: Boolean(delivered),

        ackAttrs: ack?.attrs || null,

        echoAttrs: delivered?.attrs || null,

        raw: res
    }
}

export async function postChannelStatus(conn, jid, content, opts = {}) {
    ensureSwch(conn)

    if (typeof conn.sendNewsletterStatus !== 'function') {
        throw new Error('Newsletter status sender tidak tersedia.')
    }

    return conn.sendNewsletterStatus(jid, content, opts)
}

export async function reactChannelStatus(conn, jid, serverId, emoji) {
    ensureSwch(conn)

    if (typeof conn.sendNewsletterStatusReaction !== 'function') {
        throw new Error('Newsletter status reaction tidak tersedia.')
    }

    return conn.sendNewsletterStatusReaction(jid, serverId, emoji)
}

export async function revokeChannelStatus(conn, jid, statusId) {
    ensureSwch(conn)

    if (typeof conn.revokeNewsletterStatus !== 'function') {
        throw new Error('Newsletter status revoke tidak tersedia.')
    }

    return conn.revokeNewsletterStatus(jid, statusId)
}

export async function listChannelStatus(conn, jid, opts = { count: 20 }) {
    ensureSwch(conn)

    if (typeof conn.getNewsletterStatuses !== 'function') {
        throw new Error('Newsletter status fetcher tidak tersedia.')
    }

    return conn.getNewsletterStatuses(jid, opts)
}

export async function getChannelStatusUpdates(conn, jid, opts = {}) {
    ensureSwch(conn)

    if (typeof conn.getNewsletterStatusUpdates !== 'function') {
        throw new Error('Newsletter status updates fetcher tidak tersedia.')
    }

    return conn.getNewsletterStatusUpdates(jid, opts)
}
