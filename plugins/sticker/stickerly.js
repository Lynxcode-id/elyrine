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

const SEARCH_URL = 'https://api.sticker.ly/v4/stickerPack/smartSearch'
const UA = 'androidapp.stickerly/3.31.0 (M2006C3LG; U; Android 29; in-ID; id;)'
const SESSION_TTL = 5 * 60 * 1000
const MAX_STICKERS = 30
const MAX_RESULTS = 40
const packName = () => global.stickpack || 'ERINE-AI'
const packAuthor = () => global.stickauth || global.author || 'Lynxcode'

if (!global.stickerlySessions) global.stickerlySessions = new Map()
const keyOf = m => `${m.chat}|${m.sender}`

const isWebp = b => Buffer.isBuffer(b) && b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'

let sealLogged = false

async function viaStarseal(buffer) {
  const { create } = await import('@itsliaaa/starseal')
  const out = await create(buffer, {
    packName: packName(),
    publisherName: packAuthor(),
    emojis: ['✨']
  }).toBuffer()
  if (!isWebp(out)) throw new Error('starseal: hasil bukan webp')
  return out
}

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

async function viaExif(buffer) {
  const webp = (await import('node-webpmux')).default
  let src = buffer
  if (!isWebp(src)) {
    const sharp = (await import('sharp')).default
    src = await sharp(src, { animated: true })
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 90 })
      .toBuffer()
  }
  const img = new webp.Image()
  await img.load(src)
  img.exif = exifBuffer()
  return img.save(null)
}

async function makeSticker(buffer, animated) {
  if (!animated) {
    try {
      return await viaStarseal(buffer)
    } catch (e) {
      if (!sealLogged) {
        sealLogged = true
        console.error('[STICKERLY] starseal gagal, pindah ke metode cadangan:', e.message)
      }
    }
  }
  return viaExif(buffer)
}

async function searchPacks(keyword) {
  const { data } = await axios.post(
    SEARCH_URL,
    {
      keyword,
      enabledKeywordSearch: true,
      filter: {
        extendSearchResult: false,
        sortBy: 'RECOMMENDED',
        languages: ['ALL'],
        minStickerCount: 5,
        searchBy: 'ALL',
        stickerType: 'ALL'
      }
    },
    { headers: { 'User-Agent': UA, 'Content-Type': 'application/json' }, timeout: 20000, validateStatus: () => true }
  )
  const packs = data?.result?.stickerPacks || data?.stickerPacks || data?.data || []
  return (Array.isArray(packs) ? packs : []).map(v => ({
    id: v.packId,
    name: v.name,
    author: v.authorName || 'Unknown',
    count: v.resourceFiles?.length || 0,
    animated: !!v.isAnimated,
    prefix: v.resourceUrlPrefix,
    files: v.resourceFiles || [],
    url: v.shareUrl || `https://sticker.ly/s/${v.packId}`
  }))
}

async function sendStickerPack(conn, m, pick) {
  const items = pick.files.slice(0, MAX_STICKERS).map(f => ({ image: pick.prefix + f, animated: pick.animated }))
  const list = []
  let firstErr = ''
  for (const s of items) {
    try {
      const img = await axios.get(s.image, { responseType: 'arraybuffer', timeout: 20000, headers: { 'User-Agent': UA } })
      const sticker = await makeSticker(Buffer.from(img.data), s.animated)
      list.push({ data: sticker })
    } catch (e) {
      if (!firstErr) firstErr = e.message
      console.error('[STICKERLY] gagal satu stiker:', e.message)
    }
  }
  if (!list.length) throw `Semua stiker dalam pack gagal diproses.${firstErr ? `\n> ${firstErr}` : ''}`

  await conn.sendMessage(m.chat, {
    cover: { url: items[0].image },
    stickers: list,
    name: `✨ ${pick.name}`,
    publisher: packName(),
    description: packAuthor()
  }, { quoted: m })
  return list.length
}

const handler = async (m, { args, usedPrefix, command }) => {
  const q = (args || []).join(' ').trim()
  if (!q) throw `Masukkan kata kunci.\nContoh: *${usedPrefix + command} patrick*`

  await m.wait()
  let packs
  try {
    packs = await searchPacks(q)
  } catch (e) {
    console.error('[STICKERLY] search:', e.message)
    throw `Gagal mencari sticker pack: ${e.message}`
  }
  const items = packs.filter(x => x.prefix && x.files.length).slice(0, MAX_RESULTS)
  if (!items.length) throw `Sticker untuk *${q}* tidak ditemukan.`

  global.stickerlySessions.set(keyOf(m), { items, query: q, at: Date.now() })
  return m.reply([
    `*STICKER.LY · ${q}*`,
    '',
    ...items.map((x, i) => `${i + 1}. ${x.name || 'Tanpa nama'} · ${x.count} stiker · ${x.author}`),
    '',
    `Balas dengan *angka* (1-${items.length}) untuk ambil pack-nya.`
  ].join('\n'))
}

handler.before = async function (m) {
  const s = global.stickerlySessions?.get(keyOf(m))
  if (!s) return false
  if (Date.now() - s.at > SESSION_TTL) { global.stickerlySessions.delete(keyOf(m)); return false }
  if (!/^\d{1,2}$/.test((m.text || '').trim())) return false

  const n = parseInt(m.text.trim(), 10)
  if (n < 1 || n > s.items.length) return false

  global.stickerlySessions.delete(keyOf(m))
  const pick = s.items[n - 1]
  await m.wait()
  try {
    await sendStickerPack(this, m, pick)
  } catch (e) {
    console.error('[STICKERLY]', e?.stack || e)
    await m.reply(typeof e === 'string' ? e : `Gagal ambil pack: ${e.message}`)
  }
  return true
}

handler.help = ['stickerly <kata kunci>']
handler.tags = ['sticker']
handler.command = /^(stickerly|stikerly)$/i
handler.limit = true
handler.register = true

export default handler
