// Original synthesized sound. Underchapel's seam-blended beds and crossfades are
// retained; timbres now identify landmarks rather than architectural dampness.
type Sound='stone'|'water'|'bell'|'metal'|'cup'|'step';
const mixes:Record<string,[number,number,number,number,number,number]>={
 fountain:[.018,.19,1900,0,.008,146.83],armor:[.022,.014,430,-.7,.016,73.42],
 bridge:[.19,.003,210,-.5,.024,55],mushroom:[.012,.016,720,.4,.028,174.61],
 bell:[.04,.002,300,.6,.025,82.41],tea:[.012,.001,220,.8,.012,130.81]
};
export class Ambience{
 private ctx?:AudioContext;private master?:GainNode;private wind?:GainNode;private water?:GainNode;private filter?:BiquadFilterNode;private pan?:StereoPannerNode;private hum?:GainNode;private tone?:OscillatorNode;private timer?:number;
 private reverse=false;private room='fountain';private enabled=false;
 async enable(value:boolean){this.enabled=value;if(value&&!this.ctx)this.create();if(this.ctx&&value&&!document.hidden)await this.ctx.resume();this.mix(this.room,this.reverse)}
 private create(){
  const c=this.ctx=new AudioContext();this.master=c.createGain();this.master.gain.value=0;this.master.connect(c.destination);
  const make=(seconds:number)=>{const size=Math.floor(c.sampleRate*seconds),fade=c.sampleRate*2,data=new Float32Array(size+fade);let prev=0;for(let i=0;i<data.length;i++){prev=(prev+.018*(Math.random()*2-1))/1.018;data[i]=prev*5}const b=c.createBuffer(1,size,c.sampleRate),out=b.getChannelData(0);out.set(data.subarray(fade));for(let i=0;i<fade;i++){const p=i/fade;out[size-fade+i]=data[size+i]*Math.cos(p*Math.PI/2)+data[i]*Math.sin(p*Math.PI/2)}return b};
  this.wind=c.createGain();const low=c.createBiquadFilter();low.type='lowpass';low.frequency.value=310;const breeze=c.createBufferSource();breeze.buffer=make(29);breeze.loop=true;breeze.connect(low).connect(this.wind).connect(this.master);breeze.start();
  this.water=c.createGain();this.filter=c.createBiquadFilter();this.filter.type='lowpass';this.pan=c.createStereoPanner();const stream=c.createBufferSource();stream.buffer=make(37);stream.loop=true;stream.connect(this.filter).connect(this.water).connect(this.pan).connect(this.master);stream.start();
  this.hum=c.createGain();this.tone=c.createOscillator();this.tone.type='sine';this.tone.connect(this.hum).connect(this.master);this.tone.start();
  this.schedule();document.addEventListener('visibilitychange',()=>{if(document.hidden){void c.suspend();window.clearTimeout(this.timer)}else{if(this.enabled)void c.resume();this.schedule()}});
 }
 private ramp(param:AudioParam,value:number){const t=this.ctx!.currentTime;param.cancelScheduledValues(t);param.setTargetAtTime(value,t,.8)}
 mix(room:string,reverse=false){this.room=room;this.reverse=reverse;if(!this.ctx)return;const [wind,water,freq,pan,hum,note]=mixes[room]||mixes.fountain;this.ramp(this.master!.gain,this.enabled?.65:0);this.ramp(this.wind!.gain,wind);this.ramp(this.water!.gain,water);this.ramp(this.filter!.frequency,freq);this.ramp(this.pan!.pan,reverse?-pan:pan);this.ramp(this.hum!.gain,hum);this.ramp(this.tone!.frequency,note)}
 private schedule(){window.clearTimeout(this.timer);this.timer=window.setTimeout(()=>{if(this.enabled&&!document.hidden){if(this.room==='fountain')this.sound('water',false);if(this.room==='armor'&&Math.random()<.5)this.sound('metal',false);if(this.room==='mushroom')this.chime(523.25*[1,1.25,1.5][Math.floor(Math.random()*3)],.012,3,(Math.random()-.5)*1.5);if(this.room==='bridge'&&Math.random()<.35)this.chime(110,.012,4,-.7)}if(!document.hidden)this.schedule()},4500+Math.random()*10000)}
 private chime(freq:number,volume:number,length:number,pan=0,delay=0){
  const c=this.ctx;if(!c||!this.enabled||c.state!=='running')return;
  const g=c.createGain(),p=c.createStereoPanner(),o=c.createOscillator(),t=c.currentTime+delay;
  o.frequency.value=freq;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+length);p.pan.value=pan;o.connect(g).connect(p).connect(this.master!);o.start(t);o.stop(t+length+.1);o.onended=()=>{o.disconnect();g.disconnect();p.disconnect()};
 }
 sound(kind:Sound,local=true){
  if(!this.enabled||!this.ctx||document.hidden)return;
  const pan=local?0:(this.reverse?-.65:.65),amp=local?1:.25;
  if(kind==='bell'){[1,2.03,2.72,4.12].forEach((n,i)=>this.chime(164*n,.085/(i+1),6-i*.8,0));this.chime(164,.016,5,-.7,.55);this.chime(164,.009,4,.7,1.2);return}
  if(kind==='water'){this.chime(740,.035*amp,.35,pan);this.chime(510,.022*amp,.5,pan,.09);return}
  if(kind==='metal'){this.chime(392,.033*amp,2.5,pan);this.chime(1063,.012*amp,1.8,pan);return}
  if(kind==='cup'){this.chime(1174,.018,.65,0);return}
  if(kind==='step'){this.chime(82,.04,.13,-.12);this.chime(71,.028,.12,.12,.21);return}
  this.chime(164,.04*amp,2,pan);
 }
}
