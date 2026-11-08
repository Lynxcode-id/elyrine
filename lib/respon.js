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

export const render = (tpl, vars = {}) => String(tpl ?? '').replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '-')

export const formatTime = ms => ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(ms < 10000 ? 2 : 1)}s`

export const waitText = (vars = {}) => render(global.wait ?? global.proses, vars)

export function errorText(errorMessage, provider) {
    let msg = typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || errorMessage?.error || String(errorMessage ?? 'Unknown error'))
    for (const key of Object.values(global.APIKeys || {})) if (key) msg = msg.split(key).join('#HIDDEN#')
    return render(global.eror ?? global.error, { errorMessage: msg.trim(), provider: provider || global.namebot })
}

export const limitText = (vars = {}) => render(global.limitHabis, vars)

export const successText = (response, ms) => render(global.sukses, { response, processingTime: formatTime(ms ?? 0) })
