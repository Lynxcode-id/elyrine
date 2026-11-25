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

import * as V from '../../lib/vercel.js'

let handler = async (m, { conn, text, usedPrefix, command, isOwner }) => {
    const args = String(text || '').trim().split(/\s+/).filter(Boolean)
    const cmd = `${usedPrefix}${command}`
    const wipe = () => conn.sendMessage(m.chat, { delete: m.key }).catch(() => { })

    if (!args.length) {
        const own = V.ownCred(m.sender)
        const sumber = own ? 'token milikmu' : isOwner && V.globalCred().token ? 'bawaan bot (config.js)' : 'belum ada'
        return m.reply(`▲ *VERCEL TOKEN*\n\n• Token kamu : ${own ? '`' + V.mask(own.token) + '`' : 'belum diset'}\n• Team ID    : ${own?.teamId || '-'}\n• Yang dipakai : ${sumber}\n\nSimpan: *${cmd} <token> [teamId]*\nHapus : *${cmd} hapus*\n_Lakukan di chat pribadi. Teamid hanya diisi kalau deploy ke Team._`)
    }

    if (/^(hapus|delete|del|reset)$/i.test(args[0]))
        return m.reply(V.delOwnCred(m.sender) ? '🗑️ Token Vercel milikmu dihapus.' : 'Kamu belum menyimpan token Vercel.')

    if (m.isGroup) return m.reply('❌ Kirim token lewat chat pribadi bot, jangan di grup.')

    if (/^(global|config)$/i.test(args[0])) {
        if (!isOwner) return m.reply('Khusus owner.')
        if (!args[1]) return m.reply(`Contoh: *${cmd} global <token> [teamId]*`)
        V.setGlobalCred({ token: args[1], teamId: args[2] || '' })
        await wipe()
        return m.reply('✅ Token Vercel bawaan bot diperbarui.')
    }

    const [token, teamId] = args
    if (token.length < 20 || !/^[\w-]+$/.test(token)) return m.reply('Token tidak terlihat valid. Buat token di vercel.com/account/tokens')
    const had = V.setOwnCred(m.sender, { token, teamId: teamId || '' })
    await wipe()
    return m.reply(`✅ *Token Vercel ${had ? 'diganti dengan yang baru' : 'tersimpan'}* dan dipakai untuk akunmu saja.\n\nCoba: ${usedPrefix}listvercel\n_Pesan berisi token sudah coba dihapus; kalau masih ada, hapus manual._`)
}

handler.help = ['setvercel']
handler.tags = ['vercel']
handler.command = ['setvercel']

export default handler
