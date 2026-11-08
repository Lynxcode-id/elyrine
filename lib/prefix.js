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

export const MAX_PREFIX_LEN = 10
export const NOPREFIX_MODES = ['off', 'owner', 'all']

const esc = s => s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')

export const splitChars = str => Array.from(String(str || ''))

export function defaultPrefixes() {
    const raw = global.opts?.prefix || '‎xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-'
    return [...new Set(splitChars(raw))]
}

export function getCfg() {
    const data = global.db?.data
    if (!data) return { list: null, noprefix: 'off' }
    const c = data.prefixcfg = data.prefixcfg || {}
    if (!NOPREFIX_MODES.includes(c.noprefix)) c.noprefix = 'off'
    if (!Array.isArray(c.list)) c.list = null
    return c
}

export const getPrefixList = () => [...(getCfg().list ?? defaultPrefixes())]

export function buildPrefixRegex(list = getPrefixList()) {
    if (!list.length) return /(?!)/
    const parts = [...list]
        .sort((a, b) => b.length - a.length)
        .map(p => esc(p) + (Array.from(p).length > 1 && /[\p{L}\p{N}]$/u.test(p) ? '(?=\\s|$)' : ''))
    return new RegExp('^(?:' + parts.join('|') + ')', 'u')
}

export function applyPrefix() {
    global.prefix = buildPrefixRegex()
    return global.prefix
}

export function setPrefixList(list) {
    getCfg().list = list === null ? null : [...new Set(list)]
    return applyPrefix()
}

export function setNoPrefix(mode) {
    if (!NOPREFIX_MODES.includes(mode)) throw new Error('mode no-prefix tidak valid: ' + mode)
    getCfg().noprefix = mode
}

export function canNoPrefix(isOwner) {
    const mode = getCfg().noprefix
    return mode === 'all' || (mode === 'owner' && !!isOwner)
}

export function validatePrefix(raw) {
    const value = String(raw ?? '')
    if (!value.trim()) return { error: 'Prefix tidak boleh kosong.' }
    if (/\s/.test(value.trim()) ) return { error: 'Prefix tidak boleh mengandung spasi di tengah.' }
    const v = value.trim()
    if (Array.from(v).length > MAX_PREFIX_LEN) return { error: `Prefix maksimal ${MAX_PREFIX_LEN} karakter.` }
    return { value: v }
}

const LEAD_JUNK = /^[\u200e\u200f\u200b\u2063\ufeff\s]+/

export function splitCommand(body) {
    const b = String(body ?? '').replace(LEAD_JUNK, '').trimEnd()
    const i = b.search(/\s/)
    const command = (i < 0 ? b : b.slice(0, i)).toLowerCase()
    const text = i < 0 ? '' : b.slice(i).replace(/^\s+/, '')
    const _args = text ? text.split(' ') : []
    return { command, args: _args.filter(Boolean), _args, text }
}

export function commandCandidates(text, usedPrefix, allowNoPrefix) {
    const pref = usedPrefix ? { usedPrefix, body: String(text).replace(usedPrefix, ''), viaNoPrefix: false } : null
    const bare = allowNoPrefix && text ? { usedPrefix: '', body: String(text), viaNoPrefix: true } : null
    if (pref && bare && /^[\p{L}\p{N}]/u.test(usedPrefix)) return [bare, pref]
    return [pref, bare].filter(Boolean)
}

export function acceptsCommand(plugin, command) {
    const c = plugin.command
    const one = x => x instanceof RegExp ? x.test(command) : typeof x === 'string' && x.toLowerCase() === command
    if (c instanceof RegExp) return c.test(command)
    if (Array.isArray(c)) return c.some(one)
    return one(c)
}
