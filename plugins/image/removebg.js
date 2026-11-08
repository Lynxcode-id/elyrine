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
import { fileTypeFromBuffer } from 'file-type'

const API = 'https://lynxapis.my.id/api/image/remove-bg'
const MAX_SIZE = 25 * 1024 * 1024
const TIMEOUT = 120000

function findResultUrl(value, depth = 0) {
  if (depth > 5 || value == null) return null

  if (typeof value === 'string') {
    const text = value.trim()
    return /^https?:\/\//i.test(text) ? text : null
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findResultUrl(item, depth + 1)
      if (found) return found
    }
    return null
  }

  if (typeof value === 'object') {
    for (const key of [
      'url',
      'imageUrl',
      'image_url',
      'output',
      'result',
      'data',
      'image'
    ]) {
      const found = findResultUrl(value[key], depth + 1)
      if (found) return found
    }
  }

  return null
}

async function getImageBuffer(response) {
  let buffer = Buffer.from(response.data)

  const contentType = String(
    response.headers?.['content-type'] || ''
  ).split(';')[0].trim().toLowerCase()

  const detected = await fileTypeFromBuffer(buffer).catch(() => null)

  if (detected?.mime?.startsWith('image/')) {
    return { buffer, mimetype: detected.mime }
  }

  if (contentType.startsWith('image/')) {
    return { buffer, mimetype: contentType }
  }

  const body = buffer.toString('utf8').trim()

  let json
  try {
    json = JSON.parse(body)
  } catch {
    throw new Error(body.slice(0, 250) || 'API tidak mengembalikan gambar.')
  }

  const base64 = typeof json?.base64 === 'string'
    ? json.base64
    : typeof json?.data?.base64 === 'string'
      ? json.data.base64
      : null

  if (base64) {
    const clean = base64.replace(/^data:image\/[^;]+;base64,/i, '')
    buffer = Buffer.from(clean, 'base64')

    const imageType = await fileTypeFromBuffer(buffer)

    if (!imageType?.mime?.startsWith('image/')) {
      throw new Error('Hasil base64 bukan gambar valid.')
    }

    return {
      buffer,
      mimetype: imageType.mime
    }
  }

  const resultUrl = findResultUrl(json)

  if (!resultUrl) {
    throw new Error(
      json?.message ||
      json?.error ||
      'URL hasil remove background tidak ditemukan.'
    )
  }

  const result = await axios.get(resultUrl, {
    responseType: 'arraybuffer',
    timeout: TIMEOUT,
    maxContentLength: MAX_SIZE,
    maxBodyLength: MAX_SIZE
  })

  buffer = Buffer.from(result.data)

  const resultType = await fileTypeFromBuffer(buffer)

  if (!resultType?.mime?.startsWith('image/')) {
    throw new Error('File hasil API bukan gambar valid.')
  }

  return {
    buffer,
    mimetype: resultType.mime
  }
}

const handler = async (m, { conn }) => {
  const q = m.quoted || m

  const mime =
    q.mimetype ||
    q.msg?.mimetype ||
    q.message?.imageMessage?.mimetype ||
    ''

  if (!/^image\//i.test(mime) || typeof q.download !== 'function') {
    throw 'Kirim foto dengan perintah *.removebg* atau reply foto tersebut dengan *.removebg*.'
  }

  await m.wait()

  const media = await q.download()

  if (!Buffer.isBuffer(media) || !media.length) {
    throw new Error('Foto gagal diunduh.')
  }

  if (media.length > MAX_SIZE) {
    throw new Error('Ukuran foto maksimal 25 MB.')
  }

  const imageUrl = await uploadImage(media)

  if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
    throw new Error('Uploader tidak menghasilkan URL foto yang valid.')
  }

  const response = await axios.get(API, {
    params: {
      url: imageUrl
    },
    responseType: 'arraybuffer',
    timeout: TIMEOUT,
    maxContentLength: MAX_SIZE,
    maxBodyLength: MAX_SIZE,
    headers: {
      Accept: 'image/*, application/json'
    }
  })

  const result = await getImageBuffer(response)

  await conn.sendMessage(m.chat, {
    image: result.buffer,
    mimetype: result.mimetype
  }, {
    quoted: m
  })
}

handler.help = ['removebg (reply/kirim foto)']
handler.tags = ['image']
handler.command = /^(removebg)$/i
handler.limit = true
handler.register = true

export default handler
