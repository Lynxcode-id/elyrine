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

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const input = String(text || '').trim() || String((m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim()
  if (!input) throw `Masukkan pertanyaan.\n\nContoh: ${usedPrefix}${command} apa itu masukan`
  let answer
  try {
    const res = await fetch(`${global.APIs.apicloud}/ai/gpt?${new URLSearchParams({ text: input })}`, { signal: AbortSignal.timeout(45000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    answer = json && json.status && json.result && json.result.text
    if (!answer) throw new Error('Respons kosong')
  } catch (e) {
    console.error('[GPT AI]', e?.cause?.code || e?.message || e)
    throw `GPT gagal memberikan respons: ${e?.message || e}`
  }
  await conn.sendMessage(m.chat, { text: String(answer).trim() }, { quoted: m })
}

handler.help = ['gpt4omini <pertanyaan>']
handler.tags = ['ai']
handler.command = /^(gpt4omini)$/i
handler.limit = true
handler.wait = true

export default handler
