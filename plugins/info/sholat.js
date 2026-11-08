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

import fetch from 'node-fetch'

let handler = async (m, { text }) => {
    if (!text) throw 'Masukan nama kotanya'
    let res = await jadwalsholat(text)
    res = res.map(({ lokasi, daerah, jadwal }) => {
        delete jadwal.tanggal, delete jadwal.date
        jadwal = Object.keys(jadwal).map((v) => `• ${v.capitalize()}: ${jadwal[v]}`).join('\n')
        return `*Lokasi:* ${lokasi}\n*Daerah:* ${daerah}\n*Jadwal:*\n${jadwal}`
    }).join`\n\n`
    m.reply(res)
}
handler.help = ['sholat']
handler.tags = ['info']
handler.command = /^(jadwalsholat|sholat)$/i

export default handler

async function jadwalsholat(query) {
    let id = await (await fetch(`https://api.myquran.com/v2/sholat/kota/cari/${query}`)).json()
    if (id.status !== true) throw id.message
    id = id.data
    let result = [], d = new Date().toLocaleDateString('id', { timeZone: 'Asia/Jakarta' }).split('/')
    for (let i = 0; i < id.length; i++) {
        let res = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${id[i].id}/${d[2]}/${d[1]}/${d[0]}`)
        res = await res.json()
        result.push({ lokasi: res.data.lokasi, daerah: res.data.daerah, jadwal: res.data.jadwal })
    }
    return result
}