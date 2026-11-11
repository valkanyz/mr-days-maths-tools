/* Drag shapes on a shared grid and measure their combined outline. */
(function(root) {
'use strict';
const Geometry=typeof module!=='undefined'&&module.exports?require('./composite-geometry.js'):root.CompositeGeometry;
if(typeof module!=='undefined'&&module.exports){module.exports=Geometry;return;}
const old=labs.area.setup;
labs.area.setup=function() {
 old();
 const base=update;
 let pieces=[{x:4,y:3,w:8,h:3},{x:4,y:6,w:3,h:4}],selected=0,drag=null,history=[];
 const colours=['#8050b4','#078477','#287caf','#b57618','#bf5268'];
 const names={rectangle:'Rectangle',square:'Square',circle:'Circle',sector:'Sector',triangle:'Triangle',trapezium:'Trapezium'};
 const step=28,ox=28,oy=28;
 $('fShape').insertAdjacentHTML('beforeend','<option value="builder">Drag & drop composite builder</option>');
 $('fShape').value='builder';
 $('controls').querySelector('.section').insertAdjacentHTML('beforebegin',`
 <div id="compositeControls">
  <p>Click to add a shape, or drag it onto the grid. Select a placed shape to choose Add or Subtract.</p>
  <label class="check"><input id="compositeGrid" type="checkbox" checked> Show placement grid</label>
  <label class="check"><input id="pieceDeleteMode" type="checkbox"> Click shapes to delete</label>
  <div class="actions">${Object.entries(names).map(([kind,name])=>'<button type="button" data-piece="'+kind+'">'+name+'</button>').join('')}</div>
  <details><summary>Diagram dimensions</summary>
   <div><label for="compositeUnit">Units</label><select id="compositeUnit"><option value="m">m</option><option value="cm">cm</option><option value="units">units</option></select></div>
   <label class="check"><input id="compositeDimensions" type="checkbox" checked> Show dimensions</label>
   <label class="check"><input id="compositeOverall" type="checkbox" checked> Overall width and height</label>
   <label class="check"><input id="compositeSides" type="checkbox" checked> Exposed side lengths</label>
   <label class="check"><input id="compositeConstruction" type="checkbox"> Show individual shape outlines</label>
  </details>
  <div><label for="pieceSelect">Selected shape</label><select id="pieceSelect"></select></div>
  <div><label for="pieceOperation">Selected shape operation</label>
  <select id="pieceOperation"><option value="add">Add</option><option value="subtract">Subtract</option></select></div>
  <div><label for="pieceWidth">Base / width (units)</label><input id="pieceWidth" type="number" min="0.5" max="28" step="0.5"></div>
  <div><label for="pieceHeight">Height (units)</label><input id="pieceHeight" type="number" min="0.5" max="14" step="0.5"></div>
  <div><label for="pieceRadius">Radius (units)</label><input id="pieceRadius" type="number" min="0.5" max="7" step="0.5"></div>
  <div><label for="pieceAngle">Sector angle (degrees)</label><input id="pieceAngle" type="number" min="1" max="360" step="1"></div>
  <div><label for="pieceApex">Triangle top vertex from left (units)</label><input id="pieceApex" type="number" min="0" max="28" step="0.5"></div>
  <div><label for="pieceTop">Top width (units)</label><input id="pieceTop" type="number" min="0.5" max="28" step="0.5"></div>
  <div class="actions"><button id="pieceRotate">Rotate 90°</button><button id="pieceDuplicate">Duplicate</button><button id="pieceDelete">Delete selected</button><button id="pieceUndo">Undo</button><button id="pieceClear">Clear</button></div>
  <p>Subtracted shapes cut through all added shapes. Arrow keys move the selected shape half a unit. Overlaps count once.</p>
 </div>`);
 const save=()=>{history.push(JSON.stringify({pieces,selected}));if(history.length>100)history.shift();};
 const snap=n=>Math.round(n*2)/2;
 function clamp(piece) {
  piece.kind=names[piece.kind]?piece.kind:'rectangle';
  piece.operation=piece.operation==='subtract'?'subtract':'add';
  piece.rotation=(((Math.round((piece.rotation||0)/90)*90)%360)+360)%360;
  const turned=piece.rotation===90||piece.rotation===270;
  if(piece.kind==='circle'||piece.kind==='sector'){
   piece.r=Math.max(.5,Math.min(7,Number(piece.r)||Number(piece.w)/2||2));
   piece.w=piece.h=2*piece.r;
  }else{
   piece.w=Math.max(.5,Math.min(turned?14:28,Number(piece.w)||3));
   piece.h=Math.max(.5,Math.min(turned?28:14,Number(piece.h)||3));
   if(piece.kind==='square')piece.w=piece.h=Math.min(14,piece.w);
  }
  piece.top=Math.max(.5,Math.min(piece.w,Number(piece.top)||piece.w/2));
  piece.apex=Math.max(0,Math.min(piece.w,Number.isFinite(piece.apex)?piece.apex:piece.w/2));
  piece.angle=Math.max(1,Math.min(360,Number(piece.angle)||90));
  const width=turned?piece.h:piece.w,height=turned?piece.w:piece.h;
  piece.x=Math.max(0,Math.min(28-width,snap(piece.x)));
  piece.y=Math.max(0,Math.min(14-height,snap(piece.y)));
 }
 function description(piece) {
  if(piece.kind==='circle'||piece.kind==='sector')return 'r = '+fmt(piece.r)+(piece.kind==='sector'?', '+fmt(piece.angle)+'°':'');
  if(piece.kind==='trapezium')return 'bases '+fmt(piece.w)+' and '+fmt(piece.top)+', height '+fmt(piece.h);
  return fmt(piece.w)+' × '+fmt(piece.h);
 }
 function sync() {
  $('pieceSelect').innerHTML=pieces.map((p,i)=>'<option value="'+i+'">'+(i+1)+'. '+names[p.kind||'rectangle']+' · '+(p.operation==='subtract'?'Subtract':'Add')+'</option>').join('');
  $('pieceSelect').value=String(selected);
  const p=pieces[selected];
  if(!p)return;
  for(const [id,key]of [['pieceWidth','w'],['pieceHeight','h'],['pieceRadius','r'],['pieceAngle','angle'],['pieceTop','top'],['pieceApex','apex']])$(id).value=p[key]??'';
  $('pieceOperation').value=p.operation||'add';
 }
 function add(kind,x=10,y=4) {
  if(pieces.length>=200){note('Use up to 200 shapes. Delete a shape to add another.');return;}
  save();
  $('pieceDeleteMode').checked=false;
  const piece={kind,operation:'add',x,y,w:kind==='square'?3:5,h:3,r:2,angle:90,top:3};
  clamp(piece);pieces.push(piece);selected=pieces.length-1;sync();run();
 }
 function point(event) {
  const svg=$('viz').querySelector('svg'),p=svg.createSVGPoint();
  p.x=event.clientX;p.y=event.clientY;
  const q=p.matrixTransform(svg.getScreenCTM().inverse());
  return {x:(q.x-ox)/step,y:(q.y-oy)/step};
 }
 for(const button of $('compositeControls').querySelectorAll('[data-piece]')){
  button.style.touchAction='none';
  button.onclick=()=>{if(button.dataset.dragged){delete button.dataset.dragged;return;}add(button.dataset.piece);};
  button.onpointerdown=event=>{button.setPointerCapture(event.pointerId);button.dataset.start=event.clientX+','+event.clientY;};
  button.onpointerup=event=>{
   const [x,y]=button.dataset.start.split(',').map(Number);
   if(Math.hypot(event.clientX-x,event.clientY-y)<8)return;
   button.dataset.dragged='true';
   const p=point(event);
   if(p.x>=0&&p.x<28&&p.y>=0&&p.y<14)add(button.dataset.piece,p.x,p.y);
  };
 }
 $('pieceSelect').onchange=()=>{selected=Number($('pieceSelect').value);sync();run();};
 for(const [id,key]of [['pieceWidth','w'],['pieceHeight','h'],['pieceRadius','r'],['pieceAngle','angle'],['pieceTop','top'],['pieceApex','apex']]){
  $(id).oninput=()=>{
   const value=Number($(id).value),piece=pieces[selected];
   if(!piece||!Number.isFinite(value)||value<Number($(id).min))return;
   save();piece[key]=value;clamp(piece);sync();run();
  };
  $(id).dataset.keepVisible='true';
 }
 $('pieceOperation').onchange=()=>{if(!pieces[selected])return;save();pieces[selected].operation=$('pieceOperation').value;sync();run();};
 const action=(id,fn)=>$(id).onclick=()=>{save();fn();selected=Math.min(selected,pieces.length-1);sync();run();};
 action('pieceRotate',()=>{const p=pieces[selected];if(p){p.rotation=(p.rotation||0)+90;clamp(p);}});
 action('pieceDuplicate',()=>{const p=pieces[selected];if(p&&pieces.length<200){pieces.push({...p,x:p.x+.5,y:p.y+.5});selected=pieces.length-1;clamp(pieces[selected]);}});
 const deleteSelected=()=>{
  if(selected<0)return;
  save();pieces.splice(selected,1);selected=Math.min(selected,pieces.length-1);
  drag=null;sync();run();
 };
 $('pieceDelete').onclick=deleteSelected;
 action('pieceClear',()=>{pieces=[];});
 $('pieceUndo').onclick=()=>{if(history.length){({pieces,selected}=JSON.parse(history.pop()));sync();run();}};
 $('controls').insertAdjacentHTML('beforeend','<input type="hidden" id="compositeState">');
 $('compositeState').oninput=()=>{
  try{
   const state=JSON.parse($('compositeState').value);
   if(!Array.isArray(state.pieces)||state.pieces.length>200||!state.pieces.every(p=>['x','y','w','h'].every(k=>Number.isFinite(p[k]))))return;
   pieces=state.pieces;pieces.forEach(clamp);
   selected=Math.max(-1,Math.min(pieces.length-1,Number(state.selected)||0));sync();
  }catch{}
 };
 const oldClick=$('viz').onclick;
 $('viz').onclick=event=>{if($('fShape').value!=='builder')oldClick?.(event);};
 $('viz').onpointerdown=event=>{
  if($('fShape').value!=='builder')return;
  const el=event.target.closest('[data-part]');
  if(!el)return;
  event.preventDefault();selected=Number(el.dataset.part);
  if($('pieceDeleteMode').checked){deleteSelected();return;}
  save();
  const p=point(event);drag={dx:p.x-pieces[selected].x,dy:p.y-pieces[selected].y};
  $('viz').setPointerCapture(event.pointerId);sync();run();$('viz').querySelector('svg').focus();
 };
 $('viz').onpointermove=event=>{
  if(!drag)return;
  const p=point(event);pieces[selected].x=p.x-drag.dx;pieces[selected].y=p.y-drag.dy;
  clamp(pieces[selected]);run();
 };
 $('viz').onpointerup=$('viz').onpointercancel=()=>{drag=null;};
 $('viz').onkeydown=event=>{
  if($('fShape').value!=='builder'||selected<0)return;
  if(event.key==='Delete'||event.key==='Backspace'){
   event.preventDefault();deleteSelected();$('viz').querySelector('svg').focus();return;
  }
  const delta={ArrowLeft:[-.5,0],ArrowRight:[.5,0],ArrowUp:[0,-.5],ArrowDown:[0,.5]}[event.key];
  if(!delta)return;
  event.preventDefault();save();pieces[selected].x+=delta[0];pieces[selected].y+=delta[1];
  clamp(pieces[selected]);run();$('viz').querySelector('svg').focus();
 };
 update=()=>{
  $('compositeState').value=JSON.stringify({pieces,selected});
  const active=$('fShape').value==='builder';
  $('compositeControls').hidden=!active;
  if(!active){$('viz').style.touchAction='auto';$('viz').style.height='';return base();}
  for(const id of ['fGrid','fWidth','fHeight','topWidth','cutHeight','slant','decompose'])showControl(id,false);
  $('clearArea').hidden=true;
  const p=pieces[selected],round=p&&(p.kind==='circle'||p.kind==='sector');
  for(const id of ['pieceOperation','pieceWidth','pieceHeight','pieceRadius','pieceAngle','pieceTop','pieceApex','pieceRotate','pieceDuplicate','pieceDelete'])$(id).disabled=!p;
  showControl('pieceWidth',!!p&&!round);showControl('pieceHeight',!!p&&!round&&p.kind!=='square');
  showControl('pieceRadius',!!round);showControl('pieceAngle',p?.kind==='sector');showControl('pieceTop',p?.kind==='trapezium');showControl('pieceApex',p?.kind==='triangle');
  if(p){
   $('pieceTop').max=p.w;$('pieceApex').max=p.w;
   const turned=p.rotation===90||p.rotation===270;
   $('pieceWidth').max=turned?14:28;$('pieceHeight').max=turned?28:14;
  }
  $('pieceUndo').disabled=!history.length;
  $('viz').style.touchAction='none';
  $('viz').style.height='clamp(380px,58dvh,650px)';
  const construction=$('compositeConstruction').checked,deleteMode=$('pieceDeleteMode').checked;
  const unit=$('compositeUnit').value;
  const measurement=Geometry.measure(pieces);
  let drawing=$('compositeGrid').checked?'<rect x="28" y="28" width="784" height="392" fill="#faf7fc" stroke="#cbbbd8"/>':'';
  if($('compositeGrid').checked){
   for(let x=0;x<=28;x++)drawing+='<path d="M'+(ox+x*step)+' 28V420" stroke="#e3d9eb"/>';
   for(let y=0;y<=14;y++)drawing+='<path d="M28 '+(oy+y*step)+'H812" stroke="#e3d9eb"/>';
  }
  const path=p=>Geometry.path(p);
  drawing+='<defs><mask id="composite-cutouts" maskUnits="userSpaceOnUse" x="0" y="0" width="28" height="14"><rect width="28" height="14" fill="white"/>'
   +pieces.filter(p=>p.operation==='subtract').map(p=>'<path d="'+path(p)+'" fill="black"/>').join('')+'</mask></defs>';
  drawing+='<g transform="translate(28 28) scale(28)" opacity=".5" mask="url(#composite-cutouts)">'
   +pieces.filter(p=>p.operation!=='subtract').map(p=>'<path d="'+path(p)+'" fill="#14a98d"/>').join('')+'</g>';
  pieces.forEach((p,i)=>{
   const subtract=p.operation==='subtract',colour=subtract?'#ba3448':colours[i%colours.length];
   const title=names[p.kind||'rectangle']+' '+(i+1)+' · '+(subtract?'Subtract':'Add')+' · '+description(p);
   drawing+='<g data-part="'+i+'" style="cursor:'+(deleteMode?'crosshair':'grab')+'"><path transform="translate(28 28) scale(28)" d="'+path(p)+'" fill="'+(subtract&&construction?'#fff0f0':'transparent')+'" fill-opacity="'+(subtract?'.18':'1')+'" stroke="'+(construction?colour:'none')+'" stroke-width="'+(i===selected?.1:.04)+'"'+(subtract||i===selected?' stroke-dasharray=".2 .12"':'')+'/><title>'+esc(title)+(deleteMode?'. Click to delete.':'. Drag to move.')+'</title></g>';

  });
  if($('fBoundary').checked)drawing+='<g transform="translate(28 28) scale(28)" pointer-events="none" fill="none" stroke="#1c2530" stroke-width=".09">'
   +measurement.boundaries.map(edge=>'<path d="'+Geometry.pathSegment(edge)+'"/>').join('')+'</g>';
  if($('compositeDimensions').checked){
   drawing+=root.CompositeDimensions.render(measurement,pieces,{
    unit,overall:$('compositeOverall').checked,sides:$('compositeSides').checked
   });
  }
  svg(drawing,'Composite shape with textbook dimension arrows');
  const diagram=$('viz').querySelector('svg');
  diagram.setAttribute('tabindex','0');
  let box=root.CompositeDimensions.extent(measurement.boundaries);
  const included=pieces.filter((piece,i)=>construction||i===selected||!box);
  for(const piece of included){
   const turned=piece.rotation===90||piece.rotation===270;
   const right=piece.x+(turned?piece.h:piece.w),bottom=piece.y+(turned?piece.w:piece.h);
   box=box?{left:Math.min(box.left,piece.x),right:Math.max(box.right,right),
    top:Math.min(box.top,piece.y),bottom:Math.max(box.bottom,bottom)}
    :{left:piece.x,right,top:piece.y,bottom};
  }
  if($('compositeGrid').checked||!box)box={left:0,right:28,top:0,bottom:14};
  diagram.setAttribute('viewBox',[(28+box.left*step)-150,(28+box.top*step)-75,
   (box.right-box.left)*step+300,(box.bottom-box.top)*step+200].join(' '));
  formula('Area of added shapes − removed regions');
  results([['Area',fmt(measurement.area,3)+(unit==='units'?' square units':' '+unit+'²')],['Perimeter',fmt(measurement.perimeter,3)+' '+unit]]);
  legend([['Composite shape','#14a98d'],...(construction?[['Selected shape: dashed outline',C.purple],['Subtract: red dashed outline','#ba3448']]:[])]);
  note((deleteMode?'Click a shape to delete it. Use Undo to restore it. ':'')+'Dimension arrows measure the finished outline and cut-outs. Overall dimensions sit outside the shape; curved boundaries show their radius. Use Diagram dimensions to choose which labels are shown. Overlapping added shapes count once. Values are rounded to 3 decimal places.');
  table(['Measurement','Value'],[['Area ('+(unit==='units'?'square units':unit+'²')+')',measurement.area],['Perimeter ('+unit+')',measurement.perimeter]]);
 };
 pieces.forEach(clamp);sync();
};
if(current==='area')launch('area');
})(typeof window!=='undefined'?window:globalThis);
