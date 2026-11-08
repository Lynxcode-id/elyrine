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

import { AIRich } from 'elyra-baileys'

const LOGO_KOMUNITAS = 'https://raw.githubusercontent.com/Lynxcode-id/picture/main/1793014664390.jpeg'
const LOGO_BOT = 'https://raw.githubusercontent.com/its-dinda/image/main/1793884065104.jpeg'
const REPO_API = 'https://api.github.com/repos/Lynxcode-id/elyrine'
const REPO_URL = 'https://github.com/Lynxcode-id/elyrine'
const KOMUNITAS_URL = 'https://whatsapp.com/channel/0029VbAnuii6GcGCu73oep1i'
const OWNER_URL = 'https://wa.me/6288258041396'
const FOOTER = '© Elyra'
const CACHE_MS = 10 * 60 * 1000

const toTime = (time) => {
  if (!time) return '-'
  const diff = Math.floor((Date.now() - new Date(time).getTime()) / 1000)
  if (diff < 60) return `${diff} detik yang lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`
  if (diff < 2592000) return `${Math.floor(diff / 86400)} hari yang lalu`
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} bulan yang lalu`
  return `${Math.floor(diff / 31536000)} tahun yang lalu`
}

let repoCache = { at: 0, data: null }
const fetchRepo = async () => {
  if (Date.now() - repoCache.at < CACHE_MS) return repoCache.data
  let data = null
  try {
    const res = await fetch(REPO_API, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'elyrine-bot' } })
    data = res.ok ? await res.json() : null
  } catch { }
  repoCache = { at: Date.now(), data }
  return data
}

let handler = async (m, { conn, usedPrefix }) => {
  const p = usedPrefix || '.'
  await m.react('⏳').catch(() => { })

  const repo = await fetchRepo()

  const caption = [
    '🌷 *Informasi Script Elyrine*',
    '',
    `♡ - Nama : ${repo?.name || 'Elyrine'}`,
    `♡ - Pemilik : ${repo?.owner?.login || 'Lynxcode-id'}`,
    `♡ - Stars : ${repo?.stargazers_count ?? '-'} | Forks : ${repo?.forks ?? '-'}`,
    `♡ - Terakhir update : ${toTime(repo?.updated_at)}`,
    `♡ - Link : ${repo?.html_url || REPO_URL}`,
    '',
    '✨ *Keunggulan*',
    '> *Ringan:* hanya memproses hal yang memang diperlukan',
    '> *Fast response:* handler dan plugin dibuat supaya alur pesan tetap singkat',
    '> *Tahan banting:* error satu plugin tidak menjatuhkan seluruh bot',
    '> *Tidak overlimit:* helper, cache, dan database dipakai seperlunya agar tidak kerja berulang',
    '> *Fleksibel:* berjalan di elyra-baileys dengan Native Flow, Carousel, dan AIRich',
    '> *Mudah di-maintenance:* koneksi, handler, database, helper, dan plugin dipisah dengan jelas',
    '> *Siap dikembangkan:* fitur baru tidak perlu mengacak-acak core bot',
    '',
    '🌱 *Komunitas*',
    '> Info update, bantuan, dan request fitur lewat saluran INF Project.',
  ].join('\n')

  try {
    let rich = new AIRich(conn)
    const use = (name, ...args) => { if (typeof rich[name] === 'function') rich = rich[name](...args) || rich }

    use('setTitle', '🌷 Elyrine Script Center')
    use('addProduct', [
      { title: 'Elyrine - WhatsApp Bot Multi Device', brand: 'Lynx Decode', price: 'Elyra', product_url: repo?.html_url || REPO_URL, icon_url: LOGO_BOT, image_url: LOGO_BOT },
      { title: 'INF Project - Komunitas Elyra', brand: 'INF Project', price: 'Komunitas', product_url: KOMUNITAS_URL, icon_url: LOGO_KOMUNITAS, image_url: LOGO_KOMUNITAS },
    ])
    use('addText', caption)
    use('addSuggest', [`${p}menu`, `${p}owner`, `${p}ping`])
    use('addFooterAction', [
      { text: 'Join Komunitas', url: KOMUNITAS_URL },
      { text: 'Chat Owner', url: OWNER_URL },
    ])
    use('setFooter', FOOTER)

    await rich.send(m.chat, { quoted: m })
    await m.react('💐').catch(() => { })
  } catch (err) {
    console.error('[SC]', err?.stack || err?.message || err)
    await m.react('☘️').catch(() => { })
    await m.reply(`${caption}\n\n♡ - Komunitas : ${KOMUNITAS_URL}\n♡ - Owner : ${OWNER_URL}\n\n${FOOTER}`)
  }
}

handler.help = ['sc']
handler.tags = ['info']
handler.command = /^(sc|script)$/i

export default handler
