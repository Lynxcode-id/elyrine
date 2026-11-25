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

const MAX_LIST = 10

const handler = async (m, { text, usedPrefix, command }) => {
  const q = (text || '').trim()
  if (!q) throw `Masukkan nama package npm.\nContoh: ${usedPrefix}${command} axleys`

  const base = global.APIs?.nexray
  if (!base) throw 'API Nexray belum dikonfigurasi di config.js (global.APIs.nexray).'

  await m.react('🔎').catch(() => {})
  try {
    const url = new URL('/search/npmjs', base)
    url.search = new URLSearchParams({ q })

    const response = await fetch(url, { signal: AbortSignal.timeout(20000) })
    if (!response.ok) throw `HTTP ${response.status}`
    const json = await response.json()

    const results = Array.isArray(json?.result) ? json.result.filter(v => v?.name) : []
    if (!json?.status || !results.length) throw `Package "${q}" tidak ditemukan di npm.`

    const shown = results.slice(0, MAX_LIST)
    const list = shown.map((p, i) => [
      `*${i + 1}. ${p.name}* @${p.version || '-'}`,
      p.description || 'Tanpa deskripsi',
      `📦 ${p.downloads?.weekly ?? '-'}/minggu  ·  ${p.downloads?.monthly ?? '-'}/bulan`,
      `📄 ${p.license || '-'}  ·  👤 ${p.publisher || '-'}`,
      `◦ ${p.link}`,
    ].join('\n'))

    await m.reply([
      '🌱 *ERINE-AI • NPM SEARCH*',
      `◦ Query : ${q}\n◦ Hasil : ${shown.length} dari ${results.length}`,
      list.join('\n\n'),
      '© ERINE-AI',
    ].join('\n\n'))
    await m.react('✅').catch(() => {})
  } catch (e) {
    await m.react('❌').catch(() => {})
    throw typeof e === 'string' ? e : `Gagal mencari: ${e?.message || e}`
  }
}

handler.help = ['npms <nama package>']
handler.tags = ['search']
handler.command = /^(npms)$/i

export default handler
