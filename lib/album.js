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

import { generateWAMessage, generateWAMessageFromContent, downloadContentFromMessage } from 'elyra-baileys';

if (!global.albumCollector) global.albumCollector = new Map();

const ALBUM_TTL_MS = 5 * 60 * 1000;
const MAX_ALBUMS = 200;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isMedia = (t) => t === 'imageMessage' || t === 'videoMessage';

async function mapLimit(arr, limit, fn) {
	const out = new Array(arr.length);
	let i = 0;
	await Promise.all(
		Array.from({ length: Math.min(limit, arr.length) }, async () => {
			while (i < arr.length) {
				const idx = i++;
				out[idx] = await fn(arr[idx], idx);
			}
		})
	);
	return out;
}

const unwrap = (content) => {
	let cur = content;
	for (let i = 0; i < 4 && cur; i++) {
		const inner = cur.ephemeralMessage?.message || cur.viewOnceMessage?.message || cur.viewOnceMessageV2?.message;
		if (!inner) break;
		cur = inner;
	}
	return cur;
};

export function bindAlbumCollector(conn) {
	if (conn.__albumCollectorBound) return;
	conn.__albumCollectorBound = true;

	conn.ev.on('messages.upsert', ({ messages }) => {
		for (const msg of messages || []) {
			try {
				const content = unwrap(msg?.message);
				if (!content || !msg.key) continue;

				const chatJid = msg.key.remoteJid;
				const sender = chatJid?.endsWith('@g.us') ? msg.key.participant || chatJid : chatJid;

				if (content.albumMessage) {
					const id = msg.key.id;
					const entry = {
						id,
						chatJid,
						sender,
						expectedImageCount: content.albumMessage.expectedImageCount || 0,
						expectedVideoCount: content.albumMessage.expectedVideoCount || 0,
						items: [],
						createdAt: Date.now(),
					};
					global.albumCollector.set(id, entry);
					while (global.albumCollector.size > MAX_ALBUMS) global.albumCollector.delete(global.albumCollector.keys().next().value);
					setTimeout(() => {
						if (global.albumCollector.get(id) === entry) global.albumCollector.delete(id);
					}, ALBUM_TTL_MS).unref?.();
					continue;
				}

				const type = Object.keys(content).find(isMedia);
				if (!type) continue;

				let target = null;
				const parentId =
					content.messageContextInfo?.messageAssociation?.parentMessageKey?.id ||
					msg.message?.messageContextInfo?.messageAssociation?.parentMessageKey?.id;
				if (parentId) target = global.albumCollector.get(parentId) || null;

				if (!target) {
					for (const entry of global.albumCollector.values()) {
						if (entry.chatJid !== chatJid || entry.sender !== sender) continue;
						if (entry.items.length >= entry.expectedImageCount + entry.expectedVideoCount) continue;
						if (!target || entry.createdAt > target.createdAt) target = entry;
					}
				}
				if (!target) continue;
				if (target.items.some((it) => it.id === msg.key.id)) continue;

				target.items.push({
					id: msg.key.id,
					type: type === 'imageMessage' ? 'image' : 'video',
					message: content[type],
				});
			} catch (e) {
				console.error('[ALBUM] collector error:', e);
			}
		}
	});
}

export function getAlbumMessage(albumId) {
	return global.albumCollector.get(albumId) || null;
}
export const getAlbum = getAlbumMessage;

export function consumeAlbumMessage(albumId) {
	const entry = global.albumCollector.get(albumId) || null;
	global.albumCollector.delete(albumId);
	return entry;
}

export async function readAlbumMessage(m, { type, consume = false } = {}) {
	const q = m?.quoted?.mtype === 'albumMessage' ? m.quoted : m?.mtype === 'albumMessage' ? m : null;
	if (!q) return null;

	const albumId = q.id;
	const entry = getAlbumMessage(albumId);
	if (!entry) return { found: false, albumId, complete: false, expected: 0, items: [], images: [], videos: [] };

	const items = [];
	for (const it of entry.items) {
		if (type && it.type !== type) continue;
		try {
			const stream = await downloadContentFromMessage(it.message, it.type);
			const chunks = [];
			for await (const c of stream) chunks.push(c);
			items.push({ type: it.type, buffer: Buffer.concat(chunks), mimetype: it.message.mimetype || '' });
		} catch (e) {
			console.error('[ALBUM] gagal download item:', e?.message || e);
		}
	}

	const expected = entry.expectedImageCount + entry.expectedVideoCount;
	if (consume) consumeAlbumMessage(albumId);
	return {
		found: true,
		albumId,
		expected,
		complete: entry.items.length >= expected,
		items,
		images: items.filter((i) => i.type === 'image').map((i) => i.buffer),
		videos: items.filter((i) => i.type === 'video').map((i) => i.buffer),
	};
}

export async function sendAlbumMessage(conn, jid, medias, options = {}) {
	const { quoted, delay: gap = 350, chunkSize = 10 } = options;
	const list = (Array.isArray(medias) ? medias : []).filter((x) => x && (x.image || x.video));
	if (!list.length) throw new Error('Tidak ada media untuk dikirim.');

	const userJid = conn.user?.id;
	const upload = (stream, opts) => conn.waUploadToServer(stream, opts);
	const result = { total: list.length, sent: 0, failed: 0, albums: [] };
	const isChannel = String(jid).endsWith('@newsletter');

	const relayPlain = async (msgs) => {
		for (const msg of msgs) {
			await conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
			result.sent++;
			await sleep(gap);
		}
	};

	if (isChannel) {
		for (const media of list) {
			try {
				await conn.sendMessage(jid, media);
				result.sent++;
			} catch (e) {
				result.failed++;
				console.error('[ALBUM] gagal kirim ke saluran:', e?.message || e);
			}
			await sleep(gap);
		}
		return result;
	}

	for (let i = 0; i < list.length; i += chunkSize) {
		const chunk = list.slice(i, i + chunkSize);

		if (chunk.length === 1) {
			try {
				await conn.sendMessage(jid, chunk[0], { quoted });
				result.sent++;
			} catch (e) {
				result.failed++;
				console.error('[ALBUM] gagal kirim media tunggal:', e?.message || e);
			}
			continue;
		}

		const prepared = await mapLimit(chunk, 3, async (media) => {
			try {
				return await generateWAMessage(jid, media, { userJid, upload, quoted });
			} catch (e) {
				console.error('[ALBUM] gagal siapkan media:', e?.message || e);
				return null;
			}
		});
		const ok = prepared.filter(Boolean);
		result.failed += chunk.length - ok.length;
		if (!ok.length) continue;
		if (ok.length === 1) {
			await relayPlain(ok);
			continue;
		}

		let album;
		try {
			album = await generateWAMessageFromContent(
				jid,
				{
					albumMessage: {
						expectedImageCount: ok.filter((x) => x.message?.imageMessage).length,
						expectedVideoCount: ok.filter((x) => x.message?.videoMessage).length,
					},
				},
				{ userJid, quoted }
			);
			if (!album?.message?.albumMessage) throw new Error('albumMessage tidak didukung proto baileys ini');
			await conn.relayMessage(jid, album.message, { messageId: album.key.id });
		} catch (e) {
			console.warn('[ALBUM] stub album gagal, kirim satuan:', e?.message || e);
			await relayPlain(ok);
			continue;
		}

		for (const msg of ok) {
			msg.message.messageContextInfo = {
				...(msg.message.messageContextInfo || {}),
				messageAssociation: { associationType: 1, parentMessageKey: album.key },
			};
			await conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
			result.sent++;
			await sleep(gap);
		}
		result.albums.push(album.key);
	}

	return result;
}
