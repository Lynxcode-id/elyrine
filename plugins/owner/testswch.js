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

import fs from 'fs'
import { listSaluran, getOwnerSaluran, labelSaluran } from '../../lib/saluran.js'
import { ensureSwch, canPostChannelStatus, postChannelStatus, getNewsletterStatusReceipt } from '../../lib/swch.js'

const LP_URL = 'https://github.com/Lynxcode-id/elyrine-baileys'
const LP_TITLE = 'ERINE-AI ~ elyrine-baileys'
const THUMB_PATH = './src/erine.webp'

const sleep = ms => new Promise(r => setTimeout(r, ms))

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let onlyOwner = false
    let mode = 'preview'
    let pick = null
    for (const arg of String(text || '').trim().split(/\s+/).filter(Boolean)) {
        const v = arg.toLowerCase()
        if (v === '-o') onlyOwner = true
        else if (v === 'status') mode = 'status'
        else if (v === 'preview') mode = 'preview'
        else if (/^\d+$/.test(v)) pick = Number(v)
    }

    const all = listSaluran()
    if (!all.length) return m.reply(`❌ Belum ada saluran. Tambah dulu:\n${usedPrefix}addsaluran idch|owner`)

    let targets = all
    if (onlyOwner) {
        const owner = getOwnerSaluran()
        if (!owner) return m.reply(`❌ Belum ada saluran OWNER. Set dulu:\n${usedPrefix}addsaluran idch|owner`)
        targets = [owner]
    } else if (pick) {
        const ch = all[pick - 1]
        if (!ch) return m.reply(`❌ Nomor ${pick} tidak ada. Cek ${usedPrefix}listsaluran`)
        targets = [ch]
    }

    if (mode === 'preview' && typeof conn.sendLinkPreview !== 'function') {
        return m.reply('❌ conn.sendLinkPreview tidak ada. Pastikan elyrine-baileys terpasang versi terbaru (npm i elyrine-baileys@latest).')
    }
    if (mode === 'status') {
        try { ensureSwch(conn) } catch (e) { return m.reply(`❌ ${e.message}`) }
    }

    const thumbnail = fs.existsSync(THUMB_PATH) ? fs.readFileSync(THUMB_PATH) : undefined
    const ok = []
    const fail = []

    for (let i = 0; i < targets.length; i++) {
        const ch = targets[i]
        const label = labelSaluran(ch)
        try {
            if (mode === 'preview') {
                await conn.sendLinkPreview(ch.id, {
                    text: `Tes link preview saluran (swch)\n${label}`,
                    url: LP_URL,
                    title: LP_TITLE,
                    description: global.ucapan || 'elyrine-baileys',
                    ...(thumbnail && { thumbnail })
                })
                ok.push(label)
            } else {
                const cap = await canPostChannelStatus(conn, ch.id)
                if (!cap.canPost) {
                    fail.push(`${label}: bot tidak punya izin posting status (capabilities=[${(cap.capabilities || []).join(', ')}])`)
                    continue
                }
                const res = await postChannelStatus(conn, ch.id, { text: `Tes status saluran (swch)\n${LP_URL}` }, { serverIdTimeoutMs: 20000 })
                const receipt = getNewsletterStatusReceipt(res)
                if (receipt.serverId) ok.push(`${label} (ID: ${receipt.serverId})`)
                else if (receipt.ackReceived || receipt.echoReceived) ok.push(`${label} (terkirim, ID belum terbaca)`)
                else fail.push(`${label}: server tidak memberi ACK maupun echo`)
            }
        } catch (e) {
            fail.push(`${label}: ${e?.message || e}`)
        }
        if (i < targets.length - 1) await sleep(800)
    }

    m.reply([
        `*TES SWCH* · mode ${mode}`,
        ok.length && `✅ Berhasil ke ${ok.length} saluran:\n${ok.map(v => '• ' + v).join('\n')}`,
        fail.length && `❌ Gagal ${fail.length} saluran:\n${fail.map(v => '• ' + v).join('\n')}`
    ].filter(Boolean).join('\n\n'))
}

handler.help = ['testswch', 'testswch status', 'testswch <nomor>', 'testswch -o']
handler.tags = ['owner']
handler.command = /^(testswch)$/i
handler.owner = true

export default handler
