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
  if (!text) throw 'Masukkan kata kunci pencarian TikTok.'

  const base = global.APIs?.yonz
  const apikey = global.APIKeys?.[base]

  if (!base || !apikey) throw 'API Yonz atau API key belum dikonfigurasi di config.js.'

  await m.react('🔎').catch(() => {})

  try {
    const url = new URL('/search/tiktok/v2', base)
    url.search = new URLSearchParams({
      apikey,
      query: text,
      lang: 'en'
    })

    const response = await fetch(url)
    const json = await response.json()

    if (!json.status || !Array.isArray(json.result) || !json.result.length) {
      throw 'Video TikTok tidak ditemukan.'
    }

    const results = json.result.slice(0, 10)

    const caption = [
      '🌱 *ERINE-AI • TIKTOK SEARCH*',
      '',
      `◦ Query : ${json.input || text}`,
      `◦ Total : ${json.total || results.length}`,
      '',
      ...results.map((v, i) => [
        `*${i + 1}. ${v.author || 'Unknown'}*`,
        `${v.title || 'Tanpa judul'}`,
        `◦ ${v.url}`
      ].join('\n')),
      '',
      '© ERINE-AI'
    ].join('\n\n')

    const first = results.find(v => v.cover && v.url)

    await conn.sendMessage(m.chat, {
      text: caption,
      contextInfo: first ? {
        externalAdReply: {
          title: first.title || 'TikTok Search',
          body: `@${first.author || 'TikTok'} • Yonz API`,
          mediaType: 1,
          thumbnailUrl: first.cover,
          sourceUrl: first.url,
          renderLargerThumbnail: true,
          showAdAttribution: false
        }
      } : undefined
    }, { quoted: m })

    await m.react('💐').catch(() => {})
  } catch (e) {
    await m.react('❌').catch(() => {})
    throw `Gagal mencari TikTok: ${e.message || e}`
  }
}

handler.help = ['ttsearch <query>']
handler.tags = ['search']
handler.command = /^(ttsearch|tiktoksearch)$/i
handler.limit = true

export default handler
