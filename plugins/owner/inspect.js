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

import util from 'util'
export const handler = async (m, { conn, usedPrefix, command }) => {
  try {
    const key = m.key || {}
    const msg = m.messages || m.message || {}

    const info = {
      chat: m.chat,
      isGroup: m.isGroup,
      fromMe: m.fromMe,
      sender: m.sender,
      pushName: m.pushName,
      name: m.name,
      key: {
        id: key.id,
        remoteJid: key.remoteJid,
        fromMe: key.fromMe,
        participant: key.participant,
        participantPn: key.participantPn || conn.decodeJid(key.participant)
      },
      participant: m.participant,
      contextInfo_participant: msg?.extendedTextMessage?.contextInfo?.participant || msg?.conversation?.contextInfo?.participant,
      contextInfo_participantPn: msg?.extendedTextMessage?.contextInfo?.participantPn || msg?.conversation?.contextInfo?.participantPn,
      decodedSender: conn.decodeJid(m.sender),
      mtype: m.mtype,
      hasQuoted: !!m.quoted,
      quoted: m.quoted ? {
        id: m.quoted.id,
        chat: m.quoted.chat,
        sender: m.quoted.sender,
        participant: m.quoted.messages?.contextInfo?.participant,
        decodedQuotedSender: conn.decodeJid(m.quoted.sender)
      } : null,
    }

    const summary = [
      `chat: ${info.chat}`,
      `isGroup: ${info.isGroup}`,
      `sender: ${info.sender}`,
      `decodedSender: ${info.decodedSender}`,
      `pushName: ${info.pushName}`,
      `mtype: ${info.mtype}`,
      `key.id: ${info.key.id}`,
      `key.participant: ${info.key.participant}`,
      `key.participantPn: ${info.key.participantPn}`,
      `participant: ${info.participant}`,
    ].join('\n')

    const inspected = util.inspect(info, { depth: 3, colors: false, compact: false, maxArrayLength: 50 })
    await m.reply(`${summary}\n\n--- detail ---\n${inspected}`)
  } catch (e) {
    await m.reply(`Error: ${e && e.stack ? e.stack : e}`)
  }
}

handler.command = /^(inspect|props|probe)$/i
handler.owner = false

export default handler
