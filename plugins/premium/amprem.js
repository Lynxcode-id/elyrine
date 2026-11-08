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

import { mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { pathToFileURL } from 'url'

const handler = async (m, { text, usedPrefix, command, __dirname }) => {
  const dir = join(__dirname, '..', 'scrape')
  mkdirSync(dir, { recursive: true })
  const file = join(dir, 'noxxyrorr.js')
  if (!existsSync(file)) throw `Scrape *noxxyrorr* belum ada. Tambahkan dulu pakai ${usedPrefix}addscrape noxxyrorr`

  const p = usedPrefix + command
  const [sub = '', ...rest] = (text || '').trim().split(/\s+/)
  const arg = rest.join(' ').trim()
  const help = `Perintah:\n${p} send <email>\n${p} verify <email>|<magicLink>|<cookie>`

  if (!/^(send|verify)$/i.test(sub)) throw help

  const mod = await import(pathToFileURL(file).href + '?t=' + Date.now())

  if (/^send$/i.test(sub)) {
    if (!/^\S+@\S+\.\S+$/.test(arg)) throw `Contoh: ${p} send email@gmail.com`
    await m.wait()
    const r = await mod.sendLink(arg)
    return m.reply(`✅ Link verifikasi dikirim ke *${arg}*\n\n${JSON.stringify(r, null, 2).slice(0, 1500)}`)
  }

  const [email, magicLink, cookie] = arg.split('|').map(v => (v || '').trim())
  if (!email || !magicLink || !cookie) throw `Contoh: ${p} verify email@gmail.com|https://link...|am_sess_...`
  await m.wait()
  const r = await mod.verifyLink(email, magicLink, cookie)
  m.reply(`✅ Verifikasi selesai\n\n${JSON.stringify(r, null, 2).slice(0, 1500)}`)
}

handler.help = ['amprem']
handler.tags = ['premium']
handler.command = /^(amprem)$/i
handler.premium = true
handler.limit = true
handler.register = true

export default handler
