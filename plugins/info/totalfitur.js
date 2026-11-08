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

const BOT_TITLE = 'ERINE-AI • ELYRINE'
const FOOTER = 'ERINE-AI • ELYRINE'

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0)
const bar = (n, max, size = 10) => {
  const fill = n > 0 ? Math.min(size, Math.max(1, Math.round((n / (max || 1)) * size))) : 0
  return '■'.repeat(fill) + '□'.repeat(size - fill)
}
const names = p => [...new Set([].concat(p.help || []).map(h => String(h).trim().split(/\s+/)[0]).filter(Boolean))]
const count = (list, ...keys) => list.filter(p => keys.some(k => p[k])).length

function scan() {
  const all = Object.values(global.plugins).filter(p => p && !p.disabled && p.help && names(p).length)
  const map = new Map()
  for (const p of all) {
    const tags = [].concat(p.tags || []).map(t => String(t).trim()).filter(Boolean)
    const seen = new Set()
    for (const t of (tags.length ? tags : ['other'])) {
      const key = norm(t) || t.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      let g = map.get(key)
      if (!g) { g = { name: t, key, list: [] }; map.set(key, g) }
      g.list.push(p)
    }
  }
  return { all, groups: [...map.values()] }
}

const head = `୨ৎ ${BOT_TITLE}\n    自動化アシスタント\n\n`

function summary(all, groups, _p, command) {
  const cmdTotal = all.reduce((n, p) => n + names(p).length, 0)
  const ranked = [...groups].sort((a, b) => b.list.length - a.list.length || a.name.localeCompare(b.name))
  const widest = Math.max(...ranked.map(g => g.list.length), 1)
  const lines = [
    head + '  ── Total Fitur\n',
    `  𖹭 Total plugin : ${all.length}`,
    `  𖹭 Total command : ${cmdTotal}`,
    `  𖹭 Total tags : ${groups.length}`,
    '',
    '  ── Hak Akses\n',
    `  𖹭 Owner : ${count(all, 'owner', 'rowner')}`,
    `  𖹭 Premium : ${count(all, 'premium')}`,
    `  𖹭 Limit : ${count(all, 'limit')}`,
    `  𖹭 Register : ${count(all, 'register')}`,
    `  𖹭 Grup : ${count(all, 'group')}`,
    `  𖹭 Private : ${count(all, 'private')}`,
    `  𖹭 Admin : ${count(all, 'admin')}`,
    `  𖹭 Bot admin : ${count(all, 'botAdmin')}`,
    '',
    '  ── Per Tags\n'
  ]
  ranked.forEach((g, i) => {
    lines.push(`  ${String(i + 1).padStart(2, '0')} ${bar(g.list.length, widest)} ${g.name} — ${g.list.length} (${pct(g.list.length, all.length)}%)`)
  })
  lines.push('', `  Plugin dengan banyak tags dihitung di tiap tags.`, `  Detail : ${_p}${command} <tags>`)
  return lines.join('\n')
}

function detail(all, groups, key, _p) {
  const g = groups.find(x => x.key === key || norm(x.name) === key)
  if (!g) {
    return head + '  ── Tags Tersedia\n\n' + [...groups].sort((a, b) => a.name.localeCompare(b.name)).map(x => `  𖹭 ${x.name}`).join('\n')
  }
  const cmds = g.list.reduce((n, p) => n + names(p).length, 0)
  const lines = [
    head + `  ── ${g.name}\n`,
    `  𖹭 Total plugin : ${g.list.length}`,
    `  𖹭 Total command : ${cmds}`,
    `  𖹭 Porsi : ${pct(g.list.length, all.length)}% ${bar(g.list.length, all.length)}`,
    `  𖹭 Dari : ${all.length} plugin`,
    '',
    '  ── Daftar Fitur\n'
  ]
  const rows = g.list.map(p => {
    const f = [p.owner || p.rowner ? '🔒' : '', p.premium ? 'Ⓟ' : '', p.limit ? 'Ⓛ' : '', p.group ? '👥' : ''].join('')
    return `${names(p).join(', ')}${f ? ' ' + f : ''}`
  }).sort()
  rows.forEach((r, i) => lines.push(`  ${String(i + 1).padStart(2, '0')}. ${r}`))
  lines.push('', '  🔒 owner  Ⓟ premium  Ⓛ limit  👥 grup')
  return lines.join('\n')
}

let handler = async (m, { conn, args, usedPrefix: _p, command }) => {
  const { all, groups } = scan()
  const q = norm(args.join(' '))
  const text = (q ? detail(all, groups, q, _p) : summary(all, groups, _p, command)) + `\n\n${FOOTER}`
  await conn.reply(m.chat, text, m)
}

handler.help = ['totalfitur']
handler.tags = ['info']
handler.command = /^(totalfitur|totalplugin)$/i
handler.register = true

export default handler
