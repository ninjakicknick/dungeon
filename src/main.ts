import "./style.css";

type Facing = 0 | 1 | 2 | 3;
type Tile = 0 | 1 | 2; // floor, wall, closed door

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const ctx = canvas.getContext("2d")!;
const mapCanvas = document.querySelector<HTMLCanvasElement>("#map")!;
const mapCtx = mapCanvas.getContext("2d")!;
const message = document.querySelector<HTMLElement>("#message")!;
ctx.imageSmoothingEnabled = false;
mapCtx.imageSmoothingEnabled = false;

const atlas = { floor:new Image(), wall:new Image(), door:new Image(), ceiling:new Image(), chest:new Image() };
atlas.floor.src=new URL("../assets/dungeon_floor.png",import.meta.url).href;
atlas.wall.src=new URL("../assets/dungeon_wall.png",import.meta.url).href;
atlas.door.src=new URL("../assets/dungeon_door.png",import.meta.url).href;
atlas.ceiling.src=new URL("../assets/dungeon_ceiling.png",import.meta.url).href;
atlas.chest.src=new URL("../assets/chest_exterior.png",import.meta.url).href;

// Hand-authored first floor. The map is game data; the renderer only interprets it.
const MAP: Tile[][] = [
 [1,1,1,1,1,1,1,1],
 [1,0,0,0,1,0,0,1],
 [1,0,1,0,1,0,1,1],
 [1,0,1,0,2,0,0,1],
 [1,0,1,1,1,1,0,1],
 [1,0,0,0,0,1,0,1],
 [1,1,1,1,0,0,0,1],
 [1,1,1,1,1,1,1,1],
];
const player={x:1,y:6,facing:0 as Facing};
const visited=new Set<string>();
const chest={x:6,y:1,found:false};

type DrawArea={sx:number;sy:number;sw:number;sh:number;dx:number;dy:number};
const DRAW:DrawArea[]=[
 {sx:0,sy:0,sw:80,sh:120,dx:0,dy:0},{sx:80,sy:0,sw:80,sh:120,dx:80,dy:0},
 {sx:160,sy:0,sw:80,sh:120,dx:0,dy:0},{sx:240,sy:0,sw:80,sh:120,dx:80,dy:0},
 {sx:320,sy:0,sw:160,sh:120,dx:0,dy:0},{sx:480,sy:0,sw:80,sh:120,dx:0,dy:0},
 {sx:560,sy:0,sw:80,sh:120,dx:80,dy:0},{sx:0,sy:120,sw:80,sh:120,dx:0,dy:0},
 {sx:80,sy:120,sw:80,sh:120,dx:80,dy:0},{sx:160,sy:120,sw:160,sh:120,dx:0,dy:0},
 {sx:320,sy:120,sw:80,sh:120,dx:0,dy:0},{sx:400,sy:120,sw:80,sh:120,dx:80,dy:0},
 {sx:480,sy:120,sw:160,sh:120,dx:0,dy:0},
];
const VIEW:Array<[number,number,number]>=[
 [2,-2,0],[2,2,1],[2,-1,2],[2,1,3],[2,0,4],
 [1,-2,5],[1,2,6],[1,-1,7],[1,1,8],[1,0,9],
 [0,-1,10],[0,1,11],[0,0,12],
];
const dirs=[{fx:0,fy:-1,rx:1,ry:0},{fx:1,fy:0,rx:0,ry:1},{fx:0,fy:1,rx:-1,ry:0},{fx:-1,fy:0,rx:0,ry:-1}];

function key(x:number,y:number){return `${x},${y}`}
function tileAt(x:number,y:number):Tile{return MAP[y]?.[x]??1}
function drawSheet(img:HTMLImageElement,p:number){const a=DRAW[p];ctx.drawImage(img,a.sx,a.sy,a.sw,a.sh,a.dx,a.dy,a.sw,a.sh)}
function worldOffset(forward:number,right:number):[number,number]{
 const d=dirs[player.facing];
 return [player.x+d.fx*forward+d.rx*right,player.y+d.fy*forward+d.ry*right];
}
function reveal(){visited.add(key(player.x,player.y));for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]])visited.add(key(player.x+dx,player.y+dy))}
function renderMap(){
 const s=8;mapCtx.clearRect(0,0,64,64);
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  if(!visited.has(key(x,y)))continue;
  const t=tileAt(x,y);mapCtx.fillStyle=t===1?"#251b17":t===2?"#8f563b":"#b86f43";mapCtx.fillRect(x*s,y*s,s-1,s-1);
 }
 mapCtx.fillStyle="#f6d6a8";mapCtx.fillRect(player.x*s+2,player.y*s+2,3,3);
 const d=dirs[player.facing];mapCtx.fillRect(player.x*s+3+d.fx*3,player.y*s+3+d.fy*3,1,1);
}
function render(){
 reveal();ctx.fillStyle="#000";ctx.fillRect(0,0,160,120);
 for(const [f,r,p] of VIEW){const [x,y]=worldOffset(f,r);if(tileAt(x,y)!==1){drawSheet(atlas.ceiling,p);drawSheet(atlas.floor,p)}}
 for(const [f,r,p] of VIEW){
  const [x,y]=worldOffset(f,r);const t=tileAt(x,y);
  if(t===1)drawSheet(atlas.wall,p);else if(t===2)drawSheet(atlas.door,p);
  else if(x===chest.x&&y===chest.y&&!chest.found)drawSheet(atlas.chest,p);
 }
 renderMap();
}
function say(text:string){message.textContent=text}
function step(amount:1|-1){
 const [x,y]=worldOffset(amount,0);const t=tileAt(x,y);
 if(t===2&&amount===1){MAP[y][x]=0;say("The old door yields with a groan.");render();return}
 if(t===1){say("Cold stone blocks the way.");render();return}
 player.x=x;player.y=y;
 if(player.x===chest.x&&player.y===chest.y&&!chest.found){chest.found=true;say("A battered chest. Whatever is inside, you found it.");}
 else say("Your footsteps echo in the dark.");
 render();
}
function turn(amount:1|-1){player.facing=((player.facing+amount+4)%4) as Facing;say("You turn, listening.");render()}
function act(action:string){if(action==="forward")step(1);if(action==="back")step(-1);if(action==="left")turn(-1);if(action==="right")turn(1)}
window.addEventListener("keydown",e=>{const actions:Record<string,string>={arrowup:"forward",w:"forward",arrowdown:"back",s:"back",arrowleft:"left",a:"left",arrowright:"right",d:"right"};const action=actions[e.key.toLowerCase()];if(action){e.preventDefault();act(action)}});
document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();act(b.dataset.action!)}));
Promise.all(Object.values(atlas).map(img=>img.decode().catch(()=>new Promise<void>(resolve=>img.addEventListener("load",()=>resolve(),{once:true}))))).then(()=>{say("You descend. Somewhere ahead, something waits.");render()});
