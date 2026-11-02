/* Grid-snapped composite rectangles; measure the union, including hole boundaries. */
(function(root){
'use strict';
function measure(pieces){
 const cells=new Set();for(const p of pieces)for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++)cells.add(x+','+y);
 const edges=[];for(const cell of cells){const[x,y]=cell.split(',').map(Number);for(const[dx,dy,a,b]of [[0,-1,[x,y],[x+1,y]],[1,0,[x+1,y],[x+1,y+1]],[0,1,[x+1,y+1],[x,y+1]],[-1,0,[x,y+1],[x,y]]])if(!cells.has((x+dx)+','+(y+dy)))edges.push([a,b])}
 return{area:cells.size,perimeter:edges.length,edges};
}
if(typeof module!=='undefined'&&module.exports){module.exports={measure};return}
const old=labs.area.setup;
labs.area.setup=function(){
 old();const base=update;let pieces=[{x:4,y:3,w:8,h:3},{x:4,y:6,w:3,h:4}],selected=0,drag=null,history=[];
 const colours=['#8050b4','#078477','#287caf','#b57618','#bf5268'],step=28,ox=28,oy=28;
 $('fShape').insertAdjacentHTML('beforeend','<option value="builder">Drag & drop composite builder</option>');$('fShape').value='builder';
 $('controls').querySelector('.section').insertAdjacentHTML('beforebegin',`<div id="compositeControls"><p>Drag a piece onto the grid, or click to add it. Drag placed pieces to move them.</p><div class="actions"><button type="button" data-piece="rectangle">▰ Rectangle</button><button type="button" data-piece="square">■ Square</button></div><label for="pieceSelect">Selected piece</label><select id="pieceSelect"></select><label for="pieceWidth">Width (units)</label><input id="pieceWidth" type="number" min="1" max="28" step="1" value="8"><label for="pieceHeight">Height (units)</label><input id="pieceHeight" type="number" min="1" max="14" step="1" value="3"><div class="actions"><button id="pieceRotate">Rotate</button><button id="pieceDuplicate">Duplicate</button><button id="pieceDelete">Delete</button><button id="pieceUndo">Undo</button><button id="pieceClear">Clear</button></div><p>Arrow keys move the selected piece one unit. Shared edges do not count towards perimeter. Overlaps count once.</p></div>`);
 const save=()=>history.push(JSON.stringify({pieces,selected}));
 const clamp=p=>{p.w=Math.max(1,Math.min(28,Math.round(p.w)));p.h=Math.max(1,Math.min(14,Math.round(p.h)));p.x=Math.max(0,Math.min(28-p.w,Math.round(p.x)));p.y=Math.max(0,Math.min(14-p.h,Math.round(p.y)))};
 const sync=()=>{$('pieceSelect').innerHTML=pieces.map((p,i)=>`<option value="${i}">Piece ${i+1} · ${p.w} × ${p.h}</option>`).join('');$('pieceSelect').value=selected;const p=pieces[selected];if(p){$('pieceWidth').value=p.w;$('pieceHeight').value=p.h}};
 const add=(kind,x=10,y=4)=>{save();pieces.push({x,y,w:kind==='square'?3:5,h:3});selected=pieces.length-1;clamp(pieces[selected]);sync();run()};
 const point=e=>{const svg=$('viz').querySelector('svg'),p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());return{x:(q.x-ox)/step,y:(q.y-oy)/step}};
 for(const b of $('compositeControls').querySelectorAll('[data-piece]')){b.style.touchAction='none';b.onclick=()=>{if(b.dataset.dragged){delete b.dataset.dragged;return}add(b.dataset.piece)};b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);b.dataset.start=e.clientX+','+e.clientY};b.onpointerup=e=>{const[a,c]=b.dataset.start.split(',').map(Number);if(Math.hypot(e.clientX-a,e.clientY-c)<8)return;b.dataset.dragged='true';const p=point(e);if(p.x>=0&&p.x<28&&p.y>=0&&p.y<14)add(b.dataset.piece,p.x,p.y)};}
 $('pieceSelect').onchange=()=>{selected=Number($('pieceSelect').value);sync();run()};
 for(const[id,key]of [['pieceWidth','w'],['pieceHeight','h']])$(id).oninput=()=>{const v=Number($(id).value);if(!Number.isFinite(v)||v<1||!pieces[selected])return;save();pieces[selected][key]=v;clamp(pieces[selected]);sync();run()};
 const action=(id,fn)=>$(id).onclick=()=>{save();fn();selected=Math.min(selected,pieces.length-1);sync();run()};
 action('pieceRotate',()=>{const p=pieces[selected];if(p){[p.w,p.h]=[p.h,p.w];clamp(p)}});
 action('pieceDuplicate',()=>{const p=pieces[selected];if(p){pieces.push({...p,x:p.x+1,y:p.y+1});selected=pieces.length-1;clamp(pieces[selected])}});
 action('pieceDelete',()=>{if(selected>=0)pieces.splice(selected,1)});action('pieceClear',()=>{pieces=[]});
 $('pieceUndo').onclick=()=>{if(history.length){({pieces,selected}=JSON.parse(history.pop()));sync();run()}};
 for(const id of ['pieceWidth','pieceHeight'])$(id).dataset.keepVisible='true';
 $('controls').insertAdjacentHTML('beforeend','<input type="hidden" id="compositeState">');
 $('compositeState').oninput=()=>{try{const state=JSON.parse($('compositeState').value);if(!Array.isArray(state.pieces)||state.pieces.length>200||!state.pieces.every(p=>['x','y','w','h'].every(k=>Number.isFinite(p[k]))))return;pieces=state.pieces;pieces.forEach(clamp);selected=Math.max(-1,Math.min(pieces.length-1,Number(state.selected)||0));sync()}catch{}};
 const oldClick=$('viz').onclick;
 $('viz').onclick=e=>{if($('fShape').value!=='builder')oldClick?.(e)};
 $('viz').onpointerdown=e=>{if($('fShape').value!=='builder')return;const el=e.target.closest('[data-part]');if(!el)return;e.preventDefault();selected=Number(el.dataset.part);save();const p=point(e);drag={dx:p.x-pieces[selected].x,dy:p.y-pieces[selected].y};$('viz').setPointerCapture(e.pointerId);sync();run();$('viz').querySelector('svg').focus()};
 $('viz').onpointermove=e=>{if(!drag)return;const p=point(e);pieces[selected].x=p.x-drag.dx;pieces[selected].y=p.y-drag.dy;clamp(pieces[selected]);run()};
 $('viz').onpointerup=$('viz').onpointercancel=()=>{drag=null};
 $('viz').onkeydown=e=>{if($('fShape').value!=='builder'||selected<0)return;const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(delta){e.preventDefault();save();pieces[selected].x+=delta[0];pieces[selected].y+=delta[1];clamp(pieces[selected]);run();$('viz').querySelector('svg').focus()}};
 update=()=>{
 $('compositeState').value=JSON.stringify({pieces,selected});
 const active=$('fShape').value==='builder';$('compositeControls').hidden=!active;if(!active){$('viz').style.touchAction='auto';return base()}
 for(const id of ['fWidth','fHeight','topWidth','cutHeight','slant','decompose'])showControl(id,false);$('clearArea').hidden=true;
 for(const id of ['pieceWidth','pieceHeight','pieceRotate','pieceDuplicate','pieceDelete'])$(id).disabled=selected<0;$('pieceUndo').disabled=!history.length;
 $('viz').style.touchAction='none';const m=measure(pieces);let s='<rect x="28" y="28" width="784" height="392" fill="#faf7fc" stroke="#cbbbd8"/>';
 if($('fGrid').checked){for(let x=0;x<=28;x++)s+=`<path d="M${ox+x*step} 28V420" stroke="#e3d9eb"/>`;for(let y=0;y<=14;y++)s+=`<path d="M28 ${oy+y*step}H812" stroke="#e3d9eb"/>`}
 pieces.forEach((p,i)=>{const x=ox+p.x*step,y=oy+p.y*step;s+=`<g data-part="${i}" style="cursor:grab"><rect x="${x}" y="${y}" width="${p.w*step}" height="${p.h*step}" fill="${colours[i%colours.length]}" fill-opacity=".28" stroke="${colours[i%colours.length]}" stroke-width="${i===selected?3:1}" ${i===selected?'stroke-dasharray="6 3"':''}/><text x="${x+p.w*step/2}" y="${y+p.h*step/2}" text-anchor="middle" dominant-baseline="middle" font-size="${Math.min(16,p.w*step/4)}" fill="#352040">${p.w} × ${p.h}</text><title>Piece ${i+1}: ${p.w} by ${p.h} units. Drag to move.</title></g>`});
 if($('fBoundary').checked)for(const[a,b]of m.edges)s+=`<path pointer-events="none" d="M${ox+a[0]*step} ${oy+a[1]*step}L${ox+b[0]*step} ${oy+b[1]*step}" stroke="#d24452" stroke-width="4"/>`;
 svg(s,'Drag and drop composite area and perimeter builder');$('viz').querySelector('svg').setAttribute('tabindex','0');
 formula('Area = covered squares · Perimeter = exposed edges');results([['Area',m.area+' square units'],['Perimeter',m.perimeter+' units']]);legend([['Perimeter',C.red],['Selected piece: dashed outline',C.purple]]);note('Each grid square is 1 × 1 unit. Join rectangles to make composite shapes. Overlapping squares count once; shared edges are internal. Hole boundaries and separate pieces are included in the total perimeter.');table(['Measurement','Value'],[['Area (square units)',m.area],['Perimeter (units)',m.perimeter]]);
 };
 sync();
};
if(current==='area')launch('area');
})(typeof window!=='undefined'?window:globalThis);
