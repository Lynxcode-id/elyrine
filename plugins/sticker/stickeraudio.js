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

import { proto } from 'elyrine-baileys'
import { addExif, getStickerWatermark } from '../../lib/sticker-maker.js'
import { randomBytes, createCipheriv, createHmac, createHash, hkdfSync } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import sharp from 'sharp'

const execFileAsync = promisify(execFile)
const FFMPEG = () => global.ffmpegPath || 'ffmpeg'
const MAX_AUDIO_SEC = 25
const MAX_DURATION = 25
const MAX_AUDIO_BYTES = 10 * 1024 * 1024
const MAX_STICKER_BYTES = 900 * 1024
const AUDIO_MIME = 'audio/ogg; codecs=opus'
const COMMANDS = ['saudio', 'soundsticker', 'stikersuara', 'audiosticker', 'stikeraudio', 'stickeraudio']

let sendLock = Promise.resolve()
const withLock = (fn) => {
	const run = sendLock.then(fn, fn)
	sendLock = run.catch(() => {})
	return run
}

const varint = (n) => {
	const o = []
	while (n > 127) {
		o.push((n % 128) | 128)
		n = Math.floor(n / 128)
	}
	o.push(n)
	return Buffer.from(o)
}

const ld = (f, body) => Buffer.concat([varint(f * 8 + 2), varint(body.length), body])

function parseWebp(b) {
	if (
		b.length < 30 ||
		b.toString('ascii', 0, 4) !== 'RIFF' ||
		b.toString('ascii', 8, 12) !== 'WEBP'
	) throw new Error('Invalid WebP')

	const c = b.toString('ascii', 12, 16)

	if (c === 'VP8 ') {
		return {
			width: b.readUInt16LE(26) & 0x3fff,
			height: b.readUInt16LE(28) & 0x3fff,
			isAnimated: false
		}
	}

	if (c === 'VP8L') {
		return {
			width: 1 + (b[21] | ((b[22] & 0x3f) << 8)),
			height: 1 + ((b[22] >> 6) | (b[23] << 2) | ((b[24] & 0x0f) << 10)),
			isAnimated: false
		}
	}

	if (c === 'VP8X') {
		return {
			width: 1 + b.readUIntLE(24, 3),
			height: 1 + b.readUIntLE(27, 3),
			isAnimated: (b[20] & 2) !== 0
		}
	}

	throw new Error('Unsupported WebP chunk')
}

const HKDF = {
	audio: 'WhatsApp Audio Keys',
	sticker: 'WhatsApp Image Keys'
}

async function uploadEncrypted(client, plain, kind) {
	const mediaKey = randomBytes(32)
	const k = Buffer.from(
		hkdfSync('sha256', mediaKey, Buffer.alloc(32), HKDF[kind], 112)
	)

	const iv = k.subarray(0, 16)
	const cipher = createCipheriv('aes-256-cbc', k.subarray(16, 48), iv)
	const enc = Buffer.concat([
		cipher.update(plain),
		cipher.final()
	])

	const mac = createHmac('sha256', k.subarray(48, 80))
		.update(iv)
		.update(enc)
		.digest()
		.subarray(0, 10)

	const file = Buffer.concat([enc, mac])
	const fileEncSha256 = createHash('sha256').update(file).digest()
	const tmp = path.join(
		os.tmpdir(),
		`as-${kind}-${randomBytes(8).toString('hex')}.enc`
	)

	await fs.writeFile(tmp, file)

	try {
		const opts = {
			fileEncSha256B64: fileEncSha256.toString('base64'),
			mediaType: kind
		}

		let res
		try {
			res = await client.waUploadToServer(tmp, opts)
		} catch (firstErr) {
			try {
				res = await client.waUploadToServer(createReadStream(tmp), opts)
			} catch {
				throw firstErr
			}
		}

		if (!res?.directPath) {
			throw new Error(`${kind} upload returned no directPath`)
		}

		return {
			url: res.mediaUrl || `https://mmg.whatsapp.net${res.directPath}`,
			directPath: res.directPath,
			mediaKey,
			fileEncSha256,
			fileSha256: createHash('sha256').update(plain).digest(),
			fileLength: plain.length,
			mediaKeyTimestamp: Math.floor(Date.now() / 1000)
		}
	} finally {
		fs.unlink(tmp).catch(() => {})
	}
}

async function sendCombinedAudioSticker(client, chat, stickerBuffer, audioBuffer) {
	const webp = parseWebp(stickerBuffer)

	const [a, s] = await Promise.all([
		uploadEncrypted(client, audioBuffer, 'audio'),
		uploadEncrypted(client, stickerBuffer, 'sticker')
	])

	const mediaDomainInfo = (key) =>
		ld(74, Buffer.concat([
			Buffer.from([0x08, 0x01]),
			ld(2, key)
		]))

	const audioBytes = Buffer.concat([
		Buffer.from(proto.Message.AudioMessage.encode(
			proto.Message.AudioMessage.create({
				url: a.url,
				mimetype: AUDIO_MIME,
				fileSha256: a.fileSha256,
				fileEncSha256: a.fileEncSha256,
				fileLength: a.fileLength,
				mediaKey: a.mediaKey,
				directPath: a.directPath,
				mediaKeyTimestamp: a.mediaKeyTimestamp
			})
		).finish()),
		ld(17, mediaDomainInfo(a.mediaKey))
	])

	const stickerBase = Buffer.concat([
		Buffer.from(proto.Message.StickerMessage.encode(
			proto.Message.StickerMessage.create({
				url: s.url,
				fileSha256: s.fileSha256,
				fileEncSha256: s.fileEncSha256,
				mediaKey: s.mediaKey,
				mimetype: 'image/webp',
				height: webp.height,
				width: webp.width,
				directPath: s.directPath,
				fileLength: s.fileLength,
				mediaKeyTimestamp: s.mediaKeyTimestamp,
				isAnimated: webp.isAnimated,
				stickerSentTs: Date.now()
			})
		).finish()),
		ld(17, Buffer.concat([
			mediaDomainInfo(s.mediaKey),
			ld(82, varint(13001))
		]))
	])

	const futureProofBody = ld(
		1,
		ld(26, Buffer.concat([
			stickerBase,
			ld(26, audioBytes)
		]))
	)

	const RAW = Symbol('rawFields')
	const payload = proto.Message.create({
		messageContextInfo: {
			messageSecret: randomBytes(32)
		}
	})

	payload[RAW] = [[134, futureProofBody]]

	return withLock(async () => {
		const originalEncode = proto.Message.encode

		proto.Message.encode = function (msg, w) {
			const out = originalEncode.call(this, msg, w)

			if (msg && msg[RAW]) {
				for (const [f, body] of msg[RAW]) {
					out.uint32(f * 8 + 2).bytes(body)
				}
			}

			return out
		}

		try {
			return await client.relayMessage(chat, payload, {})
		} finally {
			proto.Message.encode = originalEncode
		}
	})
}

async function videoBufferToAnimatedWebp(buffer) {
	const tmpId = randomBytes(6).toString('hex')
	const inPath = path.join(os.tmpdir(), `as_vid_${tmpId}.mp4`)
	const outPath = path.join(os.tmpdir(), `as_out_${tmpId}.webp`)

	const encodeAttempt = async (fps, qv) => {
		await execFileAsync(FFMPEG(), [
			'-y',
			'-i', inPath,
			'-t', String(MAX_DURATION),
			'-vf', `fps=${fps},scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1`,
			'-c:v', 'libwebp',
			'-lossless', '0',
			'-compression_level', '6',
			'-q:v', String(qv),
			'-loop', '0',
			'-preset', 'picture',
			'-an',
			'-vsync', '0',
			outPath
		])
		return await fs.readFile(outPath)
	}

	try {
		await fs.writeFile(inPath, buffer)
		const profiles = [
			[10, 50],
			[8, 36],
			[6, 24],
			[5, 16]
		]
		let webp = null
		for (const [fps, qv] of profiles) {
			webp = await encodeAttempt(fps, qv)
			if (webp.length <= 880 * 1024) break
		}
		return webp
	} finally {
		await fs.unlink(inPath).catch(() => {})
		await fs.unlink(outPath).catch(() => {})
	}
}

async function imageBufferToWebp(buffer) {
	try {
		const sharp = (await import('sharp')).default
		return await sharp(buffer, { animated: true })
			.rotate()
			.resize(512, 512, {
				fit: 'contain',
				background: { r: 0, g: 0, b: 0, alpha: 0 }
			})
			.webp({ quality: 82 })
			.toBuffer()
	} catch {
		const tmpId = randomBytes(6).toString('hex')
		const inPath = path.join(os.tmpdir(), `as_img_${tmpId}.jpg`)
		const outPath = path.join(os.tmpdir(), `as_img_out_${tmpId}.webp`)
		try {
			await fs.writeFile(inPath, buffer)
			await execFileAsync(FFMPEG(), [
				'-y',
				'-i', inPath,
				'-vf', 'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1',
				'-c:v', 'libwebp',
				'-lossless', '0',
				'-q:v', '80',
				'-an',
				outPath
			])
			return await fs.readFile(outPath)
		} finally {
			await fs.unlink(inPath).catch(() => {})
			await fs.unlink(outPath).catch(() => {})
		}
	}
}

const isAnimatedWebp = (buf) => {
	if (!buf || buf.length < 30) return false
	if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return false
	if (buf.toString('ascii', 12, 16) === 'VP8X' && (buf[20] & 0x02)) return true
	return buf.includes('ANIM')
}

async function compressAnimated(buf) {
	let out = buf
	for (const q of [50, 35, 25]) {
		out = await sharp(buf, { animated: true, limitInputPixels: false })
			.resize(384, 384, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
			.webp({ quality: q, effort: 4, loop: 0 })
			.toBuffer()
		if (out.length <= MAX_STICKER_BYTES) break
	}
	return out
}

async function toOpusVN(buffer) {
	const id = randomBytes(6).toString('hex')
	const inp = path.join(os.tmpdir(), `sa-in-${id}`)
	const out = path.join(os.tmpdir(), `sa-out-${id}.ogg`)
	try {
		await fs.writeFile(inp, buffer)
		await execFileAsync(FFMPEG(), [
			'-y', '-i', inp, '-vn', '-map', '0:a:0', '-map_metadata', '-1', '-t', String(MAX_AUDIO_SEC),
			'-af', 'aresample=48000:async=1:first_pts=0',
			'-c:a', 'libopus', '-b:a', '64k', '-ar', '48000', '-ac', '1', '-f', 'ogg', out
		], { timeout: 30000 })
		return await fs.readFile(out)
	} finally {
		await Promise.all([inp, out].map(f => fs.unlink(f).catch(() => {})))
	}
}

async function fetchAudio(url) {
	const res = await fetch(url, {
		headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
		signal: AbortSignal.timeout(25000)
	})
	if (!res.ok) throw new Error(`Download audio gagal (HTTP ${res.status})`)
	const buf = Buffer.from(await res.arrayBuffer())
	if (!buf.length) throw new Error('File audio kosong.')
	if (buf.length > MAX_AUDIO_BYTES) throw new Error('File audio kebesaran (maks 10MB).')
	return buf
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
	const url = String(text || '').match(/https?:\/\/\S+/i)?.[0]
	if (!url) {
		throw `🔊 *SOUND STICKER*\n\nReply stiker/foto/video dengan:\n\`${usedPrefix + command} <url audio>\`\n\nContoh:\n\`${usedPrefix + command} https://cdn.example.com/sound.mp3\``
	}

	const q = m.quoted || m
	const mime = String(q.mimetype || q.msg?.mimetype || '').toLowerCase()
	if (!q.download || !/^(image|video)\//.test(mime)) {
		throw 'Reply stiker (statis/bergerak), foto, atau video yang mau dikasih suara.'
	}

	await m.react('⏳').catch(() => {})

	try {
		const media = await q.download()
		if (!Buffer.isBuffer(media) || !media.length) throw new Error('Gagal mengunduh media target.')

		const { packName, publisher } = getStickerWatermark()
		let webp
		if (mime === 'image/webp') webp = await addExif(media, packName, publisher)
		else if (/^video\//.test(mime)) webp = await addExif(await videoBufferToAnimatedWebp(media), packName, publisher)
		else webp = await addExif(await imageBufferToWebp(media), packName, publisher)

		const animated = /^video\//.test(mime) || mime === 'image/gif' || isAnimatedWebp(webp)
		if (animated && webp.length > MAX_STICKER_BYTES) {
			webp = await addExif(await compressAnimated(webp), packName, publisher)
		}

		const opus = await toOpusVN(await fetchAudio(url))

		await sendCombinedAudioSticker(conn, m.chat, webp, opus)
		await m.react('✅').catch(() => {})
	} catch (e) {
		console.error('[SAUDIO]', e?.stack || e)
		await m.react('❌').catch(() => {})
		throw `Gagal bikin sound sticker: ${e?.message || e}`
	}
}

handler.help = ['saudio <url_audio>']
handler.tags = ['sticker']
handler.command = COMMANDS
handler.desc = 'Stiker bersuara: reply stiker/foto/video + URL audio (maks 25 detik)'
handler.limit = true

export default handler
