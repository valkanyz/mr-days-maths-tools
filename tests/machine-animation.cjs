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
for(const n of [2,3,6,10,12]){const {g}=arranged('x^2',String(n)),slots=A.tileSlots(g[1]);assert.equal(new Set(slots.map(s=>s.x)).size,n);assert.equal(new Set(slots.map(s=>s.y)).size,n);assert.ok(slots.every(s=>s.size===slots[0].size));const exit=A.tileSlots(g[1],850,245);exit.forEach((s,i)=>{assert.ok(Math.abs(s.x-slots[i].x-350)<1e-9);assert.equal(s.y,slots[i].y);assert.equal(s.size,slots[i].size);});}
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

for(const n of [2,6,12]){const {p,g}=arranged('x^2',String(n));const render=phase=>A.scene({stage:p.stages[0],before:g[0],after:g[1],phase,inside:true,color:'green'});const middle=render(.42),built=render(.78);assert.ok(middle.includes('data-square-turn='));assert.ok(!middle.includes('data-square-turn="90"'));assert.ok(built.includes('data-square-turn="90"'));assert.equal((built.match(/data-amount=/g)||[]).length,n*n);assert.ok(!built.includes('NaN'));}
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
 assert.equal((middle.match(/data-division-group=/g)||[]).length,n);
 assert.ok(middle.includes('data-shared-unit='));assert.ok(!/NaN|undefined/.test(middle));
 const end=A.sharing(g[0],g[1],n,1,'green',p.stages[0].text);
 assert.ok(end.endsWith(A.tiles(g[1],500,245,210,1)),'chosen share finishes exactly in the outgoing layout');
}
console.log('PASS: division deals equal groups, conserves units and symbolic terms, splits remainders and hands off the chosen share.');
