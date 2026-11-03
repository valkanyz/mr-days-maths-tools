const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('docs/labs/expansion.js','utf8'),E=vm.runInNewContext(src.slice(0,src.indexOf('const txt='))+';E;');
const P=require('../docs/labs/project-view.js'),rows=P.parse(P.encode(P.examples.fair.rows)),base=E.schedule(rows);
assert.equal(base.end,17);assert.equal(base.tasks.find(t=>t.id==='F').float,3);
const scenario=(id,d)=>E.schedule(rows.map(t=>({...t,duration:t.id===id?d:t.duration})));
assert.equal(scenario('F',10).end,17);assert.equal(scenario('I',5).end,19);assert.equal(scenario('I',2).end,16);assert.equal(scenario('I',1).end,16);
assert.equal(scenario('I',2).tasks.find(t=>t.id==='G').float,0);
for(const ex of Object.values(P.examples)){const plan=E.schedule(P.parse(P.encode(ex.rows))),names=Object.fromEntries(ex.rows.map(r=>[r[0],r[1]]));for(const render of [P.network,P.gantt]){const svg=render(plan,names,{selected:plan.tasks[0].id,time:5,show:true,highlight:true,timings:true});assert.ok(!/NaN|undefined/.test(svg.content));assert.equal((svg.content.match(/data-project-task=/g)||[]).length,plan.tasks.length);}const l=P.layout(plan.tasks);for(const t of plan.tasks)for(const d of t.deps)assert.ok(l.positions.get(d).x<l.positions.get(t.id).x);}
for(const bad of ['', 'A,0,','A,-2,','A,NaN,','A,1,Missing','A,1,B\nB,1,A','A,1,\nA,2,'])assert.throws(()=>E.schedule(P.parse(bad)));
assert.equal(E.schedule(P.parse('A, 0.5,\nB, 1.25, A')).end,1.75);
console.log('PASS: fair baseline, float, delays, critical-path switching, all examples, dependency layout and invalid projects.');
// UI harness for selection, scenarios, playback and restoring the baseline.
const els={},get=id=>els[id]||=( {value:'',checked:true,style:{},textContent:'',focus(){},insertAdjacentHTML(p,s){this.innerHTML+=s;}} );let frame;
const select=(id,label,options)=>{get(id).value=options[0]?.[0]||'';return '';},input=(id,label,v)=>{get(id).value=String(v);return '';},slider=(id,label,v,min,max)=>{get(id).max=max;get(id+'val');return input(id,label,v);};
const ctx={E,console,labs:{projects:{}},current:'projects',update(){},launch(){},$:get,select,input,slider,check:(id,label,v)=>{get(id).checked=v;return '';},btn:(id)=>{get(id);return '';},controls(){},revealed:()=>true,formula(){},legend(){},results:()=>{get('results').innerHTML='';},table(){},note(){},requestAnimationFrame:f=>(frame=f,1),cancelAnimationFrame:()=>{frame=null}};ctx.run=()=>ctx.update();vm.createContext(ctx);vm.runInContext(fs.readFileSync('docs/labs/project-view.js','utf8'),ctx);ctx.labs.projects.setup();ctx.run();assert.equal(+get('projectTime').max,17);assert.equal(get('projectTask').value,'I');
get('projectFloat').onclick();assert.equal(+get('projectTime').max,17);assert.equal(get('projectTask').value,'F');get('projectDelay').onclick();assert.equal(+get('projectTime').max,19);get('projectShorten').onclick();assert.equal(+get('projectTime').max,16);get('projectRestore').onclick();assert.equal(+get('projectTime').max,17);
get('projectDuration').value='4';get('projectDuration').onchange();assert.equal(+get('projectTime').max,18);
get('projectView').value='gantt';ctx.run();assert.ok(get('viz').innerHTML.includes('Project Gantt chart'));
get('projectPlay').onclick();frame(100);frame(1100);assert.equal(+get('projectTime').value,1);get('projectRewind').onclick();assert.equal(+get('projectTime').value,0);assert.equal(frame,null);
get('tasks').value='X, 1,\nY, 2, X';get('tasks').oninput();ctx.run();assert.equal(+get('projectTime').max,3);get('projectDuration').value='3';get('projectDuration').onchange();assert.equal(+get('projectTime').max,5);get('projectRestore').onclick();assert.equal(+get('projectTime').max,3);
ctx.revealed=()=>false;ctx.run();assert.ok(!get('results').innerHTML.includes('Earliest start'));
console.log('PASS: task editing, scenario actions, restoring original/custom plans, timeline playback and answer hiding.');
