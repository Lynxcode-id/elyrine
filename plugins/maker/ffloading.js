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
  const [nameRaw = '', tplRaw = '1'] = (text || '').split('|').map(v => v.trim())
  const name = nameRaw.slice(0, 30)
  const template = tplRaw || '1'

  if (!name) throw `Contoh: *${usedPrefix + command} lynxdecode|1*\nTemplate tersedia: 1 - 3`
  if (!/^[1-3]$/.test(template)) throw 'Template hanya 1 sampai 3.'

  await m.wait()

  let media
  try {
    media = await fetchMedia(`${global.APIs?.apicloud || 'https://api-cloud.my.id'}/maker/ninjareturn`, { name, template, format: 'png', json: 0 })
  } catch (e) {
    console.error('[ffloading]', e.message)
    throw `Gagal membuat gambar (${e.message})`
  }

  await conn.sendFile(m.chat, media.buffer, `ffloading.${media.ext}`, `Template ${template} · ${name}`, m)
}

handler.help = ['ffloading <nama>|<template 1-3>']
handler.tags = ['maker']
handler.command = /^(ffloading)$/i
handler.register = true

export default handler
