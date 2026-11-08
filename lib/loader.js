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

import chalk from 'chalk'
import PhoneNumber from 'awesome-phonenumber'
import { formatTime } from './respon.js'

const LINE = '────────────────────────────'
const pad = (s, n) => String(s).padEnd(n, ' ')
const cap = s => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1)

export function printBootHeader() {
  console.log([
    '',
    chalk.bold.magentaBright('ERINE-AI') + chalk.gray('  /  ') + chalk.bold.cyanBright('CORE ENGINE'),
    chalk.gray(LINE),
    '',
    chalk.white('Initializing engine...'),
    ''
  ].join('\n'))
}

/**
 * Blok "SYSTEM ONLINE", dipanggil sekali saat WhatsApp pertama kali tersambung.
 * Nilai diambil dari kondisi nyata (jumlah plugin, database, dst), bukan angka tetap.
 * @param {{ waConnected?: boolean, sessionReady?: boolean }} st
 */
export function printBootReady(st = {}) {
  if (global.__bootPrinted) return false
  global.__bootPrinted = true

  const plugins = Object.keys(global.plugins || {}).length
  const dbOk = !!global.db?.data
  const waOk = st.waConnected !== false
  const secs = process.uptime().toFixed(2)
  const ok = v => chalk.greenBright(v)
  const bad = v => chalk.redBright(v)
  const row = (branch, key, val) => `${chalk.gray(branch)} ${pad(key, 14)}: ${val}`

  console.log([
    chalk.cyanBright('[LOAD]') + ' Configuration loaded',
    chalk.cyanBright('[SYNC]') + ' ' + (st.sessionReady === false ? 'Session awaiting pairing' : 'Session synchronized'),
    row('├─', 'Runtime', ok('Ready')),
    row('├─', 'Configuration', ok('Ready')),
    row('├─', 'Database', dbOk ? ok('Connected') : bad('Offline')),
    row('├─', 'Plugins', ok(`${plugins} loaded`)),
    row('└─', 'WhatsApp', waOk ? ok('Connected') : bad('Offline')),
    '',
    '',
    chalk.gray(LINE),
    chalk.bold.greenBright('SYSTEM ONLINE'),
    `Engine started in ${chalk.yellowBright(secs + 's')}`,
    chalk.gray('© ERINE-AI | ELYRA LABS'),
    ''
  ].join('\n'))
  return true
}

const phone = jid => {
  const n = String(jid || '').replace(/@.+$/, '')
  if (!/^\d{5,}$/.test(n)) return n || '-'
  return PhoneNumber('+' + n).getNumber('international') || '+' + n
}

const chatKind = jid => {
  jid = String(jid || '')
  if (jid.endsWith('@g.us')) return 'Group'
  if (jid.endsWith('@newsletter')) return 'Channel'
  if (jid === 'status@broadcast') return 'Status'
  if (jid.endsWith('@broadcast')) return 'Broadcast'
  return 'Private'
}

function contentOf(m) {
  const text = typeof m.text === 'string' ? m.text.replace(/‎+/g, '').replace(/\s*\n\s*/g, ' ⏎ ').trim() : ''
  if (text) return text.length > 120 ? text.slice(0, 117) + '...' : text
  const t = String(m.mtype || '').replace(/message$/i, '').replace(/V\d+$/, '')
  if (!t) return m.messageStubType ? '[Stub]' : '-'
  if (/audio/i.test(t) && m.msg?.ptt) return '[PTT]'
  return `[${cap(t)}]`
}

export function printMessageLog(m, conn, names = {}) {
  const senderJid = (m.isGroup && m.fromMe) ? (conn?.user?.jid || m.sender) : m.sender
  const kind = chatKind(m.chat)
  const now = Date.now()

  const status = m.error ? 'Failed' : m.isCommand ? 'Completed' : m.plugin ? 'Rejected' : 'Ignored'
  const statusColor = { Failed: chalk.redBright, Completed: chalk.greenBright, Rejected: chalk.yellowBright, Ignored: chalk.gray }[status]
  const since = m.startedAt || m.t0
  const duration = since ? formatTime(now - since) : '-'
  const plugin = m.plugin ? String(m.plugin).replace(/\.js$/, '').split('/').pop() : '-'

  const k = s => chalk.gray(pad(s, 9))
  const rows = (list) => list.map(([key, val]) => `  ${k(key)} : ${val}`).join('\n')

  const message = [
    ['Sender', chalk.greenBright(phone(senderJid) + (m.pushName ? chalk.gray(` ~${m.pushName}`) : ''))],
    ['Receiver', chalk.cyanBright(global.namebot || conn?.user?.name || 'ERINE-AI')],
    ['Chat', chalk.white(kind)],
    ...(kind === 'Group' ? [['Group', chalk.white(names.chat || m.chat)]] : []),
    ['Type', chalk.yellowBright(cap(m.mtype || '-'))],
    ['Content', chalk.white(contentOf(m))]
  ]
  const process_ = [
    ['Handler', chalk.white(m.cmdName || '-')],
    ['Plugin', chalk.white(plugin)],
    ['Status', statusColor(status)],
    ['Duration', chalk.white(duration)]
  ]

  console.log([
    chalk.bold.magentaBright('[ MESSAGE ]'),
    '',
    rows(message),
    '',
    chalk.bold.magentaBright('[ PROCESS ]'),
    '',
    rows(process_),
    '',
    chalk.gray('©ERINE-AI LOADER'),
    ''
  ].join('\n'))
}
