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

import fs from 'fs/promises'
import { existsSync } from 'fs'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'
import { ROOT } from '../../lib/function.js'

const LIB_DIR = path.join(ROOT, 'lib')
const BACKUP_DIR = path.join(ROOT, 'store', 'lib-backup')

const PROTECTED = new Set([
    'function.js', 'converter.js', 'SQLsessions.js', 'identity.js', 'thumbnail.js', 'menuaudio.js',
    'album.js', 'uploader.js', 'respon.js', 'prefix.js', 'limit.js', 'channel.js', 'target.js'
])

function parseLibName(raw) {
    let name = String(raw || '').trim()
    if (!name) return null
    if (!name.toLowerCase().endsWith('.js')) name += '.js'
    if (!/^[\w$][\w$.-]*\.js$/i.test(name) || name.includes('..')) return null
    return name
}

async function readSource(q) {
    if (!q) return null
    let text = null
    const mime = (q.msg || q).mimetype || ''
    if (q.mtype === 'documentMessage' || /^(application|text)\//.test(mime)) {
        const buffer = await q.download()
        text = buffer ? Buffer.from(buffer).toString('utf8') : null
    } else if (q.text) {
        text = q.text
    }
    if (!text) return null
    return text
        .replace(/^\s*```[a-z]*\r?\n/i, '')
        .replace(/\r?\n```\s*$/, '')
        .replace(/^\uFEFF/, '')
}

async function checkSyntax(code) {
    const tmp = path.join(os.tmpdir(), `addlib-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`)
    await fs.writeFile(tmp, code)
    try {
        await new Promise((resolve, reject) => {
            execFile(process.execPath, ['--check', tmp], { timeout: 15000 }, (err, _out, stderr) => {
                if (err) reject(new Error(String(stderr || err.message)))
                else resolve()
            })
        })
        return null
    } catch (err) {
        return err.message.split(tmp).join('lib').split('\n')
            .filter(l => l.trim() && !/^\s+at /.test(l) && !/^Node\.js v/.test(l)).slice(0, 6).join('\n')
    } finally {
        fs.rm(tmp, { force: true }).catch(() => { })
    }
}

async function walk(dir, out = []) {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
    for (const e of entries) {
        if (e.name === 'node_modules' || e.name.startsWith('.')) continue
        const full = path.join(dir, e.name)
        if (e.isDirectory()) await walk(full, out)
        else if (e.name.endsWith('.js')) out.push(full)
    }
    return out
}

async function findUsers(name) {
    const base = name.replace(/\.js$/, '').replace(/[$.]/g, '\\$&')
    const pattern = new RegExp(`['"\`][^'"\`]*(?:lib/|\\./)${base}(?:\\.js)?['"\`]`)
    const files = [
        ...(await Promise.all(['plugins', 'lib'].map(d => walk(path.join(ROOT, d))))).flat(),
        path.join(ROOT, 'handler.js'), path.join(ROOT, 'main.js'), path.join(ROOT, 'index.js')
    ]
    const users = []
    for (const file of files) {
        if (path.basename(file) === name && path.dirname(file) === LIB_DIR) continue
        const code = await fs.readFile(file, 'utf8').catch(() => null)
        if (code && pattern.test(code)) users.push(path.relative(ROOT, file))
    }
    return users
}

async function addLib(m, args, usedPrefix, command) {
    const files = await fs.readdir(LIB_DIR).then(l => l.filter(f => f.endsWith('.js')).sort()).catch(() => [])
    const usage = [
        '🌷 *Add Lib*', '',
        'Simpan atau timpa file di folder lib (otomatis menambah .js).', '',
        `♡ ${usedPrefix}${command} <nama>`, '(reply kode / document)',
        ...(files.length ? ['', `♡ Lib saat ini (${files.length}) :`, files.join(', ')] : [])
    ].join('\n')

    if (!args[0]) return m.reply(usage)
    const name = parseLibName(args[0])
    if (!name) return m.reply('Nama file tidak valid. Pakai huruf/angka/_/-/. saja, tanpa folder.')

    let source
    try { source = await readSource(m.quoted) } catch (err) { return m.reply(`Gagal membaca source: ${err.message}`) }
    if (!source?.trim()) return m.reply(usage)

    const syntaxError = await checkSyntax(source)
    if (syntaxError) {
        return m.reply(`❌ Syntax error, lib tidak disimpan:\n\n${syntaxError}\n\nPerbaiki lalu kirim lagi dengan ${usedPrefix}${command} ${name}`)
    }

    const target = path.join(LIB_DIR, name)
    const existed = existsSync(target)
    try {
        if (existed) {
            await fs.mkdir(BACKUP_DIR, { recursive: true })
            await fs.copyFile(target, path.join(BACKUP_DIR, name))
        }
        await fs.writeFile(target, source, 'utf8')
    } catch (err) {
        return m.reply(`Gagal menyimpan lib: ${err.message}`)
    }

    return m.reply([
        existed ? '♻️ Lib ditimpa' : '✅ Lib baru disimpan',
        `♡ File : lib/${name}`,
        `♡ Ukuran : ${(Buffer.byteLength(source) / 1024).toFixed(1)} KB`,
        existed ? `♡ Cadangan lama : store/lib-backup/${name}` : '',
        '',
        existed
            ? `Lib lama sudah ter-cache Node, ketik ${usedPrefix}restart supaya versi baru terbaca.`
            : `Langsung bisa dipakai plugin lewat import '../../lib/${name}'.`
    ].filter((l, i, arr) => l !== '' || arr[i - 1] !== '').join('\n'))
}

async function delLib(m, args, usedPrefix, command) {
    if (!args[0]) {
        return m.reply([
            '🌷 *Delete Lib*', '',
            'Hapus file dari folder lib (otomatis menambah .js).', '',
            `♡ ${usedPrefix}${command} <nama>`,
            `♡ ${usedPrefix}${command} <nama> force`
        ].join('\n'))
    }
    const name = parseLibName(args[0])
    if (!name) return m.reply('Nama file tidak valid.')
    if (PROTECTED.has(name)) return m.reply(`Lib \`${name}\` adalah lib inti bot dan dilindungi dari penghapusan.`)

    const target = path.join(LIB_DIR, name)
    if (!existsSync(target)) return m.reply(`File \`lib/${name}\` tidak ditemukan.`)

    const force = args.slice(1).some(a => a.toLowerCase() === 'force')
    const users = await findUsers(name)
    if (users.length && !force) {
        return m.reply([
            `⚠️ \`lib/${name}\` masih dipakai ${users.length} file:`,
            users.slice(0, 8).map(u => `> ${u}`).join('\n'),
            users.length > 8 ? `…dan ${users.length - 8} lainnya` : '',
            '',
            `Kalau tetap mau dihapus: ${usedPrefix}${command} ${name.replace(/\.js$/, '')} force`
        ].filter(Boolean).join('\n'))
    }

    try {
        await fs.mkdir(BACKUP_DIR, { recursive: true })
        await fs.copyFile(target, path.join(BACKUP_DIR, name))
        await fs.unlink(target)
    } catch (err) {
        return m.reply(`Gagal menghapus lib: ${err.message}`)
    }

    return m.reply([
        '🗑️ Lib dihapus',
        `♡ File : lib/${name}`,
        `♡ Cadangan : store/lib-backup/${name}`,
        users.length ? `♡ Masih diimport : ${users.length} file (jadi error sampai lib dipulihkan)` : '',
        '',
        `Ketik ${usedPrefix}restart supaya perubahan berlaku.`
    ].filter((l, i, arr) => l !== '' || arr[i - 1] !== '').join('\n'))
}

let handler = async (m, { args, usedPrefix, command }) => {
    const cmd = command.toLowerCase()
    if (/^(addlib|addlibs|newlib)$/.test(cmd)) return addLib(m, args, usedPrefix, command)
    if (/^(dellib|dellibs|removelib)$/.test(cmd)) return delLib(m, args, usedPrefix, command)
}

handler.help = ['addlib <nama> (reply kode)', 'dellib <nama> [force]']
handler.tags = ['owner']
handler.command = /^(addlib|addlibs|newlib|dellib|dellibs|removelib)$/i
handler.rowner = true

export default handler
