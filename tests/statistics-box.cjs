const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const M=require('../docs/labs/maths.js'),source=fs.readFileSync('docs/labs/lab-upgrades.js','utf8');
const html=fs.readFileSync('docs/labs/index.html','utf8');const helper=html.slice(html.indexOf('// Shared box-plot marks'),html.indexOf('const originalStats='));
const start=source.indexOf('else {const st=M.stats(xs);'),end=source.indexOf('\n const frequency={}',start),code=source.slice(start+5,end);
function render(xs,out=true,reveal=true,fences=false,mean=true){const ctx={M,xs,s:'',results:()=>{},table:()=>{},shown:()=>reveal,$:id=>({checked:id==='stMean'?mean:id==='stFences'?fences:out}),X:x=>x*10,C:{teal:'teal',purple:'purple',red:'red',gold:'gold'},fmt:String,txt:()=>''};vm.runInNewContext(helper+code,ctx);return ctx.s;}
let s=render([1,2,3,4,5]);assert.match(s,/M10 112.5v25 M50 112.5v25/);assert(!s.includes('data-box-outlier'));
s=render([0,10,10,11,11,12,12,30]);assert.match(s,/d="M100 125H120"/);assert.equal((s.match(/data-box-outlier/g)||[]).length,2);
s=render([10,10,11,11,12,12,30]);assert.match(s,/d="M100 125H120 M100 112.5v25"/);
s=render([0,10,10,11,11,12,12]);assert.match(s,/d="M100 125H120 M120 112.5v25"/);
s=render([0,10,10,11,11,12,12,30],false);assert.match(s,/M0 112.5v25 M300 112.5v25/);assert(!s.includes('data-box-outlier'));
s=render([0,10,10,11,11,12,12,30],true,true,true);assert.equal((s.match(/data-fence=/g)||[]).length,2);assert.match(s,/Q₁ − 1.5 × IQR = 7/);assert.match(s,/Q₃ \+ 1.5 × IQR = 15/);assert(!render([1,2,3]).includes('data-fence='));
assert.equal(render([1,2,3],true,false,true),'');assert(!render([5],true,true,true).includes('NaN'));
console.log('PASS: open whiskers per outlier side, closed normal whiskers, crosses, fence values/toggle, reveal and singleton data.');

assert(render([1,2,3],true,true,false,true).includes('data-stat-mean'));
assert(!render([1,2,3],true,true,false,false).includes('data-stat-mean'));
// The linked adapter must leave selected histogram/dot/parallel displays intact.
for(const display of ['hist','dots','parallel']){
 const controls={stLinked:{checked:true},mode:{value:'one'},display:{value:display},stResiduals:{checked:true},viz:{style:{}}};
 const ctx={labs:{statistics:{setup(){}}},$:id=>controls[id],add:()=>{},check:()=>'',showControl:()=>{},update:()=>{ctx.baseCalls++;ctx.markup=display;},baseCalls:0,markup:''};
 const a=source.indexOf('const oldStats='),b=source.indexOf('const oldFinance=',a);
 vm.runInNewContext(source.slice(a,b),ctx);ctx.labs.statistics.setup();ctx.update();assert.equal(ctx.baseCalls,1);assert.equal(ctx.markup,display);
}
console.log('PASS: mean visibility and linked adapter preserves histogram, dot and parallel selections.');
