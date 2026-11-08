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

import { parseChannelInput, detectChannel, findSaluran, upsertSaluran, labelSaluran, saveDb } from '../../lib/saluran.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const usage = `Contoh:\n${usedPrefix}${command} 120363xxxxxxxxxx@newsletter\n${usedPrefix}${command} 120363xxxxxxxxxx@newsletter|owner\n\n• tanpa _|owner_ → saluran biasa\n• _|owner_ → saluran owner (hanya SATU; owner lama otomatis jadi biasa)\n• bisa juga pakai link saluran (whatsapp.com/channel/...)`
    if (!text) return m.reply(usage)

    const [rawId, rawRole, ...extra] = text.split('|').map(v => v.trim())
    const roleTok = (rawRole || '').toLowerCase()
    if (extra.length || (roleTok && !['owner', 'biasa', 'normal'].includes(roleTok))) return m.reply(`❌ Format salah.\n\n${usage}`)
    const wantOwner = roleTok === 'owner'

    const target = parseChannelInput(rawId)
    if (!target) return m.reply(`❌ ID saluran tidak valid. Harus berakhiran @newsletter (atau link saluran).\n\n${usage}`)

    if (target.jid) {
        const ada = findSaluran(target.jid)
        if (ada) {
            if (!wantOwner) return m.reply(`ℹ️ Saluran *${labelSaluran(ada)}* sudah terdaftar (${ada.owner ? 'OWNER' : 'biasa'}).`)
            if (ada.owner) return m.reply(`ℹ️ Saluran *${labelSaluran(ada)}* sudah jadi OWNER.`)
            const { demoted } = upsertSaluran({ id: ada.id, owner: true })
            await saveDb()
            return m.reply(`✅ *${labelSaluran(ada)}* sekarang jadi saluran OWNER.` + (demoted ? `\n↩️ *${labelSaluran(demoted)}* diturunkan jadi biasa (owner cuma satu).` : ''))
        }
    }

    const info = await detectChannel(conn, target)
    if (info.status === 'notfound') return m.reply('❌ Saluran tidak ditemukan. Cek lagi ID / link-nya.')
    if (info.status === 'denied') return m.reply(`❌ Bot bukan owner/admin saluran${info.name ? ' *' + info.name + '*' : ''} (peran: ${info.role}). Follower tidak bisa kirim pesan ke saluran.`)
    if (!info.id) return m.reply(`❌ Gagal membaca saluran dari link${info.error ? ': ' + info.error : ''}. Coba pakai ID @newsletter langsung.`)

    const dup = findSaluran(info.id)
    if (dup && !wantOwner) return m.reply(`ℹ️ Saluran *${labelSaluran(dup)}* sudah terdaftar (${dup.owner ? 'OWNER' : 'biasa'}).`)

    const { entry, created, demoted } = upsertSaluran({ id: info.id, name: info.name, owner: wantOwner })
    await saveDb()

    m.reply([
        `✅ Saluran ${created ? 'ditambahkan' : 'diperbarui'}: *${labelSaluran(entry)}*`,
        `🆔 \`${entry.id}\``,
        `🏷️ ${entry.owner ? '👑 OWNER' : 'Biasa'}`,
        demoted && `↩️ *${labelSaluran(demoted)}* diturunkan jadi biasa (owner cuma satu).`,
        info.status === 'unverified' && `⚠️ Peran bot di saluran ini tidak bisa diverifikasi${info.error ? ' (' + info.error + ')' : ''}. Kalau bot bukan owner/admin, kirim pesan akan gagal.`,
    ].filter(Boolean).join('\n'))
}

handler.help = ['addsaluran <idch>', 'addsaluran <idch>|owner']
handler.tags = ['owner']
handler.command = /^addsaluran$/i
handler.owner = true

export default handler
