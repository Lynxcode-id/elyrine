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

let handler = async (m) => {
  let gambar = 'https://api.ryzumi.net/images/qris.png'
  let qris = global.qris
  let numberowner = global.nomorown
  let anu = `Hai 👋
Kalian bisa membeli paket premium melalui:
┌〔 Premium • Emoney 〕
├ QRIS : ${qris}
└────
List Premium:
10k = Premium 20 Hari
20k = Premium 40 Hari
25k = Premium 60 Hari
50k = Premium 180 Hari

Terimakasih :D

Contact Owner:
wa.me/${numberowner} (Owner)
`
  let qris_img = Buffer.from(await (await fetch(gambar)).arrayBuffer())
  await conn.sendFile(m.chat, qris_img, '', anu, m)
}

handler.help = ['premium']
handler.tags = ['main']
handler.command = /^(premium)$/i

export default handler
