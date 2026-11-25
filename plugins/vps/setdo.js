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

import * as V from '../../lib/vps.js'

let handler = async (m, { conn, text, usedPrefix, command, isOwner }) => {
    const args = String(text || '').trim().split(/\s+/).filter(Boolean)
    const cmd = `${usedPrefix}${command}`
    const wipe = () => conn.sendMessage(m.chat, { delete: m.key }).catch(() => { })

    if (!args.length) {
        const own = V.ownToken(m.sender)
        const sumber = own ? 'token milikmu' : V.globalToken() ? 'bawaan bot (config.js)' : 'belum ada'
        return m.reply(`☾ *DIGITALOCEAN TOKEN*\n\n• Token kamu : ${own ? '`' + V.mask(own) + '`' : 'belum diset'}\n• Yang dipakai : ${sumber}\n\nSimpan: *${cmd} <token>*\nHapus : *${cmd} hapus*\n_Lakukan di chat pribadi. VPS dibuat di akun DigitalOcean milikmu._`)
    }

    if (/^(hapus|delete|del|reset)$/i.test(args[0]))
        return m.reply(V.delOwnToken(m.sender) ? '🗑️ Token DigitalOcean milikmu dihapus.' : 'Kamu belum menyimpan token DigitalOcean.')

    if (m.isGroup) return m.reply(`❌ Kirim token lewat chat pribadi bot, jangan di grup.`)

    if (/^(global|config)$/i.test(args[0])) {
        if (!isOwner) return m.reply('Khusus owner.')
        if (!args[1]) return m.reply(`Contoh: *${cmd} global <token>*`)
        V.setGlobalToken(args[1])
        await wipe()
        return m.reply('✅ Token DigitalOcean bawaan bot diperbarui.')
    }

    const token = args[0]
    if (token.length < 20 || !/^[\w-]+$/.test(token)) return m.reply('Token tidak terlihat valid. Buat token (Read & Write) di cloud.digitalocean.com/account/api/tokens')
    const had = V.setOwnToken(m.sender, token)
    await wipe()
    return m.reply(`✅ *Token DigitalOcean ${had ? 'diganti dengan yang baru' : 'tersimpan'}* dan dipakai untuk akunmu saja.\n\nCoba: ${usedPrefix}listvps\n_Pesan berisi token sudah coba dihapus; kalau masih ada, hapus manual._`)
}

handler.help = ['setdo']
handler.tags = ['vps']
handler.command = ['setdo']

export default handler
