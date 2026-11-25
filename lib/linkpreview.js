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

import { prepareWAMessageMedia } from 'elyrine-baileys'

const ZWSP = '\u2063'

function withHiddenUrl(url, text) {
  return `${url}${ZWSP.repeat(500)}\n\n${text || ''}`
}

async function toBuffer(image) {
  if (Buffer.isBuffer(image)) return image
  if (typeof image === 'string') {
    const res = await fetch(image)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    return Buffer.from(await res.arrayBuffer())
  }
  throw new Error('image harus berupa Buffer atau URL string')
}

async function resizeCover(raw, w, h) {
  try {
    const sharp = (await import('sharp')).default
    return await sharp(raw).resize(w, h, { fit: 'cover', position: 'center' }).jpeg({ quality: 85 }).toBuffer()
  } catch (e) {
    console.error('[linkpreview] sharp gagal, pakai gambar asli:', e && e.message ? e.message : e)
    return raw
  }
}

function baseLinkPreview(url, title, description) {
  return {
    'canonical-url': url,
    canonicalUrl: url,
    'matched-text': url,
    matchedText: url,
    title,
    description,
    previewType: 0
  }
}

export async function sendWideLinkPreview(conn, jid, { url, title, description, image, text, quoted, mentions, width = 1280 }) {
  const height = Math.round(width * 9 / 16)
  const raw = await toBuffer(image)
  const thumb = await resizeCover(raw, width, height)

  try {
    const { imageMessage } = await prepareWAMessageMedia({ image: thumb }, { upload: conn.waUploadToServer, mediaTypeOverride: 'thumbnail-link' })
    imageMessage.width = width
    imageMessage.height = height
    return await conn.sendMessage(jid, {
      text: withHiddenUrl(url, text),
      linkPreview: { ...baseLinkPreview(url, title, description), jpegThumbnail: imageMessage.jpegThumbnail, highQualityThumbnail: imageMessage },
      mentions
    }, { quoted })
  } catch (err) {
    console.error('[linkpreview] wide gagal, fallback kecil:', err && err.message ? err.message : err)
    return sendSquareLinkPreview(conn, jid, { url, title, description, image: thumb, text, quoted, mentions, size: width })
  }
}

export async function sendSquareLinkPreview(conn, jid, { url, title, description, image, text, quoted, mentions, size = 500 }) {
  const raw = await toBuffer(image)
  const thumb = await resizeCover(raw, size, size)
  return conn.sendMessage(jid, {
    text: withHiddenUrl(url, text),
    linkPreview: { ...baseLinkPreview(url, title, description), jpegThumbnail: thumb },
    mentions
  }, { quoted })
}

export async function buildSquareLinkPreview({ url, title, description, image, size = 500 }) {
  const raw = await toBuffer(image)
  const thumb = await resizeCover(raw, size, size)
  return { ...baseLinkPreview(url, title, description), jpegThumbnail: thumb }
}
