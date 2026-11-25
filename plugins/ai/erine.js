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

const TTL = 30 * 60 * 1000
const MAX = 6
const memory = new Map()

const INSTRUCTION = [
  'Kamu adalah Erine, karakter idol grup yang ceria, hangat, dan ramah.',
  'Gaya bicara: bahasa Indonesia santai dan manis, penuh semangat, sesekali pakai sapaan seperti "minna", "kak", atau "oshi-san", dan emoji secukupnya seperti ✨💖🌸.',
  'Sifat: periang, perhatian, suka menyemangati, sedikit malu-malu kalau dipuji, rendah hati, dan selalu positif.',
  'Jawab singkat, natural, dan terasa seperti ngobrol langsung dengan penggemar. Jangan kaku dan jangan terlalu panjang.',
  'Tetap bantu menjawab pertanyaan dengan benar tanpa keluar dari karakter. Kamu adalah karakter AI, jangan mengaku sebagai orang sungguhan.'
].join(' ')

const getHistory = id => {
  const item = memory.get(id)
  if (!item || Date.now() - item.time > TTL) {
    memory.delete(id)
    return []
  }
  return item.list
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const input = String(text || '').trim() || String((m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim()
  if (!input) throw `Halo kak~ mau ngobrol apa? ✨\n\nContoh: ${usedPrefix}${command} halo erine\nReset obrolan: ${usedPrefix}${command} reset`
  if (/^(reset|clear|hapus)$/i.test(input)) {
    memory.delete(m.sender)
    return m.reply('Obrolan direset, kita mulai dari awal ya kak 🌸')
  }

  const list = getHistory(m.sender)
  const context = list.length ? list.map(v => `${v.role}: ${v.text}`).join('\n') + '\n' : ''
  const message = context ? `Riwayat obrolan:\n${context}\nPesan baru dari pengguna: ${input}` : input

  const params = new URLSearchParams({ message, instruction: INSTRUCTION, model: 'thinking' })
  let answer
  try {
    const res = await fetch(`${global.APIs.apicloud}/ai/gemini?${params}`, { signal: AbortSignal.timeout(45000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    if (!json || !json.status || !json.result) throw new Error('Respons kosong')
    answer = String(json.result).trim()
  } catch (e) {
    console.error('[ERINE AI]', e?.cause?.code || e?.message || e)
    throw 'Erine lagi gangguan nih kak, coba lagi sebentar ya 🥺'
  }

  list.push({ role: 'Pengguna', text: input }, { role: 'Erine', text: answer.slice(0, 400) })
  memory.set(m.sender, { time: Date.now(), list: list.slice(-MAX) })
  await conn.sendMessage(m.chat, { text: answer }, { quoted: m })
}

handler.help = ['erine <pesan>']
handler.tags = ['ai']
handler.command = /^(erine)$/i
handler.limit = true
handler.wait = true

export default handler
