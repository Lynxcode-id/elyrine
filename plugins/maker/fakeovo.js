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

const DEFAULT_BASE_URL = 'https://api.yonz.cloud'
const MAX_IMAGE_SIZE = 30 * 1024 * 1024

function getYonzConfig() {
  const baseURL = String(global.APIs?.yonz || DEFAULT_BASE_URL).replace(/\/+$/, '')
  const apikey = global.APIKeys?.[baseURL]
  if (!apikey) throw new Error(`API key Yonz tidak ditemukan. Tambahkan '${baseURL}' ke global.APIKeys di config.js.`)
  return { baseURL, apikey }
}

function detectImageMime(buffer, contentType = '') {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png'
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  if (buffer.toString('ascii', 0, 3) === 'GIF') return 'image/gif'
  if (buffer.toString('ascii', 0, 2) === 'BM') return 'image/bmp'
  const mime = String(contentType).split(';')[0].trim().toLowerCase()
  return mime.startsWith('image/') && mime !== 'image/svg+xml' ? mime : null
}

async function getImage(endpoint, params) {
  const { baseURL, apikey } = getYonzConfig()
  const url = new URL(endpoint, `${baseURL}/`)
  url.searchParams.set('apikey', apikey)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value))

  const response = await fetch(url, {
    signal: AbortSignal.timeout(90000),
    headers: { Accept: 'image/*, application/json;q=0.9, */*;q=0.8' }
  })

  const contentType = response.headers.get('content-type') || ''
  const length = Number(response.headers.get('content-length') || 0)
  if (length > MAX_IMAGE_SIZE) throw new Error('Ukuran hasil gambar melebihi batas 30 MB.')

  const buffer = Buffer.from(await response.arrayBuffer())
  const mimetype = detectImageMime(buffer, contentType)
  if (!response.ok || !mimetype) {
    const body = buffer.toString('utf8').trim()
    let message = body.slice(0, 350) || `HTTP ${response.status}`
    try {
      const json = JSON.parse(body)
      message = json.message || json.error || json.msg || message
    } catch {}
    throw new Error(`Yonz API: ${message}`)
  }

  if (!buffer.length || buffer.length > MAX_IMAGE_SIZE) throw new Error('Hasil gambar kosong atau melebihi batas 30 MB.')
  return { buffer, mimetype }
}

const handler = async (m, { conn, args }) => {
  const input = (args || []).join('').trim()
  const amouth = input.replace(/[.,\s]/g, '')
  if (!/^\d+$/.test(amouth)) throw 'Masukkan nominal untuk Fake OVO.\n\nContoh: *.fakeovo 150000*'

  await m.wait()
  const { buffer, mimetype } = await getImage('/canvas/fake-ovo', { amouth })
  await conn.sendMessage(m.chat, { image: buffer, mimetype }, { quoted: m })
}

handler.help = ['fakeovo <nominal>']
handler.tags = ['maker']
handler.command = /^(fakeovo|ovo)$/i
handler.limit = true
handler.register = true
handler.wait = true

export default handler
