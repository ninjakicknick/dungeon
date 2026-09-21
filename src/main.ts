import "./style.css";

type Facing = 0 | 1 | 2 | 3;
type Tile = 0 | 1 | 2; // floor, wall, door

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const ctx = canvas.getContext("2d")!;
ctx.imageSmoothingEnabled = false;

const atlas = { floor:new Image(), wall:new Image(), door:new Image(), ceiling:new Image() };
atlas.floor.src=new URL("../assets/dungeon_floor.png",import.meta.url).href;
atlas.wall.src=new URL("../assets/dungeon_wall.png",import.meta.url).href;
atlas.door.src=new URL("../assets/dungeon_door.png",import.meta.url).href;
atlas.ceiling.src=new URL("../assets/dungeon_ceiling.png",import.meta.url).href;

const MAP: Tile[][] = [
 [1,1,1,1,1,1,1],
 [1,0,0,0,1,0,1],
 [1,0,1,0,1,0,1],
 [1,0,1,0,2,0,1],
 [1,0,1,0,1,0,1],
 [1,0,0,0,0,0,1],
 [1,1,1,1,1,1,1],
];
const player={x:1,y:5,facing:0 as Facing};

type DrawArea={sx:number;sy:number;sw:number;sh:number;dx:number;dy:number};
const DRAW:DrawArea[]=[
 {sx:0,sy:0,sw:80,sh:120,dx:0,dy:0},
 {sx:80,sy:0,sw:80,sh:120,dx:80,dy:0},
 {sx:160,sy:0,sw:80,sh:120,dx:0,dy:0},
 {sx:240,sy:0,sw:80,sh:120,dx:80,dy:0},
 {sx:320,sy:0,sw:160,sh:120,dx:0,dy:0},
 {sx:480,sy:0,sw:80,sh:120,dx:0,dy:0},
 {sx:560,sy:0,sw:80,sh:120,dx:80,dy:0},
 {sx:0,sy:120,sw:80,sh:120,dx:0,dy:0},
 {sx:80,sy:120,sw:80,sh:120,dx:80,dy:0},
 {sx:160,sy:120,sw:160,sh:120,dx:0,dy:0},
 {sx:320,sy:120,sw:80,sh:120,dx:0,dy:0},
 {sx:400,sy:120,sw:80,sh:120,dx:80,dy:0},
 {sx:480,sy:120,sw:160,sh:120,dx:0,dy:0},
];

const VIEW:Array<[number,number,number]>=[
 [2,-2,0],[2,2,1],[2,-1,2],[2,1,3],[2,0,4],
 [1,-2,5],[1,2,6],[1,-1,7],[1,1,8],[1,0,9],
 [0,-1,10],[0,1,11],[0,0,12],
];

function tileAt(x:number,y:number):Tile{return MAP[y]?.[x]??1}
function drawSheet(img:HTMLImageElement,p:number){const a=DRAW[p];ctx.drawImage(img,a.sx,a.sy,a.sw,a.sh,a.dx,a.dy,a.sw,a.sh)}
function worldOffset(forward:number,right:number):[number,number]{
 const dirs=[{fx:0,fy:-1,rx:1,ry:0},{fx:1,fy:0,rx:0,ry:1},{fx:0,fy:1,rx:-1,ry:0},{fx:-1,fy:0,rx:0,ry:-1}];
 const d=dirs[player.facing];
 return [player.x+d.fx*forward+d.rx*right,player.y+d.fy*forward+d.ry*right];
}
function render(){
 ctx.fillStyle="#000";ctx.fillRect(0,0,160,120);
 for(const [f,r,p] of VIEW){const [x,y]=worldOffset(f,r);if(tileAt(x,y)!==1){drawSheet(atlas.ceiling,p);drawSheet(atlas.floor,p)}}
 for(const [f,r,p] of VIEW){const [x,y]=worldOffset(f,r);const t=tileAt(x,y);if(t===1)drawSheet(atlas.wall,p);else if(t===2)drawSheet(atlas.door,p)}
}
function canStand(x:number,y:number){return tileAt(x,y)===0}
function step(amount:1|-1){const [x,y]=worldOffset(amount,0);if(canStand(x,y)){player.x=x;player.y=y}render()}
function turn(amount:1|-1){player.facing=((player.facing+amount+4)%4) as Facing;render()}
function act(action:string){if(action==="forward")step(1);if(action==="back")step(-1);if(action==="left")turn(-1);if(action==="right")turn(1)}
window.addEventListener("keydown",e=>{const actions:Record<string,string>={arrowup:"forward",w:"forward",arrowdown:"back",s:"back",arrowleft:"left",a:"left",arrowright:"right",d:"right"};const action=actions[e.key.toLowerCase()];if(action){e.preventDefault();act(action)}});
document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();act(b.dataset.action!)}));
Promise.all(Object.values(atlas).map(img=>img.decode().catch(()=>new Promise<void>(resolve=>img.addEventListener("load",()=>resolve(),{once:true}))))).then(render);
