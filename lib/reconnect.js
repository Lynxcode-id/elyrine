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

const LOGGED_OUT = 401
const FORBIDDEN = 403
const CONNECTION_REPLACED = 440
const RESTART_REQUIRED = 515

export function autoReconnect(createSocket, {
    onSocket,
    onLoggedOut,
    onFatal,
    onRetry,
    onEscalate,
    minDelay = 1000,
    maxDelay = 30000,
    slowDelay = 60000,
    openTimeoutMs = 90000,
    livenessMs = 30000,
    escalateAfterFails = 12,
    escalateAfterMs = 10 * 60 * 1000
} = {}) {
    let sock = null
    let timer = null
    let openTimer = null
    let liveTimer = null
    let stopped = false
    let connecting = false
    let attempts = 0
    let lastOpenAt = Date.now()
    let escalated = false
    let generation = 0

    const clearGuards = () => {
        clearTimeout(openTimer); openTimer = null
        clearInterval(liveTimer); liveTimer = null
    }

    const closeSocket = s => {
        if (!s) return
        try { s.ev?.removeAllListeners?.('connection.update') } catch { }
        try { s.end?.(undefined) } catch { }
        try { s.ws?.close?.() } catch { }
        try { s.ws?.terminate?.() } catch { }
    }

    const backoff = n => {
        const base = Math.min(minDelay * 2 ** Math.max(0, n - 1), maxDelay)
        return Math.round(base * (0.8 + Math.random() * 0.4))
    }

    const maybeEscalate = () => {
        if (escalated || stopped) return false
        const tooMany = attempts >= escalateAfterFails
        const tooLong = Date.now() - lastOpenAt >= escalateAfterMs && attempts >= 3
        if (!tooMany && !tooLong) return false
        escalated = true
        try { onEscalate?.({ attempts, downMs: Date.now() - lastOpenAt }) } catch (e) { console.error('[reconnect] onEscalate error:', e?.message || e) }
        setTimeout(() => { escalated = false }, 60000).unref?.()
        return true
    }

    const schedule = (ms, code) => {
        if (stopped) return
        if (timer) return
        attempts++
        try { onRetry?.({ code, attempt: attempts, delay: ms }) } catch { }
        maybeEscalate()
        timer = setTimeout(() => { timer = null; connect() }, ms)
    }

    const handleDown = (gen, code, error) => {
        if (stopped || gen !== generation) return
        generation++
        clearGuards()
        const dead = sock
        sock = null
        closeSocket(dead)

        if (code === LOGGED_OUT) {
            stopped = true
            try { onLoggedOut?.(code) } catch (e) { console.error(e) }
            return
        }
        if (code === CONNECTION_REPLACED || code === FORBIDDEN) {
            try { onFatal?.(error, code) } catch (e) { console.error(e) }
            return schedule(slowDelay, code)
        }
        schedule(code === RESTART_REQUIRED ? 500 : backoff(attempts + 1), code)
    }

    const connect = async () => {
        if (stopped || connecting) return
        connecting = true
        try {
            clearGuards()
            const old = sock
            sock = null
            generation++
            closeSocket(old)

            let current
            try {
                current = await createSocket()
            } catch (e) {
                console.error('[reconnect] gagal membuat socket:', e?.message || e)
                connecting = false
                return schedule(backoff(attempts + 1), 'create')
            }
            if (stopped) { closeSocket(current); return }

            sock = current
            const gen = generation

            openTimer = setTimeout(() => handleDown(gen, 408, new Error('open timeout')), openTimeoutMs)

            try {
                await onSocket?.(current)
            } catch (e) {
                console.error('[reconnect] onSocket error:', e?.message || e)
                return handleDown(gen, 'bind', e)
            }

            current.ev.on('connection.update', ({ connection, lastDisconnect }) => {
                if (stopped || gen !== generation) return
                if (connection === 'open') {
                    clearTimeout(openTimer); openTimer = null
                    attempts = 0
                    escalated = false
                    lastOpenAt = Date.now()
                    startLiveness(current, gen)
                    return
                }
                if (connection === 'close') {
                    handleDown(gen, lastDisconnect?.error?.output?.statusCode, lastDisconnect?.error)
                }
            })
        } finally {
            connecting = false
        }
    }

    const startLiveness = (current, gen) => {
        clearInterval(liveTimer)
        let bad = 0
        liveTimer = setInterval(() => {
            if (stopped || gen !== generation) return clearInterval(liveTimer)
            const ws = current.ws
            let alive
            if (typeof ws?.isOpen === 'boolean') alive = ws.isOpen
            else if (typeof ws?.socket?.readyState === 'number') alive = ws.socket.readyState === 1
            else if (typeof ws?.readyState === 'number') alive = ws.readyState === 1
            if (alive === undefined) return
            bad = alive ? 0 : bad + 1
            if (bad >= 2) handleDown(gen, 428, new Error('websocket mati tanpa event close'))
        }, livenessMs)
        liveTimer.unref?.()
    }

    return {
        get socket() { return sock },
        async start() {
            stopped = false
            attempts = 0
            lastOpenAt = Date.now()
            await connect()
            return sock
        },
        stop() {
            stopped = true
            clearTimeout(timer); timer = null
            clearGuards()
            const s = sock
            sock = null
            generation++
            closeSocket(s)
        }
    }
}
