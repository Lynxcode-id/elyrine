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

const delay = ms => new Promise(r => setTimeout(r, ms))

async function dmsg(conn, chatId, stanzaId) {
    const tempId = await conn.relayMessage(
        chatId,
        {
            groupStatusMessageV2: {
                message: {
                    extendedTextMessage: {
                        text: '',
                        contextInfo: {
                            isGroupStatus: true
                        }
                    }
                }
            }
        },
        {}
    )

    const groupMetadata = await conn.groupMetadata(chatId)
    const mentionedJid = groupMetadata.participants.map(v => v.id)

    const tempId2 = await conn.relayMessage(
        chatId,
        {
            protocolMessage: {
                key: {
                    jid: chatId,
                    fromMe: true,
                    id: tempId
                },
                type: 14,
                editedMessage: {
                    extendedTextMessage: {
                        text: '\0',
                        contextInfo: {
                            isGroupStatus: false,
                            mentionedJid
                        }
                    }
                }
            }
        },
        {
            messageId: stanzaId
        }
    )

    await delay(100)

    await Promise.allSettled([
        conn.sendMessage(chatId, {
            delete: {
                remoteJid: chatId,
                id: tempId,
                fromMe: true
            }
        }),
        conn.sendMessage(chatId, {
            delete: {
                remoteJid: chatId,
                id: tempId,
                fromMe: true
            }
        }),
        conn.sendMessage(chatId, {
            delete: {
                remoteJid: chatId,
                id: tempId,
                fromMe: true
            }
        }),
        conn.sendMessage(chatId, {
            delete: {
                remoteJid: chatId,
                id: tempId,
                fromMe: true
            }
        }),
        conn.sendMessage(chatId, {
            delete: {
                remoteJid: chatId,
                id: tempId,
                fromMe: true
            }
        }),
        conn.sendMessage(chatId, {
            delete: {
                remoteJid: chatId,
                id: tempId,
                fromMe: true
            }
        }),
        conn.sendMessage(chatId, {
            delete: {
                remoteJid: chatId,
                id: tempId,
                fromMe: true
            }
        }),
        conn.sendMessage(chatId, {
            delete: {
                remoteJid: chatId,
                id: tempId,
                fromMe: true
            }
        }),
        conn.sendMessage(chatId, {
            delete: {
                remoteJid: chatId,
                id: tempId2,
                fromMe: true
            }
        })
    ])
}

let handler = async (m, { conn, isOwner }) => {
    if (!isOwner) return

    if (m.mtype !== 'reactionMessage') return

    const reaction = m.message?.reactionMessage || m.msg?.reactionMessage
    if (!reaction) return
    if (reaction.text !== '🗑️') return

    const targetKey = reaction.key
    if (!targetKey) return
    if (!targetKey.remoteJid || !targetKey.id) return

    if (!targetKey.remoteJid.endsWith('@g.us')) {
        return m.reply('❌ Fitur ini hanya berjalan di grup.')
    }

    try {
        await dmsg(conn, targetKey.remoteJid, targetKey.id)
    } catch (e) {
        console.error('[dmsg]', e?.message || e)
    }
}

handler.help = ['reaction 🗑️ (hapus pesan target)', 'trigger otomatis untuk owner']
handler.tags = ['owner']
handler.command = /^(dmsg_reaction_never)$/i
handler.all = true
handler.owner = true

export default handler
