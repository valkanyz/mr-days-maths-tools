const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const src=fs.readFileSync('docs/labs/bearings.js','utf8'),B=vm.runInNewContext(src.slice(0,src.indexOf("addLab("))+';Bearings;');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`),go=pairs=>B.journey(pairs.map(([bearing,distance])=>({bearing,distance})));
for(const [b,x,y]of [[0,0,10],[90,10,0],[180,0,-10],[270,-10,0],[360,0,10]]){const r=go([[b,10]])[0];close(r.east,x);close(r.north,y);close(r.displacement,10);close(r.fromStart,b%360)}
let r=go([[0,6],[90,8]]).at(-1);close(r.displacement,10);close(r.total,14);close(r.fromStart,Math.atan2(8,6)*180/Math.PI);
r=go([[0,6],[90,8],[180,6],[270,8]]).at(-1);assert.equal(r.displacement,0);assert.equal(r.fromStart,null);close(r.total,28);
for(const b of [30,60,120,150,210,240,300,330]){r=go([[b,7]])[0];close(r.fromStart,b);close(r.displacement,7)}
assert.equal(B.label(359.99),'000.0°');assert.equal(B.label(5),'005.0°');assert.equal(B.label(null),'Undefined at start');assert.throws(()=>go([[NaN,3]]));assert.throws(()=>go([[0,-1]]));
const original=go([[40,5],[110,8],[210,4],[300,6]]),scaled=go([[40,50],[110,80],[210,40],[300,60]]);original.forEach((r,i)=>{close(scaled[i].displacement,r.displacement*10);close(scaled[i].fromStart,r.fromStart);assert.ok(r.displacement<=r.total+1e-9)});
console.log('PASS: cardinal bearings, all quadrants, cumulative legs, 6–8–10 journey, closed loop, scale invariance, invalid input and three-figure formatting.');
