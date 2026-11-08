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

import fs from 'node:fs/promises'
import path from 'node:path'

const IGNORED_NAMES = new Set([
    'node_modules',
    'node_module',
    '.cache',
    '.chace',
    '.npm',
    'assets',
    '.tmp',
    'tmp',
    'package-lock.json',
    'package_lock.json',
    '.git'
])

const formatSize = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 Bytes'

    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1
    )

    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}

async function scanSource(rootDir) {
    let totalAll = 0
    let totalClean = 0
    let filesAll = 0
    let filesClean = 0

    async function scanDir(dir, isInsideIgnored = false) {
        let entries

        try {
            entries = await fs.readdir(dir, {
                withFileTypes: true
            })
        } catch {
            return
        }

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)
            const lowerName = entry.name.toLowerCase()

            const shouldIgnore =
                isInsideIgnored || IGNORED_NAMES.has(lowerName)

            try {
                if (entry.isDirectory()) {
                    await scanDir(fullPath, shouldIgnore)
                    continue
                }

                if (!entry.isFile()) continue

                const stats = await fs.stat(fullPath)

                totalAll += stats.size
                filesAll++

                if (!shouldIgnore) {
                    totalClean += stats.size
                    filesClean++
                }
            } catch {
            }
        }
    }

    await scanDir(rootDir)

    return {
        totalAll,
        totalClean,
        filesAll,
        filesClean
    }
}

const handler = async (m, { conn }) => {
    await m.react('🌱').catch(() => {})

    try {
        const rootDir = process.cwd()

        const {
            totalAll,
            totalClean,
            filesAll,
            filesClean
        } = await scanSource(rootDir)

        const result = [
            '⌕ *SOURCE CODE ANALYSIS*',
            '',
            '┌ FULL SOURCE',
            `│ Size : *${formatSize(totalAll)}*`,
            `│ Files : *${filesAll.toLocaleString('id-ID')}*`,
            '└ Includes all files and dependencies.',
            '',
            '┌ CLEAN SOURCE',
            `│ Size : *${formatSize(totalClean)}*`,
            `│ Files : *${filesClean.toLocaleString('id-ID')}*`,
            '└ Excludes unnecessary dependencies and cache.',
            '',
            '⌁ *SCAN INFORMATION*',
            `◦ Directory : ${rootDir}`,
            '◦ Mode : Recursive Scan',
            '◦ Status : Completed'
        ].join('\n')

        await m.sukses(result)

        await m.react('💐').catch(() => {})
    } catch (err) {
        console.error('[SIZESC]', err?.stack || err)

        await m.react('❌').catch(() => {})

        throw new Error(
            `Gagal menghitung ukuran source code: ${err.message}`
        )
    }
}

handler.help = ['sizesc']
handler.tags = ['info']
handler.command = /^sizesc$/i
handler.wait = true

export default handler
