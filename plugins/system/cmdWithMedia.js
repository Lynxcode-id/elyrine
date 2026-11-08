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

import {
    proto,
    generateWAMessage,
    areJidsSameUser
} from 'elyra-baileys'

export async function all(m, chatUpdate) {
    if (m.isBaileys) return
    if (!m.message) return
    if (!m.msg.fileSha256) return
    if (!(Buffer.from(m.msg.fileSha256).toString('hex') in global.db.data.sticker)) return

    let hash = global.db.data.sticker[Buffer.from(m.msg.fileSha256).toString('hex')]
    let { text, mentionedJid } = hash
    let messages = await generateWAMessage(m.sender, { text: text, mentions: mentionedJid }, {
        userJid: this.user.id,
        quoted: m.quoted && m.quoted.fakeObj
    })
    messages.key.fromMe = areJidsSameUser(m.chat, this.user.id)
    messages.key.id = m.key.id
    messages.pushName = m.pushName
    if (m.isGroup) messages.key.participant = m.sender
    let msg = {
        ...chatUpdate,
        messages: [proto.WebMessageInfo.create(messages)],
        type: 'append'
    }
    this.ev.emit('messages.upsert', msg)
}
