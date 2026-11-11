const assert=require('node:assert/strict'),{measure}=require('../docs/labs/composite-builder.js'),M=require('../docs/labs/machine-engine.js');
const r=(x,y,w,h)=>({x,y,w,h});
for(const[pieces,a,p]of [[[],0,0],[[r(0,0,4,3)],12,14],[[r(0,0,4,3),r(4,0,2,3)],18,18],[[r(0,0,4,3),r(2,0,4,3)],18,18],[[r(0,0,4,3),r(0,0,4,3)],12,14],[[r(0,0,4,2),r(0,2,2,3)],14,18],[[r(0,0,3,1),r(0,2,3,1),r(0,1,1,1),r(2,1,1,1)],8,16],[[r(0,0,1,1),r(3,3,1,1)],2,8]]){const m=measure(pieces);assert.equal(m.area,a);assert.equal(m.perimeter,p)}
for(const n of ['100','145','1250','1000000','-3456','1234.5']){const model=M.plan('2*x',n),before=M.tiles(model.input,[],'purple'),after=M.tiles(model.output,before,'green',true);assert.equal(before.reduce((s,t)=>s+t.amount*t.sign,0),Number(n));assert.equal(after.reduce((s,t)=>s+t.amount*t.sign,0),2*Number(n));assert.equal(after.reduce((s,t)=>s+(t.segments||[{color:t.color,amount:t.amount}]).filter(p=>p.color==='purple').reduce((n,p)=>n+p.amount*t.sign,0),0),Number(n));assert.ok(after.length<145)}
console.log('PASS: union areas, shared edges, overlaps, holes, islands and bundled large/negative/fractional values with colour provenance.');

const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,actual+' != '+expected);
const circle=(x,y,r,operation='add')=>({kind:'circle',x,y,r,operation});
const sector=(x,y,r,angle,operation='add')=>({kind:'sector',x,y,r,angle,operation});
for(const [pieces,area,perimeter] of [
 [[circle(0,0,2)],4*Math.PI,4*Math.PI],
 [[circle(0,0,2),circle(0,0,2)],4*Math.PI,4*Math.PI],
 [[circle(0,0,2),circle(2,0,2)],8*Math.PI-(8*Math.PI/3-2*Math.sqrt(3)),16*Math.PI/3],
 [[circle(0,0,2),circle(4,0,2)],8*Math.PI,8*Math.PI],
 [[sector(0,0,2,90)],Math.PI,Math.PI+4],
 [[sector(0,0,2,270)],3*Math.PI,3*Math.PI+4],
 [[sector(0,0,2,360)],4*Math.PI,4*Math.PI],
 [[r(0,0,6,6),circle(1,1,2,'subtract')],36-4*Math.PI,24+4*Math.PI],
 [[circle(0,0,2),{...r(0,0,2,4),operation:'subtract'}],2*Math.PI,2*Math.PI+4],
 [[r(0,0,6,6),sector(0,0,2,90,'subtract')],36-Math.PI,28+Math.PI],
 [[r(0,0,4,4),{...r(1,1,2,2),operation:'subtract'}],12,24],
 [[r(0,0,4,4),{...r(0,0,4,4),operation:'subtract'}],0,0],
 [[circle(0,0,2,'subtract')],0,0],
 [[{...r(0,0,6,4),kind:'triangle'}],12,16],
 [[{...r(0,0,6,4),kind:'trapezium',top:2}],16,8+2*Math.sqrt(20)],
 [[{...r(0,0,6,4),kind:'trapezium',top:2,rotation:90}],16,8+2*Math.sqrt(20)]
]){
 const result=measure(pieces);
 near(result.area,area);near(result.perimeter,perimeter);
}
const cutPieces=[r(0,0,8,6),circle(1,1,2,'subtract'),circle(3,1,2,'subtract')];
const cutOverlap=8*Math.PI/3-2*Math.sqrt(3);
near(measure(cutPieces).area,48-8*Math.PI+cutOverlap);
console.log('PASS: analytic circles, sectors, overlaps, cut-outs, holes, touching edges, triangles and rotated trapeziums.');
