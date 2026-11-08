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

/**
 * ✧ Name     : fake call ios
 * ✧ Creator  : Rin imup/princes
 * ✧ Category : Canvas
 * ✧ Sumber   : https://whatsapp.com/channel/0029Vb6EHtR5Ui2gHMW9zX2x
 * (credit asli)
 */
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
import { existsSync, readFileSync, mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import axios from 'axios'

const STORE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'store')
const ASSET_DIR = path.join(STORE_DIR, 'fakecall')
const BRAT_DIR = path.join(STORE_DIR, 'brat')
const BG_URL = 'https://raw.githubusercontent.com/ryyntwx/allimagerin/refs/heads/main/353dc125-a39c-4d27-9ba5-9ec7dfa6624a.png'
const BG_PATH = path.join(ASSET_DIR, 'template_call_ios.png')
const EMOJI_JSON_URL = 'https://media.githubusercontent.com/media/Ditzzx-vibecoder/entahlah/main/emoji-apple.json'
const EMOJI_JSON_PATH = path.join(BRAT_DIR, 'emoji-apple.json')
const FONTS = [
  { url: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.woff2', file: 'Roboto-Bold.woff2' },
  { url: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2', file: 'Roboto-Regular.woff2' }
]
const UA = { 'User-Agent': 'Mozilla/5.0' }

const NAMA_Y = 75
const NAMA_SIZE = 42
const DURASI_Y = 133
const DURASI_SIZE = 35
const NAMA_COLOR = '#FFFFFF'
const DURASI_COLOR = '#C5C5C5'
const MAX_CHARS = 60

let emojiMap = null
let assetsPromise = null
const emojiCache = new Map()

async function download(url, dest) {
  const res = await axios.get(url, { responseType: 'arraybuffer', headers: UA, timeout: 30000 })
  await writeFile(dest, Buffer.from(res.data))
}

function prepareAssets() {
  if (assetsPromise) return assetsPromise
  assetsPromise = (async () => {
    mkdirSync(ASSET_DIR, { recursive: true })
    mkdirSync(BRAT_DIR, { recursive: true })
    if (!existsSync(BG_PATH)) await download(BG_URL, BG_PATH)
    if (!existsSync(EMOJI_JSON_PATH)) await download(EMOJI_JSON_URL, EMOJI_JSON_PATH)
    emojiMap = JSON.parse(readFileSync(EMOJI_JSON_PATH, 'utf-8'))
    for (const f of FONTS) {
      try {
        const p = path.join(ASSET_DIR, f.file)
        if (!existsSync(p)) await download(f.url, p)
        GlobalFonts.registerFromPath(p, 'RobotoWA')
      } catch (e) {
        console.error('[wacall] font ' + f.file + ' gagal dimuat:', e.message)
      }
    }
  })().catch(err => {
    assetsPromise = null
    throw err
  })
  return assetsPromise
}

const EMOJI_DETECTOR = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u
const emojiToUnicode = emoji => [...emoji].map(c => c.codePointAt(0).toString(16).padStart(4, '0')).join('-')

async function getEmojiImage(emoji) {
  if (emojiCache.has(emoji)) return emojiCache.get(emoji)
  const base = emojiToUnicode(emoji)
  const stripped = base.replace(/-fe0f/gi, '')
  const variants = [base, stripped, stripped + '-fe0f', base.toUpperCase(), stripped.toUpperCase(), stripped.toUpperCase() + '-FE0F']
  const key = variants.find(v => emojiMap[v])
  if (!key) return null
  const img = await loadImage(Buffer.from(emojiMap[key], 'base64'))
  emojiCache.set(emoji, img)
  return img
}

function parseTextAndEmojis(str) {
  const tokens = []
  const chars = [...str]
  let current = ''
  for (let i = 0; i < chars.length; i++) {
    if (EMOJI_DETECTOR.test(chars[i])) {
      if (current) {
        tokens.push({ type: 'text', value: current })
        current = ''
      }
      let val = chars[i]
      if (chars[i + 1] === '\uFE0F') {
        val += chars[i + 1]
        i++
      }
      tokens.push({ type: 'emoji', value: val })
    } else {
      current += chars[i]
    }
  }
  if (current) tokens.push({ type: 'text', value: current })
  return tokens
}

function measureTokens(ctx, tokens, fontSize) {
  let w = 0
  for (const t of tokens) w += t.type === 'emoji' ? fontSize * 1.05 : ctx.measureText(t.value).width
  return w
}

async function drawCentered(ctx, str, y, fontSize, weight, color, maxWidth) {
  const tokens = parseTextAndEmojis(str)
  let size = fontSize
  ctx.font = weight + ' ' + size + 'px RobotoWA, sans-serif'
  while (size > 16 && measureTokens(ctx, tokens, size) > maxWidth) {
    size -= 2
    ctx.font = weight + ' ' + size + 'px RobotoWA, sans-serif'
  }
  ctx.fillStyle = color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  const emojiSize = size * 1.05
  let x = ctx.canvas.width / 2 - measureTokens(ctx, tokens, size) / 2
  for (const t of tokens) {
    if (t.type === 'emoji') {
      const img = await getEmojiImage(t.value)
      if (img) ctx.drawImage(img, x, y + (size - emojiSize) / 2, emojiSize, emojiSize)
      else ctx.fillText(t.value, x, y)
      x += emojiSize
    } else {
      ctx.fillText(t.value, x, y)
      x += ctx.measureText(t.value).width
    }
  }
}

export default async function wacall(ppBuffer, nama, durasi) {
  try {
    const txtNama = String(nama == null ? '' : nama).trim().slice(0, MAX_CHARS)
    const txtDurasi = String(durasi == null ? '' : durasi).trim().slice(0, MAX_CHARS)
    if (!Buffer.isBuffer(ppBuffer) || !ppBuffer.length) return { status: false, message: 'Foto tidak valid' }
    if (!txtNama || !txtDurasi) return { status: false, message: 'Nama dan durasi wajib diisi' }

    await prepareAssets()

    const bgImg = await loadImage(BG_PATH)
    const avImg = await loadImage(ppBuffer)

    const canvas = createCanvas(bgImg.width, bgImg.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)

    const ppX = canvas.width / 2
    const ppY = canvas.height * 0.5
    const ppR = canvas.width * 0.22
    const side = Math.min(avImg.width, avImg.height)
    const sx = (avImg.width - side) / 2
    const sy = (avImg.height - side) / 2
    ctx.save()
    ctx.beginPath()
    ctx.arc(ppX, ppY, ppR, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(avImg, sx, sy, side, side, ppX - ppR, ppY - ppR, ppR * 2, ppR * 2)
    ctx.restore()

    const maxWidth = canvas.width - 80
    await drawCentered(ctx, txtNama, NAMA_Y, NAMA_SIZE, 700, NAMA_COLOR, maxWidth)
    await drawCentered(ctx, txtDurasi, DURASI_Y, DURASI_SIZE, 400, DURASI_COLOR, maxWidth)

    return { status: true, buffer: await canvas.encode('png') }
  } catch (e) {
    return { status: false, message: (e && e.message) || 'Proses gagal' }
  }
}
