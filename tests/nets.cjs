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
const view=node('viz');view.setPointerCapture=()=>{};ctx.run=()=>ctx.update();
node('netResetView').onclick();ctx.update();assert(rendered.includes('class="net-edge" data-visible="false"'));assert(rendered.includes('stroke-dasharray="3 5"'));assert(rendered.includes('class="net-face" data-visible="false"'));
const choice=node('netDimensionChoices');const ids=Array.from(choice.innerHTML.matchAll(/data-dimension="([^"]+)"/g),m=>m[1]);const count=()=> (rendered.match(/class="net-dimension"/g)||[]).length;
const initial=count();choice.oninput({stopPropagation(){},target:{dataset:{dimension:ids[0]},checked:false}});ctx.update();assert.equal(count(),initial-1);node('unfold').value='1';ctx.update();assert.equal(count(),initial-1);choice.oninput({stopPropagation(){},target:{dataset:{dimension:ids[0]},checked:true}});ctx.update();assert.equal(count(),initial);assert(!rendered.includes('class="net-edge" data-visible="false"'));
console.log('PASS: hidden edges dotted, back faces transparent, individual dimension choice persists when unfolding.');

node('unfold').value='0';ctx.update();let altitudeId=Array.from(node('netDimensionChoices').innerHTML.matchAll(/data-dimension="([^"]+)"[^>]*>Triangle height/g),m=>m[1])[0];assert(altitudeId);node('netDimensionChoices').oninput({stopPropagation(){},target:{dataset:{dimension:altitudeId},checked:false}});node('unfold').value='1';ctx.update();assert(!rendered.includes('h△ ='));console.log('PASS: triangle height stays hidden across folded and flat views.');

node('unfold').value='0';node('netResetView').onclick();
const geometry=()=>{polygons=[];ctx.update();return JSON.stringify(polygons)};
const initialGeometry=geometry();
const down=(x=0,y=0)=>view.onpointerdown({button:0,pointerId:1,clientX:x,clientY:y,target:{closest:()=>null},preventDefault(){}});
down();view.onpointermove({pointerId:1,clientX:0,clientY:150});assert.equal(geometry(),initialGeometry);view.onpointerup();
down();view.onpointermove({pointerId:2,clientX:80,clientY:0});assert.equal(geometry(),initialGeometry);view.onpointermove({pointerId:1,clientX:83,clientY:0});const rotated=geometry();assert.notEqual(rotated,initialGeometry);view.onpointerup();assert.equal(geometry(),rotated);
node('netResetView').onclick();assert.equal(geometry(),initialGeometry);
// Full 360-degree turn returns to the same geometry without zoom or tilt changes.
down();view.onpointermove({pointerId:1,clientX:900,clientY:0});const full=JSON.parse(geometry()),start=JSON.parse(initialGeometry);full.forEach((f,i)=>f.forEach((v,j)=>v.forEach((x,k)=>assert(Math.abs(x-start[i][j][k])<1e-7))));view.onpointerup();
node('netResetView').onclick();
// Vertical edges keep their screen length during the turn.
node('solid').value='box';const lengths=()=>{geometry();return polygons.flatMap(f=>f.slice(1).map((p,i)=>Math.abs(p[0]-f[i][0])<1e-7?Math.abs(p[1]-f[i][1]):0)).filter(x=>x>1)};
const before=lengths();down();view.onpointermove({pointerId:1,clientX:60,clientY:50});assert(before.length);lengths().forEach(x=>assert(Math.abs(x-before[0])<1e-7));view.onpointerup();
node('unfold').value=1;const flat=geometry();down();view.onpointermove({pointerId:1,clientX:100,clientY:100});view.onpointerup();assert.equal(geometry(),flat);
assert(!rendered.includes('data-rotation-axis'));
console.log('PASS: showroom drag, fixed elevation and scale, no release snapping, reset to isometric, full turn and flat-net lock.');

node('unfold').value=0;node('netResetView').onclick();const standing=geometry();node('netPositionView').value='lying';const lying=geometry();assert.notEqual(standing,lying);
for(const position of ['standing','lying']){
 node('netPositionView').value=position;node('netMirrorView').checked=false;const normal=JSON.parse(geometry());node('netMirrorView').checked=true;const flipped=JSON.parse(geometry());normal.forEach((f,i)=>f.forEach((p,j)=>{assert(Math.abs(p[0]+flipped[i][j][0]-840)<1e-7);assert(Math.abs(p[1]-flipped[i][j][1])<1e-7)}));
 const before=geometry();down();view.onpointermove({pointerId:1,clientX:60,clientY:0});view.onpointerup();assert.notEqual(geometry(),before);
}
node('netResetView').onclick();assert.equal(node('netPositionView').value,'standing');assert.equal(node('netMirrorView').checked,false);assert.equal(geometry(),standing);
node('unfold').value=1;const flatStanding=geometry();node('netPositionView').value='lying';assert.equal(geometry(),flatStanding);
console.log('PASS: standing/lying model orientation, exact L/R mirror, turntable in both positions, reset and unchanged flat net.');
