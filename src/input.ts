type Bindings={viewport:HTMLElement;spots:HTMLElement;map:HTMLDialogElement;busy:()=>boolean;back:()=>void;mapToggle:()=>void;hints:()=>void;sound:()=>void;wake:()=>void};
type Direction='up'|'down'|'left'|'right';
export function installInput(b:Bindings){
 let selected:HTMLButtonElement|null=null;
 const buttons=()=>Array.from((b.map.open?b.map:b.spots).querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
 const clear=()=>{document.querySelectorAll('.selected').forEach(el=>el.classList.remove('selected'));selected=null};
 function choose(direction:Direction){
  if(b.busy())return;
  const list=buttons();if(!list.length)return;
  const active=document.activeElement instanceof HTMLButtonElement&&list.includes(document.activeElement)?document.activeElement:selected&&list.includes(selected)?selected:null;
  let next=list[0];
  if(active){const a=active.getBoundingClientRect(),ax=a.x+a.width/2,ay=a.y+a.height/2;
   const scored=list.filter(el=>el!==active).map(el=>{const r=el.getBoundingClientRect(),dx=r.x+r.width/2-ax,dy=r.y+r.height/2-ay;const forward=direction==='right'?dx:direction==='left'?-dx:direction==='down'?dy:-dy,cross=direction==='right'||direction==='left'?Math.abs(dy):Math.abs(dx);return{el,forward,score:forward+cross*2}}).filter(s=>s.forward>2).sort((a,c)=>a.score-c.score);
   next=scored[0]?.el||active;
  }
  clear();selected=next;next.classList.add('selected');next.focus({preventScroll:true});
 }
 function act(){if(b.busy())return;const list=buttons();const target=list.includes(document.activeElement as HTMLButtonElement)?document.activeElement as HTMLButtonElement:selected&&list.includes(selected)?selected:list[0];if(target){b.wake();target.click()}}
 const directions:Record<string,Direction>={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
 document.addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey||e.target instanceof HTMLInputElement)return;
  const k=e.key.length===1?e.key.toLowerCase():e.key;
  if(directions[k]){e.preventDefault();choose(directions[k]);return}
  if(k==='Escape'||k==='Backspace'){e.preventDefault();b.back();return}
  if(k==='m'){e.preventDefault();b.mapToggle();return}
  if(b.map.open)return;
  if(k==='h'){e.preventDefault();b.hints()}
  if(k==='q'){e.preventDefault();b.sound()}
  if((k==='Enter'||k===' ')&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();act()}
 });
 b.viewport.addEventListener('pointerdown',clear);
 new MutationObserver(clear).observe(b.spots,{childList:true});
 let previous:boolean[]=[],held='',repeatAt=0;
 function poll(t:number){
  requestAnimationFrame(poll);if(document.hidden){previous=[];held='';return}
  let pad:Gamepad|undefined;try{pad=Array.from(navigator.getGamepads?.()||[]).find((p):p is Gamepad=>!!p&&p.connected)}catch{return}if(!pad){previous=[];held='';return}
  const down=pad.buttons.map(x=>x.pressed),edge=(n:number)=>down[n]&&!previous[n];
  const x=pad.axes[0]||0,y=pad.axes[1]||0;
  const direction:Direction|''=down[12]?'up':down[13]?'down':down[14]?'left':down[15]?'right':Math.abs(x)>.55?(x>0?'right':'left'):Math.abs(y)>.55?(y>0?'down':'up'):'';
  if(direction&&(direction!==held||t>repeatAt)){choose(direction);repeatAt=t+(direction!==held?420:220)}held=direction;
  if(edge(1))b.back();else if(edge(0))act();
  if(edge(9))b.mapToggle();if(edge(3)&&!b.map.open)b.hints();if(edge(8)&&!b.map.open)b.sound();
  previous=down;
 }
 requestAnimationFrame(poll);
}
