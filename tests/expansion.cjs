const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/../docs/labs/expansion.js','utf8');
const E=vm.runInNewContext(source.slice(0,source.indexOf('const txt='))+';E;');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} ≠ ${b}`);
let sol=E.solve(2,1,7,1,-1,2);near(sol.x,3);near(sol.y,1);
assert.equal(E.solve(1,1,2,2,2,5).kind,'none');assert.equal(E.solve(1,1,2,2,2,4).kind,'infinite');assert.equal(E.solve(0,0,2,0,0,0).kind,'none');
for(let k of [.5,-2,3]){let s=E.solve(2,1,7,1+2*k,-1+k,2+7*k);near(s.x,3);near(s.y,1)}
const schedule=E.schedule([{id:'A',duration:2,deps:[]},{id:'B',duration:4,deps:['A']},{id:'C',duration:3,deps:['A']},{id:'D',duration:5,deps:['B','C']}]);assert.equal(schedule.end,11);assert.equal(schedule.tasks[2].float,1);assert.equal(schedule.tasks[1].float,0);
assert.throws(()=>E.schedule([{id:'A',duration:1,deps:['B']},{id:'B',duration:2,deps:['A']}]));assert.throws(()=>E.schedule([{id:'A',duration:1,deps:['Missing']}]));
let population=[80,20];for(let i=0;i<100;i++){population=E.transition([[.8,.3],[.2,.7]],population);near(population.reduce((a,b)=>a+b),100)}near(population[0],60);near(population[1],40);
const cross=E.cross([3,1,2],[1,3,1]);near(E.dot(cross,[3,1,2]),0);near(E.dot(cross,[1,3,1]),0);
near(E.integrate(x=>2*x+1,0,3,10,'trap'),12);near(E.integrate(x=>2*x+1,0,3,10,'mid'),12);near(E.integrate(x=>x*x,0,2,1,'left'),0);near(E.integrate(x=>x*x,0,2,1,'right'),8);
assert.equal(E.factorial(0),1);assert.equal(E.factorial(5)/E.factorial(2),60);assert.equal(E.factorial(5)/E.factorial(3)/E.factorial(2),10);
console.log('PASS: equation degeneracies and row invariance, critical path and float, cycle detection, transition conservation and convergence, cross-product orthogonality, integration and counting.');
// Binomial identities: exact integer coefficients, signs, zeros and all supported powers.
for(let n=0;n<=12;n++){
 const row=E.pascal(n)[n];assert.equal(row.reduce((a,b)=>a+b,0),2**n);
 for(let k=0;k<=n;k++)assert.equal(row[k],row[n-k]);
 for(const [a,b] of [[1,2],[-2,3],[3,-2],[0,4],[4,0],[0,0]]){
  const coeffs=E.binomial(n,a,b);
  for(const x of [-1,0,1])assert.equal(coeffs.reduce((s,c,k)=>s+c*x**(n-k),0),(a*x+b)**n);
 }
}
let strips=E.strips(x=>x*x,0,2,.5,'trap');near(strips.reduce((s,v)=>s+v.area,0),2.75);
assert.equal(strips[1].yl,.25);assert.equal(strips[1].yr,1);
strips=E.strips(x=>2*x+1,0,2,.3,'trap');assert.equal(strips.length,7);near(strips.at(-1).r-strips.at(-1).l,.2);near(strips.reduce((s,v)=>s+v.area,0),6);
strips=E.strips(x=>x,-1,1,2,'trap');assert.equal(strips[0].yl,-1);assert.equal(strips[0].yr,1);near(strips[0].area,0);
for(const method of ['left','right','mid'])assert.ok(E.strips(x=>x*x,0,2,.5,method).every(v=>v.yl===v.yr));
assert.throws(()=>E.strips(x=>x,2,0,.5,'trap'));assert.throws(()=>E.strips(x=>x,0,10,.001,'trap'));
console.log('PASS: Pascal recurrence/symmetry, binomial identities including zeros and negatives, trapezium endpoint heights, signed areas and shortened final strips.');
