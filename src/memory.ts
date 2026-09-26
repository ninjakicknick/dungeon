import { views, rooms, startView, connections } from './world';
export const saveKey='dungeon-wonder-v1';
export type Memory={view:string;visited:string[];paths:string[];noticed:string[];sound:boolean;hints:boolean;mouth:boolean;seed:number;bellCount:number};
export const pathKey=(a:string,b:string)=>[a,b].sort().join(':');
const validPaths=new Set(connections.map(([a,b])=>pathKey(a,b)));
export function readMemory(raw:unknown,preferences:unknown=null):Memory{
 const s=(raw&&typeof raw==='object'?raw:{}) as Partial<Memory>;
 const old=(preferences&&typeof preferences==='object'?preferences:{}) as Partial<Memory>;
 const list=(v:unknown,valid:(s:string)=>boolean)=>Array.isArray(v)?[...new Set(v.filter((x):x is string=>typeof x==='string'&&valid(x)))]:[];
 const mouth=s.mouth===true;
 let view=typeof s.view==='string'&&Object.hasOwn(views,s.view)?s.view:startView;
 if(views[view].room==='tea'&&!mouth)view='bell';
 return {view,visited:list(s.visited,x=>Object.hasOwn(rooms,x)),paths:list(s.paths,x=>validPaths.has(x)),noticed:list(s.noticed,x=>['water','bell','listen','tea'].includes(x)),sound:typeof s.sound==='boolean'?s.sound:old.sound===true,hints:typeof s.hints==='boolean'?s.hints:old.hints===true,mouth,seed:Number.isInteger(s.seed)&&s.seed!>0?s.seed!:Math.floor(Math.random()*1000000)+1,bellCount:Number.isInteger(s.bellCount)?Math.max(0,Math.min(10000,s.bellCount!)):0};
}
export function loadMemory():Memory{try{return readMemory(JSON.parse(localStorage.getItem(saveKey)||'null'),JSON.parse(localStorage.getItem('dungeon-underchapel-v1')||'null'))}catch{return readMemory(null)}}
export function persist(memory:Memory){try{localStorage.setItem(saveKey,JSON.stringify(memory))}catch{/* Blocked or full storage never blocks exploration. */}}
