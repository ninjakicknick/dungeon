import "./style.css";
type Facing=0|1|2|3; type Tile=0|1|2|3;
type Feature="chest"|"pillar"|"skulls"|"speaker";
const canvas=document.querySelector<HTMLCanvasElement>("#game")!,ctx=canvas.getContext("2d")!;
const mapCanvas=document.querySelector<HTMLCanvasElement>("#map")!,mapCtx=mapCanvas.getContext("2d")!;
const encounter=document.querySelector<HTMLElement>("#encounter")!,roll=document.querySelector<HTMLElement>("#roll")!,wardenHp=document.querySelector<HTMLElement>("#warden-hp")!,battleSpace=document.querySelector<HTMLElement>("#battle-space")!,message=document.querySelector<HTMLElement>("#message")!,interact=document.querySelector<HTMLButtonElement>("#interact")!,keyStatus=document.querySelector<HTMLElement>("#key-status")!,wizardActions=document.querySelector<HTMLElement>("#wizard-actions")!,elaraSpells=document.querySelector<HTMLElement>("#elara-spells")!,clericActions=document.querySelector<HTMLElement>("#cleric-actions")!,healTargets=document.querySelector<HTMLElement>("#heal-targets")!,maraHeals=document.querySelector<HTMLElement>("#mara-heals")!,lockActions=document.querySelector<HTMLElement>("#lock-actions")!,lockRoll=document.querySelector<HTMLElement>("#lock-roll")!;
ctx.imageSmoothingEnabled=false;mapCtx.imageSmoothingEnabled=false;
const atlas={floor:new Image(),wall:new Image(),door:new Image(),locked:new Image(),ceiling:new Image(),chest:new Image(),pillar:new Image(),skulls:new Image(),speaker:new Image(),skeleton:new Image(),minimap:new Image(),cursor:new Image()};
for(const [k,file] of Object.entries({floor:"dungeon_floor.png",wall:"dungeon_wall.png",door:"dungeon_door.png",locked:"locked_door.png",ceiling:"dungeon_ceiling.png",chest:"chest_exterior.png",pillar:"pillar_interior.png",skulls:"skull_pile.png",speaker:"death_speaker.png",skeleton:"skeleton.png",minimap:"minimap.png",cursor:"minimap_cursor.png"})) atlas[k as keyof typeof atlas].src=new URL(`../assets/${file}`,import.meta.url).href;

// 0 floor, 1 wall, 2 door, 3 locked door. The floor is rolled fresh each expedition.
const W=12,H=11,MAP:Tile[][]=Array.from({length:H},()=>Array<Tile>(W).fill(1));
type Region={id:number,kind:"room"|"corridor",roll:number,cells:Array<[number,number]>,content?:string};
const regions:Region[]=[],regionAt=new Map<string,number>(),resolvedRegions=new Set<number>();
const corridorRolls=new Set([11,12,13,14,26,32,33,42,45,51,53,55,62,63,65]);
function plainD6(){return 1+Math.floor(Math.random()*6)}
function d66(){return plainD6()*10+plainD6()}
function carveRegion(kind:"room"|"corridor",roll:number,cells:Array<[number,number]>){
 const id=regions.length,r={id,kind,roll,cells} as Region;regions.push(r);
 for(const[x,y]of cells)if(x>0&&x<W-1&&y>0&&y<H-1){MAP[y][x]=0;regionAt.set(`${x},${y}`,id)}
}
function generateDungeon(){
 // First room: no content roll, as in 4AD.
 carveRegion("room",0,[[4,8],[5,8],[6,8],[4,9],[5,9],[6,9]]);
 const anchors:Array<[number,number,number,number]>=[[5,8,0,-1],[4,8,-1,0],[6,8,1,0]];
 for(let n=0;n<10&&anchors.length;n++){
  const ai=Math.floor(Math.random()*anchors.length),[ax,ay,dx,dy]=anchors.splice(ai,1)[0],roll=d66(),kind=corridorRolls.has(roll)?"corridor":"room";
  const len=kind==="corridor"?2+Math.floor(Math.random()*2):1,cells:Array<[number,number]>=[];
  let x=ax,y=ay;for(let i=0;i<len;i++){x+=dx;y+=dy;if(x<=0||x>=W-1||y<=0||y>=H-1)break;cells.push([x,y])}
  if(kind==="room"&&cells.length){const [cx,cy]=cells[cells.length-1],px=-dy,py=dx;for(const side of [-1,1])for(let depth=0;depth<2;depth++){const rx=cx+px*side+dx*depth,ry=cy+py*side+dy*depth;if(rx>0&&rx<W-1&&ry>0&&ry<H-1)cells.push([rx,ry])}}
  const fresh=cells.filter(([cx,cy])=>MAP[cy][cx]===1);if(!fresh.length)continue;carveRegion(kind,roll,fresh);
  const [ex,ey]=fresh[fresh.length-1];anchors.push([ex,ey,dx,dy],[ex,ey,-dy,dx],[ex,ey,dy,-dx])
 }
}
generateDungeon();
type HeroClass="warrior"|"cleric"|"rogue"|"wizard";
type Hero={id:string,name:string,className:HeroClass,level:number,life:number,maxLife:number,equipment:string[],resources:Record<string,number>};
const party:Hero[]=[
 {id:"bram",name:"Bram",className:"warrior",level:1,life:7,maxLife:7,equipment:["light armor","shield","hand weapon"],resources:{}},
 {id:"mara",name:"Mara",className:"cleric",level:1,life:5,maxLife:5,equipment:["light armor","shield","hand weapon"],resources:{healing:3,blessing:3}},
 {id:"nix",name:"Nix",className:"rogue",level:1,life:4,maxLife:4,equipment:["light armor","light weapon","rope","lock-picks"],resources:{}},
 {id:"elara",name:"Elara",className:"wizard",level:1,life:3,maxLife:3,equipment:["light weapon","spellbook","writing implements"],resources:{spellSlots:3,lightning:1,fireball:1,protection:1}}
];
const marchingOrder=[0,1,2,3];
const player={x:5,y:9,facing:0 as Facing},visited=new Set<string>(),used=new Set<string>(),failedLocks=new Set<string>();let hasSilverKey=false,busy=false,hitFlash=0,inEncounter=false,protectedHero:number|null=null;const acted=new Set<number>();const warden={x:-1,y:-1,hp:3,awake:false,dead:false};
const features=new Map<string,Feature>();const secret={x:-1,y:-1,revealed:true};
const DRAW=[{sx:0,sy:0,sw:80,sh:120,dx:0,dy:0},{sx:80,sy:0,sw:80,sh:120,dx:80,dy:0},{sx:160,sy:0,sw:80,sh:120,dx:0,dy:0},{sx:240,sy:0,sw:80,sh:120,dx:80,dy:0},{sx:320,sy:0,sw:160,sh:120,dx:0,dy:0},{sx:480,sy:0,sw:80,sh:120,dx:0,dy:0},{sx:560,sy:0,sw:80,sh:120,dx:80,dy:0},{sx:0,sy:120,sw:80,sh:120,dx:0,dy:0},{sx:80,sy:120,sw:80,sh:120,dx:80,dy:0},{sx:160,sy:120,sw:160,sh:120,dx:0,dy:0},{sx:320,sy:120,sw:80,sh:120,dx:0,dy:0},{sx:400,sy:120,sw:80,sh:120,dx:80,dy:0},{sx:480,sy:120,sw:160,sh:120,dx:0,dy:0}];
const VIEW:Array<[number,number,number]>=[[2,-2,0],[2,2,1],[2,-1,2],[2,1,3],[2,0,4],[1,-2,5],[1,2,6],[1,-1,7],[1,1,8],[1,0,9],[0,-1,10],[0,1,11],[0,0,12]];
const dirs=[{fx:0,fy:-1,rx:1,ry:0},{fx:1,fy:0,rx:0,ry:1},{fx:0,fy:1,rx:-1,ry:0},{fx:-1,fy:0,rx:0,ry:-1}];
const key=(x:number,y:number)=>`${x},${y}`,tileAt=(x:number,y:number):Tile=>MAP[y]?.[x]??1;
function worldOffset(f:number,r:number):[number,number]{const d=dirs[player.facing];return[player.x+d.fx*f+d.rx*r,player.y+d.fy*f+d.ry*r]}
function drawSheet(img:HTMLImageElement,p:number){const a=DRAW[p];ctx.drawImage(img,a.sx,a.sy,a.sw,a.sh,a.dx,a.dy,a.sw,a.sh)}
function drawBillboard(img:HTMLImageElement,f:number,r:number,src?:{x:number,y:number,w:number,h:number}){if(f<1||f>2||Math.abs(r)>1)return;const w=f===1?90:42,h=f===1?88:41,x=80+r*(f===1?42:25)-w/2,floorY=f===1?112:88,y=floorY-h;if(src)ctx.drawImage(img,src.x,src.y,src.w,src.h,Math.round(x),Math.round(y),w,h);else ctx.drawImage(img,Math.round(x),Math.round(y),w,h)}
function reveal(){visited.add(key(player.x,player.y));for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]])visited.add(key(player.x+dx,player.y+dy))}
function renderMap(){const s=5;mapCtx.fillStyle="#08060a";mapCtx.fillRect(0,0,60,55);for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!visited.has(key(x,y)))continue;const t=tileAt(x,y);mapCtx.fillStyle=t===1?"#251b17":t===2?"#8f563b":t===3?"#5e342c":"#b86f43";mapCtx.fillRect(x*s,y*s,s-1,s-1)}mapCtx.fillStyle="#d7e7cf";mapCtx.fillRect(player.x*s+1,player.y*s+1,3,3)}
function featureAt(x:number,y:number){return features.get(key(x,y))}
function targetFeature(){const[x,y]=worldOffset(1,0);return {x,y,feature:featureAt(x,y)}}
function monsterAt(x:number,y:number){return warden.awake&&!warden.dead&&warden.x===x&&warden.y===y}
function targetMonster(){const[x,y]=worldOffset(1,0);return monsterAt(x,y)}
function drawMonster(){if(!warden.awake||warden.dead)return;const d=dirs[player.facing],dx=warden.x-player.x,dy=warden.y-player.y,f=dx*d.fx+dy*d.fy,r=dx*d.rx+dy*d.ry;if(f<1||f>2||Math.abs(r)>1)return;const blocked=f===2&&tileAt(...worldOffset(1,r))!==0;if(blocked)return;drawBillboard(atlas.skeleton,f,r,{x:52,y:34,w:82,h:80})}
function updateInteract(){const target=targetFeature(),[tx,ty]=worldOffset(1,0),atMonster=targetMonster(),atLocked=tileAt(tx,ty)===3,atSecret=player.x===8&&player.y===9&&!secret.revealed&&player.facing===3,available=!!target.feature||atSecret||atLocked||atMonster;interact.hidden=false;interact.style.visibility=available?"visible":"hidden";interact.style.pointerEvents=available?"auto":"none";interact.textContent=atMonster?"ATTACK":target.feature==="chest"?"OPEN":target.feature?"EXAMINE":atLocked?"LOCK":atSecret?"EXAMINE":""}
function renderParty(){elaraSpells.textContent=String(party[3].resources.spellSlots);maraHeals.textContent=String(party[1].resources.healing);for(const hero of party){const el=document.querySelector<HTMLElement>(`#life-${hero.id}`);if(el)el.textContent=`♥ ${hero.life}/${hero.maxLife}`}}
function render(){reveal();keyStatus.hidden=!hasSilverKey;renderParty();ctx.fillStyle=hitFlash?"#f6d6a8":"#000";ctx.fillRect(0,0,160,120);for(const[f,r,p]of VIEW){const[x,y]=worldOffset(f,r);if(tileAt(x,y)!==1){drawSheet(atlas.ceiling,p);drawSheet(atlas.floor,p)}}for(const[f,r,p]of VIEW){const[x,y]=worldOffset(f,r),t=tileAt(x,y);if(t===1)drawSheet(atlas.wall,p);else if(t===2)drawSheet(atlas.door,p);else if(t===3)drawSheet(atlas.locked,p);else{const ft=features.get(key(x,y));if(ft&&!used.has(key(x,y))){if(ft==="speaker")drawBillboard(atlas.speaker,f,r);else drawSheet(atlas[ft],p);}}}drawMonster();renderMap();updateInteract()}
function say(t:string){message.textContent=t}
function wait(ms:number){return new Promise<void>(r=>setTimeout(r,ms))}
function d6(){let total=0,die=0;do{die=1+Math.floor(Math.random()*6);total+=die}while(die===6);return total}
function isRoom(x=player.x,y=player.y){const id=regionAt.get(key(x,y));return id!==undefined&&regions[id]?.kind==="room"}
function heroCanAct(i:number){if(isRoom())return true;const pos=marchingOrder.indexOf(i);return pos<2||party[i].className==="wizard"}
function heroAttackBonus(hero:Hero){if(hero.className==="warrior")return hero.level;if(hero.className==="cleric")return hero.level;/* undead */if(hero.className==="rogue")return hero.level-1;/* outnumbers this lone Minor-style foe; light weapon -1 */return -1}
function showClericActions(){clericActions.hidden=false;healTargets.hidden=true;document.querySelectorAll<HTMLElement>(".party-actions").forEach(el=>el.hidden=true)}
function hideClericActions(){clericActions.hidden=true;healTargets.hidden=true;document.querySelectorAll<HTMLElement>(".party-actions").forEach(el=>el.hidden=false)}
function showHealTargets(){clericActions.hidden=true;healTargets.hidden=false;document.querySelectorAll<HTMLButtonElement>("[data-heal]").forEach(b=>{const i=Number(b.dataset.heal);if(i>=0)b.disabled=party[i].life>=party[i].maxLife})}
function showWizardActions(){wizardActions.hidden=false;document.querySelectorAll<HTMLElement>(".party-actions").forEach(el=>el.hidden=true);for(const name of ["lightning","fireball","protection"]){const b=document.querySelector<HTMLButtonElement>(`[data-spell="${name}"]`);if(b)b.disabled=(party[3].resources[name]??0)<=0}}
function hideWizardActions(){wizardActions.hidden=true;document.querySelectorAll<HTMLElement>(".party-actions").forEach(el=>el.hidden=false)}
function heroButtons(){document.querySelectorAll<HTMLButtonElement>("[data-hero]").forEach((b,i)=>{b.disabled=acted.has(i)||party[i].life<=0||!heroCanAct(i);b.title=!heroCanAct(i)?"Rear rank: melee cannot reach in a corridor":""})}
function showEncounter(){
 inEncounter=true;acted.clear();protectedHero=null;hideWizardActions();hideClericActions();document.body.classList.add("in-encounter");encounter.hidden=false;wardenHp.textContent="◆ ".repeat(warden.hp).trim();battleSpace.textContent=isRoom()?"ROOM":"CORRIDOR";roll.textContent=isRoom()?"Your turn · all heroes can fight":"Your turn · front rank fights; Elara can cast from the rear";say("The skeleton raises its rusted blade.");heroButtons()
}
function hideEncounter(){inEncounter=false;protectedHero=null;hideWizardActions();hideClericActions();document.body.classList.remove("in-encounter");encounter.hidden=true;acted.clear()}
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
 if(i===1){showClericActions();return}
 await resolveHeroAttack(i)
}
async function clericChoice(action:string){
 if(busy||!inEncounter)return;if(action==="back"){hideClericActions();return}
 if(action==="heal"){if((party[1].resources.healing??0)>0)showHealTargets();return}
 if(action==="attack"){hideClericActions();await resolveHeroAttack(1)}
}
async function healHero(i:number){
 if(i<0){showClericActions();return}const cleric=party[1];if(busy||!inEncounter||acted.has(1)||(cleric.resources.healing??0)<=0)return;
 const raw=d6(),amount=raw+cleric.level,target=party[i],before=target.life;target.life=Math.min(target.maxLife,target.life+amount);cleric.resources.healing--;cleric.resources.prayers--;acted.add(1);hideClericActions();
 roll.textContent=`MARA HEALS ${target.name.toUpperCase()}: ${raw} +1 = ${amount} · +${target.life-before} LIFE`;heroButtons();render();
 const eligible=party.map((h,j)=>h.life>0&&heroCanAct(j)?j:-1).filter(j=>j>=0);if(eligible.every(j=>acted.has(j)))await foeTurn()
}
async function resolveHeroAttack(i:number){
 const hero=party[i],raw=d6(),bonus=heroAttackBonus(hero),total=raw+bonus,foeLevel=3;
 const damage=total>=foeLevel?Math.max(1,Math.floor(total/foeLevel)):0;
 acted.add(i);if(damage)warden.hp=Math.max(0,warden.hp-damage);
 roll.textContent=`${hero.name.toUpperCase()} ATTACKS: ${raw} ${bonus>=0?"+":""}${bonus} = ${total} · ${damage?damage+" DAMAGE":"MISS"}`;
 wardenHp.textContent="◆ ".repeat(warden.hp).trim();heroButtons();
 if(warden.hp<=0){warden.dead=true;hideEncounter();say("The skeleton collapses in a clatter of bone and rusted steel.");render();return}
 const eligible=party.map((h,j)=>h.life>0&&heroCanAct(j)?j:-1).filter(j=>j>=0);if(eligible.every(j=>acted.has(j)))await foeTurn()
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
function contentFor(total:number,kind:"room"|"corridor"){
 if(total===2)return "TREASURE";
 if(total===3)return "TRAPPED TREASURE";
 if(total===4)return kind==="corridor"?"EMPTY":"SPECIAL EVENT";
 if(total===5)return "SPECIAL FEATURE";
 if(total===6)return "VERMIN";
 if(total===7)return "MINIONS";
 if(total===8)return kind==="corridor"?"EMPTY":"MINIONS";
 if(total===9)return "EMPTY";
 if(total===10)return kind==="corridor"?"EMPTY":"WEIRD MONSTER";
 if(total===11)return "BOSS";
 return kind==="corridor"?"EMPTY":"DRAGON LAIR"
}
function resolveRegion(x:number,y:number){
 const id=regionAt.get(key(x,y));if(id===undefined||id===0||resolvedRegions.has(id))return "";
 resolvedRegions.add(id);const r=regions[id],a=plainD6(),b=plainD6(),total=a+b,content=contentFor(total,r.kind);r.content=content;
 if(content==="TREASURE"||content==="TRAPPED TREASURE"){features.set(key(x,y),"chest")}
 else if(content==="SPECIAL FEATURE"){features.set(key(x,y),["pillar","skulls","speaker"][Math.floor(Math.random()*3)] as Feature)}
 else if((content==="MINIONS"||content==="BOSS"||content==="WEIRD MONSTER")&&!warden.awake&&!warden.dead){warden.awake=true;warden.x=x;warden.y=y;warden.hp=content==="BOSS"?5:3}
 return `d66 ${r.roll} · ${r.kind.toUpperCase()} · CONTENT ${a}+${b}=${total}: ${content}`
}
function step(a:1|-1){const[x,y]=worldOffset(a,0),t=tileAt(x,y),f=featureAt(x,y);if(monsterAt(x,y)){showEncounter();render();return}if(t===2&&a===1){MAP[y][x]=0;say("The old door yields with a groan.");render();return}if(t===3){showLock();return}if(t===1){say("Cold stone blocks the way.");render();return}if(f){say(f==="pillar"?"The carved pillar blocks the passage.":f==="skulls"?"A deliberate pile of bones blocks your step.":f==="speaker"?"The stone figure bars the way.":"The battered chest blocks the way.");render();return}player.x=x;player.y=y;const discovery=resolveRegion(x,y);say(discovery||"Your footsteps echo in the dark.");render()}
function turn(a:1|-1){player.facing=((player.facing+a+4)%4)as Facing;say("You turn, listening.");render()}
function showLock(){const[tx,ty]=worldOffset(1,0);const k=key(tx,ty);lockActions.hidden=false;document.body.classList.add("in-lock");lockRoll.textContent=failedLocks.has(k)?"The picks have slipped. This lock has beaten Nix.":"Nix studies the mechanism.";const pick=document.querySelector<HTMLButtonElement>('[data-lock="pick"]')!,useKey=document.querySelector<HTMLButtonElement>('[data-lock="key"]')!;pick.disabled=failedLocks.has(k);useKey.disabled=!hasSilverKey}
function hideLock(){lockActions.hidden=true;document.body.classList.remove("in-lock")}
function unlockDoor(){const[tx,ty]=worldOffset(1,0);MAP[ty][tx]=0;hideLock();say("The lock opens.");render()}
function lockChoice(action:string){if(action==="back"){hideLock();return}const[tx,ty]=worldOffset(1,0);if(tileAt(tx,ty)!==3)return;if(action==="key"){if(!hasSilverKey)return;hasSilverKey=false;unlockDoor();return}if(action==="pick"){const k=key(tx,ty);if(failedLocks.has(k))return;const raw=d6(),total=raw+party[2].level;if(total>=3){lockRoll.textContent=`NIX PICKS THE LOCK: ${raw} +1 = ${total} · OPEN`;setTimeout(unlockDoor,350)}else{failedLocks.add(k);lockRoll.textContent=`NIX PICKS THE LOCK: ${raw} +1 = ${total} · FAILED`;document.querySelector<HTMLButtonElement>('[data-lock="pick"]')!.disabled=true}}}
function use(){const[tx,ty]=worldOffset(1,0);
 if(targetMonster()){showEncounter();render();return;
 }if(false){
  const damage=1+Math.floor(Math.random()*3);warden.hp-=damage;
  if(warden.hp<=0){warden.dead=true;say("Your blow cracks the warden apart. Stone fragments settle across the floor.");render();return}
  say(damage===3?"CRACK! Your blow splits the stone shell.":"CLANG! Your weapon bites into stone.");render();return
 }if(tileAt(tx,ty)===3){showLock();return}if(player.x===8&&player.y===9&&!secret.revealed&&player.facing===3){secret.revealed=true;MAP[9][7]=0;say("One stone is warmer than the others. It sinks beneath your palm. Somewhere inside the wall: click.");render();return}const target=targetFeature(),f=target.feature;if(!f)return;const k=key(target.x,target.y);if(f==="pillar")say("Names have been cut into the pillar. Every one has been scratched out.");if(f==="skulls")say("Six skulls. Five face the corridor. One faces the wall.");if(f==="speaker")say("The stone mouth whispers: “The dead remember the way that stone forgets.”");if(f==="chest"){used.add(k);features.delete(k);hasSilverKey=true;say("Inside: a tarnished silver key and three old coins. You take them.");}render()}
function act(a:string){if(busy||inEncounter||!lockActions.hidden)return;if(a==="forward")step(1);if(a==="back")step(-1);if(a==="left")turn(-1);if(a==="right")turn(1);if(a==="interact")use()}
window.addEventListener("keydown",e=>{const actions:Record<string,string>={arrowup:"forward",w:"forward",arrowdown:"back",s:"back",arrowleft:"left",a:"left",arrowright:"right",d:"right",e:"interact"," ":"interact"};const action=actions[e.key.toLowerCase()];if(action){e.preventDefault();act(action)}});
document.querySelectorAll<HTMLButtonElement>("[data-prayer]").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();void clericChoice(b.dataset.prayer!)}));
document.querySelectorAll<HTMLButtonElement>("[data-heal]").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();void healHero(Number(b.dataset.heal))}));
document.querySelectorAll<HTMLButtonElement>("[data-spell]").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();void castSpell(b.dataset.spell!)}));
document.querySelectorAll<HTMLButtonElement>("[data-lock]").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();lockChoice(b.dataset.lock!)}));
document.querySelectorAll<HTMLButtonElement>("[data-hero]").forEach((b,i)=>b.addEventListener("pointerdown",e=>{e.preventDefault();void heroAttack(i)}));
document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();act(b.dataset.action!)}));
Promise.all(Object.values(atlas).map(img=>img.decode().catch(()=>new Promise<void>(r=>img.addEventListener("load",()=>r(),{once:true}))))).then(()=>{say("A new dungeon waits. Beyond the first room, nothing has been decided yet.");render()});
