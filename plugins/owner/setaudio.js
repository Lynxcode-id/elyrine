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

import { getMenuAudioInfo, saveMenuAudio, removeMenuAudio, MIN_AUDIO_SIZE } from '../../lib/menuaudio.js'

let handler = async (m, { conn, usedPrefix, command }) => {
    const cmd = command.toLowerCase()

    if (/^(delaudiomenu|delaudio|hapusaudiomenu)$/.test(cmd)) {
        return m.reply(removeMenuAudio() ? '🗑️ Audio menu dihapus.' : 'Audio menu belum disetel.')
    }

    const q = m.quoted
    const mime = (q?.msg || q)?.mimetype || ''

    if (!q) {
        const now = getMenuAudioInfo()
        return m.reply([
            `Audio menu: ${now ? `aktif (${(now.size / 1024).toFixed(1)} KB)` : 'belum disetel'}`,
            '',
            'Cara pakai (reply audio):',
            `› ${usedPrefix}${command}`,
            `Hapus: ${usedPrefix}delaudiomenu`
        ].join('\n'))
    }
    if (!/^audio\//.test(mime)) return m.reply('Reply pesan audio untuk dijadikan audio menu.')

    let buffer
    try {
        buffer = await q.download()
    } catch (err) {
        console.error('[SETAUDIOMENU] download error:', err?.message || err)
        return m.reply('Gagal mengunduh audio.')
    }
    if (!buffer || buffer.length < MIN_AUDIO_SIZE) return m.reply('Audio terlalu kecil atau tidak valid.')

    try {
        const saved = saveMenuAudio(buffer, { mimetype: mime })
        return m.reply([
            'Audio menu berhasil disetel.',
            `› Format : ${saved.mimetype}`,
            `› Ukuran : ${(saved.size / 1024).toFixed(1)} KB`,
            '› Dikirim sebagai voice note setelah menu tampil.'
        ].join('\n'))
    } catch (err) {
        console.error('[SETAUDIOMENU] save error:', err?.stack || err?.message || err)
        return m.reply(`Gagal menyimpan audio menu: ${err?.message || 'unknown'}`)
    }
}

handler.help = ['setaudiomenu (reply audio)', 'delaudiomenu']
handler.tags = ['owner']
handler.command = /^(setaudiomenu|setaudio|setmenuaudio|menuaudio|delaudiomenu|delaudio|hapusaudiomenu)$/i
handler.owner = true

export default handler
