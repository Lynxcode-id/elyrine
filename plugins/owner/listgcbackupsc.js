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

import { getStore, labelGroup, formatSize, EXCLUDE_ROOT } from '../../lib/backupsc.js'

let handler = async (m, { usedPrefix }) => {
    const s = getStore()
    if (!s.groups.length) return m.reply(`ℹ️ Belum ada grup backup terdaftar.\n\nTambah dulu:\n${usedPrefix}addgcbackupsc  (di dalam grup)\n${usedPrefix}addgcbackupsc <idgrup>`)

    const rows = s.groups.map((g, i) => `${i + 1}. *${labelGroup(g)}*\n    \`${g.id}\``)
    const wita = ts => new Date(ts + 8 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' WITA'
    const last = s.lastRun
        ? `${wita(s.lastRun)}${s.lastResult ? ` · ${formatSize(s.lastResult.size)} · ${s.lastResult.ok} OK/${s.lastResult.failed} gagal` : ''}`
        : 'belum pernah'

    m.reply(
        `*GRUP BACKUP SC* (${s.groups.length})\n\n` +
        rows.join('\n') +
        `\n\n⏱️ Otomatis: ${s.intervalHours ? `tiap ${s.intervalHours} jam` : 'mati'}` +
        `\n🕘 Terakhir: ${last}` +
        `\n🚫 Tidak di-backup: ${EXCLUDE_ROOT.join(', ')}` +
        `\n\nHapus: ${usedPrefix}delgcbackupsc <nomor|idgrup>\nBackup sekarang: ${usedPrefix}backupsc`
    )
}

handler.help = ['listgcbackupsc']
handler.tags = ['owner']
handler.command = /^(listgcbackupsc)$/i
handler.owner = true

export default handler
