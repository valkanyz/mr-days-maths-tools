const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('docs/labs/expansion.js','utf8');
const nodes={};let rendered='',rows;let polygons=[];
const node=id=>nodes[id]??={value:'',checked:true,style:{},selectedOptions:[{textContent:'Solid'}]};
const ctx={Math,Number,document:{querySelector:()=>({})},$:node,C:{purple:'#8050b4',teal:'#078477',gold:'#b57618',blue:'#287caf',red:'#d24452'},fmt:(v,d=3)=>String(Number(v.toFixed(d))),esc:String,controls:()=>{},select:(id,l,opts)=>{node(id).value=opts[0][0];return ''},input:(id,l,v)=>{node(id).value=String(v);return ''},slider:(id,l,v)=>{node(id).value=String(v);return ''},check:()=>'',btn:()=>'',showControl:()=>{},value:id=>Number(node(id).value),addLab:(id,l,t,setup)=>setup(),path:(pts)=>{polygons.push(pts);assert(pts.flat().every(Number.isFinite));return ''},txt:(x,y,s)=>{assert(Number.isFinite(x)&&Number.isFinite(y));return s},svg:s=>rendered=s,formula:()=>{},results:()=>{},table:(h,r)=>rows=r,note:()=>{},run:()=>{}};
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
