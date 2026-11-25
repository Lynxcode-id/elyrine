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

import { haidarGet, haidarPostForm, pickImages, findVideo, taskStatus, downloadBuffer } from '../../lib/haidar.js'

const POLL_MS = 6000
const POLL_MAX = 60

async function waitResult(conn, m, taskId, title) {
  for (let i = 0; i < POLL_MAX; i++) {
    await new Promise(r => setTimeout(r, POLL_MS))
    let d
    try { d = await haidarGet('/api/v1/capcut/jj-status', { task_id: taskId }) } catch { continue }
    const st = taskStatus(d)
    if (/fail|error|gagal/.test(st)) {
      await m.react('❌').catch(() => { })
      return m.reply(`❌ Task ${taskId} gagal diproses.`)
    }
    const url = findVideo(d)
    if (url) {
      try {
        const video = await downloadBuffer(url)
        await conn.sendMessage(m.chat, { video, mimetype: 'video/mp4', caption: `🎬 ${title}\nTask: ${taskId}` }, { quoted: m })
      } catch (e) {
        await m.reply(`✅ Video siap tapi gagal dikirim: ${e.message}\n${url}`)
      }
      return m.react('✅').catch(() => { })
    }
  }
  await m.react('⌛').catch(() => { })
  return m.reply(`⌛ Task ${taskId} masih diproses. Cek lagi nanti: *.jjstatus ${taskId}*`)
}

export { waitResult }

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const tpl = (text || '').trim()
  if (!tpl) throw `Masukkan template (nomor/id/judul) lalu reply atau kirim 1 / beberapa foto (album).\nContoh: *${usedPrefix + command} 3*\nDaftar template: *${usedPrefix}jjlist*`

  await m.wait()
  let images = await pickImages(m)
  if (!images.length) throw `Kirim atau reply foto (boleh album beberapa foto) dengan caption *${usedPrefix + command} ${tpl}*`

  let title = tpl
  try {
    const list = (await haidarGet('/api/v1/capcut/jj-list', { query: tpl })).templates || []
    const hit = list.find(x => String(x.no) === tpl || x.id === tpl || x.title?.toLowerCase() === tpl.toLowerCase()) || (list.length === 1 ? list[0] : null)
    if (hit) {
      title = hit.title
      if (hit.mediaCount && images.length < hit.mediaCount) throw `Template *${hit.title}* butuh ${hit.mediaCount} foto, kamu baru kirim ${images.length}.`
      if (hit.mediaCount) images = images.slice(0, hit.mediaCount)
    }
  } catch (e) {
    if (typeof e === 'string' || /butuh/.test(e?.message || '')) throw e
  }

  const d = await haidarPostForm('/api/v1/capcut/jj-make', { template: tpl }, images)
  const taskId = d.task_id || d.raw?.task_id
  if (!taskId) throw 'Task gagal dibuat.'

  await m.reply(`⏳ Task dibuat (${images.length} foto)\nTemplate : ${title}\nTask ID  : ${taskId}\n\nVideo dikirim otomatis kalau sudah jadi.`)
  waitResult(conn, m, taskId, title).catch(e => console.error('[JJMAKE] poll error:', e?.message || e))
}

handler.help = ['jjmake <template>']
handler.tags = ['capcut']
handler.command = /^(jjmake|jjvideo|capcutjj)$/i
handler.limit = true

export default handler
