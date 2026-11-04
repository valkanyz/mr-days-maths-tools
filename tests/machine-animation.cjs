const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../docs/labs/machine-engine.js');global.MachineMath=M;const A=require('../docs/labs/machine-animation.js');
for(const [f,x,word]of [['2*x','4','copies'],['x+3','4','added'],['x-3','7','Remove'],['x/2','8','equally'],['x^2','4','square'],['x^3','y','itself'],['2*(x+3)','y','copies'],['x/2','1/3','Divide'],['3-x','7','simplify'],['x+2','-3','added']]){
 const plan=M.plan(f,x);let before=M.tiles(plan.input,[],'purple');for(const st of plan.stages){const after=M.tiles(st.poly,before,'green',['*','/','^'].includes(st.op));const s=A.scene({stage:st,before,after,phase:.6,inside:true,color:'green'});assert.ok(!/NaN|undefined/.test(s),f);if(st===plan.stages.at(-1))assert.ok(s.includes(word),f);const hidden=A.scene({stage:st,before,after,phase:1,inside:true,color:'green',hideResult:true});assert.ok(!hidden.includes('data-amount='),f+' hidden result');before=after;}
}
// Run the UI state machine with a controlled animation clock.
const els={};for(const [id,value]of Object.entries({fMode:'machine',machineFunction:'2*x+3',machineInput:'4',machineSpeed:1,machineHistory:'[]'}))els[id]={value};
for(const id of ['controls','machineExpressionControls','machineRun','machinePause','machineNext','machineExample','machineClearHistory','error','results','viz'])els[id]||={};
els.machineInput.dataset={};els.machineRandom={checked:false,dataset:{}};els.machineInside={checked:true};els.machineContinuous={checked:false};els.error.textContent='';els.controls.insertAdjacentHTML=els.machineExpressionControls.insertAdjacentHTML=()=>{};els.viz.style={};
let svg='',cards='',cb,clock=100;const root={style:{},setAttribute(){},insertAdjacentHTML:(pos,html)=>cards=html};els.viz.querySelector=()=>root;
const c={MachineBranches:require('../docs/labs/machine-branches.js'),MachinePlot:require('../docs/labs/machine-plot.js'),MachineMath:M,MachineAnimation:A,labs:{patterns:{setup(){}}},current:'patterns',launch(){},$:id=>els[id],update(){},slider:()=>'',btn:()=>'',check:()=>'',showControl(){},revealed:()=>true,esc:String,svg:s=>svg=s,formula(){},table(){},legend(){},note(){},cancelAnimationFrame(){cb=null;},requestAnimationFrame:f=>(cb=f,1)};c.run=()=>c.update();vm.createContext(c);vm.runInContext(fs.readFileSync('docs/labs/function-machine.js','utf8'),c);c.labs.patterns.setup();c.update();
assert.ok(cards.includes('Input'));assert.ok(!cards.includes('>8</strong>'));els.machineNext.onclick();cb(clock);clock+=8100;cb(clock);assert.ok(cards.includes('>8</strong>'));assert.ok(!cards.includes('>11</strong>'));assert.equal(els.machinePause.textContent,'Resume');
els.machineNext.onclick();clock+=10;cb(clock);clock+=8100;cb(clock);assert.ok(cards.includes('>11</strong>'));assert.equal(JSON.parse(els.machineHistory.value).length,1);c.update();assert.equal(JSON.parse(els.machineHistory.value).length,1);
console.log('PASS: operation scenes, fractions, negatives, symbolic inputs, hidden results, stage stepping and single history entry.');
assert.equal(A.tiles([],0,0),'');
const q=M.plan('x+3','4'),inputTiles=M.tiles(q.input,[],'purple'),outputTiles=M.tiles(q.output,inputTiles,'green');
for(const u of [0,.25,.75,1])assert.ok(!A.transition(inputTiles,outputTiles,u).includes('0 units'));
const slots=A.tileSlots(outputTiles);const end=A.transition(inputTiles,outputTiles,1);for(const p of slots)assert.ok(end.includes(`translate(${p.x} ${p.y})`),'each retained/added tile ends in its output slot');
const minus=A.transition(outputTiles,inputTiles,0);for(const p of A.tileSlots(outputTiles))assert.ok(minus.includes(`translate(${p.x} ${p.y})`),'each removed tile starts in its input slot');
assert.equal((svg.match(/data-machine=/g)||[]).length,2,'all machines remain rendered at completion');
els.machineRun.onclick();assert.equal((svg.match(/data-machine=/g)||[]).length,2,'all machines present before playback');assert.ok(svg.includes('Waiting'));clock+=10;cb(clock);clock+=3600;cb(clock);assert.ok(cards.includes('>8</strong>'),'first operation finishes in three seconds');assert.ok(!cards.includes('>11</strong>'));
console.log('PASS: empty subgroups, tile slot continuity, persistent machine housings and faster playback.');

// A five-stage line wraps right-to-left and back, while production pipelines inputs.
els.machineFunction.value='(((x+1)*2)-3)/2+4';els.machineInput.value='4';c.update();
assert.equal((svg.match(/data-machine=/g)||[]).length,5);assert.ok(svg.includes('data-continuous-belt="true"'));assert.equal((svg.match(/data-direction="left"/g)||[]).length,2);assert.ok(svg.includes('scale(-1 1)'));
els.machineContinuous.checked=true;els.machineContinuous.onchange();const prior=JSON.parse(els.machineHistory.value).length;els.machineRun.onclick();clock+=10;cb(clock);clock+=15100;cb(clock);assert.equal(JSON.parse(els.machineHistory.value).length,prior+1);assert.equal(els.machinePause.textContent,'Pause');assert.equal(els.machinePause.disabled,false);assert.equal(els.machineNext.disabled,true);
clock+=3000;cb(clock);assert.equal(JSON.parse(els.machineHistory.value).length,prior+1);c.update();assert.equal(JSON.parse(els.machineHistory.value).length,prior+1);els.machinePause.onclick();assert.equal(els.machinePause.textContent,'Resume');assert.equal(cb,null);
els.machineContinuous.checked=false;els.machineContinuous.onchange();assert.equal(els.machineNext.disabled,false);assert.ok(svg.includes('Waiting'));
console.log('PASS: connected serpentine belt, reversed lower rows, continuous throughput, pause and return to single production.');
for(const count of [1,4,36,55,72,100,144,300])for(const width of [72,130,210,220]){const l=A.tileLayout(count,width);assert.ok(l.cols*l.size<=width-10+1e-9);assert.ok(l.rows*l.size<=Math.min(160,width-10)+1e-9);const slots=A.tileSlots(Array.from({length:count},()=>({})),500,245,width);for(const p of slots){assert.ok(p.y-p.size/2>=165-1e-9);assert.ok(p.y+p.size/2<=325+1e-9);}}
const square=M.plan('x^2','6').stages[0];assert.equal(A.operationTitle(square),'Square');const sign=A.scene({stage:square,before:[],after:[],phase:0,inside:true,color:'green'});assert.ok(sign.includes('data-flow-arrow'));assert.ok(sign.includes('data-operation-sign'));assert.ok(!/>Input<|>Output</.test(sign));
console.log('PASS: tile groups fit both width and height, directional arrows and prominent operation signs.');
function arranged(f,x){const p=M.plan(f,x),g=[M.tiles(p.input,[],'purple')];p.stages.forEach((s,i)=>g.push(M.tiles(s.poly,g.at(-1),'color'+i,['*','/','^'].includes(s.op))));A.arrangeGroups(g,p.stages);return {p,g};}
for(const [f,x]of [['x-18','73'],['x+18','55'],['x*3','6'],['((x+2)^2)*2-18','4']]){const {p,g}=arranged(f,x);p.stages.forEach((s,i)=>{if(!['+','-','*'].includes(s.op))return;const used=new Set();g[i+1].forEach(t=>{const j=g[i].findIndex((b,k)=>!used.has(k)&&b.key===t.key&&b.color===t.color&&b.sign===t.sign&&b.amount===t.amount);if(j>=0){used.add(j);assert.deepEqual(t.slot,g[i][j].slot,'retained block must not shift or resize');}});});}
for(const n of [2,3,6,8]){const {g}=arranged('x^2',String(n)),slots=A.tileSlots(g[1]);assert.equal(new Set(slots.map(s=>s.x)).size,n);assert.equal(new Set(slots.map(s=>s.y)).size,n);assert.ok(slots.every(s=>s.size===slots[0].size));const exit=A.tileSlots(g[1],850,245);exit.forEach((s,i)=>{assert.ok(Math.abs(s.x-slots[i].x-350)<1e-9);assert.equal(s.y,slots[i].y);assert.equal(s.size,slots[i].size);});}
console.log('PASS: survivors never move or resize in addition/subtraction/multiplication; square outputs remain square on the belt.');

// The values table grows across inputs, deduplicates repeats, and resets with the equation.
els.machineFunction.value='2*x+3';c.update();assert.equal(JSON.parse(els.machineHistory.value).length,0);
for(const input of ['3','-2','0.5','-1.5','10','3','1/2']){els.machineInput.value=input;c.update();els.machineRun.onclick();clock+=10;cb(clock);clock+=6100;cb(clock);}
assert.deepEqual(JSON.parse(els.machineHistory.value).map(r=>r[1]),['−2','−3/2','1/2','3','10']);assert.deepEqual(JSON.parse(els.machineHistory.value).map(r=>r[2]),['−1','0','4','9','23']);assert.equal((els.results.innerHTML.match(/<tr>/g)||[]).length,2);assert.ok(els.results.innerHTML.includes('scope="row"'));assert.ok(!els.results.innerHTML.includes('<th>Function'));
c.revealed=()=>false;c.update();assert.ok(els.results.innerHTML.includes('>?</td>'));c.revealed=()=>true;
els.machineFunction.value='x-1';c.update();assert.equal(JSON.parse(els.machineHistory.value).length,0);assert.ok(!els.results.innerHTML.includes('>23</td>'));
console.log('PASS: horizontal x/y table, exact numerical sorting, repeated-input reuse, hidden answers and function-change reset.');

els.machineContinuous.checked=true;els.machineContinuous.onchange();els.machineRun.onclick();clock+=10;cb(clock);assert.ok(svg.includes('data-waiting-input'));clock+=3200;cb(clock);assert.ok(svg.includes('data-waiting-output'));assert.ok(svg.includes('data-push="0"'));clock+=2700;cb(clock);assert.ok(svg.includes('data-waiting-input'));assert.ok(svg.includes('data-waiting-output'));assert.ok(!svg.includes('data-push="0"'));els.machinePause.onclick();
assert.ok(arranged('x+3','4').g.flat().every(t=>!t.jitter));
console.log('PASS: waiting feed, retained output, incoming-batch push and clean block grid.');

let randomIndex=0;c.Math=Object.assign(Object.create(Math),{random:()=>[.1,.9][randomIndex++%2]});els.machineFunction.value='3*x+4';c.update();const timings=[...svg.matchAll(/data-duration="([^\"]+)"/g)].map(m=>+m[1]);assert.equal(timings.length,2);assert.notEqual(timings[0],timings[1]);assert.ok(timings.every(t=>t>.85&&t<1.15));const beforeTimings=timings.join();c.update();assert.equal([...svg.matchAll(/data-duration="([^\"]+)"/g)].map(m=>+m[1]).join(),beforeTimings);
console.log('PASS: machine processing times vary slightly and remain stable between frames.');

for(const n of [2,6,8]){const {p,g}=arranged('x^2',String(n));const render=phase=>A.scene({stage:p.stages[0],before:g[0],after:g[1],phase,inside:true,color:'green'});const middle=render(.42),built=render(.78);assert.ok(middle.includes('data-square-turn='));assert.ok(!middle.includes('data-square-turn="90"'));assert.ok(built.includes('data-square-turn="90"'));assert.equal((built.match(/data-amount=/g)||[]).length,n*n);assert.ok(!built.includes('NaN'));}
console.log('PASS: square input rotates through 90 degrees and builds exactly n squared blocks.');
const source=fs.readFileSync('docs/labs/function-machine.js','utf8'),motionCode=source.slice(source.indexOf('const motionPhase='),source.indexOf(' const stageClock='));const motion={};vm.runInNewContext(motionCode+'this.phase=motionPhase',motion);
for(const d of [.88,1,1.12]){const out0=500+350*(motion.phase(d-.01,d)-.86)/.14,out1=500+350*(motion.phase(d,d)-.86)/.14,in0=850+350*motion.phase(0,d)/.18,in1=850+350*motion.phase(.01,d)/.18;assert.ok(Math.abs(out1-in0)<1e-9);assert.ok(Math.abs((out1-out0)-(in1-in0))<1e-9);}
els.machineContinuous.checked=true;els.machineContinuous.onchange();els.machineRun.onclick();clock+=10;cb(clock);const duration=+[...svg.matchAll(/data-duration="([^\"]+)"/g)][0][1];clock+=duration*3000+30;cb(clock);const outgoing=svg.slice(svg.indexOf('data-machine="0"'),svg.indexOf('data-machine="1"'));assert.ok(!outgoing.includes('data-amount='),'upstream machine must release the batch once downstream takes it');els.machinePause.onclick();
console.log('PASS: equal hand-off positions and velocities across varying processing times, with no duplicate outgoing batch.');

// Division conserves every term while dealing equal shares, including remainders.
for(const [f,x,n] of [['x/3','12',3],['x/3','8',3],['x/8','144',8],['x/2','1',2],['x/3','6*y+3',3]]){
 const {p,g}=arranged(f,x),shares=A.divisionShares(g[0],n);
 for(const share of shares)for(const key of new Set(g[0].map(t=>t.key))){
  const total=g[0].filter(t=>t.key===key).reduce((a,t)=>a+t.amount,0);
  assert.ok(Math.abs(share.filter(t=>t.key===key).reduce((a,t)=>a+t.amount,0)-total/n)<1e-9);
 }
 if(x==='12')assert.ok(shares.every(g=>g.length===4&&g.every(t=>t.amount===1)));
 const middle=A.scene({stage:p.stages[0],before:g[0],after:g[1],phase:.6,inside:true,color:'green'});
 if(g[0].every(t=>t.amount===1&&!t.bundle))assert.equal((middle.match(/data-division-group=/g)||[]).length,n);else assert.ok(!/NaN|undefined/.test(middle));
 if(g[0].every(t=>t.amount===1&&!t.bundle))assert.ok(middle.includes('data-shared-unit='));assert.ok(!/NaN|undefined/.test(middle));
 const end=A.sharing(g[0],g[1],n,1,'green',p.stages[0].text);
 assert.ok(end.endsWith(A.tiles(g[1],500,245,210,1)),'chosen share finishes exactly in the outgoing layout');
}
console.log('PASS: division deals equal groups, conserves units and symbolic terms, splits remainders and hands off the chosen share.');

// Random production tracks each batch independently through multiple machines.
els.machineFunction.value='2*x+3';els.machineInput.value='4';els.machineRandom.checked=true;els.machineRandom.onchange();els.machineRun.onclick();clock+=10;cb(clock);
assert.equal(els.machineInput.disabled,true);assert.equal(els.machineRandom.disabled,false);
const seen=new Map(),readBatches=()=>{
 for(const m of svg.matchAll(/data-machine="(\d+)" data-batch="(-?\d+)" data-input="([^"]+)"/g)){
  if(+m[2]<0)continue;const input=c.MachinePlot.number(m[3]);assert.ok(Number.isInteger(input*4)&&input>=-10&&input<=10);
  if(seen.has(+m[2]))assert.equal(input,seen.get(+m[2]),'input follows the same batch through every machine');else seen.set(+m[2],input);
 }
 const retained=svg.match(/data-waiting-output="true" data-input="([^"]+)"/),last=[...svg.matchAll(/data-machine="(\d+)" data-batch="(-?\d+)"/g)].at(-1);
 if(retained&&seen.has(+last[2]-1))assert.equal(c.MachinePlot.number(retained[1]),seen.get(+last[2]-1));
};
for(let step=0;step<900;step++){clock+=250;cb(clock);readBatches();}
els.machinePause.onclick();const pausedSVG=svg;c.update();assert.equal(svg,pausedSVG,'redraw while paused must not reroll inputs');
const randomRows=JSON.parse(els.machineHistory.value),xs=randomRows.map(r=>c.MachinePlot.number(r[1]));
assert.ok(xs.length>15);assert.ok(xs.includes(-10)&&xs.includes(0)&&xs.includes(10));assert.deepEqual(xs,[...xs].sort((a,b)=>a-b));
for(const r of randomRows)assert.equal(r[2],M.plan('2*x+3',r[1]).stages.at(-1).text);
// Large frame jumps still record every completed batch, and undefined inputs are skipped.
els.machineFunction.value='1/x';c.update();assert.equal(JSON.parse(els.machineHistory.value).length,0);els.machineRun.onclick();clock+=10;cb(clock);clock+=300000;cb(clock);els.machinePause.onclick();
const reciprocalRows=JSON.parse(els.machineHistory.value);assert.ok(reciprocalRows.length>15);assert.ok(reciprocalRows.every(r=>r[1]!=='0'));for(const r of reciprocalRows)assert.equal(r[2],M.plan('1/x',r[1]).stages.at(-1).text);
els.machineRandom.checked=false;els.machineRandom.onchange();assert.equal(els.machineInput.disabled,false);assert.ok(svg.includes('data-input="4"'));
els.machineContinuous.checked=false;els.machineContinuous.onchange();assert.equal(els.machineRandom.disabled,true);
console.log('PASS: random integer range, stable per-batch inputs, retained outputs, pause stability, sorted exact results, frame jumps, undefined inputs and toggle reset.');

// Whole-number shares keep the outgoing orientation throughout collection.
for(const [input,n] of [[12,3],[18,3],[36,3],[48,8],[64,2]]){
 const {g}=arranged('x/'+n,String(input)),share=A.divisionShares(g[0],n)[0],dest=A.tileSlots(g[1]),tray=A.divisionSlots(share,g[1],400,245,84,122);
 assert.equal(tray.length,dest.length);const scale=tray[0].size/dest[0].size;
 for(let i=0;i<tray.length;i++){assert.ok(Math.abs((tray[i].x-tray[0].x)-(dest[i].x-dest[0].x)*scale)<1e-8);assert.ok(Math.abs((tray[i].y-tray[0].y)-(dest[i].y-dest[0].y)*scale)<1e-8);}
}
console.log('PASS: division shares preserve the output orientation and relative block positions.');

const Plot=require('../docs/labs/machine-plot.js');
assert.equal(Plot.number('−3/2'),-1.5);assert.equal(Plot.number('0'),0);assert.equal(Plot.number('y'),null);
for(const vals of [[],[0],[-10,10],[-100,-1],[1e-8,2e-8],[1e8,4e8]]){const a=Plot.axis(vals);assert.ok(a.max>a.min&&a.step>0);assert.ok(vals.every(v=>v>=a.min&&v<=a.max));assert.ok((a.max-a.min)/a.step<15);}
const plot=Plot.render([['x^2','−2','4'],['x^2','1/2','1/4'],['x^2','y','y^2']]);assert.equal((plot.match(/data-pair=/g)||[]).length,2);assert.ok(plot.includes('Input (x)')&&plot.includes('Output (y)'));assert.ok(!/NaN|Infinity/.test(plot));assert.ok(!Plot.render([['x','2','2']],false).includes('data-pair='));
els.machineFunction.value='x^2';els.machineInput.value='-2';c.update();assert.ok(!els.results.innerHTML.includes('data-pair='));
els.results.onclick({target:{closest:()=>({dataset:{machineView:'graph'}})}});assert.ok(els.results.innerHTML.includes('id="machinePanel-table" aria-labelledby="machineView-table" hidden'));els.machineRun.onclick();clock+=10;cb(clock);clock+=1500;cb(clock);assert.ok(!els.results.innerHTML.includes('data-pair='));clock+=1600;cb(clock);assert.ok(els.results.innerHTML.includes('data-pair="−2,4"'));
els.machineInput.value='3';c.update();els.machineRun.onclick();clock+=10;cb(clock);clock+=3100;cb(clock);assert.equal((els.results.innerHTML.match(/data-pair=/g)||[]).length,2);
let prevented=false;els.results.onkeydown({target:{closest:()=>true},key:'ArrowLeft',preventDefault(){prevented=true}});assert.ok(prevented);assert.ok(els.results.innerHTML.includes('id="machinePanel-graph" aria-labelledby="machineView-graph" hidden'));
els.machineClearHistory.onclick();assert.ok(!els.results.innerHTML.includes('data-pair='));els.machineFunction.value='x+1';c.update();assert.ok(!els.results.innerHTML.includes('data-pair='));
console.log('PASS: graph tabs, keyboard switching, completed pairs only, fractions and negatives, safe axes, hidden answers and shared reset.');

// Exercise the real shared runner: it hides the parent of disabled inputs.
// Earlier state-machine tests called update directly and missed that integration.
const labSource=fs.readFileSync('docs/labs/index.html','utf8'),machineSource=fs.readFileSync('docs/labs/function-machine.js','utf8');
const controlMarkup=machineSource.match(/insertAdjacentHTML\('beforeend',`([^`]+)`\)/)[1];
const stack=[],controlNodes={};
for(const token of controlMarkup.matchAll(/<\/?([a-z]+)\b([^>]*)>/g)){
 const [tag,name,attrs]=token;if(tag.startsWith('</')){stack.pop();continue;}
 const id=attrs.match(/\bid="([^"]+)"/)?.[1],node=id?(els[id]||={}):{};node.parentElement=stack.at(-1);node.children=[];node.classList={contains:()=>false};node.closest=()=>null;if(node.parentElement)node.parentElement.children.push(node);if(id)controlNodes[id]=node;if(!['input','br'].includes(name))stack.push(node);
}
assert.notEqual(els.machineInput.parentElement,els.machineExpressionControls,'manual input must have its own wrapper');
const controlsList=['machineInput','machineFunction','machineExample','machineRandom','machineContinuous','machineInside','machineSpeed'].map(id=>{const el=els[id];el.id=id;el.dataset||={};el.closest||=()=>null;el.parentElement||={hidden:false,parentElement:els.machineExpressionControls};return el;});
els.machineExpressionControls.parentElement={classList:{contains:()=>false}};
for(const el of controlsList)el.parentElement.parentElement.classList||={contains:()=>false};
els.controls.querySelectorAll=()=>controlsList;els.reveal={checked:true};els.table={};els.formula={};els.csv={};
vm.runInContext(labSource.match(/^function showControl\([^\n]+/m)[0]+'\n'+labSource.match(/^function run\([^\n]+/m)[0],c);
els.machineContinuous.checked=true;els.machineContinuous.onchange();els.machineRandom.checked=true;els.machineRandom.onchange();
assert.equal(els.error.textContent,'');assert.equal(els.machineExpressionControls.hidden,false);assert.equal(els.machineInput.parentElement.hidden,false);assert.equal(els.machineInput.disabled,true);
els.machineRun.onclick();clock+=10;cb(clock);clock+=800;cb(clock);
els.machineInside.checked=false;c.run();assert.equal(els.machineExpressionControls.hidden,false);assert.ok(svg.includes('Turn on'));els.machineSpeed.value='2';c.run();assert.equal(els.machineExpressionControls.hidden,false);
els.machineRandom.checked=false;els.machineRandom.onchange();assert.equal(els.machineInput.disabled,false);assert.equal(els.machineExpressionControls.hidden,false);
els.machineContinuous.checked=false;els.machineContinuous.onchange();assert.equal(els.machineRandom.parentElement.hidden,false);assert.equal(els.error.textContent,'');
console.log('PASS: real shared runner keeps settings visible while random production runs; cutaway, speed and mode controls remain usable.');

// Exhaust each resolution before moving to the next, without repeating earlier values.
const roundCode=machineSource.slice(machineSource.indexOf(' const resetRandom='),machineSource.indexOf(' const historyRows='));
for(const omitZero of [false,true]){
 const entries=Array.from({length:81},(_,i)=>{const q=i-40;return {value:q/4,tier:q%4===0?0:q%2===0?1:2};}).filter(e=>!omitZero||e.value!==0);
 const context={randomModels:entries,randomOrders:new Map(),randomSeed:12345,randomEnabled:()=>true,Math};vm.createContext(context);vm.runInContext(roundCode+'this.get=batchAt;this.reset=resetRandom;',context);
 const order=Array.from({length:entries.length},(_,i)=>context.get(i).value),n=omitZero?20:21;
 assert.equal(new Set(order).size,entries.length);assert.ok(order.slice(0,n).every(Number.isInteger));assert.ok(order.slice(n,n+20).every(v=>Number.isInteger(v*2)&&!Number.isInteger(v)));assert.ok(order.slice(n+20).every(v=>Number.isInteger(v*4)&&!Number.isInteger(v*2)));
 const next=Array.from({length:entries.length},(_,i)=>context.get(i+entries.length).value);assert.deepEqual([...next].sort((a,b)=>a-b),entries.map(e=>e.value));assert.notDeepEqual(next,order);assert.equal(context.get(4).value,order[4],'queued and in-flight batches remain stable');
 context.reset();assert.equal(context.randomOrders.size,0);assert.equal(new Set(Array.from({length:n},(_,i)=>context.get(i).value)).size,n);
}
console.log('PASS: non-repeating integer, half and quarter rounds, undefined-value omissions, stable batches, reshuffling and restart.');

// Branching functions run each dependent operand from the same input and join in dependency order.
global.MachineAnimation=A;
const Branch=require('../docs/labs/machine-branches.js');
const branch=M.plan('3x^2+2x+5','2');
assert.equal(branch.branched,true);assert.deepEqual(branch.stages.map(s=>s.text),['4','12','4','16','21']);assert.deepEqual(branch.stages.map(s=>s.parents),[[-1],[0],[-1],[1,2],[3]]);
const timing=Branch.schedule(branch.stages,[1,1,1,1,1]);assert.equal(timing.starts[0],timing.starts[2]);assert.ok(timing.starts[3]>=timing.ends[1]&&timing.starts[3]>=timing.ends[2]);assert.equal(timing.ends.at(-1),5);
for(const [f,want]of [['x+x','4'],['(x+1)*(x-1)','3'],['(x+2)/(x+1)','4/3'],['3x^2-2x+5','13'],['(x+x)+(x*x)','8']])assert.equal(M.plan(f,'2').stages.at(-1).text,want);
els.machineContinuous.checked=false;els.machineRandom.checked=false;els.machineFunction.value='3x^2+2x+5';els.machineInput.value='2';c.update();assert.ok(svg.includes('Add branches'));assert.ok(svg.includes('data-branch-source'));assert.equal((svg.match(/data-branch-join="true"/g)||[]).length,1);
els.machineRun.onclick();clock+=10;cb(clock);clock+=16000;cb(clock);assert.equal(JSON.parse(els.machineHistory.value).at(-1)[2],'21');assert.ok(cards.includes('>21</strong>'));assert.ok(!/NaN|undefined/.test(svg));
els.machineContinuous.checked=true;els.machineRandom.checked=true;els.machineContinuous.onchange();els.machineRun.onclick();clock+=10;cb(clock);clock+=100000;cb(clock);const branches=JSON.parse(els.machineHistory.value);assert.ok(branches.length>1);for(const r of branches)assert.equal(r[2],M.plan('3x^2+2x+5',r[1]).stages.at(-1).text);assert.ok(!/NaN|undefined/.test(svg));els.machinePause.onclick();assert.equal(cb,null);
console.log('PASS: parallel dependency graph, simultaneous starts, join synchronisation, nested branches, exact outputs and continuous random batches.');

// Large quantities use repeated powers-of-ten blocks, never arbitrary 80/700 bundles.
for(const [value,expected] of [['80',Array(8).fill(10)],['800',Array(8).fill(100)],['8000',Array(8).fill(1000)],['1234',[1000,100,100,10,10,10,1,1,1,1]]]){const p=M.plan('x',value),blocks=M.tiles(p.input,[],'purple');assert.deepEqual(blocks.map(t=>t.amount),expected);assert.equal(blocks.reduce((s,t)=>s+t.amount,0),+value);}
for(const value of ['-80','1234.5','1000000']){const p=M.plan('x',value),blocks=M.tiles(p.input,[],'purple');assert.ok(Math.abs(blocks.reduce((s,t)=>s+t.sign*t.amount,0)-Number(value))<1e-9);assert.ok(blocks.filter(t=>t.amount>1).every(t=>Math.abs(Math.log10(t.amount)-Math.round(Math.log10(t.amount)))<1e-9));}
for(const n of [10,12]){const {p,g}=arranged('x^2',String(n));for(const phase of [.42,.78,1])assert.ok(!/NaN|undefined/.test(A.scene({stage:p.stages[0],before:g[0],after:g[1],phase,inside:true,color:'green'})));assert.equal(g[1].reduce((s,t)=>s+t.amount,0),n*n);}
console.log('PASS: place-value denominations, negative/fractional totals and grouped square rendering.');

for(const [f,input,amounts]of [['x+1/2','1/2',[1]],['x+1/4','1/2',[.75]],['x+1/4','3/4',[1]],['x+1/2','3/4',[1,.25]]]){const p=M.plan(f,input),before=M.tiles(p.input,[],'purple'),after=M.tiles(p.output,before,'green');assert.deepEqual(after.map(t=>t.amount),amounts);assert.ok(after[0].segments?.length===2);const graphic=A.tiles(after,0,0);assert.ok(graphic.includes('fill="purple"')&&graphic.includes('fill="green"'));const again=M.tiles(p.output,after,'blue');assert.deepEqual(again,after);}
console.log('PASS: halves and quarters consolidate automatically while retaining source colours.');

// Axis bounds depend on the function, never on production history or input order.
for(const f of ['2x+3','3x^2+2x+5','-x^2','5','0','1/x']){const bound=JSON.stringify(Plot.bounds(f));const empty=Plot.render([],true,f);for(const x of ['-10','0','2.25','10']){let p;try{p=M.plan(f,x);}catch{continue;}const result=Plot.render([[f,x,M.format(p.output)]],true,f);assert.equal(JSON.stringify(Plot.bounds(f)),bound);const grid=html=>html.slice(0,html.indexOf('<circle')<0?html.indexOf('<text x="415" y="30"'):html.indexOf('<circle'));assert.equal(grid(result),grid(empty));assert.ok(!/NaN|Infinity/.test(result));}}
assert.deepEqual(Plot.bounds('2x+3').x,{min:-10,max:10,step:2});assert.ok(Plot.bounds('2x+3').y.min<=-17&&Plot.bounds('2x+3').y.max>=23);assert.ok(Plot.bounds('x^2').y.max>=100);assert.ok(Plot.render([['x','80','80']],true,'x').includes('outside these fixed axes'));
console.log('PASS: precomputed fixed axes for linear, quadratic, constant and reciprocal functions; out-of-range values remain in table.');

// Trig evaluation, phased random angles, transformed windows and visual mechanisms.
const Trig=require('../docs/labs/machine-trig.js');global.MachineTrig=Trig;c.MachineTrig=Trig;
els.machineAngleMode={value:'radians'};els.machineAngleControls={hidden:true};
const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`),output=(f,x,mode='radians')=>{const p=M.plan(f,x,mode).output;return p.size?M.num(p.get('')):0;};
for(const [f,x,mode,v]of [['sin(x)','pi/2','radians',1],['cos(x)','pi','radians',-1],['tan(x)','pi/4','radians',1],['sin(x)','30','degrees',.5],['2cos(x)+3','60','degrees',4],['3sin(x)+2cos(x)','0','radians',2],['sin(2*(x-pi/4))','pi/2','radians',1]])approx(output(f,x,mode),v);
assert.throws(()=>M.plan('tan(x)','90','degrees'),/undefined/);assert.throws(()=>M.plan('tan(x)','pi/2'),/undefined/);
for(const mode of ['radians','degrees']){const entries=Trig.inputs('sin(x)',mode);assert.equal(entries.length,73);assert.deepEqual(entries.slice(0,5).map(e=>e.tier),[0,0,0,0,0]);assert.equal(new Set(entries.map(e=>e.value.toFixed(10))).size,73);assert.equal(entries.filter(e=>e.tier===1).length,4);assert.ok(entries.every((e,i)=>!i||e.tier>=entries[i-1].tier));assert.equal(Trig.inputs('tan(x)',mode).length,71);}
const rad=Plot.bounds('sin(x)','radians');approx(rad.x.min,0);approx(rad.x.max,2*Math.PI);assert.ok(rad.x.ticks.some(t=>t.label==='π/2'));
const shifted=Plot.bounds('2sin(2*(x-30))+5','degrees');approx(shifted.x.min,30);approx(shifted.x.max,210);assert.ok(shifted.y.min<=3&&shifted.y.max>=7);
const tan=Plot.bounds('3tan(2*(x-pi/4))+100','radians');approx(tan.x.min,Math.PI/4);approx(tan.x.max,5*Math.PI/4);assert.ok(tan.y.min>=50&&tan.y.max<=150,'tangent vertical cutoff follows shift and scale');
for(const op of ['sin','cos','tan']){const p=M.plan(op+'(x)','pi/4');for(const phase of [.2,.5,.78,1]){const html=A.scene({stage:p.stages[0],before:M.tiles(p.input,[],'purple'),after:M.tiles(p.output,[],'green'),phase,inside:true,color:'green'});assert.ok(!/NaN|undefined/.test(html));if(phase<.86)assert.ok(html.includes('data-trig-mechanism="'+op+'"'));}}
els.machineSpeed.value='1';els.machineFunction.value='sin(x)';els.machineInput.value='0';els.machineContinuous.checked=true;els.machineRandom.checked=true;c.update();assert.equal(els.machineAngleControls.hidden,false);els.machineRun.onclick();clock+=10;cb(clock);clock+=16000;cb(clock);const trigRows=JSON.parse(els.machineHistory.value);assert.ok(trigRows.length>=5);assert.ok(trigRows.slice(0,5).every(r=>['0','π/2','π','3π/2','2π'].includes(r[1])));assert.ok(!/NaN|undefined/.test(svg));els.machinePause.onclick();
console.log('PASS: trig modes, pi input, progressive angle tiers, transformed windows, tangent cutoffs, animation mechanisms and random playback.');

const trigAsymptotes=global.MachineTrig.describe('3tan(2*(x-30))+5','degrees').asymptotes;
assert.deepStrictEqual(trigAsymptotes,[75,165]);
assert.deepStrictEqual(global.MachineTrig.describe('tan(-x)','degrees').asymptotes,[90,270]);
assert.strictEqual(global.MachineTrig.describe('sin(x)').asymptotes.length,0);
assert.strictEqual((global.MachinePlot.render([],true,'tan(x)','degrees').match(/data-asymptote=/g)||[]).length,2);
console.log('PASS: dotted tangent asymptotes with horizontal shifts, stretches and reflections.');

for(const [f,x,expected] of [['sin(x)','45','√2/2'],['cos(x)','30','√3/2'],['tan(x)','30','√3/3'],['sin(x)','15','(√6 − √2)/4'],['tan(x)','75','2 + √3'],['2sin(x)+5','45','5 + √2']]){
 const model=global.MachineMath.plan(f,x,'degrees');
 assert.strictEqual(model.stages.at(-1).text,expected);
 const numeric=global.MachinePlot.number(expected);
 assert.ok(Number.isFinite(numeric));
 assert.ok(Math.abs(numeric-global.MachineMath.num(model.output.get('')))<1e-9);
}
assert.strictEqual(global.MachineMath.plan('sin(x)','pi/4').stages[0].beforeText,'π/4');
assert.ok(!global.MachineMath.plan('sin(x)','10','degrees').stages[0].text.includes('√'));
console.log('PASS: exact special-angle outputs, transformed surds and numeric graph coordinates.');
