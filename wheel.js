const NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
const point = (r,a) => [500 + r*Math.cos(a),500 + r*Math.sin(a)];
const xy = p => p.map(n=>n.toFixed(3)).join(' ');
const signedAngle = degrees => ((degrees+180)%360+360)%360-180;
const upright = degrees => {
  let angle=signedAngle(degrees);
  if(angle>90)angle-=180;
  if(angle< -90)angle+=180;
  return angle;
};
const element = (name, attrs={}) => {
  const el=document.createElementNS(NS,name);
  for(const [key,value] of Object.entries(attrs)) el.setAttribute(key,value);
  return el;
};
function sectorPath(inner,outer,start,end) {
  if(end-start>=TAU-.0001) {
    const mid=start+Math.PI;
    return `M ${xy(point(outer,start))} A ${outer} ${outer} 0 1 1 ${xy(point(outer,mid))} A ${outer} ${outer} 0 1 1 ${xy(point(outer,end))} L ${xy(point(inner,end))} A ${inner} ${inner} 0 1 0 ${xy(point(inner,mid))} A ${inner} ${inner} 0 1 0 ${xy(point(inner,start))} Z`;
  }
  const large=end-start>Math.PI?1:0;
  return `M ${xy(point(outer,start))} A ${outer} ${outer} 0 ${large} 1 ${xy(point(outer,end))} ${inner?`L ${xy(point(inner,end))} A ${inner} ${inner} 0 ${large} 0 ${xy(point(inner,start))}`:'L 500 500'} Z`;
}
export function drawWheel(container,model,onSelect=()=>{}) {
  const svg=element('svg',{viewBox:'0 0 1000 1000',role:'group','aria-label':`${model.definition.title}. Scroll or drag to rotate. Up and Down, or W and S, select around a ring. Left and Right, or A and D, select inward and outward.`});
  const title=element('title');title.textContent=model.definition.title;svg.append(title);
  const layer=element('g');svg.append(layer);
  const hintRadius=530,hintStart=-50*Math.PI/180,hintEnd=-25*Math.PI/180;
  const start=point(hintRadius,hintStart),end=point(hintRadius,hintEnd);
  const head=(angle,direction,side)=>{
    const tip=point(hintRadius,angle);
    const tangent=[-Math.sin(angle),Math.cos(angle)];
    const radial=[Math.cos(angle),Math.sin(angle)];
    return tip.map((n,i)=>n-direction*tangent[i]*24+radial[i]*10*side);
  };
  const hint=element('path',{class:'rotation-hint','aria-hidden':'true',
    d:`M ${xy(start)} A ${hintRadius} ${hintRadius} 0 0 1 ${xy(end)} M ${xy(head(hintStart,-1,1))} L ${xy(start)} L ${xy(head(hintStart,-1,-1))} M ${xy(head(hintEnd,1,1))} L ${xy(end)} L ${xy(head(hintEnd,1,-1))}`});
  svg.append(hint);
  const labels=[];
  let angle=0,frame=null,rotationTravel=0,hintVisible=true;
  const rotate=()=>{
    frame=null;
    layer.setAttribute('transform',`rotate(${angle} 500 500)`);
    for(const {label,position,bearing} of labels){
      const localRotation=bearing===null?-angle:upright(bearing+angle)-angle;
      label.setAttribute('transform',`translate(${position}) rotate(${localRotation})`);
    }
  };
  const turn=delta=>{
    angle=(angle+delta)%360;
    if(hintVisible){
      rotationTravel+=Math.abs(delta);
      if(rotationTravel>180){hintVisible=false;hint.classList.add('is-hidden')}
    }
    if(frame===null)frame=requestAnimationFrame(rotate);
  };
  // Empty space around the wheel is part of the scroll interaction area.
  document.addEventListener('wheel',event=>{
    if(event.defaultPrevented||event.ctrlKey)return;
    const delta=Math.abs(event.deltaY)>=Math.abs(event.deltaX)?event.deltaY:event.deltaX;
    if(!delta)return;
    event.preventDefault();
    const unit=event.deltaMode===1?16:event.deltaMode===2?container.clientHeight:1;
    const bounds=svg.getBoundingClientRect();
    const direction=event.clientX<bounds.left+bounds.width/2?-1:1;
    turn(delta*unit*.12*direction);
  },{passive:false});
  let drag=null,suppressClick=false;
  const endDrag=()=>{
    if(!drag)return;
    const pointerId=drag.pointerId;
    drag=null;
    if(svg.hasPointerCapture(pointerId))svg.releasePointerCapture(pointerId);
    svg.classList.remove('is-dragging');
    document.removeEventListener('pointerup',endPointer);
    document.removeEventListener('pointercancel',endPointer);
    document.removeEventListener('pointerdown',cancelForAdditionalTouch);
    highlight(selected);
  };
  const endPointer=event=>{
    if(event.pointerId!==drag?.pointerId)return;
    if(event.type==='pointercancel')suppressClick=true;
    endDrag();
  };
  const cancelForAdditionalTouch=event=>{
    if(event.pointerType==='touch'&&!event.isPrimary&&drag){suppressClick=true;endDrag()}
  };
  svg.addEventListener('pointerdown',event=>{
    if(!event.isPrimary){
      if(drag){suppressClick=true;endDrag()}
      return;
    }
    if(event.button!==0)return;
    endDrag();
    suppressClick=false;
    const bounds=svg.getBoundingClientRect();
    drag={
      pointerId:event.pointerId,
      startX:event.clientX,startY:event.clientY,
      lastX:event.clientX,lastY:event.clientY,
      centerX:bounds.left+bounds.width/2,
      centerY:bounds.top+bounds.height/2,
      active:false
    };
    document.addEventListener('pointerup',endPointer);
    document.addEventListener('pointercancel',endPointer);
    document.addEventListener('pointerdown',cancelForAdditionalTouch);
  });
  svg.addEventListener('pointermove',event=>{
    if(event.pointerId!==drag?.pointerId)return;
    if(event.pointerType==='mouse'&&event.buttons===0){endDrag();return}
    if(!drag.active){
      const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
      if(Math.hypot(dx,dy)<6)return;
      drag.active=true;
      suppressClick=true;
      svg.setPointerCapture(event.pointerId);
      svg.classList.add('is-dragging');
      highlight(selected);
    }
    event.preventDefault();
    const previousX=drag.lastX-drag.centerX,previousY=drag.lastY-drag.centerY;
    const x=event.clientX-drag.centerX,y=event.clientY-drag.centerY;
    const dx=x-previousX,dy=y-previousY;
    const distanceSquared=dx*dx+dy*dy;
    const closest=distanceSquared
      ?Math.max(0,Math.min(1,-(previousX*dx+previousY*dy)/distanceSquared))
      :0;
    // A path through the hub has no clear rotation; rebaseline without a half-turn jump.
    if(Math.hypot(previousX+closest*dx,previousY+closest*dy)>=8){
      // The signed angle between vectors follows circular drags across every quadrant.
      turn(Math.atan2(previousX*y-previousY*x,previousX*x+previousY*y)*180/Math.PI);
    }
    drag.lastX=event.clientX;drag.lastY=event.clientY;
  });
  svg.addEventListener('lostpointercapture',event=>{
    if(event.target===svg&&event.pointerId===drag?.pointerId)endDrag();
  });
  svg.addEventListener('click',event=>{
    if(!suppressClick)return;
    suppressClick=false;
    event.preventDefault();
    event.stopImmediatePropagation();
  },true);
  const depth=Math.max(...[...model.nodes.values()].map(n=>n.depth));
  const boundaries=Array.from({length:depth+1},(_,i)=>i===0?0:depth===1?498:498*(.42+(i-1)*.58/(depth-1)));
  const sectors=new Map();
  const bearings=new Map();
  const rings=Array.from({length:depth+1},()=>[]);
  const lastChildren=new Map();
  const outlines=element('g',{class:'wheel-outlines','pointer-events':'none','aria-hidden':'true'});
  const selectedOutline=element('path',{class:'selection-outline'});
  const focusOutline=element('path',{class:'focus-outline'});
  outlines.append(selectedOutline,focusOutline);
  let selected=null;
  const related=(a,b)=>{
    let node=model.nodes.get(a);
    while(node){if(node.id===b)return true;node=model.nodes.get(node.parentId)}
    return false;
  };
  const highlight=id=>{
    let selectedPath='',focusPath='';
    for(const [key,g] of sectors){
      g.classList.toggle('is-muted',Boolean(id)&&!related(id,key));
      g.setAttribute('aria-pressed',String(key===selected));
      if(key===selected)selectedPath=g.querySelector('path').getAttribute('d');
      if(key!==selected&&g.matches(':focus-visible'))focusPath=g.querySelector('path').getAttribute('d');
    }
    selectedOutline.setAttribute('d',selectedPath);
    focusOutline.setAttribute('d',focusPath);
  };
  const select=id=>{
    selected=id;
    for(let node=model.nodes.get(id);node&&node.parentId!==model.rootId;node=model.nodes.get(node.parentId)){
      lastChildren.set(node.parentId,node.id);
    }
    highlight(selected);
    onSelect(selected===null?null:model.nodes.get(selected));
  };
  const visit=(ids,start,end)=>{
    ids.forEach((id,index)=>{
      const node=model.nodes.get(id);
      const a=start+(end-start)*index/ids.length;
      const b=start+(end-start)*(index+1)/ids.length;
      const inner=boundaries[node.depth-1];
      const outer=node.children.length?boundaries[node.depth]:498;
      const middle=(a+b)/2;
      bearings.set(id,middle*180/Math.PI);
      rings[node.depth].push(id);
      const g=element('g',{class:'sector',role:'button',tabindex:'-1','aria-label':node.label,'aria-pressed':'false','data-node-id':id});
      const ring=(node.depth-1)/Math.max(1,depth-1);
      g.style.setProperty('--family-color',node.color);
      g.style.setProperty('--light-weight',`${100-ring*48}%`);
      g.style.setProperty('--dark-weight',`${46-ring*12}%`);
      const path=element('path',{d:sectorPath(inner,outer,a,b)});
      const name=element('title');name.textContent=node.label;
      const radius=node.depth===1?outer*.64:(inner+outer)/2;
      const position=xy(point(radius,middle));
      const bearing=node.depth===1?null:middle*180/Math.PI;
      const label=element('text',{transform:`translate(${position}) rotate(${bearing===null?0:upright(bearing)})`,'text-anchor':'middle','dominant-baseline':'central','font-size':node.depth===1?24:18,'font-weight':node.depth===1?600:400});
      label.textContent=node.label;
      const maxLabelWidth=node.depth===1
        ?2*radius*Math.sin(Math.min(Math.PI,b-a)/2)*.9
        :Math.max(1,outer-inner-22);
      labels.push({label,position,bearing,maxLabelWidth});
      g.append(name,path,label);
      g.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch'&&!drag?.active)highlight(id)});
      g.addEventListener('pointerleave',()=>highlight(selected));
      g.addEventListener('focus',()=>highlight(id));
      g.addEventListener('blur',()=>highlight(selected));
      const toggle=()=>select(selected===id?null:id);
      g.addEventListener('click',toggle);
      g.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle()}
        if(event.key==='Escape')select(null);
      });
      sectors.set(id,g);layer.append(g);
      if(node.children.length)visit(node.children,a,b);
    });
  };
  visit(model.nodes.get(model.rootId).children,-Math.PI/3,TAU-Math.PI/3);
  layer.append(outlines);
  container.replaceChildren(svg);
  const defaultId=rings[1].includes('peaceful')?'peaceful':rings[1][0];
  const nearest=(ids,bearing)=>ids.reduce((best,id)=>
    Math.abs(signedAngle(bearings.get(id)-bearing))<Math.abs(signedAngle(bearings.get(best)-bearing))?id:best);
  const keyActions={arrowup:'previous',w:'previous',arrowdown:'next',s:'next',arrowleft:'parent',a:'parent',arrowright:'child',d:'child'};
  document.addEventListener('keydown',event=>{
    if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.isComposing)return;
    if(event.target.isContentEditable||event.target.closest?.('input, textarea, select'))return;
    const action=keyActions[event.key.toLowerCase()];
    if(!Object.hasOwn(keyActions,event.key.toLowerCase()))return;
    event.preventDefault();
    const current=model.nodes.get(selected);
    let nextId,rotateIntoView=!current;
    if(!current){
      nextId=defaultId;
    }else if(action==='previous'||action==='next'){
      const ring=rings[current.depth];
      const step=action==='previous'?-1:1;
      nextId=ring[(ring.indexOf(current.id)+step+ring.length)%ring.length];
      rotateIntoView=true;
    }else if(action==='parent'){
      if(current.parentId===model.rootId)return;
      nextId=current.parentId;
    }else{
      if(!current.children.length)return;
      nextId=lastChildren.get(current.id)||nearest(current.children,bearings.get(current.id));
    }
    select(nextId);
    const sector=sectors.get(nextId);
    sector.focus({preventScroll:true});
    if(!rotateIntoView&&frame!==null){
      cancelAnimationFrame(frame);
      rotate();
    }
    const bounds=sector.querySelector('text').getBoundingClientRect();
    if(rotateIntoView||bounds.left<0||bounds.right>document.documentElement.clientWidth||bounds.top<0||bounds.bottom>document.documentElement.clientHeight){
      turn(-signedAngle(bearings.get(nextId)+angle));
    }
  });
  const fitLabels=()=>{
    // Removing any previous fit first lets labels regain their natural width on resize.
    for(const {label} of labels){label.removeAttribute('textLength');label.removeAttribute('lengthAdjust')}
    const bounds=container.getBoundingClientRect();
    if(bounds.left>=0&&bounds.right<=document.documentElement.clientWidth)return;
    const measured=labels.map(({label,maxLabelWidth})=>({label,maxLabelWidth,width:label.getComputedTextLength()}));
    for(const {label,maxLabelWidth,width} of measured){
      if(width>maxLabelWidth){label.setAttribute('textLength',maxLabelWidth);label.setAttribute('lengthAdjust','spacingAndGlyphs')}
    }
  };
  let fitFrame=null;
  window.addEventListener('resize',()=>{
    if(fitFrame!==null)return;
    fitFrame=requestAnimationFrame(()=>{fitFrame=null;fitLabels()});
  });
  angle=-signedAngle(bearings.get(defaultId));
  rotate();
  fitLabels();
  return {clearSelection:(restoreFocus=true)=>{
    const previous=sectors.get(selected);
    select(null);
    if(restoreFocus)previous?.focus();
  }};
}
