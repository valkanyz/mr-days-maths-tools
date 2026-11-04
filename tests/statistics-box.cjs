const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const M=require('../docs/labs/maths.js'),source=fs.readFileSync('docs/labs/lab-upgrades.js','utf8');
const start=source.indexOf('else {const st=M.stats(xs);'),end=source.indexOf('\n const frequency={}',start),code=source.slice(start+5,end);
function render(xs,out=true,reveal=true){const ctx={M,xs,s:'',results:()=>{},table:()=>{},shown:()=>reveal,$:()=>({checked:out}),X:x=>x*10,C:{teal:'teal',purple:'purple',red:'red',gold:'gold'},fmt:String,txt:()=>''};vm.runInNewContext(code,ctx);return ctx.s;}
let s=render([1,2,3,4,5]);assert.match(s,/M10 110V140 M50 110V140/);assert(!s.includes('data-box-outlier'));
s=render([0,10,10,11,11,12,12,30]);assert.match(s,/M100 110V140 M120 110V140/);assert.equal((s.match(/data-box-outlier/g)||[]).length,2);
s=render([0,10,10,11,11,12,12,30],false);assert.match(s,/M0 110V140 M300 110V140/);assert(!s.includes('data-box-outlier'));
assert.equal(render([1,2,3],true,false),'');assert(!render([5]).includes('NaN'));
console.log('PASS: capped whiskers, crosses at both outliers, outlier toggle, reveal and singleton data.');
