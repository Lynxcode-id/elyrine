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

let handler = async(m) => {
	if (!m.quoted) return m.reply(
		"Reply gambar/video yang ingin Anda lihat"
	);
	let typ = ["image/jpeg", "video/mp4"]
	let regMedia = typ.includes(m.quoted.mimetype);
	let view = m.quoted?.viewOnce == true ? true : false
	
	if (regMedia && view) {
		let msg = await m.getQuotedObj()?.message;
		let type = Object.keys(msg)[0];
		let media = await m.quoted?.download() || await m.getQuotedObj()
		.download();
		if (!media) return m.reply("Media gagal di Eksekusi!")
	
		await conn.sendFile(
		m.chat, media, 'error.mp4', msg[type]?.caption || '', m
		);
	} else m.reply("Ini bukan pesan view-once.");
};

handler.help = ['read']
handler.tags = ['tools']
handler.command = /^read/i

handler.register = true

export default handler
