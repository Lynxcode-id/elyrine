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

export async function requestTheresav(endpoint, params) {
  const baseURL = String(global.APIs?.theresav || '')
    .replace(/\/+$/, '')

  if (!baseURL) {
    throw new Error('URL Theresav tidak ditemukan di global.APIs.')
  }

  const apikey = global.APIKeys?.[baseURL]

  if (!apikey) {
    throw new Error('API key Theresav tidak ditemukan di global.APIKeys.')
  }

  const { data } = await axios.get(`${baseURL}${endpoint}`, {
    params,
    headers: {
      'x-apikey': apikey
    },
    timeout: 120000
  })

  if (data?.status !== true || typeof data?.result !== 'string') {
    throw new Error(
      data?.message ||
      data?.error ||
      'API Theresav gagal memberikan respons.'
    )
  }

  return data.result.trim()
}