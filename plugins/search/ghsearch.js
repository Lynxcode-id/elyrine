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

const handler = async (m, { conn, text }) => {
  if (!text) throw 'Masukkan kata kunci pencarian GitHub.\nContoh: .githubsearch erine ai'
  const base = global.APIs?.xrina
  if (!base) throw 'API Xrina belum dikonfigurasi di config.js.'

  await m.react('🔎').catch(() => {})
  try {
    const url = new URL('/search/github-srch', base)
    url.search = new URLSearchParams({ q: text })

    const response = await fetch(url, { signal: AbortSignal.timeout(20000) })
    if (!response.ok) throw `HTTP ${response.status}`
    const json = await response.json()

    const items = Array.isArray(json?.data) ? json.data.filter(v => v?.repository?.url) : []
    if (!json?.status || !items.length) {
      throw 'Repository GitHub tidak ditemukan.'
    }

    const results = items.slice(0, 10)
    const list = results.map((v, i) => {
      const r = v.repository
      return [
        `*${i + 1}. ${r.full_name || r.name}*`,
        `${r.description || 'Tanpa deskripsi'}`,
        `★ ${r.stars ?? 0}  ·  🍴 ${r.forks ?? 0}  ·  👤 ${v.author?.name || 'Unknown'}`,
        `◦ ${r.url}`
      ].join('\n')
    })
    const caption = [
      '🌱 *ERINE-AI • GITHUB SEARCH*',
      `◦ Query : ${text}\n◦ Hasil : ${results.length} dari ${items.length}`,
      list.join('\n\n'),
      '© ERINE-AI'
    ].join('\n\n')

    const first = results.find(v => v.author?.avatar_url)
    await conn.sendMessage(m.chat, {
      text: caption,
      contextInfo: first ? {
        externalAdReply: {
          title: first.repository.full_name || 'GitHub Search',
          body: `@${first.author.name} • Xrina API`,
          mediaType: 1,
          thumbnailUrl: first.author.avatar_url,
          sourceUrl: first.repository.url,
          renderLargerThumbnail: false,
          showAdAttribution: false
        }
      } : undefined
    }, { quoted: m })

    await m.react('💐').catch(() => {})
  } catch (e) {
    await m.react('❌').catch(() => {})
    throw typeof e === 'string' ? e : 'Gagal mengambil data GitHub, coba lagi nanti.'
  }
}

handler.help = ['githubsearch <kata kunci>']
handler.tags = ['search']
handler.command = /^(githubsearch|ghsearch)$/i
handler.limit = true
handler.register = true

export default handler
