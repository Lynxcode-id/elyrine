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

const AUTO = ['blautojpm', 'blacklistautojpm', 'autojpmbl', 'listblautojpm']
const onoff = v => (v ? '🟢 Aktif' : '🔴 Nonaktif')

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const c = command.toLowerCase()

    if (c === 'setdelayjpm' || c === 'setdelayjpmtag') {
        const tag = c === 'setdelayjpmtag'
        const ms = parseInt(text)
        if (isNaN(ms) || ms < 500) return m.reply(`Contoh: ${usedPrefix}${command} <ms>  (minimal 500, contoh: 3000)`)
        J.setCfg(tag ? 'delayJpmTag' : 'delayJpm', ms)
        return m.reply(`*▢ DELAY JPM${tag ? ' TAG' : ''}*\n• Delay : ${ms}ms\n• Status : Berhasil diubah`)
    }

    if (c === 'jpmstatus') {
        const jobs = J.jobs()
        const cfg = J.cfg()
        let total = 0
        let banned = 0
        try {
            total = Object.keys(await conn.groupFetchAllParticipating()).length
            banned = Object.entries(global.db.data.chats).filter(([id, v]) => id.endsWith('@g.us') && v?.isBanned).length
        } catch { }
        return m.reply(
            `*▢ STATUS JPM*\n` +
            `• Auto JPM : ${onoff(jobs.autoJpm)}\n` +
            `• Auto JPM Tag : ${onoff(jobs.autoJpmTag)}\n` +
            `• Auto SWGC : ${onoff(jobs.autoSwgc)}\n` +
            `• Push Kontak : ${onoff(jobs.pushRunning)}\n` +
            `• Delay JPM : ${cfg.delayJpm}ms\n` +
            `• Delay JPM Tag : ${cfg.delayJpmTag}ms\n` +
            `• Delay Auto SWGC : ${cfg.delayAutoSwgc}ms\n` +
            `• Delay Push Kontak : ${cfg.delayPushKontak}ms\n` +
            `• Blacklist JPM : ${J.blacklist(false).length} grup\n` +
            `• Blacklist Auto JPM : ${J.blacklist(true).length} grup\n` +
            `• Total grup : ${total} grup\n` +
            `• Grup banchat (dilewati) : ${banned} grup`
        )
    }

    const auto = AUTO.includes(c)
    const title = auto ? 'BLACKLIST AUTO JPM' : 'BLACKLIST JPM'
    const [act = '', ...rest] = String(text || '').trim().split(/\s+/)
    const action = act.toLowerCase()
    const list = J.blacklist(auto)
    const jids = rest.join('').split(',').map(v => v.trim()).filter(v => v.endsWith('@g.us'))
    const targets = jids.length ? jids : (m.isGroup ? [m.chat] : [])
    const noTarget = '❌ Tulis JID grup (berakhiran @g.us), atau pakai perintah ini di dalam grup.'

    if (action === 'add') {
        if (!targets.length) return m.reply(noTarget)
        const baru = targets.filter(j => !list.includes(j))
        J.setBlacklist(auto, [...list, ...baru])
        return m.reply(`*▢ ${title}*\n• Ditambah : ${baru.length} grup\n• Sudah ada : ${targets.length - baru.length} grup\n• Total : ${list.length + baru.length} grup`)
    }
    if (['del', 'remove', 'hapus'].includes(action)) {
        if (!targets.length) return m.reply(noTarget)
        const sisa = list.filter(j => !targets.includes(j))
        J.setBlacklist(auto, sisa)
        return m.reply(`*▢ ${title}*\n• Dihapus : ${list.length - sisa.length} grup\n• Sisa : ${sisa.length} grup`)
    }
    if (action === 'list' || c.includes('list')) {
        if (!list.length) return m.reply(`*▢ ${title}*\n• Belum ada grup di blacklist`)
        const rows = []
        for (const [i, id] of list.entries()) {
            const meta = await conn.groupMetadata(id).catch(() => null)
            rows.push(`${i + 1}. ${meta?.subject || 'Grup tidak dikenal'}\n   ${id}`)
        }
        return m.reply(`*▢ ${title}*\n• Total : ${list.length} grup\n\n${rows.join('\n')}`)
    }
    return m.reply(`*▢ ${title}*\n\nGrup di blacklist tidak menerima ${auto ? 'auto ' : ''}JPM.\n\n• ${usedPrefix}${command} list\n• ${usedPrefix}${command} add <jid1>,<jid2>\n• ${usedPrefix}${command} del <jid1>,<jid2>\n\nTanpa jid, perintah berlaku untuk grup tempat dipakai.\n• Total saat ini : ${list.length} grup`)
}

handler.help = ['setdelayjpm', 'setdelayjpmtag', 'jpmstatus', 'blacklistjpm', 'blautojpm']
handler.tags = ['jpm']
handler.command = ['setdelayjpm', 'setdelayjpmtag', 'jpmstatus', 'blacklistjpm', 'bljpm', 'jpmbl', 'jpmblacklist', 'listblacklistjpm', ...AUTO]
handler.owner = true

export default handler
