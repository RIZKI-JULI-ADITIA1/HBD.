// ===== KONFIGURASI (ubah di sini) =====
// ===== ATUR JAM HITUNG MUNDUR DI SINI (waktu WITA) =====
// Hitung mundur berjalan MENUJU tanggal & jam di bawah. Pastikan tanggalnya di MASA DEPAN.
// Kalau tanggal sudah lewat, semua angka jadi 00 dan tombol langsung terbuka (itu sebabnya terlihat "tidak bergerak").
const TARGET = {tahun:2026, bulan:10, tanggal:4, jam:00, menit:00, detik:00};
// Uji coba cepat: isi mis. 2 -> hitung mundur 2 menit dari sekarang (TARGET diabaikan). Kembalikan ke 0 saat sudah live.
const TEST_MENIT = 0;
const _p=n=>String(n).padStart(2,'0');
const TARGET_DATE = TEST_MENIT>0 ? new Date(Date.now()+TEST_MENIT*60000).toISOString()
  : `${TARGET.tahun}-${_p(TARGET.bulan)}-${_p(TARGET.tanggal)}T${_p(TARGET.jam)}:${_p(TARGET.menit)}:${_p(TARGET.detik)}+08:00`;
const TIME_SOURCES = [                            // server waktu WITA (UTC+8)
  "https://worldtimeapi.org/api/timezone/Asia/Makassar",
  "https://timeapi.io/api/Time/current/zone?timeZone=Asia/Makassar"
];
const RESYNC_MS = 300000;
const VIDEO_SRC = "12.mp4";            // Tahap 5 (layar HP 9:16, idealnya video vertikal): URL/nama file video (mis. "video.mp4"); kosong = placeholder
const MSG6 = "Terima kasih sudah hadir dan mengisi hari-hariku dengan tawa. Tak ada kata yang cukup untuk menggambarkan betapa berartinya upa bagiku. Aku mencintaimu, hari ini dan seterusnya."; // Tahap 6 (usahakan ≤ 220 huruf)
const MSG7 = "Terima kasih sudah menjadi alasan di balik begitu banyak senyumku. Semoga setiap harimu dipenuhi cinta, tawa, dan semua hal indah yang upa pantas dapatkan."; // Tahap 7
const GALLERY = [                 // Tahap 4: src = foto (kosong = placeholder), cap = judul, desc = deskripsi saat diklik
  {src:"1.jpeg",cap:"Awal cerita kita",desc:"Di sinilah semuanya dimulai. Awalnya biasa saja, tapi ternyata jadi awal dari cerita yang paling kusuka."},
  {src:"sore.jpeg",cap:"Sore yang santai",desc:"Sore yang pelan, tanpa rencana apa-apa, dan entah kenapa terasa paling tenang."},
  {src:"meja.jpeg",cap:"Meja favorit",desc:"Meja yang selalu jadi tempat kita ngobrol panjang tentang apa saja."},
  {src:"hujan.jpeg",cap:"Hujan dan kita",desc:"Hujan turun dan aku malah bersyukur, karena jadi punya alasan buat lebih lama bareng upa hehe."},
  {src:"ketawa.jpeg",cap:"Ketawa lepas",desc:"Tawa lepas yang paling jujur. Aku selalu ingin mengulang momen ini."},
  {src:"22.jpeg",cap:"Foto yang nggak direncanain",desc:"Foto yang tidak direncanakan, tapi justru yang paling hidup."},
  {src:"jln.jpeg",cap:"Perjalanan bareng",desc:"Jalan jauh terasa dekat kalau perginya bareng upa."},
  {src:"hari.jpeg",cap:"Hari biasa yang enak",desc:"Hari biasa yang terasa istimewa hanya karena ada kamu."},
  {src:"3.jpeg",cap:"Sampai hari ini",desc:"Sampai hari ini semoga kita terus bersama selamanya, dan semoga sampai hari-hari panjang berikutnya."}
];
const PHOTOS = ["2.jpeg","3.jpeg","4.jpeg","5.jpeg","6.jpeg","66.jpeg"]; // foto melayang Tahap 3 (data URI / URL file saat di-hosting; kosong = placeholder)
// ======================================
const $=s=>document.querySelector(s),TZ={timeZone:'Asia/Makassar'},EC='power3.inOut';
let offset=0,synced=false,unlocked=false,gateInit=false,current=1,busy=false;
const nowMs=()=>Date.now()+offset;

// --- Sinkron jam WITA via fetch (fallback: jam perangkat) ---
async function getJSON(u,ms=3500){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);
  try{const r=await fetch(u,{signal:c.signal,cache:'no-store'});if(!r.ok)throw 0;return await r.json()}finally{clearTimeout(t)}}
async function syncTime(){
  for(const u of TIME_SOURCES){
    try{
      const t0=Date.now(),j=await getJSON(u),t1=Date.now();
      let ms=j.unixtime?j.unixtime*1000:Date.parse(String(j.dateTime||'').replace(/(\.\d{3})\d*/,'$1')+'+08:00');
      if(!isFinite(ms))continue;
      offset=ms-(t0+t1)/2;synced=true;paintChip();return;
    }catch(e){}
  }
  synced=false;paintChip();
}
function paintChip(){$('#chip').textContent=synced?'● WITA · server':'○ WITA · jam perangkat'}
syncTime();setInterval(syncTime,RESYNC_MS);

// --- Indikator tahap ---
const dots=$('#dots');for(let i=0;i<8;i++)dots.insertAdjacentHTML('beforeend','<i></i>');
const paintDots=()=>[...dots.children].forEach((d,i)=>d.className=i+1===current?'on':(i+1<current?'done':''));paintDots();

// --- Chime (WebAudio, tanpa file) ---
let ac;const AC=window.AudioContext||window.webkitAudioContext;
function tone(f,t0,d,g){const o=ac.createOscillator(),v=ac.createGain();o.type='sine';o.frequency.value=f;o.connect(v);v.connect(ac.destination);v.gain.setValueAtTime(0,t0);v.gain.linearRampToValueAtTime(g,t0+.012);v.gain.exponentialRampToValueAtTime(.0001,t0+d);o.start(t0);o.stop(t0+d+.05)}
function chime(){if(!AC)return;ac=ac||new AC();if(ac.state==='suspended')ac.resume();const t=ac.currentTime;[784,988,1175,1568,1976].forEach((f,i)=>{tone(f,t+i*.11,1.3,.05);tone(f*2,t+i*.11,.8,.014)})}

// --- Countdown + gerbang waktu ---
const pad=n=>String(n).padStart(2,'0'),ids=['d','h','m','s'],fmtT=new Intl.DateTimeFormat('id-ID',{...TZ,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
function targetText(){const d=new Date(TARGET_DATE);
  return d.toLocaleDateString('id-ID',{...TZ,weekday:'long',day:'numeric',month:'long',year:'numeric'})+' · '+d.toLocaleTimeString('id-ID',{...TZ,hour:'2-digit',minute:'2-digit',hour12:false}).replace('.',':')+' WITA'}
function gate(open){
  if(gateInit&&open===unlocked)return;
  const announce=gateInit&&open&&!unlocked,b=$('#gift');gateInit=true;unlocked=open;
  b.classList.toggle('locked',!open);b.setAttribute('aria-disabled',String(!open));
  $('#status').textContent=open?'Waktunya tiba ✦ silakan buka kadonya':'Terbuka pada '+targetText();
  if(announce){chime();gsap.fromTo(b,{scale:.9},{scale:1,duration:.9,ease:'elastic.out(1,.4)'})}
}
function tick(){
  const t=Math.max(0,Math.floor((new Date(TARGET_DATE)-nowMs())/1000));
  const v=[Math.floor(t/86400),Math.floor(t/3600)%24,Math.floor(t/60)%60,t%60];
  ids.forEach((k,i)=>{const el=$('#'+k),x=pad(v[i]);if(el.textContent!==x){el.textContent=x;gsap.fromTo(el,{yPercent:35,opacity:0},{yPercent:0,opacity:1,duration:.5,ease:'power3.out'})}});
  gate(t<=0);
  $('#wita').textContent='WITA '+fmtT.format(nowMs()).replace(/\./g,':');
}
tick();setInterval(tick,250);

// --- Tombol: terkunci = getar + status; terbuka = lanjut ---
$('#gift').addEventListener('click',e=>{
  const b=e.currentTarget;
  if(!unlocked){
    gsap.killTweensOf(b);
    gsap.to(b,{keyframes:{x:[-10,10,-8,8,-4,4,0],easeEach:'none'},duration:.5,onComplete:()=>gsap.set(b,{clearProps:'transform'})});
    $('#status').textContent='Belum waktunya, sabar sedikit lagi ♡ Terbuka '+targetText();
    gsap.fromTo('#status',{opacity:1,color:'#F2A6A6'},{opacity:.7,color:'#F4ECE4',duration:2.2});
    return;
  }
  goTo(2);
});
$('#back5').addEventListener('click',()=>{vid.pause();resumeMusic();goTo(4)});

const enter={};
// --- Transisi tahap: fade + zoom ---
function parallaxFx(dir){
  const W=innerWidth,H=innerHeight;
  // lapisan bintang jauh/dekat bergeser dengan kecepatan berbeda lalu menetap
  layers.forEach(({pts,L})=>{gsap.killTweensOf(pts.position);gsap.timeline().to(pts.position,{x:-dir*(L?16:7),duration:.9,ease:'power2.in'}).to(pts.position,{x:0,duration:2.8,ease:'power3.out'})});
  // cahaya latar (3 lapisan) ikut bergeser berbeda
  [['.b1',.1,.04],['.b2',.18,.07],['.b3',.06,.1]].forEach(([s,kx,ky])=>{gsap.killTweensOf(s);
    gsap.timeline().to(s,{'--tx':-dir*W*kx+'px','--ty':dir*H*ky+'px',duration:.9,ease:'power2.in'}).to(s,{'--tx':'0px','--ty':'0px',duration:2.8,ease:'power3.out'})});
  // goresan cahaya + orb di depan layar: dekat = cepat, besar, terang
  for(let i=0;i<26;i++){
    const orb=i>=18,dp=Math.random(),s=document.createElement('i'),w=orb?14+dp*46:60+dp*240,h=orb?w:1+dp*2.6,y0=Math.random()*H;
    s.className=orb?'orb':'streak';
    s.style.cssText=`width:${w}px;height:${h}px;opacity:${.25+dp*.6}`+(orb?'':`;background:linear-gradient(to ${dir>0?'left':'right'},transparent,${Math.random()<.65?'#E6C594':'#F2A6A6'})`);
    document.body.append(s);
    gsap.fromTo(s,{x:dir>0?W+60:-w-60,y:y0},{x:dir>0?-w-60:W+60,y:y0+dir*(40+dp*90),duration:(orb?1.9:1.5)-dp*.9,delay:Math.random()*.6,ease:'none',onComplete:()=>s.remove()});
  }
}
// --- Transisi tahap: parallax berlapis (tiap elemen bergeser dengan kedalaman berbeda) ---
function goTo(n){
  const from=$(`[data-stage="${current}"]`),to=$(`[data-stage="${n}"]`);
  if(!to||n===current||busy||(current===1&&n>1&&!unlocked))return;
  busy=true;const dir=n>current?1:-1,W=innerWidth,dep=i=>.55+(i%4)*.35,kids=el=>[...el.children].filter(c=>!c.classList.contains('petals'));
  parallaxFx(dir);
  gsap.to(C.position,{z:10-dir*3,duration:.9,ease:EC});
  kids(from).forEach((c,i)=>gsap.to(c,{x:-dir*W*.55*dep(i),duration:.95,ease:'power2.in'}));
  gsap.to(from,{opacity:0,duration:.55,delay:.4,ease:'power1.in',onComplete:()=>{
    kids(from).forEach(c=>gsap.set(c,{clearProps:'x'}));
    from.classList.remove('active');gsap.set(from,{clearProps:'all'});
    to.classList.add('active');current=n;paintDots();
    kids(to).forEach((c,i)=>gsap.fromTo(c,{x:dir*W*.55*dep(i)},{x:0,duration:1.5,ease:'power3.out',clearProps:'x'}));
    gsap.fromTo(to,{opacity:0},{opacity:1,duration:.7,ease:'power1.out',clearProps:'opacity',onComplete:()=>busy=false});
    gsap.to(C.position,{z:10,duration:1.5,ease:EC});
    if(enter[n])enter[n]();
  }});
}

// --- Entrance ---
gsap.from('.l1,.l2',{y:40,opacity:0,filter:'blur(12px)',duration:1.5,stagger:.2,ease:'power3.out',delay:.3});
gsap.from('.r:not(.display)',{y:24,opacity:0,duration:1.1,stagger:.12,ease:'power3.out',delay:.6});

// --- Three.js: bintang melayang halus ---
const R=new THREE.WebGLRenderer({canvas:$('#stars'),alpha:true,antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));
const S=new THREE.Scene(),C=new THREE.PerspectiveCamera(60,1,.1,100);C.position.z=10;
const tc=document.createElement('canvas');tc.width=tc.height=64;const x=tc.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);
gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.3,'rgba(255,255,255,.45)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);
const tex=new THREE.CanvasTexture(tc),cols=[new THREE.Color('#E6C594'),new THREE.Color('#F2A6A6'),new THREE.Color('#ffffff')],layers=[];
for(let L=0;L<2;L++){
  const N=320,p=new Float32Array(N*3),c=new Float32Array(N*3);
  for(let k=0;k<N;k++){p.set([(Math.random()-.5)*48,(Math.random()-.5)*28,(Math.random()-.5)*30],k*3);const q=cols[Math.floor(Math.random()*3)];c.set([q.r,q.g,q.b],k*3)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));
  const m=new THREE.PointsMaterial({size:L?.34:.2,map:tex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const pts=new THREE.Points(g,m);S.add(pts);layers.push({pts,m,L});
}
function rs(){R.setSize(innerWidth,innerHeight);C.aspect=innerWidth/innerHeight;C.updateProjectionMatrix()}rs();addEventListener('resize',rs);
let mx=0,my=0;addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5});
(function loop(t){
  layers.forEach(({pts,m,L})=>{pts.rotation.y=t/(L?70000:110000);pts.rotation.x=Math.sin(t/16000)*.05;m.opacity=.55+.4*Math.sin(t/(L?1100:1700)+L*2)});
  C.position.x+=(mx*1.6-C.position.x)*.03;C.position.y+=(-my*1-C.position.y)*.03;C.lookAt(0,0,0);
  R.render(S,C);requestAnimationFrame(loop);
})(0);

// ===== TAHAP 2: Jukebox kartu pemutar (gaya Apple Music) =====
// ISI LAGUMU DI SINI. Satu objek = satu kartu pemutar (boleh 3-8 lagu).
//   t   = judul lagu            m = nama artis / keterangan
//   src = file audio, mis. "musik/lagu1.mp3" (taruh filenya di folder proyek). Kosong = nada piano bawaan (demo)
//   img = cover/foto kartu (opsional, tampil di atas kartu), mis. "foto/cover1.jpg"
const TRACKS=[
 {t:'Pal Pal Dil Ke Paas',m:'Arijit singh',src:'pal.m4a',img:'pal.jpg'},
 {t:'Tere Liye',m:'Atif Aslam & Shreya Ghoshal',src:'ter.m4a',img:'ter.jpg'},
 {t:'Wedding Nasheed',m:'Muhammad Al Muqit',src:'wed.m4a',img:'wed.jpg'},
 {t:'Bole Chudiyan',m:'Kavita Krishnamurthy Udit Narayan Sonu Nigam Amit ',src:'bole.m4a',img:'bole.jpg'},
 {t:'Teri Meri',m:'Rahat Fateh Ali Khan & Shreya',src:'teri.m4a',img:'teri.jpg'}
];
const SYNTH=[ // nada bawaan jika `src` kosong (tidak perlu diubah)
 {bpm:68,root:60,beats:4,wave:'triangle',prog:[[0,4,7],[7,11,14],[9,12,16],[5,9,12]],pat:[0,1,2,1,2,1,0,2]},
 {bpm:76,root:62,beats:4,wave:'sine',prog:[[0,4,7],[9,12,16],[5,9,12],[7,11,14]],pat:[0,2,1,2,0,2,1,2]},
 {bpm:84,root:57,beats:3,wave:'triangle',prog:[[0,3,7],[8,12,15],[5,8,12],[7,11,14]],pat:[0,1,2,1,2,1]},
 {bpm:92,root:64,beats:4,wave:'triangle',prog:[[0,4,7],[5,9,12],[7,11,14],[0,4,7]],pat:[0,1,2,2,1,2,1,0]},
 {bpm:64,root:58,beats:4,wave:'sine',prog:[[0,4,7],[7,11,14],[9,12,16],[4,7,11]],pat:[0,1,2,1,0,1,2,1]}
];
const Music=(()=>{
  let mg,timer,tr=null,step=0,nextT=0,stopTO,el=null,playing=false,t0=0,vol=.85;const dur0=210;
  function init(){if(mg)return;ac=ac||new AC();mg=ac.createGain();mg.gain.value=0;
    const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2800;
    const dl=ac.createDelay(1),fb=ac.createGain(),wet=ac.createGain();dl.delayTime.value=.34;fb.gain.value=.38;wet.gain.value=.35;
    mg.connect(lp);lp.connect(ac.destination);lp.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(wet);wet.connect(ac.destination)}
  const fr=m=>440*Math.pow(2,(m-69)/12);
  function note(m,t,d,g,type){const o=ac.createOscillator(),v=ac.createGain();o.type=type;o.frequency.value=fr(m);o.connect(v);v.connect(mg);v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(g,t+.02);v.gain.exponentialRampToValueAtTime(.0001,t+d);o.start(t);o.stop(t+d+.05)}
  function sched(){
    if(!tr)return;const T=tr,e=60/T.bpm/2,per=T.beats*2;
    while(nextT<ac.currentTime+.3){
      const ch=T.prog[Math.floor(step/per)%T.prog.length],pos=step%per;
      if(pos===0){ch.forEach(x=>note(T.root+x-12,nextT,e*per*1.05,.045,'sine'));note(T.root-24,nextT,e*per,.12,'sine')}
      note(T.root+ch[T.pat[pos%T.pat.length]%3]+(pos%4===3?12:0),nextT,e*4,.085,T.wave);
      if(pos===per-1&&Math.random()<.6)note(T.root+ch[2]+24,nextT+e*.5,1.6,.03,'sine');
      nextT+=e;step++;
    }
  }
  function fade(v,d=1.4){if(el)gsap.to(el,{volume:v*vol,duration:d});if(mg){const n=ac.currentTime;mg.gain.cancelScheduledValues(n);mg.gain.setValueAtTime(mg.gain.value,n);mg.gain.linearRampToValueAtTime(v*vol*.9,n+d)}}
  function hardStop(){clearInterval(timer);clearTimeout(stopTO);if(el){el.pause();el=null}if(mg)mg.gain.value=0;playing=false;tr=null}
  function play(i){
    hardStop();t0=performance.now();const T=TRACKS[i];
    if(T.src){el=new Audio(T.src);el.loop=true;el.volume=0;el.play().catch(()=>{});fade(1);playing=true;return}
    init();if(ac.state==='suspended')ac.resume();tr=SYNTH[i%SYNTH.length];step=0;nextT=ac.currentTime+.05;timer=setInterval(sched,60);sched();fade(1);playing=true;
  }
  function stop(d=.8){fade(0,d);playing=false;clearTimeout(stopTO);stopTO=setTimeout(()=>{clearInterval(timer);if(el){el.pause();el=null}tr=null},d*1000+80)}
  const info=()=>{if(el&&isFinite(el.duration))return{cur:el.currentTime,dur:el.duration};return{cur:playing?((performance.now()-t0)/1000)%dur0:0,dur:dur0}};
  const seek=f=>{if(el&&isFinite(el.duration))el.currentTime=f*el.duration;else t0=performance.now()-f*dur0*1000};
  const setVol=v=>{vol=v;if(el&&playing)el.volume=v;if(mg&&playing)mg.gain.setTargetAtTime(v*.9,ac.currentTime,.05)};
  return{play,stop,info,seek,setVol,get playing(){return playing}};
})();

let sel=-1,committed=false,pvTO,opened=false,userOff=false;
const ICO={
 play:'<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>',
 pause:'<svg viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
 prev:'<svg viewBox="0 0 24 24"><path d="M11 6v12l-8.5-6zM21 6v12l-8.5-6z"/></svg>',
 next:'<svg viewBox="0 0 24 24"><path d="M13 6v12l8.5-6zM3 6v12l8.5-6z"/></svg>',
 vlo:'<svg viewBox="0 0 24 24"><path d="M4 9.5v5h3.5L12 19V5L7.5 9.5z"/></svg>',
 vhi:'<svg viewBox="0 0 24 24"><path d="M4 9.5v5h3.5L12 19V5L7.5 9.5z"/><path d="M15 8.5a5 5 0 0 1 0 7M17.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
};
const boxT=$('#tracks');boxT.className='pcards';
boxT.innerHTML=TRACKS.map((T,i)=>`<article class="pcard" data-i="${i}" style="--d:${i*.08}s"><div class="pcov" style="${T.img?`background-image:url('${T.img}')`:`background:linear-gradient(150deg,hsl(${(i*53+8)%360} 38% 32%),hsl(${(i*53+48)%360} 42% 14%))`}">${T.img?'':'<i>♪</i>'}</div><div class="pmeta"><b>${T.t}</b><small>${T.m}</small></div><div class="pbar"><input class="pseek" type="range" min="0" max="1000" value="0" aria-label="Posisi lagu"><div class="ptimes"><span class="pt0">0:00</span><span class="pt1">-0:00</span></div></div><div class="pctl"><button class="pprev" aria-label="Sebelumnya">${ICO.prev}</button><button class="pplay" aria-label="Putar atau jeda">${ICO.play}</button><button class="pnext" aria-label="Berikutnya">${ICO.next}</button></div><div class="pvol">${ICO.vlo}<input class="pvolr" type="range" min="0" max="100" value="85" aria-label="Volume">${ICO.vhi}</div></article>`).join('');
const cards=[...boxT.children],fmtM=s=>{s=Math.max(0,Math.floor(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
cards.forEach(c=>{c.querySelector('.pvolr').style.setProperty('--p','85%');c.querySelector('.pseek').style.setProperty('--p','0%')});
boxT.addEventListener('click',e=>{
  const c=e.target.closest('.pcard');if(!c)return;const i=+c.dataset.i,N=TRACKS.length;
  if(e.target.closest('.pplay')){(i===sel&&Music.playing)?stopMusic():setTrack(i);return}
  if(e.target.closest('.pprev')){setTrack((i+N-1)%N);return}
  if(e.target.closest('.pnext')){setTrack((i+1)%N);return}
  if(e.target.closest('input'))return;
  if(i!==sel||!Music.playing)setTrack(i);
});
boxT.addEventListener('input',e=>{
  const c=e.target.closest('.pcard');if(!c)return;
  if(e.target.classList.contains('pseek')&&+c.dataset.i===sel){Music.seek(e.target.value/1000);e.target.style.setProperty('--p',e.target.value/10+'%')}
  if(e.target.classList.contains('pvolr')){Music.setVol(e.target.value/100);cards.forEach(k=>{const r=k.querySelector('.pvolr');r.value=e.target.value;r.style.setProperty('--p',e.target.value+'%')})}
});
// Fokus kartu: arahkan kursor (laptop) / kartu paling tengah saat digeser (HP) -> zoom ke depan, kartu lain sedikit blur
let rfF;
function setFocus(i){cards.forEach((c,k)=>c.classList.toggle('foc',k===i));boxT.classList.toggle('hasFoc',i>=0)}
function centerFocus(){
  if(!matchMedia('(hover:none),(max-width:899px)').matches)return;
  const r=boxT.getBoundingClientRect(),cx=r.left+r.width/2;let best=0,bd=1e9;
  cards.forEach((c,k)=>{const q=c.getBoundingClientRect(),d=Math.abs(q.left+q.width/2-cx);if(d<bd){bd=d;best=k}});setFocus(best);
}
cards.forEach((c,k)=>{
  c.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')setFocus(k)});
  c.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){setFocus(-1);centerFocus()}});
});
boxT.addEventListener('scroll',()=>{cancelAnimationFrame(rfF);rfF=requestAnimationFrame(centerFocus)},{passive:true});
function scrollToCard(i){if(boxT.scrollWidth<=boxT.clientWidth)return;const c=cards[i];boxT.scrollTo({left:c.offsetLeft-(boxT.clientWidth-c.clientWidth)/2,behavior:'smooth'})}
function cardsIn(){
  cards.forEach(c=>{c.style.animation='none';void c.offsetWidth;c.style.animation=''});
  if(boxT.scrollWidth>boxT.clientWidth){const c=cards[Math.max(0,sel)];boxT.scrollLeft=c.offsetLeft-(boxT.clientWidth-c.clientWidth)/2}
  setTimeout(centerFocus,80);
}
setInterval(()=>{ // progres lagu pada kartu terpilih
  if(current!==2||sel<0)return;const c=cards[sel],inf=Music.info(),sk=c.querySelector('.pseek');
  if(document.activeElement!==sk){const f=inf.dur?inf.cur/inf.dur:0;sk.value=f*1000;sk.style.setProperty('--p',f*100+'%')}
  c.querySelector('.pt0').textContent=fmtM(inf.cur);c.querySelector('.pt1').textContent='-'+fmtM(inf.dur-inf.cur);
},250);
let lastSc=-2;
function paintTracks(){
  cards.forEach((c,i)=>{const on=i===sel&&Music.playing;c.classList.toggle('sel',i===sel);c.classList.toggle('on',on);c.querySelector('.pplay').innerHTML=on?ICO.pause:ICO.play;
    if(i!==sel){const s=c.querySelector('.pseek');s.value=0;s.style.setProperty('--p','0%');c.querySelector('.pt0').textContent='0:00';c.querySelector('.pt1').textContent='-0:00'}});
  boxT.classList.toggle('hasSel',sel>=0);$('#mstop').classList.toggle('show',Music.playing);
  if(sel>=0&&sel!==lastSc){lastSc=sel;scrollToCard(sel)}
}
function mpPaint(){$('#mp').classList.toggle('on',Music.playing);$('#mpPlay').textContent=Music.playing?'❚❚':'▶';$('#mpTitle').textContent=sel>=0?TRACKS[sel].t:'-'}
function setTrack(i){
  sel=i;userOff=false;Music.play(i);clearTimeout(pvTO);
  if(!committed)pvTO=setTimeout(()=>{if(!committed){Music.stop(1.5);paintTracks();mpPaint()}},20000);
  $('#hint').textContent=committed?`Sekarang memutar "${TRACKS[i].t}"`:`Terpilih: "${TRACKS[i].t}" ✦ sekarang ketuk kadonya`;paintTracks();mpPaint();
}
function stopMusic(msg){userOff=true;clearTimeout(pvTO);Music.stop(.6);if(msg)$('#hint').textContent=msg;paintTracks();mpPaint()}
$('#mstop').addEventListener('click',()=>stopMusic('Musik dimatikan. Pilih lagu lain kapan saja ♡'));
$('#mpPlay').addEventListener('click',()=>{if(sel<0)return;Music.playing?stopMusic():setTrack(sel)});
$('#mpNext').addEventListener('click',()=>setTrack((sel+1)%TRACKS.length));
$('#mpPrev').addEventListener('click',()=>setTrack((sel+TRACKS.length-1)%TRACKS.length));

// --- Burung glowing (origami / dove of light) ---
function bez(p,u){const a=1-u;return[a*a*a*p[0][0]+3*a*a*u*p[1][0]+3*a*u*u*p[2][0]+u*u*u*p[3][0],a*a*a*p[0][1]+3*a*a*u*p[1][1]+3*a*u*u*p[2][1]+u*u*u*p[3][1]]}
// --- Hati (love) untuk animasi burung ---
function mkLove(size,x,y,fill){const d=document.createElement('div');d.className='lvw';d.style.cssText=`width:${size}px;height:${size*.95}px`;
  d.innerHTML=`<svg viewBox="0 0 1 1" preserveAspectRatio="none"><path d="M0.5 1C0.1 0.7 0 0.5 0 0.3C0 0.12 0.13 0 0.27 0C0.4 0 0.47 0.07 0.5 0.16C0.53 0.07 0.6 0 0.73 0C0.87 0 1 0.12 1 0.3C1 0.5 0.9 0.7 0.5 1Z" fill="${fill||'url(#lvg)'}"/></svg>`;
  document.body.append(d);gsap.set(d,{x,y,xPercent:-50,yPercent:-50});return d}
function loveBurst(x,y,k){const F=['#F2A6A6','#E6C594','#fff6e6','#f7b9c6'];
  for(let i=0;i<k;i++){const d=mkLove(8+Math.random()*20,x,y,F[Math.random()*4|0]),a=Math.random()*6.283,m=70+Math.random()*190;
    gsap.set(d,{rotation:Math.random()*60-30,scale:0});
    gsap.to(d,{scale:1,duration:.25,ease:'back.out(2)'});
    gsap.to(d,{x:x+Math.cos(a)*m,y:y+Math.sin(a)*m-30,rotation:'+='+(Math.random()*140-70),duration:1.3+Math.random()*.9,ease:'power2.out'});
    gsap.to(d,{opacity:0,duration:.7,delay:1+Math.random()*.7,ease:'power1.in',onComplete:()=>d.remove()})}}
function birdTravel(n,from){
  // Konsep: burung terbang & MENGHINDARI dua hati -> hati ketiga mengejar dan MENGENAI burung
  // -> hati meledak lalu membesar memenuhi layar -> tahap berikutnya muncul dari titik tumbukan
  const toS=$(`[data-stage="${n}"]`),fromS=$(`[data-stage="${current}"]`);
  if(!toS||busy)return;busy=true;
  const W=innerWidth,H=innerHeight,R=Math.hypot(W,H),bd=$('#bird'),b={x:from.x,y:from.y},st={sc:.6},COL=['#E6C594','#F2A6A6','#fff6e6'],
    kids=el=>[...el.children].filter(c=>!c.classList.contains('petals')),
    clr=c=>{c.classList.remove('kz');['--kx','--ky','--ks'].forEach(p=>c.style.removeProperty(p))},
    mkd=(cls,css)=>{const d=document.createElement('div');d.className=cls;if(css)d.style.cssText=css;document.body.append(d);return d},
    upd=()=>C.updateProjectionMatrix(),mb=document.querySelectorAll('.mesh i'),
    A=[W*.25,H*.28],B=[W*.3,H*.7],Cc=[W*.72,H*.3],D=[W*.4,H*.58],I=[W*.5,H*.45],S3=[W*.92,-70];
  let px=b.x,py=b.y,face=1,rot=0,done=false,fr=0;
  const trail=(x,y,col,sz)=>{const t=mkd('trail');gsap.set(t,{x:x+(Math.random()-.5)*8,y:y+(Math.random()-.5)*8,scale:(.6+Math.random()*1.4)*(sz||1),backgroundColor:col});
    gsap.to(t,{x:'+='+((Math.random()-.5)*40),y:'+='+(8+Math.random()*28),scale:0,opacity:0,duration:1,ease:'power1.out',onComplete:()=>t.remove()})};
  gsap.set(bd,{xPercent:-50,yPercent:-50,x:b.x,y:b.y,scaleX:.6,scaleY:.6,rotation:0,rotationX:0,opacity:0,transformPerspective:700});
  const wing=gsap.timeline({repeat:-1,yoyo:true});
  wing.fromTo('#wA',{rotation:-22,svgOrigin:'66 48'},{rotation:34,svgOrigin:'66 48',duration:.18,ease:'sine.inOut'},0)
      .fromTo('#wB',{rotation:-10,svgOrigin:'66 48'},{rotation:24,svgOrigin:'66 48',duration:.18,ease:'sine.inOut'},0);
  // tiga hati: dua meleset, satu mengejar
  const mkH=sz=>{const d=mkLove(sz,-300,-300);gsap.set(d,{opacity:0});gsap.to(d.firstChild,{scale:1.14,duration:.32,yoyo:true,repeat:-1,ease:'sine.inOut'});return d};
  const H1=mkH(70),H2=mkH(70),H3=mkH(104),tl=gsap.timeline();
  const leg=(T,at,dur,ex,ey)=>tl.to(b,{x:T[0],duration:dur,ease:ex},at).to(b,{y:T[1],duration:dur,ease:ey},at);
  const shoot=(Hh,S,T,at,dur)=>{const k=1.8;tl.set(Hh,{opacity:1,x:S[0],y:S[1]},at).to(Hh,{x:S[0]+(T[0]-S[0])*k,y:S[1]+(T[1]-S[1])*k,duration:dur*k,ease:'none'},at)
    .to(Hh,{opacity:0,duration:.25},at+dur*k-.25).add(()=>Hh.remove(),at+dur*k+.05)};
  const roll=(at,dir)=>tl.fromTo(bd,{rotationX:0},{rotationX:360*dir,duration:.45,ease:'power2.inOut'},at).call(()=>sparksFrom(b.x,b.y,12),null,at);
  tl.to(bd,{opacity:1,duration:.3},0).to(st,{sc:1,duration:.7},0).to(fromS,{opacity:0,duration:.45,ease:'power2.out'},.05).to('nav,#mp',{opacity:0,duration:.45},.05).to('.mesh,#stars',{opacity:.4,duration:.8},.05);
  leg(A,0,1.0,'sine.inOut','power2.out');
  shoot(H1,[W+80,H*.14],A,.4,.85);                       // hati 1 -> nyaris kena, burung menghindar
  leg(B,1.05,.42,'power3.out','power2.inOut');roll(1.05,1);
  shoot(H2,[-70,H+60],B,1.35,.65);                       // hati 2 -> menghindar lagi
  leg(Cc,1.95,.42,'power3.out','power2.inOut');roll(1.95,-1);
  tl.fromTo(H3,{opacity:0},{opacity:1,duration:.2},2.3);  // hati 3 besar: mengejar
  tl.to(C,{fov:84,duration:1.2,ease:'power2.in',onUpdate:upd},2.3);
  leg(D,2.5,.45,'power3.out','sine.inOut');roll(2.5,1);
  leg(I,2.95,.5,'power2.out','power2.out');
  const step=()=>{
    if(done)return;const t=tl.time(),vx=b.x-px,vy=b.y-py;px=b.x;py=b.y;
    if(Math.abs(vx)>.8)face=vx<0?-1:1;
    rot+=(Math.max(-45,Math.min(45,face*Math.atan2(vy,Math.abs(vx)+1)*180/Math.PI))-rot)*.2;
    gsap.set(bd,{x:b.x,y:b.y,scaleX:face*st.sc,scaleY:st.sc,rotation:rot});
    if(++fr%2===0){if(Math.hypot(vx,vy)>1.2)trail(b.x-face*10,b.y+4,COL[Math.random()*3|0]);
      [H1,H2].forEach(h=>{if(+gsap.getProperty(h,'opacity')>0)trail(gsap.getProperty(h,'x'),gsap.getProperty(h,'y'),'#F2A6A6',.8)})}
    if(t>=2.3){const f=Math.min(1,Math.pow((t-2.3)/1.2,2)),x=S3[0]+(b.x-S3[0])*f,y=S3[1]+(b.y-S3[1])*f+Math.sin(t*14)*34*(1-f);
      gsap.set(H3,{x,y,rotation:Math.sin(t*9)*12});if(fr%2===0)trail(x,y,'#F2A6A6',1.2)}
    // parallax: bintang & cahaya latar bergeser mengikuti burung
    const nx=b.x/W-.5,ny=b.y/H-.5;
    layers.forEach(({pts,L})=>{pts.position.x=-nx*(L?10:4);pts.position.y=ny*(L?5:2)});
    mb.forEach((e,i)=>{e.style.setProperty('--tx',(-nx*W*[.08,.14,.05][i])+'px');e.style.setProperty('--ty',(-ny*H*.04*(i+1))+'px')});
  };
  tl.eventCallback('onUpdate',step);
  const hit=()=>{
    done=true;const hx=b.x,hy=b.y;
    // kena!
    wing.timeScale(.3);gsap.killTweensOf(H3.firstChild);H3.style.filter='none';H3.style.zIndex=96;
    gsap.set(H3,{x:hx,y:hy,rotation:0});
    gsap.to(bd,{scaleX:face*1.45,scaleY:1.45,duration:.14,yoyo:true,repeat:1});
    gsap.to(bd,{opacity:0,duration:.45,delay:.3,onComplete:()=>wing.kill()});
    const fl=mkd('flash');gsap.fromTo(fl,{opacity:0},{opacity:.6,duration:.12,yoyo:true,repeat:1,ease:'power1.out',onComplete:()=>fl.remove()});
    gsap.fromTo('main',{x:0,y:0},{keyframes:{x:[-8,7,-5,3,0],y:[3,-5,2,-1,0],easeEach:'power1.inOut'},duration:.5,clearProps:'transform'});
    sparksFrom(hx,hy,44);loveBurst(hx,hy,36);
    gsap.fromTo(C,{fov:84},{fov:62,duration:1.4,ease:'power3.out',onUpdate:upd});
    // hati membesar memenuhi layar -> ganti tahap di baliknya -> hati memudar
    gsap.to(H3,{scale:R*2.6/104,duration:.9,delay:.25,ease:'power3.in',onComplete:swap});
  };
  const swap=()=>{
    kids(fromS).forEach(clr);fromS.classList.remove('active');gsap.set(fromS,{clearProps:'all'});
    toS.classList.add('active');current=n;paintDots();
    const hx=b.x,hy=b.y,tk=kids(toS),pos=tk.map(c=>{const r=c.getBoundingClientRect();return[hx-(r.left+r.width/2),hy-(r.top+r.height/2),r.width||1,r.height||1]});
        tk.forEach((c,i)=>{const [dx,dy,w,h]=pos[i];gsap.fromTo(c,{xPercent:dx/w*100,yPercent:dy/h*100,scale:.15},{xPercent:0,yPercent:0,scale:1,duration:1.8,ease:'expo.out',delay:.35+i*.1})});
    gsap.to(H3,{opacity:0,duration:1,ease:'power1.inOut',onComplete:()=>{H3.remove();busy=false}});
    gsap.to('nav',{opacity:1,duration:1,clearProps:'opacity'});gsap.set('#mp',{clearProps:'opacity'});gsap.to('.mesh,#stars',{opacity:1,duration:1.2,clearProps:'opacity'});
    gsap.to(C.position,{z:10,duration:1.5,ease:EC});gsap.to(C,{fov:60,duration:1.6,ease:EC,onUpdate:upd});
    layers.forEach(({pts})=>gsap.to(pts.position,{x:0,y:0,duration:1.8,ease:EC}));
    gsap.to(mb,{'--tx':'0px','--ty':'0px',duration:1.8,ease:EC});
    if(enter[n])enter[n]();
  };
  tl.add(hit,3.5);
}
function sparksFrom(x,y,k){for(let i=0;i<k;i++){const d=document.createElement('div');d.className='trail';document.body.append(d);const a=Math.random()*6.283,m=60+Math.random()*140;
  gsap.set(d,{x,y});gsap.to(d,{x:x+Math.cos(a)*m,y:y+Math.sin(a)*m,scale:0,opacity:0,duration:1.1+Math.random()*.6,ease:'power2.out',onComplete:()=>d.remove()})}}

// --- Prisma kaca 3D (kado) ---
const pc=$('#pc'),PR=new THREE.WebGLRenderer({canvas:pc,alpha:true,antialias:true});PR.setPixelRatio(Math.min(devicePixelRatio,2));
const PS=new THREE.Scene(),PCam=new THREE.PerspectiveCamera(40,1,.1,50);PCam.position.z=5.4;
const pgeo=new THREE.OctahedronGeometry(1.2,0),
  pmat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{time:{value:0},glow:{value:1}},
    vertexShader:'varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vP=-mv.xyz;gl_Position=projectionMatrix*mv;}',
    fragmentShader:'varying vec3 vN;varying vec3 vP;uniform float time;uniform float glow;void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(vP))),2.);vec3 c=mix(vec3(.9,.77,.58),vec3(.95,.65,.65),.5+.5*sin(time*1.2+vN.y*3.));gl_FragColor=vec4(c*(f*1.7+.15)*glow,min(1.,(f*.9+.14)*glow));}'}),
  edges=new THREE.LineSegments(new THREE.EdgesGeometry(pgeo),new THREE.LineBasicMaterial({color:0xE6C594,transparent:true,opacity:.9})),
  inner=new THREE.Mesh(new THREE.OctahedronGeometry(.55,0),new THREE.MeshBasicMaterial({color:0xF2A6A6,wireframe:true,transparent:true,opacity:.7})),
  grp=new THREE.Group();
grp.add(new THREE.Mesh(pgeo,pmat),edges,inner);grp.scale.set(1,1.45,1);PS.add(grp);
const PX={spin:.006,sc:1,tx:0,ty:0};
function prismSize(){const w=$('#prism').clientWidth;if(w)PR.setSize(w,w,false)}addEventListener('resize',prismSize);
addEventListener('pointermove',e=>{if(current!==2)return;const r=pc.getBoundingClientRect();PX.ty=((e.clientX-r.left)/r.width-.5)*1.2;PX.tx=((e.clientY-r.top)/r.height-.5)*.9});
(function pl(t){
  if(current===2){
    pmat.uniforms.time.value=t/1000;grp.rotation.y+=PX.spin;grp.rotation.x+=(PX.tx-grp.rotation.x)*.06;grp.position.y=Math.sin(t/900)*.12;
    inner.rotation.y-=PX.spin*2;grp.scale.set(PX.sc,1.45*PX.sc,PX.sc);PR.render(PS,PCam);
  }
  requestAnimationFrame(pl);
})(0);

enter[2]=()=>{
  opened=false;prismSize();PX.sc=1;PX.spin=.006;pmat.uniforms.glow.value=1;edges.material.opacity=.9;gsap.set('#pc',{opacity:1});
  cardsIn();
  gsap.from('#prism',{scale:.6,opacity:0,duration:1.1,ease:'power3.out'});
};

// --- Klik kado ---
function openGift(){
  if(opened||busy)return;
  if(sel<0){const p=$('#prism');gsap.killTweensOf(p);gsap.to(p,{keyframes:{x:[-10,10,-8,8,-4,4,0],easeEach:'none'},duration:.5,onComplete:()=>gsap.set(p,{clearProps:'transform'})});
    $('#hint').textContent='Pilih lagunya dulu ya ♡';gsap.fromTo('#hint',{opacity:1,color:'#F2A6A6'},{opacity:.7,color:'#F4ECE4',duration:2});return}
  opened=true;committed=true;clearTimeout(pvTO);
  if(!userOff)Music.play(sel);chime();mpPaint();$('#mp').classList.add('show');
  const r=$('#prism').getBoundingClientRect(),c={x:r.left+r.width/2,y:r.top+r.height/2};
  gsap.to(PX,{sc:1.6,spin:.09,duration:.8,ease:'power2.out'});gsap.to(pmat.uniforms.glow,{value:3,duration:.6});
  sparksFrom(c.x,c.y,36);
  gsap.delayedCall(.6,()=>{gsap.to('#pc',{opacity:0,duration:.6});gsap.to(edges.material,{opacity:0,duration:.6});birdTravel(3,c)});
}
$('#prism').addEventListener('click',openGift);
$('#prism').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openGift()}});

// ===== TAHAP 3: Love Letter =====
function splitGold(el,lines){
  el.innerHTML=lines.map(l=>`<span class="gl">${l.split(' ').map(w=>`<span class="gw">${[...w].map(c=>`<span class="gc">${c}</span>`).join('')}</span>`).join(' ')}</span>`).join('');
}
function goldIn(el,delay){
  const w=el.getBoundingClientRect().width||600;el.style.setProperty('--w',w+'px');
  el.querySelectorAll('.gc').forEach(c=>c.style.setProperty('--ox',c.offsetLeft+'px'));
  el._tw&&el._tw.kill();el._tw=gsap.fromTo(el,{'--sh':'0px'},{'--sh':w+'px',duration:5,repeat:-1,ease:'none'});
  gsap.fromTo(el.querySelectorAll('.gc'),{opacity:0,y:50,rotationX:-90,transformPerspective:600},{opacity:1,y:0,rotationX:0,duration:1.1,stagger:.05,delay,ease:'power3.out'});
}
const h3=$('#h3'),sub3=$('#sub3');
splitGold(h3,['Your Special Day']);
sub3.innerHTML=sub3.textContent.split(' ').map(w=>`<span class="sw">${[...w].map(c=>`<span class="sc">${c}</span>`).join('')}</span>`).join(' ');
const FR=[['l1',-6],['l2',5],['l3',-4],['r1',6],['r2',-5],['r3',4]],DEP=[.7,1.1,.6,1,.65,1.15];
$('#frLayer').innerHTML=FR.map((f,i)=>`<div class="fr ${f[0]}" data-r="${f[1]}"><div class="in">${PHOTOS[i]?`<img src="${PHOTOS[i]}" alt="">`:'♡'}</div></div>`).join('');
let frTw=[];
enter[3]=()=>{
  goldIn(h3,.3);
  gsap.fromTo('#sub3 .sc',{opacity:0,y:14,filter:'blur(6px)'},{opacity:1,y:0,filter:'blur(0px)',duration:.9,stagger:.035,delay:1.4,ease:'power3.out'});
  gsap.fromTo('#letterBtn',{opacity:0,y:20},{opacity:1,y:0,duration:1,delay:2.4,ease:'power3.out'});
  frTw.forEach(t=>t.kill());frTw=[];
  document.querySelectorAll('.fr').forEach((el,i)=>{
    const r=+el.dataset.r,d=DEP[i];
    el.style.zIndex=Math.round(d*10);el.style.filter=d<.7?'blur(1.5px) brightness(.8)':'none';
    gsap.set(el,{rotation:r,scale:d,opacity:0,y:40,transformPerspective:800});
    gsap.to(el,{opacity:.55+d*.4,y:0,duration:1.2,delay:.3+i*.12,ease:'power3.out',onComplete:()=>{
      frTw.push(gsap.to(el,{y:'+='+(10+d*22),duration:4.4-d*1.6,repeat:-1,yoyo:true,ease:'sine.inOut'}));
    }});
  });
};
// Parallax tilt 3D mengikuti mouse (kedalaman berbeda per foto)
addEventListener('pointermove',e=>{
  if(current!==3||e.pointerType!=='mouse')return;
  const px=e.clientX/innerWidth-.5,py=e.clientY/innerHeight-.5;
  document.querySelectorAll('.fr').forEach((el,i)=>gsap.to(el,{x:-px*70*DEP[i],rotationY:px*30*DEP[i],rotationX:-py*20*DEP[i],duration:1.1,ease:'power2.out',overwrite:'auto'}));
});
// Tombol surat -> burung terbang -> Tahap 4
function birdNav(n,el){if(busy)return;const r=el.getBoundingClientRect();birdTravel(n,{x:r.left+r.width/2,y:r.top+r.height/2})}
$('#letterBtn').addEventListener('click',e=>birdNav(4,e.currentTarget));

// ===== TAHAP 4: Bento Grid =====
const SP=['a','b','c','b','c','d','b','b','d'],BP=[['230,197,148','242,166,166'],['242,166,166','230,197,148']];
$('#bento').innerHTML=GALLERY.slice(0,9).map((g,i)=>{
  const p=BP[i%2],bg=`radial-gradient(circle at ${20+(i*17)%60}% ${25+(i*23)%50}%,rgba(${p[0]},.5),transparent 56%),radial-gradient(circle at ${85-(i*11)%50}% 85%,rgba(${p[1]},.3),transparent 60%),#17121b`;
  return `<figure class="bt glass ${SP[i]}"><div class="bi">${g.src?`<img src="${g.src}" alt="${g.cap}">`:`<div class="ph" style="background:${bg}">♡</div>`}<figcaption>${g.cap}</figcaption></div></figure>`}).join('');
$('#bento').addEventListener('pointermove',e=>{const t=e.target.closest('.bt');if(!t)return;const r=t.getBoundingClientRect();t.style.setProperty('--mx',(e.clientX-r.left)+'px');t.style.setProperty('--my',(e.clientY-r.top)+'px')});
const h4=$('#h4'),sub4=$('#sub4');
splitGold(h4,['Our Memories']);
sub4.innerHTML=sub4.textContent.split(' ').map(w=>`<span class="sw">${[...w].map(c=>`<span class="sc">${c}</span>`).join('')}</span>`).join(' ');
enter[4]=()=>{
  goldIn(h4,.2);
  gsap.fromTo('#sub4 .sc',{opacity:0,y:14,filter:'blur(6px)'},{opacity:1,y:0,filter:'blur(0px)',duration:.9,stagger:.035,delay:1,ease:'power3.out'});
  gsap.fromTo('.bt',{opacity:0,y:50,scale:.92},{opacity:1,y:0,scale:1,duration:1.1,stagger:.09,delay:.7,ease:'power3.out',clearProps:'opacity,scale,transform'});
  gsap.fromTo('#nextBtn',{opacity:0,y:20},{opacity:1,y:0,duration:1,delay:1.9,ease:'power3.out'});
};
$('#nextBtn').addEventListener('click',e=>birdNav(5,e.currentTarget));

// Lightbox foto: klik frame -> zoom ke tengah + deskripsi
const lb=$('#lb'),lbc=$('.lbc');let lbOn=false;
function openLB(fig){
  const i=[...document.querySelectorAll('.bt')].indexOf(fig),g=GALLERY[i];if(!g||lbOn)return;lbOn=true;
  $('#lbm').innerHTML=fig.querySelector('img,.ph').outerHTML;$('#lbh').textContent=g.cap;$('#lbp').textContent=g.desc||'';
  lb.classList.add('open');lb.setAttribute('aria-hidden','false');
  const r=fig.getBoundingClientRect(),c=lbc.getBoundingClientRect();
  gsap.fromTo(lb,{opacity:0},{opacity:1,duration:.4});
  gsap.fromTo(lbc,{x:r.left+r.width/2-(c.left+c.width/2),y:r.top+r.height/2-(c.top+c.height/2),scale:Math.min(1,r.width/c.width),opacity:0},{x:0,y:0,scale:1,opacity:1,duration:.7,ease:'power3.out'});
  gsap.from('.lbt>*',{y:14,opacity:0,stagger:.1,delay:.35,duration:.6,ease:'power3.out'});
}
function closeLB(){
  if(!lbOn)return;lbOn=false;
  gsap.to(lbc,{scale:.9,opacity:0,duration:.3});
  gsap.to(lb,{opacity:0,duration:.3,onComplete:()=>{lb.classList.remove('open');lb.setAttribute('aria-hidden','true')}});
}
$('#bento').addEventListener('click',e=>{const f=e.target.closest('.bt');if(f)openLB(f)});
lb.addEventListener('click',e=>{if(e.target===lb)closeLB()});
$('#lbx').addEventListener('click',closeLB);
addEventListener('keydown',e=>{if(e.key==='Escape'){closeLB();closeHL()}});

// ===== TAHAP 5: Cinema =====
const vid=$('#vid'),fmt=s=>{s=Math.floor(s||0);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
let musicWas=false;
if(VIDEO_SRC){vid.src=VIDEO_SRC;$('#vph').style.display='none'}else $('#vbig').style.display='none';
function resumeMusic(){if(musicWas&&sel>=0){musicWas=false;setTrack(sel)}}
function vPaint(){const p=!vid.paused;$('#vplay').textContent=p?'❚❚':'▶';$('#vbig').classList.toggle('hide',p)}
function vToggle(){if(VIDEO_SRC)vid.paused?vid.play().catch(()=>{}):vid.pause()}
vid.addEventListener('play',()=>{if(Music.playing){musicWas=true;clearTimeout(pvTO);Music.stop(3);paintTracks();mpPaint()}$('#cwrap').classList.add('play');vPaint()});
vid.addEventListener('pause',()=>{$('#cwrap').classList.remove('play');vPaint()});
function showHeart(){const b=$('#heartBtn');if(!b.classList.contains('hid'))return;b.classList.remove('hid');gsap.from(b,{opacity:0,y:20,duration:1,ease:'power3.out'})}
vid.addEventListener('ended',()=>{$('#cwrap').classList.remove('play');resumeMusic();vPaint();showHeart()});
if(!VIDEO_SRC)showHeart();
$('#heartBtn').addEventListener('click',()=>goTo(6));
// Ambient light: warna glow mengikuti rata-rata warna frame video (fallback emas jika browser menolak)
const sc=document.createElement('canvas');sc.width=sc.height=8;const sx=sc.getContext('2d',{willReadFrequently:true});
setInterval(()=>{if(!VIDEO_SRC||vid.paused||current!==5)return;
  try{sx.drawImage(vid,0,0,8,8);const d=sx.getImageData(0,0,8,8).data;let r=0,g=0,b=0;
    for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2]}
    const n=d.length/4;r/=n;g/=n;b/=n;const m=Math.max(r,g,b);if(m<8)return;const k=Math.min(4,210/m);
    $('#amb').style.backgroundColor=`rgb(${r*k|0},${g*k|0},${b*k|0})`}catch(e){}},400);
vid.addEventListener('timeupdate',()=>{if(vid.duration)$('#vseek').value=vid.currentTime/vid.duration*1000;$('#vtime').textContent=fmt(vid.currentTime)+' / '+fmt(vid.duration)});
$('#vseek').addEventListener('input',e=>{if(vid.duration)vid.currentTime=e.target.value/1000*vid.duration});
$('#vplay').addEventListener('click',vToggle);$('#vbig').addEventListener('click',vToggle);vid.addEventListener('click',vToggle);
$('#vmute').addEventListener('click',()=>{vid.muted=!vid.muted;$('#vmute').textContent=vid.muted?'🔇':'🔊'});
enter[5]=()=>{
  gsap.fromTo('#cinema',{opacity:0,scaleX:.85,scaleY:.7},{opacity:1,scaleX:1,scaleY:1,duration:1.4,ease:'power3.out',clearProps:'opacity,transform'});
  gsap.fromTo('.vctl,#back5',{opacity:0,y:20},{opacity:1,y:0,duration:1,delay:1,stagger:.15,ease:'power3.out'});
};

// ===== TAHAP 6: Typewriter di hati kaca =====
let twT;
function typeIt(done){let i=0;const a=$('#twA'),b=$('#twB');
  (function nx(){a.textContent=MSG6.slice(0,i);b.textContent=MSG6.slice(i);
    if(i>=MSG6.length){done&&done();return}
    const c=MSG6[i++];twT=gsap.delayedCall(.03+Math.random()*.05+(c===','?.22:/[.!?]/.test(c)?.45:0),nx)})();
}
enter[6]=()=>{
  twT&&twT.kill();$('#twA').textContent='';$('#twB').textContent=MSG6;$('#lastBtn').classList.add('hid');
  gsap.fromTo('#heart',{opacity:0,scale:.7},{opacity:1,scale:1,duration:1.4,ease:'back.out(1.4)',clearProps:'transform,opacity',onComplete:()=>{
    gsap.to('#heart',{scale:1.025,duration:.9,repeat:-1,yoyo:true,ease:'sine.inOut'})}});
  gsap.delayedCall(1.4,()=>typeIt(()=>{const b=$('#lastBtn');b.classList.remove('hid');gsap.from(b,{opacity:0,y:20,duration:1,ease:'power3.out'})}));
};
$('#lastBtn').addEventListener('click',e=>birdNav(7,e.currentTarget));

// ===== TAHAP 7: Grand Finale + kembang api emas 3D =====
const h7=$('#h7');splitGold(h7,['Selamat Ulang Tahun','Sayangkuh Tercinta']);$('#sub7').textContent=MSG7;
const FN=1400,fp=new Float32Array(FN*3),fc=new Float32Array(FN*3),fv=new Float32Array(FN*3),fb=new Float32Array(FN*3),fl=new Float32Array(FN);
const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.BufferAttribute(fp,3));const fa=new Float32Array(FN);fg.setAttribute('aC',new THREE.BufferAttribute(fc,3));fg.setAttribute('aA',new THREE.BufferAttribute(fa,1));
const fU={map:{value:tex},k:{value:1}},fmat=new THREE.ShaderMaterial({uniforms:fU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'attribute vec3 aC;attribute float aA;uniform float k;varying vec3 vC;varying float vA;void main(){vC=aC;vA=aA;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=k/-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform sampler2D map;varying vec3 vC;varying float vA;void main(){gl_FragColor=vec4(vC,texture2D(map,gl_PointCoord).a*vA);}'});
const fk=()=>{fU.k.value=.26*Math.min(devicePixelRatio,2)*innerHeight*.5};fk();addEventListener('resize',fk);
const fpts=new THREE.Points(fg,fmat);fpts.frustumCulled=false;S.add(fpts);
let fi=0,fT;
function burst(){
  const ar=innerWidth/innerHeight,cx=(Math.random()-.5)*2*Math.min(9,5.5*ar),cy=.5+Math.random()*4.5,cz=-4+Math.random()*4,pal=[[1,.78,.45],[1,.93,.75],[.95,.65,.65]][Math.random()*3|0];
  for(let k=0;k<90;k++){const i=(fi++%FN)*3,a=Math.random()*6.283,b=Math.acos(2*Math.random()-1),sp=2+Math.random()*2.6;
    fp.set([cx,cy,cz],i);fv.set([Math.sin(b)*Math.cos(a)*sp,Math.sin(b)*Math.sin(a)*sp,Math.cos(b)*sp],i);fc.set(pal,i);fl[i/3]=1}fg.attributes.aC.needsUpdate=true;
}
(function fw(){
  requestAnimationFrame(fw);let alive=false;
  for(let i=0;i<FN;i++){if(fl[i]<=0)continue;alive=true;fl[i]-=.0095;const j=i*3,k=fl[i]>0?Math.min(1,fl[i]*1.6):0;
    fv[j]*=.985;fv[j+1]=fv[j+1]*.985-.03;fv[j+2]*=.985;fp[j]+=fv[j]*.016;fp[j+1]+=fv[j+1]*.016;fp[j+2]+=fv[j+2]*.016;
    fa[i]=k}
  if(alive){fg.attributes.position.needsUpdate=true;fg.attributes.aA.needsUpdate=true}
})();
enter[7]=()=>{
  goldIn(h7,.2);
  gsap.fromTo('#sub7',{opacity:0,y:16,filter:'blur(8px)'},{opacity:1,y:0,filter:'blur(0px)',duration:1.6,delay:1.6,ease:'power3.out'});
  gsap.fromTo('#growBtn',{opacity:0,y:20},{opacity:1,y:0,duration:1,delay:2.8,ease:'power3.out'});
  clearInterval(fT);burst();
  fT=setInterval(()=>{if(current!==7){clearInterval(fT);return}burst();if(Math.random()<.4)setTimeout(burst,250)},750);
};
$('#growBtn').addEventListener('click',e=>birdNav(8,e.currentTarget));

// ===== TAHAP 8: Pohon Cinta =====
const NS='http://www.w3.org/2000/svg',TX=200,TY=293,mk=(n,a)=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);return e};
const hpt=(t,s,m)=>{const x=16*Math.pow(Math.sin(t),3),y=13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t);return[TX+m*s*x,TY-17*s-s*y]};
const PINK=['#F8C8D4','#F2A6A6','#FBD9E0','#f7b9c6','#E6C594'];
function blossom(x,y,r,col){
  const g=mk('g',{class:'bl'});g.dataset.x=x.toFixed(1);g.dataset.y=y.toFixed(1);
  for(let a=0;a<5;a++){const an=a*1.2566+Math.random()*.4;g.append(mk('circle',{cx:(x+Math.cos(an)*r*.8).toFixed(1),cy:(y+Math.sin(an)*r*.8).toFixed(1),r:(r*.62).toFixed(1),fill:col,'fill-opacity':.92}))}
  g.append(mk('circle',{cx:x.toFixed(1),cy:y.toFixed(1),r:(r*.38).toFixed(1),fill:col==='#E6C594'?'#fff6e6':'#E6C594'}));return g;
}
(function buildTree(){
  const tbr=$('#tbr'),tbl=$('#tbl'),N=44;
  [[9,4.4,34],[6.6,3,20],[4.2,2,9]].forEach(([s,w,bc],L)=>[1,-1].forEach(m=>{
    let d='';for(let k=0;k<=N;k++){const p=hpt(Math.PI*(1-k/N),s,m);d+=(k?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)}
    tbr.append(mk('path',{d,'stroke-width':w,'stroke-linejoin':'round',class:'dr br'+L}));
    for(let k=1;k<=bc;k++){const pr=k/bc,p=hpt(Math.PI*(1-pr*.98),s,m),g=blossom(p[0]+(Math.random()-.5)*7,p[1]+(Math.random()-.5)*7,(L?5.5:7)+Math.random()*3,PINK[Math.random()*PINK.length|0]);g.dataset.p=pr;tbl.append(g)}
    if(!L)for(let k=3;k<N;k+=3){
      const p=hpt(Math.PI*(1-k/N),9,m),dx=p[0]-TX,dy=p[1]-(TY-153),l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l,e=9+Math.random()*10;
      tbr.append(mk('path',{d:`M${p[0].toFixed(1)} ${p[1].toFixed(1)}Q${(p[0]+ux*e/2-uy*4).toFixed(1)} ${(p[1]+uy*e/2+ux*4).toFixed(1)} ${(p[0]+ux*e).toFixed(1)} ${(p[1]+uy*e).toFixed(1)}`,'stroke-width':1.6,class:'dr tw'}))}
  }));
  document.querySelectorAll('#tree .dr').forEach(p=>{p.setAttribute('pathLength',1);p.style.strokeDasharray='1 1'});
})();
let tl8,petalTw=[];
function stopTree(){tl8&&tl8.kill();petalTw.forEach(t=>t.kill());petalTw=[];$('#petals').innerHTML=''}
function startPetals(){
  const L=$('#petals'),W=innerWidth,H=innerHeight;
  for(let i=0;i<28;i++){const p=document.createElement('i'),x0=Math.random()*W*.85,du=7+Math.random()*5;p.className='petal';L.append(p);
    gsap.set(p,{x:x0,y:-30,scale:.6+Math.random()*.9,rotation:Math.random()*360,opacity:0});
    petalTw.push(gsap.timeline({repeat:-1,delay:Math.random()*6})
      .to(p,{opacity:.9,duration:.8},0).to(p,{y:H+40,duration:du,ease:'none'},0)
      .to(p,{x:x0+120+Math.random()*180,duration:du,ease:'sine.inOut'},0).to(p,{rotation:'+=360',duration:du,ease:'none'},0))}
}
enter[8]=()=>{
  stopTree();
  tl8=gsap.timeline();
  const dr=(sel,d,pos,ease='power2.inOut')=>tl8.fromTo(sel,{strokeDashoffset:1,visibility:'hidden'},{strokeDashoffset:0,visibility:'visible',duration:d,ease,stagger:sel==='.tw'?.04:0},pos);
  dr('#trunk,.root',3.2,0,'power1.inOut');
  dr('.br0',2.8,'-=0.2');dr('.br1',2.4,'-=2.2');dr('.br2',2,'-=2');dr('.tw',1,'-=1.2');
  tl8.addLabel('bloom','-=1.2');
  document.querySelectorAll('.bl').forEach(g=>{const x=g.dataset.x,y=g.dataset.y;
    tl8.fromTo(g,{opacity:0,scale:0,svgOrigin:x+' '+y},{opacity:1,scale:1,duration:.9,ease:'back.out(2)'},'bloom+='+(g.dataset.p*2.4+Math.random()*.3))});
  tl8.add(startPetals,'bloom+=2')
     .fromTo('#msg8',{opacity:0,y:14,filter:'blur(8px)'},{opacity:1,y:0,filter:'blur(0px)',duration:2.4,ease:'power2.out'},'bloom+=1.6')
     .fromTo('#replayBtn',{opacity:0,y:20},{opacity:1,y:0,duration:1,ease:'power3.out'},'>-0.6');
};
$('#replayBtn').addEventListener('click',()=>{
  if(busy)return;stopTree();clearTimeout(pvTO);Music.stop(1);
  committed=false;sel=-1;opened=false;userOff=false;musicWas=false;
  $('#mp').classList.remove('show');$('#hint').textContent='Pilih satu lagu dulu, lalu ketuk kadonya ✦';
  vid.pause();try{vid.currentTime=0}catch(e){}if(VIDEO_SRC)$('#heartBtn').classList.add('hid');
  paintTracks();mpPaint();goTo(1);
});

// Tahap 3: klik foto -> zoom dalam bingkai hati
const hl=$('#hl'),hz=$('#hz');let hlOn=false;
function openHL(el){
  if(hlOn)return;hlOn=true;const im=el.querySelector('img');
  $('#hzIn').innerHTML=im?`<img src="${im.getAttribute('src')}" alt="">`:'<div class="hph">♡</div>';
  hl.classList.add('open');hl.setAttribute('aria-hidden','false');
  const r=el.getBoundingClientRect(),c=hz.getBoundingClientRect();
  gsap.fromTo(hl,{opacity:0},{opacity:1,duration:.4});
  gsap.fromTo(hz,{x:r.left+r.width/2-(c.left+c.width/2),y:r.top+r.height/2-(c.top+c.height/2),scale:Math.min(1,r.width/c.width),rotation:+el.dataset.r||0,opacity:0},{x:0,y:0,scale:1,rotation:0,opacity:1,duration:.85,ease:'back.out(1.3)'});
}
function closeHL(){
  if(!hlOn)return;hlOn=false;
  gsap.to(hz,{scale:.8,opacity:0,duration:.3});
  gsap.to(hl,{opacity:0,duration:.3,onComplete:()=>{hl.classList.remove('open');hl.setAttribute('aria-hidden','true')}});
}
$('#frLayer').addEventListener('click',e=>{const f=e.target.closest('.fr');if(f)openHL(f)});
hl.addEventListener('click',closeHL);

['.b1','.b2','.b3'].forEach(s=>gsap.set(s,{'--tx':'0px','--ty':'0px'}));
