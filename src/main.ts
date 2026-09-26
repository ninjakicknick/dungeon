import './style.css';
import { views, rooms, connections, artUrls, type Spot } from './world';
import { Ambience } from './audio';
import { loadMemory, persist, pathKey } from './memory';
import { installInput } from './input';
import { createAtmosphere } from './presence';
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const viewport=$('viewport'),scene=$('scene'),spots=$('spots'),room=$<HTMLImageElement>('room'),echo=$<HTMLImageElement>('echo'),loading=$('loading'),turn=$<HTMLButtonElement>('turn'),message=$('message'),map=$<HTMLDialogElement>('map-dialog');
const motion=matchMedia('(prefers-reduced-motion: reduce)'),ambience=new Ambience();
const memory=loadMemory();
let current=memory.view,busy=false,started=false,variantGeneration=0,arrivedAt=performance.now(),ringAt=-100000;
const save=()=>persist(memory);
const images=new Map<string,Promise<HTMLImageElement>>();
function load(art:string){if(!images.has(art)){const task=new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>img.decode().then(()=>resolve(img),reject);img.onerror=()=>reject(new Error('Could not load '+art));img.src=artUrls[art]||''});images.set(art,task);task.catch(()=>images.delete(art))}return images.get(art)!}
const pause=(ms:number)=>new Promise(r=>window.setTimeout(r,motion.matches?0:ms));
function artFor(id:string){return views[id].room==='bell'&&memory.mouth?'bell-open':views[id].art}
function available(s:Spot){return !s.requires||memory.mouth}
function renderSpots(){spots.replaceChildren();for(const s of views[current].spots.filter(available)){const b=document.createElement('button');b.className='spot'+(s.edge?' edge':'')+(s.action||s.to&&views[s.to]?.parent?' inspect':'');b.dataset.spot=s.id;b.setAttribute('aria-label',s.label);Object.assign(b.style,{left:s.x+'%',top:s.y+'%',width:(s.w||12)+'%',height:(s.h||20)+'%'});const label=document.createElement('span');label.textContent=s.label;b.append(label);b.addEventListener('click',()=>void act(s));spots.append(b)}}
async function act(s:Spot){if(busy||map.open||!available(s))return;wake();message.textContent='';if(s.to){scene.style.setProperty('--origin',`${s.x}% ${s.y}%`);await show(s.to);return}
 if(s.action==='bell'){
  busy=true;spots.inert=true;turn.disabled=true;
  try{
   const nextArt=await load(memory.mouth?'bell':'bell-open');
   ambience.sound('bell');ringAt=performance.now();viewport.classList.add('resonating');
   await pause(700);memory.mouth=!memory.mouth;memory.bellCount++;memory.noticed.push('bell');memory.noticed=[...new Set(memory.noticed)];save();
   echo.src=nextArt.src;echo.style.transform=room.style.transform;echo.style.opacity='1';
   await pause(1000);room.src=nextArt.src;await pause(40);echo.style.opacity='0';renderSpots();
   room.alt=memory.mouth?'The stone lips have parted. Warm lamplight falls from a small room beyond.':views[current].alt;
   // The opening is its own explanation. No secret notice or reward toast.
  }catch{message.textContent='The room could not be loaded. Pull the rope to try again.'}
  finally{viewport.classList.remove('resonating');busy=false;spots.inert=false;turn.disabled=false;viewport.focus({preventScroll:true})}
 }else if(s.action){
  if(!memory.noticed.includes(s.action))memory.noticed.push(s.action);save();
  if(s.action==='water'){atmosphere.touchWater();ambience.sound('water')}
  if(s.action==='listen'){ambience.sound('metal');message.textContent='A note inside the hollow bronze. Then, somewhere further down the hall, another.';window.setTimeout(()=>{if(views[current].room==='armor'&&!document.hidden)ambience.sound('metal',false)},1700)}
  if(s.action==='tea'){ambience.sound('cup');message.textContent='Still warm.'}
 }
}
function wake(){if(!started){started=true;if(memory.sound)void ambience.enable(true).catch(()=>{memory.sound=false;settings()})}}
async function show(id:string,turning=false,initial=false){
 if(busy||!Object.hasOwn(views,id))return;busy=true;spots.inert=true;turn.disabled=true;++variantGeneration;
 const next=views[id],old=views[current];loading.hidden=true;
 const timeout=window.setTimeout(()=>{loading.textContent='A moment in the dark…';loading.hidden=false},700);
 try{
  const image=await load(artFor(id));window.clearTimeout(timeout);loading.hidden=true;
  if(!initial){viewport.classList.add(turning?'turning':'leaving');await pause(360)}
  if(!initial&&old.room!==next.room){const path=pathKey(old.room,next.room);if(!memory.paths.includes(path))memory.paths.push(path);ambience.sound('step')}
  current=id;memory.view=id;arrivedAt=performance.now();if(!memory.visited.includes(next.room))memory.visited.push(next.room);save();
  echo.style.opacity='0';echo.removeAttribute('src');room.src=image.src;room.alt=next.alt;
  const [scale,zx,zy]=next.zoom||[1,50,50],cx=Math.max(50/scale,Math.min(100-50/scale,zx)),cy=Math.max(50/scale,Math.min(100-50/scale,zy));
  room.style.transform=`translate(${50-scale*cx}%,${50-scale*cy}%) scale(${scale})`;echo.style.transform=room.style.transform;
  viewport.dataset.view=id;viewport.dataset.room=next.room;viewport.setAttribute('aria-label',next.title+'. '+next.alt);
  $('place').textContent=next.title;$('orientation').textContent=next.facing;turn.hidden=!next.turn&&!next.parent;turn.textContent=next.parent?'↶ Step back':'↶ Turn around';
  renderSpots();ambience.mix(next.room,id.endsWith('-back'));
  message.textContent=initial&&memory.visited.length===1?'Touch a doorway to wander. Hotspots shows where you can move or settle.':'';
  await pause(80);viewport.classList.remove('leaving','turning');await pause(300);
  if(!initial)viewport.focus({preventScroll:true});
  const neighbors=new Set([next.turn,next.parent,...next.spots.filter(available).map(s=>s.to)].filter(Boolean) as string[]);for(const v of neighbors)void load(artFor(v)).catch(()=>{});
  if(next.room==='bell')void load(memory.mouth?'bell':'bell-open').catch(()=>{});
  if(next.room==='armor')void load('armor-awake').catch(()=>{});
 }catch{window.clearTimeout(timeout);loading.hidden=true;message.textContent='This passage could not be loaded. Tap it to try again.';if(initial){loading.hidden=false;loading.textContent='The entrance could not be loaded. Reload to try again.'}}
 finally{busy=false;spots.inert=false;turn.disabled=false;viewport.classList.remove('leaving','turning')}
}
function goBack(){if(map.open){map.close();return}const v=views[current];const destination=v.parent||v.turn||v.spots.find(s=>s.edge)?.to;if(destination){wake();void show(destination,Boolean(v.turn))}}
turn.addEventListener('click',goBack);
function settings(){$('sound').textContent=memory.sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(memory.sound));$('hints').setAttribute('aria-pressed',String(memory.hints));viewport.classList.toggle('show-hints',memory.hints)}
$('sound').addEventListener('click',async()=>{memory.sound=!memory.sound;started=true;try{await ambience.enable(memory.sound)}catch{memory.sound=false;message.textContent='Audio is unavailable in this browser.'}settings();save()});
$('hints').addEventListener('click',()=>{memory.hints=!memory.hints;settings();save()});
function drawMap(){
 const seen=new Set(memory.visited);let svg='<svg viewBox="0 0 490 325" role="img" aria-label="Places and paths you remember">';
 for(const [a,b] of connections){const p=rooms[a],q=rooms[b];if(memory.paths.includes(pathKey(a,b))){svg+=`<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>`}else if(seen.has(a)!==seen.has(b)&&b!=='tea'){
  const f=seen.has(a)?p:q,t=seen.has(a)?q:p;svg+=`<line class="unexplored" x1="${f.x}" y1="${f.y}" x2="${f.x+(t.x-f.x)*.24}" y2="${f.y+(t.y-f.y)*.24}"/>`;
 }}
 for(const id of seen){const r=rooms[id];svg+=`<g class="${views[current].room===id?'current':''}"><circle style="--room-color:${r.color}" cx="${r.x}" cy="${r.y}" r="7"/><text x="${r.x}" y="${r.y+24}" text-anchor="middle">${r.name}</text></g>`}svg+='</svg>';$('map').innerHTML=svg;
}
function toggleMap(){if(map.open)map.close();else if(!busy){drawMap();map.showModal()}}
$('map-button').addEventListener('click',toggleMap);$('map-close').addEventListener('click',()=>map.close());
map.addEventListener('click',e=>{if(e.target===map){const r=map.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)map.close()}});
installInput({viewport,spots,map,busy:()=>busy,back:goBack,mapToggle:toggleMap,hints:()=>$('hints').click(),sound:()=>$('sound').click(),wake});
const atmosphere=createAtmosphere($<HTMLCanvasElement>('air'),()=>({view:current,seed:memory.seed,still:performance.now()-arrivedAt,ringAt,quiet:map.open||busy}),motion);
// A visor occupies a different position sometimes. The room does not wait for a click.
let lastWatchState=false;
window.setInterval(()=>{
 if(document.hidden||busy||map.open||!['armor','visor'].includes(current))return;
 const raised=Math.floor((Date.now()+memory.seed*71)/47000)%3===1;
 if(raised===lastWatchState&&echo.getAttribute('src'))return;
 lastWatchState=raised;const generation=++variantGeneration;
 void load('armor-awake').then(img=>{if(generation!==variantGeneration||!['armor','visor'].includes(current))return;echo.src=img.src;echo.style.transform=room.style.transform;echo.style.opacity=raised?'1':'0'}).catch(()=>{});
},1500);
settings();void show(current,false,true);
