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

import axios from 'axios'
import fs from 'fs'
import sharp from 'sharp'
import { successText } from '../../lib/respon.js'
import { getCustomThumbSmall } from '../../lib/customthumb.js'

const API = 'https://registry.npmjs.org/-/v1/search'
const TIMEOUT_MS = 30000
const MAX_RESULT = 8
const MAX_QUERY = 100
const IMG_TIMEOUT_MS = 8000
const IMG_MAX_BYTES = 5 * 1024 * 1024
const FALLBACK_THUMB = './src/erine.webp'

const shortDesc = (d = '') => (d.length > 50 ? d.slice(0, 50) + '...' : d)

const buildText = (query, data) => {
  let text = `📦 *ɴᴘᴍ sᴇᴀʀᴄʜ*\n\n`
  text += `> Query: \`${query}\`\n`
  text += `> Found: ${data.total} packages\n\n`

  data.objects.slice(0, MAX_RESULT).forEach((item, i) => {
    const pkg = item.package
    const score = Math.round((item.score?.final || 0) * 100)

    text += `${i + 1}. *${pkg.name}*\n`
    text += `> 📌 v${pkg.version}\n`
    if (pkg.description) text += `> 📝 ${shortDesc(pkg.description)}\n`
    text += `> 🔗 ${pkg.links?.npm || '-'}\n`
    if (pkg.author?.name) text += `> 👤 ${pkg.author.name}\n`
    text += `> ⭐ Score: ${score}%\n\n`
  })

  return text.trimEnd()
}

const parseGithub = (u = '') => {
  const x = String(u).match(/github\.com[/:]([^/\s]+)\/([^/\s#?]+?)(?:\.git)?(?:[/#?]|$)/i)
  return x ? { owner: x[1], repo: x[2] } : null
}

const thumbCandidates = (pkg) => {
  const gh = parseGithub(pkg.links?.repository) || parseGithub(pkg.links?.homepage)
  if (!gh) return []
  return [
    `https://opengraph.githubassets.com/1/${gh.owner}/${gh.repo}`,
    `https://github.com/${gh.owner}.png?size=300`
  ]
}

const THUMB_W = 640
const THUMB_H = 360

async function toWide(buf) {
  const { width: w, height: h } = await sharp(buf).metadata()
  const ratio = w / h
  if (ratio >= 1.6 && ratio <= 2.1) {
    return sharp(buf).resize(THUMB_W, THUMB_H, { fit: 'cover', position: 'center' }).jpeg({ quality: 85 }).toBuffer()
  }
  const bg = await sharp(buf).resize(THUMB_W, THUMB_H, { fit: 'cover' }).blur(24).modulate({ brightness: 0.7 }).toBuffer()
  const fg = await sharp(buf).resize(THUMB_W, THUMB_H, { fit: 'inside' }).toBuffer()
  return sharp(bg).composite([{ input: fg, gravity: 'center' }]).jpeg({ quality: 85 }).toBuffer()
}

const fetchImage = async (url) => {
  const { data } = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: IMG_TIMEOUT_MS,
    maxContentLength: IMG_MAX_BYTES
  })
  return toWide(Buffer.from(data))
}

async function buildPreview(objects) {
  const rows = objects.map(({ package: pkg }) => ({
    pkg,
    jobs: thumbCandidates(pkg).map(u => fetchImage(u).catch(() => null))
  }))
  for (const { pkg, jobs } of rows) {
    for (const job of jobs) {
      const thumb = await job
      if (thumb) return { pkg, thumb }
    }
  }

  try {
    const raw = (await getCustomThumbSmall()) || fs.readFileSync(FALLBACK_THUMB)
    return { pkg: objects[0].package, thumb: await toWide(raw) }
  } catch (e) {
    console.error('[NPM] thumbnail fallback gagal:', e.message)
    return null
  }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const query = (text || '').trim()
  if (!query) {
    throw `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n> \`${usedPrefix || '.'}${command} <query>\`\n\n> Contoh:\n> \`${usedPrefix || '.'}${command} axios\``
  }
  if (query.length > MAX_QUERY) throw `Query maksimal ${MAX_QUERY} karakter.`

  await m.react('🕕').catch(() => { })

  try {
    const { data } = await axios.get(API, {
      params: { text: query, size: MAX_RESULT },
      timeout: TIMEOUT_MS
    })

    if (!data?.objects?.length) {
      await m.react('❌').catch(() => { })
      return m.gagal(`Package "${query}" tidak ditemukan.`, 'NPM')
    }

    await m.react('✅').catch(() => { })

    const text = buildText(query, data)

    try {
      const preview = await buildPreview(data.objects)
      if (preview) {
        const { pkg, thumb } = preview
        const url = pkg.links?.npm || `https://www.npmjs.com/package/${pkg.name}`
        const linkPreview = {
          'matched-text': url,
          matchedText: url,
          canonicalUrl: url,
          title: `📦 ${pkg.name} v${pkg.version}`,
          description: shortDesc(pkg.description || `Hasil pencarian "${query}"`),
          previewType: 0,
          jpegThumbnail: thumb
        }
        const body = successText(text, Date.now() - (m.startedAt || Date.now()))
        return await m.reply(`${url}${'\u2063'.repeat(500)}\n\n${body}`, undefined, { linkPreview })
      }
    } catch (e) {
      console.error('[NPM] link preview gagal, kirim teks biasa:', e.message)
    }
    return m.sukses(text)
  } catch (e) {
    console.error('[NPM]', e)
    await m.react('❌').catch(() => { })
    return m.gagal(`Gagal mencari package: ${e.response?.data?.error || e.message}`, 'NPM')
  }
}

handler.command = ['npm', 'npmsearch', 'npmjs', 'npmfind']
handler.help = ['npm <query>']
handler.tags = ['search']
handler.wait = true
handler.limit = true
handler.register = true

export default handler
