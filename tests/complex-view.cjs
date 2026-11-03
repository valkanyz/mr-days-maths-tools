const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),M=require('../docs/labs/maths.js');
const source=fs.readFileSync('docs/labs/complex-view.js','utf8');
const controls={};for(const [id,value]of Object.entries({complexForm:'polar',re:2,im:1,wr:1,wi:1,modulus:2,argument:30,operation:'add',power:3}))controls[id]={value};
for(const id of ['complexSnap','complexExact','complexTipTail'])controls[id]={checked:false};controls.controls={insertAdjacentHTML(){}};controls.viz={style:{}};
let markup='',rows=[];
const context={Math,M,Intl,Event,$:id=>controls[id],labs:{complex:{setup(){}}},current:'other',check:()=>'',value:id=>Number(controls[id].value),showControl(){},fmt:(x,n=3)=>Number(x.toFixed(n)).toString(),esc:String,line:(g,a,b)=>`<path d="M${g.X(a[0])},${g.Y(a[1])}L${g.X(b[0])},${g.Y(b[1])}"/>`,C:{purple:'purple',blue:'blue',teal:'teal'},svg:s=>markup=s,formula(){},results(){},legend(){},note(){},table:(h,r)=>rows=r};
vm.createContext(context);vm.runInContext(source,context);context.labs.complex.setup();context.update();
assert.equal((markup.match(/<circle cx="420"/g)||[]).length,4);assert.ok(markup.includes('data-complex-drag="z"'));assert.ok(markup.includes('data-complex-drag="w"'));assert.ok(markup.includes('z + w'));assert.ok(!markup.includes('NaN'));
controls.complexExact.checked=true;context.update();assert.ok(rows[0][1].includes('√3'));assert.equal(rows[0][3],'π/6');
controls.complexSnap.checked=true;controls.modulus.value=2.23;controls.argument.value=43;context.update();assert.equal(+controls.modulus.value,2.23);assert.equal(+controls.argument.value,45);assert.equal(rows[0][3],'π/4');
controls.operation.value='roots';context.update();assert.equal(rows.length,4);assert.ok(!markup.includes('data-complex-drag="w"'));assert.ok(markup.includes('k = 2'));
controls.modulus.value=0;context.update();assert.equal(rows[0][3],'Undefined');assert.ok(!markup.includes('NaN'));
console.log('PASS: polar grid, vector labels, exact surds/angles, snapping, roots and zero.');

controls.complexSnap.checked=false;controls.modulus.value=2;controls.argument.value=30;controls.complexTipTail.checked=true;
for(const op of ['add','subtract']){controls.operation.value=op;context.update();const m=markup.match(/data-tip-tail="([^\"]+)" d="M([^ ]+) ([^L]+)L([^ ]+) ([^\"]+)"/);assert.ok(m);assert.equal(m[1],op);const dx=+m[4]-+m[2],dy=+m[5]-+m[3];assert.ok(op==='add'?dx>0&&dy<0:dx<0&&dy>0);assert.ok(markup.includes('stroke-dasharray="5 4"'));if(op==='subtract')assert.ok(markup.includes('>−w</text>'));}
controls.operation.value='multiply';context.update();assert.ok(!markup.includes('data-tip-tail'));
controls.operation.value='add';controls.complexTipTail.checked=false;context.update();assert.ok(!markup.includes('data-tip-tail'));
console.log('PASS: tip-to-tail addition/subtraction directions, reference vector, toggle off and unsupported operations.');
