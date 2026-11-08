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

const u24 = n => Buffer.from([n & 255, (n >> 8) & 255, (n >> 16) & 255])

const u32 = n => {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32LE(n)
  return buffer
}

const chunk = (id, data) => Buffer.concat([
  Buffer.from(id, 'ascii'),
  u32(data.length),
  data,
  Buffer.alloc(data.length % 2)
])

function readImageChunks(file) {
  const chunks = []
  let offset = 12
  while (offset + 8 <= file.length) {
    const id = file.toString('ascii', offset, offset + 4)
    const size = file.readUInt32LE(offset + 4)
    if (id === 'ALPH' || id === 'VP8 ' || id === 'VP8L') {
      chunks.push(chunk(id, file.subarray(offset + 8, offset + 8 + size)))
    }
    offset += 8 + size + (size % 2)
  }
  return Buffer.concat(chunks)
}

export function muxAnimatedWebp(frames, width, height) {
  const body = Buffer.concat([
    chunk('VP8X', Buffer.concat([Buffer.from([0x12, 0, 0, 0]), u24(width - 1), u24(height - 1)])),
    chunk('ANIM', Buffer.alloc(6)),
    ...frames.map(({ buffer, duration }) => chunk('ANMF', Buffer.concat([
      u24(0), u24(0),
      u24(width - 1), u24(height - 1),
      u24(duration),
      Buffer.from([0x02]),
      readImageChunks(buffer)
    ])))
  ])
  return Buffer.concat([Buffer.from('RIFF', 'ascii'), u32(body.length + 4), Buffer.from('WEBP', 'ascii'), body])
}