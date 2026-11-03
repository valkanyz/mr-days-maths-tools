const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('docs/labs/expansion.js','utf8');
const nodes={};let rendered='',rows;let polygons=[];
const node=id=>nodes[id]??={value:'',checked:true,style:{},selectedOptions:[{textContent:'Solid'}]};
const ctx={Math,Number,document:{querySelector:()=>({})},$:node,C:{purple:'#8050b4',teal:'#078477',gold:'#b57618',blue:'#287caf',red:'#d24452'},fmt:(v,d=3)=>String(Number(v.toFixed(d))),esc:String,controls:()=>{},select:(id,l,opts)=>{node(id).value=opts[0][0];return ''},input:(id,l,v)=>{node(id).value=String(v);return ''},slider:(id,l,v)=>{node(id).value=String(v);return ''},check:(id,label,checked=false)=>{node(id).checked=checked;return ''},btn:()=>'',showControl:()=>{},value:id=>Number(node(id).value),addLab:(id,l,t,setup)=>setup(),path:(pts)=>{polygons.push(pts);assert(pts.flat().every(Number.isFinite));return ''},txt:(x,y,s)=>{assert(Number.isFinite(x)&&Number.isFinite(y));return s},svg:s=>rendered=s,formula:()=>{},results:()=>{},table:(h,r)=>rows=r,note:()=>{},run:()=>{}};
vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('function project3('),source.indexOf("addLab('vectors3'"))+source.slice(source.indexOf("addLab('nets'"),source.indexOf("addLab('inequalities'")),ctx);
for(const type of ['box','cube','tri','pent','hex','oct','tetra','triPyramid','pentPyramid','hexPyramid','pyramid','cylinder']){
 node('solid').value=type;
 for(const u of [0,.25,.5,.75,1]){node('unfold').value=String(u);ctx.update();assert(rendered.includes('cm'));assert(!rendered.includes('NaN'));assert(rows[0][1]>0);if(type==='box')assert.equal(rows[0][1],94);if(type==='cube')assert.equal(rows[0][1],96);if(type==='cylinder')assert(Math.abs(rows[0][1]-72*Math.PI)<1e-8);}
}
node('solid').value='box';node('width').value='12.5';node('depth').value='7';node('height').value='20';ctx.update();assert.equal(rows[0][1],955);for(const label of ['12.5 cm','7 cm','20 cm'])assert(rendered.includes(label));
node('netLabels').checked=false;ctx.update();assert(!rendered.includes('net-dimension'));
console.log('PASS: all 12 solids at five fold positions; dimensions, units, labels toggle and known surface areas.');

node('netLabels').checked=true;node('solid').value='tri';node('width').value='3';node('triSideB').value='5';node('triSideC').value='4';node('height').value='10';
for(const u of [0,.5,1]){node('unfold').value=String(u);ctx.update();assert.equal(rows[0][1],132);assert.equal(rows[0][2],60);assert(rendered.includes('h△ = 4 cm'));}
node('triSideB').value='20';assert.throws(()=>ctx.update(),/triangle inequality/);
console.log('PASS: 3–4–5 prism surface area 132 and volume 60; perpendicular height; invalid triangles rejected.');

node('triSideB').value='5';node('unfold').value='1';polygons=[];ctx.update();
const rectangles=polygons.filter(p=>p.length===5);assert.equal(rectangles.length,3);
for(const q of rectangles)for(let i=0;i<4;i++)assert(Math.abs(q[i][0]-q[i+1][0])<1e-8||Math.abs(q[i][1]-q[i+1][1])<1e-8);
console.log('PASS: flat triangular prism has three axis-aligned rectangular faces.');
node('unfold').value='0';ctx.update();const minimal=(rendered.match(/class="net-dimension"/g)||[]).length;assert.equal(minimal,5);
node('netAllLabels').checked=true;ctx.update();assert((rendered.match(/class="net-dimension"/g)||[]).length>minimal);node('netAllLabels').checked=false;
for(const id of ['netTurnView','netTiltView','netYView','netRollView']){polygons=[];ctx.update();const before=JSON.stringify(polygons);node(id).value='80';node(id).oninput();polygons=[];ctx.update();assert.notEqual(JSON.stringify(polygons),before);assert.equal(rows[0][1],132);}
node('netResetView').onclick();assert.equal(node('netTurnView').value,45);assert.equal(node('netTiltViewval').textContent,35.3);assert.equal(node('netRollView').value,0);
const view=node('viz');view.setPointerCapture=()=>{};ctx.run=()=>ctx.update();
node('netResetView').onclick();assert.equal(node('netPositionView').value,'standing');assert.equal(node('netMirrorView').checked,false);
polygons=[];ctx.update();const lying=JSON.stringify(polygons);node('netPositionView').value='lying';node('netPositionView').onchange();polygons=[];ctx.update();assert.notEqual(JSON.stringify(polygons),lying);
const normal=polygons;node('netMirrorView').checked=true;polygons=[];ctx.update();normal.forEach((face,i)=>face.forEach((p,j)=>{assert(Math.abs(p[0]+polygons[i][j][0]-840)<1e-7);assert(Math.abs(p[1]-polygons[i][j][1])<1e-7)}));
for(const id of ['netTurnView','netTiltView','netYView','netRollView']){node(id).value='22';node(id).oninput();ctx.update();assert.equal(node(id).value,15);}
console.log('PASS: lying/standing presets, mirror symmetry and exact inputs snapped to 15 degrees.');

node('netResetView').onclick();ctx.update();assert(rendered.includes('class="net-edge" data-visible="false"'));assert(rendered.includes('stroke-dasharray="3 5"'));assert(rendered.includes('class="net-face" data-visible="false"'));
const choice=node('netDimensionChoices');const ids=Array.from(choice.innerHTML.matchAll(/data-dimension="([^"]+)"/g),m=>m[1]);const count=()=> (rendered.match(/class="net-dimension"/g)||[]).length;
const initial=count();choice.oninput({stopPropagation(){},target:{dataset:{dimension:ids[0]},checked:false}});ctx.update();assert.equal(count(),initial-1);node('unfold').value='1';ctx.update();assert.equal(count(),initial-1);choice.oninput({stopPropagation(){},target:{dataset:{dimension:ids[0]},checked:true}});ctx.update();assert.equal(count(),initial);assert(!rendered.includes('class="net-edge" data-visible="false"'));
console.log('PASS: hidden edges dotted, back faces transparent, individual dimension choice persists when unfolding.');

node('unfold').value='0';ctx.update();let altitudeId=Array.from(node('netDimensionChoices').innerHTML.matchAll(/data-dimension="([^"]+)"[^>]*>Triangle height/g),m=>m[1])[0];assert(altitudeId);node('netDimensionChoices').oninput({stopPropagation(){},target:{dataset:{dimension:altitudeId},checked:false}});node('unfold').value='1';ctx.update();assert(!rendered.includes('h△ ='));console.log('PASS: triangle height stays hidden across folded and flat views.');

node('unfold').value='0';node('netResetView').onclick();
view.querySelector=()=>({getBoundingClientRect:()=>({left:0,top:0,width:840,height:440})});
assert.equal((rendered.match(/role="slider"/g)||[]).length,3);
// Extract points on each actual rendered ring to simulate a quarter-turn gesture.
const ringPoints=id=>{const match=rendered.match(new RegExp('data-rotation-axis="'+id+'"[\\s\\S]*?<path d="M([^"]+)"'));assert(match);return match[1].split(' L').map(v=>v.split(',').map(Number))};
for(const axis of ['netTiltView','netYView','netTurnView']){
 node('netResetView').onclick();const before=['netTiltView','netYView','netTurnView'].map(id=>node(id+'val').textContent),pts=ringPoints(axis),target={closest:selector=>selector==='[data-rotation-axis]'?{dataset:{rotationAxis:axis}}:null};
 view.onpointerdown({button:0,pointerId:1,clientX:pts[0][0],clientY:pts[0][1],target,preventDefault(){}});
 for(let i=1;i<=24;i++)view.onpointermove({pointerId:1,clientX:pts[i][0],clientY:pts[i][1]});view.onpointerup();
 const after=['netTiltView','netYView','netTurnView'].map(id=>node(id+'val').textContent);
 ['netTiltView','netYView','netTurnView'].forEach((id,i)=>id===axis?assert.notEqual(after[i],before[i]):assert.equal(after[i],before[i]));
}
node('netResetView').onclick();const initialView=rendered;view.onpointerdown({button:0,pointerId:1,clientX:420,clientY:220,target:{closest:()=>null},preventDefault(){}});view.onpointermove({pointerId:1,clientX:600,clientY:300});view.onpointerup();assert.equal(rendered,initialView);
node('unfold').value=1;ctx.update();assert(!rendered.includes('data-rotation-axis'));
console.log('PASS: three draggable rings, each rotates only its own axis; background drag disabled; flat net hides rings.');

node('unfold').value=0;
for(const tilt of [-180,-90,0,90,180]){node('netTiltView').value=tilt;node('netTiltView').oninput();for(const axis of ['netTiltView','netYView','netTurnView']){const pts=ringPoints(axis);const a=pts[0].map((v,i)=>v-[420,220][i]),b=pts[24].map((v,i)=>v-[420,220][i]);assert(Math.abs(a[0]*b[1]-a[1]*b[0])>1);}}
console.log('PASS: rotation rings remain draggable when viewed edge-on.');
