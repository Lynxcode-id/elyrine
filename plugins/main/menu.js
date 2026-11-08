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

import { promises } from 'fs'
import { join } from 'path'
import { generateWAMessageContent, generateWAMessageFromContent, proto } from 'elyra-baileys'
import { sendMenuAudio } from '../../lib/menuaudio.js'
import moment from 'moment-timezone'
import { limitSummary } from '../../lib/limit.js'
import { getCustomThumb } from '../../lib/customthumb.js'

const GROUP_LINK = 'https://chat.whatsapp.com/Fk2geM46pu87FFE533a7uS?s=cl&p=a&iam=2'
const DEFAULT_THUMB = 'https://raw.githubusercontent.com/its-dinda/image/main/1793839373037.jpeg'
const BOT_TITLE = 'ERINE-AI • ELYRINE'

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

const FOOTER = 'ERINE-AI • ELYRINE'
const MAX_CHUNK = 3000

let handler = async (m, { conn, usedPrefix: _p, __dirname, args, isOwner }) => {
  try {
    const user = global.db.data.users[m.sender] || {}
    const name = m.pushName || await conn.getName(m.sender)
    const tag = `@${m.sender.split('@')[0]}`

    const _package = JSON.parse(await promises.readFile(join(__dirname, '../package.json'), 'utf8').catch(() => '{}'))
    const plugins = Object.values(global.plugins).filter(p => p && !p.disabled)
    const runtime = clockString(process.uptime() * 1000)
    const ls = limitSummary(user, m.sender, isOwner)
    const membership = ls.role.replace(/ user$/i, '')
    const limit = ls.full
    const lprem = global.lopr || 'Ⓟ'
    const llim = global.lolm || 'Ⓛ'

    const map = new Map()
    for (const plugin of plugins) {
      if (!plugin.help) continue
      const names = [...new Set([].concat(plugin.help).map(h => String(h).trim().split(/\s+/)[0]).filter(Boolean))]
      if (!names.length) continue
      const line = names.join(', ') + (plugin.premium ? ' ' + lprem : '') + (plugin.limit ? ' ' + llim : '')
      const tags = [].concat(plugin.tags || []).map(t => String(t).trim()).filter(Boolean)
      for (const t of (tags.length ? tags : ['other'])) {
        const key = norm(t) || t.toLowerCase()
        let c = map.get(key)
        if (!c) {
          c = { name: t, alias: key, tags: [key], cmds: [] }
          map.set(key, c)
        }
        c.cmds.push(line)
      }
    }
    const all = [...map.values()].sort((x, y) => x.name.toLowerCase().localeCompare(y.name.toLowerCase()))
    for (const c of all) c.cmds = [...new Set(c.cmds)].sort()

    let tm = null
    try {
      const mod = await import('../../lib/thumbnail.js')
      tm = mod.getRandomThumb ? mod.getRandomThumb('thumbnail') : null
    } catch (_) { tm = null }
    const thumbSrc = typeof tm === 'string' && tm ? tm : (tm && tm.url) ? tm.url : null
    const customThumb = getCustomThumb()
    const thumbBuf = customThumb ? customThumb.buffer : (Buffer.isBuffer(tm) ? tm : null)

    const head = `୨ৎ ${BOT_TITLE}\n    自動化アシスタント\n\n`
    const fkon = {
      key: {
        fromMe: false,
        participant: `${m.sender.split`@`[0]}@s.whatsapp.net`,
        ...(m.chat ? { remoteJid: '16500000000@s.whatsapp.net' } : {})
      },
      message: {
        contactMessage: {
          displayName: `${name}`,
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;a,;;;\nFN:${name}\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
          verified: true
        }
      }
    }

    const buttons = [
      {
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
          title: 'PILIHAN MENU',
          sections: [{
            title: '📄 Silahkan pilih menu',
            highlight_label: 'ERINE-AI',
            rows: all.map(c => ({
              header: 'ERINE-AI Directory',
              title: c.name,
              description: `${c.cmds.length} fitur`,
              id: `${_p}menu ${c.alias}`
            }))
          }],
          has_multiple_buttons: true
        })
      },
      { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '💬 Community Group', url: GROUP_LINK }) },
      { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📑 Lihat Semua Menu', id: `${_p}menu all` }) },
      { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '👤 Hubungi Developer', id: `${_p}owner` }) },
    ]
    if (global.sgc && global.sgc !== GROUP_LINK) {
      buttons.splice(2, 0, { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🌟 Channel Info', url: global.sgc }) })
    }

    const sendCard = async (text) => {
      try {
        const imgSrc = thumbBuf ? { image: thumbBuf } : { image: { url: thumbSrc || DEFAULT_THUMB } }
        const { imageMessage } = await generateWAMessageContent(imgSrc, { upload: conn.waUploadToServer })
        const msg = generateWAMessageFromContent(m.chat, {
          viewOnceMessage: {
            message: {
              messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
              interactiveMessage: proto.Message.InteractiveMessage.create({
                header: proto.Message.InteractiveMessage.Header.create({ imageMessage, hasMediaAttachment: true }),
                body: proto.Message.InteractiveMessage.Body.create({ text }),
                footer: proto.Message.InteractiveMessage.Footer.create({ text: FOOTER }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                  buttons,
                  messageParamsJson: JSON.stringify({
                    bottom_sheet: {
                      in_thread_buttons_limit: 0,
                      divider_indices: [1, 2, 3, 4, 5, 999],
                      list_title: 'Pilih Menu',
                      button_title: '🌟 Pilih Menu Disini'
                    }
                  })
                }),
                contextInfo: { mentionedJid: [m.sender] }
              })
            }
          }
        }, { quoted: fkon })
        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
        return true
      } catch (err) {
        console.error('[MENU] interactive gagal, pakai teks biasa:', err && err.message ? err.message : err)
        await conn.sendMessage(m.chat, { text: text + '\n\n' + FOOTER, mentions: [m.sender] }, { quoted: fkon })
        return false
      }
    }
    const sendPlain = text => conn.sendMessage(m.chat, { text, mentions: [m.sender] }, { quoted: fkon })

    const buildChunks = (list) => {
      const chunks = []
      let cur = head
      for (const c of list) {
        const title = `── ${c.name}`
        if (cur.length + title.length + 80 > MAX_CHUNK && cur !== head) { chunks.push(cur.trimEnd()); cur = '' }
        cur += `${title}\n`
        for (const line of c.cmds) {
          const row = `  𖹭 ${line}\n`
          if (cur.length + row.length > MAX_CHUNK) { chunks.push(cur.trimEnd()); cur = `── ${c.name} (lanjut)\n` }
          cur += row
        }
        cur += '\n'
      }
      cur += `  Prefix : ${_p}  •  ${lprem} Premium  ${llim} Limit\n  Contoh : ${_p}menu downloader`
      chunks.push(cur.trimEnd())
      return chunks
    }

    const raw = args.join(' ').trim()
    const q = norm(raw)

    if (q === 'all') {
      const chunks = buildChunks(all)
      await sendCard(chunks[0])
      for (const c of chunks.slice(1)) await sendPlain(c)
      return
    }

    if (q) {
      const found = all.find(c => norm(c.name) === q || c.alias === q || c.tags.includes(q)) ||
        all.find(c => q.length > 1 && norm(c.name).startsWith(q))
      if (found) {
        const chunks = buildChunks([found])
        await sendCard(chunks[0])
        for (const c of chunks.slice(1)) await sendPlain(c)
        return
      }
      let best = null
      let bestD = 3
      for (const c of all) {
        for (const k of [norm(c.name), c.alias, ...c.tags]) {
          const d = lev(q, k)
          if (d < bestD) { bestD = d; best = c }
        }
      }
      const text = head +
        `  Kategori "${raw}" tidak ditemukan.\n` +
        (best ? `  Mungkin maksud kamu: ${best.name} → ${_p}menu ${best.alias}\n` : '') +
        `\n  ── Kategori Tersedia\n\n` +
        all.map(c => `  𖹭 ${c.name}`).join('\n') +
        `\n\n  Lihat semua dengan ${_p}menu all`
      await sendCard(text)
      return
    }

    const text = head +
      `  Welcome, ${tag} 🌱\n\n` +
      `  User Information\n` +
      `  Name : ${name}\n` +
      `  Membership : ${membership}\n` +
      `  Limit : ${limit}\n\n` +
      `  System Information\n` +
      `  Version    ${_package.version || '-'}\n` +
      `  Plugins    ${plugins.length}\n` +
      `  Runtime    ${runtime}\n\n` +
      `  ── Command Collection\n\n` +
      all.map(c => `  𖹭 ${c.name}`).join('\n') +
      `\n\n  Find more with ${_p}menu <category>`
    await sendCard(text)
    await sendMenuAudio(conn, m.chat, m)
  } catch (e) {
    conn.reply(m.chat, 'Maaf, menu sedang error', m)
    throw e
  }
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = /^(menu|help|\?)$/i
handler.register = true
handler.exp = 3

export default handler

function clockString(ms) {
  const p = v => String(v).padStart(2, '0')
  if (isNaN(ms)) return '--h --m --s'
  return `${p(Math.floor(ms / 3600000))}h ${p(Math.floor(ms / 60000) % 60)}m ${p(Math.floor(ms / 1000) % 60)}s`
}

function ucapan() {
  const time = moment.tz('Asia/Jakarta').format('HH')
  let res = 'Kok Belum Tidur Kak? 🥱'
  if (time >= 4) res = 'Pagi Kak 🌄'
  if (time >= 10) res = 'Siang Kak ☀️'
  if (time >= 15) res = 'Sore Kak 🌇'
  if (time >= 18) res = 'Malam Kak 🌙'
  return res
}

function lev(a, b) {
  const d = []
  for (let i = 0; i <= a.length; i++) d[i] = [i]
  for (let j = 0; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}
