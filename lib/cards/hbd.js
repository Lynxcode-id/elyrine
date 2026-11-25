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

import { safeJson } from './base.js'

const BODY = String.raw`
<style>
#a,#a *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
#a{position:relative;max-width:380px;margin:12px auto;padding:12px 12px 14px;background:#FFE066;background-image:radial-gradient(#f5c400 1.5px,transparent 1.5px);background-size:16px 16px;border:4px solid #111;border-radius:8px;box-shadow:6px 6px 0 #111;overflow:hidden;font-family:'Arial Black','Segoe UI',Arial,sans-serif;color:#111;user-select:none;-webkit-user-select:none;touch-action:manipulation}
#a .bn{display:flex;justify-content:space-between;margin:-4px -6px 10px}
#a .bn i{width:0;height:0;border-left:15px solid transparent;border-right:15px solid transparent;border-top:26px solid #FF7AB6}
#a .bn i:nth-child(4n+2){border-top-color:#5AA9FF}#a .bn i:nth-child(4n+3){border-top-color:#5EEAA0}#a .bn i:nth-child(4n){border-top-color:#B79CFF}
#a .tag{display:block;width:max-content;margin:0 auto 10px;padding:7px 14px;background:#FF7AB6;border:3px solid #111;border-radius:6px;box-shadow:4px 4px 0 #111;font-size:16px;letter-spacing:1px;transform:rotate(-2deg)}
#a .nm{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:8px}
#a .lt{display:flex;align-items:center;justify-content:center;border:3px solid #111;border-radius:6px;box-shadow:3px 3px 0 #111;cursor:pointer;text-transform:uppercase;transition:transform .08s}
#a .lt.j{animation:jp .45s}
#a .sp{width:12px}
#a .sub{text-align:center;font-size:12px;margin-bottom:12px}
@keyframes jp{0%{transform:translateY(0)}35%{transform:translateY(-16px) rotate(-8deg)}70%{transform:translateY(2px)}100%{transform:translateY(0)}}
#a .box{background:#fff;border:3px solid #111;border-radius:8px;box-shadow:4px 4px 0 #111;padding:10px;margin-bottom:12px}
#a .hd{font-size:11px;letter-spacing:1px;text-align:center;margin-bottom:8px}
#a .cake{position:relative;width:220px;margin:0 auto;padding-top:4px}
#a .cds{display:flex;justify-content:center;gap:15px;height:56px;align-items:flex-end;margin-bottom:-3px;position:relative;z-index:2}
#a .cd{position:relative;width:12px;height:30px;background:repeating-linear-gradient(#fff 0 6px,#ff7ab6 6px 12px);border:2px solid #111;border-radius:3px 3px 0 0;cursor:pointer}
#a .cd:before{content:'';position:absolute;left:-14px;right:-14px;top:-28px;bottom:0}
#a .fl{position:absolute;left:50%;top:-20px;width:12px;height:17px;margin-left:-6px;background:radial-gradient(ellipse at 50% 70%,#fff2a8 0,#ffb020 45%,#ff5a1f 100%);border:2px solid #111;border-radius:50% 50% 50% 50%/65% 65% 35% 35%;transform-origin:50% 100%;animation:fk .35s infinite alternate}
@keyframes fk{from{transform:scale(1,1) rotate(-4deg)}to{transform:scale(.88,1.1) rotate(4deg)}}
#a .cd.out .fl{display:none}
#a .cd .sm{position:absolute;left:50%;top:-20px;margin-left:-5px;width:10px;height:10px;border-radius:50%;background:#9aa;opacity:0;pointer-events:none}
#a .cd.out .sm{animation:sm 1s ease-out}
@keyframes sm{0%{opacity:.8;transform:translateY(0) scale(.6)}100%{opacity:0;transform:translateY(-34px) scale(1.8)}}
#a .ly{display:block;margin:0 auto;border:3px solid #111;height:32px;margin-top:-3px;position:relative}
#a .l1{width:112px;background:#fff;border-radius:8px 8px 0 0}
#a .l2{width:156px;background:#FFB86B}
#a .l3{width:200px;background:#FF7AB6}
#a .l1:after,#a .l2:after,#a .l3:after{content:'';position:absolute;left:0;right:0;top:0;height:9px;background:repeating-radial-gradient(circle at 10px 0,#5AA9FF 0 6px,transparent 6.5px 20px);opacity:.9}
#a .pl{display:block;width:224px;height:10px;margin:-3px auto 0;background:#111;border-radius:0 0 8px 8px}
#a .row{display:flex;gap:6px;margin-top:10px}
#a .bt{flex:1;padding:9px 6px;background:#5AA9FF;color:#111;border:3px solid #111;border-radius:6px;box-shadow:3px 3px 0 #111;font:inherit;font-size:12px;cursor:pointer;transition:transform .08s,box-shadow .08s}
#a .bt:active,#a .gf:active{transform:translate(3px,3px);box-shadow:0 0 0 #111}
#a .bt.p{background:#5EEAA0}#a .bt.y{background:#FFD23F}
#a .gfs{display:flex;justify-content:space-around;padding:22px 0 2px}
#a .gf{position:relative;width:82px;height:86px;cursor:pointer;transition:transform .08s}
#a .bx{position:absolute;left:5px;right:5px;bottom:0;height:50px;border:3px solid #111;border-radius:0 0 6px 6px;overflow:hidden}
#a .bx:after{content:'';position:absolute;left:50%;top:0;bottom:0;width:12px;margin-left:-6px;background:#fff;border-left:3px solid #111;border-right:3px solid #111}
#a .lid{position:absolute;left:0;right:0;bottom:44px;height:20px;border:3px solid #111;border-radius:5px;transition:transform .35s cubic-bezier(.3,1.6,.5,1);transform-origin:0 100%;z-index:2}
#a .lid:after{content:'';position:absolute;left:50%;top:0;bottom:0;width:12px;margin-left:-6px;background:#fff;border-left:3px solid #111;border-right:3px solid #111}
#a .gf.o .lid{transform:translate(-12px,-12px) rotate(-30deg)}
#a .it{position:absolute;left:0;right:0;bottom:30px;text-align:center;font-size:32px;opacity:0;transform:translateY(24px) scale(.3);transition:all .45s cubic-bezier(.3,1.7,.5,1);z-index:1}
#a .gf.o .it{opacity:1;transform:translateY(-12px) scale(1)}
#a .gf.o{cursor:default}
#a .g0 .bx,#a .g0 .lid{background:#FF7AB6}#a .g1 .bx,#a .g1 .lid{background:#5AA9FF}#a .g2 .bx,#a .g2 .lid{background:#5EEAA0}
#a .gf.hint .lid{animation:wb 1s infinite}
@keyframes wb{0%,100%{transform:rotate(0)}25%{transform:rotate(-4deg)}75%{transform:rotate(4deg)}}
#a .msg{min-height:62px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:13px;line-height:1.35;background:#B79CFF;border:3px solid #111;border-radius:8px;box-shadow:4px 4px 0 #111;padding:10px;margin-bottom:10px}
#a .msg.pop{animation:mp .4s}
@keyframes mp{0%{transform:scale(.9)}60%{transform:scale(1.04)}100%{transform:scale(1)}}
#a .pr{display:flex;gap:6px;font-size:10px}
#a .pr span{flex:1;text-align:center;padding:5px 2px;background:#fff;border:2px solid #111;border-radius:999px}
#a .fr{text-align:center;font-size:10px;margin-top:9px;opacity:.75}
#a canvas{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:9}
</style>
<div id="a">
 <div class="bn"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
 <div class="tag">🎉 HAPPY BIRTHDAY 🎉</div>
 <div class="nm" id="nm"></div>
 <div class="sub" id="sb">Selamat ulang tahun! Pencet apa aja di sini 👇</div>
 <div class="box"><div class="hd">🕯️ TIUP LILINNYA (<span id="cc">0</span>/5)</div>
  <div class="cake"><div class="cds" id="cds"></div><i class="ly l1"></i><i class="ly l2"></i><i class="ly l3"></i><i class="pl"></i></div>
  <div class="row"><button class="bt y" id="rl">🔥 Nyalain lagi</button><button class="bt p" id="cf">🎈 Confetti</button><button class="bt" id="mu">🔊</button></div>
 </div>
 <div class="box"><div class="hd">🎁 BUKA KADONYA (<span id="gc">0</span>/3)</div>
  <div class="gfs" id="gfs"></div>
 </div>
 <div class="msg" id="mg">Tap lilin, kado, atau huruf namanya!</div>
 <div class="pr"><span id="p1">🕯️ Lilin 0/5</span><span id="p2">🎁 Kado 0/3</span><span id="p3">⭐ Belum selesai</span></div>
 <div class="fr" id="fr"></div>
 <canvas id="cv"></canvas>
</div>
<script>
(function(){
var C=__CFG__,N=C.nama,q=document.getElementById('a');
function $(i){return document.getElementById(i)}
var COL=['#FF7AB6','#5AA9FF','#5EEAA0','#FFD23F','#B79CFF','#FF9F43'];
/* ---------- audio ---------- */
var AC=null,mOn=true;
function au(){if(!mOn)return null;try{if(!AC){var A=window.AudioContext||window.webkitAudioContext;AC=new A();}if(AC.state==='suspended')AC.resume();return AC;}catch(e){return null;}}
function tn(f,t,d,ty,v){var a=au();if(!a)return;var o=a.createOscillator(),g=a.createGain(),s=a.currentTime+t;o.type=ty||'triangle';o.frequency.value=f;g.gain.setValueAtTime(0.0001,s);g.gain.exponentialRampToValueAtTime(v||0.14,s+0.015);g.gain.exponentialRampToValueAtTime(0.0001,s+d);o.connect(g);g.connect(a.destination);o.start(s);o.stop(s+d+0.03);}
function pop(){tn(660,0,0.08,'square',0.05);tn(990,0.05,0.1,'square',0.04);}
function tada(){[523,659,784,1047].forEach(function(f,i){tn(f,i*0.11,0.3);});}
var TUNE=[[392,.75],[392,.25],[440,1],[392,1],[523,1],[494,2],[392,.75],[392,.25],[440,1],[392,1],[587,1],[523,2],[392,.75],[392,.25],[784,1],[659,1],[523,1],[494,1],[440,1],[698,.75],[698,.25],[659,1],[523,1],[587,1],[523,2]];
function song(){var t=0,B=0.3;TUNE.forEach(function(n){tn(n[0],t,n[1]*B*0.95,'triangle',0.13);t+=n[1]*B;});}
/* ---------- confetti ---------- */
var cv=$('cv'),cx=cv.getContext('2d'),P=[],run=false;
function size(){var w=q.offsetWidth,h=q.offsetHeight;if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}}
function burst(x,y,n,up){size();for(var i=0;i<n;i++){var a=Math.random()*6.283,s=2+Math.random()*(up?7:5);P.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-(up?5:2),w:5+Math.random()*6,h:3+Math.random()*5,c:COL[i%6],r:Math.random()*6,vr:Math.random()*.4-.2,l:1});}go();}
function drop(){size();for(var i=0;i<4;i++)P.push({x:Math.random()*cv.width,y:-8,vx:Math.random()*2-1,vy:1+Math.random()*2,w:5+Math.random()*6,h:3+Math.random()*5,c:COL[Math.floor(Math.random()*6)],r:Math.random()*6,vr:Math.random()*.3-.15,l:1.4});go();}
function go(){if(!run){run=true;requestAnimationFrame(loop);}}
function loop(){cx.clearRect(0,0,cv.width,cv.height);
 P=P.filter(function(p){p.vy+=0.22;p.x+=p.vx;p.y+=p.vy;p.vx*=0.99;p.r+=p.vr;p.l-=0.011;if(p.l<=0||p.y>cv.height+20)return false;
  cx.save();cx.globalAlpha=Math.min(1,p.l*1.6);cx.translate(p.x,p.y);cx.rotate(p.r);cx.fillStyle=p.c;cx.fillRect(-p.w/2,-p.h/2,p.w,p.h);cx.strokeStyle='#111';cx.lineWidth=1;cx.strokeRect(-p.w/2,-p.h/2,p.w,p.h);cx.restore();return true;});
 if(P.length)requestAnimationFrame(loop);else run=false;}
var rainT=null;
function rain(ms){if(rainT)clearInterval(rainT);var e=Date.now()+ms;rainT=setInterval(function(){drop();if(Date.now()>e){clearInterval(rainT);rainT=null;}},110);}
function rel(e){var r=q.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
/* ---------- nama ---------- */
var nm=$('nm'),L=N.length,sz=L<=6?46:L<=10?36:L<=16?28:22;
N.split('').forEach(function(ch,i){var s=document.createElement('span');if(ch===' '){s.className='sp';}else{s.className='lt';s.textContent=ch;s.style.cssText='width:'+sz+'px;height:'+Math.round(sz*1.15)+'px;font-size:'+Math.round(sz*.62)+'px;background:'+COL[i%6];}nm.appendChild(s);});
nm.addEventListener('pointerdown',function(e){var t=e.target;if(t.className.indexOf('lt')<0)return;t.classList.remove('j');void t.offsetWidth;t.classList.add('j');pop();var p=rel(e);burst(p.x,p.y,14,true);});
$('fr').textContent=C.dari?'🎁 Dari: '+C.dari:'';
/* ---------- state ---------- */
var cands=0,gifts=0,done=false,WISH=[
 ['🧸','Semoga panjang umur dan sehat selalu, '+N+'! 🙏'],
 ['💌','Rezeki lancar, hati tenang, semua mimpi '+N+' tercapai ✨'],
 ['🏆','Makin dewasa makin keren ya, '+N+'. Jangan lupa bahagia! 😆']];
function say(t){var m=$('mg');m.textContent=t;m.classList.remove('pop');void m.offsetWidth;m.classList.add('pop');}
function upd(){$('cc').textContent=cands;$('gc').textContent=gifts;$('p1').textContent='🕯️ Lilin '+cands+'/5';$('p2').textContent='🎁 Kado '+gifts+'/3';
 var all=cands===5&&gifts===3;$('p3').textContent=all?'⭐ Selesai!':'⭐ Belum selesai';
 if(all&&!done){done=true;say('🎉 HAPPY BIRTHDAY '+N.toUpperCase()+'! 🎉 Semua lilin padam & semua kado kebuka. Semoga hari ini spesial banget!');tada();rain(3500);}
 if(!all)done=false;}
/* ---------- lilin ---------- */
var cds=$('cds');
for(var i=0;i<5;i++){var c=document.createElement('div');c.className='cd';c.innerHTML='<i class="fl"></i><i class="sm"></i>';cds.appendChild(c);}
cds.addEventListener('pointerdown',function(e){var t=e.target;while(t&&t!==cds&&t.className.indexOf('cd')!==0)t=t.parentNode;if(!t||t===cds||t.classList.contains('out'))return;
 t.classList.add('out');cands++;pop();var p=rel(e);burst(p.x,p.y,8,true);
 if(cands===5){say('🌠 Make a wish dulu, '+N+'... lilinnya udah padam semua!');song();burst(q.offsetWidth/2,150,50,true);}
 else say('Fiuuh! 💨 Sisa '+(5-cands)+' lilin lagi.');upd();});
$('rl').onclick=function(){[].forEach.call(cds.children,function(c){c.classList.remove('out');});cands=0;pop();say('Lilin dinyalain lagi 🔥 Tiup lagi yuk!');upd();};
/* ---------- kado ---------- */
var gfs=$('gfs');
WISH.forEach(function(w,i){var g=document.createElement('div');g.className='gf g'+i+(i===0?' hint':'');g.innerHTML='<span class="it">'+w[0]+'</span><div class="bx"></div><div class="lid"></div>';g.setAttribute('data-i',i);gfs.appendChild(g);});
gfs.addEventListener('pointerdown',function(e){var t=e.target;while(t&&t!==gfs&&t.className.indexOf('gf')!==0)t=t.parentNode;if(!t||t===gfs||t.classList.contains('o'))return;
 t.classList.add('o');t.classList.remove('hint');gifts++;tada();var p=rel(e);burst(p.x,p.y,36,true);say(WISH[+t.getAttribute('data-i')][0]+' '+WISH[+t.getAttribute('data-i')][1]);upd();});
/* ---------- tombol & tap bebas ---------- */
$('cf').onclick=function(e){pop();rain(1800);};
$('mu').onclick=function(){mOn=!mOn;this.textContent=mOn?'🔊':'🔇';};
q.addEventListener('pointerdown',function(e){if(e.target.closest&&e.target.closest('.cd,.gf,.lt,.bt'))return;var p=rel(e);burst(p.x,p.y,16,true);});
setTimeout(function(){burst(q.offsetWidth/2,120,40,true);},350);
})();
</script>
`

const clean = s => String(s || '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 24)
const title = s => s.replace(/\S+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())

export function buildHbdHtml({ name = 'Kamu', from = '' } = {}) {
    const nama = title(clean(name)) || 'Kamu'
    return BODY.replace('__CFG__', () => safeJson({ nama, dari: clean(from) }))
}
