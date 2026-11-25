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

import { AIRich } from '../airich.js'

export async function sendRichCard(conn, m, { title, html, footer, emoji = '✨', tag = 'RICH' }) {
    await m.react(emoji).catch(() => { })
    try {
        const rich = new AIRich(conn)
        if (typeof rich.addSection !== 'function') throw new Error('AIRich.addSection tidak tersedia')
        if (typeof rich.setTitle === 'function') rich.setTitle(title)
        rich.addSection({
            view_model: {
                __typename: 'GenAISingleLayoutViewModel',
                primitive: { __typename: 'FOAHtmlPrimitiveDemoDONOTUSE', trusted_sources: [], payload: html }
            }
        })
        if (typeof rich.setFooter === 'function' && footer) rich.setFooter(footer)
        await rich.send(m.chat, { quoted: m })
        return true
    } catch (e) {
        console.error(`[${tag}]`, e?.stack || e?.message || e)
        await m.reply('❌ Kartu gagal dikirim. Fitur ini butuh WhatsApp versi terbaru.')
        return false
    }
}
