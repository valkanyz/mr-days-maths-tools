const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),M=require('../docs/labs/maths.js');
const html=fs.readFileSync('docs/labs/index.html','utf8'),els={};
for(const [id,value]of Object.entries({mode:'right',tria:5,trib:7,tric:9,triA:35,triB:55,solution:0,sineCase:'aas'}))els[id]={value};
for(const k of ['a','b','c','A'])els['lock'+k]={checked:false};els.reveal={checked:true};els.viz={style:{}};
let rows,grid,markup;
const c={Math,M,current:'trigonometry',changedControl:'',softWarning:'',labs:{trigonometry:{setup(){}}},$:id=>els[id],controls(){},select:()=>'',slider:()=>'',pair:()=>'',input:()=>'',check:()=>'',showControl(){},value:id=>Number(els[id].value),fmt:(x,n=3)=>Number(x.toFixed(n)).toString(),esc:String,padded:xs=>{const min=Math.min(...xs),max=Math.max(...xs),d=(max-min||1)*.12;return[min-d,max+d]},line:()=>'',svg:s=>markup=s,formula(){},results(){},table:(h,r)=>rows=r,legend(){},note(){},C:{purple:'purple',teal:'teal',red:'red'}};
vm.createContext(c);vm.runInContext(html.split('\n').find(l=>l.startsWith('function chart(')),c);const chart=c.chart;c.chart=(...args)=>{grid=chart(...args);return grid;};
vm.runInContext(html.slice(html.indexOf('const oldTrig='),html.indexOf('const oldFinance=')),c);c.labs.trigonometry.setup();c.update();
assert.equal(els.tria.value,'5.74');assert.equal(els.trib.value,'8.19');
els.locka.checked=true;els.lockb.checked=true;c.changedControl='lockb';c.update();assert.equal(els.locka.checked,true);assert.equal(els.lockb.checked,true);assert.equal(els.tric.readOnly,true);
const before=JSON.stringify(rows);els.tric.value=11;c.changedControl='tric';c.update();assert.equal(JSON.stringify(rows),before);assert.match(c.softWarning,/conflicts/);
for(const k of ['c','A'])els['lock'+k].checked=true;c.changedControl='lockA';assert.doesNotThrow(()=>c.update());
assert.ok(Math.abs((grid.X(1)-grid.X(0))-(grid.Y(0)-grid.Y(1)))<1e-9);
for(const k of ['a','b','c','A'])els['lock'+k].checked=false;els.mode.value='cosine';c.changedControl='mode';c.update();els.lockb.checked=els.lockc.checked=true;c.changedControl='lockc';c.update();els.triA.value=60;c.changedControl='triA';c.update();assert.equal(+els.trib.value,7);assert.equal(+els.tric.value,9);assert.equal(+els.triA.value,60);
console.log('PASS: multiple locks, conflict rejection, rounded displays, two-lock general triangle edits and equal axis scales.');

// Exercise the actual pointer handlers in both sine-rule cases.
c.DOMPoint=class {constructor(x,y){this.x=x;this.y=y;}matrixTransform(){return this;}};
c.run=()=>c.update();els.viz.setPointerCapture=()=>{};els.viz.querySelector=()=>({getScreenCTM:()=>({inverse:()=>({})})});
for(const kind of ['aas','ssa']){
 els.mode.value='sine';els.sineCase.value=kind;els.tria.value=5;els.trib.value=7;els.triA.value=35;els.triB.value=55;c.changedControl='mode';els.mode.onchange();
 assert.equal((markup.match(/data-vertex=/g)||[]).length,3);
 for(let vertex=0;vertex<3;vertex++){
  const before=JSON.stringify(rows),m=markup.match(new RegExp('data-vertex="'+vertex+'" cx="([^"]+)" cy="([^"]+)"'));
  els.viz.onpointerdown({target:{closest:()=>({dataset:{vertex:String(vertex)}})},preventDefault(){},pointerId:1});
  els.viz.onpointermove({clientX:+m[1]+15,clientY:+m[2]-12});
  assert.notEqual(JSON.stringify(rows),before,kind+' vertex '+vertex+' must change the triangle');
  const dragged=JSON.stringify(rows);els.viz.onpointerup();assert.equal(JSON.stringify(rows),dragged,'release must preserve dragged dimensions');
  assert.ok(!markup.includes('NaN'));assert.ok(+els.triA.value>0&&+els.triB.value>0);
 }
 if(kind==='ssa'){const first=JSON.stringify(rows);els.solution.value=els.solution.value==='0'?'1':'0';c.changedControl='solution';c.update();assert.notEqual(JSON.stringify(rows),first,'SSA alternative remains selectable after dragging');}
}
console.log('PASS: all three vertices drag in AAS and SSA, values stay synchronised on release, and SSA alternatives remain selectable.');
