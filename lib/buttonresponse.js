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

const unwrap = msg => {
  let cur = msg
  for (let i = 0; i < 5 && cur; i++) {
    const inner = cur.ephemeralMessage?.message
      || cur.viewOnceMessage?.message
      || cur.viewOnceMessageV2?.message
      || cur.viewOnceMessageV2Extension?.message
      || cur.documentWithCaptionMessage?.message
    if (!inner) break
    cur = inner
  }
  return cur
}

/** @returns {string} ID tombol, atau '' kalau pesan bukan respon tombol */
export function extractButtonId(message) {
  const msg = unwrap(message)
  if (!msg) return ''

  if (msg.buttonsResponseMessage) return msg.buttonsResponseMessage.selectedButtonId || ''
  if (msg.listResponseMessage) return msg.listResponseMessage.singleSelectReply?.selectedRowId || ''
  if (msg.templateButtonReplyMessage) return msg.templateButtonReplyMessage.selectedId || ''

  const nf = msg.interactiveResponseMessage?.nativeFlowResponseMessage
  if (nf) {
    try {
      const p = JSON.parse(nf.paramsJson || '{}')
      return String(p.id || p.selectedId || p.value || p.name || nf.name || '')
    } catch {
      return String(nf.name || '')
    }
  }
  return ''
}
