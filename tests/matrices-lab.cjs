const assert=require('node:assert/strict'),M=require('../docs/matrices-lab/engine.js');
const near=(A,B)=>{assert.equal(A.length,B.length);A.forEach((r,i)=>r.forEach((v,j)=>assert.ok(Math.abs(v-B[i][j])<1e-9,`${v} != ${B[i][j]}`)));};
const A=[[1,2],[3,4]],B=[[2,0],[1,3]],calc=(op,a=A,b=B,k=2,n=2)=>M.calculate(op,a,b,k,n).out;
near(calc('multiply'),[[4,6],[10,12]]);near(calc('add'),[[3,2],[4,7]]);near(calc('subtract'),[[-1,2],[2,1]]);near(calc('scale'),[[2,4],[6,8]]);near(calc('transpose'),[[1,3],[2,4]]);near(calc('power'),[[7,10],[15,22]]);near(calc('power',A,B,2,0),M.identity(2));near(calc('determinant'),[[-2]]);near(calc('inverse'),[[-2,1],[1.5,-.5]]);near(calc('solve',[[2,1],[1,-1]],[[7],[2]]),[[3],[1]]);near(calc('multiply',[[18,12,9],[10,16,8]],[[5],[3],[4]]),[[162],[130]]);
for(const a of [[[1,2,0],[0,1,1],[1,0,1]],[[0,1],[1,0]],[[1,2,3,4],[0,1,3,2],[0,0,1,5],[0,0,0,2]],[[1e-14,0],[0,1e-14]]])near(M.mul(a,M.inverse(a).out),M.identity(a.length));
near(calc('transition',[[.8,.3],[.2,.7]],[[120],[80]],2,3),[[120],[80]]);near(calc('transition',[[.8,.3],[.2,.7]],[[200],[0]],2,1),[[160],[40]]);near(calc('transform',[[0,-1],[1,0]],[[2],[1]]),[[-1],[2]]);
for(const [s,v]of [['1/3',1/3],['-2.5',-2.5],['3 / -2',-1.5],['1e-3',.001]])assert.equal(M.parse(s),v);
for(const s of ['', ' ', '1/0','NaN','2x','1/2/3','Infinity'])assert.throws(()=>M.parse(s));
assert.throws(()=>M.inverse([[1,2],[2,4]]));assert.throws(()=>M.mul([[1,2]],[[1,2]]));assert.throws(()=>calc('add',[[1]],B));assert.throws(()=>M.det([[1,2]]));assert.throws(()=>calc('power',A,B,2,1.5));assert.throws(()=>calc('transition',A,[[1],[2]]));assert.throws(()=>calc('transition',[[1,0],[0,1]],[[-1],[2]]));
// Exercise rendering, resizing, fractional entry and working-toggle paths without a browser dependency.
const fs=require('node:fs'),vm=require('node:vm'),els={},handlers={},get=id=>els[id]??={value:'',checked:true,hidden:false,innerHTML:'',textContent:'',disabled:false};
Object.assign(get('operation'),{value:'multiply'});get('precision').value='4';get('scalar').value='2';get('power').value='2';
const document={getElementById:get,addEventListener:(n,f)=>handlers[n]=f};
vm.runInNewContext(fs.readFileSync('docs/matrices-lab/app.js','utf8'),{document,MatrixMath:M});
assert.match(get('workingContent').innerHTML,/Row × column/);get('working').checked=false;get('working').onchange();assert.equal(get('workPanel').hidden,true);assert.equal(get('workingContent').innerHTML,'');assert.doesNotMatch(get('output').innerHTML,/data-cell/);get('working').checked=true;
for(const ex of ['sales','travel','equations','rotate','shear','inverse']){get('example').value=ex;get('example').onchange();assert.equal(get('error').hidden,true,ex);assert.ok(get('output').innerHTML);}
for(const op of ['add','subtract','scale','transpose','power','determinant','inverse']){get('example').value='rotate';get('example').onchange();get('operation').value=op;get('operation').onchange();if(['add','subtract'].includes(op))assert.equal(get('error').hidden,false);else assert.equal(get('error').hidden,true,op);}
get('example').value='sales';get('example').onchange();handlers.input({target:{dataset:{matrix:'A',i:'0',j:'0'},value:'1/0'}});assert.equal(get('error').hidden,false);assert.equal(get('output').innerHTML,'');handlers.input({target:{dataset:{matrix:'A',i:'0',j:'0'},value:'1/2'}});assert.equal(get('error').hidden,true);
handlers.change({target:{dataset:{size:'B-rows'},value:'2'}});assert.equal(get('error').hidden,false);
console.log('PASS matrix arithmetic, inverse identities, transitions, invalid entries/dimensions, every preset, rendering and output-only toggle.');
