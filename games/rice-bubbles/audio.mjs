export class GameAudio{
  constructor(){this._enabled=false;this.context=null;this.active=new Set();}
  get enabled(){return this._enabled;}
  set enabled(value){this._enabled=value;if(!value)this.stop();}
  async unlock(){if(!this.enabled)return;if(!this.context)this.context=new AudioContext();if(this.context.state==='suspended')await this.context.resume();}
  play(kind){
    if(!this.enabled||!this.context||this.context.state!=='running')return;
    const c=this.context,t=c.currentTime;
    const sequence=kind==='meal'?[[660,0,.09],[880,.1,.1]]:kind==='catch'?[[740,0,.07],[990,.04,.08]]:kind==='incorrect'?[[260,0,.07],[210,.07,.08]]:kind==='correct'?[[580,0,.06],[740,.06,.07]]:kind==='pop'?[[380,0,.035]]:[[440,0,.05]];
    const volume=kind==='pop'?0.008:['correct','incorrect'].includes(kind)?0.025:0.035;
    for(const [frequency,offset,duration]of sequence){const o=c.createOscillator(),g=c.createGain(),node={o,g};o.type='sine';o.frequency.setValueAtTime(frequency,t+offset);g.gain.setValueAtTime(0,t+offset);g.gain.linearRampToValueAtTime(volume,t+offset+.008);g.gain.exponentialRampToValueAtTime(.0001,t+offset+duration);o.connect(g);g.connect(c.destination);o.onended=()=>{this.active.delete(node);o.disconnect();g.disconnect();};o.start(t+offset);o.stop(t+offset+duration+.02);this.active.add(node);}
  }
  stop(){for(const {o,g}of this.active){o.onended=null;o.stop();o.disconnect();g.disconnect();}this.active.clear();}
  async dispose(){this.stop();if(this.context)await this.context.close();this.context=null;}
}
