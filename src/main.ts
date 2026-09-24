import './style.css';
import { views, rooms, connections, artUrls, type Spot } from './world';
import { Ambience } from './audio';
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const viewport=$('viewport'),scene=$('scene'),spots=$('spots'),room=$<HTMLImageElement>('room'),loading=$('loading'),turn=$<HTMLButtonElement>('turn'),message=$('message'),map=$<HTMLDialogElement>('map-dialog');
const motion=matchMedia('(prefers-reduced-motion: reduce)'),ambience=new Ambience();
const key='dungeon-underchapel-v1';
type Memory={view:string;visited:string[];noticed:string[];sound:boolean;hints:boolean};
let memory:Memory={view:'entrance',visited:[],noticed:[],sound:false,hints:false};
try{const s=JSON.parse(localStorage.getItem(key)||'null');if(s&&typeof s==='object'){memory={view:views[s.view]?s.view:'entrance',visited:Array.isArray(s.visited)?s.visited.filter((x:unknown)=>typeof x==='string'&&rooms[x]):[],noticed:Array.isArray(s.noticed)?s.noticed.filter((x:unknown)=>typeof x==='string'):[],sound:s.sound===true,hints:s.hints===true}}}catch{/* Private browsing and old saves must not block entry. */}
let current=memory.view,busy=false,rippleAt=-10000,started=false;
function save(){try{localStorage.setItem(key,JSON.stringify(memory))}catch{/* Exploration still works without storage. */}}
const images=new Map<string,Promise<HTMLImageElement>>();
function load(art:string){if(!images.has(art)){const task=new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>img.decode().then(()=>resolve(img),reject);img.onerror=()=>reject(new Error('Could not load '+art));img.src=artUrls[art]||''});images.set(art,task);task.catch(()=>images.delete(art))}return images.get(art)!}
const pause=(ms:number)=>new Promise(r=>window.setTimeout(r,motion.matches?0:ms));
function renderSpots(){spots.replaceChildren();for(const s of views[current].spots){const b=document.createElement('button');b.className='spot'+(s.edge?' edge':'')+(!s.to||views[s.to]?.zoom?' inspect':'');b.dataset.spot=s.id;b.setAttribute('aria-label',s.label);Object.assign(b.style,{left:s.x+'%',top:s.y+'%',width:(s.w||12)+'%',height:(s.h||20)+'%'});const label=document.createElement('span');label.textContent=s.label;b.append(label);b.addEventListener('click',()=>void act(s));spots.append(b)}}
async function act(s:Spot){if(busy)return;wake();if(s.to){scene.style.setProperty('--origin',`${s.x}% ${s.y}%`);await show(s.to);return}const seen=memory.noticed.includes(s.id);if(!seen)memory.noticed.push(s.id);save();message.textContent=s.text||'';if(s.sound){ambience.sound(s.sound);if(s.sound==='water')rippleAt=performance.now()}}
function wake(){if(!started){started=true;if(memory.sound)void ambience.enable(true).catch(()=>{memory.sound=false;settings()})}}
async function show(id:string,turning=false,initial=false){
 if(busy||!views[id])return;busy=true;spots.inert=true;turn.disabled=true;
 const next=views[id],old=views[current];loading.hidden=true;
 const timeout=window.setTimeout(()=>{loading.textContent='A moment in the dark…';loading.hidden=false},700);
 try{
  // Decode before fading out. Failed requests leave the previous viewpoint playable.
  const image=await load(next.art);window.clearTimeout(timeout);loading.hidden=true;
  if(!initial){viewport.classList.add(turning?'turning':'leaving');await pause(360)}
  current=id;memory.view=id;if(!memory.visited.includes(next.room))memory.visited.push(next.room);save();
  room.src=image.src;room.alt=next.alt;const [scale,zx,zy]=next.zoom||[1,50,50];const cx=Math.max(50/scale,Math.min(100-50/scale,zx)),cy=Math.max(50/scale,Math.min(100-50/scale,zy));room.style.setProperty('--zoom-origin','0% 0%');room.style.transform=`translate(${50-scale*cx}%,${50-scale*cy}%) scale(${scale})`;
  viewport.dataset.view=id;viewport.dataset.room=next.room;viewport.setAttribute('aria-label',next.title+'. '+next.alt);
  $('place').textContent=next.title;$('orientation').textContent=next.facing;turn.hidden=!next.turn&&!next.parent;turn.textContent=next.parent?'↶ Step back':'↶ Turn around';
  renderSpots();ambience.mix(next.room,id.endsWith('-back'));
  message.textContent=initial?(memory.visited.length>1?'Your light falls where you left it.':'Touch a passage to move. Pause wherever you like.'):(next.parent?'':next.room===old.room?'':arrival(next.room,old.room));
  await pause(60);viewport.classList.remove('leaving','turning');await pause(240);
  if(!initial)viewport.focus({preventScroll:true});
  const neighbors=new Set([next.turn,next.parent,...next.spots.map(s=>s.to)].filter(Boolean) as string[]);for(const v of neighbors)void load(views[v].art).catch(()=>{});
 }catch{window.clearTimeout(timeout);loading.hidden=true;message.textContent='This passage could not be loaded. Tap it to try again.';if(initial){loading.hidden=false;loading.textContent='The entrance could not be loaded. Reload to try again.'}}
 finally{busy=false;spots.inert=false;turn.disabled=false;viewport.classList.remove('leaving','turning')}
}
function arrival(to:string,from:string){if(to==='entrance'&&from==='stair')return 'The same empty bowl. You have come around beneath the chapel.';if(to==='cistern')return 'The ledge continues around the water. Above you, the chapel is silent.';if(to==='crypt'&&from==='cistern')return 'The air dries as you climb. The altar lies beyond the niches.';if(to==='watercourse')return 'Water goes one way. The dry edge lets you go either.';return ''}
turn.addEventListener('click',()=>{wake();void show(views[current].parent||views[current].turn!,true)});
function settings(){$('sound').textContent=memory.sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(memory.sound));$('hints').setAttribute('aria-pressed',String(memory.hints));viewport.classList.toggle('show-hints',memory.hints)}
$('sound').addEventListener('click',async()=>{memory.sound=!memory.sound;started=true;try{await ambience.enable(memory.sound)}catch{memory.sound=false;message.textContent='Audio is unavailable in this browser.'}settings();save()});
$('hints').addEventListener('click',()=>{memory.hints=!memory.hints;settings();save()});
function drawMap(){const seen=new Set(memory.visited);let svg='<svg viewBox="0 0 480 375" role="img" aria-label="Explored underchapel paths">';for(const [a,b] of connections){if(!seen.has(a)||!seen.has(b))continue;const p=rooms[a],q=rooms[b];svg+=`<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" ${p.level!==q.level?'stroke-dasharray="5 5"':''}/>`}for(const id of seen){const r=rooms[id];svg+=`<g class="${views[current].room===id?'current':''}"><circle cx="${r.x}" cy="${r.y}" r="7"/><text x="${r.x}" y="${r.y+26}" text-anchor="middle">${r.name}</text></g>`}svg+='</svg>';$('map').innerHTML=svg}
$('map-button').addEventListener('click',()=>{drawMap();map.showModal()});$('map-close').addEventListener('click',()=>map.close());map.addEventListener('click',e=>{if(e.target===map){const r=map.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)map.close()}});
document.addEventListener('keydown',e=>{if(map.open)return;if(e.key==='Escape'&&!turn.hidden){e.preventDefault();turn.click()}if(e.key.toLowerCase()==='h'&&!(e.target instanceof HTMLInputElement))$('hints').click()});
// Dust and water rings are overlays, never substitutes for architectural artwork.
const canvas=$<HTMLCanvasElement>('air'),ctx=canvas.getContext('2d')!;canvas.width=1280;canvas.height=720;
const dust=Array.from({length:28},()=>({x:Math.random()*1280,y:Math.random()*720,s:.05+Math.random()*.16,r:.35+Math.random()*.8}));let last=0;
function animate(t:number){requestAnimationFrame(animate);if(document.hidden||motion.matches){ctx.clearRect(0,0,1280,720);last=t;return}if(t-last<48)return;const dt=Math.min(100,t-last);last=t;ctx.clearRect(0,0,1280,720);if(!views[current].zoom){for(const p of dust){p.x=(p.x+dt*p.s*.025)%1280;p.y=(p.y-dt*.003+720)%720;ctx.fillStyle=`rgba(226,208,170,${.08+.09*Math.sin(p.x*.01)**2})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}}
 if(views[current].room==='cistern'){const touched=t-rippleAt<6000;const phase=touched?(t-rippleAt)/6000:(t%7100)/7100;const x=640,y=current==='water'?490:530;ctx.strokeStyle=`rgba(169,191,191,${(1-phase)*(touched?.28:.065)})`;ctx.lineWidth=1;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(x,y,12+phase*175+i*18,3+phase*22+i*4,0,0,Math.PI*2);ctx.stroke()}}}
settings();void show(current,false,true);requestAnimationFrame(animate);
