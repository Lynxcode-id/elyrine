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

import { format } from 'util'
import { fileURLToPath } from 'url'
import path from 'path'
import { unwatchFile, watchFile, readFileSync } from 'fs'
import chalk from 'chalk'
import fetch from 'node-fetch'

import { smsg, uploadPomf, printLog } from './lib/function.js'
import { canNoPrefix, commandCandidates, splitCommand, acceptsCommand } from './lib/prefix.js'
import { describeError, isNetworkError } from './lib/http.js'
import { errorText, limitText } from './lib/respon.js'
import { getTier, quotaOf, isLimitEnabled, isVipActive, isPremiumActive, getLimitCfg, nextResetAt, formatCountdown } from './lib/limit.js'
import { isChannelJid, isManagedChannel } from './lib/channel.js'
import { extractButtonId } from './lib/buttonresponse.js'

const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(resolve, ms))
const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
const PLUGIN_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')
const SILENT_WHEN_NOPREFIX = new Set(['owner', 'rowner', 'group', 'private', 'admin', 'botAdmin'])

const _notified = new Map()
async function notifyDev(m, text, key) {
    const now = Date.now()
    if (key) {
        if (now - (_notified.get(key) || 0) < 60_000) return
        _notified.set(key, now)
        if (_notified.size > 200) for (const [k, t] of _notified) if (now - t > 60_000) _notified.delete(k)
    }
    for (const [number, , isDeveloper] of global.owner || []) {
        if (!isDeveloper || !number) continue
        await m.reply(text, String(number).replace(/\D/g, '') + '@s.whatsapp.net').catch(() => { })
    }
}
const hideKeys = text => {
    for (const key of Object.values(global.APIKeys || {})) if (key) text = text.split(key).join('#HIDDEN#')
    return text
}

/**
 * Handle messages upsert
 * @param {import('elyra-baileys').BaileysEventMap<unknown>['messages.upsert']} groupsUpdate 
 */

export async function handler(chatUpdate) {
    if (!chatUpdate) return
    this.pushMessage(chatUpdate.messages).catch(console.error)
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return
    if (global.db.data == null)
        await global.loadDatabase()
    try {
        m = smsg(this, m) || m
        if (!m) return
        m.t0 = Date.now()
        await this.identity.resolveMessage(m)
        m.exp = 0
        m.limit = 0
        let chat = global.db.data.chats[m.chat]
        try {
            if (isChannelJid(m.chat)) {
                if (!m.fromMe && !(await isManagedChannel(this, m.chat))) return
            } else if (m.sender.endsWith('@broadcast') || m.sender.endsWith('@newsletter') || m.sender.endsWith('@g.us')) return
            let user = global.db.data.users[m.sender]
            if (typeof user !== 'object')
                global.db.data.users[m.sender] = {}
            if (user) {
                if (!isNumber(user.exp)) user.exp = 0
                if (!isNumber(user.limit)) user.limit = quotaOf('free')
                if (!isNumber(user.afk)) user.afk = -1
                if (!('afkReason' in user)) user.afkReason = ''
                if (!('banned' in user)) user.banned = false
            } else
                global.db.data.users[m.sender] = {
                    registered: false,
                    role: 'Free user',
                    exp: 0,
                    limit: quotaOf('free'),
                    afk: -1,
                    afkReason: '',
                    banned: false,
                }
            chat = global.db.data.chats[m.chat]
            if (m.isGroup) {
                if (typeof chat !== 'object')
                    global.db.data.chats[m.chat] = {}
                chat = global.db.data.chats[m.chat]
                if (chat) {
                    if (!('isBanned' in chat)) chat.isBanned = false
                    if (!('welcome' in chat)) chat.welcome = false
                    if (!('detect' in chat)) chat.detect = false
                    if (!('sWelcome' in chat)) chat.sWelcome = ''
                    if (!('sBye' in chat)) chat.sBye = ''
                    if (!('sPromote' in chat)) chat.sPromote = ''
                    if (!('sDemote' in chat)) chat.sDemote = ''
                    if (!('delete' in chat)) chat.delete = false
                    if (!('antiLink' in chat)) chat.antiLink = false
                    if (!('viewonce' in chat)) chat.viewonce = false
                    if (!('antiToxic' in chat)) chat.antiToxic = false
                    if (!('simi' in chat)) chat.simi = false
                    if (!('autoSticker' in chat)) chat.autoSticker = false
                    if (!('premium' in chat)) chat.premium = false
                    if (!('premiumTime' in chat)) chat.premiumTime = false
                    if (!('premnsfw' in chat)) chat.premnsfw = false
                    if (!('disableLimit' in chat)) chat.disableLimit = false
                    if (!isNumber(chat.expired)) chat.expired = 0
                } else
                    global.db.data.chats[m.chat] = {
                        isBanned: false,
                        welcome: false,
                        detect: false,
                        sWelcome: '',
                        sBye: '',
                        sPromote: '',
                        sDemote: '',
                        delete: true,
                        antiLink: false,
                        viewonce: false,
                        simi: false,
                        expired: 0,
                        autoSticker: false,
                        premium: false,
                        premiumTime: false,
                        premnsfw: false,
                        disableLimit: false,
                    }
            }
            let settings = global.db.data.settings[this.user.jid]
            if (typeof settings !== 'object') global.db.data.settings[this.user.jid] = {}
            if (settings) {
                if (!('public' in settings)) settings.public = true
                if (!('autoread' in settings)) settings.autoread = false
                if (!('restrict' in settings)) settings.restrict = false
                if (!('anticall' in settings)) settings.anticall = true
            } else global.db.data.settings[this.user.jid] = {
                public: true,
                autoread: false,
                anticall: true,
                restrict: false
            }
        } catch (e) {
            console.error(e)
        }
        if (opts['pconly'] && m.chat.endsWith('g.us')) return
        if (opts['gconly'] && !m.chat.endsWith('g.us')) return
        if (typeof m.text !== 'string') m.text = ''
        if (!m.text) {
            const btnId = extractButtonId(m.message)
            if (btnId) {
                m.text = btnId
                m.isBypassed = true
                m.isButtonResponse = true
            }
        }
        const isROwner = [conn.decodeJid(global.conn.user.id), ...global.owner.map(([number]) => number)].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const isOwner = isROwner || m.fromMe
        const _dbu = global.db.data.users[m.sender]
        const isPrems = isROwner || isPremiumActive(_dbu) || isVipActive(_dbu)
        const selfMode = !!(global.opts && global.opts.self)
        const dbPublic = !!(global.db.data.settings[this.user.jid] && global.db.data.settings[this.user.jid].public)
        const isPublic = dbPublic || !selfMode
        if (!isPublic && !isOwner && !m.fromMe) return

        if (m.isBaileys) return
        m.exp += Math.ceil(Math.random() * 10)

        let usedPrefix
        let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender]
        let groupMetadata = {}
        if (m.isGroup) {
            groupMetadata = (conn.chats[m.chat] || {}).metadata
            if (!groupMetadata) {
                groupMetadata = await this.groupMetadata(m.chat).catch(_ => null)
                if (groupMetadata) {
                    const c = conn.chats[m.chat] || (conn.chats[m.chat] = { id: m.chat })
                    c.metadata = groupMetadata
                    c.subject = groupMetadata.subject || c.subject
                }
            }
            groupMetadata = groupMetadata || {}
        }
        this.identity.learnGroup(groupMetadata)
        const participants = this.identity.normalizeParticipants((m.isGroup ? groupMetadata.participants : []) || [])
        const user = (m.isGroup ? participants.find(u => {
            const jid = conn.getJid(String(u.id || u.jid || '').decodeJid())
            const pn = u.phoneNumber ? (String(u.phoneNumber).replace(/[^0-9]/g, '') + '@s.whatsapp.net') : null
            return jid === m.sender || pn === m.sender
        }) : {}) || {}
        const bot = (m.isGroup ? participants.find(u => {
            const jid = conn.getJid(String(u.id || u.jid || '').decodeJid())
            const pn = u.phoneNumber ? (String(u.phoneNumber).replace(/[^0-9]/g, '') + '@s.whatsapp.net') : null
            const selfJid = this.user.jid
            return jid === selfJid || pn === selfJid
        }) : {}) || {}
        const isRAdmin = user?.admin == 'superadmin' || false
        const isAdmin = isRAdmin || user?.admin == 'admin' || false
        const isBotAdmin = bot?.admin || false

        const ___dirname = PLUGIN_DIR
        const noPrefixOk = !conn.prefix && canNoPrefix(isOwner)
        const restrictOn = !!opts['restrict']
        for (const name in global.plugins) {
            const plugin = global.plugins[name]
            if (!plugin || plugin.disabled)
                continue
            const __filename = path.join(___dirname, name)
            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all.call(this, m, {
                        chatUpdate,
                        __dirname: ___dirname,
                        __filename
                    })
                } catch (e) {
                    console.error(isNetworkError(e) ? `[${name}] ${describeError(e)}` : e)
                    if (!isNetworkError(e))
                        await notifyDev(m, `*Plugin:* ${name}\n*Sender:* ${m.sender}\n*Chat:* ${m.chat}\n*Command:* ${m.text}\n\n\`\`\`${hideKeys(format(e))}\`\`\``.trim(), 'all:' + name + ':' + (e?.message || ''))
                }
            }

            if (!restrictOn && plugin.tags && plugin.tags.includes('admin'))
                continue
            let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix
            let match = (_prefix instanceof RegExp ?
                [[_prefix.exec(m.text), _prefix]] :
                Array.isArray(_prefix) ?
                    _prefix.map(p => {
                        let re = p instanceof RegExp ?
                            p :
                            new RegExp(str2Regex(p))
                        return [re.exec(m.text), re]
                    }) :
                    typeof _prefix === 'string' ?
                        [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
                        [[[], new RegExp]]
            ).find(p => p[1])
            if (typeof plugin.before === 'function') {
                if (await plugin.before.call(this, m, {
                    match,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename
                }))
                    continue
            }
            if (typeof plugin !== 'function')
                continue

            const allowNoPrefix = noPrefixOk && !plugin.customPrefix && !!m.text
            let picked = null
            for (const cand of commandCandidates(m.text, (match[0] || '')[0], allowNoPrefix)) {
                const parsed = splitCommand(cand.body)
                if (acceptsCommand(plugin, parsed.command)) { picked = { ...cand, ...parsed }; break }
            }
            if (!picked)
                continue
            const { viaNoPrefix, body: noPrefix, command, args, _args, text } = picked
            usedPrefix = picked.usedPrefix
            const fail = (type, ...rest) => {
                if (viaNoPrefix && SILENT_WHEN_NOPREFIX.has(type)) return
                return (plugin.fail || global.dfail)(type, ...rest)
            }
            {
                m.plugin = name
                m.cmdName = command
                if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
                    let _chat = global.db.data.chats[m.chat]
                    let _dbUser = global.db.data.users[m.sender]
                    if (!['owner/unbanchat.js', 'owner/exec.js', 'owner/exec2.js', 'group/delete.js'].includes(name) && _chat?.isBanned)
                        return
                    if (name != 'owner/unbanuser.js' && _dbUser?.banned)
                        return
                }
                if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
                    fail('owner', m, this)
                    continue
                }
                if (plugin.rowner && !isROwner) {
                    fail('rowner', m, this)
                    continue
                }
                if (plugin.owner && !isOwner) {
                    fail('owner', m, this)
                    continue
                }
                if (plugin.premium && !isPrems) {
                    fail('premium', m, this)
                    continue
                }
                if (plugin.group && !m.isGroup) {
                    fail('group', m, this)
                    continue
                } else if (plugin.botAdmin && !isBotAdmin) {
                    fail('botAdmin', m, this)
                    continue
                } else if (plugin.admin && !isAdmin) {
                    fail('admin', m, this)
                    continue
                }
                if (plugin.private && m.isGroup) {
                    fail('private', m, this)
                    continue
                }
                if (plugin.register == true && _user.registered == false) {
                    fail('unreg', m, this)
                    continue
                }
                m.isCommand = true
                let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17
                if (xp > 200)
                    console.log("ngecit -_-");
                else
                    m.exp += xp
                const isGroupLimitDisabled = m.isGroup && chat && chat.disableLimit
                const limitUnlimited = !isLimitEnabled() || isOwner || isGroupLimitDisabled
                const requiredLimit = !limitUnlimited
                    ? (plugin.limit === true ? 1 : Number(plugin.limit) || 0)
                    : 0
                if (requiredLimit > 0) {
                    const currentLimit = Number(global.db.data.users[m.sender].limit || 0)
                    if (currentLimit < requiredLimit) {
                        const tier = getTier(global.db.data.users[m.sender], m.sender)
                        this.reply(m.chat, limitText({ limit: currentLimit, quota: quotaOf(tier), reset: formatCountdown(nextResetAt() - Date.now()) }), m)
                        continue
                    }
                }
                if (plugin.level > _user.level) {
                    this.reply(m.chat, `[💬] Diperlukan level ${plugin.level} untuk menggunakan perintah ini\n*Level mu:* ${_user.level} 📊`, m)
                    continue
                }
                let extra = {
                    match,
                    usedPrefix,
                    noPrefix,
                    _args,
                    args,
                    command,
                    text,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename
                }
                global.__inflight = (global.__inflight || 0) + 1
                try {
                    m.startedAt = Date.now()
                    if (plugin.wait) await m.wait().catch(() => { })
                    await plugin.call(this, m, extra)
                    if (!limitUnlimited) {
                        const cost = plugin.limit === true ? 1 : Number(plugin.limit) || 0
                        m.limit = Number(m.limit) || cost
                    }
                } catch (e) {
                    m.error = e
                    const net = isNetworkError(e)
                    console.error(net ? `[${m.plugin}] ${describeError(e)}` : e)
                    if (e) {
                        const text = hideKeys(net ? describeError(e) : format(e))
                        if (e.name && !net)
                            await notifyDev(m, `*🗂️ Plugin:* ${m.plugin}\n*👤 Sender:* ${m.sender}\n*💬 Chat:* ${m.chat}\n*💻 Command:* ${usedPrefix}${command} ${args.join(' ')}\n📄 *Error Logs:*\n\n\`\`\`${text}\`\`\``.trim(), 'cmd:' + m.plugin + ':' + (e.message || ''))
                        m.reply(typeof e === 'string' ? text : errorText(net ? text : hideKeys(e.message || e.error || text), m.plugin))
                    }
                } finally {
                    global.__inflight = Math.max(0, (global.__inflight || 1) - 1)
                    if (typeof plugin.after === 'function') {
                        try {
                            await plugin.after.call(this, m, extra)
                        } catch (e) {
                            console.error(e)
                        }
                    }
                    if (m.limit)
                        m.reply(+m.limit + ' Limit kamu terpakai ✔️')
                }
                break
            }
        }
    } catch (e) {
        console.error(e)
    } finally {
        let user, stats = global.db.data.stats
        if (m) {
            if (m.sender && (user = global.db.data.users[m.sender])) {
                user.exp += Number(m.exp) || 0
                user.limit -= Number(m.limit) || 0
                if (user.limit < 0) user.limit = 0
            }
            let stat
            if (m.plugin) {
                let now = Date.now()
                if (m.plugin in stats) {
                    stat = stats[m.plugin]
                    if (!isNumber(stat.total)) stat.total = 1
                    if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1
                    if (!isNumber(stat.last)) stat.last = now
                    if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error != null ? 0 : now
                    stat.total += 1
                    stat.last = now
                    if (m.error == null) {
                        stat.success += 1
                        stat.lastSuccess = now
                    }
                } else
                    stat = stats[m.plugin] = {
                        total: 1,
                        success: m.error != null ? 0 : 1,
                        last: now,
                        lastSuccess: m.error != null ? 0 : now
                    }
            }
        }
        try {
            await printLog(m, this)
        } catch (e) {
            console.log(m, m.quoted, e)
        }
        if (m?.key && global.db.data.settings[this.user.jid]?.autoread)
            await conn.readMessages([m.key]).catch(() => { })
    }
}
/**
 * Handle groups participants update
 * @param {import('elyra-baileys').BaileysEventMap<unknown>['group-participants.update']} groupsUpdate 
 */
export async function participantsUpdate({ id, participants, action, simulate = false }) {
    if (opts['self']) return
    if (this.isInit && !simulate) return
    if (global.db.data == null)
        await loadDatabase()
    let chat = global.db.data.chats[id] || {}
    let text = ''
    switch (action) {
        case 'add':
        case 'remove':
            if (chat.welcome) {
                let groupMetadata = (conn.chats[id] || {}).metadata || await this.groupMetadata(id)

                for (let user of participants) {
                    if (action === 'add') {
                        await delay(1000)
                    }

                    let userJid
                    if (typeof user === 'string') {
                        userJid = user
                    } else if (typeof user === 'object' && user !== null) {
                        userJid = user.phoneNumber || user.id || user.jid
                    }
                    userJid = String(userJid || '').decodeJid()

                    const groupMember = groupMetadata.participants?.find(
                        p => p.id === userJid || p.lid === userJid
                    )

                    if (groupMember) {
                        if (groupMember.id && !groupMember.id.includes('@lid')) {
                            userJid = groupMember.id
                        } else {
                            console.log('[LID JID USED — no phone JID detected]')
                        }
                    }

                    userJid = this.getJid(userJid) || userJid

                    let pp;
                    try {
                        const pps = await this.profilePictureUrl(userJid, 'image')
                            .catch(_ => 'https://s3.ryzumi.net/administrator/ryzumi-perm/bot-whatsapp/default_pp.jpg')

                        const ppB = Buffer.from(await (await fetch(pps, { signal: AbortSignal.timeout(10000) })).arrayBuffer())
                        if (ppB?.length) {
                            pp = await Promise.race([uploadPomf(ppB), delay(12000).then(() => pps)]).catch(() => pps)
                        }
                    } catch (err) {
                        console.log('[AVATAR ERROR]', err)
                    }

                    const safeName = async () => {
                        try {
                            const nm = await Promise.resolve(this.getName(userJid))
                            return (nm && String(nm).trim()) || null
                        } catch {
                            return null
                        }
                    }

                    const username = (await safeName()) || userJid.split('@')[0]
                    const gcname = groupMetadata.subject || 'Unknown'
                    const gcMem = groupMetadata.participants?.length || 0

                    const welcomeBg = 'https://s3.ryzumi.net/administrator/ryzumi-perm/bot-whatsapp/welcome.jpg'
                    const leaveBg = 'https://s3.ryzumi.net/administrator/ryzumi-perm/bot-whatsapp/goodbye.jpg'

                    text = (
                        action === 'add'
                            ? (chat.sWelcome || this.welcome || 'Welcome, @user!')
                                .replace('@subject', gcname)
                                .replace('@desc', groupMetadata.desc || '')
                            : (chat.sBye || this.bye || 'Bye, @user!')
                    ).replace('@user', '@' + (userJid.split('@')[0] || username))

                    const wel = `${APIs.ryzumi}/api/image/welcome?username=${encodeURIComponent(username)}&group=${encodeURIComponent(gcname)}&avatar=${encodeURIComponent(pp || '')}&bg=${encodeURIComponent(welcomeBg)}&member=${gcMem}`
                    const lea = `${APIs.ryzumi}/api/image/leave?username=${encodeURIComponent(username)}&group=${encodeURIComponent(gcname)}&avatar=${encodeURIComponent(pp || '')}&bg=${encodeURIComponent(leaveBg)}&member=${gcMem}`

                    try {
                        await this.sendMessage(id, {
                            image: { url: action === 'add' ? wel : lea },
                            caption: text,
                            contextInfo: { mentionedJid: [userJid] },
                        })
                    } catch (e) {
                        console.log('[MESSAGE SEND ERROR]', e)
                    }
                }
            } else {
                console.log('[WELCOME SYSTEM DISABLED]')
            }
            break
        case 'promote':
            text = (chat.sPromote || this.spromote || conn.spromote || '@user ```is now Admin```')
        case 'demote':
            if (!text)
                text = (chat.sDemote || this.sdemote || conn.sdemote || '@user ```is no longer Admin```')

            let user0 = participants[0]
            if (user0) {
                let userJid = String(user0).decodeJid()
                userJid = this.getJid(userJid) || userJid
                text = text.replace('@user', '@' + userJid.split('@')[0])
            } else {
                text = text.replace('@user', '')
            }

            if (chat.detect) {
                this.sendMessage(id, {
                    text,
                    mentions: this.parseMention(text)
                })
            }
            break
    }
}

/**
 * Handler groups update
 * @param {import('elyra-baileys').BaileysEventMap<unknown>['groups.update']} groupsUpdate 
 */
export async function groupsUpdate(groupsUpdate) {
    if (opts['self']) return
    for (const groupUpdate of groupsUpdate) {
        const id = groupUpdate.id
        if (!id) continue
        let chats = global.db.data.chats[id],
            text = ''
        if (!chats?.detect) continue
        if (groupUpdate.desc) text = (chats.sDesc || this.sDesc || conn.sDesc || '```Description has been changed to```\n@desc').replace('@desc', groupUpdate.desc)
        if (groupUpdate.subject) text = (chats.sSubject || this.sSubject || conn.sSubject || '```Subject has been changed to```\n@subject').replace('@subject', groupUpdate.subject)
        if (groupUpdate.icon) text = (chats.sIcon || this.sIcon || conn.sIcon || '```Icon has been changed to```').replace('@icon', groupUpdate.icon)
        if (groupUpdate.revoke) text = (chats.sRevoke || this.sRevoke || conn.sRevoke || '```Group link has been changed to```\n@revoke').replace('@revoke', groupUpdate.revoke)
        if (groupUpdate.announce == true) text = (chats.sAnnounceOn || this.sAnnounceOn || conn.sAnnounceOn || '*Group has been closed!*')
        if (groupUpdate.announce == false) text = (chats.sAnnounceOff || this.sAnnounceOff || conn.sAnnounceOff || '*Group has been open!*')
        if (groupUpdate.restrict == true) text = (chats.sRestrictOn || this.sRestrictOn || conn.sRestrictOn || '*Group has been all participants!*')
        if (groupUpdate.restrict == false) text = (chats.sRestrictOff || this.sRestrictOff || conn.sRestrictOff || '*Group has been only admin!*')
        if (!text) continue
        await this.sendMessage(id, { text: text.trim() }).catch(console.error)
    }
}

export async function deleteUpdate(message) {
    try {
        const { fromMe, id, participant } = message
        if (fromMe) return

        const msgId = message.remoteJid;
        if (!msgId || !msgId.endsWith('@g.us')) return

        const chatJid = this.decodeJid(msgId);
        const chat = global.db.data.chats[chatJid] || global.db.data.chats[msgId] || {}

        if (typeof chat.delete === 'undefined' ? true : chat.delete) return

        const msg = this.serializeM(this.loadMessage(id))
        if (!msg) return

        const sender = this.getJid(msg.sender || participant)

        this.reply(msg.chat, `
Terdeteksi @${sender.split`@`[0]} telah menghapus pesan. 
Untuk mematikan fitur ini, ketik
*.disable delete*
          
Untuk menghapus pesan yang dikirim oleh Bot, reply pesan dengan perintah
*.delete*`, msg)
        this.copyNForward(msg.chat, msg).catch(e => console.error(e))
    } catch (e) {
        console.error(e)
    }
}

export async function callUpdate(calls) {
    const on = global.db.data?.settings?.[this.user?.jid]?.anticall
    if (!on) return
    for (const c of [].concat(calls || [])) {
        if (c.status === 'offer' || c.status === 'ringing') {
            await this.rejectCall(c.id, c.from).catch(console.error)
            console.log('Panggilan ditolak dari', c.from)
        }
    }
}

global.dfail = (type, m, conn) => {
    let msg = {
        rowner: '*ONLY DEVELOPER* • CMD INI HANYA UNTUK DEVELOPER BOT',
        owner: '*ONLY OWNER* • CMD INI HANYA UNTUK OWNER BOT',
        premium: '*ONLY PREMIUM* • CMD INI HANYA UNTUK PREMIUM USER',
        group: '*GROUP CHAT* • CMD INI HANYA BISA DIPAKAI DI DALAM GROUP',
        private: '*PRIVATE CHAT* • CMD INI HANYA BISA DIPAKAI DI PRIVATE CHAT',
        admin: '*ONLY ADMIN* • CMD INI HANYA UNTUK ADMIN GROUP',
        botAdmin: '*ONLY BOT ADMIN* • CMD INI HANYA BISA DIGUNAKAN KETIKA BOT MENJADI ADMIN',
        unreg: '*YOU ARE NOT REGISTERED YET* • KETIK .daftar UNTUK BISA MENGGUNAKAN FITUR INI',
        restrict: '*RESTRICT* • RESTRICT BELUM DINYALAKAN DICHAAT INI',
    }[type]
    if (msg) return conn.reply(m.chat, msg, m)
}

let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
    unwatchFile(file)
    console.log(chalk.redBright("Update 'handler.js'"))
    if (global.reloadHandler) console.log(await global.reloadHandler())
})