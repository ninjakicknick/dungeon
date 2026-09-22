import "./style.css";
type Facing=0|1|2|3; type Tile=0|1|2|3;
type Feature="chest"|"pillar"|"skulls"|"speaker";
const canvas=document.querySelector<HTMLCanvasElement>("#game")!,ctx=canvas.getContext("2d")!;
const mapCanvas=document.querySelector<HTMLCanvasElement>("#map")!,mapCtx=mapCanvas.getContext("2d")!;
const encounter=document.querySelector<HTMLElement>("#encounter")!,roll=document.querySelector<HTMLElement>("#roll")!,wardenHp=document.querySelector<HTMLElement>("#warden-hp")!,battleSpace=document.querySelector<HTMLElement>("#battle-space")!,message=document.querySelector<HTMLElement>("#message")!,interact=document.querySelector<HTMLButtonElement>("#interact")!,keyStatus=document.querySelector<HTMLElement>("#key-status")!,wizardActions=document.querySelector<HTMLElement>("#wizard-actions")!,elaraSpells=document.querySelector<HTMLElement>("#elara-spells")!;
ctx.imageSmoothingEnabled=false;mapCtx.imageSmoothingEnabled=false;
const atlas={floor:new Image(),wall:new Image(),door:new Image(),locked:new Image(),ceiling:new Image(),chest:new Image(),pillar:new Image(),skulls:new Image(),speaker:new Image(),skeleton:new Image(),minimap:new Image(),cursor:new Image()};
for(const [k,file] of Object.entries({floor:"dungeon_floor.png",wall:"dungeon_wall.png",door:"dungeon_door.png",locked:"locked_door.png",ceiling:"dungeon_ceiling.png",chest:"chest_exterior.png",pillar:"pillar_interior.png",skulls:"skull_pile.png",speaker:"death_speaker.png",skeleton:"skeleton.png",minimap:"minimap.png",cursor:"minimap_cursor.png"})) atlas[k as keyof typeof atlas].src=new URL(`../assets/${file}`,import.meta.url).href;

// 0 floor, 1 wall, 2 door, 3 locked door. A deliberately authored place, not a generated maze.
const MAP:Tile[][]=[
 [1,1,1,1,1,1,1,1,1,1,1,1],
 [1,0,0,0,1,0,0,0,0,0,0,1],
 [1,0,0,0,1,0,0,0,0,0,0,1],
 [1,0,0,0,2,0,0,0,0,0,0,1],
 [1,1,0,1,1,0,0,0,0,1,0,1],
 [1,0,0,0,0,0,1,1,1,1,0,1],
 [1,0,0,0,0,0,1,0,0,0,0,1],
 [1,0,0,0,0,0,1,0,0,0,0,1],
 [1,1,0,1,1,1,1,0,0,0,0,1],
 [1,0,0,0,0,0,0,3,0,0,0,1],
 [1,1,1,1,1,1,1,1,1,1,1,1],
];
type HeroClass="warrior"|"cleric"|"rogue"|"wizard";
type Hero={id:string,name:string,className:HeroClass,level:number,life:number,maxLife:number,equipment:string[],resources:Record<string,number>};
const party:Hero[]=[
 {id:"bram",name:"Bram",className:"warrior",level:1,life:7,maxLife:7,equipment:["light armor","shield","hand weapon"],resources:{}},
 {id:"mara",name:"Mara",className:"cleric",level:1,life:5,maxLife:5,equipment:["light armor","shield","hand weapon"],resources:{healing:3,blessing:3}},
 {id:"nix",name:"Nix",className:"rogue",level:1,life:4,maxLife:4,equipment:["light armor","light weapon","rope","lock-picks"],resources:{}},
 {id:"elara",name:"Elara",className:"wizard",level:1,life:3,maxLife:3,equipment:["light weapon","spellbook","writing implements"],resources:{spellSlots:3,lightning:1,fireball:1,protection:1}}
];
const marchingOrder=[0,1,2,3];
const player={x:1,y:9,facing:0 as Facing},visited=new Set<string>(),used=new Set<string>();let hasSilverKey=false,busy=false,hitFlash=0,inEncounter=false,protectedHero:number|null=null;const acted=new Set<number>();const warden={x:5,y:9,hp:3,awake:false,dead:false};
const features=new Map<string,Feature>([["2,2","pillar"],["3,6","skulls"],["7,3","speaker"],["10,7","chest"]]);
const secret={x:7,y:9,revealed:false};
const DRAW=[{sx:0,sy:0,sw:80,sh:120,dx:0,dy:0},{sx:80,sy:0,sw:80,sh:120,dx:80,dy:0},{sx:160,sy:0,sw:80,sh:120,dx:0,dy:0},{sx:240,sy:0,sw:80,sh:120,dx:80,dy:0},{sx:320,sy:0,sw:160,sh:120,dx:0,dy:0},{sx:480,sy:0,sw:80,sh:120,dx:0,dy:0},{sx:560,sy:0,sw:80,sh:120,dx:80,dy:0},{sx:0,sy:120,sw:80,sh:120,dx:0,dy:0},{sx:80,sy:120,sw:80,sh:120,dx:80,dy:0},{sx:160,sy:120,sw:160,sh:120,dx:0,dy:0},{sx:320,sy:120,sw:80,sh:120,dx:0,dy:0},{sx:400,sy:120,sw:80,sh:120,dx:80,dy:0},{sx:480,sy:120,sw:160,sh:120,dx:0,dy:0}];
const VIEW:Array<[number,number,number]>=[[2,-2,0],[2,2,1],[2,-1,2],[2,1,3],[2,0,4],[1,-2,5],[1,2,6],[1,-1,7],[1,1,8],[1,0,9],[0,-1,10],[0,1,11],[0,0,12]];
const dirs=[{fx:0,fy:-1,rx:1,ry:0},{fx:1,fy:0,rx:0,ry:1},{fx:0,fy:1,rx:-1,ry:0},{fx:-1,fy:0,rx:0,ry:-1}];
const key=(x:number,y:number)=>`${x},${y}`,tileAt=(x:number,y:number):Tile=>MAP[y]?.[x]??1;
function worldOffset(f:number,r:number):[number,number]{const d=dirs[player.facing];return[player.x+d.fx*f+d.rx*r,player.y+d.fy*f+d.ry*r]}
function drawSheet(img:HTMLImageElement,p:number){const a=DRAW[p];ctx.drawImage(img,a.sx,a.sy,a.sw,a.sh,a.dx,a.dy,a.sw,a.sh)}
function drawBillboard(img:HTMLImageElement,f:number,r:number,src?:{x:number,y:number,w:number,h:number}){if(f<1||f>2||Math.abs(r)>1)return;const w=f===1?90:42,h=f===1?88:41,x=80+r*(f===1?42:25)-w/2,floorY=f===1?112:88,y=floorY-h;if(src)ctx.drawImage(img,src.x,src.y,src.w,src.h,Math.round(x),Math.round(y),w,h);else ctx.drawImage(img,Math.round(x),Math.round(y),w,h)}
function reveal(){visited.add(key(player.x,player.y));for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]])visited.add(key(player.x+dx,player.y+dy))}
function renderMap(){const s=5;mapCtx.fillStyle="#08060a";mapCtx.fillRect(0,0,60,55);for(let y=0;y<11;y++)for(let x=0;x<12;x++){if(!visited.has(key(x,y)))continue;const t=tileAt(x,y);mapCtx.fillStyle=t===1?"#251b17":t===2?"#8f563b":t===3?"#5e342c":"#b86f43";mapCtx.fillRect(x*s,y*s,s-1,s-1)}mapCtx.fillStyle="#d7e7cf";mapCtx.fillRect(player.x*s+1,player.y*s+1,3,3)}
function featureAt(x:number,y:number){return features.get(key(x,y))}
function targetFeature(){const[x,y]=worldOffset(1,0);return {x,y,feature:featureAt(x,y)}}
function monsterAt(x:number,y:number){return warden.awake&&!warden.dead&&warden.x===x&&warden.y===y}
function targetMonster(){const[x,y]=worldOffset(1,0);return monsterAt(x,y)}
function drawMonster(){if(!warden.awake||warden.dead)return;const d=dirs[player.facing],dx=warden.x-player.x,dy=warden.y-player.y,f=dx*d.fx+dy*d.fy,r=dx*d.rx+dy*d.ry;if(f<1||f>2||Math.abs(r)>1)return;const blocked=f===2&&tileAt(...worldOffset(1,r))!==0;if(blocked)return;drawBillboard(atlas.skeleton,f,r,{x:52,y:34,w:82,h:80})}
function updateInteract(){const target=targetFeature(),[tx,ty]=worldOffset(1,0),atMonster=targetMonster(),atLocked=tileAt(tx,ty)===3,atSecret=player.x===8&&player.y===9&&!secret.revealed&&player.facing===3,available=!!target.feature||atSecret||atLocked||atMonster;interact.hidden=false;interact.style.visibility=available?"visible":"hidden";interact.style.pointerEvents=available?"auto":"none";interact.textContent=atMonster?"ATTACK":target.feature==="chest"?"OPEN":target.feature?"EXAMINE":atLocked?(hasSilverKey?"UNLOCK":"EXAMINE"):atSecret?"EXAMINE":""}
function renderParty(){elaraSpells.textContent=String(party[3].resources.spellSlots);for(const hero of party){const el=document.querySelector<HTMLElement>(`#life-${hero.id}`);if(el)el.textContent=`♥ ${hero.life}/${hero.maxLife}`}}
function render(){reveal();keyStatus.hidden=!hasSilverKey;renderParty();ctx.fillStyle=hitFlash?"#f6d6a8":"#000";ctx.fillRect(0,0,160,120);for(const[f,r,p]of VIEW){const[x,y]=worldOffset(f,r);if(tileAt(x,y)!==1){drawSheet(atlas.ceiling,p);drawSheet(atlas.floor,p)}}for(const[f,r,p]of VIEW){const[x,y]=worldOffset(f,r),t=tileAt(x,y);if(t===1)drawSheet(atlas.wall,p);else if(t===2)drawSheet(atlas.door,p);else if(t===3)drawSheet(atlas.locked,p);else{const ft=features.get(key(x,y));if(ft&&!used.has(key(x,y))){if(ft==="speaker")drawBillboard(atlas.speaker,f,r);else drawSheet(atlas[ft],p);}}}drawMonster();renderMap();updateInteract()}
function say(t:string){message.textContent=t}
function wait(ms:number){return new Promise<void>(r=>setTimeout(r,ms))}
function d6(){let total=0,die=0;do{die=1+Math.floor(Math.random()*6);total+=die}while(die===6);return total}
function isRoom(x=player.x,y=player.y){let exits=0;for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]])if(tileAt(x+dx,y+dy)===0)exits++;return exits>=3}
function heroCanAct(i:number){if(isRoom())return true;const pos=marchingOrder.indexOf(i);return pos<2||party[i].className==="wizard"}
function heroAttackBonus(hero:Hero){if(hero.className==="warrior")return hero.level;if(hero.className==="cleric")return hero.level;/* undead */if(hero.className==="rogue")return hero.level-1;/* outnumbers this lone Minor-style foe; light weapon -1 */return -1}
function showWizardActions(){wizardActions.hidden=false;document.querySelectorAll<HTMLElement>(".party-actions").forEach(el=>el.hidden=true);for(const name of ["lightning","fireball","protection"]){const b=document.querySelector<HTMLButtonElement>(`[data-spell="${name}"]`);if(b)b.disabled=(party[3].resources[name]??0)<=0}}
function hideWizardActions(){wizardActions.hidden=true;document.querySelectorAll<HTMLElement>(".party-actions").forEach(el=>el.hidden=false)}
function heroButtons(){document.querySelectorAll<HTMLButtonElement>("[data-spell]").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();void castSpell(b.dataset.spell!)}));
document.querySelectorAll<HTMLButtonElement>("[data-hero]").forEach((b,i)=>{b.disabled=acted.has(i)||party[i].life<=0||!heroCanAct(i);b.title=!heroCanAct(i)?"Rear rank: melee cannot reach in a corridor":""})}
function showEncounter(){
 inEncounter=true;acted.clear();protectedHero=null;hideWizardActions();document.body.classList.add("in-encounter");encounter.hidden=false;wardenHp.textContent="◆ ".repeat(warden.hp).trim();battleSpace.textContent=isRoom()?"ROOM":"CORRIDOR";roll.textContent=isRoom()?"Your turn · all heroes can fight":"Your turn · front rank fights; Elara can cast from the rear";say("The skeleton raises its rusted blade.");heroButtons()
}
function hideEncounter(){inEncounter=false;protectedHero=null;hideWizardActions();document.body.classList.remove("in-encounter");encounter.hidden=true;acted.clear()}
async function foeTurn(){
 busy=true;await wait(260);
 const livingFront=marchingOrder.slice(0,2).filter(i=>party[i].life>0);if(!livingFront.length){hideEncounter();say("The front rank falls. The party is driven back.");party.forEach(h=>h.life=h.maxLife);player.x=1;player.y=9;player.facing=0;warden.hp=3;render();busy=false;return}
 const targetIndex=livingFront[Math.floor(Math.random()*livingFront.length)],hero=party[targetIndex],armor=hero.className==="warrior"||hero.className==="cleric"?2:hero.className==="rogue"?2:0;
 const protection=protectedHero===targetIndex?1:0,raw=d6(),total=raw+armor+protection,defended=raw!==1&&total>3;
 if(!defended)hero.life--;roll.textContent=`${hero.name.toUpperCase()} DEFENDS: ${raw} +${armor+protection} = ${total} · ${defended?"SAFE":"HIT"}`;
 hitFlash=defended?0:1;render();await wait(120);hitFlash=0;
 if(hero.life<=0)roll.textContent+=` · ${hero.name.toUpperCase()} FALLS`;
 acted.clear();heroButtons();render();busy=false
}
async function heroAttack(i:number){
 if(busy||!inEncounter||acted.has(i)||party[i].life<=0||!heroCanAct(i))return;
 if(i===3){showWizardActions();return}
 const hero=party[i],raw=d6(),bonus=heroAttackBonus(hero),total=raw+bonus,foeLevel=3;
 const damage=total>=foeLevel?Math.max(1,Math.floor(total/foeLevel)):0;
 acted.add(i);if(damage)warden.hp=Math.max(0,warden.hp-damage);
 roll.textContent=`${hero.name.toUpperCase()} ATTACKS: ${raw} ${bonus>=0?"+":""}${bonus} = ${total} · ${damage?damage+" DAMAGE":"MISS"}`;
 wardenHp.textContent="◆ ".repeat(warden.hp).trim();heroButtons();
 if(warden.hp<=0){warden.dead=true;hideEncounter();say("The skeleton collapses in a clatter of bone and rusted steel.");render();return}
 const eligible=party.map((h,i)=>h.life>0&&heroCanAct(i)?i:-1).filter(i=>i>=0);if(eligible.every(i=>acted.has(i)))await foeTurn()
}
async function castSpell(name:string){
 if(busy||!inEncounter)return;if(name==="cancel"){hideWizardActions();return}
 const wizard=party[3];if(acted.has(3)||(wizard.resources[name]??0)<=0)return;
 wizard.resources[name]--;wizard.resources.spellSlots--;acted.add(3);hideWizardActions();
 const raw=d6(),total=raw+wizard.level,foeLevel=3;
 if(name==="lightning"){const hit=total>=foeLevel;if(hit)warden.hp=Math.max(0,warden.hp-2);roll.textContent=`ELARA LIGHTNING: ${raw} +1 = ${total} · ${hit?"2 DAMAGE":"MISS"}`}
 if(name==="fireball"){warden.hp=Math.max(0,warden.hp-1);roll.textContent=`ELARA FIREBALL: ${raw} +1 = ${total} · 1 DAMAGE`}
 if(name==="protection"){protectedHero=marchingOrder[0];roll.textContent=`ELARA PROTECTS ${party[protectedHero].name.toUpperCase()} · +1 DEFENSE`}
 wardenHp.textContent="◆ ".repeat(warden.hp).trim();heroButtons();render();
 if(warden.hp<=0){warden.dead=true;hideEncounter();say("Magic tears through the skeleton. Its bones scatter across the floor.");render();return}
 const eligible=party.map((h,i)=>h.life>0&&heroCanAct(i)?i:-1).filter(i=>i>=0);if(eligible.every(i=>acted.has(i)))await foeTurn()
}
function step(a:1|-1){const[x,y]=worldOffset(a,0),t=tileAt(x,y),f=featureAt(x,y);if(monsterAt(x,y)){showEncounter();render();return}if(t===2&&a===1){MAP[y][x]=0;say("The old door yields with a groan.");render();return}if(t===3){say("No handle. No lock. Just a slab fitted too neatly into the wall.");render();return}if(t===1){say("Cold stone blocks the way.");render();return}if(f){say(f==="pillar"?"The carved pillar blocks the passage.":f==="skulls"?"A deliberate pile of bones blocks your step.":f==="speaker"?"The stone figure bars the way.":"The battered chest blocks the way.");render();return}player.x=x;player.y=y;say("Your footsteps echo in the dark.");render()}
function turn(a:1|-1){player.facing=((player.facing+a+4)%4)as Facing;say("You turn, listening.");render()}
function use(){const[tx,ty]=worldOffset(1,0);
 if(targetMonster()){showEncounter();render();return;
 }if(false){
  const damage=1+Math.floor(Math.random()*3);warden.hp-=damage;
  if(warden.hp<=0){warden.dead=true;say("Your blow cracks the warden apart. Stone fragments settle across the floor.");render();return}
  say(damage===3?"CRACK! Your blow splits the stone shell.":"CLANG! Your weapon bites into stone.");render();return
 }if(tileAt(tx,ty)===3){if(!hasSilverKey){say("A narrow silver keyhole hides beneath the grime.");render();return}MAP[ty][tx]=0;hasSilverKey=false;warden.awake=true;warden.x=5;warden.y=9;warden.hp=3;say("The tarnished key turns once, then snaps in the lock. Beyond the opening, bone scrapes against stone.");render();return}if(player.x===8&&player.y===9&&!secret.revealed&&player.facing===3){secret.revealed=true;MAP[9][7]=0;say("One stone is warmer than the others. It sinks beneath your palm. Somewhere inside the wall: click.");render();return}const target=targetFeature(),f=target.feature;if(!f)return;const k=key(target.x,target.y);if(f==="pillar")say("Names have been cut into the pillar. Every one has been scratched out.");if(f==="skulls")say("Six skulls. Five face the corridor. One faces the wall.");if(f==="speaker")say("The stone mouth whispers: “The dead remember the way that stone forgets.”");if(f==="chest"){used.add(k);features.delete(k);hasSilverKey=true;say("Inside: a tarnished silver key and three old coins. You take them.");}render()}
function act(a:string){if(busy||inEncounter)return;if(a==="forward")step(1);if(a==="back")step(-1);if(a==="left")turn(-1);if(a==="right")turn(1);if(a==="interact")use()}
window.addEventListener("keydown",e=>{const actions:Record<string,string>={arrowup:"forward",w:"forward",arrowdown:"back",s:"back",arrowleft:"left",a:"left",arrowright:"right",d:"right",e:"interact"," ":"interact"};const action=actions[e.key.toLowerCase()];if(action){e.preventDefault();act(action)}});
document.querySelectorAll<HTMLButtonElement>("[data-hero]").forEach((b,i)=>b.addEventListener("pointerdown",e=>{e.preventDefault();void heroAttack(i)}));
document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();act(b.dataset.action!)}));
Promise.all(Object.values(atlas).map(img=>img.decode().catch(()=>new Promise<void>(r=>img.addEventListener("load",()=>r(),{once:true}))))).then(()=>{say("The stair closes behind you. The air smells of wet stone.");render()});
