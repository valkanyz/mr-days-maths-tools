(function(){
'use strict';
const original=labs.patterns.setup,MM=MachineMath,ink='#8050b4',colors=['#078477','#bd7422','#387cbd','#bf5268','#6655b8'],sup=s=>String(s).replace(/\^(-?\d+)/g,(_,n)=>[...n].map(c=>({'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'}[c])).join(''));
labs.patterns.setup=function(){
 original();const oldUpdate=update;
 $('controls').insertAdjacentHTML('beforeend',`<div id="machineExpressionControls"><label for="machineFunction">Function (use x for the input)</label><input id="machineFunction" value="2*x + 3" spellcheck="false" placeholder="e.g. 2*(x + 3)"><label for="machineInput">Input</label><input id="machineInput" value="4" spellcheck="false" placeholder="e.g. 4, 1/2, x or y"><label for="machineExample">Examples</label><select id="machineExample"><option value="">Choose an example…</option><option value="2*x+3">Multiply, then add</option><option value="(x-3)/2">Subtract, then divide</option><option value="x^2">Square the input</option><option value="2*(x+3)">Distribute across brackets</option><option value="(x+2)^2">Square a bracket</option></select><p style="font-size:12px">Use +, −, *, /, ^ and brackets. Multiplication can also be written 2x. Powers use whole numbers 0–8.</p></div>`);
 $('machineExpressionControls').insertAdjacentHTML('beforeend',slider('machineSpeed','Playback speed',1,.25,4,.25)+'<input type="hidden" id="machineHistory" value="[]">'+btn('machineClearHistory','Clear table of values'));
 $('machineExpressionControls').insertAdjacentHTML('beforeend',check('machineInside','Cutaway view',true)+btn('machineNext','Next machine'));
 let progress=0,target=1,running=false,last=0,raf=null,model=null,key='',groups=[],recorded=false;
 const historyRows=()=>{try{const rows=JSON.parse($('machineHistory').value);return Array.isArray(rows)?rows.filter(r=>Array.isArray(r)&&r.length===3&&r.every(v=>typeof v==='string')):[]}catch{return[]}};
 const stop=()=>{running=false;cancelAnimationFrame(raf);last=0};
 const frame=now=>{if(!running||current!=='patterns')return stop();if(last)progress=Math.min(target,progress+(now-last)*Number($('machineSpeed').value)/(3000*Math.max(1,model.stages.length)));last=now;run();if(progress<target)raf=requestAnimationFrame(frame);else{stop();run()}};
 const play=()=>{running=true;last=0;raf=requestAnimationFrame(frame)};
 $('machineClearHistory').onclick=()=>{$('machineHistory').value='[]';run()};
 $('machineRun').onclick=()=>{run();if($('error').textContent)return;stop();progress=0;target=1;recorded=false;play();run()};
 $('machinePause').onclick=()=>{if(running)stop();else if(progress<1){if(progress>=target)target=1;play();}run()};
 $('machineNext').onclick=()=>{run();if($('error').textContent||progress>=1)return;stop();const N=Math.max(1,model.stages.length);target=Math.min(1,(Math.floor(progress*N+1e-8)+1)/N);play();run()};
 $('machineExample').onchange=()=>{if($('machineExample').value){$('machineFunction').value=$('machineExample').value;run()}};
 update=()=>{
 const machine=$('fMode').value==='machine';$('machineExpressionControls').hidden=!machine;for(const id of ['fA','fB','fN','fRule'])showControl(id,!machine);showControl('machineSimple',false);$('machineRun').hidden=$('machinePause').hidden=!machine;
 if(!machine){stop();return oldUpdate()}
 const newKey=$('machineFunction').value+'\n'+$('machineInput').value;
 if(newKey!==key){stop();progress=0;target=1;recorded=false;model=MM.plan($('machineFunction').value,$('machineInput').value);groups=[MM.tiles(model.input,[],ink)];for(const[s,i]of model.stages.map((s,i)=>[s,i]))groups.push(MM.tiles(s.poly,groups.at(-1),colors[i%colors.length],['*','/','^'].includes(s.op)));key=newKey}
 const N=model.stages.length,done=Math.min(N,Math.floor(progress*N+1e-8)),boundary=progress>0&&Math.abs(progress*N-Math.round(progress*N))<1e-8,index=Math.min(N-1,Math.max(0,boundary?done-1:done)),phase=boundary?1:progress*N-index;
 $('machinePause').textContent=running?'Pause':'Resume';$('machinePause').disabled=progress>=1||progress===0&&!running;$('machineNext').disabled=progress>=1;
 const rawStage=model.stages[index],stage=rawStage?{...rawStage,beforeText:rawStage.beforeText||(index?model.stages[index-1].text:model.inputText)}:null,show=revealed(),hidden=!show&&index===N-1;
 const columns=Math.min(2,Math.max(1,N)),rows=Math.max(1,Math.ceil(N/columns)),width=1000*columns,height=520*rows;
 let content=N?model.stages.map((st,i)=>{const active=i===index,complete=i<done,stagePhase=complete?1:active?phase:0,stageInfo={...st,beforeText:st.beforeText||(i?model.stages[i-1].text:model.inputText)};
 return `<g data-machine="${i}" transform="translate(${i%columns*1000} ${Math.floor(i/columns)*520})">${MachineAnimation.scene({stage:stageInfo,before:groups[i],after:groups[i+1],phase:stagePhase,inside:$('machineInside').checked,color:colors[i%colors.length],hideResult:!show&&i===N-1,waiting:!active&&!complete})}</g>`;
 }).join(''):'<text x="500" y="230" text-anchor="middle" font-size="28">Input passes through unchanged</text>';
 svg(content,'Cutaway production line showing every function machine');
 const root=$('viz').querySelector('svg');root.setAttribute('viewBox',`0 0 ${width} ${height}`);root.style.height='auto';$('viz').style.height='auto';$('viz').style.overflow='visible';
 const card=(heading,value,active,col)=>`<div style="flex:1 0 155px;max-width:260px;border:2px solid ${active?col:'#e5d9ed'};border-radius:10px;padding:10px;background:${active?'#f4edf9':'white'}"><div style="font-size:12px;color:${col}">${esc(sup(heading))}</div><strong style="font-size:20px;overflow-wrap:anywhere">${esc(sup(value))}</strong></div>`;
 const cards=card('Input',model.inputText,false,ink)+model.stages.map((st,i)=>card(st.label,i<done?(i===N-1&&!show?'?':st.text):'?',i===index,colors[i%colors.length])).join('');
 root.insertAdjacentHTML('beforebegin',`<div aria-label="Outputs after each machine" style="display:flex;gap:10px;overflow-x:auto;padding:8px 0 15px">${cards}</div>`);
 formula('f('+model.variable+') = '+sup($('machineFunction').value.replace(/\*/g,'×').replace(/\//g,'÷')));
 const currentText=model.stages.at(-1)?.text||model.inputText;
 if(progress===1&&!recorded){const rows=historyRows();rows.push([$('machineFunction').value,model.inputText,currentText]);$('machineHistory').value=JSON.stringify(rows);recorded=true}
 const records=historyRows(),head=['Function','Input','Output'],display=records.map(([f,x,y])=>[sup(f.replace(/\*/g,'×').replace(/\//g,'÷')),sup(x),show?sup(y):'?']);
 $('results').innerHTML='<section style="grid-column:1/-1;min-width:0"><h3 style="margin:0 0 8px">Table of values</h3>'+(display.length?'<div style="max-height:300px;overflow:auto"><table aria-label="Table of values"><thead><tr>'+head.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+display.map(row=>'<tr>'+row.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':'<p style="margin:0;font-size:13px">Completed runs will appear here.</p>')+'</section>';table(head,display);legend([['Original input',ink],...model.stages.map((s,i)=>[sup(s.label),colors[i%colors.length]])]);
 note('Run plays the whole calculation. Next machine plays one operation and pauses at its output. All machines remain visible, in reading order. Completed outputs stay above the diagram. Switch off Cutaway view to conceal the working. Each tile represents one labelled unit; partial fills represent fractions and dashed tiles are negative. Large quantities use labelled bundles.');
 };
};
if(current==='patterns')launch('patterns');
})();
