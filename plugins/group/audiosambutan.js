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

import { addSound, removeSound, listSounds, sendSound, MAX_SOUNDS } from '../../lib/sambutan.js'

const kb = n => `${(n / 1024).toFixed(1)} KB`
const when = t => new Date(t).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const cmd = command.toLowerCase()

  if (/^(listaudiosambutan|listsoundsambutan|audiosambutan)$/.test(cmd)) {
    const sounds = listSounds(m.chat)
    if (!sounds.length) {
      return m.reply(`Belum ada sound sambutan di grup ini.\n\nTambah: reply audio dengan *${usedPrefix}setaudiosambutan*`)
    }

    const pick = parseInt(args[0], 10)
    if (pick) {
      const s = sounds[pick - 1]
      if (!s) return m.reply(`Nomor tidak ada. Pilih 1-${sounds.length}.`)
      return sendSound(conn, m.chat, s, m)
    }

    return m.reply([
      `*SOUND SAMBUTAN · ${sounds.length}/${MAX_SOUNDS}*`,
      '',
      ...sounds.map((s, i) => `${i + 1}. ${kb(s.size)} · ${s.ptt ? 'voice note' : 'audio'} · ${when(s.savedAt)}`),
      '',
      `Putar: *${usedPrefix}${command} <nomor>*`,
      `Hapus: *${usedPrefix}delaudiosambutan <nomor|all>*`,
      'Saat ada member baru, salah satu sound dikirim acak setelah pesan welcome.'
    ].join('\n'))
  }

  if (/^(delaudiosambutan|delsoundsambutan|hapusaudiosambutan)$/.test(cmd)) {
    const which = String(args[0] || '').toLowerCase()
    if (!which) {
      const n = listSounds(m.chat).length
      return m.reply(`Sound sambutan grup ini: ${n}\n\nContoh:\n› ${usedPrefix}${command} 2\n› ${usedPrefix}${command} all`)
    }
    const res = removeSound(m.chat, which)
    if (!res.total && !res.removed) return m.reply('Belum ada sound sambutan di grup ini.')
    if (res.invalid) return m.reply(`Nomor tidak ada. Pilih 1-${res.total} atau *all*.`)
    return m.reply(which === 'all' ? `🗑️ ${res.removed} sound sambutan dihapus.` : `🗑️ Sound nomor ${which} dihapus. Sisa ${res.total}.`)
  }

  const q = m.quoted
  const msg = q?.msg || q
  const mime = msg?.mimetype || ''

  if (!q) {
    const n = listSounds(m.chat).length
    return m.reply([
      `Sound sambutan grup ini: ${n}/${MAX_SOUNDS}`,
      '',
      'Cara pakai (reply audio):',
      `› ${usedPrefix}${command}`,
      '',
      'Sound yang sama ditimpa, sound lain ditambahkan dan dikirim acak.',
      `Lihat: ${usedPrefix}listaudiosambutan · Hapus: ${usedPrefix}delaudiosambutan`
    ].join('\n'))
  }
  if (!/^audio\//.test(mime)) return m.reply('Reply pesan audio untuk dijadikan sound sambutan.')

  let buffer
  try {
    buffer = await q.download()
  } catch (e) {
    console.error('[SAMBUTAN] download error:', e?.message || e)
    return m.reply('Gagal mengunduh audio.')
  }

  try {
    const res = addSound(m.chat, buffer, { mimetype: mime, ptt: msg?.ptt === true })
    const nomor = listSounds(m.chat).findIndex(s => s.id === res.entry.id) + 1
    return m.reply(res.status === 'replaced'
      ? `♻️ Sound yang sama sudah ada, ditimpa (nomor ${nomor}). Total ${res.total}.`
      : `✅ Sound sambutan ditambahkan (nomor ${nomor}, ${kb(res.entry.size)}). Total ${res.total}.`)
  } catch (e) {
    return m.reply(`❌ ${e.message}`)
  }
}

handler.help = ['setaudiosambutan (reply audio)', 'delaudiosambutan <nomor|all>', 'listaudiosambutan [nomor]']
handler.tags = ['group']
handler.command = /^(setaudiosambutan|setsoundsambutan|delaudiosambutan|delsoundsambutan|hapusaudiosambutan|listaudiosambutan|listsoundsambutan|audiosambutan)$/i
handler.group = true
handler.admin = true
handler.register = true

export default handler
