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

const API_BASE = 'https://lynxsnippets.web.id'
const MAX_BYTES = 1024 * 1024
const TIMEOUT = 20000

const LANGS = ['javascript', 'typescript', 'python', 'java', 'php', 'go', 'rust', 'c', 'cpp', 'csharp', 'html', 'css', 'json', 'bash', 'sql', 'yaml', 'plaintext']
const EXT_LANG = {
    js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    py: 'python', java: 'java', php: 'php', go: 'go', rs: 'rust',
    c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', hpp: 'cpp', cs: 'csharp',
    html: 'html', htm: 'html', css: 'css', json: 'json',
    sh: 'bash', bash: 'bash', sql: 'sql', yml: 'yaml', yaml: 'yaml',
    txt: 'plaintext', md: 'plaintext'
}

const DEFAULT_KEY = ''
const getKey = () => global.APIKeys?.[API_BASE] || process.env.LYNX_API_KEY || DEFAULT_KEY

const langFromName = name => EXT_LANG[String(name || '').split('.').pop().toLowerCase()] || null
const normLang = l => {
    const v = String(l || '').toLowerCase()
    const alias = { js: 'javascript', ts: 'typescript', py: 'python', rs: 'rust', cs: 'csharp', sh: 'bash', yml: 'yaml', text: 'plaintext', txt: 'plaintext' }
    const r = alias[v] || v
    return LANGS.includes(r) ? r : null
}

const unfence = raw => {
    const t = String(raw || '').trim()
    const mt = t.match(/^```([\w+-]*)[ \t]*\n([\s\S]*?)\n?```$/)
    return mt ? { lang: normLang(mt[1]), code: mt[2] } : { lang: null, code: t }
}

const box = (title, lines) => [`*${title}*`, '', ...lines, '', 'with love, elyra !!'].join('\n')

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const p = usedPrefix + command
    const key = getKey()

    let arg = String(text || '')
    let ttlHours = null
    arg = arg.replace(/\bttl[=:](\d+)\b/i, (_, n) => { ttlHours = Math.max(1, Math.min(Number(n), 24 * 365)); return '' }).trim()

    const q = m.quoted
    const qmsg = q?.msg || q
    const qFile = qmsg?.fileName || q?.fileName || ''
    const isDoc = !!q && (q.mtype === 'documentMessage' || q.mtype === 'documentWithCaptionMessage' || !!qFile) && typeof q.download === 'function'

    let title = ''
    let lang = null
    let code = ''

    try {
        if (isDoc) {
            const buf = await q.download()
            if (!buf?.length) throw new Error('Gagal mengunduh file.')
            if (buf.length > MAX_BYTES) throw new Error('File terlalu besar (maks 1 MB).')
            if (buf.includes(0)) throw new Error('File bukan teks/kode.')
            code = buf.toString('utf8')
            title = arg.split(/\s+/)[0] || qFile || 'file.txt'
            lang = langFromName(title) || langFromName(qFile)
        } else if (q && (q.text || qmsg?.text || qmsg?.caption)) {
            const f = unfence(q.text || qmsg?.text || qmsg?.caption)
            code = f.code
            lang = f.lang
            title = arg.split(/\s+/)[0] || 'snippet.txt'
        } else if (arg.includes('|')) {
            const i = arg.indexOf('|')
            title = arg.slice(0, i).trim().split(/\s+/)[0] || 'snippet.txt'
            const f = unfence(arg.slice(i + 1))
            code = f.code
            lang = f.lang
        } else {
            return m.reply([
                '*Lynx Snip*',
                '',
                'Upload kode ke Lynx Snip (owner only).',
                '',
                `♡ Reply file kode : ${p}`,
                `♡ Reply teks kode : ${p} nama.js`,
                `♡ Langsung        : ${p} nama.js | kode`,
                `♡ Kedaluwarsa     : tambah ttl:24 (jam)`,
                '',
                `Bahasa: ${LANGS.join(', ')}`,
                '',
                'with love, elyra !!'
            ].join('\n'))
        }

        if (!code.trim()) throw new Error('Isi kode kosong.')
        if (Buffer.byteLength(code) > MAX_BYTES) throw new Error('Kode terlalu besar (maks 1 MB).')
        lang = lang || langFromName(title) || 'plaintext'

        const res = await fetch(`${API_BASE}/api/paste`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': key },
            body: JSON.stringify({ title, lang, content: code, ttlHours }),
            signal: AbortSignal.timeout(TIMEOUT)
        })
        const raw = await res.text().catch(() => '')
        let data = null
        try { data = JSON.parse(raw) } catch { }
        if (!res.ok || !data?.url) {
            const detail = data?.error || data?.message || raw.replace(/\s+/g, ' ').slice(0, 120)
            throw new Error(`HTTP ${res.status}${detail ? ' - ' + detail : ''}`)
        }

        return m.reply(box('Lynx Snip', [
            `♡ Judul : ${title}`,
            `♡ Bahasa : ${lang}`,
            `♡ Expire : ${ttlHours ? ttlHours + ' jam' : 'permanen'}`,
            `♡ Link : ${data.url}`,
            `♡ Raw : ${data.raw || '-'}`
        ]))
    } catch (e) {
        const msg = e?.name === 'TimeoutError' ? 'Server tidak merespon (timeout).' : (e?.message || String(e))
        return m.gagal(msg, 'Lynx Snip')
    }
}

handler.help = ['snip <judul> | <kode>', 'lynxsnip (reply file/kode)']
handler.tags = ['owner']
handler.command = /^(snip|lynxsnip)$/i
handler.owner = true

export default handler
