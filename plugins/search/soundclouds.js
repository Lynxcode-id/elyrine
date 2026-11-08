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
  if (!text) throw 'Masukkan judul lagu atau nama artis.'

  const base = global.APIs?.yonz
  const apikey = global.APIKeys?.[base]

  if (!base || !apikey) throw 'API Yonz atau API key belum dikonfigurasi di config.js.'

  await m.react('🔎').catch(() => {})

  try {
    const url = new URL('/search/soundcloud', base)
    url.search = new URLSearchParams({
      apikey,
      query: text
    })

    const response = await fetch(url)
    const json = await response.json()

    if (!json.status || !Array.isArray(json.result) || !json.result.length) {
      throw 'Lagu SoundCloud tidak ditemukan.'
    }

    const results = json.result.slice(0, 10)

    const caption = [
      '🌱 *ERINE-AI • SOUNDCLOUD SEARCH*',
      '',
      `◦ Query : ${json.query || text}`,
      `◦ Total : ${json.total_result || results.length}`,
      '',
      ...results.map((v, i) => [
        `*${i + 1}. ${v.title || 'Unknown'}*`,
        `◦ Artist : ${v.artist || '-'}`,
        `◦ URL : ${v.url}`
      ].join('\n')),
      '',
      '© ERINE-AI'
    ].join('\n\n')

    const first = results.find(v => v.thumbnail && v.url)

    await conn.sendMessage(m.chat, {
      text: caption,
      contextInfo: first ? {
        externalAdReply: {
          title: first.title || 'SoundCloud',
          body: `${first.artist || 'Unknown Artist'} • SoundCloud`,
          mediaType: 1,
          thumbnailUrl: first.thumbnail,
          sourceUrl: first.url,
          renderLargerThumbnail: true,
          showAdAttribution: false
        }
      } : undefined
    }, { quoted: m })

    await m.react('💐').catch(() => {})
  } catch (e) {
    await m.react('❌').catch(() => {})
    throw `Gagal mencari SoundCloud: ${e.message || e}`
  }
}

handler.help = ['soundclouds <query>']
handler.tags = ['search']
handler.command = /^(soundclouds)$/i
handler.limit = true

export default handler
