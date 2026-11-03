const assert=require('node:assert/strict');
const {Q,side,expression,solve,apply}=require('../docs/equation-balance/engine.js');
const s=(a,b,c,d)=>({l:side(a,b),r:side(c,d)});
assert.equal(Q.of('0.125').toString(),'1/8');assert.equal(Q.of('-1.5').div(3).toString(),'-1/2');
assert.equal(expression(side(-1,-3)),'−x − 3');assert.equal(expression(side(0,0)),'0');
let state=s(2,3,0,11);state=apply(state,'subtract',3);state=apply(state,'divide',2);assert.equal(expression(state.l),'x');assert.equal(expression(state.r),'4');
for(let a=-6;a<=6;a++)for(let c=-6;c<=6;c++)for(let x=-5;x<=5;x++){if(a===c)continue;let original=s(a,3,c,(a-c)*x+3);assert.equal(solve(original).x.value(),x);for(const [op,n,term] of [['add','1.5','constant'],['subtract',4,'x'],['multiply',-3,'constant'],['divide',7,'constant']])assert.equal(solve(apply(original,op,n,term)).x.value(),x)}
assert.equal(solve(s(2,3,2,3)).kind,'all');assert.equal(solve(s(2,3,2,4)).kind,'none');
assert.throws(()=>apply(state,'divide',0));assert.throws(()=>apply(state,'multiply',0));assert.throws(()=>Q.of(''));assert.throws(()=>Q.of('1e3'));
assert.equal(solve(apply(s(2,3,0,11),'add',2,'constant','left')).x.value(),3);
assert.equal(solve(s(3,0,0,1)).x.toString(),'1/3');
console.log('PASS: exact fractions, formatting, 6,864 equivalent transformations, one-sided exploration, zero safeguards, unique/no/infinite solutions.');

assert.equal(Q.of(' -3 / 4 ').toString(),'-3/4');assert.equal(Q.of('1/-2').toString(),'-1/2');assert.throws(()=>Q.of('1/0'));assert.throws(()=>Q.of('1/2/3'));
let f=s('1/2','3/4',0,'11/4');f=apply(f,'subtract','3/4');assert.equal(f.r.b.toString(),'2');f=apply(f,'divide','1/2');assert.equal(expression(f.l),'x');assert.equal(expression(f.r),'4');
assert.equal(apply(s(1,0,0,4),'multiply','1/3').l.a.toString(),'1/3');
console.log('PASS: typed fractions, negative denominators, invalid fractions, fractional operations and exact simplification.');

const blockSource=require('node:fs').readFileSync('docs/equation-balance/app.js','utf8'),blockContext={Q,num:q=>q.toString().replace('-','−')};
require('node:vm').createContext(blockContext);require('node:vm').runInContext(blockSource.slice(blockSource.indexOf('function blocks('),blockSource.indexOf('function draw()')),blockContext);
for(const [a,b] of [[3,8],[2,11],[4,12]]){const tiles=blockContext.blocks(side(a,b));assert.equal(tiles.length,a+b);assert(tiles.every(p=>!p.compact&&p.q.value()===1));}
for(const [a,b] of [[2,30],[-3,-50],['3/2','7/3'],[50,80]]){
 const tiles=blockContext.blocks(side(a,b));assert(tiles.length<=16);
 for(const [isX,value] of [[true,a],[false,b]])assert.equal(tiles.filter(t=>t.isX===isX).reduce((sum,t)=>sum.add(t.q),new Q(0)).toString(),Q.of(value).toString());
}
const mixed=blockContext.blocks(side(2,30));assert.equal(mixed.filter(t=>t.isX&&!t.compact).length,2);assert.equal(mixed.filter(t=>t.compact).length,1);
assert(blockContext.tileMarkup(side(2,30)).includes('data-grouped="true"'));assert(blockContext.tileMarkup(side(-3,-50)).includes('stroke-dasharray="4 3"'));
console.log('PASS: screenshot quantities split into units; only oversized terms grouped; exact signed/fractional totals preserved.');
