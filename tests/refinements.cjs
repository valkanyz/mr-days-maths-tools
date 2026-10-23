const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('docs/labs/refinements.js','utf8');const R=vm.runInNewContext(source.slice(0,source.indexOf('const field='))+';R;');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
for(const [s,x,y]of [['2x^2 - 3x + 1',2,3],['-x^2',3,-9],['(x+1)^3/2',3,32],['sin(pi/2)+cos(0)',0,2],['2^3^2',0,512],['exp(ln(x))',3,3],['sqrt(x)+abs(-x)',4,6],['1/(x+1)',1,.5]])close(R.parse(s).f(x),y);
assert.deepEqual(Array.from(R.parse('(x+1)^3/2').coefficients),[.5,1.5,1.5,.5]);
for(const bad of ['window.alert(1)','x;1','x+','sin(x','x**2',''])assert.throws(()=>R.parse(bad));
const square=[[-10,-10],[10,-10],[10,10],[-10,10]],region=R.clip(R.clip(square,1,1,6),1,-1,2);assert.ok(region.every(([x,y])=>x+y<=6+1e-9&&x-y<=2+1e-9));assert.equal(R.clip(square,0,1,-20).length,0);
const A=[[0,1,1],[1,0,1],[1,1,0]];assert.deepEqual(JSON.parse(JSON.stringify(R.matrixPower(A,2))),[[2,1,1],[1,2,1],[1,1,2]]);
function brute(A,max=false){let best=max?-Infinity:Infinity;const visit=(i,used,s)=>{if(i===A.length){best=max?Math.max(best,s):Math.min(best,s);return}for(let j=0;j<A.length;j++)if(!used.includes(j))visit(i+1,[...used,j],s+A[i][j])};visit(0,[],0);return best}
let seed=42;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32};
for(let n=2;n<=6;n++)for(let t=0;t<20;t++){const A=Array.from({length:n},()=>Array.from({length:n},()=>Math.floor(rand()*30)-10));for(const max of [false,true]){const H=R.hungarian(A,max);close(H.total,brute(A,max));assert.equal(new Set(H.assignment).size,n)}}
const edges=[['S','A',3],['S','B',2],['A','B',1],['A','T',2],['B','T',3]],F=R.maxFlow(edges,'S','T');close(F.total,5);close(edges.reduce((s,[a,b,c])=>s+(F.cut.includes(a)&&!F.cut.includes(b)?c:0),0),F.total);
console.log('Refinements: parser, polynomial expansion, half-plane clipping, communication powers, 200 optimal assignments and flow/min-cut checks passed.');
