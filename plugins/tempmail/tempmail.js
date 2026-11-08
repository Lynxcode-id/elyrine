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

const last = new Map()
const clean = s => String(s || '')
  .replace(/<(style|script)[\s\S]*?<\/\1>/gi, '')
  .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/tr>|<\/h\d>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\n\s*\n\s*\n+/g, '\n\n').trim()

const handler = async (m, { text, usedPrefix, command, __dirname }) => {
  const dir = join(__dirname, '..', 'scrape')
  mkdirSync(dir, { recursive: true })
  const file = join(dir, 'emailnator.js')
  if (!existsSync(file)) throw `Scrape *emailnator* belum ada. Tambahkan dulu pakai ${usedPrefix}addscrape emailnator`

  const mail = await import(pathToFileURL(file).href + '?t=' + Date.now())
  const [sub = '', ...rest] = (text || '').trim().split(/\s+/)
  const arg = rest.join(' ').trim()
  const p = usedPrefix + command

  await m.wait()

  if (!sub || /^(new|buat|create)$/i.test(sub)) {
    const r = await mail.createInbox()
    last.set(m.sender, r.email)
    return m.reply(`📧 *${r.email}*\n\nCek inbox: ${p} inbox\nPerpanjang: ${p} extend`)
  }

  if (/^inbox$/i.test(sub)) {
    const email = arg || last.get(m.sender)
    if (!email) throw `Belum ada email. Buat dulu: ${p}`
    const box = await mail.getInbox(email)
    if (!box.messages.length) return m.reply(`📭 Inbox *${email}* masih kosong.`)
    const list = box.messages.map((v, i) => `${i + 1}. *${v.subject || '(tanpa subjek)'}*\n   dari: ${v.from || '-'}\n   id: ${v.id}`).join('\n\n')
    return m.reply(`📬 *${email}* (${box.count}/${box.limit})\n\n${list}\n\nBaca: ${p} read <id>`)
  }

  if (/^(read|baca)$/i.test(sub)) {
    if (!arg) throw `Contoh: ${p} read <id>`
    const msg = await mail.getMessage(arg)
    const body = clean(msg.body).slice(0, 3000) || '(isi kosong)'
    return m.reply(`*${msg.subject || '(tanpa subjek)'}*\ndari: ${msg.from || '-'}\n\n${body}`)
  }

  if (/^(del|hapus)$/i.test(sub)) {
    if (!arg) throw `Contoh: ${p} del <id>`
    const r = await mail.deleteMessage(arg)
    return m.reply(r.ok ? '✅ Pesan dihapus.' : `Gagal menghapus: ${r.message || '-'}`)
  }

  if (/^extend$/i.test(sub)) {
    const email = arg || last.get(m.sender)
    if (!email) throw `Belum ada email. Buat dulu: ${p}`
    const r = await mail.extendEmail(email)
    return m.reply(r.ok ? `✅ *${email}* diperpanjang.` : `Gagal memperpanjang: ${r.message || '-'}`)
  }

  throw `Perintah:\n${p}\n${p} inbox [email]\n${p} read <id>\n${p} del <id>\n${p} extend [email]`
}

handler.help = ['tempmail']
handler.tags = ['tempail']
handler.command = /^(tempmail)$/i
handler.limit = true
handler.register = true

export default handler
