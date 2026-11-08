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

import { generateWAMessageContent, generateWAMessageFromContent } from 'elyra-baileys'

const FULL_FRAME = [
  { x: 0, y: 0 },
  { x: 1000, y: 0 },
  { x: 1000, y: 1000 },
  { x: 0, y: 1000 }
]

export function badgeInfo() {
  const cfg = global.videoBadge || {}
  const name = global.namebot || 'ERINE-AI'
  return {
    title: cfg.title || `${name} Project`,
    author: cfg.author || name,
    link: cfg.link ?? global.sgc ?? '',
    musicContentMediaId: cfg.musicContentMediaId || '1409620227516822',
    songId: cfg.songId || '244215252974958'
  }
}

/**
 * @param {import('elyra-baileys').WASocket} conn
 * @param {string} jid
 * @param {Buffer|{url:string}} video
 * @param {{ caption?: string, quoted?: object, mimetype?: string, badge?: boolean }} opt
 */
export async function sendVideoBadge(conn, jid, video, { caption = '', quoted, mimetype = 'video/mp4', badge = true } = {}) {
  const content = await generateWAMessageContent({ video, caption, mimetype }, { upload: conn.waUploadToServer })

  if (badge && content.videoMessage) {
    const b = badgeInfo()
    content.videoMessage.annotations = [{
      polygonVertices: FULL_FRAME,
      shouldSkipConfirmation: true,
      embeddedContent: {
        embeddedMusic: {
          musicContentMediaId: b.musicContentMediaId,
          songId: b.songId,
          author: b.author,
          title: b.title,
          artworkDirectPath: '',
          artistAttribution: b.link,
          countryBlocklist: '',
          isExplicit: false,
          musicSongStartTimeInMs: 0,
          derivedContentStartTimeInMs: 0,
          overlapDurationInMs: 0
        }
      },
      embeddedAction: true
    }]
  }

  const msg = generateWAMessageFromContent(jid, content, { quoted, userJid: conn.user.id })
  await conn.relayMessage(jid, msg.message, { messageId: msg.key.id })
  return msg
}