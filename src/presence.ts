import { views } from './world';
type Moment={view:string;seed:number;still:number;ringAt:number;quiet:boolean};
// The small lights keep time independently of which room is on screen.
// All drawing here is environmental light, particles, steam, and water, not scenery.
export function createAtmosphere(canvas:HTMLCanvasElement,state:()=>Moment,motion:MediaQueryList){
 const ctx=canvas.getContext('2d')!;canvas.width=1280;canvas.height=720;
 let last=0,rippleAt=-10000;
 const dust=Array.from({length:34},(_,i)=>({x:(i*353)%1280,y:(i*137)%720,s:.08+(i%7)*.016,r:.4+(i%4)*.25}));
 const glow=(x:number,y:number,r:number,color:string,alpha:number)=>{ctx.save();ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore()};
 function frame(t:number){
  requestAnimationFrame(frame);if(document.hidden){last=t;return}if(t-last<50)return;const dt=Math.min(100,t-last);last=t;ctx.clearRect(0,0,1280,720);
  const m=state(),v=views[m.view],now=Date.now()+m.seed*71;
  const [scale,zx,zy]=v.zoom||[1,50,50],cx=Math.max(50/scale,Math.min(100-50/scale,zx)),cy=Math.max(50/scale,Math.min(100-50/scale,zy));
  ctx.save();ctx.translate((50-scale*cx)*12.8,(50-scale*cy)*7.2);ctx.scale(scale,scale);
  const phase=motion.matches?0:t*.001;
  if(v.room==='mushroom'){
   glow(580,250,280,'#ffc263',.08+.035*Math.sin(phase*.65));glow(1010,450,150,'#7bffe1',.07+.025*Math.sin(phase*.4));
   if(!motion.matches){for(const p of dust){p.x=(p.x+dt*p.s*.065)%1280;p.y=(p.y-dt*.01+720)%720;glow(p.x,p.y,3,'#c1fff1',.18+.2*Math.sin(phase+p.x)**2)}}
   // A brief, broad wave of luminescence through the gills, easy to miss.
   const pulse=(now%97000)/97000;if(pulse>.76&&pulse<.87)glow(630,280,330,'#8ffff0',Math.sin((pulse-.76)/.11*Math.PI)*.13);
  }
  if(v.room==='fountain'&&!motion.matches){
   const touched=t-rippleAt<6000,phase=touched?(t-rippleAt)/6000:(t%4800)/4800;
   ctx.strokeStyle=`rgba(199,255,235,${(1-phase)*(touched?.48:.13)})`;ctx.lineWidth=1.3;
   for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(637,475,8+phase*150+i*18,2+phase*27+i*3,0,0,Math.PI*2);ctx.stroke()}
   for(let i=0;i<10;i++){const y=292+((t*.12+i*15)%143);glow(635+Math.sin(i)*2,y,2,'#eaffff',.4)}
  }
  if(v.room==='bridge'){
   const windows=m.view==='shaft'?[[934,256],[351,343],[645,551]]:m.view==='bridge-back'?[[904,313],[985,370],[1155,313]]:[[1178,358],[932,167],[63,164]];
   windows.forEach(([x,y],i)=>{const p=((now+i*11000)%79000)/79000;const on=p>.48&&p<.82;glow(x,y,m.view==='shaft'?24:12,'#ffb550',on?.45:0)});
   // One light travels below, without becoming an announced encounter.
   if(m.view==='shaft'&&!motion.matches){const p=(now%113000)/113000;if(p>.68&&p<.87){const s=(p-.68)/.19;glow(695-75*s,489+72*s,8,'#ffcc79',Math.sin(s*Math.PI)*.85)}}
   if(!motion.matches){for(const p of dust.slice(0,10)){p.y=(p.y+dt*.012)%720;glow(p.x,p.y,2,'#b8a4e6',.1)}}
  }
  if(v.room==='bell'){
   const elapsed=t-m.ringAt;if(elapsed>=0&&elapsed<4200)glow(640,459,210,'#ffcf82',Math.exp(-elapsed/1400)*.2);
  }
  if(v.room==='tea'&&!motion.matches){
   ctx.lineWidth=2;for(let j=0;j<3;j++){ctx.beginPath();for(let i=0;i<24;i++){const y=383-i*2.7,x=797+Math.sin(phase*.8+i*.17+j)*6+j*3;ctx.lineTo(x,y)}ctx.strokeStyle=`rgba(250,232,209,${.06+.04*Math.sin(phase+j)**2})`;ctx.stroke()}
  }
  ctx.restore();
 }
 requestAnimationFrame(frame);return{touchWater(){rippleAt=performance.now()}};
}
