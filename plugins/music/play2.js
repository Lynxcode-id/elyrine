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
import axios from 'axios'
import yts from 'yt-search'
import { AIRich } from 'elyra-baileys'
import { ffmpeg } from '../../lib/converter.js'
import { ytmp3Api } from '../../lib/ytapi.js'

const FOOTER = '© 𝙴𝚁𝙸𝙽𝙴-𝙰𝙸 ~ 𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝚃𝙸𝙾𝙽'
const LRCLIB = 'https://lrclib.net/api'
const UA = 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36'
const MAX_AUDIO = 25 * 1024 * 1024
const MAX_SECONDS = 15 * 60

const BUDGET_BYTES = 640 * 1024
const MIN_KBPS = 12
const MAX_KBPS = 40
const MAX_HTML = 1_000_000
const COVER_SIZE = 320
const LOGO_SIZE = 96

const YT_ID = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:\S*&)?v=|shorts\/|embed\/|live\/)|music\.youtube\.com\/watch\?(?:\S*&)?v=)([\w-]{11})/i

const isAudio = b => {
  if (!b || b.length < 12) return false
  const a = b.subarray(0, 4).toString('latin1'), h = b.subarray(0, 4).toString('hex')
  return a.startsWith('ID3') || a === 'OggS' || a === 'RIFF' || h === '1a45dfa3' || /^ff[ef][0-9a-f]$/.test(h.slice(0, 4)) || b.subarray(4, 8).toString('latin1') === 'ftyp'
}

const cleanArtist = n => String(n || '').replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').trim()
const cleanTitle = t => String(t || '').replace(/\s*[\(\[][^\)\]]*(official|video|lyric|audio|mv|visualizer|hd|4k)[^\)\]]*[\)\]]/gi, '').trim()

function parseLrc(lrc = '') {
  const re = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g
  const out = []
  for (const line of lrc.split(/\r?\n/)) {
    const marks = [...line.matchAll(re)]
    const text = line.replace(re, '').trim()
    if (!marks.length || !text) continue
    for (const x of marks) {
      const f = x[3] ? Number(x[3].padEnd(3, '0').slice(0, 3)) / 1000 : 0
      out.push({ time: Number(x[1]) * 60 + Number(x[2]) + f, text })
    }
  }
  return out.sort((a, b) => a.time - b.time)
}

function plainToTimed(plain = '', duration = 0) {
  const lines = plain.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (!lines.length) return []
  const step = duration > 0 && lines.length > 1 ? Math.max(2, Math.min(8, duration / lines.length)) : 5
  return lines.map((text, i) => ({ time: i * step, text }))
}

async function getLyrics({ title, artist, duration }) {
  const get = async params => {
    const { data } = await axios.get(`${LRCLIB}/${params.path}`, { params: params.query, headers: { 'User-Agent': 'ERINE-AI-Play2/1.0' }, timeout: 15000 })
    return Array.isArray(data) ? data[0] : data
  }
  const tries = [
    { path: 'get', query: { track_name: title, artist_name: artist, ...(duration > 0 && { duration: Math.round(duration) }) } },
    { path: 'search', query: { q: `${title} ${artist}` } }
  ]
  for (const t of tries) {
    try {
      const d = await get(t)
      if (!d) continue
      const lines = d.syncedLyrics ? parseLrc(d.syncedLyrics) : plainToTimed(d.plainLyrics || '', duration)
      if (lines.length) return { lines, album: d.albumName || '' }
    } catch { }
  }
  return { lines: [], album: '' }
}

async function getThumb(v) {
  const id = v.videoId
  const urls = [id && `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, v.image, v.thumbnail].filter(Boolean)
  for (const u of urls) {
    try {
      const { data } = await axios.get(u, { responseType: 'arraybuffer', timeout: 15000 })
      const { default: sharp } = await import('sharp')
      const jpg = await sharp(Buffer.from(data)).resize(COVER_SIZE, COVER_SIZE, { fit: 'cover' }).jpeg({ quality: 65, mozjpeg: true }).toBuffer()
      return `data:image/jpeg;base64,${jpg.toString('base64')}`
    } catch { }
  }
  return ''
}

async function compress(buffer, duration) {
  const secs = Math.max(1, duration || 180)
  let kbps = Math.max(MIN_KBPS, Math.min(MAX_KBPS, Math.floor((BUDGET_BYTES * 8) / secs / 1000)))
  let best
  for (let i = 0; i < 4; i++) {
    const out = await ffmpeg(buffer, [
      '-vn', '-ac', '1', '-ar', '48000',
      '-c:a', 'libopus', '-b:a', `${kbps}k`, '-vbr', 'on',
      '-application', 'audio', '-frame_duration', '40', '-compression_level', '10'
    ], 'mp3', 'webm')
    best = out.data
    await out.delete()
    if (best.length <= BUDGET_BYTES || kbps <= MIN_KBPS) break
    kbps = Math.max(MIN_KBPS, Math.floor(kbps * 0.85))
  }
  return best
}

let logoCache
async function getLogo() {
  if (logoCache !== undefined) return logoCache
  try {
    const { default: sharp } = await import('sharp')
    const buf = await sharp(path.join(process.cwd(), 'src', 'erine.webp')).resize(LOGO_SIZE, LOGO_SIZE, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer()
    logoCache = `data:image/jpeg;base64,${buf.toString('base64')}`
  } catch { logoCache = '' }
  return logoCache
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const PLAYER_HTML = `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>
:root{color-scheme:light;--y:#facc15;--y2:#fde047;--y3:#fef3c7;--ink:#111;--mut:#6b6b6b;--line:#eee}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;min-height:100vh;color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#fff}
button{font:inherit;color:inherit;cursor:pointer;border:0;background:none;padding:0}
.app{width:min(100%,420px);margin:0 auto;padding:18px 16px 24px}
.top{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.brand{display:flex;align-items:center;gap:10px;min-width:0}
.logo{width:38px;height:38px;border-radius:12px;object-fit:cover;box-shadow:0 0 0 2px var(--y),0 0 18px rgba(250,204,21,.7);background:var(--y)}
.bn{font-size:13px;font-weight:800;letter-spacing:.06em}.bs{font-size:10px;color:var(--mut);margin-top:2px}
.status{display:flex;align-items:center;gap:6px;padding:6px 11px;border-radius:99px;font-size:10px;font-weight:700;background:var(--y3);color:#854d0e}
.dot{width:6px;height:6px;border-radius:50%;background:var(--y);box-shadow:0 0 8px var(--y)}
.card{position:relative;border-radius:28px;padding:18px;background:#fff;border:1px solid #f5e9a8;box-shadow:0 18px 60px rgba(250,204,21,.45),0 2px 10px rgba(0,0,0,.06)}
.cover{position:relative;width:100%;aspect-ratio:1;border-radius:20px;overflow:hidden;background:var(--y);display:grid;place-items:center;box-shadow:0 16px 40px rgba(250,204,21,.55),0 6px 16px rgba(0,0,0,.18)}
.cover img{width:100%;height:100%;object-fit:cover;display:block}
.row{display:flex;align-items:center;gap:12px;margin-top:20px}
.info{min-width:0;flex:1}
.title{font-size:22px;font-weight:800;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.artist{font-size:14px;color:var(--mut);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.album{font-size:11px;color:#a16207;margin-top:6px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.badge{flex:none;width:34px;height:34px;border-radius:50%;background:var(--y);display:grid;place-items:center;box-shadow:0 0 16px rgba(250,204,21,.9)}
.badge svg{width:18px;height:18px;color:#111}
.progress{position:relative;height:5px;border-radius:99px;background:#e8e8e8;margin-top:22px;cursor:pointer;touch-action:none}
.progress:before{content:"";position:absolute;inset:-12px 0}
.fill{position:relative;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,var(--y2),var(--y));box-shadow:0 0 12px rgba(250,204,21,.9);pointer-events:none}
.fill:after{content:"";position:absolute;right:-6px;top:50%;width:13px;height:13px;margin-top:-6.5px;border-radius:50%;background:#fff;border:3px solid var(--y);box-shadow:0 0 10px rgba(250,204,21,.9)}
.times{display:flex;justify-content:space-between;color:var(--mut);font-size:11px;margin-top:10px;font-variant-numeric:tabular-nums}
.controls{display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding:0 6px}
.ctrl{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;color:#333}
.ctrl.on{color:#ca8a04;background:var(--y3)}
.play{width:68px;height:68px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#fff08a,var(--y) 70%);color:#111;box-shadow:0 0 0 6px rgba(250,204,21,.25),0 10px 34px rgba(250,204,21,.95)}
svg{width:24px;height:24px;display:block}.play svg{width:28px;height:28px}
.vol{display:flex;align-items:center;gap:10px;margin-top:16px;color:var(--mut);font-size:11px}
.vol svg{width:18px;height:18px;flex:none}
input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:5px;border-radius:99px;background:#e8e8e8;outline:0}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;background:#fff;border:3px solid var(--y);box-shadow:0 0 10px rgba(250,204,21,.9)}
input[type=range]::-moz-range-thumb{width:11px;height:11px;border-radius:50%;background:#fff;border:3px solid var(--y)}
.lcard{margin-top:16px;border-radius:26px;overflow:hidden;background:linear-gradient(160deg,#fde047,#facc15 55%,#eab308);box-shadow:0 14px 44px rgba(250,204,21,.55)}
.lh{display:flex;align-items:center;justify-content:space-between;padding:16px 20px 6px;font-size:12px;font-weight:800;letter-spacing:.08em;color:#422006}
.pill{font-size:9px;font-weight:800;background:rgba(255,255,255,.55);border-radius:99px;padding:5px 9px;color:#422006}
.lyrics{height:200px;overflow:auto;scrollbar-width:none;padding:6px 20px 22px}
.lyrics::-webkit-scrollbar{display:none}
.ln{font-size:17px;line-height:1.35;font-weight:800;color:rgba(66,32,6,.38);padding:7px 0;transition:.25s;overflow-wrap:anywhere;cursor:pointer}
.ln.on{color:#111;transform:scale(1.04);transform-origin:left center;text-shadow:0 0 22px rgba(255,255,255,.9)}
.empty{font-size:13px;font-weight:700;color:#422006;padding:22px 0}
.foot{display:flex;align-items:center;justify-content:center;gap:8px;color:var(--mut);font-size:10px;padding:18px 6px 0}
.foot img{width:18px;height:18px;border-radius:6px;object-fit:cover}
.foot b{color:#a16207;letter-spacing:.1em}
</style></head><body>
<main class="app">
<header class="top"><div class="brand"><img class="logo" id="logo" alt=""><div><div class="bn">ERINE-AI</div><div class="bs">Music Player</div></div></div><div class="status"><span class="dot"></span><span id="status">MEMUAT</span></div></header>
<section class="card">
<div class="cover" id="cover"><img id="cimg" alt=""></div>
<div class="row"><div class="info"><div class="title" id="title"></div><div class="artist" id="artist"></div><div class="album" id="album"></div></div>
<div class="badge"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 18V5l12-2v13a3 3 0 1 1-2-2.8V6.4L11 7.6V18a3 3 0 1 1-2-2.8z" transform="scale(.9) translate(1 1)"/></svg></div></div>
<div class="progress" id="progress"><div class="fill" id="fill"></div></div>
<div class="times"><span id="cur">0:00</span><span id="dur">0:00</span></div>
<div class="controls">
<button class="ctrl" id="loop" aria-label="Ulangi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg></button>
<button class="ctrl" id="back" aria-label="Mundur 10 detik"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg></button>
<button class="play" id="play" aria-label="Putar"><svg id="ico-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.6v12.8a.8.8 0 0 0 1.2.68l10-6.4a.8.8 0 0 0 0-1.36l-10-6.4A.8.8 0 0 0 8 5.6Z"/></svg><svg id="ico-pause" viewBox="0 0 24 24" fill="currentColor" style="display:none"><rect x="6" y="5" width="4.2" height="14" rx="1.2"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2"/></svg></button>
<button class="ctrl" id="fwd" aria-label="Maju 10 detik"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg></button>
<button class="ctrl" id="top" aria-label="Ke awal"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM19 6.2v11.6a1 1 0 0 1-1.5.86l-9.8-5.8a1 1 0 0 1 0-1.72l9.8-5.8a1 1 0 0 1 1.5.86Z"/></svg></button>
</div>
<div class="vol"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg><input type="range" id="vol" min="0" max="1" step=".01" value=".8"><span id="vol-l" style="min-width:30px;text-align:right">80%</span></div>
</section>
<section class="lcard"><div class="lh"><span>LYRICS</span><span class="pill" id="lstat">SYNC</span></div><div class="lyrics" id="lyrics"></div></section>
<footer class="foot"><img id="flogo" alt=""><b>ERINE-AI</b><span>with love, elyra !!</span></footer>
</main>
<script>
(function(){
var T=__TRACK__;
var $=function(i){return document.getElementById(i)};
var ctx,gain,buf,src,decoded=false,playing=false,t0=0,off=0,loop=false,lines=T.lyrics||[],els=[],act=-1;
function f(v){v=Math.max(0,Math.floor(v||0));return Math.floor(v/60)+':'+String(v%60).padStart(2,'0')}
function st(t){$('status').textContent=t}
$('title').textContent=T.title;$('artist').textContent=T.artist;$('album').textContent=T.album||'';$('dur').textContent=f(T.duration);
$('logo').src=T.logo;$('flogo').src=T.logo;$('cimg').src=T.cover||T.logo;
$('cimg').onerror=function(){this.onerror=null;this.src=T.logo};
if(!lines.length){$('lyrics').innerHTML='<div class="empty">Lirik tidak tersedia untuk lagu ini ✦</div>';$('lstat').textContent='NO LYRICS'}
else lines.forEach(function(l,i){var d=document.createElement('div');d.className='ln';d.textContent=l.text;d.onclick=function(){seek(l.time)};$('lyrics').appendChild(d);els.push(d)});
function pos(){return playing?Math.min(buf.duration,ctx.currentTime-t0):off}
function stop(){if(src){try{src.onended=null;src.stop()}catch(e){}try{src.disconnect()}catch(e){}src=null}}
function start(o){stop();src=ctx.createBufferSource();src.buffer=buf;src.connect(gain);o=Math.max(0,Math.min(o,buf.duration-.05));src.start(0,o);t0=ctx.currentTime-o;off=o;playing=true;ui(true);src.onended=function(){if(!playing)return;if(pos()>=buf.duration-.3){if(loop){start(0)}else{playing=false;off=0;stop();ui(false);tick()}}}}
function ui(p){$('ico-play').style.display=p?'none':'block';$('ico-pause').style.display=p?'block':'none';st(p?'NOW PLAYING':'PAUSED')}
function toggle(){if(!decoded)return;if(ctx.state==='suspended')ctx.resume();if(playing){off=pos();stop();playing=false;ui(false)}else start(off>=buf.duration?0:off)}
function seek(t){if(!decoded)return;t=Math.max(0,Math.min(buf.duration,t));if(playing)start(t);else off=t;tick()}
function tick(){if(!decoded)return;var c=pos();$('fill').style.width=(c/buf.duration*100)+'%';$('cur').textContent=f(c);if(!lines.length)return;var idx=-1;for(var i=0;i<lines.length;i++){if(lines[i].time<=c)idx=i;else break}if(idx===act)return;act=idx;els.forEach(function(e,i){e.classList.toggle('on',i===idx)});if(idx>=0){var a=els[idx],box=$('lyrics');box.scrollTo({top:Math.max(0,a.offsetTop-box.offsetTop-box.clientHeight/2+a.offsetHeight/2),behavior:'smooth'})}}
setInterval(tick,250);
function b2a(u){var b=atob(u.slice(u.indexOf(',')+1)),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a.buffer}
function init(){
try{var C=window.AudioContext||window.webkitAudioContext;ctx=new C();gain=ctx.createGain();gain.gain.value=.8;gain.connect(ctx.destination);
var ok=function(b){buf=b;decoded=true;$('dur').textContent=f(b.duration);st('SIAP DIPUTAR')},bad=function(){st('GAGAL DECODE')};
var p=ctx.decodeAudioData(b2a(T.audio),ok,bad);if(p&&p.then)p.then(function(b){if(!decoded)ok(b)},function(){})}catch(e){st('GAGAL DECODE')}}
$('play').onclick=toggle;
$('back').onclick=function(){seek(pos()-10)};$('fwd').onclick=function(){seek(pos()+10)};
$('top').onclick=function(){seek(0)};
$('loop').onclick=function(){loop=!loop;this.classList.toggle('on',loop)};
$('vol').oninput=function(){var v=Number(this.value);if(gain)gain.gain.value=v;$('vol-l').textContent=Math.round(v*100)+'%'};
var drag=false;function sk(x){var r=$('progress').getBoundingClientRect();if(decoded)seek(Math.max(0,Math.min(1,(x-r.left)/r.width))*buf.duration)}
$('progress').addEventListener('pointerdown',function(e){drag=true;sk(e.clientX)});
$('progress').addEventListener('pointermove',function(e){if(drag)sk(e.clientX)});
window.addEventListener('pointerup',function(){drag=false});
init();
})();
</script></body></html>`

const buildPlayer = track => PLAYER_HTML.replace('__TRACK__', () => JSON.stringify(track).replace(/</g, '\\u003c'))

async function sendPlayer(conn, m, html, title) {
  const rich = new AIRich(conn)
  if (typeof rich.setTitle === 'function') rich.setTitle(title)
  rich.addSection({
    view_model: {
      __typename: 'GenAISingleLayoutViewModel',
      primitive: { __typename: 'FOAHtmlPrimitiveDemoDONOTUSE', trusted_sources: [], payload: html }
    }
  })
  if (typeof rich.setFooter === 'function') rich.setFooter(FOOTER)
  await rich.send(m.chat, { quoted: m })
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const query = (text || '').trim()
  if (!query) throw `*Contoh:* ${usedPrefix || '.'}${command} another love tom odell`

  await m.react('🎧').catch(() => { })

  let v
  try {
    const id = query.match(YT_ID)?.[1]
    v = id ? await yts({ videoId: id }) : ((await yts(query))?.videos || [])[0]
    if (v && !v.url) v.url = `https://youtu.be/${v.videoId || id}`
  } catch (e) {
    await m.react('❌').catch(() => { })
    return m.gagal('Terjadi kesalahan saat mencari di YouTube.', 'YouTube Search')
  }
  if (!v) {
    await m.react('❌').catch(() => { })
    return m.gagal(`Lagu "${query}" tidak ditemukan.`, 'YouTube Search')
  }
  if (v.seconds > MAX_SECONDS) {
    await m.react('❌').catch(() => { })
    return m.gagal(`Durasi terlalu panjang (${v.timestamp}). Maksimal ${MAX_SECONDS / 60} menit.`, 'Play2')
  }

  const title = cleanTitle(v.title) || v.title
  const artist = cleanArtist(v.author?.name) || 'YouTube'
  const duration = v.seconds || 0

  let raw, info
  try {
    info = await ytmp3Api(v.url)
    const res = await axios.get(info.download_url, {
      responseType: 'arraybuffer', timeout: 120000, maxContentLength: MAX_AUDIO, maxBodyLength: MAX_AUDIO,
      headers: { 'User-Agent': UA }
    })
    raw = Buffer.from(res.data)
    if (!isAudio(raw)) throw new Error('Server mengembalikan data yang bukan audio.')
  } catch (e) {
    await m.react('❌').catch(() => { })
    const big = /maxContentLength|exceeded/i.test(e.message)
    return m.gagal(big ? 'Ukuran audio melebihi 25MB.' : `Gagal mengambil audio: ${e.message}`, 'Theresav')
  }

  try {
    const [lyr, cover, logo, webm] = await Promise.all([
      getLyrics({ title, artist, duration }),
      getThumb(v),
      getLogo(),
      compress(raw, duration)
    ])

    const html = buildPlayer({
      title,
      artist,
      album: lyr.album,
      duration,
      cover,
      logo,
      lyrics: lyr.lines,
      audio: `data:audio/webm;codecs=opus;base64,${webm.toString('base64')}`
    })

    if (html.length > MAX_HTML) throw new Error(`Player terlalu besar (${(html.length / 1048576).toFixed(2)}MB)`)

    await sendPlayer(conn, m, html, `🎧 ${esc(title)}`)
    await m.react('✅').catch(() => { })
  } catch (e) {
    console.error('[PLAY2]', e?.stack || e?.message || e)
    try {
      const name = String(title).replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 80)
      await conn.sendMessage(m.chat, { audio: raw, mimetype: 'audio/mpeg', fileName: `${name}.mp3` }, { quoted: m })
      await m.react('✅').catch(() => { })
    } catch {
      await m.react('❌').catch(() => { })
      return m.gagal(`Gagal mengirim player: ${e.message}`, 'Play2')
    }
  }
}

handler.command = /^(play2)$/i
handler.help = ['play2 <judul / link youtube>']
handler.tags = ['music']
handler.wait = true
handler.limit = true
handler.register = true

export default handler
