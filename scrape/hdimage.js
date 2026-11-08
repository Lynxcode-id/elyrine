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
import FormData from 'form-data'
import fs from 'fs'
import { Readable } from 'stream'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const BASE = 'https://api.ezenhancer.ai/api/web/v1/image-enhance'
const INTERVAL = 3000
const MAX_TRY = 40

const headers = {
  'User-Agent': UA,
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
  Referer: 'https://ezenhancer.ai/'
}

export default async function hdimage(input) {
  try {
    const form = new FormData()
    const opt = { filename: 'image.jpg', contentType: 'image/jpeg' }

    if (typeof input === 'string') form.append('original_image_file', fs.createReadStream(input))
    else if (Buffer.isBuffer(input) || input instanceof Readable) form.append('original_image_file', input, opt)
    else return { status: false, message: 'Format input tidak didukung' }

    const create = await axios.post(`${BASE}/create-job`, form, {
      headers: { ...form.getHeaders(), ...headers, Origin: 'https://ezenhancer.ai' },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 120000
    })

    const jobId = create.data?.result?.job_id
    if (!jobId) return { status: false, message: 'Gagal membuat job_id', detail: create.data }

    for (let i = 0; i < MAX_TRY; i++) {
      await new Promise(r => setTimeout(r, INTERVAL))
      const res = await axios.get(`${BASE}/get-job/${jobId}`, { headers, timeout: 60000 })
      const st = res.data?.result?.status
      if (st !== 0) return res.data
    }
    return { status: false, message: 'Timeout, proses terlalu lama' }
  } catch (e) {
    return { status: false, message: e?.response?.data || e?.message || 'Proses gagal' }
  }
}
