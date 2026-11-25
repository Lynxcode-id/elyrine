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

import { haidarGet, findVideo, taskStatus, downloadBuffer } from '../../lib/haidar.js'

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const id = (text || '').trim()
  await m.wait()

  if (!id) {
    const d = await haidarGet('/api/v1/capcut/jj-tasks')
    const entries = Object.entries(d.tasks || {})
    if (!entries.length) throw 'Belum ada task.'
    return m.reply([
      '*CAPCUT JJ TASKS*',
      '',
      ...entries.slice(-15).map(([k, v]) => `${k} • ${v.status || '-'}${v.video ? ' • siap' : ''}`),
      '',
      `Ambil hasil: *${usedPrefix + command} <task_id>*`
    ].join('\n'))
  }

  if (!/^\d{5,25}$/.test(id)) throw `Task ID tidak valid.\nContoh: *${usedPrefix + command} 1795438472291*`
  const d = await haidarGet('/api/v1/capcut/jj-status', { task_id: id })
  const url = findVideo(d)
  if (!url) return m.reply(`Task ${id}\nStatus : ${taskStatus(d) || 'processing'}\nBelum selesai, coba lagi sebentar.`)
  const video = await downloadBuffer(url)
  await conn.sendMessage(m.chat, { video, mimetype: 'video/mp4', caption: `🎬 Task ${id}` }, { quoted: m })
}

handler.help = ['jjstatus [task_id]']
handler.tags = ['capcut']
handler.command = /^(jjstatus|jjtasks)$/i
handler.limit = true

export default handler
