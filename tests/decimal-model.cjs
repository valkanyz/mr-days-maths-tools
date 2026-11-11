const assert=require('node:assert/strict');
const M=require('../docs/labs/decimal-model.js');
const calculate=(a,operation,b)=>M.build({mode:'calculate',a:M.parse(a),b:M.parse(b),operation});
let plan=calculate('999999.999999','add','0.000001');
assert.equal(M.format(plan.result),'1000000.000000');
assert.ok(plan.steps.some(step=>step.arrow?.to===6));
plan=calculate('10.000','subtract','0.001');
assert.equal(M.format(plan.result),'9.999');
assert.deepEqual(plan.steps[0].arrow,{from:1,to:-3});
assert.equal(M.format(calculate('0.02','subtract','1').result),'−0.98');
assert.equal(M.format(calculate('12.3456','multiply','0.003').result),'0.0370368');
assert.equal(M.format(calculate('9.25','divide','0.5').result),'18.5');
assert.equal(M.format(calculate('1','divide','6').result),'0.166666666667');
assert.equal(calculate('1','divide','6').approximate,true);
assert.throws(()=>calculate('1','divide','0'),/non-zero divisor/);
for(const places of [1,2,3,12]){
 const a=M.parse('9.25');
 const index=M.build({mode:'powers',a,operation:'divide',places});
 const ordinary=M.build({mode:'powers',a,operation:'divide',places,notation:'ordinary'});
 assert.equal(M.format(index.result),'0.'+'0'.repeat(places-1)+'925');
 assert.deepEqual(index.steps,ordinary.steps);
 assert.notEqual(index.title,ordinary.title);
 assert.equal(index.steps.at(-1).arrows[0].to,-places);
}
assert.equal(M.format(M.build({mode:'powers',a:M.parse('0.00925'),operation:'multiply',places:3}).result,true),'9.25');
assert.equal(M.format(M.build({mode:'place',a:M.parse('1.999999999999'),dp:11}).result),'2.00000000000');
assert.equal(M.build({mode:'compare',a:M.parse('0.30000'),b:M.parse('0.3')}).comparison,'=');
console.log('PASS: exact carrying, borrowing, partial products, division rounding and power-of-ten shifts.');
