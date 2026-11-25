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

export class BadMacHandler {
    constructor({ authFolder, logger, maxRetries = 8, windowMs = 5 * 60 * 1000, onLimit } = {}) {
        this.authFolder = authFolder
        this.logger = logger
        this.maxRetries = maxRetries
        this.windowMs = windowMs
        this.onLimit = onLimit
        this.errorCount = 0
        this.lastErrorAt = 0
        this.limitNotified = false
    }
    handleError(error, jid = 'unknown') {
        const now = Date.now()
        if (this.lastErrorAt && now - this.lastErrorAt > this.windowMs) this.resetErrorCount()
        this.lastErrorAt = now
        this.errorCount++
        this.logger?.warn?.({ jid, err: error?.message }, 'Bad MAC terdeteksi')
        if (this.errorCount >= this.maxRetries && !this.limitNotified) {
            this.limitNotified = true
            try { this.onLimit?.(this.getStats()) } catch { }
        }
        return this.errorCount
    }
    getStats() {
        return {
            errorCount: this.errorCount,
            maxRetries: this.maxRetries,
            lastErrorAt: this.lastErrorAt,
            authFolder: this.authFolder
        }
    }
    resetErrorCount() {
        this.errorCount = 0
        this.lastErrorAt = 0
        this.limitNotified = false
    }
}
