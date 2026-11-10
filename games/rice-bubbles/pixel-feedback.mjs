import {foodCrumbColor} from './stimuli.mjs';
import {VERDICT_COLORS,VERDICT_TICK,VERDICT_CROSS} from '../../runtime/presentation.mjs';
const STEP=1000/16;
const clamp=v=>Math.max(0,Math.min(1,v));
const DURATION={launch:200,land:140,grasp:140,catch:360,meal:600,stow:300,'bubble-pass':200,miss:200,'bubble-mistake':200,'rice-impact':300,'food-impact':300,'wrapped-pop':200,'bubble-impact':300,correct:300,incorrect:300,'life-lost':300};
const HEART=['.##.##.','#######','#######','.#####.','..###..','...#...'];
export function reactionCue(clip,frames,at,outcome,durationMs=clip.durationMs){
  const event=outcome==='bubble_mistake'?{visibleAtMs:187.5,pointSourceFrameId:clip.frameIds[3]}:clip.events.find(e=>e.name==='verdict');
  const frame=frames.get(event.pointSourceFrameId);
  const visibleAtMs=event.visibleAtMs/clip.durationMs*durationMs;
  return{kind:['bubble_pass','food_refused'].includes(outcome)?'correct':'incorrect',outcome,at:at+visibleAtMs,duration:300,pointSourceFrameId:frame.id,point:[frame.headCenter[0]+58,frame.headCenter[1]-8],pixelScale:3};
}
function square(g,x,y,w,h,color,alpha=1){g.rect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)).fill({color,alpha});}
function star(g,x,y,s,alpha=1){
  square(g,x-2*s,y-4*s,4*s,8*s,0x263248,alpha);
  square(g,x-4*s,y-2*s,8*s,4*s,0x263248,alpha);
  square(g,x-s,y-3*s,2*s,6*s,0xf3d391,alpha);
  square(g,x-3*s,y-s,6*s,2*s,0xf3d391,alpha);
  square(g,x-s,y-s,2*s,2*s,0xfffae7,alpha);
}
function tick(g,x,y,s,alpha){
  verdict(g,x,y,s,alpha,VERDICT_TICK,VERDICT_COLORS.correct);
}
function cross(g,x,y,s,alpha){
  verdict(g,x,y,s,alpha,VERDICT_CROSS,VERDICT_COLORS.incorrect);
}
function verdict(g,x,y,s,alpha,points,color){
  for(const[dx,dy]of points)square(g,x+(dx-1)*s-1,y+(dy-1)*s-1,4*s+2,4*s+2,VERDICT_COLORS.edge,alpha);
  for(const[dx,dy]of points)square(g,x+(dx-1)*s,y+(dy-1)*s,4*s,4*s,VERDICT_COLORS.ink,alpha);
  for(const[dx,dy]of points)square(g,x+dx*s,y+dy*s,2*s,2*s,color,alpha);
}

export class PixelFeedback{
  constructor(){this.events=[];}
  clear(){this.events=[];}
  emit(kind,at,point,base,scale,duration=DURATION[kind],pixelScale=2,details=null){
    this.events.push({kind,at,point:['launch','land','bubble-pass','miss','rice-impact','food-impact','bubble-impact','wrapped-pop'].includes(kind)?[...point]:null,offset:[(point[0]-base[0])/scale,(point[1]-base[1])/scale],duration,pixelScale,details});
  }
  draw(g,time,base,scale){
    this.events=this.events.filter(e=>time-e.at<e.duration);
    for(const e of this.events){
      if(time<e.at)continue;
      const age=Math.floor((time-e.at)/STEP)*STEP,t=clamp(age/e.duration),fade=1-clamp((t-.65)/.35),x=e.point?e.point[0]:base[0]+e.offset[0]*scale,y=e.point?e.point[1]:base[1]+e.offset[1]*scale,s=scale;
      if(e.kind==='launch'||e.kind==='land'){
        for(const side of[-1,1])for(let i=0;i<3;i++){const xx=x+side*(7+i*6+t*12)*s,yy=y-(i%2?5:2)*Math.sin(t*Math.PI)*s;square(g,xx-s,yy-s,(6-i)*s,4*s,0x263248,fade*.55);square(g,xx,yy,(4-i)*s,2*s,0xdce9e3,fade*.7);}
      }else if(e.kind==='grasp'){
        for(const side of[-1,1]){square(g,x+side*(11+t*4)*s,y-4*s,3*s,2*s,0xfff7dc,fade);square(g,x+side*(13+t*4)*s,y,2*s,3*s,0xf3d391,fade);square(g,x+side*4*s,y-(9+t*3)*s,2*s,2*s,0xfff7dc,fade);}
      }else if(e.kind==='catch'){
        for(let i=0;i<5;i++){const side=i%2?1:-1,xx=x+side*(3+i*2)*Math.sin(t*Math.PI*.7)*s,yy=y-(5+3*i)*Math.sin(t*Math.PI)*s+t*6*s;square(g,xx-s,yy-s,2*s,s,0x202d43,fade);square(g,xx,yy-s,2*s,s,0xfff7dc,fade);}
        if(t<.55)star(g,x+24*s,y+6*s,s*(t<.25?2:1),fade);
      }else if(e.kind==='rice-impact'||e.kind==='food-impact'){
        square(g,x-(13+9*t)*s,y,2*(13+9*t)*s,2*s,0x263248,fade*.5);
        for(let i=0;i<7;i++){
          const side=i%2?1:-1,xx=x+side*(2+i*3)*t*s,yy=y-(3+i%3*4)*Math.sin(t*Math.PI)*s-(i%2)*2*s;
          square(g,xx-2*s,yy-2*s,6*s,4*s,0x263248,fade);
          square(g,xx-s,yy-s,4*s,2*s,e.details?.foodId?foodCrumbColor(e.details.foodId):i===3?0xd7c49c:0xfff8e8,fade);
        }
      }else if(e.kind==='bubble-impact'){
        square(g,x-(11+11*t)*s,y,2*(11+11*t)*s,s,0x263248,fade*.5);
        if(t<.7)for(const side of[-1,1]){
          const xx=x+side*(10+t*20)*s,yy=y-(8+t*12)*s;
          square(g,xx-2*s,yy-2*s,7*s,3*s,0x263248,fade);
          square(g,xx-s,yy-s,5*s,s,0xd8eee8,fade);
          square(g,xx+(side>0?2:-2)*s,yy,3*s,5*s,0x263248,fade);
          square(g,xx+(side>0?3:-1)*s,yy,s,3*s,0x94bbb5,fade);
        }
        for(let i=0;i<6;i++){
          const side=i%2?1:-1,xx=x+side*(5+i*3)*t*s,yy=y-(5+i%3*5)*Math.sin(t*Math.PI)*s-2*s;
          square(g,xx-s,yy-s,4*s,4*s,0x263248,fade);
          square(g,xx,yy,2*s,s,0xd8eee8,fade);
        }
      }else if(e.kind==='bubble-mistake'){
        // Neutral physical pop; the verdict arrives with the later body reaction.
        for(let i=0;i<3;i++){
          const a=i*2*Math.PI/3-Math.PI/2,r=(5+t*10)*s,xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r;
          square(g,xx-s,yy-s,3*s,3*s,0x263248,fade);
          square(g,xx,yy,s,s,0x94bbb5,fade);
        }
      }else if(e.kind==='wrapped-pop'){
        const color=foodCrumbColor(e.details.foodId);
        for(let i=0;i<5;i++){const side=i%2?1:-1,xx=x+side*(4+i*2)*t*s,yy=y-(4+i%3*4)*Math.sin(t*Math.PI)*s; square(g,xx-s,yy-s,3*s,3*s,0x263248,fade);square(g,xx,yy,2*s,s,color,fade);}
      }else if(e.kind==='bubble-pass'){
        for(let i=0;i<4;i++){
          const xx=x+(i%2?1:-1)*(5+i*3+t*3)*s,yy=y+(t*14-i*4)*s;
          square(g,xx-s,yy-s,4*s,3*s,0x263248,fade*.6);
          square(g,xx,yy,2*s,s,0x94bbb5,fade*.8);
        }
      }else if(e.kind==='miss'){
        for(let i=0;i<3;i++){const xx=x+(i-1)*t*10*s,yy=y-Math.sin(t*Math.PI)*6*s+t*4*s;square(g,xx,yy,2*s,s,0xd7c8a7,fade);}
      }else if(e.kind==='correct'){
        tick(g,x,y-4*t*s,e.pixelScale*s,fade);
      }else if(e.kind==='incorrect'){
        cross(g,x,y+2*t*s,e.pixelScale*s,fade);
      }else if(e.kind==='life-lost'){
        for(const side of[-1,1]){square(g,x+side*(3+t*7)*s,y+5*t*s,2*s,2*s,0xe5a2a1,fade);square(g,x+side*(2+t*4)*s,y-(2+t*4)*s,s,s,0xf6f0dd,fade);}
      }else if(e.kind==='meal'){
        for(const[dx,dy]of[[-22,4],[22,4]])star(g,x+dx*s,y+dy*s,s*.5,fade);
      }else if(e.kind==='stow'){
        star(g,x,y-10*t*s,s*(1-t*.5),fade);
        square(g,x-9*s,y-2*s,2*s,s,0xf2d295,fade);square(g,x+8*s,y-2*s,2*s,s,0xf2d295,fade);
      }
    }
  }
  drawLives(g,base,lives,s){
    for(let i=0;i<3;i++){
      const x=base[0]+(i*12-16)*s,y=base[1]+10*s;
      for(let yy=0;yy<HEART.length;yy++)for(let xx=0;xx<7;xx++)if(HEART[yy][xx]==='#')square(g,x+(xx-1)*s,y+(yy-1)*s,3*s,3*s,0x263248,.95);
      for(let yy=0;yy<HEART.length;yy++)for(let xx=0;xx<7;xx++)if(HEART[yy][xx]==='#')square(g,x+xx*s,y+yy*s,s,s,i<lives?0xe5a2a1:0x626974,i<lives?1:.65);
      if(i<lives)square(g,x+s,y+s,s,s,0xfff1dc);
    }
  }
  drawFull(g,time,point,scale){
    const beat=Math.floor(time/150)%4,alpha=[.45,.8,1,.65][beat],s=scale;
    for(const side of[-1,1]){square(g,point[0]+side*18*s,point[1]-5*s,s,3*s,0xf2d295,alpha);square(g,point[0]+side*21*s,point[1]-8*s,2*s,s,0xf2d295,alpha);}
  }
  drawBusy(g,time,startsAt,endsAt,point,scale){
    const t=clamp((time-startsAt)/(endsAt-startsAt)),s=scale,beat=Math.floor((time-startsAt)/125)%2;
    for(const side of[-1,1]){square(g,point[0]+side*(18+beat*2)*s,point[1]-(3+beat)*s,s,4*s,0xf2d295,1-t*.6);}
    for(let i=0;i<3;i++)if(t<(i+1)/3){square(g,point[0]+(i-1)*4*s,point[1]-12*s-(i%2)*2*s,2*s,2*s,0xe3efec,.8);}
  }
  drawSelected(g,x,y,s,radius){
    const r=radius+2;
    for(const side of[-1,1]){square(g,x+side*r*s,y-r*s,s,4*s,0x273248);square(g,x+(side===1?r-4:-r)*s,y-r*s,4*s,s,0x273248);square(g,x+side*(r-1)*s,y-(r-1)*s,s,3*s,0xf3d391);}
  }
  drawDash(g,point,from,to,startedAt,time,s){
    const length=Math.hypot(to[0]-from[0],to[1]-from[1]);if(length===0)return;
    const dx=(to[0]-from[0])/length,dy=(to[1]-from[1])/length,beat=Math.floor((time-startedAt)/35)%3;
    for(let lane=-1;lane<=1;lane++)for(let i=0;i<4;i++){
      const distance=(42+i*11+beat*2)*s,x=point[0]-dx*distance-dy*lane*10*s,y=point[1]-80*s-dy*distance+dx*lane*10*s;
      square(g,x,y,3*s,s,lane===0?0xf3d391:0xdce9e3,(1-i/5)*.55);
    }
  }
  snapshot(time){return this.events.filter(e=>time>=e.at&&time-e.at<e.duration).map(e=>({kind:e.kind,at:e.at,duration:e.duration,pixelScale:e.pixelScale,point:e.point?[...e.point]:null,offset:[...e.offset]}));}
}
