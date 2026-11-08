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

import crypto from 'node:crypto'

const BASE = () => global.APIs && global.APIs.panel
const PLTA_KEY = () => global.APIKeys && global.APIKeys['plta']
const PLTC_KEY = () => global.APIKeys && global.APIKeys['pltc']

function panelHeaders(key) {
  return {
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
}

async function pltaFetch(path, opts = {}) {
  const base = BASE()
  const key = PLTA_KEY()
  if (!base) throw new Error("Panel belum diatur. Isi global.APIs.panel di config.js")
  if (!key) throw new Error("API key PLTA belum diatur. Isi global.APIKeys['plta'] di config.js")
  const res = await fetch(new URL(`/api/application${path}`, base), {
    ...opts,
    headers: { ...panelHeaders(key), ...(opts.headers || {}) },
    signal: AbortSignal.timeout(30000)
  })
  const text = await res.text()
  const json = text ? JSON.parse(text) : null
  if (!res.ok) {
    const msg = json && json.errors && json.errors[0] ? `${json.errors[0].code}: ${json.errors[0].detail}` : `HTTP ${res.status}`
    throw new Error(msg)
  }
  return json
}

async function pltcFetch(path, opts = {}) {
  const base = BASE()
  const key = PLTC_KEY()
  if (!base || !key) return null
  const res = await fetch(new URL(`/api/client${path}`, base), {
    ...opts,
    headers: { ...panelHeaders(key), ...(opts.headers || {}) },
    signal: AbortSignal.timeout(30000)
  })
  if (!res.ok) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

const randStr = n => crypto.randomBytes(n).toString('hex')

async function findOrCreateUser(number) {
  const list = await pltaFetch(`/users?filter[external_id]=${number}`)
  const existing = list && list.data && list.data[0]
  if (existing) return existing.attributes

  const email = `${number}.${randStr(3)}@panel.local`
  const password = randStr(6)
  const created = await pltaFetch('/users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      username: `u${number}`,
      first_name: 'User',
      last_name: number,
      password,
      external_id: String(number)
    })
  })
  return { ...created.attributes, _password: password }
}

async function createServer({ userId, name, ram, disk, cpu }) {
  const cfg = global.panelCfg || {}
  const body = {
    name,
    user: userId,
    nest: cfg.nest,
    egg: cfg.egg,
    docker_image: cfg.docker_image,
    startup: cfg.startup,
    environment: cfg.environment || {},
    limits: {
      memory: ram * 1024,
      swap: 0,
      disk: disk * 1024,
      io: 500,
      cpu: cpu
    },
    feature_limits: {
      databases: cfg.databases ?? 0,
      backups: cfg.backups ?? 0,
      allocations: cfg.allocations ?? 1
    },
    deploy: {
      locations: [cfg.location],
      dedicated_ip: false,
      port_range: []
    }
  }
  const res = await pltaFetch('/servers', { method: 'POST', body: JSON.stringify(body) })
  return res.attributes
}

async function deleteServer(serverId) {
  await pltaFetch(`/servers/${serverId}`, { method: 'DELETE' })
}

function getPanels() {
  const d = global.db.data
  if (!d.panels) d.panels = {}
  return d.panels
}

function parseArgs(args) {
  const [number, ram, disk, cpu, days] = args
  const n = v => Number(String(v).replace(/[^0-9.]/g, ''))
  return {
    number: String(number || '').replace(/[^0-9]/g, ''),
    ram: Math.min(10, Math.max(1, Math.round(n(ram)) || 1)),
    disk: Math.min(10, Math.max(1, Math.round(n(disk)) || 1)),
    cpu: Math.min(400, Math.max(25, Math.round(n(cpu)) || 100)),
    days: Math.min(365, Math.max(1, Math.round(n(days)) || 30))
  }
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const opt = parseArgs(args)
  if (!opt.number || args.length < 5) {
    throw `Format: *${usedPrefix + command} <nomor> <ramGB 1-10> <diskGB 1-10> <cpu% 25-400> <hari>*\nContoh: *${usedPrefix + command} 6281234567890 2 5 100 30*`
  }

  await m.wait()

  let user, server
  try {
    user = await findOrCreateUser(opt.number)
    server = await createServer({
      userId: user.id,
      name: `panel-${opt.number}-${Date.now().toString(36)}`,
      ram: opt.ram,
      disk: opt.disk,
      cpu: opt.cpu
    })
  } catch (e) {
    console.error('[CREATEPANEL]', e)
    throw `Gagal membuat panel.\n${(e && e.message) || e}`
  }

  const expireAt = Date.now() + opt.days * 86400000
  const panels = getPanels()
  panels[server.id] = {
    serverId: server.id,
    uuid: server.uuid,
    identifier: server.identifier,
    userId: user.id,
    number: opt.number,
    chat: m.chat,
    ram: opt.ram,
    disk: opt.disk,
    cpu: opt.cpu,
    createdAt: Date.now(),
    expireAt
  }
  await global.db.write().catch(() => {})

  const panelUrl = `${BASE()}/server/${server.identifier}`
  const body = [
    '*PANEL BERHASIL DIBUAT*',
    '',
    `Panel : ${panelUrl}`,
    `Username : ${user.username}`,
    user._password ? `Password : ${user._password}` : `Password : (akun lama, pakai password sebelumnya)`,
    '',
    `RAM : ${opt.ram} GB`,
    `Disk : ${opt.disk} GB`,
    `CPU : ${opt.cpu}%`,
    `Masa aktif : ${opt.days} hari`,
    `Expired : ${new Date(expireAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`,
    '',
    'Panel otomatis dihapus saat masa aktif habis.'
  ].join('\n')

  await conn.sendMessage(m.chat, { text: body }, { quoted: m })
}

handler.help = ['createpanel <nomor> <ramGB> <diskGB> <cpu%> <hari>']
handler.tags = ['pterodatyle']
handler.command = /^(createpanel|buatpanel)$/i
handler.owner = true
handler.register = true

export default handler

const CHECK_INTERVAL = 5 * 60 * 1000

if (!global.__panelAutoDeleteStarted) {
  global.__panelAutoDeleteStarted = true
  setInterval(async () => {
    try {
      if (!global.db || !global.db.data) return
      const panels = getPanels()
      const now = Date.now()
      for (const id of Object.keys(panels)) {
        const p = panels[id]
        if (!p || p.expireAt > now) continue
        try {
          await deleteServer(p.serverId)
        } catch (e) {
          console.error('[CREATEPANEL] gagal hapus server', id, (e && e.message) || e)
        }
        delete panels[id]
        try {
          if (global.conn && p.chat) {
            await global.conn.sendMessage(p.chat, { text: `*PANEL EXPIRED*\n\nPanel milik ${p.number} sudah dihapus otomatis (masa aktif habis).` })
          }
        } catch (_) {}
      }
      await global.db.write().catch(() => {})
    } catch (e) {
      console.error('[CREATEPANEL] scheduler error:', (e && e.message) || e)
    }
  }, CHECK_INTERVAL)
}
