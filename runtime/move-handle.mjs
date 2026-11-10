// Shared long-press gesture; each game owns placement and rendering.
export const HOLD_TO_MOVE_MS=450;
export function createMoveHandle(button,callbacks){
  let press=null,timer=null,tap=false,disposed=false,cancelledPointer=null;
  const listeners=[];
  const on=(name,fn)=>{button.addEventListener(name,fn);listeners.push(()=>button.removeEventListener(name,fn));};
  const eat=e=>{e.preventDefault();e.stopPropagation();};
  function releaseTail(){const id=cancelledPointer;cancelledPointer=null;if(id!==null&&button.hasPointerCapture(id))button.releasePointerCapture(id);}
  function release(keepCapture=false){
    const current=press;press=null;if(timer!==null)clearTimeout(timer);timer=null;
    delete button.dataset.holding;delete button.dataset.dragging;
    if(current&&button.hasPointerCapture(current.id)){if(keepCapture)cancelledPointer=current.id;else button.releasePointerCapture(current.id);}
    return current;
  }
  function cancel({untilRelease=false}={}){tap=false;if(!press){if(!untilRelease)releaseTail();return false;}release(untilRelease);if(!untilRelease)releaseTail();callbacks.onCancel();return true;}
  function fail(error){release();releaseTail();tap=false;callbacks.onError(error);}
  on('pointerdown',e=>{
    if(disposed||press||e.button!==0||e.isPrimary===false||!callbacks.canMove())return;
    eat(e);tap=false;releaseTail();press={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,active:false};
    try{
      const current=press;button.setPointerCapture(e.pointerId);button.dataset.holding='true';callbacks.onGrab();
      if(press!==current)return;
      timer=setTimeout(()=>{
        timer=null;if(press!==current)return;press.active=true;button.dataset.dragging='true';
        try{callbacks.onActivate();callbacks.onMove(press.lastX-press.x,press.lastY-press.y);}catch(error){fail(error);}
      },HOLD_TO_MOVE_MS);
    }catch(error){fail(error);}
  });
  on('pointermove',e=>{
    if(!press||press.id!==e.pointerId)return;eat(e);press.lastX=e.clientX;press.lastY=e.clientY;
    if(press.active)try{callbacks.onMove(e.clientX-press.x,e.clientY-press.y);}catch(error){fail(error);}
  });
  on('pointerup',e=>{
    if(cancelledPointer===e.pointerId){eat(e);releaseTail();return;}
    if(!press||press.id!==e.pointerId)return;eat(e);
    const current=release(),dx=e.clientX-current.x,dy=e.clientY-current.y,rect=button.getBoundingClientRect();
    tap=!current.active&&Math.hypot(dx,dy)<=6&&e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom;
    try{callbacks.onDrop(current.active,dx,dy);}catch(error){fail(error);}
  });
  on('pointercancel',()=>{cancel();});on('lostpointercapture',e=>{if(press?.id===e.pointerId||cancelledPointer===e.pointerId)cancel();});
  // Keep the original game-owned click; never replay it onto the task beneath.
  on('click',e=>{eat(e);const shortTap=tap;tap=false;if(shortTap)callbacks.onTap();});
  on('contextmenu',e=>{if(press)eat(e);});
  return{cancel,isPressed:()=>!!press,dispose(){if(disposed)return;disposed=true;cancel();for(const remove of listeners)remove();}};
}
