const assert=require('node:assert/strict'),M=require('../docs/labs/machine-engine.js');
const output=(f,x)=>M.format(M.plan(f,x).output);
for(const[f,x,want]of [['2*x','4','8'],['(x-3)/2','7','2'],['x^2','-3','9'],['2*(x+3)','y','2y + 6'],['(x+2)^2','y','y² + 4y + 4'.replace('²','^2')],['x/2','1/3','1/6'],['x^2+x','y','y^2 + y'],['3x-2','x','3x − 2'],['x','y','y'],['5','x','5'],['x/x','2','1']])assert.equal(output(f,x),want,f);
assert.throws(()=>M.plan('x/0','4'),/zero/);assert.throws(()=>M.plan('x^99','4'),/exponent/);assert.throws(()=>M.plan('alert(1);','4'));assert.throws(()=>M.plan('(x+2','4'),/bracket/);
let p=M.plan('2*x','4'),tiles=M.tiles(p.input,[],'purple');tiles=M.tiles(p.stages[0].poly,tiles,'green',true);assert.equal(tiles.filter(t=>t.color==='purple').length,4);assert.equal(tiles.filter(t=>t.color==='green').length,4);
p=M.plan('2*(x+3)','y');tiles=M.tiles(p.input,[],'purple');tiles=M.tiles(p.stages[0].poly,tiles,'gold');tiles=M.tiles(p.stages[1].poly,tiles,'green',true);assert.equal(tiles.filter(t=>t.key==='y^1'&&t.color==='purple').length,1);assert.equal(tiles.filter(t=>t.key==='y^1'&&t.color==='green').length,1);assert.equal(tiles.filter(t=>t.key===''&&t.color==='gold').length,3);assert.equal(tiles.filter(t=>t.key===''&&t.color==='green').length,3);
console.log('PASS: exact arithmetic, fractions, symbolic inputs, powers, distribution, invalid expressions and unit colour provenance.');
// Check the histogram's actual binning block against representative data.
const fs=require('node:fs'),vm=require('node:vm'),html=fs.readFileSync('docs/labs/index.html','utf8');const block=html.slice(html.indexOf("const auto=$('autoBins').checked"),html.indexOf('g=chart(start,max'));
function histogram(data,iqr){const c={data,S:{min:Math.min(...data),max:Math.max(...data),n:data.length,iqr},$:()=>({checked:true}),value:()=>2};vm.runInNewContext(block+'result={w,start,n,counts}',c);return c.result}
for(const[data,iqr]of [[[4,5,5,6,7,7,8,9,10,12,18],5],[[-12,-7,-2,3],7],[[.1,.2,.3,.4],.15],[[5,5,5],0]]){const h=histogram(data,iqr);assert.equal(h.counts.reduce((a,b)=>a+b,0),data.length);assert.ok(h.start<=Math.min(...data));assert.ok(h.start+h.n*h.w>=Math.max(...data)-1e-12)}
assert.equal(histogram([4,5,5,6,7,7,8,9,10,12,18],5).w,5);
console.log('PASS: rounded automatic bins, negative values, decimals, equal values and frequency totals.');
