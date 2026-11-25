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
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIR = path.join(__dirname, '..', 'store')
const FILE = path.join(DIR, 'menu-style.json')

export const MENU_STYLES = {
    1: { name: 'Menu 1', desc: 'Kartu interaktif + tombol pilih menu (bawaan)' },
    2: { name: 'Menu 2', desc: 'Rich HTML neobrutalism, bisa dipencet' },
    3: { name: 'Menu 3', desc: 'Live photo + tampilan ELYRINE, VN khusus' }
}
export const DEFAULT_STYLE = 1

export function getMenuStyle() {
    try {
        const j = JSON.parse(fs.readFileSync(FILE, 'utf8'))
        const n = Number(j?.style)
        return MENU_STYLES[n] ? n : DEFAULT_STYLE
    } catch {
        return DEFAULT_STYLE
    }
}

export function getMenuStyleInfo() {
    try {
        const j = JSON.parse(fs.readFileSync(FILE, 'utf8'))
        return { style: MENU_STYLES[Number(j?.style)] ? Number(j.style) : DEFAULT_STYLE, by: j?.by || null, at: j?.at || null }
    } catch {
        return { style: DEFAULT_STYLE, by: null, at: null }
    }
}

export function setMenuStyle(style, by = null) {
    const n = Number(style)
    if (!MENU_STYLES[n]) throw new Error('Style menu tidak valid')
    fs.mkdirSync(DIR, { recursive: true })
    const tmp = FILE + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify({ style: n, by, at: Date.now() }))
    fs.renameSync(tmp, FILE)
    return n
}
