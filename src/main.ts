import "./style.css";
type Facing=0|1|2|3; type Tile=0|1|2|3;
type Feature="chest"|"pillar"|"skulls"|"speaker";
const canvas=document.querySelector<HTMLCanvasElement>("#game")!,ctx=canvas.getContext("2d")!;
const mapCanvas=document.querySelector<HTMLCanvasElement>("#map")!,mapCtx=mapCanvas.getContext("2d")!;
const message=document.querySelector<HTMLElement>("#message")!,interact=document.querySelector<HTMLButtonElement>("#interact")!;
ctx.imageSmoothingEnabled=false;mapCtx.imageSmoothingEnabled=false;
const atlas={floor:new Image(),wall:new Image(),door:new Image(),locked:new Image(),ceiling:new Image(),chest:new Image(),pillar:new Image(),skulls:new Image(),speaker:new Image()};
for(const [k,file] of Object.entries({floor:"dungeon_floor.png",wall:"dungeon_wall.png",door:"dungeon_door.png",locked:"locked_door.png",ceiling:"dungeon_ceiling.png",chest:"chest_exterior.png",pillar:"pillar_interior.png",skulls:"skull_pile.png",speaker:"death_speaker.png"})) atlas[k as keyof typeof atlas].src=new URL(`../assets/${file}`,import.meta.url).href;

// 0 floor, 1 wall, 2 door, 3 locked door. A deliberately authored place, not a generated maze.
const MAP:Tile[][]=[
 [1,1,1,1,1,1,1,1,1,1,1,1],
 [1,0,0,0,1,0,0,0,0,0,0,1],
 [1,0,1,0,1,0,1,1,1,1,0,1],
 [1,0,1,0,2,0,0,0,0,1,0,1],
 [1,0,1,1,1,1,1,1,0,1,0,1],
 [1,0,0,0,0,0,0,1,0,0,0,1],
 [1,1,1,1,0,1,0,1,1,1,0,1],
 [1,0,0,0,0,1,0,0,0,1,0,1],
 [1,0,1,1,1,1,1,1,0,1,0,1],
 [1,0,0,0,0,0,0,3,0,0,0,1],
 [1,1,1,1,1,1,1,1,1,1,1,1],
];
const player={x:1,y:9,facing:0 as Facing},visited=new Set<string>(),used=new Set<string>();
const features=new Map<string,Feature>([["3,9","pillar"],["6,7","skulls"],["8,3","speaker"],["10,1","chest"]]);
const secret={x:7,y:9,revealed:false};
const DRAW=[{sx:0,sy:0,sw:80,sh:120,dx:0,dy:0},{sx:80,sy:0,sw:80,sh:120,dx:80,dy:0},{sx:160,sy:0,sw:80,sh:120,dx:0,dy:0},{sx:240,sy:0,sw:80,sh:120,dx:80,dy:0},{sx:320,sy:0,sw:160,sh:120,dx:0,dy:0},{sx:480,sy:0,sw:80,sh:120,dx:0,dy:0},{sx:560,sy:0,sw:80,sh:120,dx:80,dy:0},{sx:0,sy:120,sw:80,sh:120,dx:0,dy:0},{sx:80,sy:120,sw:80,sh:120,dx:80,dy:0},{sx:160,sy:120,sw:160,sh:120,dx:0,dy:0},{sx:320,sy:120,sw:80,sh:120,dx:0,dy:0},{sx:400,sy:120,sw:80,sh:120,dx:80,dy:0},{sx:480,sy:120,sw:160,sh:120,dx:0,dy:0}];
const VIEW:Array<[number,number,number]>=[[2,-2,0],[2,2,1],[2,-1,2],[2,1,3],[2,0,4],[1,-2,5],[1,2,6],[1,-1,7],[1,1,8],[1,0,9],[0,-1,10],[0,1,11],[0,0,12]];
const dirs=[{fx:0,fy:-1,rx:1,ry:0},{fx:1,fy:0,rx:0,ry:1},{fx:0,fy:1,rx:-1,ry:0},{fx:-1,fy:0,rx:0,ry:-1}];
const key=(x:number,y:number)=>`${x},${y}`,tileAt=(x:number,y:number):Tile=>MAP[y]?.[x]??1;
function worldOffset(f:number,r:number):[number,number]{const d=dirs[player.facing];return[player.x+d.fx*f+d.rx*r,player.y+d.fy*f+d.ry*r]}
function drawSheet(img:HTMLImageElement,p:number){const a=DRAW[p];ctx.drawImage(img,a.sx,a.sy,a.sw,a.sh,a.dx,a.dy,a.sw,a.sh)}
function reveal(){visited.add(key(player.x,player.y));for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]])visited.add(key(player.x+dx,player.y+dy))}
function renderMap(){const s=5;mapCtx.clearRect(0,0,60,55);for(let y=0;y<11;y++)for(let x=0;x<12;x++){if(!visited.has(key(x,y)))continue;const t=tileAt(x,y);mapCtx.fillStyle=t===1?"#251b17":t===2?"#8f563b":t===3?"#5e342c":"#b86f43";mapCtx.fillRect(x*s,y*s,s-1,s-1)}mapCtx.fillStyle="#f6d6a8";mapCtx.fillRect(player.x*s+1,player.y*s+1,3,3)}
function currentFeature(){return features.get(key(player.x,player.y))}
function updateInteract(){const f=currentFeature(),atSecret=player.x===8&&player.y===9&&!secret.revealed&&player.facing===3;interact.hidden=!f&&!atSecret;interact.textContent=f==="chest"?"OPEN":f?"EXAMINE":atSecret?"EXAMINE":""}
function render(){reveal();ctx.fillStyle="#000";ctx.fillRect(0,0,160,120);for(const[f,r,p]of VIEW){const[x,y]=worldOffset(f,r);if(tileAt(x,y)!==1){drawSheet(atlas.ceiling,p);drawSheet(atlas.floor,p)}}for(const[f,r,p]of VIEW){const[x,y]=worldOffset(f,r),t=tileAt(x,y);if(t===1)drawSheet(atlas.wall,p);else if(t===2)drawSheet(atlas.door,p);else if(t===3)drawSheet(atlas.locked,p);else{const ft=features.get(key(x,y));if(ft&&!used.has(key(x,y)))drawSheet(atlas[ft],p)}}renderMap();updateInteract()}
function say(t:string){message.textContent=t}
function step(a:1|-1){const[x,y]=worldOffset(a,0),t=tileAt(x,y);if(t===2&&a===1){MAP[y][x]=0;say("The old door yields with a groan.");render();return}if(t===3){say("No handle. No lock. Just a slab fitted too neatly into the wall.");render();return}if(t===1){say("Cold stone blocks the way.");render();return}player.x=x;player.y=y;const f=currentFeature();say(f==="pillar"?"A carved pillar interrupts the passage.":f==="skulls"?"Someone arranged these bones deliberately.":f==="speaker"?"A stone face watches from the dark.":f==="chest"?"A battered chest waits against the wall.":"Your footsteps echo in the dark.");render()}
function turn(a:1|-1){player.facing=((player.facing+a+4)%4)as Facing;say("You turn, listening.");render()}
function use(){const k=key(player.x,player.y),f=currentFeature();if(player.x===8&&player.y===9&&!secret.revealed&&player.facing===3){secret.revealed=true;MAP[9][7]=0;say("One stone is warmer than the others. It sinks beneath your palm. Somewhere inside the wall: click.");render();return}if(!f)return;if(f==="pillar")say("Names have been cut into the pillar. Every one has been scratched out.");if(f==="skulls")say("Six skulls. Five face the corridor. One faces the wall.");if(f==="speaker")say("The stone mouth whispers: “The dead remember the way that stone forgets.”");if(f==="chest"){used.add(k);say("Inside: a tarnished silver key and three old coins. You take them.");}render()}
function act(a:string){if(a==="forward")step(1);if(a==="back")step(-1);if(a==="left")turn(-1);if(a==="right")turn(1);if(a==="interact")use()}
window.addEventListener("keydown",e=>{const actions:Record<string,string>={arrowup:"forward",w:"forward",arrowdown:"back",s:"back",arrowleft:"left",a:"left",arrowright:"right",d:"right",e:"interact"," ":"interact"};const action=actions[e.key.toLowerCase()];if(action){e.preventDefault();act(action)}});
document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();act(b.dataset.action!)}));
Promise.all(Object.values(atlas).map(img=>img.decode().catch(()=>new Promise<void>(r=>img.addEventListener("load",()=>r(),{once:true}))))).then(()=>{say("The stair closes behind you. The air smells of wet stone.");render()});
