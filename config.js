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

import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import moment from 'moment-timezone'

let wktuwib = moment.tz('Asia/Jakarta').format('HH:mm:ss') + ' WIB';
let d = new Date(new Date + 3600000)
let locale = 'id'

let week = d.toLocaleDateString(locale, { weekday: 'long' })
let date = d.toLocaleDateString(locale, {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)

global.pairing = '6282' // Ganti ke nomor bot untuk pairing
global.owner = [['62883', 'Arman Maulana (Lynx decode)', true]] // no owmer + namanya
global.nomorbot = '62882' // No bot 
global.nomorown = '62882' // No owner

// Setelan Wm Sticker
global.readMore = readMore
global.author = 'Arman Maulana (Lynx decode)'
global.sessionId = 'erine'
global.sessionDir = 'sessions'
global.namebot = 'ERINE-AI'
global.wm = '© ERINE-AI • Arman Maulana (Lynx decode)'
global.botdate = `⫹⫺ DATE: ${week} ${date}\n⫹⫺ 𝗧𝗶𝗺𝗲: ${wktuwib}`
global.stickpack = 'ERINE-AI • ELYRINE'
global.stickauth = 'lynx decode, whatsapp bot baileys'

// Setelan Link gaje
global.sig = '-'
global.sgc = 'https://whatsapp.com/channel/0029Vb2qO9Q5vKAGd2t7ap1F'
global.sfb = '-'
global.qris = 'https://api.ryzumi.net/assets/images/qris.png'

// Global respon elyrine..
global.wait = global.proses = [
  '🌱 ERINE-AI',
  'Sedang memproses permintaanmu...',
  '',
  '⌁ Connecting to AI engine',
  '⌁ Please wait a moment.',
].join('\n')

global.eror = global.error = [
  '🌱 ERINE-AI',
  'Something went wrong.',
  '',
  '{errorMessage}',
  '',
  '◦ Status: Failed',
  '◦ Engine: {provider}',
  '',
  'Silakan coba beberapa saat lagi.',
].join('\n')

global.limitHabis = [
  '🌱 ERINE-AI',
  'Your AI limit has been reached.',
  '',
  'Limit tersisa: {limit}',
  '',
  'Silakan tunggu reset limit',
  'atau gunakan akses premium.',
  '',
  'ERINE-AI © INF PROJECT',
].join('\n')

global.sukses = [
  '🌱 ERINE-AI',
  'Response generated successfully.',
  '',
  '{response}',
  '',
  '✓ Completed · {processingTime}',
  '',
  'Powered by ERINE-AI',
].join('\n')

// Setelan apikey dan rest api elyrine..
global.APIs = {
  ryzumi: 'https://api.ryzumi.net',
  theresav: 'https://api.theresav.eu',
  lynxapis: 'https://lynxapis.my.id',
  yonz: 'https://api.yonz.cloud',
  xrina: 'https://apiii-xrina.my.id',
  nexray: 'https://api.nexray.eu.cc',
  jerexd: 'https://api.jerexd.my.id',
  jagoan: 'https://api.jagoanproject.com',
  apicloud: 'https://api-cloud.my.id',
  haidarxd: 'https://api.haidarxd.my.id',
}

// Set pake apikeylu sendiri ambil dari link web diatas global.APIs
// beberapa apikey disini sudah disediakan gratis dengan tier gratisan
global.APIKeys = {
  'https://api.theresav.eu': 'bBOYF',
  'https://catbox.moe': '2803f9fedb5557c59bd9378c4',
  'https://c.termai.cc': 'AIzaBj7z2z3xBjsk',
  'https://api.yonz.cloud': '6A98',
  'https://api.jerexd.my.id': '',
  'https://api.jagoanproject.com': '',
  'https://lynxstore.my.id': '',
  'https://api.haidarxd.my.id': '',
}

// Setelan Create Panel Pterodatyle
// global.APIs.panel = 'https://panel-kamu.com'
// global.APIKeys['plta'] = 'ptla_apikeymu'
// global.APIKeys['pltc'] = 'ptlc_apikeymu'
// global.panelCfg = {
//  nest: 1, egg: 15,
//  docker_image: 'ghcr.io/parkervcp/yolks:nodejs_22',
//  startup: '...',
//  environment: { STARTUP_CMD: 'npm start', GIT_ADDRESS: '', MAIN_FILE: 'index.js' },
//  location: 1,
//  databases: 0, backups: 0, allocations: 1

// Setelan Entahlah 
global.thumbbc = 'https://telegra.ph/file/05f874dc87f7e27fa8127.jpg'
global.htki = '––––––『'
global.htka = '』––––––'
global.lopr = 'Ⓟ'
global.lolm = 'Ⓛ'
global.htjava = '⫹⫺'
global.autoFollowChannel = false
global.multiplier = 0

global.digitalocean = {
  token: '',
  region: 'sgp1',
  image: 'ubuntu-22-04-x64',
  tags: ['elyrine-bot'],
  sellers: [],
  plans: {
    vps1g1c: { size: 's-1vcpu-1gb', ram: '1GB', cpu: '1 vCPU' },
    vps2g1c: { size: 's-1vcpu-2gb', ram: '2GB', cpu: '1 vCPU' },
    vps2g2c: { size: 's-2vcpu-2gb', ram: '2GB', cpu: '2 vCPU' },
    vps4g2c: { size: 's-2vcpu-4gb', ram: '4GB', cpu: '2 vCPU' },
    vps8g4c: { size: 's-4vcpu-8gb', ram: '8GB', cpu: '4 vCPU' }
  }
}

global.vercel = {
  token: process.env.VERCEL_TOKEN || '',
  teamId: ''
}

global.linode = {
  token: process.env.LINODE_TOKEN || '',
  region: 'ap-south',
  image: 'linode/ubuntu22.04'
}

const WA_BROWSER_PRESETS = {
  macos:   ['Mac OS',  'Chrome', '14.4.1'],
  android: ['Android', 'Chrome', '14.0.0'],
  windows: ['Windows', 'Chrome', '10.0.22631'],
  ubuntu:  ['Ubuntu',  'Chrome', '22.04.4']
}
const WA_BROWSER_PRESET = 'macOS'
const WA_BROWSER_CUSTOM = null

global.waBrowser = WA_BROWSER_CUSTOM
  || WA_BROWSER_PRESETS[String(process.env.WA_BROWSER || WA_BROWSER_PRESET).toLowerCase()]
  || WA_BROWSER_PRESETS.macos

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})
