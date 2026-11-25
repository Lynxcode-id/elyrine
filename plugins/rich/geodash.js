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

import { AIRich } from '../../lib/airich.js'
import { buildGeoDashHtml } from '../../lib/cards/geodash.js'

const FOOTER = '© 𝙴𝚁𝙸𝙽𝙴-𝙰𝙸 ~ 𝙶𝙴𝙾 𝙳𝙰𝚂𝙷'

let handler = async (m, { conn }) => {
    await m.react('🟩').catch(() => { })
    const nama = m.pushName || String(m.sender).split('@')[0]
    try {
        const rich = new AIRich(conn)
        if (typeof rich.addSection !== 'function') throw new Error('AIRich.addSection tidak tersedia')
        if (typeof rich.setTitle === 'function') rich.setTitle('Geo Dash Live')
        rich.addSection({
            view_model: {
                __typename: 'GenAISingleLayoutViewModel',
                primitive: { __typename: 'FOAHtmlPrimitiveDemoDONOTUSE', trusted_sources: [], payload: buildGeoDashHtml({ playerName: nama }) }
            }
        })
        if (typeof rich.setFooter === 'function') rich.setFooter(FOOTER)
        await rich.send(m.chat, { quoted: m })
    } catch (e) {
        console.error('[GEODASH]', e?.stack || e?.message || e)
        await m.reply('❌ Kartu gagal dikirim. Fitur ini butuh WhatsApp versi terbaru.')
    }
}

handler.help = ['geodash']
handler.tags = ['rich']
handler.command = /^(geodash)$/i
handler.register = true

export default handler
