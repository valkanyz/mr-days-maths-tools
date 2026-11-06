const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('docs/labs/polygon-corners.js','utf8');
const nodes=new Map();
const $=id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id)};
let plot,markup,equation,next,activity;
const ctx={$,current:'angles',txt:()=>'',fmt:String,legend(){},results(){},table(){},note(){},
  formula:s=>{equation=s},svg:s=>{markup=s;plot={getScreenCTM:()=>({inverse:()=>({})})}},
  DOMPoint:class{constructor(x,y){this.x=x;this.y=y}matrixTransform(){return this}},
  requestAnimationFrame:f=>{next=f;return 1},cancelAnimationFrame:()=>{next=null},performance:{now:()=>0},
  run:()=>activity.update()};
const G=vm.runInNewContext(source+';PolygonCorners',ctx);
const concave=[[40,40],[340,40],[340,300],[190,180],[40,300]];
for(const shape of [concave,[...concave].reverse(),[[20,20],[290,40],[75,290]],Array.from({length:10},(_,i)=>[420+150*Math.cos(i*Math.PI/5),220+150*Math.sin(i*Math.PI/5)])]){
  assert.ok(G.valid(shape,true));
  const corners=G.geometry(shape), totals=Array(Math.ceil((shape.length-2)/2)).fill(0);
  for(const c of corners){
    let sum=0;
    for(const p of c.parts){totals[p.group]+=p.span;sum+=p.span;}
    assert.ok(Math.abs(sum-c.angle)<1e-8);
  }
  totals.forEach((v,i)=>assert.ok(Math.abs(v-Math.min(2,shape.length-2-2*i)*Math.PI)<1e-8));
}
assert.ok(G.geometry(concave).some(c=>c.angle>Math.PI));
assert.equal(G.valid([[40,40],[300,300],[300,40],[40,300]],true),false);
$('angleMode').value='customPolygon';$('numbers').checked=$('reveal').checked=true;
$('viz').querySelector=()=>plot;activity=G.mount();ctx.run();
for(const [x,y] of concave)plot.onclick({clientX:x,clientY:y});
$('cornerClose').onclick();assert.match(equation,/540°/);
$('cornerPlay').onclick();next(1000);assert.match(markup,/polygonCut/);next(2100);
assert.equal($('cornerPlay').textContent,'Replay rearrangement');
$('cornerReturn').onclick();assert.equal($('cornerPlay').textContent,'Cut and rearrange');
$('cornerUndo').onclick();assert.equal(equation,'');assert.equal(typeof plot.onclick,'function');
console.log('Passed drawing, closing, corner angles, full and half turns, animation and reopening.');
