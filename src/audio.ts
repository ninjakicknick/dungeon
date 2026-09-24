// Original synthesized ambience: no downloads, recorded loops, or external rights.
// Independent beds crossfade by position; long buffers have baked seam crossfades.
const mixes:Record<string,[number,number,number,number]>={entrance:[.11,.012,500,.4],gallery:[.06,.035,420,.65],chapel:[.025,.015,300,.7],crypt:[.01,.055,240,.5],watercourse:[.025,.14,1100,.65],cistern:[.018,.21,1500,-.25],stair:[.07,.08,650,.6]};
export class Ambience{
 private ctx?:AudioContext; private master?:GainNode; private wind?:GainNode; private water?:GainNode; private filter?:BiquadFilterNode; private pan?:StereoPannerNode; private timer?:number;
 private reverse=false; private room='entrance'; private enabled=false;
 async enable(value:boolean){this.enabled=value;if(value&&!this.ctx)this.create();if(this.ctx&&value)await this.ctx.resume();this.mix(this.room,this.reverse);}
 private create(){
  const c=this.ctx=new AudioContext();this.master=c.createGain();this.master.gain.value=0;this.master.connect(c.destination);
  const make=(seconds:number)=>{const size=Math.floor(c.sampleRate*seconds),fade=c.sampleRate*2,data=new Float32Array(size+fade);let prev=0;for(let i=0;i<data.length;i++){prev=(prev+.018*(Math.random()*2-1))/1.018;data[i]=prev*5}const b=c.createBuffer(1,size,c.sampleRate),out=b.getChannelData(0);out.set(data.subarray(fade));for(let i=0;i<fade;i++){const p=i/fade;out[size-fade+i]=data[size+i]*Math.cos(p*Math.PI/2)+data[i]*Math.sin(p*Math.PI/2)}return b};
  this.wind=c.createGain();const low=c.createBiquadFilter();low.type='lowpass';low.frequency.value=320;const breeze=c.createBufferSource();breeze.buffer=make(29);breeze.loop=true;breeze.connect(low).connect(this.wind).connect(this.master);breeze.start();
  this.water=c.createGain();this.filter=c.createBiquadFilter();this.filter.type='lowpass';this.pan=c.createStereoPanner();const stream=c.createBufferSource();stream.buffer=make(37);stream.loop=true;stream.connect(this.filter).connect(this.water).connect(this.pan).connect(this.master);stream.start();
  this.schedule();document.addEventListener('visibilitychange',()=>{if(document.hidden){void c.suspend();window.clearTimeout(this.timer)}else{if(this.enabled)void c.resume();this.schedule()}});
 }
 private ramp(param:AudioParam,value:number){const t=this.ctx!.currentTime;param.cancelScheduledValues(t);param.setTargetAtTime(value,t,.7)}
 mix(room:string,reverse=false){this.room=room;this.reverse=reverse;if(!this.ctx)return;const [wind,water,freq,pan]=mixes[room];this.ramp(this.master!.gain,this.enabled?.65:0);this.ramp(this.wind!.gain,wind);this.ramp(this.water!.gain,water);this.ramp(this.filter!.frequency,freq);this.ramp(this.pan!.pan,reverse?-pan:pan)}
 private schedule(){window.clearTimeout(this.timer);this.timer=window.setTimeout(()=>{if(this.enabled&&!document.hidden)this.sound('water',false);if(!document.hidden)this.schedule()},3100+Math.random()*6700)}
 sound(kind:'stone'|'water',local=true){const c=this.ctx;if(!c||!this.enabled||c.state!=='running')return;const g=c.createGain(),p=c.createStereoPanner(),o=c.createOscillator();const wet=mixes[this.room][1];const t=c.currentTime;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(local?.07:wet*.12+.001,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+(kind==='stone'?2.3:.55));o.frequency.setValueAtTime(kind==='stone'?164:740,t);o.frequency.exponentialRampToValueAtTime(kind==='stone'?162:310,t+.2);p.pan.value=local?0:mixes[this.room][3]*(this.reverse?-1:1);o.connect(g).connect(p).connect(this.master!);o.start(t);o.stop(t+2.4);o.onended=()=>{o.disconnect();g.disconnect();p.disconnect()}}
}
