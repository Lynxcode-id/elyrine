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

import path from 'path'
import fs, { promises } from 'fs'
import os, { tmpdir } from 'os'
import util, { format } from 'util'
import Crypto from 'crypto'
import { join } from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import chalk from 'chalk'
import pino from 'pino'
import fetch from 'node-fetch'
import FormData from 'form-data'
import PhoneNumber from 'awesome-phonenumber'
import { fileTypeFromBuffer } from 'file-type'
import * as Jimp from 'jimp'
import ff from 'fluent-ffmpeg'
import webp from 'node-webpmux'
import { JSDOM } from 'jsdom'
import { useSQLiteAuthState } from './SQLsessions.js'
import { createIdentity } from './identity.js'
import { waitText, successText, errorText } from './respon.js'
import { printMessageLog, printBootReady } from './loader.js'
import { bindAlbumCollector, sendAlbumMessage, readAlbumMessage } from './album.js'
import { ffmpeg, toPTT, toAudio, toVideo, prepareAudioMessage } from './converter.js'

const delay = ms => new Promise(r => setTimeout(r, ms))
export const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(__dirname, '..')
fs.mkdirSync(path.join(ROOT, 'tmp'), { recursive: true })

process.env.ELYRA_BANNER ??= '0'
export const baileys = await import('elyra-baileys').catch(e => {
    throw new Error('elyra-baileys tidak ditemukan. Jalankan: npm i  (' + e.message + ')')
})
const B = baileys
export const makeWASocket = B.default ?? B.makeWASocket
export const {
    proto, areJidsSameUser, downloadContentFromMessage, generateForwardMessageContent,
    generateWAMessageFromContent, generateWAMessageContent, getDevice, WAMessageStubType,
    extractMessageContent, jidDecode, jidNormalizedUser
} = B

const MEDIA_KEYS = ['videoMessage', 'audioMessage', 'imageMessage', 'stickerMessage', 'documentMessage', 'ptvMessage']

export function findContextInfo(message) {
    const queue = [[message, 0]]
    while (queue.length) {
        const [o, d] = queue.shift()
        if (!o || typeof o !== 'object' || Buffer.isBuffer(o) || o instanceof Uint8Array || d > 5) continue
        const ci = o.contextInfo
        if (ci && typeof ci === 'object' && (ci.stanzaId || ci.quotedMessage)) return ci
        for (const k of Object.keys(o)) if (k !== 'contextInfo' && k !== 'quotedMessage') queue.push([o[k], d + 1])
    }
    return null
}

export function reviveBuffers(v) {
    if (!v || typeof v !== 'object') return v
    if (Buffer.isBuffer(v) || v instanceof Uint8Array) return v
    if (v.type === 'Buffer' && Array.isArray(v.data)) return Buffer.from(v.data)
    if (Array.isArray(v)) return v.map(reviveBuffers)
    const keys = Object.keys(v)
    if (keys.length > 8 && keys.every(k => /^\d+$/.test(k)) && typeof v[keys[0]] === 'number') return Buffer.from(Object.values(v))
    for (const k of keys) v[k] = reviveBuffers(v[k])
    return v
}

export function pickMedia(content) {
    if (!content || typeof content !== 'object') return null
    const c = extractMessageContent(content) || content
    for (const key of MEDIA_KEYS) {
        const node = c?.[key]
        if (node && (node.url || node.directPath)) return { key: key === 'ptvMessage' ? 'videoMessage' : key, node }
    }
    return null
}

if (!global.mediaCache) global.mediaCache = new Map()
export function cacheMediaMessage(msg) {
    try {
        const id = msg?.key?.id
        if (!id || !msg.message || !pickMedia(msg.message)) return
        global.mediaCache.set(id, { message: msg.message, chat: msg.key.remoteJid, fromMe: !!msg.key.fromMe, t: Date.now() })
        while (global.mediaCache.size > 300) global.mediaCache.delete(global.mediaCache.keys().next().value)
    } catch { }
}

export function lastCachedMedia(chat, kinds = /^(video|audio)Message$/, maxAgeMs = 15 * 60 * 1000) {
    let found = null
    for (const e of global.mediaCache.values()) {
        if (e.chat !== chat || e.fromMe || Date.now() - e.t > maxAgeMs) continue
        const d = pickMedia(e.message)
        if (d && kinds.test(d.key)) found = d
    }
    return found
}

export function findStoredMessage(conn, chat, id) {
    if (!id) return null
    const cached = global.mediaCache?.get(id)
    if (cached) return cached
    if (!conn) return null
    let raw = conn.chats?.[chat]?.messages?.[id]
    if (!raw) { try { raw = conn.loadMessage?.(id) } catch { } }
    return raw ? reviveBuffers(raw) : null
}

export { ffmpeg, toPTT, toAudio, toVideo }

const temp = process.platform === 'win32' ? process.env.TEMP : tmpdir();

export async function imageToWebp(media) {
	const tmpFileIn = path.join(temp, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.${media?.ext || 'png'}`);
	const tmpFileOut = path.join(temp, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

	fs.writeFileSync(tmpFileIn, media.data);

	try {
		await new Promise((resolve, reject) => {
			ff(tmpFileIn)
				.on('error', reject)
				.on('end', () => resolve(true))
				.addOutputOptions([
					'-vcodec', 'libwebp',
					'-threads', '2',
					'-sws_flags', 'lanczos',
					'-vf',
					"scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0",
				])
				.toFormat('webp')
				.saveToFile(tmpFileOut);
		});

		fs.promises.unlink(tmpFileIn);
		const buff = fs.readFileSync(tmpFileOut);
		fs.promises.unlink(tmpFileOut);

		return buff;
	} catch (e) {
		fs.existsSync(tmpFileIn) ? fs.promises.unlink(tmpFileIn) : '';
		fs.existsSync(tmpFileOut) ? fs.promises.unlink(tmpFileOut) : '';
		throw e;
	}
}

export async function videoToWebp(media) {
	const tmpFileIn = path.join(temp, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.${media?.ext || 'mp4'}`);
	const tmpFileOut = path.join(temp, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

	fs.writeFileSync(tmpFileIn, media.data);

	try {
		await new Promise((resolve, reject) => {
			ff(tmpFileIn)
				.on('error', reject)
				.on('end', () => resolve(true))
				.addOutputOptions([
					'-vcodec', 'libwebp',
					'-threads', '2',
					'-sws_flags', 'lanczos',
					'-vf',
					"scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0,fps=15",
					'-loop', '0',
					'-ss', '00:00:00',
					'-t', '00:00:10',
					'-preset', 'default',
					'-an',
					'-vsync', '0',
				])
				.toFormat('webp')
				.saveToFile(tmpFileOut);
		});

		fs.promises.unlink(tmpFileIn);
		const buff = fs.readFileSync(tmpFileOut);
		fs.promises.unlink(tmpFileOut);

		return buff;
	} catch (e) {
		fs.existsSync(tmpFileIn) ? fs.promises.unlink(tmpFileIn) : '';
		fs.existsSync(tmpFileOut) ? fs.promises.unlink(tmpFileOut) : '';
		throw e;
	}
}

export async function writeExif(media, metadata) {
	let wMedia = /webp/.test(media.mimetype) ? media.data : /image/.test(media.mimetype) ? await imageToWebp(media) : /video/.test(media.mimetype) ? await videoToWebp(media) : '';

	if (metadata && Object?.keys(metadata).length !== 0) {
		const img = new webp.Image();
		const json = {
			'sticker-pack-id': metadata?.packId || `RyzumiMD-${Date.now()}`,
			'sticker-pack-name': metadata?.packName || '',
			'sticker-pack-publisher': metadata?.packPublish || '',
			'android-app-store-link': metadata?.androidApp || 'https://github.com/Lynx-decode/ERINE-AI',
			'ios-app-store-link': metadata?.iOSApp || 'https://github.com/Lynx-decode/ERINE-AI',
			emojis: metadata?.emojis || ['😋', '😎', '🤣', '😂', '😁'],
			'is-avatar-sticker': metadata?.isAvatar || 0,
		};
		const exifAttr = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
		const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
		const exif = Buffer.concat([exifAttr, jsonBuff]);
		exif.writeUIntLE(jsonBuff.length, 14, 4);
		await img.load(wMedia);
		img.exif = exif;

		return await img.save(null);
	}
}

export const growth = Math.pow(Math.PI / Math.E, 1.618) * Math.E * .75
export function xpRange(level, multiplier = global.multiplier || 1) {
    if (level < 0)
        throw new TypeError('level tidak boleh bernilai negatif dari')
    level = Math.floor(level)
    let min = level === 0 ? 0 : Math.round(Math.pow(level, growth) * multiplier) + 1
    let max = Math.round(Math.pow(++level, growth) * multiplier)
    return {
        min,
        max,
        xp: max - min
    }
}
export function findLevel(xp, multiplier = global.multiplier || 1) {
    if (xp === Infinity)
        return Infinity
    if (isNaN(xp))
        return NaN
    if (xp <= 0)
        return -1
    let level = 0
    do
        level++
    while (xpRange(level, multiplier).min <= xp)
    return --level
}
export function canLevelUp(level, xp, multiplier = global.multiplier || 1) {
    if (level < 0)
        return false
    if (xp === Infinity)
        return true
    if (isNaN(xp))
        return false
    if (xp <= 0)
        return false
    return level < findLevel(xp, multiplier)
}

export { uploadPomf, uploadImage, uploadFile } from './uploader.js';

const ryzumiCDN = async (inp) => {
  try {
    const form = new FormData();
    const files = Array.isArray(inp) ? inp : [inp];

    for (const file of files) {
      const buffer = Buffer.isBuffer(file) ? file : file.buffer;
      if (!Buffer.isBuffer(buffer)) throw new Error('Invalid buffer format');

      const type = await fileTypeFromBuffer(buffer);
      if (!type) throw new Error('Unsupported file type');

      const originalName = (file.originalname || 'file').split('.').shift();

      form.append('file', buffer, {
        filename: `${originalName}.${type.ext}`,
        contentType: type.mime
      });
    }

    const res = await fetch(`${APIs.ryzumi}/api/uploader/ryzumicdn`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        ...form.getHeaders(),
      },
      body: form,
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Upload failed');

    return Array.isArray(inp) ? json.map(f => f.url) : json;
  } catch (error) {
    throw new Error(`RyzenCDN Error: ${error.message}`);
  }
};

export { ryzumiCDN };

/**
 * 
 * @param {Buffer|String} source 
 */

async function webp2mp4(source) {
  let form = new FormData
  let isUrl = typeof source === 'string' && /https?:\/\//.test(source)
  form.append('new-image-url', isUrl ? source : '')
  form.append('new-image', isUrl ? '' : source, 'image.webp')
  let res = await fetch('https://ezgif.com/webp-to-mp4', {
    method: 'POST',
    body: form
  })
  let html = await res.text()
  let { document } = new JSDOM(html).window
  let form2 = new FormData
  let obj = {}
  for (let input of document.querySelectorAll('form input[name]')) {
    obj[input.name] = input.value
    form2.append(input.name, input.value)
  }
  let res2 = await fetch('https://ezgif.com/webp-to-mp4/' + obj.file, {
    method: 'POST',
    body: form2
  })
  let html2 = await res2.text()
  let { document: document2 } = new JSDOM(html2).window
  return new URL(document2.querySelector('div#output > p.outfile > video > source').src, res2.url).toString()
}

async function webp2png(source) {
  let form = new FormData
  let isUrl = typeof source === 'string' && /https?:\/\//.test(source)
  form.append('new-image-url', isUrl ? source : '')
  form.append('new-image', isUrl ? '' : source, 'image.webp')
  let res = await fetch('https://ezgif.com/webp-to-png', {
    method: 'POST',
    body: form
  })
  let html = await res.text()
  let { document } = new JSDOM(html).window
  let form2 = new FormData
  let obj = {}
  for (let input of document.querySelectorAll('form input[name]')) {
    obj[input.name] = input.value
    form2.append(input.name, input.value)
  }
  let res2 = await fetch('https://ezgif.com/webp-to-png/' + obj.file, {
    method: 'POST',
    body: form2
  })
  let html2 = await res2.text()
  let { document: document2 } = new JSDOM(html2).window
  return new URL(document2.querySelector('div#output > p.outfile > img').src, res2.url).toString()
}

export { 
  webp2mp4, 
  webp2png
}

const stdouts = [];
const maxLength = 200;

export let isModified = false;
export const hookStdout = () => {
  const oldWrite = process.stdout.write.bind(process.stdout);
  const disable = () => {
    process.stdout.write = oldWrite;
    isModified = false;
  };
  process.stdout.write = (chunk, encoding, callback) => {
    stdouts.push(Buffer.from(chunk, encoding));
    oldWrite(chunk, encoding, callback);
    if (stdouts.length > maxLength) {
      stdouts.shift();
    }
  };
  isModified = true;
  return { disable };
};

export const logs = () => {
  return Buffer.concat(stdouts.length > 0 ? stdouts : [Buffer.from('')]);
};

export async function printLog(m, conn = { user: {} }) {
  try {
    const senderJid = (m.isGroup && m.fromMe) ? (conn.user?.jid || m.sender) : m.sender;
  const senderNumber = (senderJid || '').replace(/@.+$/, '');
  const plusPrefixed = senderNumber.startsWith('+') ? senderNumber : ('+' + senderNumber)
  const intl = PhoneNumber(plusPrefixed).getNumber('international') || plusPrefixed;
  const _name = await safeGetName(conn, senderJid);
  const sender = `${intl}${_name ? ' ~' + _name : ''}`;
  const chat = await safeGetName(conn, m.chat);

    const filesize = calculateFileSize(m);
  const user = global.db.data.users[senderJid] || global.db.data.users[m.sender];
  const myNumRaw = String(conn.user?.jid || '').replace('@s.whatsapp.net', '')
  const me = PhoneNumber(myNumRaw.startsWith('+') ? myNumRaw : ('+' + myNumRaw)).getNumber('international');
    logMessage(me, conn.user.name, m, chat, filesize, sender, user, conn);

    await handleTextFormatting(m, conn);
  } catch (error) {
    console.error('Error processing message:', error);
  }
}

async function safeGetName(conn, jid) {
  try {
    return await Promise.resolve(conn.getName(jid));
  } catch {
    return '';
  }
}

function calculateFileSize(m) {
  return (m.msg?.vcard?.length || m.msg?.fileLength?.low || m.msg?.text?.length || 0) || 0;
}

function logMessage(me, name, m, chat, filesize, sender, user, conn) {
  printMessageLog(m, conn, { chat })
}

async function handleTextFormatting(m, conn) {
  if (typeof m.text === 'string' && m.text) {
    let log = m.text.replace(/\u200e+/g, '');
  }
}

/**
 * @param {import('elyra-baileys').WASocket | import('elyra-baileys').WALegacySocket}
 */
function bind(conn) {
    if (!conn.chats) conn.chats = {}
    /**
     * 
     * @param {import('elyra-baileys').Contact[]|{contacts:import('elyra-baileys').Contact[]}} contacts 
     * @returns 
     */
    function updateNameToDb(contacts) {
        if (!contacts) return
        try {
            contacts = contacts.contacts || contacts
            for (const contact of contacts) {
                const id = conn.decodeJid(contact.id)
                if (!id || id === 'status@broadcast') continue
                let chats = conn.chats[id]
                if (!chats) chats = conn.chats[id] = { ...contact, id }
                conn.chats[id] = {
                    ...chats,
                    ...({
                        ...contact, id, ...(id.endsWith('@g.us') ?
                            { subject: contact.subject || contact.name || chats.subject || '' } :
                            { name: contact.notify || contact.name || chats.name || chats.notify || '' })
                    } || {})
                }
            }
        } catch (e) {
            console.error(e)
        }
    }
    conn.ev.on('contacts.upsert', updateNameToDb)
    conn.ev.on('groups.update', updateNameToDb)
    conn.ev.on('contacts.set', updateNameToDb)
    conn.ev.on('chats.set', async ({ chats }) => {
        try {
            for (let { id, name, readOnly } of chats) {
                id = conn.decodeJid(id)
                if (!id || id === 'status@broadcast') continue
                const isGroup = id.endsWith('@g.us')
                let chats = conn.chats[id]
                if (!chats) chats = conn.chats[id] = { id }
                chats.isChats = !readOnly
                if (name) chats[isGroup ? 'subject' : 'name'] = name
                if (isGroup) {
                    const metadata = await conn.groupMetadata(id).catch(_ => null)
                    if (name || metadata?.subject) chats.subject = name || metadata.subject
                    if (!metadata) continue
                    chats.metadata = metadata
                }
            }
        } catch (e) {
            console.error(e)
        }
    })
    conn.ev.on('group-participants.update', async function updateParticipantsToDb({ id, participants, action }) {
        if (!id) return
        id = conn.decodeJid(id)
        if (id === 'status@broadcast') return
        if (!(id in conn.chats)) conn.chats[id] = { id }
        let chats = conn.chats[id]
        chats.isChats = true
        const groupMetadata = await conn.groupMetadata(id).catch(_ => null)
        if (!groupMetadata) return
        chats.subject = groupMetadata.subject
        chats.metadata = groupMetadata
    })

    conn.ev.on('groups.update', async function groupUpdatePushToDb(groupsUpdates) {
        try {
            for (const update of groupsUpdates) {
                const id = conn.decodeJid(update.id)
                if (!id || id === 'status@broadcast') continue
                const isGroup = id.endsWith('@g.us')
                if (!isGroup) continue
                let chats = conn.chats[id]
                if (!chats) chats = conn.chats[id] = { id }
                chats.isChats = true
                const metadata = await conn.groupMetadata(id).catch(_ => null)
                if (metadata) chats.metadata = metadata
                if (update.subject || metadata?.subject) chats.subject = update.subject || metadata.subject
            }
        } catch (e) {
            console.error(e)
        }
    })
    conn.ev.on('chats.upsert', function chatsUpsertPushToDb(chatsUpsert) {
        try {
            const { id, name } = chatsUpsert
            if (!id || id === 'status@broadcast') return
            conn.chats[id] = { ...(conn.chats[id] || {}), ...chatsUpsert, isChats: true }
            const isGroup = id.endsWith('@g.us')
            if (isGroup) conn.insertAllGroup()
        } catch (e) {
            console.error(e)
        }
    })
    conn.ev.on('presence.update', async function presenceUpdatePushToDb({ id, presences }) {
        try {
            const sender = Object.keys(presences)[0] || id
            const _sender = conn.decodeJid(sender)
            const presence = presences[sender]['lastKnownPresence'] || 'composing'
            let chats = conn.chats[_sender]
            if (!chats) chats = conn.chats[_sender] = { id: sender }
            chats.presences = presence
            if (id.endsWith('@g.us')) {
                let chats = conn.chats[id]
                if (!chats) {
                    const metadata = await conn.groupMetadata(id).catch(_ => null)
                    if (metadata) chats = conn.chats[id] = { id, subject: metadata.subject, metadata, isChats: true }
                }
            }
        } catch (e) {
            console.error(e)
        }
    })
}
const store = { bind }

/**
 * @type {import('elyra-baileys')}
 */

export function extendSocket(rawSock, options = {}) {
    if (!rawSock) throw new Error('extendSocket: socket kosong')
    if (rawSock.__erine) return rawSock
    let conn = rawSock
    const _origSendMessage = conn.sendMessage.bind(conn)

    let sock = Object.defineProperties(conn, {
        sendMessage: {
            async value(jid, content = {}, options = {}) {
                try {
                    const normalize = async (val) => {
                        if (val && typeof val === 'object' && typeof val.url === 'string') {
                            const type = await conn.getFile(val.url, false)
                            return type.data
                        }
                        if (typeof val === 'string') {
                            const type = await conn.getFile(val, false)
                            return type.data
                        }
                        return val
                    }

                    const msg = { ...content }
                    const mediaKeys = ['image', 'video', 'audio', 'document', 'sticker']
                    for (const key of mediaKeys) {
                        if (key in msg) {
                            const before = msg[key]
                            const after = await normalize(before)
                            if (after !== before) msg[key] = after
                        }
                    }

                    if (Buffer.isBuffer(msg.audio)) {
                        try { Object.assign(msg, await prepareAudioMessage(msg)) }
                        catch (e) { console.error('[AUDIO] gagal membuat waveform:', e?.message || e) }
                    }

                    const sendOpts = { upload: conn.waUploadToServer, ...options }
                    return await _origSendMessage(jid, msg, sendOpts)
                } catch (e) {
                    return await _origSendMessage(jid, content, options)
                }
            }
        },
        chats: {
            value: { ...(options.chats || {}) },
            writable: true
        },
        decodeJid: {
            value(jid) {
                if (!jid || typeof jid !== 'string') return (!nullish(jid) && jid) || null
                return jid.decodeJid()
            }
        },
        getJid: {
            value(sender) {
                if (!sender) return sender
                const id = conn.identity
                if (id) return id.toPnOrSelf(sender)
                if (!conn.isLid) conn.isLid = {}
                const s = String(sender).decodeJid()
                if (conn.isLid[s]) return conn.isLid[s]
                if (/^\d+$/.test(s)) return `${s}@s.whatsapp.net`
                return s
            }
        },
        resolveJid: { value: (x) => conn.identity ? conn.identity.resolve(x).then(r => r ?? conn.getJid(x)) : Promise.resolve(conn.getJid(x)) },
        getNumber: { value: (x) => conn.identity?.number(x) ?? String(conn.getJid(x) || '').split('@')[0] ?? null },
        getTag: { value: (x) => conn.identity?.tag(x) ?? '@' + String(x || '').split('@')[0] },
        logger: {
            get() {
                return {
                    info(...args) {
                        console.log(
                            chalk.bold.bgRgb(51, 204, 51)('INFO '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.cyan(format(...args))
                        )
                    },
                    error(...args) {
                        console.log(
                            chalk.bold.bgRgb(247, 38, 33)('ERROR '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.rgb(255, 38, 0)(format(...args))
                        )
                    },
                    warn(...args) {
                        console.log(
                            chalk.bold.bgRgb(255, 153, 0)('WARNING '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.redBright(format(...args))
                        )
                    },
                    trace(...args) {
                        console.log(
                            chalk.grey('TRACE '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.white(format(...args))
                        )
                    },
                    debug(...args) {
                        console.log(
                            chalk.bold.bgRgb(66, 167, 245)('DEBUG '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.white(format(...args))
                        )
                    }
                }
            },
            enumerable: true
        },
        getFile: {
            /**
             * getBuffer hehe
             * @param {fs.PathLike | Buffer | string} PATH - The path to the file, or a URL, or a base64 string, or a buffer
             * @param {Boolean} saveToFile - Whether to save the file locally
             * @returns {Promise<Object>} - An object containing file data, type, and utility functions
             */
            async value(PATH, saveToFile = false) {
                try {
                    let res, filename;
                    let data = Buffer.isBuffer(PATH)
                        ? PATH
                        : PATH instanceof ArrayBuffer
                            ? Buffer.from(PATH)
                            : /^data:.*?\/.*?;base64,/i.test(PATH)
                                ? Buffer.from(PATH.split(',')[1], 'base64')
                                : /^https?:\/\//.test(PATH)
                                    ? (res = await fetch(PATH, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36' } }), Buffer.from(await res.arrayBuffer()))
                                    : fs.existsSync(PATH)
                                        ? (filename = PATH, fs.readFileSync(PATH))
                                        : typeof PATH === 'string'
                                            ? Buffer.from(PATH)
                                            : Buffer.alloc(0);

                    if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer');

                    const type = await fileTypeFromBuffer(data) || {
                        mime: 'application/octet-stream',
                        ext: 'bin'
                    };

                    if (data && saveToFile && !filename) {
                        filename = path.join(__dirname, '../tmp/' + Date.now() + '.' + type.ext);
                        await fs.promises.writeFile(filename, data);
                    }

                    return {
                        res,
                        filename,
                        ...type,
                        data,
                        deleteFile() {
                            return filename && fs.promises.unlink(filename);
                        }
                    };
                } catch (err) {
                    console.error('Error in getFile:', err);
                    throw new Error('Failed to process the file: ' + err.message);
                }
            },
            enumerable: true
        },
        waitEvent: {
            /**
             * Wait for a specific event to be emitted
             * @param {String} eventName - The name of the event to wait for
             * @param {Function} is - A function that returns true when the desired condition is met
             * @param {Number} maxTries - The maximum number of attempts to wait for the event (default: 25)
             * @param {Number} timeoutMs - Optional timeout in milliseconds (default: 5000 ms)
             * @returns {Promise<*>} - Resolves with event data if successful, or rejects with an error
             */
            value(eventName, is = () => true, maxTries = 25, timeoutMs = 5000) {
                return new Promise((resolve, reject) => {
                    let tries = 0;
                    let timeout;

                    const onEvent = (...args) => {
                        tries++;
                        if (is(...args)) {
                            clearTimeout(timeout);
                            conn.ev.off(eventName, onEvent);
                            resolve(...args);
                        } else if (tries >= maxTries) {
                            clearTimeout(timeout);
                            conn.ev.off(eventName, onEvent);
                            reject(new Error(`Max tries reached for event: ${eventName}`));
                        }
                    };

                    conn.ev.on(eventName, onEvent);

                    timeout = setTimeout(() => {
                        conn.ev.off(eventName, onEvent);
                        reject(new Error(`Timeout reached for event: ${eventName}`));
                    }, timeoutMs);
                });
            },
            enumerable: true
        },
        sendFile: {
            /**
             * Send Media/File with Automatic Type Specifier
             * @param {String} jid - WhatsApp JID to send the message to
             * @param {String|Buffer} path - The path to the file or a buffer
             * @param {String} filename - The name of the file (optional)
             * @param {String} caption - The caption for the media (optional)
             * @param {import('elyra-baileys').proto.WebMessageInfo} quoted - Message to reply to (optional)
             * @param {Boolean} ptt - If the file is a voice note
             * @param {Object} options - Additional options for sending media
             * @returns {Promise<import('elyra-baileys').proto.WebMessageInfo>}
             */
            async value(jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) {
                try {
                    let type = await conn.getFile(path, true);
                    let { res, data: file, filename: pathFile } = type;

                    if (res && res.status !== 200 || file.length <= 65536) {
                        try { throw { json: JSON.parse(file.toString()) } }
                        catch (e) { if (e.json) throw e.json }
                    }

                    const getMimeType = function (mime, options) {
                        if (/webp/.test(mime) || (options.asSticker && /image/.test(mime))) return 'sticker';
                        if (/image/.test(mime) || (options.asImage && /webp/.test(mime))) return 'image';
                        if (/video/.test(mime)) return 'video';
                        if (/audio/.test(mime)) return 'audio';
                        return 'document';
                    };
                    let mtype = getMimeType(type.mime, options);
                    let mimetype = options.mimetype || type.mime;

                    if (/audio/.test(type.mime)) mtype = 'audio';

                    let message = {
                        caption,
                        ptt,
                        [mtype]: file,
                        mimetype,
                        fileName: filename || (pathFile ? pathFile.split('/').pop() : undefined),
                        ...options
                    };

                    let opt = { filename, quoted, ptt, upload: conn.waUploadToServer, ...options };
                    let m = await conn.sendMessage(jid, message, opt);

                    return m;
                } catch (err) {
                    console.error('Failed to send file:', err);
                    throw new Error('Failed to send media file: ' + err.message);
                }
            },
            enumerable: true
        },
        sendSticker: {
            async value(jid, path, quoted, exif = {}) {
                const { data, mime } = await conn.getFile(path)
                if (!data || data.length === 0) throw new TypeError('File Tidak Ditemukan')
                const meta = {
                    packName: (exif.packName ?? exif.packname ?? global.stickpack) || '',
                    packPublish: (exif.packPublish ?? exif.packpublish ?? global.stickauth) || ''
                }
                const sticker = await (await import('./exif.js')).writeExif({ mimetype: mime, data }, meta)
                return conn.sendMessage(jid, { sticker }, { quoted, upload: conn.waUploadToServer })
            },
        },
        sendContact: {
            /**
             * Send Contact
             * @param {String} jid - WhatsApp JID to send the message to
             * @param {String[][]|String[]} data - Array of contacts [[number, name], ...] or a single contact [number, name]
             * @param {import('elyra-baileys').proto.WebMessageInfo} quoted - The message to reply to (optional)
             * @param {Object} options - Additional options for sending the message
             * @returns {Promise<import('elyra-baileys').proto.WebMessageInfo>}
             */
            async value(jid, data, quoted, options = {}) {
                try {
                    if (!Array.isArray(data[0]) && typeof data[0] === 'string') data = [data];

                    let contacts = [];
                    for (let [number, name] of data) {
                        number = number.replace(/[^0-9]/g, '');
                        if (!number) throw new Error('Invalid phone number provided.');

                        let njid = number + '@s.whatsapp.net';

                        let biz = await conn.getBusinessProfile(njid).catch(_ => null) || {};
                        let vname = conn.chats[njid]?.vname || conn.getName(njid) || name;
                        let bizDescription = biz.description ? `\nX-WA-BIZ-NAME:${vname}\nX-WA-BIZ-DESCRIPTION:${biz.description.replace(/\n/g, '\\n')}` : '';

                        let vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${name.replace(/\n/g, '\\n')}
TEL;type=CELL;type=VOICE;waid=${number}:${PhoneNumber('+' + number).getNumber('international')}${bizDescription}
END:VCARD`.trim();

                        contacts.push({ vcard, displayName: name });
                    }

                    return await conn.sendMessage(jid, {
                        ...options,
                        contacts: {
                            displayName: (contacts.length > 1 ? `${contacts.length} contacts` : contacts[0].displayName) || null,
                            contacts
                        }
                    }, { quoted, ...options });
                } catch (err) {
                    console.error('Error in sendContact:', err);
                    throw new Error('Failed to send contact: ' + err.message);
                }
            },
            enumerable: true
        },
        sendContactArray: {
            /**
             * Send multiple contacts with additional information (vCard format)
             * @param {String} jid - WhatsApp JID to send the message to
             * @param {String[][]} data - Array of contacts [[number, name, org, label, email, address, website, label2], ...]
             * @param {import('elyra-baileys').proto.WebMessageInfo} quoted - The message to reply to (optional)
             * @param {Object} options - Additional options for sending the message
             * @returns {Promise<import('elyra-baileys').proto.WebMessageInfo>}
             */
            async value(jid, data, quoted, options = {}) {
                try {
                    let contacts = [];
                    for (let [number, name, org, label, email, address, website, label2] of data) {
                        number = number.replace(/[^0-9]/g, '');
                        if (!number) throw new Error('Invalid phone number provided.');

                        let njid = number + '@s.whatsapp.net';

                        let biz = await conn.getBusinessProfile(njid).catch(_ => null) || {};
                        let vname = conn.chats[njid]?.vname || conn.getName(njid) || name;
                        let bizDescription = biz.description ? `\nX-WA-BIZ-NAME:${vname}\nX-WA-BIZ-DESCRIPTION:${biz.description.replace(/\n/g, '\\n')}` : '';

                        let vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${name.replace(/\n/g, '\\n')}
ORG:${org || ''}
TEL;type=CELL;type=VOICE;waid=${number}:${PhoneNumber('+' + number).getNumber('international')}
item1.EMAIL;type=INTERNET:${email || ''}
item1.X-ABLabel:📧 Email
item2.ADR:;;${address || ''};;;;
item2.X-ABADR:ac
item2.X-ABLabel:📍 Region
item3.URL:${website || ''}
item3.X-ABLabel:Website
item4.X-ABLabel:${label2 || ''}
${bizDescription}
END:VCARD`.trim();

                        contacts.push({ vcard, displayName: name });
                    }

                    return await conn.sendMessage(jid, {
                        ...options,
                        contacts: {
                            displayName: (contacts.length > 1 ? `${contacts.length} contacts` : contacts[0].displayName) || null,
                            contacts
                        }
                    }, { quoted, ...options });
                } catch (err) {
                    console.error('Error in sendContactArray:', err);
                    throw new Error('Failed to send contact array: ' + err.message);
                }
            },
            enumerable: true
        },
        /** Resize Image
          *
          * @param {Buffer} Buffer (Only Image)
          * @param {Numeric} Width
          * @param {Numeric} Height
          */
        resize: {
            async value(image, width, height) {
                let oyy = await Jimp.read(image)
                let kiyomasa = await oyy.resize(width, height).getBufferAsync(Jimp.MIME_JPEG)
                return kiyomasa
            }
        },
        reply: {
            /**
             * Reply to a message
             * @param {String} jid
             * @param {String|Buffer} text
             * @param {import('elyra-baileys').proto.WebMessageInfo} quoted
             * @param {Object} options
             */
            value(jid, text = '', quoted, options) {
                if (String(jid).endsWith('@newsletter') && !Buffer.isBuffer(text)) return conn.sendMessage(jid, { text: String(text) })
                return Buffer.isBuffer(text) ? conn.sendFile(jid, text, 'file', '', quoted, false, options) : conn.sendMessage(jid, {
                    ...options,
                    text,
                    contextInfo: {
                        mentionedJid: conn.parseMention(text),
                        ...(global.adReply?.contextInfo || {})
                    },
                    ...options
                }, {
                    quoted,
                    ephemeralExpiration: global.ephemeral,
                    ...options
                })
            }
        },
        sendMedia: {
            /**
             * Send Media/File with Automatic Type Specifier
             * @param {String} jid - WhatsApp JID to send the message to
             * @param {String|Buffer} path - The path to the file or a buffer
             * @param {import('elyra-baileys').proto.WebMessageInfo} quoted - Message to reply to (optional)
             * @param {Object} options - Additional options for sending media
             * @returns {Promise<import('elyra-baileys').proto.WebMessageInfo>}
             */
            async value(jid, path, quoted, options = {}) {
                try {
                    let type = await conn.getFile(path, true);
                    let { ext, mime, data: file } = type;

                    if (!mime) throw new Error('File type could not be determined.');
                    let messageType = mime.split('/')[0];

                    /**
             * Helper to determine the media type
             * @param {String} mime - The MIME type of the file
             * @param {Object} options - Options that may affect media type selection
             * @returns {String} - The media type ('image', 'video', 'audio', 'document')
             */
                    let getMediaType = function (mime, options) {
                        if (options.asDocument) return 'document';
                        if (/image/.test(mime)) return 'image';
                        if (/video/.test(mime)) return 'video';
                        if (/audio/.test(mime)) return 'audio';
                        return null;
                    }

                    let mediaType = getMediaType(mime, options);
                    if (!mediaType) throw new Error('Unsupported media type.');

                    let message = {
                        [mediaType]: file,
                        mimetype: mime,
                        fileName: options.fileName || path.split('/').pop(),
                        ...options
                    };

                    return await conn.sendMessage(jid, message, { quoted });
                } catch (err) {
                    console.error('Error in sendMedia:', err);
                    throw new Error('Failed to send media: ' + err.message);
                }
            },
            enumerable: true
        },
        updateProfileStatus: {
            async value(status) {
                return await conn.query({
                    tag: 'iq',
                    attrs: {
                        to: 's.whatsapp.net',
                        type: 'set',
                        xmlns: 'status',
                    },
                    content: [
                        {
                            tag: 'status',
                            attrs: {},
                            content: Buffer.from(status, 'utf-8')
                        }
                    ]
                })
            }
        },
        sendButton: {
            /**
             * send Button
             * @param {String} jid
             * @param {String} text
             * @param {String} footer
             * @param {Buffer} buffer
             * @param {String[] | String[][]} buttons
             * @param {import('elyra-baileys').proto.WebMessageInfo} quoted
             * @param {Object} options
             */
            async value(jid, text = '', footer = '', buffer, buttons, quoted, options) {
                let type
                if (Array.isArray(buffer)) (options = quoted, quoted = buttons, buttons = buffer, buffer = null)
                else if (buffer) try { (type = await conn.getFile(buffer), buffer = type.data) } catch { buffer = null }
                if (!Array.isArray(buttons[0]) && typeof buttons[0] === 'string') buttons = [buttons]
                if (!options) options = {}
                let message = {
                    ...options,
                    [buffer ? 'caption' : 'text']: text || '',
                    footer,
                    buttons: buttons.map(btn => ({
                        buttonId: !nullish(btn[1]) && btn[1] || !nullish(btn[0]) && btn[0] || '',
                        buttonText: {
                            displayText: !nullish(btn[0]) && btn[0] || !nullish(btn[1]) && btn[1] || ''
                        }
                    })),
                    ...(buffer ?
                        options.asLocation && /image/.test(type.mime) ? {
                            location: {
                                ...options,
                                jpegThumbnail: buffer
                            }
                        } : {
                            [/video/.test(type.mime) ? 'video' : /image/.test(type.mime) ? 'image' : 'document']: buffer
                        } : {})
                }

                return await conn.sendMessage(jid, message, {
                    quoted,
                    upload: conn.waUploadToServer,
                    ...options
                })
            },
            enumerable: true
        },
        sendPayment: {
            async value(jid, amount, currency, text = '', from, image, options) {
                let file = await conn.resize(image, 300, 150)
                let a = ["AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN", "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BOV", "BRL", "BSD", "BTN", "BWP", "BYR", "BZD", "CAD", "CDF", "CHE", "CHF", "CHW", "CLF", "CLP", "CNY", "COP", "COU", "CRC", "CUC", "CUP", "CVE", "CZK", "DJF", "DKK", "DOP", "DZD", "EGP", "ERN", "ETB", "EUR", "FJD", "FKP", "GBP", "GEL", "GHS", "GIP", "GMD", "GNF", "GTQ", "GYD", "HKD", "HNL", "HRK", "HTG", "HUF", "IDR", "ILS", "INR", "IQD", "IRR", "ISK", "JMD", "JOD", "JPY", "KES", "KGS", "KHR", "KMF", "KPW", "KRW", "KWD", "KYD", "KZT", "LAK", "LBP", "LKR", "LRD", "LSL", "LTL", "LVL", "LYD", "MAD", "MDL", "MGA", "MKD", "MMK", "MNT", "MOP", "MRO", "MUR", "MVR", "MWK", "MXN", "MXV", "MYR", "MZN", "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB", "PEN", "PGK", "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "RWF", "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLL", "SOS", "SRD", "SSP", "STD", "SYP", "SZL", "THB", "TJS", "TMT", "TND", "TOP", "TRY", "TTD", "TWD", "TZS", "UAH", "UGX", "USD", "USN", "USS", "UYI", "UYU", "UZS", "VEF", "VND", "VUV", "WST", "XAF", "XAG", "XAU", "XBA", "XBB", "XBC", "XBD", "XCD", "XDR", "XFU", "XOF", "XPD", "XPF", "XPT", "XTS", "XXX", "YER", "ZAR", "ZMW"]
                let b = a[Math.floor(Math.random() * a.length)]
                const requestPaymentMessage = {
                    amount: {
                        currencyCode: currency || b,
                        offset: 0,
                        value: amount || 9.99
                    },
                    expiryTimestamp: 0,
                    amount1000: (amount || 9.99) * 1000,
                    currencyCodeIso4217: currency || b,
                    requestFrom: from || '0@s.whatsapp.net',
                    noteMessage: {
                        extendedTextMessage: {
                            text: text || 'Example Payment Message'
                        }
                    },
                    background: !!image ? file : undefined
                };
                return await conn.relayMessage(jid, { requestPaymentMessage }, { ...options });
            }
        },
        sendPoll: {
            async value(jid, name = '', optiPoll, options) {
                if (!Array.isArray(optiPoll[0]) && typeof optiPoll[0] === 'string') optiPoll = [optiPoll]
                if (!options) options = {}
                const pollMessage = {
                    name: name,
                    options: optiPoll.map(btn => ({
                        optionName: !nullish(btn[0]) && btn[0] || ''
                    })),
                    selectableOptionsCount: 1
                }
                return conn.relayMessage(jid, { pollCreationMessage: pollMessage }, { ...options });
            }
        },
        downloadAndSaveMediaMessage: {
            /**
             * Download and save a media message to a file
             * @param {import('elyra-baileys').proto.WebMessageInfo} message - The message containing media
             * @param {String} filename - The base name of the file to save
             * @param {Boolean} attachExtension - Whether to attach the file extension based on the media type
             * @returns {Promise<String>} - The path to the saved file
             */
            async value(message, filename, attachExtension = true) {
                try {
                    let quoted = message.msg || message;
                    let mime = (message.msg || message).mimetype || '';
                    let messageType = mime.split('/')[0];

                    if (!['image', 'video', 'audio', 'document'].includes(messageType)) {
                        throw new Error('Message does not contain downloadable media.');
                    }

                    const dlType = messageType === 'sticker' ? 'image' : messageType;
                    let stream;
                    try {
                        stream = await downloadContentFromMessage(quoted, dlType);
                    } catch (e) {
                        if (/readableStream/i.test(String(e?.message)) && /PassThrough/i.test(String(e?.message))) {
                            const nodeStream = await import('stream');
                            const origFromWeb = nodeStream.Readable.fromWeb?.bind(nodeStream.Readable);
                            if (origFromWeb) {
                                try {
                                    nodeStream.Readable.fromWeb = function (rs, opts) {
                                        if (rs && typeof rs.getReader !== 'function') return rs;
                                        return origFromWeb(rs, opts);
                                    };
                                    stream = await downloadContentFromMessage(quoted, dlType);
                                } finally {
                                    nodeStream.Readable.fromWeb = origFromWeb;
                                }
                            } else {
                                throw e;
                            }
                        } else {
                            throw e;
                        }
                    }

                    const toBuffer = async (s) => {
                        if (s && typeof s.getReader === 'function') {
                            const reader = s.getReader();
                            const chunks = [];
                            for (; ;) {
                                const { value, done } = await reader.read();
                                if (done) break;
                                if (value) chunks.push(Buffer.from(value));
                            }
                            return Buffer.concat(chunks);
                        }
                        if (s && typeof s[Symbol.asyncIterator] === 'function') {
                            const chunks = [];
                            for await (const chunk of s) {
                                chunks.push(Buffer.from(chunk));
                            }
                            return Buffer.concat(chunks);
                        }
                        throw new Error('Unsupported stream type from downloadContentFromMessage');
                    };

                    const buffer = await toBuffer(stream);

                    let fileType = await fileTypeFromBuffer(buffer);
                    if (!fileType) {
                        fileType = { ext: 'bin', mime: 'application/octet-stream' };
                    }

                    const trueFileName = attachExtension ? `${filename}.${fileType.ext}` : filename;

                    await fs.promises.writeFile(trueFileName, buffer);

                    return trueFileName;
                } catch (err) {
                    console.error('Error downloading and saving media message:', err);
                    throw new Error('Failed to download and save media message: ' + err.message);
                }
            },
            enumerable: true
        },
        sendHydrated: {
            /**
             * 
             * @param {String} jid 
             * @param {String} text 
             * @param {String} footer 
             * @param {fs.PathLike} buffer
             * @param {String|string[]} url
             * @param {String|string[]} urlText
             * @param {String|string[]} call
             * @param {String|string[]} callText
             * @param {String[][]} buttons
             * @param {import('elyra-baileys').proto.WebMessageInfo} quoted
             * @param {Object} options
             */
            async value(jid, text = '', footer = '', buffer, url, urlText, call, callText, buttons, quoted, options) {
                let type
                if (buffer) try { (type = await conn.getFile(buffer), buffer = type.data) } catch { buffer = buffer }
                if (buffer && !Buffer.isBuffer(buffer) && (typeof buffer === 'string' || Array.isArray(buffer))) (options = quoted, quoted = buttons, buttons = callText, callText = call, call = urlText, urlText = url, url = buffer, buffer = null)
                if (!options) options = {}
                let templateButtons = []
                if (url || urlText) {
                    if (!Array.isArray(url)) url = [url]
                    if (!Array.isArray(urlText)) urlText = [urlText]
                    templateButtons.push(...(
                        url.map((v, i) => [v, urlText[i]])
                            .map(([url, urlText], i) => ({
                                index: templateButtons.length + i + 1,
                                urlButton: {
                                    displayText: !nullish(urlText) && urlText || !nullish(url) && url || '',
                                    url: !nullish(url) && url || !nullish(urlText) && urlText || ''
                                }
                            })) || []
                    ))
                }
                if (call || callText) {
                    if (!Array.isArray(call)) call = [call]
                    if (!Array.isArray(callText)) callText = [callText]
                    templateButtons.push(...(
                        call.map((v, i) => [v, callText[i]])
                            .map(([call, callText], i) => ({
                                index: templateButtons.length + i + 1,
                                callButton: {
                                    displayText: !nullish(callText) && callText || !nullish(call) && call || '',
                                    phoneNumber: !nullish(call) && call || !nullish(callText) && callText || ''
                                }
                            })) || []
                    ))
                }
                if (buttons.length) {
                    if (!Array.isArray(buttons[0])) buttons = [buttons]
                    templateButtons.push(...(
                        buttons.map(([text, id], index) => ({
                            index: templateButtons.length + index + 1,
                            quickReplyButton: {
                                displayText: !nullish(text) && text || !nullish(id) && id || '',
                                id: !nullish(id) && id || !nullish(text) && text || ''
                            }
                        })) || []
                    ))
                }
                let message = {
                    ...options,
                    [buffer ? 'caption' : 'text']: text || '',
                    footer,
                    templateButtons,
                    ...(buffer ?
                        options.asLocation && /image/.test(type.mime) ? {
                            location: {
                                ...options,
                                jpegThumbnail: buffer
                            }
                        } : {
                            [/video/.test(type.mime) ? 'video' : /image/.test(type.mime) ? 'image' : 'document']: buffer
                        } : {})
                }
                return await conn.sendMessage(jid, message, {
                    quoted,
                    upload: conn.waUploadToServer,
                    ...options
                })
            },
            enumerable: true
        },
        sendHydrated2: {
            /**
             * 
             * @param {String} jid 
             * @param {String} text 
             * @param {String} footer 
             * @param {fs.PathLike} buffer
             * @param {String|string[]} url
             * @param {String|string[]} urlText
             * @param {String|string[]} call
             * @param {String|string[]} callText
             * @param {String[][]} buttons
             * @param {import('elyra-baileys').proto.WebMessageInfo} quoted
             * @param {Object} options
             */
            async value(jid, text = '', footer = '', buffer, url, urlText, url2, urlText2, buttons, quoted, options) {
                let type
                if (buffer) try { (type = await conn.getFile(buffer), buffer = type.data) } catch { buffer = buffer }
                if (buffer && !Buffer.isBuffer(buffer) && (typeof buffer === 'string' || Array.isArray(buffer))) (options = quoted, quoted = buttons, buttons = callText, callText = call, call = urlText, urlText = url, url = buffer, buffer = null)
                if (!options) options = {}
                let templateButtons = []
                if (url || urlText) {
                    if (!Array.isArray(url)) url = [url]
                    if (!Array.isArray(urlText)) urlText = [urlText]
                    templateButtons.push(...(
                        url.map((v, i) => [v, urlText[i]])
                            .map(([url, urlText], i) => ({
                                index: templateButtons.length + i + 1,
                                urlButton: {
                                    displayText: !nullish(urlText) && urlText || !nullish(url) && url || '',
                                    url: !nullish(url) && url || !nullish(urlText) && urlText || ''
                                }
                            })) || []
                    ))
                }
                if (url2 || urlText2) {
                    if (!Array.isArray(url2)) url2 = [url2]
                    if (!Array.isArray(urlText2)) urlText2 = [urlText2]
                    templateButtons.push(...(
                        url2.map((v, i) => [v, urlText2[i]])
                            .map(([url2, urlText2], i) => ({
                                index: templateButtons.length + i + 1,
                                urlButton: {
                                    displayText: !nullish(urlText2) && urlText2 || !nullish(url2) && url2 || '',
                                    url: !nullish(url2) && url2 || !nullish(urlText2) && urlText2 || ''
                                }
                            })) || []
                    ))
                }
                if (buttons.length) {
                    if (!Array.isArray(buttons[0])) buttons = [buttons]
                    templateButtons.push(...(
                        buttons.map(([text, id], index) => ({
                            index: templateButtons.length + index + 1,
                            quickReplyButton: {
                                displayText: !nullish(text) && text || !nullish(id) && id || '',
                                id: !nullish(id) && id || !nullish(text) && text || ''
                            }
                        })) || []
                    ))
                }
                let message = {
                    ...options,
                    [buffer ? 'caption' : 'text']: text || '',
                    footer,
                    templateButtons,
                    ...(buffer ?
                        options.asLocation && /image/.test(type.mime) ? {
                            location: {
                                ...options,
                                jpegThumbnail: buffer
                            }
                        } : {
                            [/video/.test(type.mime) ? 'video' : /image/.test(type.mime) ? 'image' : 'document']: buffer
                        } : {})
                }
                return await conn.sendMessage(jid, message, {
                    quoted,
                    upload: conn.waUploadToServer,
                    ...options
                })
            },
            enumerable: true
        },
        /**
     * ms to date
     * @param {String} ms
     */
        msToDate: {
            async value(ms) {
                let days = Math.floor(ms / (24 * 60 * 60 * 1000));
                let daysms = ms % (24 * 60 * 60 * 1000);
                let hours = Math.floor((daysms) / (60 * 60 * 1000));
                let hoursms = ms % (60 * 60 * 1000);
                let minutes = Math.floor((hoursms) / (60 * 1000));
                let minutesms = ms % (60 * 1000);
                let sec = Math.floor((minutesms) / (1000));
                return days + " Hari " + hours + " Jam " + minutes + " Menit";
            }
        },
        delay: {
            async value(ms) {
                return new Promise((resolve, reject) => setTimeout(resolve, ms)
                )
            }
        },
        cMod: {
            /**
             * cMod
             * @param {String} jid 
             * @param {import('elyra-baileys').proto.WebMessageInfo} message 
             * @param {String} text 
             * @param {String} sender 
             * @param {*} options 
             * @returns 
             */
            value(jid, message, text = '', sender = conn.user.jid, options = {}) {
                if (options.mentions && !Array.isArray(options.mentions)) options.mentions = [options.mentions]
                let copy = message.toJSON()
                delete copy.message.messageContextInfo
                delete copy.message.senderKeyDistributionMessage
                let mtype = Object.keys(copy.message)[0]
                let msg = copy.message
                let content = msg[mtype]
                if (typeof content === 'string') msg[mtype] = text || content
                else if (content.caption) content.caption = text || content.caption
                else if (content.text) content.text = text || content.text
                if (typeof content !== 'string') {
                    msg[mtype] = { ...content, ...options }
                    msg[mtype].contextInfo = {
                        ...(content.contextInfo || {}),
                        mentionedJid: options.mentions || content.contextInfo?.mentionedJid || []
                    }
                }
                if (copy.participant) sender = copy.participant = sender || copy.participant
                else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
                if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
                else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
                copy.key.remoteJid = jid
                copy.key.fromMe = areJidsSameUser(sender, conn.user.id) || false
                return proto.WebMessageInfo.create(copy)
            },
            enumerable: true
        },
        copyNForward: {
            /**
             * Exact Copy Forward
             * @param {String} jid
             * @param {import('elyra-baileys').proto.WebMessageInfo} message
             * @param {Boolean|Number} forwardingScore
             * @param {Object} options
             */
            async value(jid, message, forwardingScore = true, options = {}) {
                let vtype
                if (options.readViewOnce && message.message.viewOnceMessage?.message) {
                    vtype = Object.keys(message.message.viewOnceMessage.message)[0]
                    delete message.message.viewOnceMessage.message[vtype].viewOnce
                    message.message = proto.Message.create(
                        JSON.parse(JSON.stringify(message.message.viewOnceMessage.message))
                    )
                    message.message[vtype].contextInfo = message.message.viewOnceMessage.contextInfo
                }
                let mtype = Object.keys(message.message)[0]
                let m = generateForwardMessageContent(message, !!forwardingScore)
                let ctype = Object.keys(m)[0]
                if (forwardingScore && typeof forwardingScore === 'number' && forwardingScore > 1) m[ctype].contextInfo.forwardingScore += forwardingScore
                m[ctype].contextInfo = {
                    ...(message.message[mtype].contextInfo || {}),
                    ...(m[ctype].contextInfo || {})
                }
                m = generateWAMessageFromContent(jid, m, {
                    ...options,
                    userJid: conn.user.jid
                })
                await conn.relayMessage(jid, m.message, { messageId: m.key.id, additionalAttributes: { ...options } })
                return m
            },
            enumerable: true
        },
        fakeReply: {
            /**
             * Fake Replies
             * @param {String} jid
             * @param {String|Object} text
             * @param {String} fakeJid
             * @param {String} fakeText
             * @param {String} fakeGroupJid
             * @param {String} options
             */
            value(jid, text = '', fakeJid = this.user.jid, fakeText = '', fakeGroupJid, options) {
                return conn.reply(jid, text, { key: { fromMe: areJidsSameUser(fakeJid, conn.user.id), participant: fakeJid, ...(fakeGroupJid ? { remoteJid: fakeGroupJid } : {}) }, message: { conversation: fakeText }, ...options })
            }
        },
        downloadM: {
            /**
             * Download media message
             * @param {Object} m - The message object containing media
             * @param {String} type - The type of media to download (e.g., 'image', 'video', 'audio', 'document')
             * @param {fs.PathLike | fs.promises.FileHandle} saveToFile - Path to save the downloaded file (optional)
             * @returns {Promise<fs.PathLike | fs.promises.FileHandle | Buffer>} - Returns path to file or buffer
             */
            async value(m, type, saveToFile) {
                const retryable = /fetch failed|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|socket|terminated|UND_ERR/i
                const downloadOnce = async () => {
                try {
                    if (!m || !(m.url || m.directPath)) {
                        throw new Error('Invalid message or media not found.');
                    }

                    const dlType = type === 'sticker' ? 'image' : type;
                    let stream;
                    try {
                        stream = await downloadContentFromMessage(m, dlType);
                    } catch (e) {
                        if (/readableStream/i.test(String(e?.message)) && /PassThrough/i.test(String(e?.message))) {
                            const nodeStream = await import('stream');
                            const origFromWeb = nodeStream.Readable.fromWeb?.bind(nodeStream.Readable);
                            if (origFromWeb) {
                                try {
                                    nodeStream.Readable.fromWeb = function (rs, opts) {
                                        if (rs && typeof rs.getReader !== 'function') return rs;
                                        return origFromWeb(rs, opts);
                                    };
                                    stream = await downloadContentFromMessage(m, dlType);
                                } finally {
                                    nodeStream.Readable.fromWeb = origFromWeb;
                                }
                            } else {
                                throw e;
                            }
                        } else {
                            throw e;
                        }
                    }

                    const toBuffer = async (s) => {
                        if (s && typeof s.getReader === 'function') {
                            const reader = s.getReader();
                            const chunks = [];
                            for (; ;) {
                                const { value, done } = await reader.read();
                                if (done) break;
                                if (value) chunks.push(Buffer.from(value));
                            }
                            return Buffer.concat(chunks);
                        }
                        if (s && typeof s[Symbol.asyncIterator] === 'function') {
                            const chunks = [];
                            for await (const chunk of s) {
                                chunks.push(Buffer.from(chunk));
                            }
                            return Buffer.concat(chunks);
                        }
                        throw new Error('Unsupported stream type from downloadContentFromMessage');
                    };

                    const buffer = await toBuffer(stream);

                    if (saveToFile) {
                        const fileType = await fileTypeFromBuffer(buffer);
                        const filename = saveToFile || `downloaded_media.${fileType?.ext || 'bin'}`;
                        await fs.promises.writeFile(filename, buffer);
                        return filename;
                    }

                    return buffer;
                } catch (err) {
                    console.error('Error downloading media message:', err);
                    throw new Error('Failed to download media: ' + err.message);
                }
                }
                for (let attempt = 1; ; attempt++) {
                    try {
                        return await downloadOnce()
                    } catch (err) {
                        if (attempt >= 4 || !retryable.test(String(err?.message))) throw err
                        await new Promise(resolve => setTimeout(resolve, 700 * attempt))
                    }
                }
            },
            enumerable: true
        },
        parseMention: {
            /**
             * Parses string into mentionedJid(s)
             * @param {String} text
             * @returns {Array<String>}
             */
            value(text = '') {
                const regex = /@([0-9]{5,16}|0)/g;
                const mentions = [];
                let match;

                while ((match = regex.exec(text)) !== null) {
                    mentions.push(match[1] + '@s.whatsapp.net');
                }

                return mentions;
            },
            enumerable: true
        },
        saveName: {
            async value(id, name = '') {
                if (!id) return
                id = conn.decodeJid(id)
                let isGroup = id.endsWith('@g.us')
                if (id in conn.contacts && conn.contacts[id][isGroup ? 'subject' : 'name'] && id in conn.chats) return
                let metadata = {}
                if (isGroup) metadata = await conn.groupMetadata(id)
                let chat = { ...(conn.contacts[id] || {}), id, ...(isGroup ? { subject: metadata.subject, desc: metadata.desc } : { name }) }
                conn.contacts[id] = chat
                conn.chats[id] = chat
            }
        },
        getName: {
            /**
             * Get name from jid
             * @param {String} jid
             * @param {Boolean} withoutContact
             */
            value(jid = '', withoutContact = false) {
                jid = conn.decodeJid(jid)
                withoutContact = conn.withoutContact || withoutContact
                let v
                if (jid.endsWith('@g.us')) return new Promise(async (resolve) => {
                    v = conn.chats[jid] || {}
                    if (!(v.name || v.subject)) v = await conn.groupMetadata(jid) || {}
                    resolve(v.name || v.subject || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international'))
                })
                else v = jid === '0@s.whatsapp.net' ? {
                    jid,
                    vname: 'WhatsApp'
                } : areJidsSameUser(jid, conn.user.id) ?
                    conn.user :
                    (conn.chats[jid] || {})
                return (withoutContact ? '' : v.name) || v.subject || v.vname || v.notify || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
            },
            enumerable: true
        },
        loadMessage: {
            /**
             * 
             * @param {String} messageID 
             * @returns {import('elyra-baileys').proto.WebMessageInfo}
             */
            value(messageID) {
                return Object.entries(conn.chats)
                    .filter(([_, { messages }]) => typeof messages === 'object')
                    .find(([_, { messages }]) => Object.entries(messages)
                        .find(([k, v]) => (k === messageID || v.key?.id === messageID)))
                    ?.[1].messages?.[messageID]
            },
            enumerable: true
        },
        sendGroupV4Invite: {
            /**
             * sendGroupV4Invite
             * @param {String} jid 
             * @param {*} participant 
             * @param {String} inviteCode 
             * @param {Number} inviteExpiration 
             * @param {String} groupName 
             * @param {String} caption 
             * @param {Buffer} jpegThumbnail
             * @param {*} options 
             */
            async value(groupJid, participant, inviteCode, inviteExpiration, groupName = 'unknown subject', caption = 'Invitation to join my WhatsApp group', jpegThumbnail, options = {}) {
                const msg = generateWAMessageFromContent(participant, {
                    groupInviteMessage: {
                        inviteCode,
                        inviteExpiration: parseInt(inviteExpiration) || + new Date(new Date + (3 * 86400000)),
                        groupJid,
                        groupName,
                        jpegThumbnail,
                        caption
                    }
                }, {
                    userJid: conn.user.id,
                    ...options
                })
                await conn.relayMessage(participant, msg.message, { messageId: msg.key.id })
                return msg
            },
            enumerable: true
        },
        processMessageStubType: {
            /**
             * to process MessageStubType
             * @param {import('elyra-baileys').proto.WebMessageInfo} m 
             */
            async value(m) {
                if (!m.messageStubType) return
                const chat = conn.decodeJid(m.key.remoteJid || m.message?.senderKeyDistributionMessage?.groupId || '')
                if (!chat || chat === 'status@broadcast') return
                const emitGroupUpdate = (update) => {
                    conn.ev.emit('groups.update', [{ id: chat, ...update }])
                }
                switch (m.messageStubType) {
                    case WAMessageStubType.REVOKE:
                    case WAMessageStubType.GROUP_CHANGE_INVITE_LINK:
                        emitGroupUpdate({ revoke: m.messageStubParameters?.[0] })
                        break
                    case WAMessageStubType.GROUP_CHANGE_ICON:
                        emitGroupUpdate({ icon: m.messageStubParameters?.[0] })
                        break
                    case WAMessageStubType.GROUP_PARTICIPANT_ADD:
                    case WAMessageStubType.GROUP_PARTICIPANT_REMOVE:
                    case WAMessageStubType.GROUP_PARTICIPANT_PROMOTE:
                    case WAMessageStubType.GROUP_PARTICIPANT_DEMOTE:
                    case WAMessageStubType.GROUP_PARTICIPANT_INVITE:
                    case WAMessageStubType.GROUP_PARTICIPANT_LEAVE:
                    case WAMessageStubType.GROUP_PARTICIPANT_CHANGE_NUMBER:
                        console.log({
                            messageStubType: m.messageStubType,
                            messageStubParameters: m.messageStubParameters,
                            type: WAMessageStubType[m.messageStubType]
                        })
                        try {
                            const param = m.messageStubParameters?.[0]
                            if (param) {
                                const parsed = JSON.parse(param)
                                if (parsed.id && parsed.phoneNumber) {
                                    if (!conn.isLid) conn.isLid = {}
                                    const lid = parsed.id
                                    const phone = parsed.phoneNumber
                                    conn.isLid[lid] = phone
                                    conn.identity?.learn(lid, phone)
                                }
                            }
                        } catch (e) {
                            console.error('Failed to parse message stub param for LID mapping:', e)
                        }
                        break
                    default: {
                        console.log({
                            messageStubType: m.messageStubType,
                            messageStubParameters: m.messageStubParameters,
                            type: WAMessageStubType[m.messageStubType]
                        })
                        break
                    }
                }
                const isGroup = chat.endsWith('@g.us')
                if (!isGroup) return
                let chats = conn.chats[chat]
                if (!chats) chats = conn.chats[chat] = { id: chat }
                chats.isChats = true
                const metadata = await conn.groupMetadata(chat).catch(_ => null)
                if (!metadata) return
                chats.subject = metadata.subject
                chats.metadata = metadata
            }
        },
        relayWAMessage: {
            async value(pesanfull) {
                if (pesanfull.message.audioMessage) {
                    await conn.sendPresenceUpdate('recording', pesanfull.key.remoteJid)
                } else {
                    await conn.sendPresenceUpdate('composing', pesanfull.key.remoteJid)
                }
                var mekirim = await conn.relayMessage(pesanfull.key.remoteJid, pesanfull.message, { messageId: pesanfull.key.id })
                conn.ev.emit('messages.upsert', { messages: [pesanfull], type: 'append' });
                return mekirim
            }
        },
        insertAllGroup: {
            async value() {
                const groups = await conn.groupFetchAllParticipating().catch(_ => null) || {}
                for (const group in groups) conn.chats[group] = { ...(conn.chats[group] || {}), id: group, subject: groups[group].subject, isChats: true, metadata: groups[group] }
                return conn.chats
            },
        },
        pushMessage: {
            /**
             * pushMessage
             * @param {import('elyra-baileys').proto.WebMessageInfo[]} m 
             */
            async value(m) {
                if (!m) return
                if (!Array.isArray(m)) m = [m]
                for (const message of m) {
                    try {
                        if (!message) continue
                        if (message.messageStubType && message.messageStubType != WAMessageStubType.CIPHERTEXT) conn.processMessageStubType(message).catch(console.error)
                        const _mtype = Object.keys(message.message || {})
                        const mtype = (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(_mtype[0]) && _mtype[0]) ||
                            (_mtype.length >= 3 && _mtype[1] !== 'messageContextInfo' && _mtype[1]) ||
                            _mtype[_mtype.length - 1]
                        const chat = conn.decodeJid(message.key.remoteJid || message.message?.senderKeyDistributionMessage?.groupId || '')
                        if (message.message?.[mtype]?.contextInfo?.quotedMessage) {
                            /**
                             * @type {import('elyra-baileys').proto.IContextInfo}
                             */
                            let context = message.message[mtype].contextInfo
                            let participant = conn.decodeJid(context.participant)
                            const remoteJid = conn.decodeJid(context.remoteJid || participant)
                            /**
                             * @type {import('elyra-baileys').proto.IMessage}
                             * 
                             */
                            let quoted = message.message[mtype].contextInfo.quotedMessage
                            if ((remoteJid && remoteJid !== 'status@broadcast') && quoted) {
                                let qMtype = Object.keys(quoted)[0]
                                if (qMtype == 'conversation') {
                                    quoted.extendedTextMessage = { text: quoted[qMtype] }
                                    delete quoted.conversation
                                    qMtype = 'extendedTextMessage'
                                }
                                if (!quoted[qMtype].contextInfo) quoted[qMtype].contextInfo = {}
                                quoted[qMtype].contextInfo.mentionedJid = context.mentionedJid || quoted[qMtype].contextInfo.mentionedJid || []
                                const isGroup = remoteJid.endsWith('g.us')
                                if (isGroup && !participant) participant = remoteJid
                                const qM = {
                                    key: {
                                        remoteJid,
                                        fromMe: areJidsSameUser(conn.user.jid, remoteJid),
                                        id: context.stanzaId,
                                        participant,
                                    },
                                    message: (() => {
                                        try {
                                            return JSON.parse(JSON.stringify(quoted))
                                        } catch (e) {
                                            return quoted
                                        }
                                    })(),
                                    ...(isGroup ? { participant } : {})
                                }
                                let qChats = conn.chats[participant]
                                if (!qChats) qChats = conn.chats[participant] = { id: participant, isChats: !isGroup }
                                if (!qChats.messages) qChats.messages = {}
                                if (!qChats.messages[context.stanzaId] && !qM.key.fromMe) qChats.messages[context.stanzaId] = qM
                                let qChatsMessages
                                if ((qChatsMessages = Object.entries(qChats.messages)).length > 40) qChats.messages = Object.fromEntries(qChatsMessages.slice(30, qChatsMessages.length))
                            }
                        }
                        if (!chat || chat === 'status@broadcast') continue
                        const isGroup = chat.endsWith('@g.us')
                        let chats = conn.chats[chat]
                        if (!chats) {
                            if (isGroup) await conn.insertAllGroup().catch(console.error)
                            chats = conn.chats[chat] = { id: chat, isChats: true, ...(conn.chats[chat] || {}) }
                        }
                        let metadata, sender
                        if (isGroup) {
                            if (!chats.subject || !chats.metadata) {
                                metadata = await conn.groupMetadata(chat).catch(_ => ({})) || {}
                                if (!chats.subject) chats.subject = metadata.subject || ''
                                if (!chats.metadata) chats.metadata = metadata
                            }
                            sender = conn.decodeJid(message.key?.fromMe && conn.user.id || message.participant || message.key?.participant || chat || '')
                            if (sender !== chat) {
                                let chats = conn.chats[sender]
                                if (!chats) chats = conn.chats[sender] = { id: sender }
                                if (!chats.name) chats.name = message.pushName || chats.name || ''
                            }
                        } else if (!chats.name) chats.name = message.pushName || chats.name || ''
                        if (['senderKeyDistributionMessage', 'messageContextInfo'].includes(mtype)) continue
                        chats.isChats = true
                        if (!chats.messages) chats.messages = {}
                        const fromMe = message.key.fromMe || areJidsSameUser(sender || chat, conn.user.id)
                        if (!['protocolMessage'].includes(mtype) && !fromMe && message.messageStubType != WAMessageStubType.CIPHERTEXT && message.message) {
                            delete message.message.messageContextInfo
                            delete message.message.senderKeyDistributionMessage
                            chats.messages[message.key.id] = JSON.parse(JSON.stringify(message, null, 2))
                            let chatsMessages
                            if ((chatsMessages = Object.entries(chats.messages)).length > 40) chats.messages = Object.fromEntries(chatsMessages.slice(30, chatsMessages.length))
                        }
                    } catch (e) {
                        console.error(e)
                    }
                }
            }
        },
        serializeM: {
            /**
             * Serialize Message, so it easier to manipulate
             * @param {import('elyra-baileys').proto.WebMessageInfo} m
             */
            value(m) {
                return smsg(conn, m)
            }
        },
        ...(typeof conn.chatRead !== 'function' ? {
            chatRead: {
                /**
                 * Read message
                 * @param {String} jid 
                 * @param {String|undefined|null} participant 
                 * @param {String} messageID 
                 */
                value(jid, participant = conn.user.jid, messageID) {
                    return conn.sendReadReceipt(jid, participant, [messageID])
                },
                enumerable: true
            }
        } : {}),
        ...(typeof conn.setStatus !== 'function' ? {
            setStatus: {
                /**
                 * setStatus bot
                 * @param {String} status 
                 */
                value(status) {
                    return conn.query({
                        tag: 'iq',
                        attrs: {
                            to: 's.whatsapp.net',
                            type: 'set',
                            xmlns: 'status',
                        },
                        content: [
                            {
                                tag: 'status',
                                attrs: {},
                                content: Buffer.from(status, 'utf-8')
                            }
                        ]
                    })
                },
                enumerable: true
            }
        } : {})
    })
    if (sock.user?.id) sock.user.jid = sock.decodeJid(sock.user.id)
    Object.defineProperty(sock, '__erine', { value: true, enumerable: false })
    store.bind(sock)
    return sock
}
/**
 * Serialize Message
 * @param {ReturnType<typeof makeWASocket>} conn 
 * @param {import('elyra-baileys').proto.WebMessageInfo} m 
 * @param {Boolean} hasParent 
 */
export function smsg(conn, m, hasParent) {
    if (!m) return m
    /**
     * @type {import('elyra-baileys').proto.WebMessageInfo}
     */
    let M = proto.WebMessageInfo
    m = M.create(m)
    Object.defineProperty(m, 'conn', { enumerable: false, writable: true, value: conn })
    let protocolMessageKey
    if (m.message) {
        if (m.mtype == 'protocolMessage' && m.msg.key) {
            protocolMessageKey = m.msg.key
            if (protocolMessageKey == 'status@broadcast') protocolMessageKey.remoteJid = m.chat
            if (!protocolMessageKey.participant || protocolMessageKey.participant == 'status_me') protocolMessageKey.participant = m.sender
            protocolMessageKey.fromMe = conn.decodeJid(protocolMessageKey.participant) === conn.decodeJid(conn.user.id)
            if (!protocolMessageKey.fromMe && protocolMessageKey.remoteJid === conn.decodeJid(conn.user.id)) protocolMessageKey.remoteJid = m.sender
        }
        if (m.quoted) if (!m.quoted.mediaMessage) delete m.quoted.download
    }
    if (!m.mediaMessage) delete m.download

    try {
        if (protocolMessageKey && m.mtype == 'protocolMessage' && (m.msg.type === 0 || m.msg.type === undefined || m.msg.type === null)) conn.ev.emit('message.delete', protocolMessageKey)
    } catch (e) {
        console.error(e)
    }
    return m
}

export function serialize() {
    const MediaType = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'];
    return Object.defineProperties(proto.WebMessageInfo.prototype, {
        conn: {
            value: undefined,
            enumerable: false,
            writable: true
        },
        id: {
            get() {
                return this.key?.id
            }
        },
        isBaileys: {
            get() {
                return this.id?.length === 16 || this.id?.startsWith('3EB0') && this.id?.length === 22 || this.id?.startsWith(global.idPrefix || 'ERINE') || false
            }
        },
        chat: {
            get() {
                const senderKeyDistributionMessage = this.message?.senderKeyDistributionMessage?.groupId
                return (
                    this.key?.remoteJid ||
                    (senderKeyDistributionMessage &&
                        senderKeyDistributionMessage !== 'status@broadcast'
                    ) || ''
                ).decodeJid()
            }
        },
        isGroup: {
            get() {
                return this.chat.endsWith('@g.us') ? true : false;
            },
            enumerable: true
        },
        getAlbum: { value(opts) { return readAlbumMessage(this, opts) } },
        wait: { value(vars) { return this.reply(waitText(vars)) } },
        sukses: { value(response, chatId) { return this.reply(successText(response, Date.now() - (this.startedAt || Date.now())), chatId) } },
        gagal: { value(message, provider) { return this.reply(errorText(message, provider || this.plugin)) } },
        isChannel: {
            get() {
                return this.chat.endsWith('@newsletter')
            },
            enumerable: true
        },
        sender: {
            get() {
                if (this.key?.fromMe) return (this.conn?.user?.jid || '').decodeJid()

                const candidates = [
                    this.key?.participantAlt,
                    this.key?.participant,
                    this.key?.remoteJidAlt,
                    this.key?.remoteJid,
                    this.chat
                ].filter(Boolean).map(s => String(s).decodeJid())

                const phone = candidates.find(c => c.endsWith('@s.whatsapp.net'))
                if (phone) return this.conn.getJid(phone)

                return this.conn.getJid(candidates[0] || '')
            },
            enumerable: true
        },
        fromMe: {
            get() {
                return this.key?.fromMe || areJidsSameUser(this.conn?.user.id, this.sender) || false
            }
        },
        mtype: {
            get() {
                if (!this.message) return ''
                const type = Object.keys(this.message)
                return (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(type[0]) && type[0]) ||
                    (type.length >= 3 && type[1] !== 'messageContextInfo' && type[1]) ||
                    type[type.length - 1]
            },
            enumerable: true
        },
        msg: {
            get() {
                if (!this.message) return null
                return this.message[this.mtype]
            }
        },
        mediaMessage: {
            get() {
                if (!this.message) return null
                const d = pickMedia(this.message)
                return d ? { [d.key]: d.node } : null
            },
            enumerable: true
        },
        messages: {
            get() {
                return this.message ? this.message : null
            },
            enumerable: true
        },
        mediaType: {
            get() {
                let message
                if (!(message = this.mediaMessage)) return null
                return Object.keys(message)[0]
            },
            enumerable: true,
        },
        quoted: {
            get() {
                /**
                 * @type {ReturnType<typeof _makeWaSocket>}
                 */
                const self = this
                const msg = self.msg
                const contextInfo = (msg?.contextInfo?.stanzaId || msg?.contextInfo?.quotedMessage) ? msg.contextInfo : (findContextInfo(self.message) || msg?.contextInfo)
                const conns = this.conn
                let quoted = contextInfo?.quotedMessage
                if (!quoted && contextInfo?.stanzaId) quoted = findStoredMessage(conns, self.chat, contextInfo.stanzaId)?.message
                if (!msg || !contextInfo || !quoted) return null
                const type = Object.keys(quoted)[0]
                let q = quoted[type]
                const text = typeof q === 'string' ? q : q.text
                return Object.defineProperties(JSON.parse(JSON.stringify(typeof q === 'string' ? {
                    text: q
                } : q)), {
                    mtype: {
                        get() {
                            return type
                        },
                        enumerable: true
                    },
                    mediaMessage: {
                        get() {
                            const direct = pickMedia(quoted)
                            if (direct && direct.node.mediaKey) return { [direct.key]: direct.node }
                            const stored = findStoredMessage(conns, self.chat, contextInfo.stanzaId)
                            const fromStore = stored && pickMedia(stored.message)
                            if (fromStore) return { [fromStore.key]: fromStore.node }
                            if (direct) return { [direct.key]: direct.node }
                            if (Object.keys(quoted || {}).some(k => /video|audio|image|sticker|document/i.test(k)))
                                console.warn('[QUOTED] media tidak bisa diunduh (tidak ada di kutipan & cache):', contextInfo.stanzaId)
                            return null
                        },
                        enumerable: true
                    },
                    messages: {
                        get() {
                            return quoted ? quoted : null
                        },
                        enumerable: true
                    },
                    mediaType: {
                        get() {
                            let message
                            if (!(message = this.mediaMessage)) return null
                            return Object.keys(message)[0]
                        },
                        enumerable: true,
                    },
                    id: {
                        get() {
                            return contextInfo.stanzaId
                        },
                        enumerable: true
                    },
                    chat: {
                        get() {
                            return contextInfo.remoteJid || self.chat
                        },
                        enumerable: true
                    },
                    isBaileys: {
                        get() {
                            return this.id?.length === 16 || this.id?.startsWith('3EB0') && this.id.length === 22 || false
                        },
                        enumerable: true
                    },
                    sender: {
                        get() {
                            const raw = (contextInfo.participant || this.chat || '').decodeJid()
                            return conns.getJid(raw)
                        },
                        enumerable: true
                    },
                    fromMe: {
                        get() {
                            return areJidsSameUser(this.sender, self.conn?.user.jid)
                        },
                        enumerable: true,
                    },
                    text: {
                        get() {
                            return text || this.caption || this.contentText || this.selectedDisplayText || ''
                        },
                        enumerable: true
                    },
                    mentionedJid: {
                        get() {
                            let raw = q.contextInfo?.mentionedJid || self.getQuotedObj()?.mentionedJid || []
                            return raw.map(jid => conns.getJid(jid))
                        },
                        enumerable: true
                    },
                    name: {
                        get() {
                            const sender = this.sender
                            return sender ? self.conn?.getName(sender) : null
                        },
                        enumerable: true
                    },
                    vM: {
                        get() {
                            return proto.WebMessageInfo.create({
                                key: {
                                    fromMe: this.fromMe,
                                    remoteJid: this.chat,
                                    id: this.id
                                },
                                message: quoted,
                                ...(self.isGroup ? {
                                    participant: this.sender
                                } : {})
                            })
                        }
                    },
                    fakeObj: {
                        get() {
                            return this.vM
                        }
                    },
                    download: {
                        value(saveToFile = false) {
                            const mtype = this.mediaType;
                            const mediaRoot = this.mediaMessage;
                            if (!mtype || !mediaRoot || !mediaRoot[mtype]) {
                                throw new Error('No downloadable media found in quoted message. Reply to an image/video/sticker or resend the media.');
                            }
                            return self.conn?.downloadM(mediaRoot[mtype], mtype.replace(/message/i, ''), saveToFile);
                        },
                        enumerable: true,
                        configurable: true,
                    },
                    reply: {
                        /**
                         * Reply to quoted message
                         * @param {String|Object} text
                         * @param {String|false} chatId
                         * @param {Object} options
                         */
                        value(text, chatId, options) {
                            return self.conn?.reply(chatId ? chatId : this.chat, text, this.vM, options)
                        },
                        enumerable: true,
                    },
                    copy: {
                        value() {
                            const M = proto.WebMessageInfo
                            return smsg(conn, M.create(M.toObject(this.vM)))
                        },
                        enumerable: true,
                    },
                    forward: {
                        /**
                         * Forward quoted message
                         * @param {String} jid
                         *  @param {Boolean} forceForward
                         */
                        value(jid, force = false, options) {
                            return self.conn?.sendMessage(jid, {
                                forward: this.vM,
                                force,
                                ...options
                            }, {
                                ...options
                            })
                        },
                        enumerable: true,
                    },
                    copyNForward: {
                        /**
                         * Exact Forward quoted message
                         * @param {String} jid
                         * @param {Boolean|Number} forceForward
                         * @param {Object} options
                         */
                        value(jid, forceForward = false, options) {
                            return self.conn?.copyNForward(jid, this.vM, forceForward, options)
                        },
                        enumerable: true,
                    },
                    cMod: {
                        /**
                         * Modify quoted Message
                         * @param {String} jid
                         * @param {String} text
                         * @param {String} sender
                         * @param {Object} options
                         */
                        value(jid, text = '', sender = this.sender, options = {}) {
                            return self.conn?.cMod(jid, this.vM, text, sender, options)
                        },
                        enumerable: true,
                    },
                    delete: {
                        value() {
                            return self.conn?.sendMessage(this.chat, {
                                delete: this.vM.key
                            })
                        },
                        enumerable: true,
                    },
                    react: {
                        value(text) {
                            return self.conn?.sendMessage(this.chat, {
                                react: {
                                    text,
                                    key: this.vM.key
                                }
                            })
                        },
                        enumerable: true,
                    },
                    command: {
                        get() {
                            const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
                            let _prefix = this.prefix ? this.prefix : global.prefix
                            let match = (_prefix instanceof RegExp ? [
                                [_prefix.exec(text || this.caption || this.contentText || this.selectedDisplayText || ''), _prefix]
                            ] :
                                Array.isArray(_prefix) ?
                                    _prefix.map(p => {
                                        let re = p instanceof RegExp ?
                                            p :
                                            new RegExp(str2Regex(p))
                                        return [re.exec(text || this.caption || this.contentText || this.selectedDisplayText || ''), re]
                                    }) :
                                    typeof _prefix === "string" ? [
                                        [new RegExp(str2Regex(_prefix)).exec(text || this.caption || this.contentText || this.selectedDisplayText || ''), new RegExp(str2Regex(_prefix))]
                                    ] : [
                                        [
                                            [], new RegExp
                                        ]
                                    ]
                            ).find(p => p[1])
                            let result = ((opts?.['multiprefix'] ?? true) && (match[0] || "")[0]) || ((opts?.['noprefix'] ?? false) ? null : (match[0] || "")[0]);
                            let noPrefix = !result ? (text || this.caption || this.contentText || this.selectedDisplayText || '') : (text || this.caption || this.contentText || this.selectedDisplayText || '').replace(result, "");
                            let args_v2 = noPrefix.trim().split(/ +/);
                            let [command, ...args] = noPrefix.trim().split(" ").filter(v => v);
                            return {
                                command,
                                args,
                                args_v2,
                                noPrefix,
                                match
                            };
                        },
                        enumerable: true
                    },
                    device: {
                        get() {
                            const device = getDevice(this.vM.key?.id);
                            const platform = os.platform();
                            const isUnknownDevice = device === 'unknown' && platform;
                            const res = device ? (isUnknownDevice ? (platform === 'android' ? 'Android' : ['win32', 'darwin', 'linux'].includes(platform) ? 'Desktop' : 'Unknown') : device) : 'Unknown Device';

                            return res;
                        },
                        enumerable: true
                    },
                    isBot: {
                        get() {
                            const idBot = this.vM.key?.id;
                            return ["3EB0"].some(k => idBot.includes(k) && this.sender !== this.conn?.user.jid);
                        },
                        enumerable: true
                    }
                })
            },
            enumerable: true
        },
        _text: {
            value: null,
            writable: true,
        },
        text: {
            get() {
                const msg = this.msg
                const text = (typeof msg === 'string' ? msg : msg?.text) || msg?.caption || msg?.contentText || ''
                return typeof this._text === 'string' ? this._text : '' || (typeof text === 'string' ? text : (
                    text?.selectedDisplayText ||
                    text?.hydratedTemplate?.hydratedContentText ||
                    text
                )) || ''
            },
            set(str) {
                return this._text = str
            },
            enumerable: true
        },
        mentionedJid: {
            get() {
                let raw = this.msg?.contextInfo?.mentionedJid?.length && this.msg.contextInfo.mentionedJid || []
                return raw.map(jid => this.conn.getJid(jid))
            },
            enumerable: true
        },
        name: {
            get() {
                return !nullish(this.pushName) && this.pushName || this.conn?.getName(this.sender)
            },
            enumerable: true
        },
        download: {
            value(saveToFile = false) {
                const mtype = this.mediaType;
                const mediaRoot = this.mediaMessage;
                if (!mtype || !mediaRoot || !mediaRoot[mtype]) {
                    throw new Error('No downloadable media found in message. Send or reply to an image/video/sticker.');
                }
                return this.conn?.downloadM(mediaRoot[mtype], mtype.replace(/message/i, ''), saveToFile);
            },
            enumerable: true,
            configurable: true
        },
        reply: {
            value(text, chatId, options) {
                return this.conn?.reply(chatId ? chatId : this.chat, text, this, options)
            }
        },
        copy: {
            value() {
                const M = proto.WebMessageInfo
                return smsg(this.conn, M.create(M.toObject(this)))
            },
            enumerable: true
        },
        forward: {
            value(jid, force = false, options = {}) {
                return this.conn?.sendMessage(jid, {
                    forward: this,
                    force,
                    ...options
                }, {
                    ...options
                })
            },
            enumerable: true
        },
        copyNForward: {
            value(jid, forceForward = false, options = {}) {
                return this.conn?.copyNForward(jid, this, forceForward, options)
            },
            enumerable: true
        },
        cMod: {
            value(jid, text = '', sender = this.sender, options = {}) {
                return this.conn?.cMod(jid, this, text, sender, options)
            },
            enumerable: true
        },
        getQuotedObj: {
            value() {
                if (!this.quoted.id) return null
                const q = proto.WebMessageInfo.create(this.conn?.loadMessage(this.quoted.id) || this.quoted.vM)
                return smsg(this.conn, q)
            },
            enumerable: true
        },
        getQuotedMessage: {
            get() {
                return this.getQuotedObj
            }
        },
        delete: {
            value() {
                return this.conn?.sendMessage(this.chat, {
                    delete: this.key
                })
            },
            enumerable: true
        },
        react: {
            value(text) {
                return this.conn?.sendMessage(this.chat, {
                    react: {
                        text,
                        key: this.key
                    }
                })
            },
            enumerable: true
        },
        device: {
            get() {
                const device = getDevice(this.key?.id);
                const platform = os.platform();
                const isUnknownDevice = device === 'unknown' && platform;
                const res = device ? (isUnknownDevice ? (platform === 'android' ? 'Android Device' : ['win32', 'darwin', 'linux'].includes(platform) ? 'Desktop' : 'Unknown Device') : device) : 'Unknown Device';

                return res;
            },
            enumerable: true
        },
        isBot: {
            get() {
                const idBot = this.key?.id;
                return ["3EB0"].some(k => idBot.includes(k) && this.sender !== this.conn?.user.jid);
            },
            enumerable: true
        }
    })
}

export function logic(check, inp, out) {
    if (inp.length !== out.length) throw new Error('Input and Output must have same length')
    for (let i in inp) if (util.isDeepStrictEqual(check, inp[i])) return out[i]
    return null
}

export function protoType() {
    Buffer.prototype.toArrayBuffer = function toArrayBufferV2() {
        const ab = new ArrayBuffer(this.length);
        const view = new Uint8Array(ab);
        for (let i = 0; i < this.length; ++i) {
            view[i] = this[i];
        }
        return ab;
    }
    /**
     * @returns {ArrayBuffer}
     */
    Buffer.prototype.toArrayBufferV2 = function toArrayBuffer() {
        return this.buffer.slice(this.byteOffset, this.byteOffset + this.byteLength)
    }
    /**
     * @returns {Buffer}
     */
    ArrayBuffer.prototype.toBuffer = function toBuffer() {
        return Buffer.from(new Uint8Array(this))
    }
    Uint8Array.prototype.getFileType = ArrayBuffer.prototype.getFileType = Buffer.prototype.getFileType = async function getFileType() {
        return await fileTypeFromBuffer(this)
    }
    /**
     * @returns {Boolean}
     */
    String.prototype.isNumber = Number.prototype.isNumber = isNumber
    /**
     * 
     * @returns {String}
     */
    String.prototype.capitalize = function capitalize() {
        return this.charAt(0).toUpperCase() + this.slice(1, this.length)
    }
    /**
     * @returns {String}
     */
    String.prototype.capitalizeV2 = function capitalizeV2() {
        const str = this.split(' ')
        return str.map(v => v.capitalize()).join(' ')
    }
    String.prototype.decodeJid = function decodeJid() {
        if (/:\d+@/gi.test(this)) {
            const decode = jidDecode(this) || {}
            return (decode.user && decode.server && decode.user + '@' + decode.server || this).trim()
        } else return this.trim()
    }
    /**
     * number must be milliseconds
     * @returns {string}
     */
    Number.prototype.toTimeString = function toTimeString() {
        const seconds = Math.floor((this / 1000) % 60)
        const minutes = Math.floor((this / (60 * 1000)) % 60)
        const hours = Math.floor((this / (60 * 60 * 1000)) % 24)
        const days = Math.floor((this / (24 * 60 * 60 * 1000)))
        return (
            (days ? `${days} day(s) ` : '') +
            (hours ? `${hours} hour(s) ` : '') +
            (minutes ? `${minutes} minute(s) ` : '') +
            (seconds ? `${seconds} second(s)` : '')
        ).trim()
    }
    Number.prototype.getRandom = String.prototype.getRandom = Array.prototype.getRandom = getRandom
}
function isNumber() {
    const int = parseInt(this)
    return typeof int === 'number' && !isNaN(int)
}

function getRandom() {
    if (Array.isArray(this) || this instanceof String) return this[Math.floor(Math.random() * this.length)]
    return Math.floor(Math.random() * this)
}

/**
 * ??
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing_operator
 * @returns {boolean}
 */
function nullish(args) {
    return !(args !== null && args !== undefined)
}

export const defaultText = {
    welcome: '❖━━━━━━[ Selamat Datang ]━━━━━━❖\n\n┏––––––━━━━━━━━•\n│☘︎ @subject\n┣━━━━━━━━┅┅┅\n│( 👋 Hallo @user)\n├[ Intro ]—\n│ NAMA: \n│ USIA: \n│ JENIS KELAMIN:\n┗––––––━━┅┅┅\n\n––––––┅┅ DESKRIPSI ┅┅––––––\n@desc',
    bye: '❖━━━━━━[ Meninggalkan ]━━━━━━❖\nSayonara @user 👋😃',
    spromote: '@user Sekarang jadi admin!',
    sdemote: '@user Sekarang bukan lagi admin!',
    sDesc: 'Deskripsi telah diubah menjadi \n@desc',
    sSubject: 'Judul grup telah diubah menjadi \n@subject',
    sIcon: 'Icon grup telah diubah!',
    sRevoke: 'Link group telah diubah ke \n@revoke',
    sAnnounceOn: 'Group telah di tutup!\nsekarang hanya admin yang dapat mengirim pesan.',
    sAnnounceOff: 'Group telah di buka!\nsekarang semua peserta dapat mengirim pesan.',
    sRestrictOn: 'Edit Info Grup di ubah ke hanya admin!',
    sRestrictOff: 'Edit Info Grup di ubah ke semua peserta!'
}

function acquireSessionLock(dir) {
    const file = join(dir, '.erine.lock')
    try {
        const old = parseInt(fs.readFileSync(file, 'utf8'))
        if (old && old !== process.pid) {
            let alive = false
            try { process.kill(old, 0); alive = true } catch (e) { alive = e.code === 'EPERM' }
            if (alive) throw new Error(`Sesi "${dir}" sedang dipakai proses lain (PID ${old}). Matikan dulu, atau hapus ${file} bila yakin proses itu sudah mati.`)
        }
    } catch (e) { if (e.code !== 'ENOENT' && !/^\d*$/.test(String(e.message))) throw e }
    fs.writeFileSync(file, String(process.pid))
    const release = () => { try { if (parseInt(fs.readFileSync(file, 'utf8')) === process.pid) fs.unlinkSync(file) } catch { } }
    process.on('exit', release)
    return release
}

const isBadMacStub = m => m?.messageStubType === WAMessageStubType.CIPHERTEXT
    && (m.messageStubParameters || []).some(p => B.isBadMacError?.(new Error(String(p))) ?? /Bad MAC|MAC verification failed/i.test(String(p)))

/**
 * Jalankan bot.
 * @param {{ getHandlers: () => any, sessionId?: string, phoneNumber?: string|null, authDir?: string }} opt
 */
export async function startBot({ getHandlers, sessionId = 'erine', phoneNumber = null, authDir } = {}) {
    const dir = path.resolve(ROOT, authDir || global.sessionDir || 'sessions')
    fs.mkdirSync(dir, { recursive: true })
    acquireSessionLock(dir)
    global.idPrefix = 'ERINE'

    const logger = pino({ level: 'fatal' })
    const { state, saveCreds, store: sqlSession } = await useSQLiteAuthState(path.join(dir, 'erine.sqlite'), { migrateFrom: dir })
    global.sqlSession = sqlSession
    const identity = global.identity = createIdentity({ db: sqlSession.db, getConn: () => global.conn })
    const { version, isLatest } = await B.fetchLatestBaileysVersion().catch(() => ({}))

    const badMac = global.badMac = new B.BadMacHandler({
        authFolder: dir, logger, maxRetries: 8,
        onLimit: st => console.warn(chalk.yellow(`⚠️ Bad MAC ${st.errorCount}x dalam periode pendek. Pastikan hanya 1 proses yang jalan; bila terus berulang, owner bisa jalankan .fixsession`))
    })

    const getMessage = async key => {
        try { return global.conn?.loadMessage?.(key.id)?.message || undefined } catch { return undefined }
    }

    const sockOpts = () => ({
        logger,
        auth: { creds: state.creds, keys: B.makeCacheableSignalKeyStore(state.keys, logger) },
        browser: B.Browsers.macOS('Chrome'),
        ...(version ? { version } : {}),
        getMessage,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        generateHighQualityLinkPreview: true,
        autoFollowNewsletterOnConnect: global.autoFollowChannel === true,
        patchMessageBeforeSending: message => {
            if (message.buttonsMessage || message.templateMessage || message.listMessage) {
                return { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadataVersion: 2, deviceListMetadata: {} }, ...message } } }
            }
            return message
        }
    })

    let pairingRequested = false
    const safe = fn => async (...a) => { try { return await fn(...a) } catch (e) { console.error(e) } }

    const bind = sock => {
        sock.identity = identity
        extendSocket(sock, { chats: global.conn?.chats })
        for (const [k, v] of Object.entries(defaultText)) if (sock[k] === undefined) sock[k] = v
        global.conn = sock
        sock.isInit = false
        const H = () => getHandlers()

        sock.ev.on('creds.update', safe(saveCreds))

        bindAlbumCollector(sock)
        sock.ev.on('messages.upsert', ({ messages }) => { for (const mm of messages || []) cacheMediaMessage(mm) })
        sock.sendAlbum = (jid, medias, opts) => sendAlbumMessage(sock, jid, medias, opts)

        sock.ev.on('lid-mapping.update', safe(u => { for (const x of [].concat(u || [])) identity.learn(x.lid, x.pn ?? x.phoneNumber) }))
        sock.ev.on('contacts.upsert', safe(u => identity.learnContacts(u)))
        sock.ev.on('contacts.update', safe(u => identity.learnContacts(u)))
        sock.ev.on('contacts.set', safe(u => identity.learnContacts(u)))
        const _groupMetadata = sock.__identityHooked ? null : sock.groupMetadata?.bind(sock)
        if (_groupMetadata) sock.groupMetadata = async (...a) => { const md = await _groupMetadata(...a); identity.learnGroup(md); return md }
        const _fetchAll = sock.__identityHooked ? null : sock.groupFetchAllParticipating?.bind(sock)
        sock.__identityHooked = true
        if (_fetchAll) sock.groupFetchAllParticipating = async (...a) => { const all = await _fetchAll(...a); for (const md of Object.values(all || {})) identity.learnGroup(md); return all }

        sock.ev.on('connection.update', safe(async ({ connection, lastDisconnect, qr }) => {
            if (qr && !state.creds.registered) {
                if (phoneNumber && !pairingRequested) {
                    pairingRequested = true
                    await delay(1500)
                    const code = await sock.requestPairingCode(String(phoneNumber).replace(/\D/g, ''), global.pairingCode || undefined)
                    console.log(chalk.black(chalk.bgGreen(' Pairing Code ')), chalk.white(String(code).match(/.{1,4}/g)?.join('-') || code))
                }
            }
            if (connection === 'open') {
                if (sock.user?.id) sock.user.jid = sock.decodeJid(sock.user.id)
                if (!printBootReady({ waConnected: true, sessionReady: !!state.creds.registered })) console.log(chalk.green('[SYNC]') + ' WhatsApp reconnected ' + chalk.gray(sock.user?.jid || ''))
            }
            if (connection === 'close') {
                const code = lastDisconnect?.error?.output?.statusCode
                console.log(chalk.red('[SYNC]') + ` WhatsApp disconnected (${code ?? '?'})`, code === B.DisconnectReason.loggedOut ? '— logout, hapus folder sesi lalu pairing ulang' : '— reconnecting…')
            }
        }))
        if (!phoneNumber) B.printQRIfNecessaryListener?.(sock.ev, logger)

        sock.ev.on('messages.upsert', safe(async u => {
            for (const m of u.messages || []) if (isBadMacStub(m)) badMac.handleError(new Error(m.messageStubParameters.join(' ')), m.key?.remoteJid || 'unknown')
            return H().handler.call(sock, u)
        }))
        sock.ev.on('group-participants.update', safe(u => H().participantsUpdate.call(sock, u)))
        sock.ev.on('groups.update', safe(u => H().groupsUpdate.call(sock, u)))
        sock.ev.on('message.delete', safe(u => H().deleteUpdate.call(sock, u)))
        sock.ev.on('call', safe(u => H().callUpdate.call(sock, u)))

        try { B.setupConnectionWatchdog?.(sock) } catch (e) { console.error(e) }
    }

    const manager = B.autoReconnect(async () => B.makeWASocket(sockOpts()), {
        onSocket: bind,
        onLoggedOut: () => console.log(chalk.red('🚪 Sesi logout. Hapus folder sesi lalu jalankan ulang untuk pairing.')),
        onFatal: (_e, code) => console.log(chalk.red(`Fatal disconnect (${code}) — tidak reconnect otomatis.`))
    })
    process.on('exit', () => { try { manager.stop?.() } catch { } })
    await manager.start()
    return manager
}
