// A real-browser alternative when the environment cannot launch local Chromium.
// Runs only at /tests/preview.html in the Vite development server; not bundled.
const frame=document.querySelector('#game'),log=document.querySelector('#log'),result=document.querySelector('#result');
const flags=window.testFlags={blocked:false,failArmor:false,clock:null};window.testMemory={};window.testErrors=[];
const key='dungeon-wonder-v1';
const assert=(v,m)=>{if(!v)throw Error(m)};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){const until=performance.now()+15000;while(performance.now()<until){if(fn())return;await delay(40)}throw Error('Timed out: '+label)}
const doc=()=>frame.contentDocument,win=()=>frame.contentWindow;
const get=id=>doc().getElementById(id);
const view=async id=>{await until(()=>get('viewport')?.dataset.view===id&&!get('spots').inert,id);assert(get('room').complete&&get('room').naturalWidth>1000,'Loaded image for '+id)};
function button(label){const b=[...doc().querySelectorAll('button')].find(x=>(x.getAttribute('aria-label')||x.textContent)===label);assert(b,'Button exists: '+label);return b}
async function go(label,id){button(label).click();await view(id)}
const note=s=>{log.textContent+='✓ '+s+'\n'};
const html=await (await fetch('/dungeon/')).text();
async function boot(){
 const setup=`<script>
  Storage.prototype.getItem=function(k){if(parent.testFlags.blocked)throw Error('blocked');return parent.testMemory[k]||null};
  Storage.prototype.setItem=function(k,v){if(parent.testFlags.blocked)throw Error('blocked');parent.testMemory[k]=v};
  const originalMedia=window.matchMedia;window.matchMedia=q=>q.includes('prefers-reduced-motion')?{matches:true}:originalMedia(q);
  const nativeNow=Date.now;Date.now=()=>parent.testFlags.clock??nativeNow();
  const NativeImage=window.Image;window.Image=class extends NativeImage{set src(v){super.src=parent.testFlags.failArmor&&/\\/armor(?:-|\\.webp)/.test(v)&&!v.includes('armor-back')?'data:image/png;base64,broken':v}get src(){return super.src}};
  window.testPad={connected:true,axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};
  window.padPolls=0;Object.defineProperty(navigator,'getGamepads',{value:()=>{window.padPolls++;return [window.testPad]}});
  addEventListener('error',e=>parent.testErrors.push(e.message));
  addEventListener('unhandledrejection',e=>parent.testErrors.push(String(e.reason)));
 <\/script>`;
 await new Promise(resolve=>{frame.onload=resolve;frame.srcdoc=html.replace('<head>','<head>'+setup)});
 await until(()=>get('viewport')?.dataset.view&&!get('spots').inert,'start');
}
async function press(n){let count=win().padPolls;win().testPad.buttons[n].pressed=true;await until(()=>win().padPolls>count,'controller sampling (visibility '+doc().visibilityState+')');count=win().padPolls;win().testPad.buttons[n].pressed=false;await until(()=>win().padPolls>count,'controller release')}
async function geometry(){
 await delay(80);const r=get('viewport').getBoundingClientRect();assert(doc().documentElement.scrollWidth<=frame.clientWidth,'No horizontal overflow');
 for(const b of doc().querySelectorAll('.spot')){const s=b.getBoundingClientRect();assert(s.left>=r.left-1&&s.right<=r.right+1&&s.top>=r.top-1&&s.bottom<=r.bottom+1,'Hotspot within image: '+b.getAttribute('aria-label'))}
}
document.querySelector('#portrait').onclick=()=>{frame.width=390;frame.height=844};document.querySelector('#landscape').onclick=()=>{frame.width=844;frame.height=390};
document.querySelector('#run').onclick=async()=>{
 document.querySelector('#run').disabled=true;log.textContent='';result.textContent='Running…';
 try{
  window.testMemory={};window.testErrors=[];Object.assign(flags,{blocked:false,failArmor:false,clock:null});await boot();await view('fountain');
  get('map-button').click();assert(doc().querySelectorAll('#map circle').length===1,'Only initial room on map');assert(!get('map').textContent.includes('room for one'),'No secret name leaked');get('map-close').click();
  await go('Sit beside the fountain','pool');await go('Trail your fingers in the water','pool');await go('Stand up','fountain');await go('Enter the red corridor','armor');await go('Approach the nearest helmet','visor');await go('Listen inside the helmet','visor');await go('Step back','armor');await go('Walk toward the bridge','bridge');await go('Lean over the parapet','shaft');await go('Step away from the edge','bridge');await go('Cross the bridge','landing');await go('↶ Turn around','bridge-back');await go('↶ Turn around','landing');await go('Step into the bell chamber','bell');
  assert(!doc().querySelector('[data-spot="mouth"]'),'Closed mouth has no route');await go('Pull the bell rope','bell');assert(get('room').src.includes('bell-open'),'Opening visible');await go('Step between the stone lips','tea');await go('Sit in the velvet chair','chair');await go('Warm your hands around the cup','chair');await boot();await view('chair');await go('Leave the chair','tea');await go('Step back through the stone lips','bell');assert(doc().querySelector('[data-spot="mouth"]'),'Opening survives reload');await go('Pull the bell rope','bell');assert(!doc().querySelector('[data-spot="mouth"]'),'Closing removes route');
  await go('Descend into the lantern garden','mushroom');await go('Sit beneath the mushrooms','root');await go('Stand up','mushroom');await go('Return to the frog fountain','fountain');note('Complete forward loop, every close view, bell opens/closes, hidden room and persistence');
  await go('Follow the mushroom light','mushroom');await go('Climb toward the copper bell','bell');await go('Return to the bridge','bridge-back');await go('Cross back to the armor hall','armor-back');await go('↶ Turn around','armor');await go('↶ Turn around','armor-back');await go('Return to the frog fountain','fountain');get('map-button').click();assert(doc().querySelectorAll('#map circle').length===6,'Six discovered rooms');assert(doc().querySelectorAll('#map line:not(.unexplored)').length===6,'Six walked connections');get('map-close').click();note('Reverse loop, return views, accurate discovered map without initial spoilers');
  get('viewport').focus();doc().dispatchEvent(new (win().KeyboardEvent)('keydown',{key:'ArrowRight',bubbles:true}));assert(doc().activeElement.dataset.spot==='armor','Spatial keyboard focus');doc().activeElement.click();await view('armor');doc().dispatchEvent(new (win().KeyboardEvent)('keydown',{key:'Escape',bubbles:true}));await view('armor-back');await go('Return to the frog fountain','fountain');
  await press(15);await press(0);await view('armor');await press(1);await view('armor-back');await press(9);assert(get('map-dialog').open,'Controller opens map');await press(1);assert(!get('map-dialog').open,'Controller closes map');note('Keyboard spatial navigation and standard gamepad A/B/D-pad/Start adapter');
  await go('↶ Turn around','armor');const m=JSON.parse(window.testMemory[key]);m.seed=1;window.testMemory[key]=JSON.stringify(m);flags.clock=47000;await boot();await view('armor');await until(()=>get('echo').style.opacity==='1','raised visor');assert(!get('message').textContent,'No event announcement');flags.clock=94000;await until(()=>get('echo').style.opacity==='0','lowered visor');note('Unannounced timed visor changes in both directions');
  for(const [w,h] of [[390,844],[844,390],[320,568]]){frame.width=w;frame.height=h;await geometry();await go('Walk toward the bridge','bridge');await geometry();await go('Return to the armor hall','armor');}note('Portrait, landscape, and narrow-phone bounds, including edge controls');
  window.testMemory[key]=JSON.stringify({view:'constructor',visited:['constructor','fountain',4],paths:['bad']});await boot();await view('fountain');note('Malformed save values recover to the fountain');
  window.testMemory={};flags.failArmor=true;await boot();await view('fountain');button('Enter the red corridor').click();await until(()=>get('message').textContent.includes('could not be loaded'),'failed image');assert(get('viewport').dataset.view==='fountain','Failed image leaves old room');flags.failArmor=false;await go('Enter the red corridor','armor');note('Failed image preserves the scene; the same doorway successfully retries');
  flags.blocked=true;await boot();await view('fountain');await go('Follow the mushroom light','mushroom');note('Blocked browser storage does not prevent exploring');flags.blocked=false;
  assert(window.testErrors.length===0,'Runtime errors: '+window.testErrors.join('; '));note('No application runtime errors');result.textContent='PASS — all exploration checks';frame.width=390;frame.height=844;
 }catch(e){result.textContent='FAIL — '+e.message;log.textContent+='\n'+e.stack}finally{document.querySelector('#run').disabled=false}
};
