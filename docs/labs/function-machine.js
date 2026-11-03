(function(){
'use strict';
const original=labs.patterns.setup,MM=MachineMath,ink='#8050b4',colors=['#078477','#bd7422','#387cbd','#bf5268','#6655b8'],sup=s=>String(s).replace(/\^(-?\d+)/g,(_,n)=>[...n].map(c=>({'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'}[c])).join(''));
labs.patterns.setup=function(){
 original();const oldUpdate=update;
 $('controls').insertAdjacentHTML('beforeend',`<div id="machineExpressionControls"><label for="machineFunction">Function (use x for the input)</label><input id="machineFunction" value="2*x + 3" spellcheck="false" placeholder="e.g. 2*(x + 3)"><label for="machineInput">Input</label><input id="machineInput" value="4" spellcheck="false" placeholder="e.g. 4, 1/2, x or y"><label for="machineExample">Examples</label><select id="machineExample"><option value="">Choose an example…</option><option value="2*x+3">Multiply, then add</option><option value="(x-3)/2">Subtract, then divide</option><option value="x^2">Square the input</option><option value="2*(x+3)">Distribute across brackets</option><option value="(x+2)^2">Square a bracket</option></select><p style="font-size:12px">Use +, −, *, /, ^ and brackets. Multiplication can also be written 2x. Powers use whole numbers 0–8.</p></div>`);
 $('machineExpressionControls').insertAdjacentHTML('beforeend',slider('machineSpeed','Playback speed',1,.25,4,.25)+'<input type="hidden" id="machineHistory" value="[]">'+btn('machineClearHistory','Clear table of values'));
 $('machineExpressionControls').insertAdjacentHTML('beforeend',check('machineInside','Cutaway view',true)+check('machineContinuous','Continuous production',false)+btn('machineNext','Next machine'));
 let progress=0,target=1,running=false,last=0,raf=null,model=null,key='',groups=[],recorded=false,produced=0,lastFunction=null,durations=[],ends=[],starts=[],cycleTime=1;
 const historyRows=()=>{try{const rows=JSON.parse($('machineHistory').value);return Array.isArray(rows)?rows.filter(r=>Array.isArray(r)&&r.length===3&&r.every(v=>typeof v==='string')&&r[0]===$('machineFunction').value):[]}catch{return[]}};
 const stop=()=>{running=false;cancelAnimationFrame(raf);last=0};
 const frame=now=>{if(!running||current!=='patterns')return stop();if(last)progress=Math.min(target,progress+(now-last)*Number($('machineSpeed').value)/(3000*Math.max(1,model.stages.length)));last=now;run();if(progress<target)raf=requestAnimationFrame(frame);else{stop();run()}};
 const play=()=>{running=true;last=0;raf=requestAnimationFrame(frame)};
 $('machineClearHistory').onclick=()=>{$('machineHistory').value='[]';run()};
 $('machineRun').onclick=()=>{run();if($('error').textContent)return;stop();progress=0;target=$('machineContinuous').checked?Infinity:1;recorded=false;produced=0;play();run()};
 $('machinePause').onclick=()=>{if(running)stop();else if(progress<1||$('machineContinuous').checked){if(progress>=target)target=$('machineContinuous').checked?Infinity:1;play();}run()};
 $('machineNext').onclick=()=>{run();if($('error').textContent||progress>=1)return;stop();const N=Math.max(1,model.stages.length);target=(ends.find(t=>t>progress*N+1e-8)||N)/N;play();run()};
 $('machineContinuous').onchange=()=>{stop();progress=0;target=$('machineContinuous').checked?Infinity:1;recorded=false;produced=0;run()};
 $('machineExample').onchange=()=>{if($('machineExample').value){$('machineFunction').value=$('machineExample').value;run()}};
 update=()=>{
 const machine=$('fMode').value==='machine';$('machineExpressionControls').hidden=!machine;for(const id of ['fA','fB','fN','fRule'])showControl(id,!machine);showControl('machineSimple',false);$('machineRun').hidden=$('machinePause').hidden=!machine;
 if(!machine){stop();return oldUpdate()}
 const functionText=$('machineFunction').value;if(lastFunction!==null&&lastFunction!==functionText)$('machineHistory').value='[]';lastFunction=functionText;
 const newKey=$('machineFunction').value+'\n'+$('machineInput').value;
 if(newKey!==key){stop();progress=0;target=$('machineContinuous').checked?Infinity:1;recorded=false;produced=0;model=MM.plan($('machineFunction').value,$('machineInput').value);groups=[MM.tiles(model.input,[],ink)];for(const[s,i]of model.stages.map((s,i)=>[s,i]))groups.push(MM.tiles(s.poly,groups.at(-1),colors[i%colors.length],['*','/','^'].includes(s.op)));MachineAnimation.arrangeGroups(groups,model.stages);const weights=model.stages.map(()=>.88+Math.random()*.24),sum=weights.reduce((a,b)=>a+b,0);durations=weights.map(w=>w*weights.length/sum);let elapsed=0;starts=durations.map(d=>{const start=elapsed;elapsed+=d;return start});ends=starts.map((t,i)=>t+durations[i]);if(ends.length)ends[ends.length-1]=model.stages.length;cycleTime=Math.max(1,...durations)*1.03;key=newKey}
 const continuous=$('machineContinuous').checked,N=model.stages.length,elapsed=progress*Math.max(1,N),done=ends.filter(t=>elapsed>=t-1e-8).length,boundary=ends.some(t=>Math.abs(elapsed-t)<1e-8),index=Math.min(N-1,Math.max(0,boundary?done-1:done)),phase=N?Math.max(0,Math.min(1,(elapsed-starts[index])/durations[index])):0;
 const motionPhase=(local,duration)=>local<=.16?.18*Math.max(0,local)/.16:local>=duration-.16?.86+.14*Math.min(1,(local-duration+.16)/.16):.18+.68*(local-.16)/(duration-.32);
 const stageClock=i=>{const age=elapsed-starts[i];if(age<0)return {active:false,phase:0,completed:0,batch:-1};const batch=Math.floor(age/cycleTime),local=age-batch*cycleTime;return {active:true,phase:motionPhase(local,durations[i]),batch,completed:batch+(local>=durations[i]-1e-8?1:0)};};
 $('machinePause').textContent=running?'Pause':'Resume';$('machinePause').disabled=!continuous&&progress>=1||progress===0&&!running;$('machineNext').disabled=continuous||progress>=1;
 const rawStage=model.stages[index],stage=rawStage?{...rawStage,beforeText:rawStage.beforeText||(index?model.stages[index-1].text:model.inputText)}:null,show=revealed(),hidden=!show&&index===N-1;
 // Adjacent scenes overlap at their output/input tray; alternating rows reverse direction.
 const columns=Math.min($('viz').clientWidth>=1200?3:2,Math.max(1,N)),rows=Math.max(1,Math.ceil(N/columns)),width=700*columns+300,height=520*rows+30;
 const location=i=>{const row=Math.floor(i/columns),slot=i%columns;return {row,reverse:row%2===1,x:(row%2?columns-1-slot:slot)*700,y:row*520}};
 let belt=`M-200 345H${width-55}`;
 for(let row=1;row<rows;row++){const y=345+(row-1)*520,next=y+520;if(row%2)belt+=`Q${width-15} ${y} ${width-15} ${y+40}V${next-40}Q${width-15} ${next} ${width-55} ${next}H55`;else belt+=`Q15 ${y} 15 ${y+40}V${next-40}Q15 ${next} 55 ${next}H${width-55}`;}
 let content=`<path data-continuous-belt="true" d="${belt}" fill="none" stroke="#555565" stroke-width="26" stroke-linejoin="round"/><path d="${belt}" fill="none" stroke="#bbc0c9" stroke-width="3" stroke-dasharray="12 8" stroke-dashoffset="${-progress*Math.max(1,N)*200}"/>`;
 content+=N?model.stages.map((st,i)=>{const clock=stageClock(i),active=continuous?clock.active:i===index,complete=i<done,stagePhase=continuous?clock.phase:complete?1:active?motionPhase(elapsed-starts[i],durations[i]):0,stageInfo={...st,beforeText:st.beforeText||(i?model.stages[i-1].text:model.inputText)},pos=location(i),turn=i<N-1&&Math.floor((i+1)/columns)!==pos.row,handedOff=continuous&&i<N-1&&stageClock(i+1).active&&stageClock(i+1).batch>=clock.batch,transfer=turn&&stagePhase>=.86&&!handedOff&&(active||!continuous&&i===index);
 let machine=MachineAnimation.scene({stage:stageInfo,before:groups[i],after:groups[i+1],phase:stagePhase,inside:$('machineInside').checked,color:colors[i%colors.length],hideResult:!show&&i===N-1,waiting:!active&&!complete,sharedBelt:true,showInput:i===0,hideAfter:transfer||handedOff||i<N-1&&complete&&!active});
 if(pos.reverse)machine='<g transform="translate(1000 0) scale(-1 1)">'+machine.replace(/<text x="([^"]+)"/g,(_,x)=>`<text transform="translate(${2*Number(x)} 0) scale(-1 1)" x="${x}"`)+'</g>';
 let carried='';
 if(transfer&&(!(!show&&i===N-1))){const f=Math.max(0,Math.min(1,(stagePhase-.86)/.14)),startX=pos.x+500,exitX=pos.x+(pos.reverse?150:850),startY=pos.y+245,nextY=startY+520,travel=Math.min(1,f/.4),bend=Math.max(0,(f-.4)/.6),smoothBend=bend*bend*(3-2*bend),x=f<.4?startX+(exitX-startX)*travel:exitX+(pos.reverse?-125:125)*Math.sin(Math.PI*smoothBend),y=startY+(nextY-startY)*smoothBend;carried=`<g data-belt-transfer="${i}">${MachineAnimation.tiles(groups[i+1],x,y,210)}</g>`;}
 return `<g data-machine="${i}" data-duration="${durations[i]}" data-direction="${pos.reverse?'left':'right'}" transform="translate(${pos.x} ${pos.y})">${machine}</g>${carried}`;
 }).join(''):'<text x="500" y="230" text-anchor="middle" font-size="28">Input passes through unchanged</text>';
 if(continuous&&N){
 // Keep a fresh batch at the feed end, behind the batch currently entering the first machine.
 content+=`<g data-waiting-input="true">${MachineAnimation.tiles(groups[0],-90,245,210)}</g>`;
 const clock=stageClock(N-1),age=elapsed-starts[N-1],pos=location(N-1),dir=pos.reverse?-1:1,exit=pos.x+(pos.reverse?150:850);
 if(age>=cycleTime&&show){const fraction=clock.phase,push=Math.max(0,Math.min(1,(fraction-.86)/.14));
 // The previous batch stays put until the arriving batch reaches it, then slides to the outlet.
 const movement=Math.max(0,(push-.35)/.65),outlet=pos.reverse?-450:width+230,x=exit+(outlet-exit)*movement;
 content+=`<g data-waiting-output="true" data-push="${movement}">${MachineAnimation.tiles(groups[N],x,pos.y+245,210)}</g>`;
 }
 }
 svg(content,'Cutaway production line showing every function machine');
 const root=$('viz').querySelector('svg');root.setAttribute('viewBox',`${continuous?-220:0} 0 ${width+(continuous?220:0)} ${height}`);root.style.height='auto';root.style.overflow='hidden';$('viz').style.height='auto';$('viz').style.overflow='visible';
 const card=(heading,value,active,col)=>`<div style="flex:1 0 155px;max-width:260px;border:2px solid ${active?col:'#e5d9ed'};border-radius:10px;padding:10px;background:${active?'#f4edf9':'white'}"><div style="font-size:12px;color:${col}">${esc(sup(heading))}</div><strong style="font-size:20px;overflow-wrap:anywhere">${esc(sup(value))}</strong></div>`;
 const cards=card('Input',model.inputText,false,ink)+model.stages.map((st,i)=>card(st.label,i<done?(i===N-1&&!show?'?':st.text):'?',continuous?stageClock(i).active:i===index,colors[i%colors.length])).join('');
 root.insertAdjacentHTML('beforebegin',`<div aria-label="Outputs after each machine" style="display:flex;gap:10px;overflow-x:auto;padding:8px 0 15px">${cards}</div>`);
 formula('f('+model.variable+') = '+sup($('machineFunction').value.replace(/\*/g,'×').replace(/\//g,'÷')));
 const currentText=model.stages.at(-1)?.text||model.inputText;
 const completed=continuous?(N?stageClock(N-1).completed:Math.floor(progress)):progress===1?1:0;
 if(completed>produced){const records=historyRows(),row=[functionText,model.inputText,currentText],existing=records.findIndex(r=>r[1]===model.inputText);if(existing<0)records.push(row);else records[existing]=row;$('machineHistory').value=JSON.stringify(records);produced=completed;recorded=true;}
 // Exact rational comparisons put fractions and negative inputs in numerical order.
 const rational=text=>{try{const p=MM.plan('x',text).input;return !p.size?[0n,1n]:p.size===1&&p.has('')?p.get(''):null}catch{return null}};
 const records=[...new Map(historyRows().map(r=>[r[1],r])).values()].sort((a,b)=>{const x=rational(a[1]),y=rational(b[1]);if(x&&y){const d=x[0]*y[1]-y[0]*x[1];return d<0n?-1:d>0n?1:0;}if(x)return -1;if(y)return 1;return a[1].localeCompare(b[1],undefined,{numeric:true})});
 $('machineHistory').value=JSON.stringify(records);
 const inputs=records.map(r=>sup(r[1])),outputs=records.map(r=>show?sup(r[2]):'?'),cellStyle='border:2px solid #443b49;padding:14px 20px;min-width:75px;text-align:center;font-size:20px;background:white;position:static;',row=(label,values)=>'<tr><th scope="row" style="'+cellStyle+'font-weight:750">'+label+'</th>'+ (values.length?values:['']).map(v=>'<td style="'+cellStyle+'">'+esc(v)+'</td>').join('')+'</tr>';
 $('results').innerHTML='<section style="grid-column:1/-1;min-width:0"><h3 style="margin:0 0 8px">Table of values</h3><div style="overflow-x:auto"><table aria-label="Table of values" style="width:auto;border-collapse:collapse"><tbody>'+row('x',inputs)+row('y',outputs)+'</tbody></table></div></section>';
 table(['x',...inputs],[['y',...outputs]]);legend([['Original input',ink],...model.stages.map((s,i)=>[sup(s.label),colors[i%colors.length]])]);
 note('Run plays the whole calculation. Try different inputs to add sorted columns to the x/y table. Changing the function clears the table. Next machine plays one operation and pauses at its output. The belt snakes onto the next level after two machines (three on wide screens). Continuous production feeds a fresh input every cycle; Pause stops the line. Switch the toggle off to return to single-input mode. Completed outputs stay above the diagram. Switch off Cutaway view to conceal the working. Each tile represents one labelled unit; partial fills represent fractions and dashed tiles are negative. Large quantities use labelled bundles.');
 };
};
if(current==='patterns')launch('patterns');
})();
