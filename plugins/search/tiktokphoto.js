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

const MAX_LIST = 15
const MAX_IMAGES = 20

const sleep = ms => new Promise(r => setTimeout(r, ms))
if (!global.__tiktokphotoCache) global.__tiktokphotoCache = {}
const cache = global.__tiktokphotoCache

const fmtStats = s => `👁️ ${s?.views ?? 0}  ❤️ ${s?.likes ?? 0}  💬 ${s?.comment ?? 0}  🔁 ${s?.share ?? 0}`

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const q = (text || '').trim()
  if (!q) {
    throw [
      '*Cari foto TikTok*',
      `• ${usedPrefix}${command} <kata kunci>  → cari`,
      `• ${usedPrefix}${command} <nomor>  → ambil foto dari hasil pencarian terakhir`,
      `Contoh: ${usedPrefix}${command} erine jkt48`,
    ].join('\n')
  }

  if (/^\d{1,2}$/.test(q)) {
    const saved = cache[m.chat]
    if (!saved || !saved.length) throw `Belum ada pencarian di chat ini. Cari dulu:\n${usedPrefix}${command} <kata kunci>`
    const item = saved[Number(q) - 1]
    if (!item) throw `Nomor ${q} tidak ada (1-${saved.length}).`
    if (!item.images || !item.images.length) throw 'Post ini tidak punya foto.'
    return kirimFoto(conn, m, item)
  }

  const base = global.APIs?.nexray
  if (!base) throw 'API Nexray belum dikonfigurasi di config.js (global.APIs.nexray).'

  await m.react('🔎').catch(() => {})
  try {
    const url = new URL('/search/tiktokphoto', base)
    url.search = new URLSearchParams({ q })

    const response = await fetch(url, { signal: AbortSignal.timeout(20000) })
    if (!response.ok) throw `HTTP ${response.status}`
    const json = await response.json()

    const results = Array.isArray(json?.result) ? json.result : []
    if (!json?.status || !results.length) throw `Tidak ada hasil untuk "${q}".`

    cache[m.chat] = results
    const shown = results.slice(0, MAX_LIST)
    const list = shown.map((r, i) => {
      const title = String(r.title || '(tanpa judul)').trim().replace(/\s+/g, ' ').slice(0, 60)
      return [
        `*${i + 1}. ${title}*`,
        `👤 ${r.author?.nickname || '-'}  ·  🖼️ ${r.images?.length || 0} foto`,
        fmtStats(r.stats),
      ].join('\n')
    })

    await m.reply([
      '🌱 *ERINE-AI • TIKTOK PHOTO*',
      `◦ Query : ${q}\n◦ Hasil : ${shown.length} dari ${results.length}`,
      list.join('\n\n'),
      `Kirim *${usedPrefix}${command} <nomor>* untuk ambil fotonya.`,
      '© ERINE-AI',
    ].join('\n\n'))
    await m.react('✅').catch(() => {})
  } catch (e) {
    await m.react('❌').catch(() => {})
    throw typeof e === 'string' ? e : `Gagal mencari: ${e?.message || e}`
  }
}

async function kirimFoto(conn, m, item) {
  const images = item.images.slice(0, MAX_IMAGES)
  const caption = [
    String(item.title || '').trim(),
    [
      `👤 ${item.author?.nickname || '-'}${item.author?.fullname ? ` (${item.author.fullname})` : ''}`,
      fmtStats(item.stats),
      item.music_info?.title ? `🎵 ${item.music_info.title}${item.music_info.author ? ` - ${item.music_info.author}` : ''}` : '',
    ].filter(Boolean).join('\n'),
    images.length < item.images.length ? `(ditampilkan ${images.length}/${item.images.length} foto)` : '',
  ].filter(Boolean).join('\n\n')

  let sent = 0
  for (let i = 0; i < images.length; i++) {
    try {
      await conn.sendMessage(m.chat, i === 0 ? { image: { url: images[i] }, caption } : { image: { url: images[i] } }, { quoted: m })
      sent++
    } catch {
    }
    if (i < images.length - 1) await sleep(400)
  }
  if (!sent) throw 'Gagal mengirim semua foto (link mungkin kedaluwarsa, coba cari ulang).'
  if (sent < images.length) await m.reply(`⚠️ ${sent}/${images.length} foto berhasil terkirim.`)
}

handler.help = ['tiktokphoto <kata kunci>', 'tiktokphoto <nomor>']
handler.tags = ['search']
handler.command = /^(tiktokphoto|ttimg)$/i

export default handler
