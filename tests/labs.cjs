const A=require('node:assert/strict'),M=require('../docs/labs/maths');const near=(a,b,t=1e-9)=>A.ok(Math.abs(a-b)<t,`${a} ≠ ${b}`);
let s=M.stats([1,2,3,4,100]);A.equal(s.median,3);A.equal(s.q1,1.5);A.equal(s.q3,52);near(M.stats([2,4,4,4,5,5,7,9]).sd,2);A.equal(M.stats([5]).sampleSD,null);A.deepEqual(M.stats([1,2,3,4,5,6,7,100]).outliers,[100]);let R=M.regression([[1,3],[2,5],[3,7]]);near(R.m,2);near(R.c,1);near(R.r,1);A.throws(()=>M.regression([[2,1],[2,3]]));A.equal(M.regression([[1,2],[2,2]]).r,null);
for(let n of [1,10,100])for(let p of [0,.01,.3,.5,.99,1]){const P=M.binomial(n,p);near(M.sum(P),1,1e-10);near(M.sum(P.map((v,k)=>v*k)),n*p,1e-8)}near(M.binomial(10,.5)[5],.24609375);near(M.normalCDF(0),.5);near(M.normalCDF(1.96),.97500210485,1e-6);near(M.normalCDF(-1.96),.02499789515,1e-6);near(M.pdf(0,0,1),1/Math.sqrt(2*Math.PI));
for(const type of ['linear','quadratic','cubic','sine','exponential'])for(const b of [-2,0,2]){const F=M.family(type,2,b,1,3),x=.8,e=1e-5;near(F.d(x),(F.f(x+e)-F.f(x-e))/(2*e),1e-6);let numeric=0,N=10000,l=-.5,u=1.5;for(let i=0;i<N;i++)numeric+=F.f(l+(i+.5)*(u-l)/N)*(u-l)/N;near(F.integral(l,u),numeric,1e-5)}near(M.family('quadratic',1,1,0,0).integral(0,3),9);
near(M.finance(1000,.1,0,2,'compound').balance,1210);near(M.finance(1000,.1,0,2,'simple').balance,1200);near(M.finance(1000,0,100,10,'saving').balance,2000);let loan=M.finance(100,0,30,12,'loan');A.equal(loan.balance,0);A.equal(loan.rows.length,5);A.equal(loan.rows.at(-1).payment,10);near(M.finance(1000,-.1,0,2,'compound').balance,810);
near(M.dot([3,4],[-4,3]),0);near(M.norm([3,4]),5);A.deepEqual(M.complex([2,1],[1,1],'multiply'),[1,3]);A.deepEqual(M.complex([2,1],[1,1],'divide'),[1.5,-.5]);A.throws(()=>M.complex([1,2],[0,0],'divide'));for(const z of [[1,0],[2,3],[-4,0],[0,0]])for(let n=1;n<=12;n++)for(const r of M.roots(z,n)){const back=M.complex(r,[0,0],'power',n);near(back[0],z[0],1e-8);near(back[1],z[1],1e-8)}
const edges=[['A','B',4],['A','C',2],['B','C',1],['B','D',5],['C','D',8],['C','E',10],['D','E',2],['D','F',6],['E','F',3]],G=M.network(edges,'A','F');A.equal(G.distance,13);A.equal(G.weight,13);A.equal(G.mst.length,5);A.equal(G.connected,true);const disconnected=M.network([['A','B',1],['C','D',2]],'A','D');A.equal(disconnected.distance,Infinity);A.equal(disconnected.connected,false);
console.log('PASS: descriptive statistics, regression, distributions, derivatives/integrals, finance, vector products, complex roots, shortest paths and spanning trees.');
// Regression checks for classroom feedback, 23 October 2026.
{
 const assert=require('node:assert/strict'),M=require('../docs/labs/maths.js'),near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} ≈ ${b}`);
 near(M.family('cosine',1,1,0,0).f(0),1);
 near(M.family('cosine',1,1,0,0).d(Math.PI/2),-1);
 near(M.family('cosine',1,1,0,0).integral(0,Math.PI/2),1);
 near(M.family('sine',1,Math.PI/180,0,0).f(90),1);
 near(M.family('sine',1,Math.PI/180,0,0).d(0),Math.PI/180);
 near(M.family('tangentFn',1,1,0,0).d(0),1);
 near(M.family('tangentFn',1,1,0,0).integral(0,Math.PI/4),Math.log(2)/2);
 assert.ok(Number.isNaN(M.family('tangentFn',1,1,0,0).integral(0,Math.PI)));
 assert.ok(Number.isNaN(M.family('tangentFn',1,-1,0,0).integral(-Math.PI,0)));
 assert.ok(Number.isNaN(M.family('tangentFn',1,1,0,0).f(Math.PI/2)));
 const right=M.solveTriangle({a:3,b:4,c:5})[0];near(right.C,90);
 near(M.solveTriangle({b:7,c:9,A:35})[0].a,Math.sqrt(130-126*Math.cos(35*Math.PI/180)));
 const ss=M.solveTriangle({a:5,b:8,A:30});assert.equal(ss.length,2);near(ss[0].B+ss[1].B,180);
 assert.equal(M.solveTriangle({a:2,b:8,A:30}).length,0);
 assert.equal(M.solveTriangle({a:1,b:2,c:3}).length,0);
 near(M.solveTriangle({a:5,A:30,B:60})[0].c,10);
 assert.deepEqual(M.complex([2,3],[0,0],'conjugate'),[2,-3]);
 assert.deepEqual(M.complex([2,3],[1,-1],'subtract'),[1,4]);
 near(M.stats([0,1]).mean,.5);near(M.stats([0,1]).sd,.5);
 near(M.stats([10,20,30]).mean,20);near(M.stats([10,20,30]).sd,Math.sqrt(200/3));
 console.log('PASS: radian/degree trig, asymptotes, SSS/SAS/AAS/ambiguous SSA, conjugation and custom population moments.');
}
{
 const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../docs/labs/maths.js');
 assert.deepEqual(M.stats([0,1,2,3,4,5,6,7,14]).outliers,[]);
 assert.deepEqual(M.stats([0,1,2,3,4,5,6,7,14.1]).outliers,[14.1]);
 assert.deepEqual(M.stats([-6,1,2,3,4,5,6,7,8]).outliers,[]);
 assert.deepEqual(M.stats([-6.1,1,2,3,4,5,6,7,8]).outliers,[-6.1]);
 const html=fs.readFileSync(require('node:path').join(__dirname,'../docs/labs/index.html'),'utf8'),fn=html.slice(html.indexOf('function chart('),html.indexOf('function curve('));
 const context={fmt:String,esc:String};vm.createContext(context);vm.runInContext(fn+';this.chart=chart',context);
 for(const bounds of [[0,10,0,3],[-2,2,-9,9],[0,100,0,.1]]){const g=context.chart(...bounds,'x','y',true);assert.ok(Math.abs((g.X(1)-g.X(0))-(g.Y(0)-g.Y(1)))<1e-8)}
 console.log('PASS: strict 1.5 × IQR fences including exact-boundary cases; equal physical axis units.');
}
