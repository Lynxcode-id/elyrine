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

const rapihin = raw => {
  const parts = String(raw).replace(/\r/g, '').split(/(```[\s\S]*?```)/g)
  return parts.map(part => {
    if (part.startsWith('```')) return part
    return part
      .replace(/^[ \t]*\|?[ \t]*:?-{2,}:?[ \t]*(\|[ \t]*:?-{2,}:?[ \t]*)*\|?[ \t]*$/gm, '')
      .replace(/^[ \t]*\|(.+)\|[ \t]*$/gm, (_, row) => row.split('|').map(v => v.trim()).filter(Boolean).join(' • '))
      .replace(/^[ ]{0,3}#{1,6}[ \t]*(.+?)[ \t]*#*[ \t]*$/gm, (_, t) => `*${t.replace(/\*+/g, '').trim()}*`)
      .replace(/\*\*\*(.+?)\*\*\*/g, '*$1*')
      .replace(/\*\*(.+?)\*\*/g, '*$1*')
      .replace(/__(.+?)__/g, '*$1*')
      .replace(/~~(.+?)~~/g, '~$1~')
      .replace(/^([ \t]*)[-*+][ \t]+/gm, (_, sp) => (sp.length >= 2 ? '    ◦ ' : '• '))
      .replace(/^[ \t]*>[ \t]?/gm, '')
      .replace(/^[ \t]*([-*_][ \t]*){3,}$/gm, '')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1 ($2)')
  }).join('').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim()
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const input = String(text || '').trim() || String((m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim()
  if (!input) throw `Masukkan pertanyaan.\n\nContoh: ${usedPrefix}${command} arti masukkan itu apa`
  let answer
  try {
    const res = await fetch(`${global.APIs.apicloud}/ai/deepseek?${new URLSearchParams({ text: input })}`, { signal: AbortSignal.timeout(60000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    answer = json && json.status && json.answer
    if (!answer) throw new Error('Respons kosong')
  } catch (e) {
    console.error('[DEEPSEEK AI]', e?.cause?.code || e?.message || e)
    throw `DeepSeek gagal memberikan respons: ${e?.message || e}`
  }
  const out = rapihin(answer)
  await conn.sendMessage(m.chat, { text: out }, { quoted: m })
}

handler.help = ['deepseek <pertanyaan>']
handler.tags = ['ai']
handler.command = /^(deepseek)$/i
handler.limit = true
handler.wait = true

export default handler
