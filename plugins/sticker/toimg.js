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

import sharp from 'sharp'
import { webp2png } from '../../lib/function.js'
import fs from 'fs'

let handler = async (m, { conn, usedPrefix, command }) => {
  const notStickerMessage = `Reply sticker dengan command *${usedPrefix + command}*`;

  if (!m.quoted) throw notStickerMessage;

  const q = m.quoted || m;
  const mime = q.mimetype || '';
  await m.wait()

  if (!/image\/webp/.test(mime)) {
    try {
      const name = await conn.getName(m.sender);
      const media = await q.download();
      const out = await webp2png(media).catch(_ => null) || Buffer.alloc(0);
      await conn.sendFile(m.chat, out, 'out.png', 'Request By ' + name, m);

      if (fs.existsSync(out || 'out.png' || './tmp/out.png' || `./tmp/${out}`)) {
        await fs.promises.unlink(out || 'out.png' || './tmp/out.png' || `./tmp/${out}`);
      }
    } catch (error) {
      console.error(error);
      m.gagal(notStickerMessage);
    }
  } else {
    try {
      const media = await q.download();

      await m.react('🕓')

      const decodedBuffer = await sharp(media).toFormat('png')
        .png({ quality: 100, progressive: true, compressionLevel: 9 })
        .toBuffer();

      if (decodedBuffer.length > 0) {
        await conn.sendFile(m.chat, decodedBuffer, 'out.png', '*DONE (≧ω≦)ゞ*', m);

        if (fs.existsSync('out.png' || './tmp/out.png')) {
          await fs.promises.unlink('out.png' || './tmp/out.png');
        }
      } else {
        throw 'Gagal mengonversi stiker menjadi gambar.';
      }
    } catch (error) {
      console.error(error);
      if (error.message.includes('Timeout')) {
        m.gagal('Proses konversi terlalu lama. Silakan coba lagi.');
      } else {
        m.gagal(notStickerMessage);
      }
    }
  }
};

handler.help = ['toimg (reply)']
handler.tags = ['maker']
handler.command = ['toimg']

handler.register = true
handler.limit = true

export default handler