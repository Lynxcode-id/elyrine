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

import fs from 'fs'
import path from 'path'

const BOT_TITLE = 'ERINE-AI ~ 3ND PROJECT'
const FOOTER = 'ҽɾιɳҽ-αι 3ɳԃ'
const MAX_DAYS = 10

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

function getFiles(dir, baseDir) {
    let results = []
    if (!fs.existsSync(dir)) return results

    for (const name of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, name)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
            results = results.concat(getFiles(fullPath, baseDir))
        } else if (fullPath.endsWith('.js')) {
            results.push({
                path: path.relative(baseDir, fullPath).replace(/\\/g, '/'),
                mtime: stat.mtimeMs
            })
        }
    }
    return results
}

function groupByDate(files) {
    const history = new Map()

    for (const file of files) {
        const d = new Date(file.mtime)
        const utc = d.getTime() + d.getTimezoneOffset() * 60000
        const wita = new Date(utc + 3600000 * 8)

        const dateKey = `${String(wita.getDate()).padStart(2, '0')} ${MONTHS[wita.getMonth()]} ${wita.getFullYear()}`
        const timeStr = `${String(wita.getHours()).padStart(2, '0')}.${String(wita.getMinutes()).padStart(2, '0')} WITA`

        if (!history.has(dateKey)) history.set(dateKey, [])
        history.get(dateKey).push({ path: file.path, time: timeStr })
    }
    return history
}

let handler = async (m, { conn }) => {
    await m.react('🌱').catch(() => { })

    try {
        const pluginsDir = path.join(process.cwd(), 'plugins')
        const scrapeDir = path.join(process.cwd(), 'scrape')

        const allFiles = [
            ...getFiles(pluginsDir, pluginsDir),
            ...getFiles(scrapeDir, scrapeDir).map(f => ({ ...f, path: `scrape/${f.path}` }))
        ].sort((a, b) => b.mtime - a.mtime)

        if (!allFiles.length) {
            await m.react('❌').catch(() => { })
            return m.reply(`୨ৎ ${BOT_TITLE}\n    自動化アシスタント\n\n  Belum ada riwayat pembaruan yang terdeteksi.\n\n${FOOTER}`)
        }

        const history = groupByDate(allFiles)
        const dates = [...history.keys()]
        const shown = dates.slice(0, MAX_DAYS)

        const lines = [
            `୨ৎ ${BOT_TITLE}`,
            '    自動化アシスタント',
            '',
            '  ── Riwayat Pembaruan',
            ''
        ]

        shown.forEach((date, i) => {
            lines.push(`  📅 *${date}*`)
            lines.push('  ┌─────────────')
            const items = history.get(date)
            items.forEach((item, j) => {
                const bar = j === items.length - 1 ? '└' : '├'
                lines.push(`  ${bar} 𖹭 \`${item.path}\` _(${item.time})_`)
            })
            if (i !== shown.length - 1) lines.push('')
        })

        if (dates.length > MAX_DAYS) {
            lines.push('', `  Hanya menampilkan ${MAX_DAYS} hari update terakhir`, '  agar pesan tidak terlalu panjang.')
        }

        lines.push('', FOOTER)

        await conn.reply(m.chat, lines.join('\n'), m)
        await m.react('💐').catch(() => { })
    } catch (err) {
        console.error('[LISTUPDATE]', err?.stack || err)
        await m.react('❌').catch(() => { })
        return m.reply(`୨ৎ ${BOT_TITLE}\n\n  ⚠️ Gagal memuat riwayat pembaruan.\n  _${err.message}_\n\n${FOOTER}`)
    }
}

handler.help = ['listupdate']
handler.tags = ['info']
handler.command = /^(listupdate)$/i
handler.owner = true

export default handler
