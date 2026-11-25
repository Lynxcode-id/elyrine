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

import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, appendFileSync, chmodSync } from 'fs'
import { join, dirname, basename } from 'path'
import { tmpdir } from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

const GH = {
  owner: process.env.GH_OWNER || 'Lynxcode-id',
  repo: process.env.GH_REPO || 'elyrine',
  branch: process.env.GH_BRANCH || 'main'
}

const SAFE = /^[a-z0-9_][a-z0-9_-]*$/i
const MAX_UPLOAD = 20 * 1024 * 1024
const R = () => '/repos/' + GH.owner + '/' + GH.repo
const enc = p => p.split('/').map(encodeURIComponent).join('/')
const short = sha => String(sha || '').slice(0, 7)
const kb = n => (n < 1024 ? n + ' B' : (n / 1024).toFixed(1) + ' KB')

function getToken(root) {
  const fromEnv = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
  if (fromEnv) return String(fromEnv).trim()
  if (global.ghToken) return String(global.ghToken).trim()
  const file = join(root, '.ghtoken')
  if (existsSync(file)) return readFileSync(file, 'utf-8').trim()
  return ''
}

const noTokenText = prefix =>
  '🔑 Token GitHub belum diset.\n\n' +
  '1. Buat *classic token* di github.com/settings/tokens (scope: *repo*)\n' +
  '2. Kirim ke bot:  *' + prefix + 'setghtoken ghp_xxxxx*\n\n' +
  'Alternatif: isi env *GH_TOKEN* di panel/hosting, atau buat file *.ghtoken* di folder utama bot (isi token saja).'

async function gh(token, method, url, body) {
  const res = await fetch(url.indexOf('http') === 0 ? url : 'https://api.github.com' + url, {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'elyrine-bot',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const raw = await res.text()
  let data = null
  try { data = raw ? JSON.parse(raw) : null } catch (e) { data = raw }
  if (!res.ok) {
    const err = new Error((data && data.message) || 'HTTP ' + res.status)
    err.status = res.status
    throw err
  }
  return { data, headers: res.headers }
}

function explain(e, token) {
  if (typeof e === 'string') return e
  let msg = String((e && e.message) || e)
  if (token) msg = msg.split(token).join('***')
  const s = e && e.status
  if (s === 401) return '❌ Token tidak valid / sudah expired. Set ulang dengan .setghtoken'
  if (s === 403) return '❌ Ditolak GitHub (token kurang izin scope *repo*, atau kena rate limit).\n' + msg
  if (s === 404) return '❌ Tidak ditemukan. Cek nama repo/branch, atau token belum punya akses ke repo.\n' + msg
  if (s === 409) return '❌ Konflik commit (repo baru berubah). Coba ulangi.\n' + msg
  return '❌ ' + msg
}

function cleanPath(p) {
  p = String(p || '').trim().replace(/^\/+|\/+$/g, '').replace(/\/{2,}/g, '/')
  if (!p) return null
  if (/\\|\.\.|[\u0000-\u001f]/.test(p)) return null
  const segs = p.split('/')
  for (const s of segs) {
    if (!/^[\w.@+-]+$/.test(s) || s === '.' || s.toLowerCase() === '.git') return null
  }
  return p
}

function secretFound(token, buffer) {
  if (buffer.length > 5 * 1024 * 1024) return false
  const s = buffer.toString('latin1')
  if (token && s.indexOf(token) >= 0) return true
  return /gh[pousr]_[A-Za-z0-9]{30,}/.test(s) || /github_pat_[A-Za-z0-9_]{40,}/.test(s)
}

async function checkSyntax(code, ext) {
  const f = join(tmpdir(), 'ghchk-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext)
  writeFileSync(f, code)
  try {
    await execFileAsync(process.execPath, ['--check', f], { timeout: 15000 })
    return null
  } catch (e) {
    const msg = String((e && e.stderr) || (e && e.message) || 'syntax error').split('\n').filter(l => l.trim() && !/^\s+at /.test(l) && !/^Node\.js v/.test(l)).slice(0, 6).join('\n')
    return msg.split(f).join('file')
  } finally {
    try { unlinkSync(f) } catch (e) { }
  }
}

function extractCode(m, rest) {
  let code = String((m.quoted && m.quoted.text) || rest || '').trim()
  return code.replace(/^```(?:js|javascript)?\n?/i, '').replace(/```$/, '').trim()
}

async function getContent(token, path) {
  try {
    const url = (path ? R() + '/contents/' + enc(path) : R() + '/contents') + '?ref=' + encodeURIComponent(GH.branch)
    const { data } = await gh(token, 'GET', url)
    if (Array.isArray(data)) return { type: 'dir', items: data }
    if (data.type !== 'file') return { type: data.type, sha: data.sha }
    let buffer
    if (data.content && data.encoding === 'base64') {
      buffer = Buffer.from(data.content, 'base64')
    } else {
      const b = await gh(token, 'GET', R() + '/git/blobs/' + data.sha)
      buffer = Buffer.from(b.data.content, 'base64')
    }
    return { type: 'file', sha: data.sha, size: data.size, buffer, url: data.html_url }
  } catch (e) {
    if (e.status === 404) return null
    throw e
  }
}

async function putFile(token, path, buffer, message) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const cur = await getContent(token, path)
    if (cur && cur.type !== 'file') throw (cur.type === 'dir' ? 'Path itu sebuah folder, bukan file.' : 'Path itu bukan file biasa.')
    if (cur && cur.buffer.equals(buffer)) return { unchanged: true, url: cur.url }
    const body = { message, content: buffer.toString('base64'), branch: GH.branch }
    if (cur) body.sha = cur.sha
    try {
      const { data } = await gh(token, 'PUT', R() + '/contents/' + enc(path), body)
      return { created: !cur, commit: data.commit.sha, url: data.content.html_url }
    } catch (e) {
      if (attempt === 0 && (e.status === 409 || e.status === 422)) continue
      throw e
    }
  }
}

async function walkFiles(token, dir) {
  const { data } = await gh(token, 'GET', R() + '/contents/' + enc(dir) + '?ref=' + encodeURIComponent(GH.branch))
  let files = []
  for (const it of data) {
    if (it.type === 'dir') files = files.concat(await walkFiles(token, it.path))
    else files.push(it.path)
  }
  return files
}

async function deleteFiles(token, paths, message) {
  const ref = await gh(token, 'GET', R() + '/git/ref/heads/' + enc(GH.branch))
  const headSha = ref.data.object.sha
  const head = await gh(token, 'GET', R() + '/git/commits/' + headSha)
  const tree = await gh(token, 'POST', R() + '/git/trees', {
    base_tree: head.data.tree.sha,
    tree: paths.map(p => ({ path: p, mode: '100644', type: 'blob', sha: null }))
  })
  const commit = await gh(token, 'POST', R() + '/git/commits', { message, tree: tree.data.sha, parents: [headSha] })
  await gh(token, 'PATCH', R() + '/git/refs/heads/' + enc(GH.branch), { sha: commit.data.sha })
  return commit.data.sha
}

async function deletePath(token, path, message) {
  const cur = await getContent(token, path)
  if (!cur) return null
  if (cur.type === 'file') {
    const { data } = await gh(token, 'DELETE', R() + '/contents/' + enc(path), { message, sha: cur.sha, branch: GH.branch })
    return { type: 'file', commit: data.commit.sha }
  }
  if (cur.type === 'dir') {
    const files = await walkFiles(token, path)
    if (!files.length) return { type: 'dir', count: 0 }
    const commit = await deleteFiles(token, files, message)
    return { type: 'dir', count: files.length, commit }
  }
  throw 'Path itu bukan file/folder biasa.'
}

async function repoPluginKeys(token) {
  const { data } = await gh(token, 'GET', R() + '/git/trees/' + enc(GH.branch) + '?recursive=1')
  return data.tree
    .filter(t => t.type === 'blob' && t.path.indexOf('plugins/') === 0 && /\.js$/.test(t.path))
    .map(t => t.path.slice('plugins/'.length))
}

function parseSpec(first) {
  const spec = String(first || '').replace(/--\w+/g, '').trim()
  const parts = spec.split('|').map(v => (v || '').trim())
  const nameRaw = parts.length > 1 ? parts[1] : parts[0]
  const name = String(nameRaw || '').replace(/\.js$/i, '')
  const folder = parts.length > 1 ? parts[0].toLowerCase().replace(/^\/+|\/+$/g, '') : ''
  return { name, folder }
}

const validSpec = ({ name, folder }) =>
  SAFE.test(name) && (!folder || folder.split('/').every(s => SAFE.test(s)))

const helpText = p =>
  '🐙 *KONTROL REPO GITHUB*\n' +
  '_' + GH.owner + '/' + GH.repo + ' · ' + GH.branch + '_\n\n' +
  '*' + p + 'setghtoken* <token>\n*' + p + 'ghinfo*\n' +
  '*' + p + 'ghls* [path]\n*' + p + 'ghget* <path>\n*' + p + 'ghput* <path> _(reply kode/dokumen)_\n' +
  '*' + p + 'ghdel* <path> [--y]\n*' + p + 'addfolder* <path>\n\n' +
  '*' + p + 'spgh* <folder>|<nama> _(bot + repo)_\n' +
  '*' + p + 'delgh* <folder>|<nama> _(--repo / --bot)_\n' +
  '*' + p + 'listgh* [folder]\n\n' +
  'Contoh:\n' + p + 'addfolder plugins/maker\n' + p + 'spgh maker|fakegc  _(reply kodenya)_'

let handler = async (m, { conn, text, usedPrefix, command, __dirname }) => {
  const cmd = String(command || '').toLowerCase()
  const root = join(__dirname, '..')
  const p = usedPrefix || '.'
  text = String(text || '')

  if (cmd === 'gh') return m.reply(helpText(p))

  if (cmd === 'setghtoken') {
    const t = text.trim().split(/\s+/)[0]
    if (!/^(gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})$/.test(t || '')) throw 'Format: *' + p + 'setghtoken ghp_xxxxx*'
    try {
      const { data } = await gh(t, 'GET', '/user')
      const repo = await gh(t, 'GET', R())
      writeFileSync(join(root, '.ghtoken'), t + '\n')
      try { chmodSync(join(root, '.ghtoken'), 0o600) } catch (e) { }
      const gi = join(root, '.gitignore')
      const cur = existsSync(gi) ? readFileSync(gi, 'utf-8') : ''
      if (!/^\.ghtoken$/m.test(cur)) appendFileSync(gi, (cur && !/\n$/.test(cur) ? '\n' : '') + '.ghtoken\n')
      try { await conn.sendMessage(m.chat, { delete: m.key }) } catch (e) { }
      const push = repo.data.permissions && repo.data.permissions.push
      return m.reply('✅ Token tersimpan (akun *' + data.login + '*).\n' + (push ? '✍️ Akses tulis ke ' + GH.owner + '/' + GH.repo + ': OK' : '⚠️ Token TIDAK punya akses tulis ke repo ini') + '\n🧹 Pesan token sudah dicoba dihapus, hapus manual kalau masih ada.')
    } catch (e) {
      throw explain(e, t)
    }
  }

  const token = getToken(root)
  if (!token) throw noTokenText(p)

  try {
    switch (cmd) {
      case 'ghinfo': {
        const user = await gh(token, 'GET', '/user')
        const repo = await gh(token, 'GET', R())
        const last = await gh(token, 'GET', R() + '/commits?sha=' + encodeURIComponent(GH.branch) + '&per_page=1')
        const c = last.data[0]
        const scopes = user.headers.get('x-oauth-scopes') || '(fine-grained / tidak ada)'
        return m.reply(
          '🐙 *GitHub OK*\n' +
          '👤 Akun   : ' + user.data.login + '\n' +
          '🔑 Scope  : ' + scopes + '\n' +
          '📦 Repo   : ' + repo.data.full_name + (repo.data.private ? ' (private)' : ' (public)') + '\n' +
          '🌿 Branch : ' + GH.branch + ' (default: ' + repo.data.default_branch + ')\n' +
          '✍️ Tulis  : ' + (repo.data.permissions && repo.data.permissions.push ? 'ya' : 'TIDAK') + '\n' +
          '📝 Commit : ' + short(c && c.sha) + ' — ' + String((c && c.commit.message) || '').split('\n')[0]
        )
      }

      case 'ghls': {
        const path = text.trim() ? cleanPath(text) : ''
        if (path === null) throw 'Path tidak valid.'
        const cur = await getContent(token, path)
        if (!cur) throw 'Path *' + (path || '/') + '* tidak ada di repo.'
        if (cur.type !== 'dir') return m.reply('📄 *' + path + '* adalah file (' + kb(cur.size) + '). Ambil dengan ' + p + 'ghget ' + path)
        const items = cur.items.slice().sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1))
        const lines = items.slice(0, 80).map(i => (i.type === 'dir' ? '📁 ' + i.name + '/' : '📄 ' + i.name + ' (' + kb(i.size) + ')'))
        return m.reply('📂 */' + path + '* — ' + items.length + ' item\n\n' + lines.join('\n') + (items.length > 80 ? '\n…dan ' + (items.length - 80) + ' lainnya' : ''))
      }

      case 'ghget': {
        const path = cleanPath(text)
        if (!path) throw 'Contoh: *' + p + 'ghget plugins/maker/fakegc.js*'
        const cur = await getContent(token, path)
        if (!cur) throw 'File *' + path + '* tidak ada di repo.'
        if (cur.type === 'dir') throw '*' + path + '* adalah folder. Pakai ' + p + 'ghls ' + path
        if (cur.type !== 'file') throw 'Path itu bukan file biasa.'
        return conn.sendFile(m.chat, cur.buffer, basename(path), '📄 ' + path + ' (' + kb(cur.size) + ')', m)
      }

      case 'ghput': {
        const [first = '', ...rest] = text.split('\n')
        const path = cleanPath(first)
        if (!path) throw 'Contoh: *' + p + 'ghput scrape/hdimage.js*\n(reply kode / dokumen, atau tulis kode di baris bawah)'

        let buffer
        const code = extractCode(m, rest.join('\n'))
        const q = m.quoted
        const qMime = q ? (q.mimetype || (q.msg && q.msg.mimetype) || '') : ''
        if (code) buffer = Buffer.from(code + '\n', 'utf-8')
        else if (q && /^(application|text)\//i.test(qMime) && typeof q.download === 'function') buffer = await q.download()
        if (!buffer || !buffer.length) throw 'Isi file kosong. Reply kode/dokumen, atau tulis kode di baris bawah perintah.'
        if (buffer.length > MAX_UPLOAD) throw 'File terlalu besar (maks ' + kb(MAX_UPLOAD) + ').'
        if (secretFound(token, buffer)) throw '🛑 Di dalam file terdeteksi *token/secret GitHub*. Upload dibatalkan supaya tidak bocor ke repo.'

        const ext = (path.match(/\.([a-z0-9]+)$/i) || [])[1]
        if (ext && /^(js|mjs|cjs)$/i.test(ext)) {
          const err = await checkSyntax(buffer.toString('utf-8'), /^cjs$/i.test(ext) ? 'cjs' : 'mjs')
          if (err) throw '❌ Syntax error, TIDAK di-upload:\n\n' + err
        } else if (ext && /^json$/i.test(ext)) {
          try { JSON.parse(buffer.toString('utf-8')) } catch (e) { throw '❌ JSON tidak valid, TIDAK di-upload:\n' + e.message }
        }

        const r = await putFile(token, path, buffer, 'ghput: ' + path + ' via bot')
        if (r.unchanged) return m.reply('ℹ️ *' + path + '* isinya sama persis dengan di repo, tidak ada commit baru.')
        return m.reply('✅ *' + path + '* ' + (r.created ? 'dibuat' : 'diperbarui (ditimpa)') + ' di repo.\n📝 ' + short(r.commit) + '\n🔗 ' + r.url)
      }

      case 'ghdel': {
        const confirmed = /--y\b/i.test(text)
        const path = cleanPath(text.replace(/--\w+/g, ''))
        if (!path) throw 'Contoh:\n' + p + 'ghdel scrape/lama.js\n' + p + 'ghdel plugins/maker --y  _(folder wajib --y)_'
        const cur = await getContent(token, path)
        if (!cur) throw '*' + path + '* tidak ada di repo.'
        if (cur.type === 'dir' && !confirmed) {
          const files = await walkFiles(token, path)
          throw '⚠️ *' + path + '/* berisi ' + files.length + ' file. Ketik ulang dengan *--y* untuk menghapus seluruhnya:\n' + p + 'ghdel ' + path + ' --y'
        }
        const r = await deletePath(token, path, 'ghdel: ' + path + ' via bot')
        if (r.type === 'dir') return m.reply('🗑️ Folder *' + path + '/* dihapus dari repo (' + r.count + ' file)' + (r.commit ? '\n📝 ' + short(r.commit) : ''))
        return m.reply('🗑️ File *' + path + '* dihapus dari repo.\n📝 ' + short(r.commit) + '\n_Hanya repo; file di bot tidak disentuh._')
      }

      case 'addfolder': {
        const path = cleanPath(text)
        if (!path) throw 'Contoh: *' + p + 'addfolder plugins/maker*'
        const cur = await getContent(token, path)
        if (cur && cur.type !== 'dir') throw '*' + path + '* sudah ada sebagai file.'
        let msg = ''
        if (cur) {
          msg = 'ℹ️ Folder *' + path + '/* sudah ada di repo.'
        } else {
          const r = await putFile(token, path + '/.gitkeep', Buffer.alloc(0), 'addfolder: ' + path + ' via bot')
          msg = '📁 Folder *' + path + '/* dibuat di repo.\n📝 ' + short(r.commit)
        }
        const local = join(root, path)
        if (!existsSync(local)) {
          mkdirSync(local, { recursive: true })
          msg += '\n💾 Folder juga dibuat di bot.'
        }
        return m.reply(msg)
      }

      case 'spgh': {
        const [first = '', ...rest] = text.split('\n')
        const spec = parseSpec(first)
        if (!spec.name) throw 'Contoh:\n' + p + 'spgh maker|fakegc\n' + p + 'spgh fakegc  _(plugin lama → timpa)_\n(reply kode plugin-nya, atau tulis di baris bawah)'
        if (!validSpec(spec)) throw 'Folder/nama hanya boleh huruf, angka, _ dan - (tanpa spasi/titik).'

        let folder = spec.folder
        const name = spec.name
        if (!folder) {
          const hit = Object.keys(global.plugins).filter(k => k.split('/').pop() === name + '.js')
          if (hit.length !== 1) throw hit.length
            ? 'Nama *' + name + '* ada di beberapa folder:\n' + hit.map(v => '• ' + v).join('\n') + '\nPakai: ' + p + 'spgh <folder>|' + name
            : 'Plugin *' + name + '* belum ada. Pakai: ' + p + 'spgh <folder>|' + name
          folder = hit[0].split('/').slice(0, -1).join('/')
        }

        const code = extractCode(m, rest.join('\n'))
        if (!code) throw 'Kode plugin kosong. Reply pesan berisi kode, atau tulis di baris bawah perintah.'
        if (secretFound(token, Buffer.from(code))) throw '🛑 Di dalam kode terdeteksi *token/secret GitHub*. Dibatalkan supaya tidak bocor ke repo.'

        const key = folder + '/' + name + '.js'
        const err = await checkSyntax(code, 'mjs')
        if (err) throw '❌ Syntax error, plugin TIDAK disimpan (bot & repo):\n\n' + err

        const file = join(__dirname, key)
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, code + '\n')
        const ok = await global.loadPluginFile(key)

        let repoMsg
        try {
          const r = await putFile(token, 'plugins/' + key, Buffer.from(code + '\n', 'utf-8'), 'spgh: ' + key + ' via bot')
          repoMsg = r.unchanged
            ? '☁️ Repo: tidak berubah (isi sama)'
            : '☁️ Repo: ' + (r.created ? 'dibuat' : 'diperbarui (ditimpa)') + ' · ' + short(r.commit) + '\n🔗 ' + r.url
        } catch (e) {
          repoMsg = '☁️ Repo: GAGAL — ' + explain(e, token).replace(/^❌ /, '')
        }
        return m.reply((ok ? '✅ *' + key + '* tersimpan & aktif di bot.' : '⚠️ Tersimpan di plugins/' + key + ' tapi gagal dimuat, cek console.') + '\n' + repoMsg)
      }

      case 'delgh': {
        const onlyRepo = /--repo\b/i.test(text)
        const onlyBot = /--bot\b/i.test(text)
        const spec = parseSpec(text.split('\n')[0])
        if (!spec.name) throw 'Contoh:\n' + p + 'delgh maker|fakegc\n' + p + 'delgh fakegc\n(tambah --repo atau --bot untuk salah satu saja)'
        if (!validSpec(spec)) throw 'Folder/nama hanya boleh huruf, angka, _ dan - (tanpa spasi/titik).'

        let key
        if (spec.folder) {
          key = spec.folder + '/' + spec.name + '.js'
        } else {
          const local = Object.keys(global.plugins).filter(k => k.split('/').pop() === spec.name + '.js')
          let all = local
          if (!onlyBot) {
            const remote = await repoPluginKeys(token)
            all = Array.from(new Set(local.concat(remote.filter(k => k.split('/').pop() === spec.name + '.js'))))
          }
          if (all.length !== 1) throw all.length
            ? 'Nama *' + spec.name + '* ada di beberapa folder:\n' + all.map(v => '• ' + v).join('\n') + '\nPakai: ' + p + 'delgh <folder>|' + spec.name
            : 'Plugin *' + spec.name + '* tidak ditemukan. Pakai: ' + p + 'delgh <folder>|' + spec.name
          key = all[0]
        }

        const out = []
        if (!onlyRepo) {
          const file = join(__dirname, key)
          if (existsSync(file)) {
            unlinkSync(file)
            delete global.plugins[key]
            out.push('💾 Bot: *' + key + '* dihapus')
          } else {
            delete global.plugins[key]
            out.push('💾 Bot: tidak ada file')
          }
        }
        if (!onlyBot) {
          try {
            const r = await deletePath(token, 'plugins/' + key, 'delgh: ' + key + ' via bot')
            out.push(r ? '☁️ Repo: dihapus · ' + short(r.commit) : '☁️ Repo: tidak ada di repo')
          } catch (e) {
            out.push('☁️ Repo: GAGAL — ' + explain(e, token).replace(/^❌ /, ''))
          }
        }
        return m.reply('🗑️ *' + key + '*\n' + out.join('\n'))
      }

      case 'listgh': {
        const want = text.trim().toLowerCase().replace(/^\/+|\/+$/g, '')
        const remote = await repoPluginKeys(token)
        const local = Object.keys(global.plugins)
        const groups = {}
        for (const key of remote) {
          const parts = key.split('/')
          const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '(root)'
          if (want && folder !== want) continue
          if (!groups[folder]) groups[folder] = []
          groups[folder].push((local.indexOf(key) >= 0 ? '✅ ' : '⚠️ ') + parts[parts.length - 1].replace(/\.js$/, ''))
        }
        const body = Object.keys(groups).sort().map(f => '📁 *' + f + '* (' + groups[f].length + ')\n' + groups[f].sort().map(v => '  ' + v).join('\n'))
        if (!body.length) throw want ? 'Folder *' + want + '* tidak ada di repo.' : 'Belum ada plugin di repo.'
        let extra = ''
        if (!want) {
          const notPushed = local.filter(k => remote.indexOf(k) < 0)
          if (notPushed.length) extra = '\n\n📤 *Ada di bot, belum di repo* (' + notPushed.length + '):\n' + notPushed.slice(0, 40).map(v => '  • ' + v.replace(/\.js$/, '')).join('\n') + (notPushed.length > 40 ? '\n  …' : '')
        }
        return m.reply('🐙 *Plugin di repo* (' + remote.length + ')\n✅ ada di bot · ⚠️ belum di bot\n\n' + body.join('\n\n') + extra)
      }
    }
  } catch (e) {
    throw explain(e, token)
  }
}

handler.help = ['gh', 'setghtoken <token>', 'ghinfo', 'ghls [path]', 'ghget <path>', 'ghput <path>', 'ghdel <path>', 'addfolder <path>', 'spgh <folder>|<nama>', 'delgh <folder>|<nama>', 'listgh [folder]']
handler.tags = ['owner']
handler.command = /^(gh|setghtoken|ghinfo|ghls|ghget|ghput|ghdel|addfolder|spgh|delgh|listgh)$/i
handler.rowner = true

export default handler
