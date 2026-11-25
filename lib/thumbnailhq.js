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

import fs from 'fs'
import { fileTypeFromBuffer } from 'file-type'
import { baileys } from './function.js'

const MAX_INLINE = 60 * 1024
const b64 = v => (v == null ? v : Buffer.from(v).toString('base64'))

async function toBuffer(input) {
  if (Buffer.isBuffer(input)) return input
  if (input instanceof Uint8Array) return Buffer.from(input)
  if (typeof input === 'string' && /^https?:\/\//i.test(input)) {
    const res = await fetch(input)
    if (!res.ok) throw new Error(`gagal unduh gambar (HTTP ${res.status})`)
    return Buffer.from(await res.arrayBuffer())
  }
  throw new Error('input gambar harus Buffer atau URL http(s).')
}

async function sizeAndJpeg(buf, jw, jq) {
  const J = await import('jimp')
  const Jimp = J.Jimp || J.default?.Jimp || J.default
  const img = await Jimp.read(buf)
  const { width, height } = img.bitmap
  const small = img.clone().resize({ w: Math.min(jw, width) })
  let q = jq
  let jpeg = await small.getBuffer('image/jpeg', { quality: q })
  while (jpeg.length > MAX_INLINE && q > 50) {
    q -= 10
    jpeg = await small.getBuffer('image/jpeg', { quality: q })
  }
  return { width, height, jpeg }
}

export async function uploadThumbnailHQ(conn, image, { jpegWidth = 640, jpegQuality = 85 } = {}) {
  const B = baileys.encryptedStream ? baileys : (baileys.default || baileys)
  if (typeof B.encryptedStream !== 'function') throw new Error('engine tidak punya encryptedStream.')
  if (typeof conn.waUploadToServer !== 'function') throw new Error('conn.waUploadToServer tidak tersedia.')

  const buffer = await toBuffer(image)
  const mimetype = (await fileTypeFromBuffer(buffer))?.mime || 'image/jpeg'
  if (!/^image\//.test(mimetype)) throw new Error(`file bukan gambar (${mimetype}).`)

  const info = await sizeAndJpeg(buffer, jpegWidth, jpegQuality)
  const enc = await B.encryptedStream(buffer, 'thumbnail-link')

  let up
  try {
    up = await conn.waUploadToServer(enc.encFilePath || enc.encWriteStream, {
      fileEncSha256B64: Buffer.from(enc.fileEncSha256).toString('base64'),
      mediaType: 'thumbnail-link',
      timeoutMs: 60_000
    })
  } finally {
    for (const f of [enc.encFilePath, enc.originalFilePath]) if (f) fs.promises.unlink(f).catch(() => {})
  }
  if (!up?.directPath) throw new Error('server WhatsApp tidak mengembalikan directPath.')

  return {
    thumbnailDirectPath: up.directPath,
    thumbnailSha256: b64(enc.fileSha256),
    thumbnailEncSha256: b64(enc.fileEncSha256),
    mediaKey: b64(enc.mediaKey),
    mediaKeyTimestamp: Math.floor(Date.now() / 1000),
    thumbnailWidth: info.width,
    thumbnailHeight: info.height,
    mimetype,
    ...(up.url && { url: up.url }),
    jpegThumbnail: b64(info.jpeg)
  }
}
