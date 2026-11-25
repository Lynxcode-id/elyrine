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

import { listSounds } from '../../lib/sambutan.js'

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
  const cmd = command.toLowerCase()
  const status = chat.welcome ? 'ON' : 'OFF'

  if (cmd === 'cekwelcome') {
    const sounds = listSounds(m.chat).length
    if (!chat.sWelcome) {
      return m.reply(`Welcome: *${status}*\nTeks welcome belum diset (pakai teks default).\nAudio sambutan: ${sounds}\n\nSet: ${usedPrefix}setwelcome <teks>`)
    }
    await m.reply(`Welcome: *${status}*\nAudio sambutan: ${sounds}\n\nTeks welcome:`)
    return conn.sendMessage(m.chat, { text: chat.sWelcome }, { quoted: m })
  }

  if (cmd === 'delwelcome') {
    if (!chat.sWelcome) throw 'Teks welcome belum diset.'
    delete chat.sWelcome
    return m.reply('Teks welcome dihapus, kembali ke teks default.')
  }

  const first = (args[0] || '').toLowerCase()
  if (cmd === 'welcome' && first !== 'on' && first !== 'off') {
    return m.reply(`Status welcome: *${status}*\n\n${usedPrefix}welcome on\n${usedPrefix}welcome off`)
  }
  if (args.length === 1 && (first === 'on' || first === 'off')) {
    chat.welcome = first === 'on'
    return m.reply(`Welcome ${chat.welcome ? 'diaktifkan' : 'dinonaktifkan'}.`)
  }

  const body = (text || '').trim() || (m.quoted && (m.quoted.text || m.quoted.caption) || '').trim()
  if (!body) {
    return m.reply(`Status: *${status}*\n\n${usedPrefix}welcome on / off\n${usedPrefix}${command} <teks>\n\nPlaceholder:\n@user = tag member baru\n@namegc = nama grup\n@deskgc = deskripsi grup\n@member = jumlah member\n\nContoh:\n${usedPrefix}${command} welcome bro @user !! selamat datang di @namegc 🔥`)
  }
  chat.sWelcome = body
  m.reply(`Teks welcome disimpan.\nStatus: *${status}*${chat.welcome ? '' : `\nAktifkan dengan ${usedPrefix}welcome on`}`)
}

handler.help = ['welcome on/off', 'setwelcome <teks>', 'delwelcome', 'cekwelcome']
handler.tags = ['group']
handler.command = /^(welcome|setwelcome|delwelcome|cekwelcome)$/i
handler.group = true
handler.admin = true

export default handler
