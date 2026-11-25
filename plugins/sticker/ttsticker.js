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

import axios from 'axios'

const PER_PACK = 20
const MAX_STICKERS = 100
const MIN_LAST = 3
const MAX_BYTES = 500 * 1024
const HARD_LIMIT = 1000 * 1000
const LADDER = [
  [80, 512, 1], [60, 512, 1], [40, 512, 1], [50, 384, 1], [35, 384, 1], [40, 256, 1], [25, 256, 1],
  [30, 256, 0.5], [25, 256, 0.33], [20, 192, 0.33], [15, 192, 0.2]
]
const DELAY = 2500
const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36'
const TIKTOK = /^https?:\/\/((www|vt|vm|m)\.)?tiktok\.com\/\S+/i

const packName = () => global.stickpack || 'ERINE-AI'
const packAuthor = () => global.stickauth || global.author || 'Lynxcode'
const sleep = ms => new Promise(r => setTimeout(r, ms))

function exifBuffer() {
  const payload = Buffer.from(JSON.stringify({
    'sticker-pack-id': `erine-ai-${Date.now()}`,
    'sticker-pack-name': packName(),
    'sticker-pack-publisher': packAuthor(),
    emojis: ['✨']
  }), 'utf8')
  const header = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ])
  const exif = Buffer.concat([header, payload])
  exif.writeUIntLE(payload.length, 14, 4)
  return exif
}

async function toSticker(buffer) {
  const sharp = (await import('sharp')).default
  const webp = (await import('node-webpmux')).default
  const frames = (await sharp(buffer, { animated: true }).metadata().catch(() => ({}))).pages || 1
  let best
  for (const [quality, size, keep] of LADDER) {
    const pages = keep === 1 || frames < 4 ? -1 : Math.max(2, Math.ceil(frames * keep))
    const out = await sharp(buffer, { animated: true, pages })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality, effort: 5 })
      .toBuffer()
    if (!best || out.length < best.length) best = out
    if (out.length <= MAX_BYTES) break
  }
  const img = new webp.Image()
  await img.load(best)
  img.exif = exifBuffer()
  const final = await img.save(null)
  if (final.length > HARD_LIMIT) throw new Error(`stiker terlalu besar (${Math.round(final.length / 1024)} KB)`)
  return final
}

async function toCover(buffer) {
  const sharp = (await import('sharp')).default
  return sharp(buffer, { animated: false })
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 80 })
    .toBuffer()
}

async function scan(url) {
  const base = global.APIs?.xrina || 'https://apiii-xrina.my.id'
  const res = await axios.get(`${base}/search/sticker-tiktok`, {
    params: { url, limit: MAX_STICKERS, pages: 100 },
    timeout: 180000,
    validateStatus: () => true
  })
  const body = res.data
  if (!body?.status) throw new Error(body?.message || `HTTP ${res.status}`)
  const seen = new Set()
  const list = []
  for (const it of body.data?.stickers || []) {
    const s = it.sticker || {}
    const link = s.animated_url || s.static_url || s.sticker_url
    const key = s.sticker_id || link
    if (!link || seen.has(key)) continue
    seen.add(key)
    list.push(link)
  }
  return { author: body.data?.video?.author || '', links: list.slice(0, MAX_STICKERS) }
}

async function build(links) {
  const out = new Array(links.length).fill(null)
  let failed = 0
  let cursor = 0
  const worker = async () => {
    while (cursor < links.length) {
      const i = cursor++
      try {
        const img = await axios.get(links[i], { responseType: 'arraybuffer', timeout: 30000, headers: { 'User-Agent': UA } })
        const raw = Buffer.from(img.data)
        out[i] = { data: await toSticker(raw), raw }
      } catch (e) {
        failed++
        console.error('[TTSTICKER] gagal satu stiker:', e.message)
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
  return { list: out.filter(Boolean), failed }
}

function chunk(list) {
  const packs = []
  for (let i = 0; i < list.length; i += PER_PACK) packs.push(list.slice(i, i + PER_PACK))
  if (packs.length > 1 && packs.at(-1).length < MIN_LAST) {
    const last = packs.at(-1)
    const prev = packs.at(-2)
    last.unshift(...prev.splice(prev.length - (MIN_LAST - last.length)))
  }
  return packs
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const url = (text || '').trim().split(/\s+/)[0]
  if (!TIKTOK.test(url || '')) throw `Kirim link video TikTok.\nContoh: *${usedPrefix + command} https://vt.tiktok.com/ZSpWKWRdo/*`

  await m.wait()

  let found
  try {
    found = await scan(url)
  } catch (e) {
    console.error('[TTSTICKER] scan:', e.message)
    throw `Gagal memindai stiker komentar: ${e.message}`
  }
  if (!found.links.length) throw 'Tidak ada stiker di komentar video ini.'

  const { list: stickers, failed } = await build(found.links)
  if (!stickers.length) throw 'Semua stiker gagal diproses.'

  const packs = chunk(stickers)
  await m.reply(`Ditemukan *${stickers.length}* stiker, dikirim jadi *${packs.length}* pack (maks ${PER_PACK} stiker per pack).${failed ? `\n${failed} stiker dilewati (gagal diproses / terlalu besar).` : ''}`)

  let sent = 0
  for (let i = 0; i < packs.length; i++) {
    const pack = packs[i]
    try {
      const cover = await toCover(pack[0].raw).catch(() => pack[0].data)
      await conn.sendMessage(m.chat, {
        cover,
        stickers: pack.map(s => ({ data: s.data })),
        name: `✨ TikTok ${found.author ? '@' + found.author : 'Sticker'}${packs.length > 1 ? ` · ${i + 1}/${packs.length}` : ''}`,
        publisher: packName(),
        description: packAuthor()
      }, { quoted: m })
      sent++
    } catch (e) {
      console.error(`[TTSTICKER] pack ${i + 1}:`, e?.stack || e)
      await m.reply(`Pack ${i + 1}/${packs.length} gagal dikirim: ${e.message}`)
    }
    if (i < packs.length - 1) await sleep(DELAY)
  }
  if (!sent) throw 'Semua pack gagal dikirim.'
}

handler.help = ['ttsticker <link tiktok>']
handler.tags = ['sticker']
handler.command = /^(ttsticker)$/i
handler.limit = true
handler.register = true

export default handler
