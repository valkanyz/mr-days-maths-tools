(function(){
'use strict';
const original=labs.patterns.setup,MM=MachineMath,ink='#8050b4',colors=['#078477','#bd7422','#387cbd','#bf5268','#6655b8'],sup=s=>String(s).replace(/\^(-?\d+)/g,(_,n)=>[...n].map(c=>({'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'}[c])).join(''));
labs.patterns.setup=function(){
 original();const oldUpdate=update;
 $('controls').insertAdjacentHTML('beforeend',`<div id="machineExpressionControls"><label for="machineFunction">Function (use x for the input)</label><input id="machineFunction" value="2*x + 3" spellcheck="false" placeholder="e.g. 2*(x + 3)"><label for="machineInput">Input</label><input id="machineInput" value="4" spellcheck="false" placeholder="e.g. 4, 1/2, x or y"><label for="machineExample">Examples</label><select id="machineExample"><option value="">Choose an example…</option><option value="2*x+3">Multiply, then add</option><option value="(x-3)/2">Subtract, then divide</option><option value="x^2">Square the input</option><option value="2*(x+3)">Distribute across brackets</option><option value="(x+2)^2">Square a bracket</option></select><p style="font-size:12px">Use +, −, *, /, ^ and brackets. Multiplication can also be written 2x. Powers use whole numbers 0–8.</p></div>`);
 $('machineExpressionControls').insertAdjacentHTML('beforeend',slider('machineSpeed','Playback speed',1,.25,4,.25)+'<input type="hidden" id="machineHistory" value="[]">'+btn('machineClearHistory','Clear table of values'));
 $('machineExpressionControls').insertAdjacentHTML('beforeend',check('machineInside','Cutaway view',true)+check('machineContinuous','Continuous production',false)+btn('machineNext','Next machine'));
 let progress=0,target=1,running=false,last=0,raf=null,model=null,key='',groups=[],recorded=false,produced=0;
 const historyRows=()=>{try{const rows=JSON.parse($('machineHistory').value);return Array.isArray(rows)?rows.filter(r=>Array.isArray(r)&&r.length===3&&r.every(v=>typeof v==='string')):[]}catch{return[]}};
 const stop=()=>{running=false;cancelAnimationFrame(raf);last=0};
 const frame=now=>{if(!running||current!=='patterns')return stop();if(last)progress=Math.min(target,progress+(now-last)*Number($('machineSpeed').value)/(3000*Math.max(1,model.stages.length)));last=now;run();if(progress<target)raf=requestAnimationFrame(frame);else{stop();run()}};
 const play=()=>{running=true;last=0;raf=requestAnimationFrame(frame)};
 $('machineClearHistory').onclick=()=>{$('machineHistory').value='[]';run()};
 $('machineRun').onclick=()=>{run();if($('error').textContent)return;stop();progress=0;target=$('machineContinuous').checked?Infinity:1;recorded=false;produced=0;play();run()};
 $('machinePause').onclick=()=>{if(running)stop();else if(progress<1||$('machineContinuous').checked){if(progress>=target)target=$('machineContinuous').checked?Infinity:1;play();}run()};
 $('machineNext').onclick=()=>{run();if($('error').textContent||progress>=1)return;stop();const N=Math.max(1,model.stages.length);target=Math.min(1,(Math.floor(progress*N+1e-8)+1)/N);play();run()};
 $('machineContinuous').onchange=()=>{stop();progress=0;target=$('machineContinuous').checked?Infinity:1;recorded=false;produced=0;run()};
 $('machineExample').onchange=()=>{if($('machineExample').value){$('machineFunction').value=$('machineExample').value;run()}};
 update=()=>{
 const machine=$('fMode').value==='machine';$('machineExpressionControls').hidden=!machine;for(const id of ['fA','fB','fN','fRule'])showControl(id,!machine);showControl('machineSimple',false);$('machineRun').hidden=$('machinePause').hidden=!machine;
 if(!machine){stop();return oldUpdate()}
 const newKey=$('machineFunction').value+'\n'+$('machineInput').value;
 if(newKey!==key){stop();progress=0;target=$('machineContinuous').checked?Infinity:1;recorded=false;produced=0;model=MM.plan($('machineFunction').value,$('machineInput').value);groups=[MM.tiles(model.input,[],ink)];for(const[s,i]of model.stages.map((s,i)=>[s,i]))groups.push(MM.tiles(s.poly,groups.at(-1),colors[i%colors.length],['*','/','^'].includes(s.op)));MachineAnimation.arrangeGroups(groups,model.stages);key=newKey}
 const continuous=$('machineContinuous').checked,N=model.stages.length,done=Math.min(N,Math.floor(progress*N+1e-8)),boundary=progress>0&&Math.abs(progress*N-Math.round(progress*N))<1e-8,index=Math.min(N-1,Math.max(0,boundary?done-1:done)),phase=boundary?1:progress*N-index;
 $('machinePause').textContent=running?'Pause':'Resume';$('machinePause').disabled=!continuous&&progress>=1||progress===0&&!running;$('machineNext').disabled=continuous||progress>=1;
 const rawStage=model.stages[index],stage=rawStage?{...rawStage,beforeText:rawStage.beforeText||(index?model.stages[index-1].text:model.inputText)}:null,show=revealed(),hidden=!show&&index===N-1;
 // Adjacent scenes overlap at their output/input tray; alternating rows reverse direction.
 const columns=Math.min($('viz').clientWidth>=1200?3:2,Math.max(1,N)),rows=Math.max(1,Math.ceil(N/columns)),width=700*columns+300,height=520*rows+30;
 const location=i=>{const row=Math.floor(i/columns),slot=i%columns;return {row,reverse:row%2===1,x:(row%2?columns-1-slot:slot)*700,y:row*520}};
 let belt=`M55 345H${width-55}`;
 for(let row=1;row<rows;row++){const y=345+(row-1)*520,next=y+520;if(row%2)belt+=`Q${width-15} ${y} ${width-15} ${y+40}V${next-40}Q${width-15} ${next} ${width-55} ${next}H55`;else belt+=`Q15 ${y} 15 ${y+40}V${next-40}Q15 ${next} 55 ${next}H${width-55}`;}
 let content=`<path data-continuous-belt="true" d="${belt}" fill="none" stroke="#555565" stroke-width="26" stroke-linejoin="round"/><path d="${belt}" fill="none" stroke="#bbc0c9" stroke-width="3" stroke-dasharray="12 8" stroke-dashoffset="${-progress*Math.max(1,N)*200}"/>`;
 content+=N?model.stages.map((st,i)=>{const age=progress*N-i,active=continuous?age>=0:i===index,complete=i<done,cycle=age>0&&Math.abs(age-Math.round(age))<1e-8?1:age-Math.floor(age),stagePhase=continuous?Math.max(0,cycle):complete?1:active?phase:0,stageInfo={...st,beforeText:st.beforeText||(i?model.stages[i-1].text:model.inputText)},pos=location(i),turn=i<N-1&&Math.floor((i+1)/columns)!==pos.row,transfer=turn&&stagePhase>=.86&&(active||!continuous&&i===index);
 let machine=MachineAnimation.scene({stage:stageInfo,before:groups[i],after:groups[i+1],phase:stagePhase,inside:$('machineInside').checked,color:colors[i%colors.length],hideResult:!show&&i===N-1,waiting:!active&&!complete,sharedBelt:true,showInput:i===0,hideAfter:transfer||i<N-1&&complete&&!active});
 if(pos.reverse)machine='<g transform="translate(1000 0) scale(-1 1)">'+machine.replace(/<text x="([^"]+)"/g,(_,x)=>`<text transform="translate(${2*Number(x)} 0) scale(-1 1)" x="${x}"`)+'</g>';
 let carried='';
 if(transfer&&(!(!show&&i===N-1))){const f=Math.max(0,Math.min(1,(stagePhase-.86)/.14)),startX=pos.x+500,exitX=pos.x+(pos.reverse?150:850),startY=pos.y+245,nextY=startY+520,travel=Math.min(1,f/.4),bend=Math.max(0,(f-.4)/.6),x=f<.4?startX+(exitX-startX)*travel:exitX+(pos.reverse?-125:125)*Math.sin(Math.PI*bend),y=startY+(nextY-startY)*bend;carried=`<g data-belt-transfer="${i}">${MachineAnimation.tiles(groups[i+1],x,y,210)}</g>`;}
 return `<g data-machine="${i}" data-direction="${pos.reverse?'left':'right'}" transform="translate(${pos.x} ${pos.y})">${machine}</g>${carried}`;
 }).join(''):'<text x="500" y="230" text-anchor="middle" font-size="28">Input passes through unchanged</text>';
 svg(content,'Cutaway production line showing every function machine');
 const root=$('viz').querySelector('svg');root.setAttribute('viewBox',`0 0 ${width} ${height}`);root.style.height='auto';$('viz').style.height='auto';$('viz').style.overflow='visible';
 const card=(heading,value,active,col)=>`<div style="flex:1 0 155px;max-width:260px;border:2px solid ${active?col:'#e5d9ed'};border-radius:10px;padding:10px;background:${active?'#f4edf9':'white'}"><div style="font-size:12px;color:${col}">${esc(sup(heading))}</div><strong style="font-size:20px;overflow-wrap:anywhere">${esc(sup(value))}</strong></div>`;
 const cards=card('Input',model.inputText,false,ink)+model.stages.map((st,i)=>card(st.label,i<done?(i===N-1&&!show?'?':st.text):'?',continuous?progress*N>=i:i===index,colors[i%colors.length])).join('');
 root.insertAdjacentHTML('beforebegin',`<div aria-label="Outputs after each machine" style="display:flex;gap:10px;overflow-x:auto;padding:8px 0 15px">${cards}</div>`);
 formula('f('+model.variable+') = '+sup($('machineFunction').value.replace(/\*/g,'×').replace(/\//g,'÷')));
 const currentText=model.stages.at(-1)?.text||model.inputText;
 const completed=continuous?Math.max(0,Math.floor(progress*Math.max(1,N)+1e-8)-Math.max(1,N)+1):progress===1?1:0;
 if(completed>produced){const records=historyRows();for(let n=produced;n<completed;n++)records.push([$('machineFunction').value,model.inputText,currentText]);$('machineHistory').value=JSON.stringify(records);produced=completed;recorded=true;}
 const records=historyRows(),head=['Function','Input','Output'],display=records.map(([f,x,y])=>[sup(f.replace(/\*/g,'×').replace(/\//g,'÷')),sup(x),show?sup(y):'?']);
 $('results').innerHTML='<section style="grid-column:1/-1;min-width:0"><h3 style="margin:0 0 8px">Table of values</h3>'+(display.length?'<div style="max-height:300px;overflow:auto"><table aria-label="Table of values"><thead><tr>'+head.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+display.map(row=>'<tr>'+row.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':'<p style="margin:0;font-size:13px">Completed runs will appear here.</p>')+'</section>';table(head,display);legend([['Original input',ink],...model.stages.map((s,i)=>[sup(s.label),colors[i%colors.length]])]);
 note('Run plays the whole calculation. Next machine plays one operation and pauses at its output. The belt snakes onto the next level after two machines (three on wide screens). Continuous production feeds a fresh input every cycle; Pause stops the line. Switch the toggle off to return to single-input mode. Completed outputs stay above the diagram. Switch off Cutaway view to conceal the working. Each tile represents one labelled unit; partial fills represent fractions and dashed tiles are negative. Large quantities use labelled bundles.');
 };
};
if(current==='patterns')launch('patterns');
})();
