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

const BASE = (global.APIs && global.APIs.theresav) || 'https://api.theresav.eu'

const isImg = x => x && /^image\//i.test(x.mimetype || (x.msg && x.msg.mimetype) || '') && typeof x.download === 'function'
const STYLES = ['art', 'photo']
const NOISES = ['none', 'low', 'medium', 'high']

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const apikey = global.APIKeys && global.APIKeys[BASE]
  if (!apikey) throw `API key belum diisi. Tambahkan di config.js:\nglobal.APIKeys['${BASE}'] = 'apikey'`

  const target = [m, m.quoted].find(isImg)
  if (!target) throw `Kirim atau reply foto dengan caption *${usedPrefix + command}*\nOpsi: *${usedPrefix + command} style noise* (style: ${STYLES.join('/')}, noise: ${NOISES.join('/')})\nContoh: *${usedPrefix + command} photo low*`

  const [styleArg, noiseArg] = String(text || '').trim().toLowerCase().split(/\s+/)
  const style = STYLES.includes(styleArg) ? styleArg : 'photo'
  const noise = NOISES.includes(noiseArg) ? noiseArg : 'low'

  await m.wait()

  const buf = await target.download()
  if (!Buffer.isBuffer(buf) || !buf.length) throw 'Foto gagal diunduh.'

  let json
  try {
    const form = new FormData()
    form.append('image', new Blob([buf]), 'image.jpg')
    form.append('x2', '2')
    form.append('style', style)
    form.append('noise', noise)

    const res = await fetch(new URL('/api/image/bigjpg', BASE), {
      method: 'POST',
      headers: { 'x-apikey': apikey },
      body: form,
      signal: AbortSignal.timeout(120000)
    })
    json = await res.json().catch(() => null)
    if (!res.ok || !json) throw new Error((json && (json.message || json.error)) || `HTTP ${res.status}`)
  } catch (e) {
    console.error('[BIGJPG]', (e && e.message) || e)
    throw `Gagal memperjelas gambar.\n${(e && e.message) || e}`
  }

  if (!json.status || !json.result) throw `Gagal memperjelas gambar.\n${json.message || json.error || 'Hasil kosong dari API'}`

  const dim = json.dimensions || {}
  const caption = [
    '*BIGJPG — Image HD*',
    '',
    `Scale : ${json.scale || '2x'}`,
    `Style : ${json.style || style}`,
    `Noise : ${json.noise || noise}`,
    dim.width && dim.height ? `Dimensi : ${dim.width}x${dim.height}` : null,
    json.time_taken ? `Waktu proses : ${json.time_taken}` : null
  ].filter(Boolean).join('\n')

  await conn.sendFile(m.chat, json.result, 'bigjpg.jpg', caption, m)
}

handler.help = ['bigjpg [style] [noise]']
handler.tags = ['image']
handler.command = /^(bigjpg)$/i
handler.limit = true
handler.register = true

export default handler
