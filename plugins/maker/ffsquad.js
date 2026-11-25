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

import { fetchMedia } from '../../lib/automedia.js'

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const parts = (text || '').split('|').map(v => v.trim()).filter(Boolean)
  let template = '1'
  if (parts.length > 1 && /^[1-9]$/.test(parts[parts.length - 1])) template = parts.pop()
  const names = parts.slice(0, 4).map(v => v.slice(0, 30))

  if (!names.length) throw `Contoh: *${usedPrefix + command} Lynx|Firman|Dinda|Farhan|1*\nNama 1-4 pemain, template 1 - 8.\nUntuk 5 pemain pakai *${usedPrefix}fffive*`
  if (!/^[1-8]$/.test(template)) throw 'Template hanya 1 sampai 8. Untuk 5 pemain pakai fffive.'

  await m.wait()

  const params = { template, json: 0 }
  names.forEach((n, i) => { params[`name${i + 1}`] = n })

  let media
  try {
    media = await fetchMedia(`${global.APIs?.apicloud || 'https://api-cloud.my.id'}/maker/fakeffsquad`, params)
  } catch (e) {
    console.error('[ffsquad]', e.message)
    throw `Gagal membuat gambar (${e.message})`
  }

  await conn.sendFile(m.chat, media.buffer, `ffsquad.${media.ext}`, `Template ${template}`, m)
}

handler.help = ['ffsquad <nama1>|<nama2>|<nama3>|<nama4>|<template 1-8>']
handler.tags = ['maker']
handler.command = /^(ffsquad)$/i
handler.register = true

export default handler
