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

import fetch from 'node-fetch'
import axios from 'axios'
import FormData from 'form-data'
import { fileTypeFromBuffer } from 'file-type'

const fakeUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const TIMEOUT = 60000
const key = name => global.APIKeys?.[name] || ''
const typeOf = async buffer => (await fileTypeFromBuffer(buffer)) || { ext: 'bin', mime: 'application/octet-stream' }
const post = (url, form) => axios.post(url, form, { headers: { ...form.getHeaders(), 'User-Agent': fakeUserAgent }, timeout: TIMEOUT, maxBodyLength: Infinity, maxContentLength: Infinity })

async function litterbox(buffer) {
  const { ext } = await typeOf(buffer)
  const form = new FormData()
  form.append('reqtype', 'fileupload')
  form.append('time', '1h')
  form.append('fileToUpload', buffer, `ERINE_${Date.now()}.${ext}`)

  const res = await post('https://litterbox.catbox.moe/resources/internals/api.php', form)
  if (typeof res.data !== 'string' || !res.data.startsWith('http')) throw new Error('Litterbox upload gagal')
  return res.data.trim()
}

async function catbox(buffer) {
  const userhash = key('https://catbox.moe')
  if (!userhash) throw new Error('Catbox: userhash belum diisi di config.js')
  const { ext } = await typeOf(buffer)
  const form = new FormData()
  form.append('reqtype', 'fileupload')
  form.append('userhash', userhash)
  form.append('fileToUpload', buffer, `file.${ext === 'jpeg' ? 'jpg' : ext}`)

  const res = await post('https://catbox.moe/user/api.php', form)
  if (typeof res.data !== 'string' || !res.data.includes('catbox.moe')) throw new Error('Catbox upload gagal')
  return res.data.trim()
}

async function termai(buffer) {
  const apikey = key('https://c.termai.cc')
  if (!apikey) throw new Error('Termai: key belum diisi di config.js')
  const { ext, mime } = await typeOf(buffer)
  const form = new FormData()
  form.append('file', buffer, { filename: `file.${ext}`, contentType: mime })

  const res = await post(`https://c.termai.cc/api/upload?key=${encodeURIComponent(apikey)}`, form)
  if (!res.data?.path) throw new Error('Termai upload gagal')
  return res.data.path
}

async function uguu(buffer) {
  const { ext } = await typeOf(buffer)
  const form = new FormData()
  form.append('files[]', buffer, `file.${ext}`)

  const res = await post('https://uguu.se/upload', form)
  const url = res.data?.files?.[0]?.url
  if (!url) throw new Error('Uguu upload gagal')
  return url
}

async function nexray(buffer) {
  const { ext, mime } = await typeOf(buffer)
  const form = new FormData()
  form.append('file', buffer, { filename: `file.${ext}`, contentType: mime })

  const res = await post('https://api.nexray.web.id/upload?ttl=86400', form)
  const url = res.data?.result?.url
  if (!url) throw new Error('NexRay upload gagal')
  return url
}

async function tmpfiles(buffer) {
  const { ext } = (await fileTypeFromBuffer(buffer)) || {}
  const form = new FormData()
  form.append('file', buffer, `upload-${Date.now()}.${ext || 'bin'}`)

  const res = await fetch('https://tmpfiles.org/api/v1/upload', {
    method: 'POST',
    body: form,
    headers: { ...form.getHeaders(), 'User-Agent': fakeUserAgent }
  })
  const json = await res.json()
  const match = /https?:\/\/tmpfiles\.org\/(.*)/.exec(json?.data?.url)
  if (!match) throw new Error('Tmpfiles upload gagal')
  return `https://tmpfiles.org/dl/${match[1]}`
}

async function runChain(uploaders, buffer, label) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('Upload: input harus Buffer yang tidak kosong')
  let lastError = ''
  for (const upload of uploaders) {
    try {
      const url = await upload(buffer)
      if (url && typeof url === 'string' && url.startsWith('http')) return url
    } catch (err) {
      lastError = err.response ? JSON.stringify(err.response.data)?.slice(0, 200) : err.message
      console.log(`[ ⚠️ ${label} FALLBACK ] ${upload.name} gagal (${lastError}). Pindah ke backup...`)
    }
  }
  throw new Error(`Semua server ${label.toLowerCase()} uploader mati. Error terakhir: ${lastError}`)
}

async function uploadImage(buffer) {
  return runChain([litterbox, catbox, termai, uguu, nexray], buffer, 'IMAGE')
}

async function uploadFile(buffer) {
  return runChain([tmpfiles, uguu, termai, catbox, nexray], buffer, 'FILE')
}

const uploadPomf = uploadFile

export default uploadImage
export { uploadImage, uploadFile, uploadPomf }
