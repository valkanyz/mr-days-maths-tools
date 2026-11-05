(()=>{
'use strict';
const G=GeometryMaker,$=id=>document.getElementById(id),names={triangle:'Triangle',right:'Right triangle',rectangle:'Rectangle',trapezium:'Trapezium',parallelogram:'Parallelogram',circle:'Circle',sector:'Sector',line:'Line segment',angle:'Angle',parallel:'Parallel lines',angleArc:'Angle arc',point:'Add point',text:'Text label'},clone=o=>JSON.parse(JSON.stringify(o));
let state={page:'landscape',fontSize:28,lineWidth:2,grid:false,snap:true,nts:false,objects:[]},selected=null,nextId=1,past=[],future=[],drag=null,placingPoint=false,snapTarget=null,selectedIds=new Set(),edgeChoices=new Map();
const initial=G.preset('triangle',nextId++);initial.labels=['A','B','C'];initial.edges[0]={label:'6 cm'};initial.angles[2]={mark:'arc',label:'x°'};state.objects=[initial];selected=initial.id;
try{const shared=new URLSearchParams(location.search).get('diagram'),saved=shared?JSON.parse(decodeURIComponent(escape(atob(shared)))):JSON.parse(localStorage.getItem('maths-geometry-maker')||'null');if(G.valid(saved)){state=saved;selected=state.objects[0]?.id??null;nextId=Math.max(0,...state.objects.map(o=>o.id))+1;}else if(shared)$('status').textContent='This diagram link is invalid; a fresh diagram is shown.';}catch{$('status').textContent='The saved diagram could not be loaded.';}
const object=()=>state.objects.find(o=>o.id===selected),selection=()=>state.objects.filter(o=>selectedIds.has(o.id)),notify=s=>$('status').textContent=s;
function selectOnly(id){selected=id;selectedIds=new Set(id===null?[]:[id]);}
function updateLinkedAngles(){for(const arc of state.objects){if(arc.type!=='angleArc'||!arc.link)continue;const a=state.objects.find(o=>o.id===arc.link.first.id),b=state.objects.find(o=>o.id===arc.link.second.id);if(!a||!b){arc.link=null;continue;}const points=G.constructAngle(a,arc.link.first.edge,b,arc.link.second.edge);if(points)arc.points=points;}}

function remember(){past.push(JSON.stringify(state));if(past.length>80)past.shift();future=[];}
function persist(){try{localStorage.setItem('maths-geometry-maker',JSON.stringify(state));}catch{notify('Browser storage is full. Save an editable link to keep this diagram.');}}
function draw(){updateLinkedAngles();$('canvas').innerHTML=G.render(state,[...selectedIds],true);if(snapTarget){const ring=document.createElementNS('http://www.w3.org/2000/svg','circle');for(const [k,v]of Object.entries({cx:snapTarget[0],cy:snapTarget[1],r:14,fill:'none',stroke:'black','stroke-width':2,'stroke-dasharray':'3 3','data-editor':'true','pointer-events':'none'}))ring.setAttribute(k,v);$('canvas').querySelector('svg').append(ring);}if(drag?.kind==='marquee'){const svg=$('canvas').querySelector('svg'),r=document.createElementNS('http://www.w3.org/2000/svg','rect'),x=Math.min(drag.x,drag.currentX),y=Math.min(drag.y,drag.currentY);for(const [k,v]of Object.entries({x,y,width:Math.abs(drag.currentX-drag.x),height:Math.abs(drag.currentY-drag.y),fill:'#0000000a',stroke:'#555','stroke-width':2,'stroke-dasharray':'8 5','pointer-events':'none','data-editor':'true'}))r.setAttribute(k,v);svg.append(r);}$('size').textContent=state.page==='portrait'?'800 × 1100':state.page==='square'?'900 × 900':'1200 × 800';$('undo').disabled=!past.length;$('redo').disabled=!future.length;persist();}
const input=(label,key,v,placeholder='')=>`<label>${label}<input data-edit="${key}" value="${G.esc(v??'')}" maxlength="100" placeholder="${placeholder}"></label>`,option=(label,key,v,options)=>`<label>${label}<select data-edit="${key}">${options.map(([n,t])=>`<option value="${n}" ${String(v)===String(n)?'selected':''}>${t}</option>`).join('')}</select></label>`;
function editor(){
 const o=object();
 $('objects').innerHTML=state.objects.map((v,i)=>`<option value="${v.id}" ${v.id===selected?'selected':''}>${i+1}. ${v.type==='point'?'Point':names[v.type]}</option>`).join('');
 $('duplicate').disabled=$('delete').disabled=!selectedIds.size;
 if(selectedIds.size>1){
  const items=selection(),canConstruct=items.length===2&&items.every(item=>G.edges(item).length);
  let angleTools='';
  if(canConstruct){
   angleTools=items.map((item,j)=>{
    const opts=G.edges(item).map(([a,b],i)=>`<option value="${i}" ${i===(edgeChoices.get(item.id)||0)?'selected':''}>Side ${i+1} · points ${a+1}–${b+1}</option>`).join('');
    return `<label>${names[item.type]} ${j+1} side<select data-angle-edge="${item.id}">${opts}</select></label>`;
   }).join('')+'<button data-action="construct-angle">Construct angle between selected sides</button>';
  }
  $('editor').innerHTML=`<p><strong>${items.length} objects selected</strong></p><p class="hint">Drag a selected object to move all selected objects. Shift-click to add or remove objects.</p>${angleTools}`;
  return;
 }
 if(!o){$('editor').innerHTML='<p class="hint">Add or select an object.</p>';return;}
 if(o.type==='point'){$('editor').innerHTML=input('Point label','v0',o.labels[0],'A, B, O…');return;}
 let s=option('Outline','dashed',o.dashed?'1':'0',[['0','Solid'],['1','Dashed']]);
 if(o.type==='text')s+=input('Text','text',o.text,'Label');
 if(o.type==='circle')s+=option('Radius line','radius',o.radius?'1':'0',[['1','Show'],['0','Hide']]);
 s+='<div class="actions"><button data-action="rotate">Rotate 15°</button><button data-action="flip">Flip horizontally</button></div>';
 if(o.type!=='text')s+='<details><summary>Point labels</summary>'+o.points.map((_,i)=>input('Point '+(i+1),'v'+i,o.labels[i],'A, B, O…')).join('')+'</details>';
 const sides=G.edges(o);
 if(sides.length)s+='<details open><summary>Side length labels &amp; marks</summary><p class="hint">Click a label on the diagram to edit it here. Labels are annotations; enter units or expressions such as 6 cm or x.</p>'+sides.map(([a,b],i)=>{
  const e=o.edges[i]||{};
  return '<div class="edge-heading">'+(o.type==='circle'?'Radius':'Side '+(i+1)+' · points '+(a+1)+'–'+(b+1))+'</div>'
   +input('Side label','e'+i+'.label',e.label,'6 cm, x, 2x + 3…')
   +'<div class="pair">'+option('Equal-side ticks','e'+i+'.ticks',e.ticks||0,[[0,'None'],[1,'1 tick'],[2,'2 ticks'],[3,'3 ticks']])+option('Parallel arrows','e'+i+'.parallel',e.parallel||0,[[0,'None'],[1,'1 arrow'],[2,'2 arrows']])+'</div>'
   +option('Side line','e'+i+'.dashed',e.dashed?'1':'0',[['0','Solid'],['1','Dashed']]);
 }).join('')+'</details>';
 const corners=['angle','angleArc'].includes(o.type)?[1]:o.type==='sector'?[0]:!['circle','text','point','line','parallel'].includes(o.type)?o.points.map((_,i)=>i):[];
 if(corners.length)s+='<details open><summary>Angle arcs &amp; labels</summary><p class="hint">Enter an exact angle and press Enter (or click Set angle) to reshape the arc. Drag a label to reposition it; click to edit.</p>'
 +corners.map(i=>{
  const a=o.angles[i]||{},measure=G.angleAt(o,i).degrees,settable=G.canSetAngle(o,i);
  let item='<div class="edge-heading">Angle at point '+(i+1)+'</div>';
  if(settable){
   item+=`<div class="angle-edit"><label>Set exact angle (°)<input type="number" data-angle-target="${i}" min="0.1" max="179.9" step="0.1" value="${Number(measure.toFixed(1))}"></label><button type="button" data-action="set-angle" data-index="${i}">Set angle</button></div>`;
  }
  item+=input('Displayed angle label','a'+i+'.label',a.label,'x°, 2x°, 60°…')
   +option('Angle mark','a'+i+'.mark',a.mark||'none',[['none','None'],['arc','Arc'],['right','Right angle']])
   +`<label class="check"><input type="checkbox" data-edit="a${i}.showMeasure" ${a.showMeasure?'checked':''}> Show actual angle measure</label>`
   +`<label>Arc size (px)<input type="number" data-arc-radius="${i}" min="12" max="150" step="1" value="${a.radius??(a.mark==='right'?23:38)}"></label>`
   +`<button data-measure="${i}">Use measured label</button>`;
  if(o.link&&o.type==='angleArc')item+='<p class="hint">This angle follows its source sides. Setting an angle rotates the second source line, where possible.</p><button data-action="unlink-angle">Make angle independent</button>';
  else if(!settable)item+='<p class="hint">This shape has constrained angles. Change the label or drag the shape’s points.</p>';
  return item;
 }).join('')+'</details>';
 $('editor').innerHTML=s;
}
function sync(){for(const id of ['page','fontSize','lineWidth'])$(id).value=state[id];for(const id of ['grid','snap','nts'])$(id).checked=state[id];draw();editor();}
for(const [type,name]of Object.entries(names)){const b=document.createElement('button');b.textContent=name;b.onclick=()=>{if(type==='point'){placingPoint=!placingPoint;canvas.style.cursor=placingPoint?'crosshair':'';b.setAttribute('aria-pressed',placingPoint);notify(placingPoint?'Click the diagram to place a point. Press Escape to cancel.':'Point placement cancelled.');return;}placingPoint=false;canvas.style.cursor='';if(state.objects.length>=60)return notify('Use up to 60 objects per diagram.');remember();const o=G.preset(type,nextId++);if(type==='right')o.angles[0]={mark:'right'};if(type==='parallel')o.edges=[{parallel:1},{parallel:1}];if(type==='sector')o.angles[0]={mark:'arc',label:'60°'};if(type==='angleArc')o.angles[1]={mark:'arc',showMeasure:true};const shift=(state.objects.length%6)*20;o.points=o.points.map(p=>[p[0]+shift,p[1]+shift]);state.objects.push(o);selectOnly(o.id);sync();};$('tools').append(b);}
$('objects').onchange=()=>{selectOnly(+$('objects').value);draw();editor();};
function angle(o,i){return G.angleAt(o,i);}
function applyExactAngle(i,raw){
 const o=object(),degrees=Number(raw);if(!o||!G.canSetAngle(o,i))return;
 if(!Number.isFinite(degrees)||degrees<0.1||degrees>179.9){notify('Enter an angle between 0.1° and 179.9°.');return;}
 const before=JSON.stringify(state);
 const success=o.link?G.setLinkedAngle(state.objects,o,degrees):G.setAngle(o,i,degrees);
 if(!success){notify('This angle cannot reshape its linked shape. Use “Make angle independent” first, or change the source lines.');editor();return;}
 past.push(before);if(past.length>80)past.shift();future=[];
 o.angles[i]||={};o.angles[i].mark='arc';o.angles[i].showMeasure=true;
 draw();editor();notify('Angle set to '+Number(degrees.toFixed(1))+'°. The arc geometry now matches the measure.');
}

$('editor').oninput=e=>{const key=e.target.dataset.edit,o=object();if(!key||!o)return;const value=e.target.type==='checkbox'?e.target.checked:e.target.value;if(key.startsWith('a')&&key.endsWith('.mark')&&value==='right'&&Math.abs(angle(o,+key.slice(1).split('.')[0]).degrees-90)>.5){notify('A right-angle mark needs a 90° corner. Use a right triangle or rectangle, or reshape the points first.');editor();return;}
 remember();if(key==='text')o.text=value;else if(['dashed','radius'].includes(key))o[key]=value==='1';else if(key.startsWith('v'))o.labels[+key.slice(1)]=value;else{const [index,prop]=key.slice(1).split('.'),list=key[0]==='e'?o.edges:o.angles;list[+index]||={};list[+index][prop]=prop==='showMeasure'?!!value:prop==='dashed'?value==='1':['ticks','parallel'].includes(prop)?+value:value;if(prop==='showMeasure'&&value)list[+index].mark='arc';if(key[0]==='a'&&prop==='label'&&value){list[+index].showMeasure=false;if(!list[+index].mark||list[+index].mark==='none')list[+index].mark='arc';}}draw();};
$('editor').onchange=e=>{
 if(e.target.dataset.angleEdge!==undefined)edgeChoices.set(+e.target.dataset.angleEdge,+e.target.value);
 if(e.target.dataset.angleTarget!==undefined)applyExactAngle(+e.target.dataset.angleTarget,e.target.value);
 if(e.target.dataset.arcRadius!==undefined){
  const i=+e.target.dataset.arcRadius,v=Number(e.target.value),o=object();
  if(!o||!Number.isFinite(v)||v<12||v>150){notify('Arc size must be between 12 and 150.');editor();return;}
  remember();o.angles[i]||={};o.angles[i].radius=v;draw();editor();
 }
};
$('editor').onclick=e=>{
 if(e.target.dataset.action==='set-angle'){const i=+e.target.dataset.index,field=$('editor').querySelector(`[data-angle-target="${i}"]`);if(field)applyExactAngle(i,field.value);return;}
 if(e.target.dataset.action==='unlink-angle'){const o=object();if(o?.link){remember();o.link=null;draw();editor();notify('Angle is independent. Its rays can now be set to any angle without changing the original lines.');}return;}
 if(e.target.dataset.action==='construct-angle'){const [a,b]=selection();if(!a||!b||state.objects.length>=60)return;const ea=edgeChoices.get(a.id)||0,eb=edgeChoices.get(b.id)||0,points=G.constructAngle(a,ea,b,eb);if(!points)return notify('Those sides are parallel or cannot form a usable angle. Choose intersecting sides.');remember();const arc=G.preset('angleArc',nextId++);arc.points=points;arc.angles[1]={mark:'arc',showMeasure:true};arc.link={first:{id:a.id,edge:ea},second:{id:b.id,edge:eb}};state.objects.push(arc);selectOnly(arc.id);sync();notify('Angle arc constructed. Its measurement updates when either source line moves.');return;}const o=object();if(!o)return;if(e.target.dataset.measure!==undefined){remember();const i=+e.target.dataset.measure;o.angles[i]||={};o.angles[i].mark='arc';o.angles[i].showMeasure=true;draw();editor();return;}const action=e.target.dataset.action;if(!action)return;remember();const centre=o.points.reduce((a,p)=>[a[0]+p[0]/o.points.length,a[1]+p[1]/o.points.length],[0,0]);if(o.type==='angleArc')o.link=null;o.points=o.points.map(([x,y])=>{x-=centre[0];y-=centre[1];return action==='flip'?[centre[0]-x,centre[1]+y]:[centre[0]+x*Math.cos(Math.PI/12)-y*Math.sin(Math.PI/12),centre[1]+x*Math.sin(Math.PI/12)+y*Math.cos(Math.PI/12)];});draw();};
for(const id of ['page','fontSize','lineWidth','grid','snap','nts'])$(id).onchange=()=>{const el=$(id);if(el.type==='number'&&!el.validity.valid)return;remember();state[id]=el.type==='checkbox'?el.checked:el.type==='number'?+el.value:el.value;draw();};
$('delete').onclick=()=>{if(!selectedIds.size)return;remember();state.objects=state.objects.filter(o=>!selectedIds.has(o.id));selectOnly(state.objects.at(-1)?.id??null);sync();};$('duplicate').onclick=()=>{const items=selection();if(!items.length||state.objects.length+items.length>60)return;remember();const copies=items.map(src=>{const o=clone(src);o.id=nextId++;o.link=null;o.points=o.points.map(([x,y])=>[x+40,y+40]);return o;});state.objects.push(...copies);selectedIds=new Set(copies.map(o=>o.id));selected=copies.at(-1).id;sync();};
$('clear').onclick=()=>{if(!state.objects.length||confirm('Clear this diagram? You can undo this action.')){remember();state.objects=[];selectOnly(null);sync();}};
$('undo').onclick=()=>{if(!past.length)return;future.push(JSON.stringify(state));state=JSON.parse(past.pop());selectOnly(state.objects.find(o=>o.id===selected)?.id??state.objects[0]?.id??null);sync();};$('redo').onclick=()=>{if(!future.length)return;past.push(JSON.stringify(state));state=JSON.parse(future.pop());selectOnly(state.objects[0]?.id??null);sync();};
selectedIds=new Set(selected===null?[]:[selected]);
const canvas=$('canvas'),coordinates=e=>{const svg=canvas.querySelector('svg');return new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());};
const snapTolerance=()=>{const m=canvas.querySelector('svg').getScreenCTM();return 14/Math.hypot(m.a,m.b);};

function finishMarquee(d){
 const [x0,y0,x1,y1]=[Math.min(d.x,d.currentX),Math.min(d.y,d.currentY),Math.max(d.x,d.currentX),Math.max(d.y,d.currentY)];
 if(Math.hypot(d.currentX-d.x,d.currentY-d.y)<8){if(!d.additive)selectOnly(null);return;}
 const matches=state.objects.filter(o=>{const [a,b,c,e]=G.bounds(o);return c>=x0&&a<=x1&&e>=y0&&b<=y1;}).map(o=>o.id);
 if(!d.additive)selectedIds=new Set(matches);else for(const id of matches)selectedIds.add(id);
 selected=[...selectedIds].at(-1)??null;
}
canvas.onpointerdown=e=>{
 const p=coordinates(e);
 if(placingPoint){if(state.objects.length>=60)return notify('Use up to 60 objects per diagram.');const hit=G.snapPoint([p.x,p.y],state.objects,null,snapTolerance(),state.snap&&!e.altKey);remember();const o=G.preset('point',nextId++);o.points=[hit.point];state.objects.push(o);selectOnly(o.id);placingPoint=false;canvas.style.cursor='';const button=Array.from($('tools').children).find(b=>b.textContent==='Add point');button?.setAttribute('aria-pressed','false');notify('Point added. Enter its label below, or drag it to move.');sync();e.preventDefault();return;}
 const hit=e.target.closest('[data-shape]');
 if(!hit){drag={kind:'marquee',x:p.x,y:p.y,currentX:p.x,currentY:p.y,additive:e.shiftKey};canvas.setPointerCapture(e.pointerId);draw();e.preventDefault();return;}
 const id=+hit.dataset.shape;
 if(e.shiftKey){if(selectedIds.has(id))selectedIds.delete(id);else selectedIds.add(id);selected=[...selectedIds].at(-1)??null;if(e.target.dataset.edge!==undefined)edgeChoices.set(id,+e.target.dataset.edge);draw();editor();e.preventDefault();return;}
 if(!selectedIds.has(id))selectOnly(id);else selected=id;
 if(e.target.dataset.edge!==undefined)edgeChoices.set(id,+e.target.dataset.edge);
 const item=object();if(!item)return;
 remember();
 drag={kind:'object',x:p.x,y:p.y,moved:false,point:e.target.dataset.point!==undefined?+e.target.dataset.point:null,label:e.target.dataset.label||null,original:clone(item),ids:[...selectedIds],originals:selection().map(clone)};
 canvas.setPointerCapture(e.pointerId);draw();editor();e.preventDefault();
};
canvas.onpointermove=e=>{
 if(!drag)return;
 const p=coordinates(e);
 if(drag.kind==='marquee'){drag.currentX=p.x;drag.currentY=p.y;draw();return;}
 const o=object(),dx=p.x-drag.x,dy=p.y-drag.y,orig=drag.original;
 if(!o)return;snapTarget=null;if(Math.hypot(dx,dy)>3)drag.moved=true;
 if(drag.label){const offset=orig.offsets[drag.label]||[0,0];o.offsets[drag.label]=[offset[0]+dx,offset[1]+dy];}
 else if(drag.point!==null){
  const i=drag.point;
  const h=G.snapPoint([p.x,p.y],state.objects,o.id,e.altKey?0:snapTolerance(),state.snap&&!e.altKey);
  let q=h.point,aim=h.target;
  if(!aim&&!e.altKey&&['line','parallel'].includes(o.type)){
   const anchor=orig.points[i%2===0?i+1:i-1];
   const aligned=G.snapAlignedPoint(q,anchor,state.objects,o.id,snapTolerance());
   if(aligned.target){q=aligned.point;aim=aligned.target;}
  }
  snapTarget=aim;o.points=clone(orig.points);
  if(o.type==='angleArc')o.link=null;
  if(o.type==='rectangle'){
   const opp=(i+2)%4,prev=(i+3)%4,next=(i+1)%4,anchor=orig.points[opp],u=[orig.points[prev][0]-anchor[0],orig.points[prev][1]-anchor[1]],v=[orig.points[next][0]-anchor[0],orig.points[next][1]-anchor[1]],un=Math.hypot(...u),vn=Math.hypot(...v);
   if(un>1&&vn>1){const a=((q[0]-anchor[0])*u[0]+(q[1]-anchor[1])*u[1])/(un*un),b=((q[0]-anchor[0])*v[0]+(q[1]-anchor[1])*v[1])/(vn*vn);o.points[prev]=[anchor[0]+a*u[0],anchor[1]+a*u[1]];o.points[next]=[anchor[0]+b*v[0],anchor[1]+b*v[1]];o.points[i]=[anchor[0]+a*u[0]+b*v[0],anchor[1]+a*u[1]+b*v[1]];}
  }else if(o.type==='circle'&&i===0){o.points=orig.points.map(([x,y])=>[x+q[0]-orig.points[0][0],y+q[1]-orig.points[0][1]]);}
  else if(o.type==='sector'){if(i===0)o.points=orig.points.map(([x,y])=>[x+q[0]-orig.points[0][0],y+q[1]-orig.points[0][1]]);else {o.points[i]=q;const other=i===1?2:1,r=G.dist(o.points[0],q),d=G.dist(o.points[0],o.points[other])||1;o.points[other]=[o.points[0][0]+(o.points[other][0]-o.points[0][0])*r/d,o.points[0][1]+(o.points[other][1]-o.points[0][1])*r/d];}}
  else if(o.type==='parallel'){o.points[i]=q;const counterpart=(i+2)%4;o.points[counterpart]=[orig.points[counterpart][0]+q[0]-orig.points[i][0],orig.points[counterpart][1]+q[1]-orig.points[i][1]];}
  else o.points[i]=q;
  o.angles.forEach((mark,j)=>{if(mark?.mark==='right'&&Math.abs(angle(o,j).degrees-90)>.5)mark.mark='none';});
 }else{
  const originals=drag.originals,points=originals.flatMap(item=>item.points),hit=G.snapTranslation(points,[dx,dy],state.objects,drag.ids,e.altKey?0:snapTolerance(),state.snap&&!e.altKey);
  for(const old of originals){const current=state.objects.find(item=>item.id===old.id);if(!current)continue;if(current.type==='angleArc')current.link=null;current.points=old.points.map(([x,y])=>[x+hit.delta[0],y+hit.delta[1]]);}
  snapTarget=hit.target;
 }
 draw();
};
function focusLabel(key,angleArc=false){
 let selector='';
 const o=object();
 if(key?.startsWith('e'))selector=`[data-edit="${key}.label"]`;
 else if(key?.startsWith('a')){
  const i=+key.slice(1);
  selector=o&&G.canSetAngle(o,i)&&o.angles[i]?.showMeasure?`[data-angle-target="${i}"]`:`[data-edit="${key}.label"]`;
 }else if(angleArc)selector='[data-angle-target="1"]';
 if(!selector)return;
 const field=$('editor').querySelector(selector);
 if(field){field.closest('details')?.setAttribute('open','');field.focus();field.select?.();}
}
canvas.onpointerup=canvas.onpointercancel=()=>{
 const clickedLabel=drag?.kind==='object'&&!drag.moved?drag.label:null;
 const clickedArc=drag?.kind==='object'&&!drag.moved&&object()?.type==='angleArc'&&drag.point===null&&!drag.label;
 if(drag?.kind==='marquee')finishMarquee(drag);
 drag=null;snapTarget=null;draw();editor();
 if(clickedLabel||clickedArc)focusLabel(clickedLabel,clickedArc);
};
// Editing labels uses the normal click-to-select gesture, while dragging
// still moves labels without opening a dialog.
canvas.ondblclick=e=>{
 const hit=e.target.closest('[data-shape]');if(!hit)return;
 const id=+hit.dataset.shape;
 if(selectedIds.size!==1||!selectedIds.has(id))selectOnly(id);
 editor();focusLabel(e.target.dataset.label,object()?.type==='angleArc');
 e.preventDefault();
};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){drag=null;placingPoint=false;canvas.style.cursor='';for(const b of $('tools').children)b.removeAttribute('aria-pressed');notify('Point placement cancelled.');return;}if(e.target.matches('input,textarea,select'))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$(e.shiftKey?'redo':'undo').click();}else if(e.key==='Delete'||e.key==='Backspace')$('delete').click();});
const clean=()=>G.render(state,null,false),save=(blob,name)=>{const a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
$('svgExport').onclick=()=>{save(new Blob([clean()],{type:'image/svg+xml'}),'Geometry-Diagram.svg');notify('SVG saved — white background, Arial labels, no editing marks.');};
async function png(){const svg=new DOMParser().parseFromString(clean(),'image/svg+xml').documentElement,url=URL.createObjectURL(new Blob([clean()],{type:'image/svg+xml'}));try{const image=new Image();image.src=url;await image.decode();const c=document.createElement('canvas');c.width=+svg.getAttribute('width')*2;c.height=+svg.getAttribute('height')*2;c.getContext('2d').drawImage(image,0,0,c.width,c.height);return await new Promise(resolve=>c.toBlob(resolve,'image/png'));}finally{URL.revokeObjectURL(url);}}
$('pngExport').onclick=async()=>{try{save(await png(),'Geometry-Diagram.png');notify('PNG saved at double resolution.');}catch{notify('PNG export failed. Save SVG instead.');}};
$('copy').onclick=async()=>{try{await navigator.clipboard.write([new ClipboardItem({'image/png':await png()})]);notify('Diagram copied. Paste it into your test or slides.');}catch{notify('This browser could not copy the image. Use Save PNG instead.');}};
$('print').onclick=()=>window.print();$('share').onclick=async()=>{const url=new URL(location.href);url.search='';url.searchParams.set('diagram',btoa(unescape(encodeURIComponent(JSON.stringify(state)))));if(url.href.length>24000)return notify('This diagram is too large for a link. It is saved in this browser; export an image.');try{await navigator.clipboard.writeText(url.href);notify('Editable diagram link copied.');}catch{notify('Clipboard unavailable.');}};
$('quickPNG').onclick=()=>$('pngExport').click();
$('quickCopy').onclick=()=>$('copy').click();
sync();
})();
