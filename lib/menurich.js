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

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AIRich } from './airich.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const LOGO_URL = 'https://raw.githubusercontent.com/its-dinda/image/main/1793945302377.jpeg'
const FOOTER = '© 𝙴𝚁𝙸𝙽𝙴-𝙰𝙸 ~ 𝙼𝙴𝙽𝚄 𝟸'

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const fontCache = new Map()
function fontB64(...candidates) {
    const key = candidates.join('|')
    if (fontCache.has(key)) return fontCache.get(key)
    let out = null
    for (const rel of candidates) {
        try { out = fs.readFileSync(path.join(ROOT, rel)).toString('base64'); break } catch { }
    }
    fontCache.set(key, out)
    return out
}
function fontFaces() {
    const defs = [
        ['EGOS', ['font/GameOfSquids.ttf']],
        ['EOT', ['font/OriginTech.ttf']],
        ['EHD', ['font/subset/Heading.ttf', 'font/Heading.ttf']]
    ]
    return defs.map(([fam, files]) => {
        const b = fontB64(...files)
        return b ? `@font-face{font-family:'${fam}';src:url(data:font/ttf;base64,${b}) format('truetype');font-display:swap}` : ''
    }).join('\n')
}

let logoCache
async function getLogo() {
    if (logoCache !== undefined) return logoCache
    try {
        const { default: sharp } = await import('sharp')
        const buf = await sharp(path.join(ROOT, 'src', 'erine.webp')).resize(140, 140, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer()
        logoCache = `data:image/jpeg;base64,${buf.toString('base64')}`
    } catch { logoCache = null }
    return logoCache
}

const nmStyle = n => (/[0-9]/.test(n) ? ' style="font-family:\'EOT\',Arial Black,sans-serif;font-size:13px"' : '')

const COLORS = ['#FFD23F', '#FF7AB6', '#5AA9FF', '#5EEAA0', '#FF9F43', '#B79CFF']

const CSS = String.raw`
#a,#a *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
#a{--bg:#FFF1CC;--card:#fff;--ink:#111;--bd:#111;--mut:#555;max-width:430px;margin:0 auto;padding:10px;background:var(--bg);color:var(--ink);font-family:'EOT',Arial Black,Arial,sans-serif;border:4px solid var(--bd);border-radius:6px;user-select:none}
#a.dk{--bg:#16161d;--card:#24242e;--ink:#fff;--bd:#fff;--mut:#b8b8c8}
#a .nb{background:var(--card);border:3px solid var(--bd);border-radius:6px;box-shadow:4px 4px 0 var(--bd)}
#a .btn{cursor:pointer;transition:transform .08s,box-shadow .08s}
#a .btn:active{transform:translate(4px,4px);box-shadow:0 0 0 var(--bd)}
#a .top{display:flex;gap:11px;align-items:center;padding:11px;background:#FFD23F;color:#111;margin-bottom:12px;position:relative;overflow:hidden}
#a .top:before{content:'';position:absolute;right:-18px;top:-18px;width:70px;height:70px;background:#FF7AB6;border:3px solid #111;border-radius:50%}
#a .logo{width:58px;height:58px;flex:none;border:3px solid #111;border-radius:6px;object-fit:cover;background:#fff;position:relative}
#a .lm{display:flex;align-items:center;justify-content:center;font-family:'EGOS',Arial Black;font-size:26px}
#a .tt{min-width:0;flex:1;position:relative}
#a h1{font-family:'EGOS','EHD',Arial Black,sans-serif;font-weight:400;font-size:21px;line-height:1.05;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#a .tt p{font-family:'EOT',monospace;font-size:10px;letter-spacing:1.5px;margin-top:4px;text-transform:uppercase}
#a .tg{position:absolute;right:9px;bottom:8px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:#fff;color:#111;border:3px solid #111;border-radius:6px;box-shadow:3px 3px 0 #111;font-size:15px;z-index:2}
#a .hi{font-family:'EOT',monospace;font-size:11px;letter-spacing:1px;margin:0 2px 8px;text-transform:uppercase}
#a .gr{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:12px}
#a .st{padding:8px 10px;min-width:0}
#a .st small{display:block;font-family:'EOT',monospace;font-size:9px;letter-spacing:1.5px;color:var(--mut);text-transform:uppercase}
#a .st b{display:block;font-size:13px;letter-spacing:.5px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#a .c1{background:#5EEAA0;color:#111}#a .c2{background:#B79CFF;color:#111}#a .c3{background:#FF9F43;color:#111}#a .c4{background:#5AA9FF;color:#111}
#a .c1 small,#a .c2 small,#a .c3 small,#a .c4 small{color:#222}
#a .sr{display:flex;gap:8px;margin-bottom:10px}
#a .sr input{flex:1;min-width:0;font-family:'EOT',Arial Black,sans-serif;font-size:13px;padding:10px 11px;color:var(--ink);background:var(--card);border:3px solid var(--bd);border-radius:6px;box-shadow:4px 4px 0 var(--bd);outline:none;user-select:text;-webkit-user-select:text}
#a .sr input::placeholder{color:var(--mut)}
#a .sr .x{width:46px;flex:none;display:flex;align-items:center;justify-content:center;background:#FF7AB6;color:#111;font-size:17px}
#a .ch{display:flex;gap:7px;overflow-x:auto;padding:2px 2px 10px;margin-bottom:2px;scrollbar-width:none}
#a .ch::-webkit-scrollbar{display:none}
#a .chip{flex:none;font-family:'EOT',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;padding:7px 11px;background:var(--card);color:var(--ink);border:3px solid var(--bd);border-radius:999px;box-shadow:3px 3px 0 var(--bd);white-space:nowrap}
#a .chip.on{background:#111;color:#FFD23F}
#a.dk .chip.on{background:#FFD23F;color:#111}
#a .pv{padding:9px 11px;margin-bottom:12px;background:#111;color:#FFD23F;border-color:#111;font-family:'EOT',monospace;font-size:12px;letter-spacing:1px;box-shadow:4px 4px 0 #FF7AB6}
#a.dk .pv{border-color:#fff}
#a .pv b{display:block;font-family:'EOT',Arial Black,sans-serif;font-size:16px;color:#fff;letter-spacing:0;margin-top:3px;word-break:break-all}
#a .pv i{font-style:normal;color:#5EEAA0}
#a .cat{margin-bottom:11px;overflow:hidden}
#a .hd{display:flex;align-items:center;gap:9px;padding:10px 11px;color:#111}
#a .hd .n{font-family:'EOT',monospace;font-size:11px;width:30px;height:30px;flex:none;display:flex;align-items:center;justify-content:center;background:#fff;border:3px solid #111;border-radius:6px}
#a .hd .nm{flex:1;min-width:0;font-family:'EHD','EOT',Arial Black,sans-serif;font-size:20px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#a .hd .cnt{font-family:'EOT',monospace;font-size:10px;padding:3px 7px;background:#111;color:#fff;border-radius:999px}
#a .hd .ar{font-size:14px;transition:transform .15s}
#a .cat.open .ar{transform:rotate(90deg)}
#a .bd{display:none;flex-wrap:wrap;gap:7px;padding:11px;border-top:3px solid var(--bd);background:var(--card)}
#a .cat.open .bd{display:flex}
#a .cm{font-family:'EOT',Arial Black,sans-serif;font-size:11px;letter-spacing:.5px;padding:6px 9px;background:var(--bg);color:var(--ink);border:2px solid var(--bd);border-radius:5px;box-shadow:2px 2px 0 var(--bd);text-align:left}
#a .cm:active{transform:translate(2px,2px);box-shadow:0 0 0 var(--bd)}
#a .cm.sel{background:#FFD23F;color:#111}
#a .em{display:none;padding:14px;text-align:center;background:#FF7AB6;color:#111;font-size:13px;margin-bottom:11px}
#a .ft{display:flex;justify-content:space-between;gap:8px;font-family:'EOT',monospace;font-size:9px;letter-spacing:1px;color:var(--mut);padding:6px 3px 0;text-transform:uppercase}
`

const JS = String.raw`(function(){
var q=document.getElementById('a'),$=function(s,r){return(r||q).querySelector(s)},$$=function(s,r){return[].slice.call((r||q).querySelectorAll(s))};
var cats=$$('.cat'),chips=$$('.chip'),inp=$('#s'),em=$('.em'),pv=$('.pv'),cur='all',up=+q.getAttribute('data-up'),t0=Date.now();
function f(s){var h=Math.floor(s/3600),m=Math.floor(s%3600/60);return(h<10?'0':'')+h+'h '+(m<10?'0':'')+m+'m '+(s%60<10?'0':'')+s%60+'s'}
function tick(){$('#rt').textContent=f(up+Math.floor((Date.now()-t0)/1000))}tick();setInterval(tick,1000);
function apply(){var k=(inp.value||'').trim().toLowerCase(),shown=0;
cats.forEach(function(c){var inCat=cur==='all'||c.getAttribute('data-k')===cur,n=0;
$$('.cm',c).forEach(function(b){var ok=!k||b.getAttribute('data-n').indexOf(k)>-1;b.style.display=ok?'':'none';if(ok)n++});
var show=inCat&&n>0;c.style.display=show?'':'none';
if(show){shown++;if(k||cur!=='all')c.classList.add('open')}
$('.cnt',c).textContent=n});
em.style.display=shown?'none':'block'}
chips.forEach(function(c){c.onclick=function(){cur=c.getAttribute('data-k');chips.forEach(function(x){x.classList.toggle('on',x===c)});
if(cur==='all')cats.forEach(function(x){x.classList.remove('open')});apply()}});
cats.forEach(function(c){$('.hd',c).onclick=function(){c.classList.toggle('open')}});
inp.oninput=apply;$('.x').onclick=function(){inp.value='';cur='all';chips.forEach(function(x){x.classList.toggle('on',x.getAttribute('data-k')==='all')});cats.forEach(function(x){x.classList.remove('open')});apply()};
$$('.cm').forEach(function(b){b.onclick=function(){$$('.cm.sel').forEach(function(x){x.classList.remove('sel')});b.classList.add('sel');
var l=b.getAttribute('data-l'),p=q.getAttribute('data-p'),a=l.split(',').map(function(x){return x.trim()});
pv.innerHTML='KETIK DI CHAT<b>'+p+a[0]+'</b>'+(a.length>1?'<i>alias: '+a.slice(1).join(', ')+'</i>':'')}});
$('.tg').onclick=function(){q.classList.toggle('dk');this.textContent=q.classList.contains('dk')?'☀':'☾'};
$$('.cnt-up').forEach(function(e){var to=+e.getAttribute('data-to'),s=Date.now();(function r(){var p=Math.min(1,(Date.now()-s)/900);e.textContent=Math.round(to*(1-Math.pow(1-p,3)));if(p<1)setTimeout(r,30)})()});
})();`

export function buildMenuHtml(d, logo) {
    const img = logo
        ? `<img class="logo" src="${logo}" onerror="this.outerHTML='<div class=&quot;logo lm&quot;>E</div>'">`
        : `<img class="logo" src="${LOGO_URL}" onerror="this.outerHTML='<div class=&quot;logo lm&quot;>E</div>'">`

    const chips = [`<div class="chip btn on" data-k="all">SEMUA</div>`]
        .concat(d.cats.map(c => `<div class="chip btn" data-k="${esc(c.alias)}">${esc(c.name)}</div>`)).join('')

    const cats = d.cats.map((c, i) => {
        const col = COLORS[i % COLORS.length]
        const cmds = c.cmds.map(l => `<div class="cm btn" data-n="${esc(l.toLowerCase())}" data-l="${esc(l.replace(/\s*[ⓅⓁ]\s*/g, ' ').trim())}">${esc(l)}</div>`).join('')
        return `<div class="cat nb" data-k="${esc(c.alias)}"><div class="hd btn" style="background:${col}"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="nm"${nmStyle(c.name)}>${esc(c.name)}</span><span class="cnt">${c.cmds.length}</span><span class="ar">▶</span></div><div class="bd">${cmds}</div></div>`
    }).join('')

    const totalCmds = d.cats.reduce((s, c) => s + c.cmds.length, 0)

    return `<style>${fontFaces()}\n${CSS}</style>
<div id="a" data-p="${esc(d.prefix)}" data-up="${Math.floor(d.uptime)}">
<div class="top nb">${img}<div class="tt"><h1>${esc(d.bot)}</h1><p>v${esc(d.ver)} · MENU 2</p></div><div class="tg nb btn">☾</div></div>
<div class="hi">Halo, ${esc(d.name)} 👋</div>
<div class="gr">
<div class="st nb c1"><small>Membership</small><b>${esc(d.membership)}</b></div>
<div class="st nb c2"><small>Limit</small><b>${esc(d.limit)}</b></div>
<div class="st nb c3"><small>Runtime</small><b id="rt">-</b></div>
<div class="st nb c4"><small>Fitur · Plugin</small><b><span class="cnt-up" data-to="${totalCmds}">0</span> · <span class="cnt-up" data-to="${d.plugins}">0</span></b></div>
</div>
<div class="sr"><input id="s" type="text" placeholder="Cari command..." autocomplete="off"><div class="x nb btn">✕</div></div>
<div class="ch">${chips}</div>
<div class="pv nb">TAP COMMAND BUAT LIHAT CARA PAKAI<b>${esc(d.prefix)}menu</b></div>
${cats}
<div class="em nb">Command nggak ketemu 😵</div>
<div class="ft"><span>${esc(d.prefix)} prefix · ${esc(d.lprem)} premium · ${esc(d.llim)} limit</span><b>${esc(FOOTER)}</b></div>
</div>
<script>${JS}</script>`
}

export async function sendRichMenu(conn, m, d) {
    try {
        const logo = await getLogo()
        const rich = new AIRich(conn)
        if (typeof rich.addSection !== 'function') throw new Error('AIRich.addSection tidak tersedia')
        if (typeof rich.setTitle === 'function') rich.setTitle(`${d.bot} Menu`)
        rich.addSection({
            view_model: {
                __typename: 'GenAISingleLayoutViewModel',
                primitive: { __typename: 'FOAHtmlPrimitiveDemoDONOTUSE', trusted_sources: [], payload: buildMenuHtml(d, logo) }
            }
        })
        if (typeof rich.setFooter === 'function') rich.setFooter(FOOTER)
        await rich.send(m.chat, { quoted: m })
        return true
    } catch (e) {
        console.error('[MENU2]', e?.stack || e?.message || e)
        return false
    }
}
