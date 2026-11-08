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

import dns from 'dns'
import net from 'net'
import http from 'http'
import https from 'https'
import axios from 'axios'
import nodeFetch from 'node-fetch'

if (!global.__httpTuned) {
    global.__httpTuned = true

    try { dns.setDefaultResultOrder('ipv4first') } catch { }
    try { net.setDefaultAutoSelectFamily?.(true) } catch { }
    try { net.setDefaultAutoSelectFamilyAttemptTimeout?.(400) } catch { }

    const agentOpts = { keepAlive: true, keepAliveMsecs: 15_000, maxSockets: 24, maxFreeSockets: 4, scheduling: 'lifo' }
    axios.defaults.httpAgent = new http.Agent(agentOpts)
    axios.defaults.httpsAgent = new https.Agent(agentOpts)
    http.globalAgent = axios.defaults.httpAgent
    https.globalAgent = axios.defaults.httpsAgent

    axios.defaults.adapter = 'http'
    axios.defaults.timeout = 30_000
    axios.defaults.maxRedirects = 5
    axios.defaults.headers.common['Accept-Encoding'] = 'gzip, deflate'

    const RETRY_CODES = new Set(['ECONNRESET', 'EPIPE', 'EAI_AGAIN', 'ECONNREFUSED', 'ETIMEDOUT', 'ENETUNREACH', 'EHOSTUNREACH'])
    axios.interceptors.response.use(undefined, async err => {
        const cfg = err?.config
        if (!cfg || cfg.noRetry) throw err
        const method = String(cfg.method || 'get').toLowerCase()
        if (method !== 'get' && method !== 'head') throw err
        const retryable = RETRY_CODES.has(err.code) || [502, 503, 504].includes(err.response?.status)
        if (!retryable || (cfg.__retried || 0) >= 1) throw err
        cfg.__retried = (cfg.__retried || 0) + 1
        await new Promise(r => setTimeout(r, 300 + Math.random() * 400))
        return axios(cfg)
    })
}

export const fetchWithTimeout = (url, opts = {}) =>
    opts.signal ? nodeFetch(url, opts) : nodeFetch(url, { ...opts, signal: AbortSignal.timeout(90_000) })

export function isNetworkError(e) {
    if (!e || typeof e !== 'object') return false
    if (e.isAxiosError) return true
    return /^(ECONN|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|EPIPE|ENETUNREACH|EHOSTUNREACH|UND_ERR)/.test(String(e.code || '')) ||
        e.name === 'AbortError' || e.name === 'TimeoutError' || e.name === 'FetchError'
}

export function describeError(e) {
    if (!e) return 'Unknown error'
    if (typeof e === 'string') return e
    if (e.isAxiosError) {
        let host = ''
        try { host = new URL(e.config?.url, e.config?.baseURL).host } catch { host = String(e.config?.url || '') }
        const status = e.response?.status
        if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT' || /timeout/i.test(e.message)) return `Timeout menghubungi ${host} (${(e.config?.timeout || 0) / 1000}s)`
        if (status) return `HTTP ${status} dari ${host}`
        return `${e.code || 'NETWORK'}: ${e.message} (${host})`
    }
    if (e.name === 'AbortError' || e.name === 'TimeoutError') return 'Permintaan dibatalkan karena timeout'
    return e.message || String(e)
}

export { axios }
