const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),M=require('../docs/labs/maths.js');
const html=fs.readFileSync('docs/labs/index.html','utf8'),els={};
for(const [id,value]of Object.entries({mode:'right',tria:5,trib:7,tric:9,triA:35,triB:55,solution:0,sineCase:'aas'}))els[id]={value};
for(const k of ['a','b','c','A'])els['lock'+k]={checked:false};els.reveal={checked:true};els.viz={style:{}};
els['right-trig-ratios']={};
for(const key of ['Sin','Cos','Tan','Compare'])els['trig'+key]={checked:key!=='Compare'};
els.trigScale={value:1.5};els.trigScaleval={};
els.trigAngle={value:35,dataset:{}};els.trigAngleval={};
let rows,grid,markup;
const c={Math,M,current:'trigonometry',changedControl:'',softWarning:'',labs:{trigonometry:{setup(){}}},$:id=>els[id],controls(){},select:()=>'',slider:()=>'',pair:()=>'',input:()=>'',check:()=>'',showControl(){},value:id=>Number(els[id].value),fmt:(x,n=3)=>Number(x.toFixed(n)).toString(),esc:String,padded:xs=>{const min=Math.min(...xs),max=Math.max(...xs),d=(max-min||1)*.12;return[min-d,max+d]},line:()=>'',svg:s=>markup=s,formula(){},results(){},table:(h,r)=>rows=r,legend(){},note(){},C:{purple:'purple',teal:'teal',red:'red'}};
vm.createContext(c);vm.runInContext(fs.readFileSync('docs/labs/right-triangle-teaching.js','utf8'),c);vm.runInContext(html.split('\n').find(l=>l.startsWith('function chart(')),c);const chart=c.chart;c.chart=(...args)=>{grid=chart(...args);return grid;};
vm.runInContext(html.slice(html.indexOf('const oldTrig='),html.indexOf('const oldFinance=')),c);c.labs.trigonometry.setup();c.update();
assert.equal(els.tria.value,'5.74');assert.equal(els.trib.value,'8.19');
els.locka.checked=true;els.lockb.checked=true;c.changedControl='lockb';c.update();assert.equal(els.locka.checked,true);assert.equal(els.lockb.checked,true);assert.equal(els.tric.readOnly,true);
const before=JSON.stringify(rows);els.tric.value=11;c.changedControl='tric';c.update();assert.equal(JSON.stringify(rows),before);assert.match(c.softWarning,/conflicts/);
for(const k of ['c','A'])els['lock'+k].checked=true;c.changedControl='lockA';assert.doesNotThrow(()=>c.update());
assert.ok(Math.abs((grid.X(1)-grid.X(0))-(grid.Y(0)-grid.Y(1)))<1e-9);
for(const k of ['a','b','c','A'])els['lock'+k].checked=false;els.mode.value='cosine';c.changedControl='mode';c.update();els.lockb.checked=els.lockc.checked=true;c.changedControl='lockc';c.update();els.triA.value=60;c.changedControl='triA';c.update();assert.equal(+els.trib.value,7);assert.equal(+els.tric.value,9);assert.equal(+els.triA.value,60);
console.log('PASS: multiple locks, conflict rejection, rounded displays, two-lock general triangle edits and equal axis scales.');

c.run=()=>c.update();
els.mode.value='right';c.changedControl='mode';els.mode.onchange();
const ratioPanel=els['right-trig-ratios'];
assert.match(markup,/Opp = 5\.74/);
assert.match(markup,/Adj = 8\.19/);
assert.match(markup,/Hyp = 10/);
assert.equal(ratioPanel.hidden,false);
assert.match(ratioPanel.innerHTML,/<mfrac><mtext mathcolor="#204fc0">Opposite/);
assert.match(ratioPanel.innerHTML,/<mn>0\.574<\/mn>/);
els.trigCompare.checked=true;c.changedControl='trigCompare';c.update();
assert.match(markup,/Triangle 2 · ×1\.5/);
assert.match(markup,/Hyp = 15/);
const sineCard=()=>ratioPanel.innerHTML.split('</section>')[0];
assert.equal((sineCard().match(/<mn>0\.574<\/mn>/g)||[]).length,2);
els.trigScale.value=2;c.changedControl='trigScale';c.update();
assert.match(markup,/Hyp = 20/);
assert.equal((sineCard().match(/<mn>0\.574<\/mn>/g)||[]).length,2);
els.trigAngle.value=42;c.changedControl='trigAngle';c.update();
assert.equal(els.trigAngleval.textContent,'42°');
assert.equal((sineCard().match(/<mn>0\.669<\/mn>/g)||[]).length,2);
els.trigSin.checked=false;c.changedControl='trigSin';c.update();
assert.doesNotMatch(ratioPanel.innerHTML,/sin A/);
els.reveal.checked=false;c.changedControl='reveal';c.update();
assert.match(ratioPanel.innerHTML,/Adjacent/);
assert.doesNotMatch(ratioPanel.innerHTML,/<mn>/);
els.reveal.checked=true;
console.log('PASS: consistent side colours, scaled lengths, identical ratios, angle changes and ratio visibility.');


// Exercise the actual pointer handlers in both sine-rule cases.
c.DOMPoint=class {constructor(x,y){this.x=x;this.y=y;}matrixTransform(){return this;}};
els.viz.setPointerCapture=()=>{};els.viz.querySelector=()=>({getScreenCTM:()=>({inverse:()=>({})})});
const readValues=()=>Object.fromEntries(rows.map(([key,value])=>[key,Number(value)]));
const vertexPoint=index=>{
 const m=markup.match(new RegExp('cx="([^"]+)" cy="([^"]+)" r="[^"]+"[^>]+data-trig-resize="'+index+'"'));
 return m.slice(1,3).map(Number);
};
function dragHandle(selector,dataset,start,dx,dy){
 els.viz.onpointerdown({target:{closest:key=>key===selector?{dataset}:null},preventDefault(){},pointerId:1,clientX:start[0],clientY:start[1]});
 els.viz.onpointermove({clientX:start[0]+dx,clientY:start[1]+dy});
 els.viz.onpointerup();
}
els.trigSin.checked=true;
els.trigCompare.checked=false;c.changedControl='trigCompare';c.update();
const pointB=markup.match(/data-vertex="1"[^>]*cx="([^"]+)" cy="([^"]+)"/).slice(1,3).map(Number);
assert.equal((markup.match(/data-vertex=/g)||[]).length,1);
const original=readValues();
dragHandle('[data-vertex]',{vertex:'1'},pointB,30,-35);
const resized=readValues();
assert.equal(resized.A,original.A);
assert.ok(resized.c>original.c);
assert.ok(Math.abs(resized.a/resized.b-original.a/original.b)<.002);
assert.match(markup,/42°/);
assert.equal(els.trigAngle.value,'42');
els.trigCompare.checked=true;c.changedControl='trigCompare';c.update();
const initialSecond=vertexPoint(1),initialFirst=vertexPoint(0);
dragHandle('[data-trig-resize]',{trigResize:'0'},initialFirst,15,-10);
assert.ok(readValues().c>resized.c);
assert.ok(vertexPoint(0)[0]>initialFirst[0]);
assert.ok(Math.hypot(...vertexPoint(1).map((v,i)=>v-initialSecond[i]))<1e-8);
const updatedFirst=vertexPoint(0),updatedSecond=vertexPoint(1);
dragHandle('[data-trig-resize]',{trigResize:'1'},updatedSecond,-12,10);
assert.deepEqual(vertexPoint(0),updatedFirst);
assert.ok(vertexPoint(1)[0]<updatedSecond[0]);
assert.equal((sineCard().match(/<mn>0\.669<\/mn>/g)||[]).length,2);
console.log('PASS: B scales the right triangle and each comparison handle independently, preserving angle and ratios.');
const sizeBeforeWideDrag=readValues().c;
dragHandle('[data-trig-resize]',{trigResize:'1'},vertexPoint(1),500,-330);
assert.ok(Number(els.trigScale.value)>2.5);
assert.equal(readValues().c,sizeBeforeWideDrag);
assert.ok(vertexPoint(1)[0]<840&&vertexPoint(1)[1]>0);
dragHandle('[data-trig-resize]',{trigResize:'1'},vertexPoint(1),-500,330);
assert.ok(Number(els.trigScale.value)<.5);
assert.equal((sineCard().match(/<mn>0\.669<\/mn>/g)||[]).length,2);
els.trigCompare.checked=false;c.changedControl='trigCompare';c.update();
const beforeWideDrag=readValues();
const wideB=markup.match(/data-vertex="1"[^>]*cx="([^"]+)" cy="([^"]+)"/).slice(1,3).map(Number);
dragHandle('[data-vertex]',{vertex:'1'},wideB,750,-500);
assert.ok(readValues().c>beforeWideDrag.c*2);
assert.equal(readValues().A,beforeWideDrag.A);
const fittedB=markup.match(/data-vertex="1"[^>]*cx="([^"]+)" cy="([^"]+)"/).slice(1,3).map(Number);
assert.ok(fittedB[0]<805&&fittedB[1]>30);
console.log('PASS: dragging beyond the old limits expands the visible range without changing the ratios.');


for(const kind of ['aas','ssa']){
 els.mode.value='sine';els.sineCase.value=kind;els.tria.value=5;els.trib.value=7;els.triA.value=35;els.triB.value=55;c.changedControl='mode';els.mode.onchange();
 assert.equal((markup.match(/data-vertex=/g)||[]).length,3);
 assert.equal(ratioPanel.hidden,true);
 for(let vertex=0;vertex<3;vertex++){
  const before=JSON.stringify(rows),m=markup.match(new RegExp('data-vertex="'+vertex+'"[^>]*cx="([^"]+)" cy="([^"]+)"'));
  els.viz.onpointerdown({target:{closest:selector=>selector==='[data-vertex]'?{dataset:{vertex:String(vertex)}}:null},preventDefault(){},pointerId:1});
  els.viz.onpointermove({clientX:+m[1]+15,clientY:+m[2]-12});
  assert.notEqual(JSON.stringify(rows),before,kind+' vertex '+vertex+' must change the triangle');
  const dragged=JSON.stringify(rows);els.viz.onpointerup();assert.equal(JSON.stringify(rows),dragged,'release must preserve dragged dimensions');
  assert.ok(!markup.includes('NaN'));assert.ok(+els.triA.value>0&&+els.triB.value>0);
 }
 if(kind==='ssa'){const first=JSON.stringify(rows);els.solution.value=els.solution.value==='0'?'1':'0';c.changedControl='solution';c.update();assert.notEqual(JSON.stringify(rows),first,'SSA alternative remains selectable after dragging');}
}
console.log('PASS: all three vertices drag in AAS and SSA, values stay synchronised on release, and SSA alternatives remain selectable.');
