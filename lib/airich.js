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

import * as B from 'elyrine-baileys'

const D = B.default && typeof B.default === 'object' ? B.default : {}

class AIRichUnavailable {
    constructor() { this.unavailable = true }
}

export const AIRich = B.AIRich ?? B.MB?.AIRich ?? D.AIRich ?? D.MB?.AIRich ?? AIRichUnavailable
export const hasAIRich = AIRich !== AIRichUnavailable
export default AIRich
