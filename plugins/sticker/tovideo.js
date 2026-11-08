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

import { webp2mp4 } from '../../lib/function.js'
import { ffmpeg } from '../../lib/function.js'
let handler = async (m, { conn, usedPrefix, command }) => {
	if (!m.quoted) throw `Balas stiker/audio yang ingin diubah menjadi video dengan perintah ${usedPrefix + command}`
	let mime = m.quoted.mimetype || ''
	if (!/webp|audio/.test(mime)) throw `Balas stiker/audio yang ingin diubah menjadi video dengan perintah ${usedPrefix + command}`
	await m.wait()
	let media = await m.quoted.download()
	let out = Buffer.alloc(0)
	if (/webp/.test(mime)) {
		out = await webp2mp4(media)
	} else if (/audio/.test(mime)) {
		out = await ffmpeg(media, [
			'-filter_complex', 'color',
			'-pix_fmt', 'yuv420p',
			'-crf', '51',
			'-c:a', 'copy',
			'-shortest'
		], 'mp3', 'mp4')
	}
	await conn.sendFile(m.chat, out, 'out.mp4', '*DONE*', m, 0, { thumbnail: out })
}

handler.help = ['tovideo']
handler.tags = ['maker']
handler.command = ['tovideo', 'tomp4']

handler.register = true
handler.limit = 2

export default handler