export function previewRect(anchor,bounds,width,height){
  const left=Math.max(0,Math.floor(anchor[0]+bounds.left-8)),top=Math.max(0,Math.floor(anchor[1]+bounds.top-8));
  const right=Math.min(width,Math.ceil(anchor[0]+bounds.right+8)),bottom=Math.min(height,Math.ceil(anchor[1]+bounds.bottom+8));
  return{left,top,width:right-left,height:bottom-top};
}

// Snapshot the small core once. Pointer frames only translate this contained
// layer; they do not resize, measure, rerasterize text or redraw the scene.
export function createDragPreview(layer,plane,preview,scene){
  let active=false,lastX=0,lastY=0;
  return{
    begin(rect,width,height){
      preview.width=rect.width;preview.height=rect.height;
      preview.getContext('2d').drawImage(scene,rect.left,rect.top,rect.width,rect.height,0,0,rect.width,rect.height);
      Object.assign(preview.style,{left:rect.left+'px',top:rect.top+'px'});
      Object.assign(layer.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',transform:'translate3d(0px,0px,0)'});
      Object.assign(plane.style,{left:-rect.left+'px',top:-rect.top+'px',width:width+'px',height:height+'px'});
      layer.dataset.active='true';preview.hidden=false;scene.hidden=true;active=true;lastX=0;lastY=0;
    },
    move(x,y){
      if(x===lastX&&y===lastY)return;lastX=x;lastY=y;
      layer.style.transform=`translate3d(${x}px,${y}px,0)`;
    },
    end(){
      if(!active)return;active=false;scene.hidden=false;preview.hidden=true;
      delete layer.dataset.active;layer.removeAttribute('style');plane.removeAttribute('style');
      preview.width=0;preview.height=0;
    }
  };
}
