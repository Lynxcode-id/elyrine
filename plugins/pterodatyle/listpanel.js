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

import { readFileSync } from 'node:fs'

const BASE = () => global.APIs && global.APIs.panel
const PLTC_KEY = () => global.APIKeys && global.APIKeys['pltc']

function getPanels() {
  const d = global.db.data
  if (!d.panels) d.panels = {}
  return d.panels
}

const fmtSisa = ms => {
  if (ms <= 0) return 'Kadaluarsa'
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  return `${d} hari ${h} jam`
}

const handler = async (m, { conn, args }) => {
  const panels = getPanels()
  const mine = Object.values(panels).filter(p => p.number === m.sender.split('@')[0] || args[0] === p.number)

  if (!mine.length) throw 'Tidak ada panel aktif untuk nomor ini.'

  const lines = ['*DAFTAR PANEL AKTIF*', '']
  for (const p of mine) {
    lines.push(
      `Server ID : ${p.serverId}`,
      `RAM/Disk/CPU : ${p.ram}GB / ${p.disk}GB / ${p.cpu}%`,
      `Sisa waktu : ${fmtSisa(p.expireAt - Date.now())}`,
      `Expired : ${new Date(p.expireAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`,
      ''
    )
  }
  await conn.sendMessage(m.chat, { text: lines.join('\n').trim() }, { quoted: m })
}

handler.help = ['cekpanel']
handler.tags = ['pterodatyle']
handler.command = /^(cekpanel|mypanel)$/i
handler.register = true

export default handler
