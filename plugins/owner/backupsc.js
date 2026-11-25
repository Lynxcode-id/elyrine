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

import { runBackup, getStore, saveDb, formatSize, labelGroup, listGroups } from '../../lib/backupsc.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const [sub, val] = (text || '').trim().toLowerCase().split(/\s+/)

    if (sub === 'auto') {
        const s = getStore()
        if (!val) return m.reply(`⏱️ Otomatis saat ini: ${s.intervalHours ? `tiap ${s.intervalHours} jam` : 'mati'}\n\nUbah: ${usedPrefix}${command} auto <jam>  (contoh: auto 6)\nMatikan: ${usedPrefix}${command} auto off`)
        const hours = val === 'off' ? 0 : Number(val)
        if (!Number.isFinite(hours) || hours < 0 || hours > 720) return m.reply('❌ Jam harus 1–720, atau *off*.')
        s.intervalHours = Math.floor(hours)
        await saveDb()
        return m.reply(s.intervalHours ? `✅ Backup otomatis tiap *${s.intervalHours} jam*.` : '✅ Backup otomatis dimatikan.')
    }

    if (!listGroups().length) return m.reply(`ℹ️ Belum ada grup backup. Tambah dulu dengan ${usedPrefix}addgcbackupsc`)

    await m.reply('📦 Membuat backup SC, tunggu sebentar...')
    try {
        const r = await runBackup(conn, { reason: 'manual' })
        const lines = [`✅ Backup selesai (${formatSize(r.backup.size)}, ${r.backup.entries.length} item).`, `📨 Terkirim: ${r.ok.length} grup`]
        if (r.failed.length) lines.push(`⚠️ Gagal: ${r.failed.map(f => `${labelGroup(listGroups().find(g => g.id === f.id) || { id: f.id })} (${f.error})`).join(', ')}`)
        m.reply(lines.join('\n'))
    } catch (e) {
        m.reply(`❌ ${e.message}`)
    }
}

handler.help = ['backupsc', 'backupsc auto <jam|off>']
handler.tags = ['owner']
handler.command = /^(backupsc)$/i
handler.owner = true

export default handler
