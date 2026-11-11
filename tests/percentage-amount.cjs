const assert=require('node:assert/strict');
const M=require('../docs/labs/percentage-amount.js');
const model=M.plan(80,65);
assert.deepEqual(model,{amount:80,percent:65,tens:60,ones:5,ten:8,one:.8,tensAmount:48,onesAmount:4,part:52});
const options={tiles:true,reveal:true,teaching:false,step:0};
const svg=M.render(model,options);
assert.equal((svg.match(/data-amount-unit="true"/g)||[]).length,80);
assert.match(svg,/>Each square = 1 unit · Each row = 10%<\/text>/);
assert.match(svg,/>60% = 6 × 8 = 48<\/text>/);
assert.match(svg,/>5% = 5 × 0.8 = 4<\/text>/);
assert.match(svg,/>48 \+ 4 = 52<\/text>/);
assert.match(svg,/role="slider".*aria-valuenow="65"/);
const hidden=M.render(model,{...options,reveal:false});
assert.doesNotMatch(hidden,/>48 \+ 4 = 52<\/text>/);
assert.match(hidden,/>10% = \?<\/text>/);
for(const amount of [0,.5,1,80,81,120,125,100000])for(const percent of [0,5,65,100]){
 const part=M.plan(amount,percent);
 assert.ok(Math.abs(part.tensAmount+part.onesAmount-part.part)<1e-8);
 assert.ok(Math.abs(part.part-amount*percent/100)<1e-8);
 assert.doesNotMatch(M.render(part,options),/NaN|Infinity/);
}
for(let step=0;step<5;step++){
 const teaching=M.render(model,{...options,teaching:true,step});
 if(step<4)assert.doesNotMatch(teaching,/>48 \+ 4 = 52<\/text>/);
 else assert.match(teaching,/>48 \+ 4 = 52<\/text>/);
}
assert.equal(M.steps(model).length,5);
assert.match(M.steps(model)[4],/48 \+ 4 = 52/);
console.log('PASS: whole-amount tiles, 10% and 1% decomposition, fractional inputs, hidden answers and teaching steps.');
