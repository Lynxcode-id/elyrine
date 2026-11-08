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

import cp, { exec as _exec } from 'child_process'
import { promisify } from 'util'
let exec = promisify(_exec).bind(cp)

let handler = async (m, { conn, isROwner, usedPrefix, command, text }) => {
    if (!isROwner) return
    await m.react('🕓')
    let ar = Object.keys(plugins)
    let ar1 = ar.map(v => v.replace('.js', ''))
    if (!text) throw `uhm.. where the text?\n\nexample:\n${usedPrefix + command} info`
    if (!ar1.includes(text)) return m.reply(`*🗃️ NOT FOUND!*\n==================================\n\n${ar1.map(v => ' ' + v).join`\n`}`)
    let o
    try {
        o = await exec('cat plugins/' + text + '.js')
    } catch (e) {
        o = e
    } finally {
        let { stdout, stderr } = o
        if (stdout.trim()) m.reply(stdout)
        if (stderr.trim()) m.reply(stderr)
    }
}
handler.help = ['getplugin'].map(v => v + ' <text>')
handler.tags = ['owner']
handler.command = /^(getplugin|gp)$/i
handler.rowner = true

export default handler