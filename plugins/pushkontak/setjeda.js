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

import * as J from '../../lib/jpm.js'

let handler = async (m, { text, usedPrefix }) => {
    const [target, raw] = String(text || '').trim().split(/\s+/)
    const cfg = J.cfg()

    if (!target || !raw) {
        return m.reply(
            `*▢ SET JEDA*\n` +
            `• Jeda push : ${cfg.delayPushKontak}ms\n` +
            `• Jeda jpm : ${cfg.delayJpm}ms\n\n` +
            `Contoh:\n${usedPrefix}setjeda push 5000\n${usedPrefix}setjeda jpm 6000\n\n1 detik = 1000ms`
        )
    }

    const key = { push: 'delayPushKontak', jpm: 'delayJpm' }[target.toLowerCase()]
    if (!key) return m.reply('❌ Pilihan: *push* atau *jpm*')

    const ms = parseInt(raw)
    if (isNaN(ms) || ms < 1000) return m.reply('❌ Masukkan angka minimal 1000 (1 detik).')
    if (ms > 60000) return m.reply('❌ Maksimal 60000 (1 menit).')

    J.setCfg(key, ms)
    return m.reply(`*▢ JEDA ${target.toUpperCase()} DIUBAH*\n• Jeda : ${ms}ms (${ms / 1000} detik)`)
}

handler.help = ['setjeda']
handler.tags = ['pushkontak']
handler.command = ['setjeda', 'setdelay', 'jeda']
handler.owner = true

export default handler
