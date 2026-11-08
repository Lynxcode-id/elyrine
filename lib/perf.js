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

import os from 'os'

const MB = 1024 * 1024

export function memoryBudgetMB() {
    let limit = 0
    try { limit = Number(process.constrainedMemory?.() || 0) } catch { }
    if (!limit || limit > 64 * 1024 * MB) limit = os.totalmem()
    return Math.floor(limit / MB)
}

export function suggestedHeapMB() {
    const env = Number(process.env.BOT_HEAP_MB)
    if (env > 0) return env
    return Math.max(192, Math.min(768, Math.floor(memoryBudgetMB() * 0.5)))
}

export async function tuneSharp() {
    try {
        const sharp = (await import('sharp')).default
        sharp.cache({ memory: 32, files: 0, items: 48 })
        sharp.concurrency(Number(process.env.BOT_SHARP_THREADS) || 1)
    } catch {}
}

export function startMemoryWatchdog({ intervalMs = 60_000, minUptimeSec = 600 } = {}) {
    if (global.__memWatchdog) return
    const budget = memoryBudgetMB()
    const limitMB = Number(process.env.BOT_RSS_LIMIT_MB) || Math.max(350, Math.floor(budget * 0.8))
    global.__inflight = global.__inflight || 0
    let strikes = 0
    global.__memWatchdog = setInterval(() => {
        const rss = process.memoryUsage().rss / MB
        if (rss < limitMB) { strikes = 0; return }
        try { global.gc?.() } catch { }
        if (process.memoryUsage().rss / MB < limitMB * 0.9) { strikes = 0; return }
        strikes++
        if (strikes >= 3 && process.uptime() > minUptimeSec && !global.__inflight && process.send) {
            console.warn(`[MEM] RSS ${rss.toFixed(0)}MB > ${limitMB}MB, restart terjadwal untuk membersihkan memori`)
            Promise.resolve(global.db?.write?.()).catch(() => { }).finally(() => process.send('reset'))
        }
    }, intervalMs)
    global.__memWatchdog.unref()
}
