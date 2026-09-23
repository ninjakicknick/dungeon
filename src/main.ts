import "./style.css";

type Slot="rear"|"left"|"right";
type Content="empty"|"encounter"|"treasure"|"feature";
type Exit={to?:number};
type Room={id:number;exits:Partial<Record<Slot,Exit>>;content:Content;resolved:boolean;parent?:number};

const slots:Slot[]=["rear","left","right"];
const opposite:Record<Slot,Slot>={rear:"rear",left:"right",right:"left"};
const rooms=new Map<number,Room>();
let current=1,nextId=2;

const scene=document.querySelector<HTMLElement>(".scene")!;
const message=document.querySelector<HTMLElement>("#message")!;
const roomLabel=document.querySelector<HTMLElement>("#room-label")!;
const mapDialog=document.querySelector<HTMLDialogElement>("#map-dialog")!;
const mapEl=document.querySelector<HTMLElement>("#map")!;
const feature=document.querySelector<HTMLElement>("#room-feature")!;

function rollContent():Content{
  const r=Math.random();
  return r<.36?"empty":r<.61?"encounter":r<.79?"treasure":"feature";
}
function newRoom(id:number,parent?:number,entry?:Slot):Room{
  const exits:Partial<Record<Slot,Exit>>={};
  if(entry) exits[entry]={to:parent};
  const candidates=slots.filter(s=>s!==entry).sort(()=>Math.random()-.5);
  const extra=parent?1+Math.floor(Math.random()*Math.min(2,candidates.length)):2;
  candidates.slice(0,extra).forEach(s=>exits[s]={});
  return {id,parent,exits,content:rollContent(),resolved:false};
}
rooms.set(1,newRoom(1));

function contentText(room:Room){
  if(room.resolved){
    if(room.content==="encounter") return "The chamber is quiet now. Choose an exit.";
    if(room.content==="treasure") return "The old cache has been searched. Choose an exit.";
    if(room.content==="feature") return "You finish examining the strange markings. Choose an exit.";
  }
  if(room.content==="encounter") return "Something moves in the darkness. Tap the message to face it.";
  if(room.content==="treasure") return "An old cache rests against the wall. Tap the message to search it.";
  if(room.content==="feature") return "Faded markings cover the stone. Tap the message to investigate.";
  return "The chamber appears empty. Choose an exit.";
}
function render(){
  const room=rooms.get(current)!;
  roomLabel.textContent=`ROOM ${room.id}`;
  slots.forEach(s=>{
    const el=document.querySelector<HTMLButtonElement>(`[data-exit="${s}"]`)!;
    el.hidden=!room.exits[s];
    el.disabled=!room.resolved&&room.content==="encounter";
  });
  feature.dataset.kind=room.resolved?"":room.content;
  feature.setAttribute("aria-hidden",String(room.content==="empty"||room.resolved));
  message.textContent=contentText(room);
}
message.addEventListener("click",()=>{
  const room=rooms.get(current)!;
  if(room.resolved||room.content==="empty")return;
  room.resolved=true;
  if(room.content==="encounter") message.textContent="The shapes scatter after a brief clash. The way is clear.";
  if(room.content==="treasure") message.textContent="Inside: a handful of old coins. The cache is empty now.";
  if(room.content==="feature") message.textContent="The markings describe travelers who passed this way long ago.";
  setTimeout(render,900);
});
for(const slot of slots){
  document.querySelector<HTMLButtonElement>(`[data-exit="${slot}"]`)!.addEventListener("click",async()=>{
    const room=rooms.get(current)!; const exit=room.exits[slot]; if(!exit||scene.classList.contains("transitioning"))return;
    if(!room.resolved&&room.content==="encounter")return;
    scene.classList.add("transitioning");
    await new Promise(r=>setTimeout(r,420));
    if(exit.to){current=exit.to;}
    else{
      const id=nextId++; exit.to=id;
      const entry=opposite[slot];
      rooms.set(id,newRoom(id,room.id,entry));
      current=id;
    }
    scene.classList.remove("transitioning"); render();
  });
}
function drawMap(){
  const ids=[...rooms.keys()].sort((a,b)=>a-b);
  mapEl.innerHTML=ids.map(id=>{
    const r=rooms.get(id)!;
    const links=slots.map(s=>r.exits[s]?.to?`R${r.exits[s]!.to}`:"?").filter((v,i)=>r.exits[slots[i]]).join(" · ");
    return `<div class="map-room ${id===current?"current":""}"><b>${id===current?"●":"○"} ROOM ${id}</b><span>${links||"—"}</span></div>`;
  }).join("");
}
document.querySelector("#map-button")!.addEventListener("click",()=>{drawMap();mapDialog.showModal()});
document.querySelector("#map-close")!.addEventListener("click",()=>mapDialog.close());
render();