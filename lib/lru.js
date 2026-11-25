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

export class LRU {
    constructor(max = 500, ttl = 0) {
        this.max = max
        this.ttl = ttl
        this.cache = new Map()
    }
    get(key) {
        const entry = this.cache.get(key)
        if (!entry) return undefined
        if (entry.exp && entry.exp <= Date.now()) {
            this.cache.delete(key)
            return undefined
        }
        this.cache.delete(key)
        this.cache.set(key, entry)
        return entry.value
    }
    set(key, value, ttl = this.ttl) {
        if (this.cache.has(key)) this.cache.delete(key)
        this.cache.set(key, { value, exp: ttl > 0 ? Date.now() + ttl : 0 })
        while (this.cache.size > this.max) {
            const first = this.cache.keys().next().value
            this.cache.delete(first)
        }
        return this
    }
    has(key) {
        const entry = this.cache.get(key)
        if (!entry) return false
        if (entry.exp && entry.exp <= Date.now()) {
            this.cache.delete(key)
            return false
        }
        return true
    }
    delete(key) {
        return this.cache.delete(key)
    }
    clear() {
        this.cache.clear()
    }
    get size() {
        return this.cache.size
    }
}
