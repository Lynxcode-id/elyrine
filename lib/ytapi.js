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

export async function ytmp3Api(url) {
  const base = global.APIs?.theresav
  const apikey = global.APIKeys?.[base]
  if (!base || !apikey) throw new Error('API Theresav atau API key belum dikonfigurasi di config.js.')
  try {
    const { data } = await axios.get(`${base}/api/download/ytmp3`, {
      params: { url },
      headers: { 'x-apikey': apikey },
      timeout: 60000
    })
    if (!data?.status || !data?.download_url) throw new Error(data?.message || 'API tidak mengembalikan link download.')
    return data
  } catch (e) {
    throw new Error(e.response?.data?.message || e.message)
  }
}
