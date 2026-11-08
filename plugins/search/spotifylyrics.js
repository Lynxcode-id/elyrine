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
  if (!text) throw 'Masukkan judul lagu untuk mencari lirik.'

  const base = global.APIs?.yonz
  const apikey = global.APIKeys?.[base]

  if (!base || !apikey) throw 'API Yonz atau API key belum dikonfigurasi di config.js.'

  await m.react('🔎').catch(() => {})

  try {
    const url = new URL('/search/spotify-lirik', base)
    url.search = new URLSearchParams({
      apikey,
      title: text
    })

    const response = await fetch(url)
    const json = await response.json()

    if (!json.status || !json.result) {
      throw 'Lirik lagu tidak ditemukan.'
    }

    const v = json.result
    const lyrics = v.plainLyrics || 'Lirik tidak tersedia.'

    const caption = [
      '🌱 *ERINE-AI • SPOTIFY LYRICS*',
      '',
      `◦ Title : ${v.trackName || v.name || '-'}`,
      `◦ Artist : ${v.artistName || '-'}`,
      `◦ Album : ${v.albumName || '-'}`,
      `◦ Duration : ${v.duration ? `${Math.floor(v.duration / 60)}:${String(v.duration % 60).padStart(2, '0')}` : '-'}`,
      `◦ Instrumental : ${v.instrumental ? 'Yes' : 'No'}`,
      '',
      '✦ *LYRICS*',
      '',
      lyrics,
      '',
      '© ERINE-AI'
    ].join('\n')

    await conn.sendMessage(m.chat, {
      text: caption
    }, { quoted: m })

    await m.react('💐').catch(() => {})
  } catch (e) {
    await m.react('❌').catch(() => {})
    throw `Gagal mengambil Spotify Lyrics: ${e.message || e}`
  }
}

handler.help = ['spotifylyrics <judul lagu>']
handler.tags = ['search']
handler.command = /^(spotifylyrics|splyrics)$/i
handler.limit = true

export default handler
