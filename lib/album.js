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
if (!global.albumOrphans) global.albumOrphans = [];

export const ALBUM_LIB_VERSION = 'v3';
const ALBUM_TTL_MS = 30 * 60 * 1000;
const ORPHAN_TTL_MS = 60 * 1000;
const MAX_ALBUMS = 200;
const MAX_ORPHANS = 100;
const NEAR_MS = 60 * 1000;
const GAP_MS = 10 * 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isMedia = (t) => t === 'imageMessage' || t === 'videoMessage';
const kindOf = (t) => (t === 'imageMessage' ? 'image' : 'video');

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
		const inner =
			cur.ephemeralMessage?.message ||
			cur.viewOnceMessage?.message ||
			cur.viewOnceMessageV2?.message ||
			cur.viewOnceMessageV2Extension?.message ||
			cur.documentWithCaptionMessage?.message;
		if (!inner) break;
		cur = inner;
	}
	return cur;
};

const mediaKeyOf = (content) => (content ? Object.keys(content).find(isMedia) : undefined);

const assocParent = (msg) => {
	const c = unwrap(msg) || {};
	return (
		c.messageContextInfo?.messageAssociation?.parentMessageKey?.id ||
		msg?.messageContextInfo?.messageAssociation?.parentMessageKey?.id ||
		Object.values(c).find((v) => v && typeof v === 'object' && v.contextInfo?.messageAssociation)?.contextInfo
			?.messageAssociation?.parentMessageKey?.id ||
		null
	);
};

function findCtx(message) {
	const queue = [[message, 0]];
	while (queue.length) {
		const [o, d] = queue.shift();
		if (!o || typeof o !== 'object' || Buffer.isBuffer(o) || o instanceof Uint8Array || d > 5) continue;
		const ci = o.contextInfo;
		if (ci && typeof ci === 'object' && (ci.stanzaId || ci.quotedMessage)) return ci;
		for (const k of Object.keys(o)) if (k !== 'contextInfo' && k !== 'quotedMessage') queue.push([o[k], d + 1]);
	}
	return null;
}

export function sendersOf(key) {
	const group = String(key?.remoteJid || '').endsWith('@g.us');
	const raw = group
		? [key?.participant, key?.participantAlt, key?.participantPn, key?.participantLid]
		: [key?.remoteJid, key?.remoteJidAlt, key?.participant];
	const s = new Set();
	for (const v of raw) if (v) s.add(String(v).split('@')[0].split(':')[0]);
	return s;
}
const overlap = (a, b) => {
	if (!a?.size || !b?.size) return true;
	for (const x of a) if (b.has(x)) return true;
	return false;
};

const expectedOf = (e) => (e ? (e.expectedImageCount || 0) + (e.expectedVideoCount || 0) : 0);
const isFull = (e) => expectedOf(e) > 0 && e.items.length >= expectedOf(e);

function attach(entry, it) {
	if (entry.items.some((x) => x.id === it.id)) return false;
	entry.items.push({ id: it.id, type: it.type, message: it.message, at: it.at });
	return true;
}

function claimOrphans(entry) {
	const now = Date.now();
	global.albumOrphans = global.albumOrphans.filter((o) => now - o.at < ORPHAN_TTL_MS);
	const rest = [];
	for (const o of global.albumOrphans) {
		const mine =
			o.parentId === entry.id ||
			(!o.parentId && o.chatJid === entry.chatJid && overlap(o.senders, entry.senders) && !isFull(entry));
		if (mine) attach(entry, o);
		else rest.push(o);
	}
	global.albumOrphans = rest;
}

export function bindAlbumCollector(conn) {
	if (conn.__albumCollectorBound) return;
	conn.__albumCollectorBound = true;

	conn.ev.on('messages.upsert', ({ messages }) => {
		for (const msg of messages || []) {
			try {
				const content = unwrap(msg?.message);
				if (!content || !msg.key) continue;

				const chatJid = msg.key.remoteJid;
				const senders = sendersOf(msg.key);
				const sender = chatJid?.endsWith('@g.us') ? msg.key.participant || chatJid : chatJid;

				if (content.albumMessage) {
					const id = msg.key.id;
					const old = global.albumCollector.get(id);
					const entry = old || {
						id,
						chatJid,
						sender,
						senders,
						expectedImageCount: 0,
						expectedVideoCount: 0,
						items: [],
						createdAt: Date.now(),
					};
					entry.expectedImageCount = content.albumMessage.expectedImageCount || entry.expectedImageCount;
					entry.expectedVideoCount = content.albumMessage.expectedVideoCount || entry.expectedVideoCount;
					global.albumCollector.set(id, entry);
					while (global.albumCollector.size > MAX_ALBUMS) global.albumCollector.delete(global.albumCollector.keys().next().value);
					claimOrphans(entry);
					if (!old) {
						setTimeout(() => {
							if (global.albumCollector.get(id) === entry) global.albumCollector.delete(id);
						}, ALBUM_TTL_MS).unref?.();
					}
					continue;
				}

				const mt = mediaKeyOf(content);
				if (!mt) continue;
				const it = {
					id: msg.key.id,
					type: kindOf(mt),
					message: content[mt],
					chatJid,
					senders,
					parentId: assocParent(msg.message),
					at: Date.now(),
				};

				let target = it.parentId ? global.albumCollector.get(it.parentId) || null : null;
				if (!target && !it.parentId) {
					for (const e of global.albumCollector.values()) {
						if (e.chatJid !== chatJid || !overlap(e.senders, senders)) continue;
						if (isFull(e) || it.at - e.createdAt > NEAR_MS) continue;
						if (!target || e.createdAt > target.createdAt) target = e;
					}
				}
				if (target) attach(target, it);
				else {
					global.albumOrphans.push(it);
					while (global.albumOrphans.length > MAX_ORPHANS) global.albumOrphans.shift();
				}
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

function cacheRows(chat) {
	const rows = [];
	const cache = global.mediaCache;
	if (!cache || !chat) return rows;
	for (const [id, e] of cache.entries()) {
		if (e.chat !== chat) continue;
		const content = unwrap(e.message);
		const mt = mediaKeyOf(content);
		if (!mt) continue;
		rows.push({
			id,
			type: kindOf(mt),
			message: content[mt],
			at: e.t,
			parent: assocParent(e.message),
			senders: e.key ? sendersOf(e.key) : null,
			fromMe: !!e.fromMe,
		});
	}
	return rows;
}

function clusterRows(rows, { idx, from, senders, expected }) {
	const ok = (r) => overlap(r.senders, senders);
	let a, b;
	if (idx >= 0) {
		a = b = idx;
		while (a > 0 && ok(rows[a - 1]) && rows[a].at - rows[a - 1].at <= GAP_MS) a--;
		while (b < rows.length - 1 && ok(rows[b + 1]) && rows[b + 1].at - rows[b].at <= GAP_MS) b++;
	} else {
		a = rows.findIndex((r) => r.at >= from - 3000 && ok(r));
		if (a < 0) return [];
		b = a;
		while (b < rows.length - 1 && ok(rows[b + 1]) && rows[b + 1].at - rows[b].at <= GAP_MS) b++;
	}
	let list = rows.slice(a, b + 1);
	if (expected > 0 && list.length > expected) {
		const pos = idx >= 0 ? idx - a : 0;
		const start = Math.max(0, Math.min(pos, list.length - expected));
		list = list.slice(start, start + expected);
	}
	return list;
}

function gather({ chat, stanzaId, isWrapper, expectedHint, quotedNode, quotedKnown, quotedSender, fallbackSenders }) {
	const rows = cacheRows(chat);
	const selfRow = stanzaId ? rows.find((r) => r.id === stanzaId) : null;

	let albumId = isWrapper || (stanzaId && global.albumCollector.has(stanzaId)) ? stanzaId : null;
	if (!albumId && stanzaId) {
		for (const [id, en] of global.albumCollector.entries()) {
			if (en.items.some((it) => it.id === stanzaId)) { albumId = id; break; }
		}
	}
	if (!albumId && selfRow?.parent) albumId = selfRow.parent;

	if (!albumId && !stanzaId && fallbackSenders) {
		let best = null;
		for (const e of global.albumCollector.values()) {
			if (e.chatJid !== chat || !overlap(e.senders, fallbackSenders) || Date.now() - e.createdAt > 10 * 60 * 1000) continue;
			if (!best || e.createdAt > best.createdAt) best = e;
		}
		if (best) albumId = best.id;
	}

	const entry = albumId ? global.albumCollector.get(albumId) || null : null;
	const expected = expectedOf(entry) || expectedHint || 0;
	const map = new Map();
	const via = [];
	const add = (list, tag) => {
		let n = 0;
		for (const it of list) if (!map.has(it.id)) { map.set(it.id, { id: it.id, type: it.type, message: it.message, at: it.at || 0 }); n++; }
		if (n) via.push(tag);
	};
	const need = () => map.size < (expected || 1);

	if (entry) add(entry.items, 'collector');
	if (albumId && need()) add(global.albumOrphans.filter((o) => o.parentId === albumId), 'orphan');

	if (albumId && need()) add(rows.filter((r) => r.parent === albumId), 'cache-assoc');

	if (need()) {
		let list = [];
		if (selfRow) {
			list = clusterRows(rows, { idx: rows.indexOf(selfRow), senders: selfRow.senders, expected });
		} else if (entry) {
			list = clusterRows(rows, { idx: -1, from: entry.createdAt, senders: entry.senders, expected });
		} else if (expected > 0) {
			const same = rows.slice(-expected);
			if (same.length === expected && same[same.length - 1].at - same[0].at < 30000) list = same;
		}
		add(list, 'cluster');
		if (!entry && !expected && list.length) via.push('cluster-unknown-count');
	}

	if (!map.size && !quotedKnown && rows.length) {
		const senders = quotedSender ? new Set([String(quotedSender).split('@')[0].split(':')[0]]) : fallbackSenders || null;
		const mine = senders ? rows.filter((r) => overlap(r.senders, senders)) : rows;
		const last = mine.length - 1;
		if (last >= 0 && Date.now() - mine[last].at < 10 * 60 * 1000) {
			let a = last;
			while (a > 0 && mine[a].at - mine[a - 1].at <= GAP_MS) a--;
			const list = mine.slice(a);
			add(expected > 0 ? list.slice(0, expected) : list, 'latest-cluster');
		}
	}

	if (!map.size && quotedNode) {
		const mt = mediaKeyOf(quotedNode);
		if (mt) add([{ id: stanzaId, type: kindOf(mt), message: quotedNode[mt], at: 0 }], 'single');
	}

	const items = [...map.values()].sort((x, y) => x.at - y.at);
	return { albumId, expected, items, via };
}

async function downloadItem(it) {
	let lastErr;
	for (let i = 0; i < 2; i++) {
		try {
			const stream = await downloadContentFromMessage(it.message, it.type);
			const chunks = [];
			for await (const c of stream) chunks.push(c);
			const buffer = Buffer.concat(chunks);
			if (buffer.length) return { type: it.type, buffer, mimetype: it.message.mimetype || '' };
			lastErr = new Error('hasil unduhan kosong');
		} catch (e) {
			lastErr = e;
		}
		await sleep(300);
	}
	console.error('[ALBUM] gagal download item:', it.id, lastErr?.message || lastErr);
	return null;
}

export async function readAlbumMessage(m, { type, consume = false, wait = 4000 } = {}) {
	const empty = (reason, extra = {}) => ({
		found: false, reason, albumId: null, expected: 0, complete: false, via: [], failed: 0,
		items: [], images: [], videos: [], ...extra,
	});

	const quoted = m?.quoted || null;
	const ci = quoted ? null : findCtx(m?.message);
	const isAlbumSelf = m?.mtype === 'albumMessage';
	const noReply = !quoted && !ci && !isAlbumSelf;
	const dbg = `${ALBUM_LIB_VERSION} quoted=${!!quoted} ctx=${!!ci} mt=${m?.mtype} keys=${Object.keys(m?.message || {}).join(',')}`;
	const empty2 = (reason, extra) => ({ ...empty(reason, extra), dbg });

	const node = unwrap(quoted?.messages || ci?.quotedMessage || (isAlbumSelf ? m.message : null)) || {};
	const wrapper = node.albumMessage || (isAlbumSelf ? m.msg : null) || (quoted?.mtype === 'albumMessage' ? quoted : null);
	const isWrapper = !!wrapper;
	const chat = quoted?.chat || ci?.remoteJid || m?.chat || m?.key?.remoteJid;
	const fallbackSenders = noReply && m?.key ? sendersOf(m.key) : null;
	const stanzaId = quoted?.id || ci?.stanzaId || (isAlbumSelf ? m.id : null);
	const quotedKnown = !!Object.keys(node).length;
	const quotedSender = quoted?.sender || ci?.participant || null;
	const expectedHint = wrapper ? (wrapper.expectedImageCount || 0) + (wrapper.expectedVideoCount || 0) : 0;

	const deadline = Date.now() + Math.max(0, wait);
	let st;
	for (;;) {
		st = gather({ chat, stanzaId, isWrapper, expectedHint, quotedNode: node, quotedKnown, quotedSender, fallbackSenders });
		const done = st.items.length && (!st.expected || st.items.length >= st.expected);
		if (done || Date.now() >= deadline) break;
		await sleep(400);
	}

	if (!st.items.length) {
		console.warn('[ALBUM] item tidak ketemu', {
			quotedType: quoted?.mtype,
			dbg,
			hasQuoted: !!quoted,
			ctxKeys: ci ? Object.keys(ci) : null,
			quotedKeys: Object.keys(node),
			quotedId: stanzaId,
			isWrapper,
			expected: st.expected,
			collector: global.albumCollector.size,
			orphans: global.albumOrphans.length,
			cache: global.mediaCache?.size || 0,
		});
		return empty2(noReply ? 'no-quote' : 'not-found', { albumId: st.albumId || stanzaId, expected: st.expected });
	}

	const wanted = st.items.filter((it) => !type || it.type === type);
	const got = (await mapLimit(wanted, 3, downloadItem)).filter(Boolean);

	console.log('[ALBUM] ok', { dbg, via: st.via, items: st.items.length, expected: st.expected });
	if (consume && st.albumId) consumeAlbumMessage(st.albumId);
	return {
		found: true,
		dbg,
		albumId: st.albumId,
		expected: st.expected || st.items.length,
		complete: st.items.length >= (st.expected || 1) && got.length === wanted.length,
		via: st.via,
		failed: wanted.length - got.length,
		items: got,
		images: got.filter((i) => i.type === 'image').map((i) => i.buffer),
		videos: got.filter((i) => i.type === 'video').map((i) => i.buffer),
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
