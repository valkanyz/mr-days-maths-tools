const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../docs/labs/machine-engine.js');global.MachineMath=M;const A=require('../docs/labs/machine-animation.js');
for(const [f,x,word]of [['2*x','4','copies'],['x+3','4','added'],['x-3','7','Remove'],['x/2','8','equally'],['x^2','4','square'],['x^3','y','itself'],['2*(x+3)','y','copies'],['x/2','1/3','Divide'],['3-x','7','simplify'],['x+2','-3','added']]){
 const plan=M.plan(f,x);let before=M.tiles(plan.input,[],'purple');for(const st of plan.stages){const after=M.tiles(st.poly,before,'green',['*','/','^'].includes(st.op));const s=A.scene({stage:st,before,after,phase:.6,inside:true,color:'green'});assert.ok(!/NaN|undefined/.test(s),f);if(st===plan.stages.at(-1))assert.ok(s.includes(word),f);const hidden=A.scene({stage:st,before,after,phase:1,inside:true,color:'green',hideResult:true});assert.ok(!hidden.includes('data-amount='),f+' hidden result');before=after;}
}
// Run the UI state machine with a controlled animation clock.
const els={};for(const [id,value]of Object.entries({fMode:'machine',machineFunction:'2*x+3',machineInput:'4',machineSpeed:1,machineHistory:'[]'}))els[id]={value};
for(const id of ['controls','machineExpressionControls','machineRun','machinePause','machineNext','machineExample','machineClearHistory','error','results','viz'])els[id]||={};
els.machineInside={checked:true};els.machineContinuous={checked:false};els.error.textContent='';els.controls.insertAdjacentHTML=els.machineExpressionControls.insertAdjacentHTML=()=>{};els.viz.style={};
let svg='',cards='',cb,clock=100;const root={style:{},setAttribute(){},insertAdjacentHTML:(pos,html)=>cards=html};els.viz.querySelector=()=>root;
const c={MachineMath:M,MachineAnimation:A,labs:{patterns:{setup(){}}},current:'patterns',launch(){},$:id=>els[id],update(){},slider:()=>'',btn:()=>'',check:()=>'',showControl(){},revealed:()=>true,esc:String,svg:s=>svg=s,formula(){},table(){},legend(){},note(){},cancelAnimationFrame(){cb=null;},requestAnimationFrame:f=>(cb=f,1)};c.run=()=>c.update();vm.createContext(c);vm.runInContext(fs.readFileSync('docs/labs/function-machine.js','utf8'),c);c.labs.patterns.setup();c.update();
assert.ok(cards.includes('Input'));assert.ok(!cards.includes('>8</strong>'));els.machineNext.onclick();cb(clock);clock+=8100;cb(clock);assert.ok(cards.includes('>8</strong>'));assert.ok(!cards.includes('>11</strong>'));assert.equal(els.machinePause.textContent,'Resume');
els.machineNext.onclick();clock+=10;cb(clock);clock+=8100;cb(clock);assert.ok(cards.includes('>11</strong>'));assert.equal(JSON.parse(els.machineHistory.value).length,1);c.update();assert.equal(JSON.parse(els.machineHistory.value).length,1);
console.log('PASS: operation scenes, fractions, negatives, symbolic inputs, hidden results, stage stepping and single history entry.');
assert.equal(A.tiles([],0,0),'');
const q=M.plan('x+3','4'),inputTiles=M.tiles(q.input,[],'purple'),outputTiles=M.tiles(q.output,inputTiles,'green');
for(const u of [0,.25,.75,1])assert.ok(!A.transition(inputTiles,outputTiles,u).includes('0 units'));
const slots=A.tileSlots(outputTiles);const end=A.transition(inputTiles,outputTiles,1);for(const p of slots)assert.ok(end.includes(`translate(${p.x} ${p.y})`),'each retained/added tile ends in its output slot');
const minus=A.transition(outputTiles,inputTiles,0);for(const p of A.tileSlots(outputTiles))assert.ok(minus.includes(`translate(${p.x} ${p.y})`),'each removed tile starts in its input slot');
assert.equal((svg.match(/data-machine=/g)||[]).length,2,'all machines remain rendered at completion');
els.machineRun.onclick();assert.equal((svg.match(/data-machine=/g)||[]).length,2,'all machines present before playback');assert.ok(svg.includes('Waiting'));clock+=10;cb(clock);clock+=3100;cb(clock);assert.ok(cards.includes('>8</strong>'),'first operation finishes in three seconds');assert.ok(!cards.includes('>11</strong>'));
console.log('PASS: empty subgroups, tile slot continuity, persistent machine housings and faster playback.');

// A five-stage line wraps right-to-left and back, while production pipelines inputs.
els.machineFunction.value='(((x+1)*2)-3)/2+4';els.machineInput.value='4';c.update();
assert.equal((svg.match(/data-machine=/g)||[]).length,5);assert.ok(svg.includes('data-continuous-belt="true"'));assert.equal((svg.match(/data-direction="left"/g)||[]).length,2);assert.ok(svg.includes('scale(-1 1)'));
els.machineContinuous.checked=true;els.machineContinuous.onchange();const prior=JSON.parse(els.machineHistory.value).length;els.machineRun.onclick();clock+=10;cb(clock);clock+=15100;cb(clock);assert.equal(JSON.parse(els.machineHistory.value).length,prior+1);assert.equal(els.machinePause.textContent,'Pause');assert.equal(els.machinePause.disabled,false);assert.equal(els.machineNext.disabled,true);
clock+=3000;cb(clock);assert.equal(JSON.parse(els.machineHistory.value).length,prior+2);c.update();assert.equal(JSON.parse(els.machineHistory.value).length,prior+2);els.machinePause.onclick();assert.equal(els.machinePause.textContent,'Resume');assert.equal(cb,null);
els.machineContinuous.checked=false;els.machineContinuous.onchange();assert.equal(els.machineNext.disabled,false);assert.ok(svg.includes('Waiting'));
console.log('PASS: connected serpentine belt, reversed lower rows, continuous throughput, pause and return to single production.');
