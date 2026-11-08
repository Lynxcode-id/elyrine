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

if (process.argv.includes('--insecure-tls')) process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

import { Readable } from 'stream'
const origFromWeb = Readable.fromWeb
if (origFromWeb) {
  Readable.fromWeb = function (rs, options) {
    if (rs && typeof rs.getReader !== 'function') return rs
    return origFromWeb(rs, options)
  }
}

import './config.js'
import './lib/http.js'

import path, { join, relative, sep } from 'path'
import { platform } from 'process'
import { fileURLToPath, pathToFileURL } from 'url'
import { createRequire } from 'module'
import { readdirSync, existsSync, readFileSync, statSync, unlinkSync, watch } from 'fs'
import { spawn } from 'child_process'
import { tmpdir } from 'os'
import { format } from 'util'
import yargs from 'yargs/yargs'
import syntaxerror from 'syntax-error'
import chalk from 'chalk'
import { Low, JSONFile } from 'lowdb'
import { startBot, protoType, serialize, ROOT } from './lib/function.js'
import { applyPrefix } from './lib/prefix.js'
import { startLimitScheduler } from './lib/limit.js'
import { tuneSharp, startMemoryWatchdog } from './lib/perf.js'

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') { return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString() }
global.__dirname = function dirname(pathURL) { return path.dirname(global.__filename(pathURL, true)) }
global.__require = function require(dir = import.meta.url) { return createRequire(dir) }

protoType()
serialize()

global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({ ...query, ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {}) })) : '')

const __dirname = global.__dirname(import.meta.url)

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('^[' + (opts['prefix'] || '‎xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')

global.db = new Low(new JSONFile('database.json'))
global.loadDatabase = async function loadDatabase() {
  while (db.READ) await new Promise(r => setTimeout(r, 200))
  if (db.data !== null) return db.data
  db.READ = true
  try { await db.read() } catch (e) { console.error(e) }
  db.READ = null
  db.data = { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {}, prefixcfg: {}, ...(db.data || {}) }
  applyPrefix()
  return db.data
}
await loadDatabase()
startLimitScheduler()

const flushDb = async () => { if (global.db.data) await global.db.write().catch(console.error) }
setInterval(flushDb, 30 * 1000).unref()
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, async () => { await flushDb(); process.exit(0) })

const TMP_DIR = join(ROOT, 'tmp')
const cleanTmp = (maxAgeMs = 3 * 60 * 1000) => {
  if (!existsSync(TMP_DIR)) return
  for (const f of readdirSync(TMP_DIR)) {
    const p = join(TMP_DIR, f)
    try { const st = statSync(p); if (st.isFile() && Date.now() - st.mtimeMs > maxAgeMs) unlinkSync(p) } catch { }
  }
}
setInterval(() => cleanTmp(), 5 * 60 * 1000).unref()
if (global.opts['autocleartmp']) setInterval(() => { cleanTmp(0); console.log(chalk.cyan('Auto cleartmp success...')) }, 5 * 60 * 1000).unref()

tuneSharp()
startMemoryWatchdog()

process.on('uncaughtException', console.error)
process.on('unhandledRejection', e => console.error('[unhandledRejection]', e))

let handler = await import('./handler.js')
global.reloadHandler = async function () {
  try {
    const H = await import(`./handler.js?update=${Date.now()}`).catch(console.error)
    if (Object.keys(H || {}).length) handler = H
  } catch (e) { console.error(e) }
  return true
}

const pluginFolder = join(__dirname, 'plugins')
const pluginFilter = f => /\.js$/.test(f)
global.plugins = {}
global.pluginFolder = pluginFolder

function walk(dir, base = dir) {
  let out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out = out.concat(walk(p, base))
    else if (pluginFilter(e.name)) out.push(relative(base, p).split(sep).join('/'))
  }
  return out
}

function finalizePlugin(key, mod) {
  const plugin = mod.default || mod
  const folder = key.includes('/') ? key.split('/')[0] : null
  if (typeof plugin === 'function' && folder && folder !== 'system' && !plugin.tags) plugin.tags = [folder]
  return plugin
}

async function loadPlugin(key, bust = false) {
  const file = join(pluginFolder, key)
  const err = syntaxerror(readFileSync(file), key, { sourceType: 'module', allowAwaitOutsideFunction: true })
  if (err) { console.error(chalk.red(`syntax error '${key}'\n${format(err)}`)); return false }
  try {
    const mod = await import(pathToFileURL(file).href + (bust ? `?update=${Date.now()}` : ''))
    global.plugins[key] = finalizePlugin(key, mod)
    return true
  } catch (e) {
    console.error(chalk.red(`❌ Failed to load plugin ${key}: ${format(e)}`))
    delete global.plugins[key]
    return false
  }
}

const sortPlugins = () => {
  const rank = k => k.startsWith('system/') ? 0 : 1
  global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b)))
}

for (const key of walk(pluginFolder)) await loadPlugin(key)
sortPlugins()

global.reload = async (_ev, filename) => {
  if (!filename || !pluginFilter(filename)) return
  const key = filename.split(sep).join('/')
  const file = join(pluginFolder, key)
  if (!existsSync(file)) {
    if (key in global.plugins) { console.log(chalk.yellow(`deleted plugin '${key}'`)); delete global.plugins[key] }
    return
  }
  console.log(chalk.cyan(`${key in global.plugins ? 're-load' : 'new'} plugin '${key}'`))
  await loadPlugin(key, true)
  sortPlugins()
}
global.loadPluginFile = async key => { const ok = await loadPlugin(key, true); sortPlugins(); return ok }

try { watch(pluginFolder, { recursive: true }, global.reload) }
catch { console.warn('fs.watch recursive tidak didukung di OS ini; hot-reload plugin dimatikan (pakai .restart)') }

await startBot({
  getHandlers: () => handler,
  sessionId: global.sessionId || 'erine',
  authDir: global.sessionDir,
  phoneNumber: global.pairing || null
})

async function _quickTest() {
  const test = await Promise.all([
    spawn('ffmpeg'),
    spawn('ffprobe'),
    spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
    spawn('convert'),
    spawn('magick'),
    spawn('gm'),
    spawn('find', ['--version'])
  ].map(p => Promise.race([
    new Promise(resolve => p.on('close', code => resolve(code !== 127))),
    new Promise(resolve => p.on('error', _ => resolve(false)))
  ])))
  const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test
  const s = global.support = { ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find }
  Object.freeze(global.support)
  if (!s.ffmpeg) console.warn('Silahkan install ffmpeg terlebih dahulu agar bisa mengirim video')
  if (s.ffmpeg && !s.ffmpegWebp) console.warn('Sticker mungkin tidak beranimasi tanpa libwebp di ffmpeg')
  if (!s.convert && !s.magick && !s.gm) console.warn('Fitur stiker mungkin tidak bekerja tanpa imagemagick')
}
_quickTest().catch(console.error)
