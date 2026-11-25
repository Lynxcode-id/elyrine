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

import { hasCustomThumb, saveCustomThumb, getImageInput } from '../../lib/customthumbfake.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (hasCustomThumb()) {
        return m.reply(
            `⚠️ Thumbnail allfake custom sudah diset.\n\n` +
            `• Ganti : *${usedPrefix}changethumbfake*\n` +
            `• Hapus : *${usedPrefix}delthumbfake* (thumbnail bawaan aktif lagi)`
        )
    }
    let img
    try {
        img = await getImageInput(m, text)
    } catch (err) {
        return m.reply(`❌ ${err.message}`)
    }
    if (!img) {
        return m.reply(
            `Reply gambar, kirim gambar dengan caption, atau sertakan URL gambar.\n\n` +
            `Contoh:\n> ${usedPrefix}${command} (reply gambar)\n> ${usedPrefix}${command} https://example.com/foto.jpg`
        )
    }
    try {
        const res = saveCustomThumb(img)
        return m.reply(
            `✅ *Thumbnail allfake tersimpan!*\n` +
            `• Format : ${res.ext}\n` +
            `• Ukuran : ${(res.size / 1024).toFixed(1)} KB\n` +
            `• Lokasi : database/thumbnail-allfake.${res.ext}\n\n` +
            `Thumbnail ini cuma dipakai untuk kartu link preview (allfake), tidak memengaruhi *${usedPrefix}addthumb* biasa.\n` +
            `Hapus sampai thumbnail bawaan aktif lagi dengan *${usedPrefix}delthumbfake*.`
        )
    } catch (err) {
        return m.reply(`❌ Gagal simpan thumbnail: ${err.message}`)
    }
}

handler.help = ['addthumbfake']
handler.tags = ['owner']
handler.command = /^(addthumbfake)$/i
handler.owner = true

export default handler
