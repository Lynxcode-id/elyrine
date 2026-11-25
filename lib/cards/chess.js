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

import { BASE_CSS, safeJson } from './base.js'

const BODY = String.raw`
<style>
__BASECSS__
.stt{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:8px 12px;font-size:13px;font-weight:800;margin-bottom:8px;min-height:36px;display:flex;align-items:center}
.stt.bad{background:#7f1d1d;border-color:#ef4444}.stt.good{background:#14532d;border-color:#22c55e}
.bd{display:grid;grid-template-columns:repeat(8,1fr);border:3px solid #3b2a1a;border-radius:6px;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:manipulation}
.sq{position:relative;aspect-ratio:1;display:flex;align-items:center;justify-content:center;cursor:pointer}
.sq.l{background:#f0d9b5}.sq.d{background:#b58863}
.sq.lm.l{background:#f7ec8a}.sq.lm.d{background:#dac24a}
.sq.sel.l,.sq.sel.d{background:#7fe08a}
.sq.ck{background:radial-gradient(circle,#ff5a5a 0,#ff5a5a 45%,transparent 75%),#b58863}
.sq.mv:after{content:'';position:absolute;width:30%;height:30%;border-radius:50%;background:rgba(0,0,0,.28);pointer-events:none}
.sq.mv.cp:after{width:88%;height:88%;background:transparent;border:3px solid rgba(0,0,0,.32)}
.pc{font-family:'Segoe UI Symbol','Noto Sans Symbols 2','Apple Symbols','DejaVu Sans',sans-serif;line-height:1;pointer-events:none}
.pc.w{color:#fff;text-shadow:0 0 2px #000,0 0 2px #000,0 1px 1px #000}
.pc.b{color:#161616;text-shadow:0 0 1px #fff,0 0 1px #fff}
.cd{position:absolute;font-size:8px;font-weight:800;opacity:.7;pointer-events:none;color:#3b2a1a}
.cd.r{left:2px;top:1px}.cd.f{right:2px;bottom:0}
.ctl{display:flex;gap:6px;margin-top:9px}
.ctl .btn{flex:1;padding:9px 6px}
</style>
<div class="stage"><div class="app">
 <div class="top"><div class="logo">♟️</div><div class="meta"><div class="title">Mini Chess Live</div><div class="sub" id="who"></div></div></div>
 <div class="chips" id="lv"><button class="chip" data-l="1">Mudah</button><button class="chip on" data-l="2">Normal</button><button class="chip" data-l="3">Sulit</button></div>
 <div class="stt" id="st"></div>
 <div class="bd" id="bd"></div>
 <div class="ctl"><button class="btn alt" id="un">↶ Undo</button><button class="btn" id="rs">⟳ Ulang</button></div>
 <div class="muted" style="text-align:center;margin-top:8px" id="lastm">Kamu main Putih. Tap bidak lalu tujuan. Promosi pion otomatis jadi Menteri.</div>
</div></div>
<script>
var CH=(function(){
var VAL={p:100,n:320,b:330,r:500,q:900,k:0};
function isW(p){return p!==''&&p===p.toUpperCase();}
function init(){var b=[],i,back='rnbqkbnr';for(i=0;i<64;i++)b.push('');for(i=0;i<8;i++){b[i]=back[i];b[8+i]='p';b[48+i]='P';b[56+i]=back[i].toUpperCase();}return {b:b,t:'w',c:{K:1,Q:1,k:1,q:1},ep:-1,hm:0,fm:1};}
function fen(str){var P=str.split(' '),b=[],i,r=0,c=0,s={};
 for(i=0;i<P[0].length;i++){var ch=P[0][i];if(ch==='/'){r++;c=0;}else if(ch>='1'&&ch<='8'){for(var k=0;k<+ch;k++)b[r*8+c++]='';}else b[r*8+c++]=ch;}
 s.b=b;s.t=P[1];s.c={K:P[2].indexOf('K')>=0?1:0,Q:P[2].indexOf('Q')>=0?1:0,k:P[2].indexOf('k')>=0?1:0,q:P[2].indexOf('q')>=0?1:0};
 s.ep=P[3]&&P[3]!=='-'?(8-(+P[3][1]))*8+(P[3].charCodeAt(0)-97):-1;s.hm=+P[4]||0;s.fm=+P[5]||1;return s;}
function clone(s){return {b:s.b.slice(),t:s.t,c:{K:s.c.K,Q:s.c.Q,k:s.c.k,q:s.c.q},ep:s.ep,hm:s.hm,fm:s.fm};}
var ND=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],KD=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]],BD=[[-1,-1],[-1,1],[1,-1],[1,1]],RD=[[-1,0],[1,0],[0,-1],[0,1]];
function attacked(b,sq,by){
 var r=sq>>3,c=sq&7,i,rr,cc,w=by==='w',p;
 var pr=w?r+1:r-1,pp=w?'P':'p';
 if(pr>=0&&pr<8){if(c>0&&b[pr*8+c-1]===pp)return true;if(c<7&&b[pr*8+c+1]===pp)return true;}
 var kn=w?'N':'n',kg=w?'K':'k',bi=w?'B':'b',ro=w?'R':'r',qu=w?'Q':'q';
 for(i=0;i<8;i++){rr=r+ND[i][0];cc=c+ND[i][1];if(rr>=0&&rr<8&&cc>=0&&cc<8&&b[rr*8+cc]===kn)return true;}
 for(i=0;i<8;i++){rr=r+KD[i][0];cc=c+KD[i][1];if(rr>=0&&rr<8&&cc>=0&&cc<8&&b[rr*8+cc]===kg)return true;}
 for(i=0;i<4;i++){rr=r+BD[i][0];cc=c+BD[i][1];while(rr>=0&&rr<8&&cc>=0&&cc<8){p=b[rr*8+cc];if(p!==''){if(p===bi||p===qu)return true;break;}rr+=BD[i][0];cc+=BD[i][1];}}
 for(i=0;i<4;i++){rr=r+RD[i][0];cc=c+RD[i][1];while(rr>=0&&rr<8&&cc>=0&&cc<8){p=b[rr*8+cc];if(p!==''){if(p===ro||p===qu)return true;break;}rr+=RD[i][0];cc+=RD[i][1];}}
 return false;}
function findK(b,color){var k=color==='w'?'K':'k';for(var i=0;i<64;i++)if(b[i]===k)return i;return -1;}
function gen(s){
 var b=s.b,w=s.t==='w',opp=w?'b':'w',mv=[],sq,p,r,c,i,j,rr,cc,t,lp,q;
 function addP(f,to,pr){if((to>>3)===pr){mv.push({f:f,t:to,p:'q',x:''},{f:f,t:to,p:'r',x:''},{f:f,t:to,p:'b',x:''},{f:f,t:to,p:'n',x:''});}else mv.push({f:f,t:to,p:'',x:''});}
 for(sq=0;sq<64;sq++){p=b[sq];if(p===''||isW(p)!==w)continue;r=sq>>3;c=sq&7;lp=p.toLowerCase();
  if(lp==='p'){
   var dir=w?-1:1,sr=w?6:1,pr=w?0:7,nr=r+dir;
   if(nr>=0&&nr<8){
    t=nr*8+c;
    if(b[t]===''){addP(sq,t,pr);if(r===sr&&b[(r+2*dir)*8+c]===''){mv.push({f:sq,t:(r+2*dir)*8+c,p:'',x:'dp'});}}
    for(j=-1;j<=1;j+=2){cc=c+j;if(cc<0||cc>7)continue;t=nr*8+cc;
     if(b[t]!==''&&isW(b[t])!==w)addP(sq,t,pr);else if(t===s.ep&&b[t]==='')mv.push({f:sq,t:t,p:'',x:'ep'});}
   }
  }else if(lp==='n'||lp==='k'){
   var D=lp==='n'?ND:KD;
   for(i=0;i<8;i++){rr=r+D[i][0];cc=c+D[i][1];if(rr<0||rr>7||cc<0||cc>7)continue;t=rr*8+cc;if(b[t]===''||isW(b[t])!==w)mv.push({f:sq,t:t,p:'',x:''});}
   if(lp==='k'){
    if(w&&sq===60){
     if(s.c.K&&b[61]===''&&b[62]===''&&b[63]==='R'&&!attacked(b,60,opp)&&!attacked(b,61,opp)&&!attacked(b,62,opp))mv.push({f:60,t:62,p:'',x:'ck'});
     if(s.c.Q&&b[59]===''&&b[58]===''&&b[57]===''&&b[56]==='R'&&!attacked(b,60,opp)&&!attacked(b,59,opp)&&!attacked(b,58,opp))mv.push({f:60,t:58,p:'',x:'cq'});
    }else if(!w&&sq===4){
     if(s.c.k&&b[5]===''&&b[6]===''&&b[7]==='r'&&!attacked(b,4,opp)&&!attacked(b,5,opp)&&!attacked(b,6,opp))mv.push({f:4,t:6,p:'',x:'ck'});
     if(s.c.q&&b[3]===''&&b[2]===''&&b[1]===''&&b[0]==='r'&&!attacked(b,4,opp)&&!attacked(b,3,opp)&&!attacked(b,2,opp))mv.push({f:4,t:2,p:'',x:'cq'});
    }
   }
  }else{
   var dl=lp==='b'?[BD]:lp==='r'?[RD]:[BD,RD],di;
   for(di=0;di<dl.length;di++)for(i=0;i<4;i++){rr=r+dl[di][i][0];cc=c+dl[di][i][1];
    while(rr>=0&&rr<8&&cc>=0&&cc<8){t=rr*8+cc;if(b[t]===''){mv.push({f:sq,t:t,p:'',x:''});}else{if(isW(b[t])!==w)mv.push({f:sq,t:t,p:'',x:''});break;}rr+=dl[di][i][0];cc+=dl[di][i][1];}}
  }
 }
 return mv;}
function make(s,m){
 var n=clone(s),b=n.b,p=b[m.f],w=isW(p),cap=b[m.t];
 b[m.t]=p;b[m.f]='';
 if(m.x==='ep')b[m.t+(w?8:-8)]='';
 if(m.p)b[m.t]=w?m.p.toUpperCase():m.p;
 if(m.x==='ck'){b[m.t-1]=b[m.t+1];b[m.t+1]='';}
 if(m.x==='cq'){b[m.t+1]=b[m.t-2];b[m.t-2]='';}
 n.ep=m.x==='dp'?(m.f+m.t)/2:-1;
 if(p==='K'){n.c.K=0;n.c.Q=0;}if(p==='k'){n.c.k=0;n.c.q=0;}
 if(m.f===63||m.t===63)n.c.K=0;if(m.f===56||m.t===56)n.c.Q=0;if(m.f===7||m.t===7)n.c.k=0;if(m.f===0||m.t===0)n.c.q=0;
 n.hm=(p.toLowerCase()==='p'||cap!==''||m.x==='ep')?0:s.hm+1;if(s.t==='b')n.fm++;n.t=w?'b':'w';return n;}
function inCheck(s,color){var k=findK(s.b,color);return k>=0&&attacked(s.b,k,color==='w'?'b':'w');}
function legal(s){var me=s.t,opp=me==='w'?'b':'w';return gen(s).filter(function(m){var n=make(s,m);return !attacked(n.b,findK(n.b,me),opp);});}
function perft(s,d){if(d===0)return 1;var L=legal(s);if(d===1)return L.length;var t=0;for(var i=0;i<L.length;i++)t+=perft(make(s,L[i]),d-1);return t;}
function evalW(s){
 var b=s.b,sc=0,i,p,lp,r,c,v,cen;
 for(i=0;i<64;i++){p=b[i];if(p==='')continue;lp=p.toLowerCase();r=i>>3;c=i&7;v=VAL[lp];
  cen=(3-Math.abs(c-3.5)+0.5|0)+(3-Math.abs(r-3.5)+0.5|0);
  if(lp==='n'||lp==='b')v+=cen*5;else if(lp==='q')v+=cen*2;
  else if(lp==='p'){var adv=isW(p)?6-r:r-1;v+=adv*5+(c>=2&&c<=5?adv*2:0);}
  else if(lp==='k'){if(i===62||i===58||i===6||i===2)v+=15;}
  sc+=isW(p)?v:-v;}
 return sc;}
function ev(s){var e=evalW(s);return s.t==='w'?e:-e;}
function order(s,L){var b=s.b;L.forEach(function(m){var cp=b[m.t],sc=0;if(cp!=='')sc=VAL[cp.toLowerCase()]*10-VAL[b[m.f].toLowerCase()]/10;if(m.x==='ep')sc=900;if(m.p)sc+=800;m.o=sc;});L.sort(function(a,z){return z.o-a.o;});return L;}
function qs(s,a,b,d){
 var st=ev(s);if(st>=b)return b;if(st>a)a=st;if(d<=0)return a;
 var me=s.t,opp=me==='w'?'b':'w',L=gen(s).filter(function(m){return s.b[m.t]!==''||m.x==='ep';});order(s,L);
 for(var i=0;i<L.length;i++){var n=make(s,L[i]);if(attacked(n.b,findK(n.b,me),opp))continue;var sc=-qs(n,-b,-a,d-1);if(sc>=b)return b;if(sc>a)a=sc;}
 return a;}
function search(s,d,a,b,ply){
 var L=legal(s);if(!L.length)return inCheck(s,s.t)?-30000+ply:0;
 if(s.hm>=100)return 0;
 if(d<=0)return qs(s,a,b,4);
 order(s,L);
 for(var i=0;i<L.length;i++){var sc=-search(make(s,L[i]),d-1,-b,-a,ply+1);if(sc>a){a=sc;if(a>=b)break;}}
 return a;}
function pick(s,depth,noise){
 var L=legal(s);if(!L.length)return null;order(s,L);
 var best=null,bs=-1e9,a=-1e9;
 for(var i=0;i<L.length;i++){var sc=-search(make(s,L[i]),depth-1,-1e9,-a,1);var tot=sc+(noise?Math.random()*noise:0);if(tot>bs){bs=tot;best=L[i];}if(sc>a)a=sc;if(noise)a=Math.min(a,bs-noise);}
 return best;}
function status(s){
 var L=legal(s),chk=inCheck(s,s.t);
 if(!L.length)return chk?{over:true,res:'mate',loser:s.t}:{over:true,res:'stale'};
 if(s.hm>=100)return {over:true,res:'draw50'};
 return {over:false,check:chk};}
return {init:init,fen:fen,gen:gen,legal:legal,make:make,perft:perft,pick:pick,status:status,inCheck:inCheck,findK:findK,isW:isW};
})();
(function(){
var CFG=__CFG__;var $=function(i){return document.getElementById(i)};
$('who').textContent='Pemain: '+CFG.nama+' (Putih)';
var G={p:'♟',n:'♞',b:'♝',r:'♜',q:'♛',k:'♚'};
var S=CH.init(),hist=[],last=null,sel=-1,mvs=[],level=2,busy=false,over=false,sqs=[];
var bd=$('bd');
for(var i=0;i<64;i++){var d=document.createElement('div'),r=i>>3,c=i&7;d.className='sq '+((r+c)%2?'d':'l');d.setAttribute('data-i',i);
 if(c===0){var a=document.createElement('span');a.className='cd r';a.textContent=8-r;d.appendChild(a);}
 if(r===7){var f=document.createElement('span');f.className='cd f';f.textContent='abcdefgh'[c];d.appendChild(f);}
 var pc=document.createElement('span');pc.className='pc';d.appendChild(pc);bd.appendChild(d);sqs.push(d);}
function fit(){var w=sqs[0].clientWidth||40;for(var i=0;i<64;i++)sqs[i].lastChild.style.fontSize=Math.floor(w*0.8)+'px';}
function nm(i){return 'abcdefgh'[i&7]+(8-(i>>3));}
function render(){
 var chkSq=-1,stt=CH.status(S);if(stt.check||stt.res==='mate')chkSq=CH.findK(S.b,S.t);
 for(var i=0;i<64;i++){var d=sqs[i],p=S.b[i],pc=d.lastChild;
  pc.textContent=p?G[p.toLowerCase()]+'\uFE0E':'';pc.className='pc '+(p?(CH.isW(p)?'w':'b'):'');
  var cls='sq '+(((i>>3)+(i&7))%2?'d':'l');
  if(last&&(i===last.f||i===last.t))cls+=' lm';
  if(i===sel)cls+=' sel';
  if(i===chkSq)cls+=' ck';
  for(var k=0;k<mvs.length;k++)if(mvs[k].t===i){cls+=' mv'+(p||mvs[k].x==='ep'?' cp':'');break;}
  d.className=cls;}
}
function setSt(t,k){var e=$('st');e.textContent=t;e.className='stt'+(k?' '+k:'');}
function after(){
 var s=CH.status(S);over=s.over;render();
 if(s.over){if(s.res==='mate'){S.t==='b'?setSt('♚ Skakmat! Kamu menang 🎉','good'):setSt('Skakmat… AI menang 😵','bad');}
  else if(s.res==='stale')setSt('Pat (seri) 🤝');else setSt('Seri (aturan 50 langkah) 🤝');busy=false;return;}
 if(S.t==='b'){busy=true;setSt('AI berpikir...');setTimeout(aiMove,60);}
 else{busy=false;setSt(s.check?'Skak! Giliranmu (Putih)':'Giliranmu (Putih)',s.check?'bad':'');}
}
function aiMove(){
 var m=CH.pick(S,level,level===1?140:0);if(!m){after();return;}
 hist.push({s:S,l:last});S=CH.make(S,m);last=m;$('lastm').textContent='AI: '+nm(m.f)+' → '+nm(m.t);after();
}
function click(i){
 if(busy||over)return;
 var p=S.b[i];
 if(sel>=0){
  var m=null;for(var k=0;k<mvs.length;k++)if(mvs[k].t===i&&(!mvs[k].p||mvs[k].p==='q')){m=mvs[k];break;}
  if(m){hist.push({s:S,l:last});S=CH.make(S,m);last=m;sel=-1;mvs=[];$('lastm').textContent='Kamu: '+nm(m.f)+' → '+nm(m.t);after();return;}
 }
 if(p&&CH.isW(p)){sel=i;mvs=CH.legal(S).filter(function(m){return m.f===i;});}else{sel=-1;mvs=[];}
 render();
}
bd.addEventListener('click',function(e){var t=e.target;while(t&&t!==bd&&t.getAttribute&&t.getAttribute('data-i')===null)t=t.parentNode;if(!t||t===bd)return;click(+t.getAttribute('data-i'));});
$('lv').onclick=function(e){var l=e.target.getAttribute('data-l');if(l===null)return;level=+l;var b=$('lv').children;for(var k=0;k<b.length;k++)b[k].classList.toggle('on',b[k]===e.target);};
$('rs').onclick=function(){S=CH.init();hist=[];last=null;sel=-1;mvs=[];busy=false;over=false;$('lastm').textContent='Papan diulang. Kamu main Putih.';after();};
$('un').onclick=function(){if(busy||!hist.length)return;var h;do{h=hist.pop();S=h.s;last=h.l;}while(S.t!=='w'&&hist.length);sel=-1;mvs=[];over=false;$('lastm').textContent='Langkah dibatalkan.';after();};
window.addEventListener('resize',fit);fit();after();setTimeout(fit,300);
})();
</script>
`

export function buildChessHtml({ playerName = 'Kamu' } = {}) {
    return BODY.replace('__BASECSS__', () => BASE_CSS).replace('__CFG__', () => safeJson({ nama: String(playerName) }))
}
