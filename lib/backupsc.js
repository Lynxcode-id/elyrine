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

import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export const EXCLUDE_ROOT = Object.freeze([
  '.tmp', '.npm', 'node_modules', 'database', 'sessions', 'tmp',
  '.bash_profile', '.bashrc', '.ghtoken', '.profile', '.ssh_port_ed25519', '.tokoptero-sshd.log',
  'CHANGELOG-REVISI.md', 'database.json', 'package-lock.json', 'store'
])
const EXCLUDE_SET = new Set(EXCLUDE_ROOT)

export const MAX_SEND_BYTES = 95 * 1024 * 1024
export const DEFAULT_INTERVAL_HOURS = 12
const TAR_TIMEOUT_MS = 10 * 60 * 1000
const GAP_BETWEEN_GROUPS_MS = 3000
const GROUP_JID_RE = /^\d{5,}(-\d+)?@g\.us$/

const sleep = ms => new Promise(r => setTimeout(r, ms))

export function getStore() {
  const data = global.db?.data
  if (!data) return { groups: [], intervalHours: DEFAULT_INTERVAL_HOURS, lastRun: 0 }
  const s = data.backupsc = data.backupsc || {}
  if (!Array.isArray(s.groups)) s.groups = []
  if (typeof s.intervalHours !== 'number' || s.intervalHours < 0) s.intervalHours = DEFAULT_INTERVAL_HOURS
  if (typeof s.lastRun !== 'number') s.lastRun = 0
  return s
}
export const saveDb = () => global.db?.write?.().catch(() => { })
export const listGroups = () => getStore().groups
export const findGroup = jid => listGroups().find(g => g.id === jid)
export const isGroupJid = v => GROUP_JID_RE.test(String(v || ''))
export const labelGroup = g => g?.name || g?.id || '-'

export function addGroup({ id, name }) {
  const s = getStore()
  const dup = s.groups.find(g => g.id === id)
  if (dup) { if (name) dup.name = name; return { entry: dup, created: false } }
  const entry = { id, name: name || '', addedAt: Date.now() }
  s.groups.push(entry)
  return { entry, created: true }
}

export function removeGroup(ref) {
  const s = getStore()
  let idx = -1
  const v = String(ref || '').trim()
  if (/^\d{1,4}$/.test(v)) idx = parseInt(v, 10) - 1
  else idx = s.groups.findIndex(g => g.id === v)
  if (idx < 0 || idx >= s.groups.length) return null
  return s.groups.splice(idx, 1)[0]
}

const pad = n => String(n).padStart(2, '0')
export function stampWita(d = new Date()) {
  const t = new Date(d.getTime() + 8 * 3600 * 1000)
  return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}-${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}`
}

export const formatSize = bytes => {
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return bytes + ' B'
}

export async function listBackupEntries(root = ROOT) {
  const all = await fs.readdir(root)
  return all.filter(n => !EXCLUDE_SET.has(n)).sort()
}

export async function createBackup({ root = ROOT, outDir = os.tmpdir(), botName = 'erine' } = {}) {
  const entries = await listBackupEntries(root)
  if (!entries.length) throw new Error('Tidak ada file untuk di-backup.')

  const name = `backup-sc-${botName}-${stampWita()}.tar.gz`
  const file = path.join(outDir, name)
  await fs.mkdir(outDir, { recursive: true })

  await new Promise((resolve, reject) => {
    const proc = spawn('tar', ['--use-compress-program=gzip -1', '-cf', file, '-C', root, '--', ...entries], { stdio: ['ignore', 'ignore', 'pipe'] })
    try { if (proc.pid) os.setPriority(proc.pid, 19) } catch { }
    let stderr = ''
    proc.stderr.on('data', d => { if (stderr.length < 4000) stderr += d })
    const timer = setTimeout(() => proc.kill('SIGKILL'), TAR_TIMEOUT_MS)
    proc.on('error', e => { clearTimeout(timer); reject(e.code === 'ENOENT' ? new Error('perintah tar tidak terpasang di server') : e) })
    proc.on('close', code => {
      clearTimeout(timer)
      code === 0 || code === 1 ? resolve() : reject(new Error(`tar gagal (kode ${code}): ${stderr.trim().split('\n').pop() || 'tanpa pesan'}`))
    })
  })

  const { size } = await fs.stat(file)
  if (!size) { await fs.unlink(file).catch(() => { }); throw new Error('Arsip kosong.') }
  return { file, name, size, entries }
}

export async function sendBackup(conn, groups, backup) {
  const ok = []
  const failed = []
  const caption = [
    '📦 *BACKUP SOURCE CODE*',
    `🗓️ ${stampWita().replace(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})$/, '$3/$2/$1 $4:$5')} WITA`,
    `🗂️ ${formatSize(backup.size)} · ${backup.entries.length} item di root`,
    '',
    'Tidak termasuk: node_modules, sessions, database, tmp, store, dll.'
  ].join('\n')

  for (const g of groups) {
    try {
      if (backup.size > MAX_SEND_BYTES) {
        await conn.sendMessage(g.id, { text: `⚠️ Backup SC dibatalkan: ukuran ${formatSize(backup.size)} melebihi batas kirim ${formatSize(MAX_SEND_BYTES)}.` })
        failed.push({ id: g.id, error: 'terlalu besar' })
        continue
      }
      await conn.sendMessage(g.id, {
        document: { url: backup.file },
        mimetype: 'application/gzip',
        fileName: backup.name,
        caption
      })
      ok.push(g.id)
    } catch (e) {
      failed.push({ id: g.id, error: e?.message || String(e) })
    }
    if (groups.length > 1) await sleep(GAP_BETWEEN_GROUPS_MS)
  }
  return { ok, failed }
}

let running = false
export const isBackupRunning = () => running

export async function runBackup(conn, { reason = 'manual', gapMs } = {}) {
  if (running) throw new Error('Backup sedang berjalan, tunggu selesai.')
  const s = getStore()
  if (!s.groups.length) throw new Error('Belum ada grup backup. Tambah dulu dengan addgcbackupsc.')
  if (!conn?.user) throw new Error('Bot belum terhubung ke WhatsApp.')

  running = true
  let backup
  try {
    backup = await createBackup({ botName: 'erine' })
    const res = await sendBackup(conn, s.groups, backup)
    s.lastRun = Date.now()
    s.lastResult = { reason, at: s.lastRun, size: backup.size, ok: res.ok.length, failed: res.failed.length }
    await saveDb()
    return { backup, ...res }
  } finally {
    running = false
    if (backup) fs.unlink(backup.file).catch(() => { })
  }
}

export function startBackupScheduler({ checkEveryMs = 10 * 60 * 1000, log = console.log } = {}) {
  const tick = async () => {
    try {
      const s = getStore()
      if (!s.groups.length || !s.intervalHours || running) return
      if (Date.now() - s.lastRun < s.intervalHours * 3600 * 1000) return
      if (!global.conn?.user) return
      const r = await runBackup(global.conn, { reason: 'auto' })
      log(`[BACKUPSC] auto backup ${formatSize(r.backup.size)} → ${r.ok.length} grup OK, ${r.failed.length} gagal`)
    } catch (e) {
      console.error('[BACKUPSC] auto backup gagal:', e.message)
    }
  }
  setTimeout(tick, 2 * 60 * 1000).unref?.()
  return setInterval(tick, checkEveryMs).unref?.()
}
