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

import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { performance } from 'node:perf_hooks'
import { AIRich } from 'elyra-baileys'

const LOGO = 'https://raw.githubusercontent.com/its-dinda/image/main/1793945302377.jpeg'
const FOOTER = '© 𝙴𝚁𝙸𝙽𝙴-𝙰𝙸 ~ 𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝚃𝙸𝙾𝙽'
let logoCache
async function getLogo() {
  if (logoCache !== undefined) return logoCache
  try {
    const { default: sharp } = await import('sharp')
    const buf = await sharp(path.join(process.cwd(), 'src', 'erine.webp')).resize(160, 160, { fit: 'cover' }).jpeg({ quality: 82 }).toBuffer()
    logoCache = `data:image/jpeg;base64,${buf.toString('base64')}`
  } catch { logoCache = null }
  return logoCache
}
const sleep = ms => new Promise(r => setTimeout(r, ms))

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const clamp = n => Math.max(0, Math.min(100, Number(n) || 0))
const pct = (a, b) => (b > 0 ? Number(clamp((a / b) * 100).toFixed(1)) : 0)

function size(bytes) {
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = Math.max(0, Number(bytes) || 0), i = 0
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(i === 0 ? 0 : 2)} ${u[i]}`
}

function dur(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0))
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60)
  return `${d ? d + 'd ' : ''}${h ? h + 'h ' : ''}${m ? m + 'm ' : ''}${s % 60}s`
}

function maskIP(ip) {
  if (ip.includes('.')) { const p = ip.split('.'); return `${p[0]}.${p[1]}.xxx.xxx` }
  return `${ip.split(':').slice(0, 2).join(':')}:xxxx:xxxx`
}

const level = p => (p >= 85 ? '#dc2626,#f97316' : p >= 60 ? '#f59e0b,#fde047' : '#1d4ed8,#38bdf8')
const pingColor = ms => (ms < 300 ? '#facc15' : ms < 800 ? '#fb923c' : '#f87171')

const snap = () => os.cpus().map(c => ({ idle: c.times.idle, total: Object.values(c.times).reduce((a, b) => a + b, 0) }))

async function cpuUsage(ms = 400) {
  const a = snap(); await sleep(ms); const b = snap()
  const cores = b.map((x, i) => {
    const dt = x.total - (a[i]?.total || 0), di = x.idle - (a[i]?.idle || 0)
    return dt > 0 ? Number(clamp(100 * (1 - di / dt)).toFixed(1)) : 0
  })
  return { cores, avg: Number((cores.reduce((s, v) => s + v, 0) / (cores.length || 1)).toFixed(1)) }
}

function readNum(file) {
  try { const v = fs.readFileSync(file, 'utf8').trim(); return v === 'max' ? null : Number(v) } catch { return null }
}

function containerMem() {
  let limit = readNum('/sys/fs/cgroup/memory.max'), used = readNum('/sys/fs/cgroup/memory.current')
  if (limit == null || used == null) {
    limit = readNum('/sys/fs/cgroup/memory/memory.limit_in_bytes')
    used = readNum('/sys/fs/cgroup/memory/memory.usage_in_bytes')
  }
  if (!limit || used == null || limit > os.totalmem() * 4) return null
  return { limit, used }
}

function getDisk() {
  try {
    const line = execFileSync('df', ['-kP', process.cwd()], { timeout: 3000, encoding: 'utf8' }).trim().split('\n')[1]?.split(/\s+/) || []
    const total = Number(line[1]) * 1024, used = Number(line[2]) * 1024
    return total > 0 ? { total, used } : null
  } catch { return null }
}

function getSwap() {
  try {
    const t = fs.readFileSync('/proc/meminfo', 'utf8')
    const total = Number((t.match(/^SwapTotal:\s+(\d+)/m) || [0, 0])[1]) * 1024
    const free = Number((t.match(/^SwapFree:\s+(\d+)/m) || [0, 0])[1]) * 1024
    return total ? { total, used: total - free } : null
  } catch { return null }
}

function cpuMhz() {
  const c = os.cpus()
  if (c[0]?.speed) return c[0].speed
  try {
    const v = fs.readFileSync('/proc/cpuinfo', 'utf8').split('\n').filter(l => l.startsWith('cpu MHz')).map(l => parseFloat(l.split(':')[1]))
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0
  } catch { return 0 }
}

function nets() {
  const v4 = [], v6 = []
  for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) {
    if (a.internal) continue
    ;(a.family === 'IPv4' ? v4 : v6).push(maskIP(a.address))
  }
  return { v4: v4[0] || 'N/A', v6: v6[0] || 'N/A' }
}

function pkgVersion() {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')).version || '-' } catch { return '-' }
}

async function collect(m, pingMs) {
  const cpu = await cpuUsage()
  const cpus = os.cpus()
  const total = os.totalmem(), free = os.freemem(), usedMem = total - free
  const cont = containerMem()
  const disk = getDisk(), swap = getSwap(), pm = process.memoryUsage(), net = nets()
  const ts = Number(m.messageTimestamp) * 1000
  const delay = ts && Date.now() - ts >= 0 && Date.now() - ts < 60000 ? Date.now() - ts : null
  const [l1, l5, l15] = os.loadavg()

  return {
    bot: global.namebot || 'ERINE-AI',
    ver: pkgVersion(),
    ping: Math.round(pingMs),
    delay,
    cpu: cpu.avg,
    cores: cpu.cores,
    ram: cont ? pct(cont.used, cont.limit) : pct(usedMem, total),
    ramText: cont ? `${size(cont.used)} / ${size(cont.limit)}` : `${size(usedMem)} / ${size(total)}`,
    ramLabel: cont ? 'RAM (CONTAINER)' : 'RAM',
    hostRam: `${size(usedMem)} / ${size(total)}`,
    disk: disk ? pct(disk.used, disk.total) : 0,
    diskText: disk ? `${size(disk.used)} / ${size(disk.total)}` : 'Unavailable',
    swap: swap ? pct(swap.used, swap.total) : 0,
    swapText: swap ? `${size(swap.used)} / ${size(swap.total)}` : 'Tidak aktif',
    cpuModel: (cpus[0]?.model || 'Unknown').replace(/\(R\)|\(TM\)/g, '').replace(/\s+/g, ' ').trim(),
    mhz: cpuMhz().toFixed(0),
    load: `${l1.toFixed(2)} · ${l5.toFixed(2)} · ${l15.toFixed(2)}`,
    os: `${os.type()} ${os.release()}`,
    platform: `${os.platform()} ${os.arch()}`,
    host: os.hostname(),
    node: process.version,
    v8: process.versions.v8,
    pid: process.pid,
    rss: size(pm.rss), heap: `${size(pm.heapUsed)} / ${size(pm.heapTotal)}`, ext: size(pm.external),
    v4: net.v4, v6: net.v6,
    plugins: Object.keys(global.plugins || {}).length,
    users: Object.keys(global.db?.data?.users || {}).length,
    botUp: Math.floor(process.uptime()),
    sysUp: Math.floor(os.uptime()),
    at: Date.now()
  }
}

const gauge = (label, p, text) =>
  `<div class="k"><div class="l"><b>${esc(label)}</b><span>${esc(text)} · ${p.toFixed(1)}%</span></div><div class="bar"><i data-w="${p}" style="background:linear-gradient(90deg,${level(p)})"></i></div></div>`
const cell = (k, v, wide) => `<div class="k c"${wide ? ' style="grid-column:1/-1"' : ''}><small>${esc(k)}</small><b>${esc(v)}</b></div>`
const title = t => `<div class="t">${esc(t)}</div>`

function buildHtml(d, logo) {
  const snapshot = JSON.stringify({ botUp: d.botUp, sysUp: d.sysUp, at: d.at }).replace(/</g, '\\u003c')
  const img = `<img class="logo" src="${logo || LOGO}" onerror="this.outerHTML='<div class=&quot;logo m&quot;>E</div>'">`
  const cores = d.cores.map((v, i) => `<div class="cc"><div class="cb"><i data-h="${v}" style="background:linear-gradient(0deg,${level(v)})"></i></div><small>C${i + 1}</small><em>${v}%</em></div>`).join('')
  return `<style>
*{box-sizing:border-box;margin:0;font-family:Arial,sans-serif;user-select:none}
body{background:#000;padding:8px;color:#fff}
#a{max-width:430px;margin:0 auto}
.k{border:1px solid rgba(59,130,246,.6);border-radius:13px;background:linear-gradient(145deg,#071735,#000 82%);box-shadow:0 0 12px rgba(250,204,21,.14),inset 0 0 14px rgba(37,99,235,.14);padding:9px 11px;margin-bottom:7px}
.h{display:flex;gap:12px;align-items:center;padding:12px;border-radius:18px;border:1px solid #2563eb;background:linear-gradient(135deg,#0b2259,#000 78%);box-shadow:0 0 20px rgba(250,204,21,.3),inset 0 0 24px rgba(37,99,235,.3);margin-bottom:9px;animation:gl 3s ease-in-out infinite}
@keyframes gl{50%{box-shadow:0 0 32px rgba(250,204,21,.55),inset 0 0 28px rgba(56,189,248,.38)}}
.logo{width:62px;height:62px;flex:none;border-radius:16px;object-fit:cover;border:2px solid #facc15;box-shadow:0 0 14px rgba(250,204,21,.65)}
.m{display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#1d4ed8,#000)}
.x{min-width:0;flex:1}.x h1{font-size:17px;color:#fff;text-shadow:0 0 10px rgba(250,204,21,.75);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.x p{font-size:10px;color:#a9c8ff;margin-top:2px}
.live{display:flex;align-items:center;gap:5px;font-size:9px;letter-spacing:1.5px;color:#facc15;margin-top:5px}
.dot{width:7px;height:7px;border-radius:50%;background:#facc15;box-shadow:0 0 9px #facc15;animation:bl 1.2s infinite}
@keyframes bl{50%{opacity:.2}}
.pill{text-align:center;padding:7px 11px;border-radius:13px;background:#000;border:1px solid #facc15;box-shadow:0 0 12px rgba(250,204,21,.45)}
.pill b{display:block;font-size:18px;color:${pingColor(d.ping)};text-shadow:0 0 8px rgba(250,204,21,.7)}.pill small{font-size:8px;color:#d6e4ff;letter-spacing:1px}
.u{display:grid;grid-template-columns:1fr 1fr;gap:7px}.u .k{text-align:center}
.u small{font-size:8px;letter-spacing:1px;color:#9cc2ff}.u b{display:block;font-size:15px;color:#fff;margin-top:3px;text-shadow:0 0 9px rgba(250,204,21,.6)}
.l{display:flex;justify-content:space-between;font-size:10px;font-family:monospace;margin-bottom:6px}.l b{color:#7db8ff}.l span{color:#fff}
.bar{height:10px;border-radius:6px;background:#000;border:1px solid #14264d;overflow:hidden}
.bar i{display:block;position:relative;overflow:hidden;height:100%;width:0;border-radius:6px;transition:width 1.6s;box-shadow:0 0 10px rgba(250,204,21,.55)}
.bar i:after,.cb i:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);transform:translateX(-100%);animation:sh 2.2s infinite}
@keyframes sh{to{transform:translateX(100%)}}
.t{font-size:9px;letter-spacing:2px;color:#facc15;text-shadow:0 0 8px rgba(250,204,21,.6);margin:12px 3px 6px}
.s{display:grid;grid-template-columns:1fr 1fr;gap:7px}.s .k{margin:0}
.c{padding:7px 9px}.c small{display:block;font-size:8px;color:#9cc2ff;letter-spacing:1px}.c b{font-size:10px;font-family:monospace;word-break:break-word;color:#fff}
.cs{display:flex;gap:5px;align-items:flex-end}.cc{flex:1;text-align:center}
.cb{position:relative;height:40px;border-radius:5px;background:#000;border:1px solid #14264d;display:flex;align-items:flex-end;overflow:hidden}
.cb i{display:block;position:relative;overflow:hidden;width:100%;height:0;transition:height 1.6s;box-shadow:0 0 8px rgba(250,204,21,.5)}
.cc small{display:block;font-size:8px;color:#9cc2ff;margin-top:3px}.cc em{font-style:normal;font-size:8px;color:#fff}
.f{display:flex;justify-content:space-between;font-size:8px;color:#a9c8ff;padding:9px 4px 2px}
</style><div id="a">
<div class="h">${img}<div class="x"><h1>${esc(d.bot)}</h1><p>v${esc(d.ver)} · SERVER MONITOR</p><div class="live"><span class="dot"></span>LIVE · <span id="age">0s</span></div></div>
<div class="pill"><b>${d.ping} ms</b><small>PING</small></div></div>
<div class="u"><div class="k"><small>BOT UPTIME</small><b id="bu">-</b></div><div class="k"><small>SYSTEM UPTIME</small><b id="su">-</b></div></div>
${gauge('CPU', d.cpu, `${d.cores.length} core`)}
${gauge(d.ramLabel, d.ram, d.ramText)}
${gauge('DISK', d.disk, d.diskText)}
${d.swap || d.swapText !== 'Tidak aktif' ? gauge('SWAP', d.swap, d.swapText) : ''}
${title('CPU')}<div class="s">${cell('MODEL', d.cpuModel, true)}${cell('CLOCK', d.mhz + ' MHz')}${cell('LOAD 1/5/15', d.load)}<div class="k" style="grid-column:1/-1"><div class="cs">${cores}</div></div></div>
${title('SYSTEM')}<div class="s">${cell('OS', d.os)}${cell('PLATFORM', d.platform)}${cell('HOSTNAME', d.host)}${cell('HOST RAM', d.hostRam)}</div>
${title('RUNTIME')}<div class="s">${cell('NODE.JS', d.node)}${cell('V8', d.v8)}${cell('PID', d.pid)}${cell('PLUGINS', d.plugins)}${cell('RSS', d.rss)}${cell('EXTERNAL', d.ext)}${cell('HEAP', d.heap, true)}</div>
${title('NETWORK & BOT')}<div class="s">${cell('IPv4', d.v4)}${cell('IPv6', d.v6)}${cell('USERS', d.users)}${cell('RESPONSE', d.delay == null ? '-' : d.delay + ' ms')}</div>
<div class="f"><span>Snapshot saat command dijalankan</span><b>${esc(FOOTER)}</b></div></div>
<script>var D=${snapshot};function f(s){var d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);return(d?d+'d ':'')+(h?h+'h ':'')+(m?m+'m ':'')+s%60+'s'}
function t(){var e=Math.floor((Date.now()-D.at)/1000);bu.textContent=f(D.botUp+e);su.textContent=f(D.sysUp+e);age.textContent=e+'s'}
setTimeout(function(){document.querySelectorAll('.bar i').forEach(function(i){i.style.width=i.dataset.w+'%'});document.querySelectorAll('.cb i').forEach(function(i){i.style.height=i.dataset.h+'%'})},300);setInterval(t,1000);t();</script>`
}

function buildText(d) {
  return [
    `*${d.bot}* · v${d.ver}`,
    '',
    `\`PING\` ${d.ping} ms${d.delay != null ? ` (respon ${d.delay} ms)` : ''}`,
    `\`UPTIME\` bot ${dur(d.botUp)} · sistem ${dur(d.sysUp)}`,
    '',
    `\`CPU\` ${d.cpu}% · ${d.cores.length} core · ${d.mhz} MHz`,
    `${d.cpuModel}`,
    `Load: ${d.load}`,
    `\`${d.ramLabel}\` ${d.ramText} (${d.ram}%)`,
    `\`DISK\` ${d.diskText} (${d.disk}%)`,
    `\`SWAP\` ${d.swapText}`,
    '',
    `\`SISTEM\` ${d.os} · ${d.platform}`,
    `Hostname: ${d.host} · Host RAM: ${d.hostRam}`,
    `\`RUNTIME\` Node ${d.node} · V8 ${d.v8} · PID ${d.pid}`,
    `Memory: RSS ${d.rss} · Heap ${d.heap} · Ext ${d.ext}`,
    `Plugin: ${d.plugins} · User: ${d.users}`,
    `IPv4: ${d.v4} · IPv6: ${d.v6}`,
    '',
    FOOTER
  ].join('\n')
}

let handler = async (m, { conn }) => {
  const t0 = performance.now()
  await m.react('🌱').catch(() => { })
  const ping = performance.now() - t0

  const [d, logo] = await Promise.all([collect(m, ping), getLogo()])

  try {
    const rich = new AIRich(conn)
    if (typeof rich.addSection !== 'function') throw new Error('AIRich.addSection tidak tersedia')
    if (typeof rich.setTitle === 'function') rich.setTitle(`${d.bot} Server`)
    rich.addSection({
      view_model: {
        __typename: 'GenAISingleLayoutViewModel',
        primitive: { __typename: 'FOAHtmlPrimitiveDemoDONOTUSE', trusted_sources: [], payload: buildHtml(d, logo) }
      }
    })
    if (typeof rich.setFooter === 'function') rich.setFooter(FOOTER)
    await rich.send(m.chat, { quoted: m })
  } catch (e) {
    console.error('[PING2]', e?.stack || e?.message || e)
    await m.reply(buildText(d))
  }
}

handler.help = ['ping2']
handler.tags = ['info']
handler.command = /^(ping2|pinglive)$/i
handler.limit = true
handler.register = true

export default handler
