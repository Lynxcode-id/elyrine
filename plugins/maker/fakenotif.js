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
import uploadImage from '../../lib/uploader.js'

const DEFAULT_PP = 'https://cdn.yonz.cloud/api/yz/mw435fw5.jpg'
const DEFAULT_BG = 'https://cdn.yonz.cloud/api/yz/mw435hrp.jpg'

const TIMEZONE = 'Asia/Makassar'
const MAX_SIZE = 15 * 1024 * 1024

function getTime() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(new Date())
}

function getDate() {
  const date = new Date()
  const weekday = new Intl.DateTimeFormat('id-ID', {
    timeZone: TIMEZONE,
    weekday: 'short'
  }).format(date).replace(/\./g, '').toUpperCase()

  const day = new Intl.DateTimeFormat('id-ID', {
    timeZone: TIMEZONE,
    day: 'numeric'
  }).format(date)

  const month = new Intl.DateTimeFormat('id-ID', {
    timeZone: TIMEZONE,
    month: 'short'
  }).format(date).replace(/\./g, '').toUpperCase()

  return `${weekday}, ${day} ${month}`
}

function getApiConfig() {
  const baseURL = String(global.APIs?.yonz || '')
    .replace(/\/+$/, '')

  if (!baseURL) {
    throw new Error('Yonz API belum dikonfigurasi di global.APIs.')
  }

  const apikey = global.APIKeys?.[baseURL]

  if (!apikey) {
    throw new Error('Yonz API key tidak ditemukan di global.APIKeys.')
  }

  return { baseURL, apikey }
}

function getUploadUrl(result) {
  if (typeof result === 'string') return result

  if (result && typeof result === 'object') {
    return (
      result.url ||
      result.result?.url ||
      result.data?.url ||
      result.data ||
      result.result ||
      ''
    )
  }

  return ''
}

async function getImage(q) {
  const mime = q.mimetype || q.msg?.mimetype || ''

  if (!mime.startsWith('image/')) return null
  if (typeof q.download !== 'function') return null

  const buffer = await q.download()

  if (!Buffer.isBuffer(buffer) || !buffer.length) {
    throw new Error('Foto gagal diunduh.')
  }

  if (buffer.length > MAX_SIZE) {
    throw new Error('Ukuran foto maksimal 15 MB.')
  }

  const uploaded = await uploadImage(buffer)
  const url = getUploadUrl(uploaded)

  if (!/^https?:\/\//i.test(url)) {
    throw new Error('Uploader tidak menghasilkan URL foto valid.')
  }

  return url
}

const handler = async (m, { conn, args }) => {
  const input = args.join(' ').trim()
  const fields = input.split('|').map(x => x.trim())

  const username = fields[0] || 'Zhi Chunhe'
  const chat = fields[1] || 'Pesan baru'
  const jam = fields[2] || getTime()
  const tanggal = fields[3] || getDate()
  const statusJam = fields[4] || getTime()
  const baterai = fields[5] || '57%'
  const waktu = fields[6] || 'Sekarang'

  const verifiedInput = (fields[7] || 'false').toLowerCase()
  const app = fields[8] || 'whatsapp'
  const style = fields[9] || 'android'

  if (!['true', 'false'].includes(verifiedInput)) {
    throw 'Verified hanya menerima true atau false.'
  }

  const verified = verifiedInput === 'true'

  if (!['android', 'ios'].includes(style.toLowerCase())) {
    throw 'Style hanya mendukung android atau ios.'
  }

  if (!username || !chat) {
    throw 'Username dan isi notifikasi tidak boleh kosong.'
  }

  await m.wait()

  const { baseURL, apikey } = getApiConfig()

  const q = m.quoted || m
  const uploadedImage = await getImage(q)

  const bg = uploadedImage || DEFAULT_BG

  const pp = fields[10] && /^https?:\/\//i.test(fields[10])
    ? fields[10]
    : DEFAULT_PP

  const endpoint = new URL(`${baseURL}/canvas/fakenotif`)

  const params = {
    apikey,
    style: style.toLowerCase(),
    username,
    chat,
    app,
    pp,
    bg,
    jam,
    tanggal,
    status_jam: statusJam,
    baterai,
    waktu,
    verified: String(verified)
  }

  for (const [key, value] of Object.entries(params)) {
    endpoint.searchParams.set(key, value)
  }

  const response = await axios.get(endpoint.toString(), {
    responseType: 'arraybuffer',
    timeout: 120000,
    maxContentLength: 30 * 1024 * 1024,
    maxBodyLength: 30 * 1024 * 1024,
    headers: {
      Accept: 'image/*'
    }
  })

  const contentType = String(
    response.headers?.['content-type'] || ''
  ).split(';')[0].toLowerCase()

  if (!contentType.startsWith('image/')) {
    const body = Buffer.from(response.data).toString('utf8')

    let message = 'API tidak menghasilkan gambar.'

    try {
      const json = JSON.parse(body)
      message = json.message || json.error || message
    } catch {}

    throw new Error(message)
  }

  await conn.sendMessage(m.chat, {
    image: Buffer.from(response.data),
    mimetype: contentType
  }, {
    quoted: m
  })
}

handler.help = [
  'fakenotif <username|chat|jam|tanggal|status_jam|baterai|waktu|verified|app|style>'
]
handler.tags = ['maker']
handler.command = /^(fakenotif)$/i
handler.limit = true
handler.register = true
handler.wait = true

export default handler
