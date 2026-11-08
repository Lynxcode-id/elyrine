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

const API = (global.APIs?.lynxapis || 'https://lynxapis.my.id') + '/api/maker/iqc'

function getTime() {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Makassar',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date())
  const g = t => p.find(x => x.type === t)?.value || '00'
  return `${g('hour')}.${g('minute')}`
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const q = m.quoted
  const text = (args || []).join(' ').trim() ||
    String(q?.text || q?.caption || '').trim()

  if (!text) throw `Mana teksnya?\nContoh: *${usedPrefix + command} halo*`

  await m.wait()

  const params = { text, time: getTime() }

  const target = [m, q].find(x => /^image\//i.test(x?.mimetype || x?.msg?.mimetype || '') && typeof x?.download === 'function')
  if (target) {
    try {
      const buf = await target.download()
      if (Buffer.isBuffer(buf) && buf.length) {
        const { default: uploadImage } = await import('../../lib/uploader.js')
        const url = await uploadImage(buf)
        if (/^https?:\/\//i.test(url || '')) params.image_url = url
      }
    } catch (e) {
      console.error('[iqc] foto gagal diupload:', e.message)
    }
  }

  const res = await axios.get(API, {
    params,
    responseType: 'arraybuffer',
    timeout: 40000,
    maxContentLength: 8 * 1024 * 1024,
    validateStatus: () => true
  })

  const ct = String(res.headers['content-type'] || '')
  if (res.status !== 200 || !ct.startsWith('image/')) {
    const body = Buffer.from(res.data).toString('utf8').slice(0, 200)
    console.error('[iqc] API error', res.status, body)
    throw `IQC gagal (HTTP ${res.status}): ${body}`
  }

  await conn.sendFile(m.chat, Buffer.from(res.data), 'iqc.png', '', m)
}

handler.help = ['iqc <teks>']
handler.tags = ['maker']
handler.command = /^(iqc)$/i
handler.register = true

export default handler
