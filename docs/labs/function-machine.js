(function(){
'use strict';
const original=labs.patterns.setup,MM=MachineMath,ink='#8050b4',colors=['#078477','#bd7422','#387cbd','#bf5268','#6655b8'],sup=s=>String(s).replace(/\^(-?\d+)/g,(_,n)=>[...n].map(c=>({'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'}[c])).join(''));
labs.patterns.setup=function(){
 original();const oldUpdate=update;
 $('controls').insertAdjacentHTML('beforeend',`<div id="machineExpressionControls"><label for="machineFunction">Function (use x for the input)</label><input id="machineFunction" value="2*x + 3" spellcheck="false" placeholder="e.g. 2*(x + 3)"><label for="machineInput">Input</label><input id="machineInput" value="4" spellcheck="false" placeholder="e.g. 4, 1/2, x or y"><label for="machineExample">Examples</label><select id="machineExample"><option value="">Choose an example…</option><option value="2*x+3">Multiply, then add</option><option value="(x-3)/2">Subtract, then divide</option><option value="x^2">Square the input</option><option value="2*(x+3)">Distribute across brackets</option><option value="(x+2)^2">Square a bracket</option></select><p style="font-size:12px">Use +, −, *, /, ^ and brackets. Multiplication can also be written 2x. Powers use whole numbers 0–8.</p></div>`);
 let progress=0,running=false,last=0,raf=null,model=null,key='',groups=[];
 const stop=()=>{running=false;cancelAnimationFrame(raf);last=0};
 const frame=now=>{if(!running||current!=='patterns')return stop();if(last)progress=Math.min(1,progress+(now-last)/((6*Math.max(1,model.stages.length)+6)*1000));last=now;run();if(progress<1)raf=requestAnimationFrame(frame);else{stop();$('machinePause').textContent='Pause'}};
 $('machineRun').onclick=()=>{try{run();if($('error').textContent)return;stop();progress=0;running=true;run();raf=requestAnimationFrame(frame)}catch(e){$('error').textContent=e.message}};
 $('machinePause').onclick=()=>{if(running)stop();else{if(progress>=1)return;running=true;last=0;raf=requestAnimationFrame(frame)}$('machinePause').textContent=running?'Pause':'Resume'};
 $('machineExample').onchange=()=>{if($('machineExample').value){$('machineFunction').value=$('machineExample').value;run()}};
 update=()=>{
 const machine=$('fMode').value==='machine';$('machineExpressionControls').hidden=!machine;for(const id of ['fA','fB','fN','fRule'])showControl(id,!machine);showControl('machineSimple',machine);$('machineRun').hidden=$('machinePause').hidden=!machine;
 if(!machine){stop();return oldUpdate()}
 const newKey=$('machineFunction').value+'\n'+$('machineInput').value;
 if(newKey!==key){stop();progress=0;model=MM.plan($('machineFunction').value,$('machineInput').value);groups=[MM.tiles(model.input,[],ink)];for(const[s,i]of model.stages.map((s,i)=>[s,i]))groups.push(MM.tiles(s.poly,groups.at(-1),colors[i%colors.length],['*','/','^'].includes(s.op)));key=newKey}
 $('machinePause').textContent=running?'Pause':progress>0&&progress<1?'Resume':'Pause';$('machinePause').disabled=progress>=1;
 const simple=$('machineSimple').checked,N=model.stages.length,W=Math.max(840,400+N*360),centres=Array.from({length:N},(_,i)=>300+i*360),px=120+(W-240)*progress;
 const stage=centres.filter(c=>px>=c).length,group=groups[stage],cols=group?Math.min(12,Math.max(1,Math.ceil(Math.sqrt(group.length)))):8,rows=group?Math.ceil(group.length/cols):3,pitch=16,tileW=cols*pitch;
 const inside=centres.some(c=>Math.abs(px-c)<80+tileW/2),done=centres.filter(c=>px-tileW/2>c+80).length,finalHidden=stage===N&&!revealed(),currentText=stage?model.stages[stage-1].text:model.inputText;
 let s=`<defs><pattern id="functionFloor" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" stroke="#ece6ef" fill="none"/></pattern></defs><rect width="${W}" height="500" fill="url(#functionFloor)"/>`;
 if(!simple){s+=`<rect x="30" y="320" width="${W-60}" height="55" rx="26" fill="#4f5363"/><path d="M50 332H${W-50}M50 362H${W-50}" stroke="#b9bfca" stroke-width="5" stroke-dasharray="8 8" stroke-dashoffset="${-progress*500}"/>`;for(let x=55;x<W-40;x+=40)s+=`<circle cx="${x}" cy="347" r="8" fill="#252c3b" stroke="#8e96a7" stroke-width="3"/>`}
 else s+=`<path d="M70 250H${W-70}" stroke="#b8a6c9" stroke-width="3"/>`;
 const label=(x,y,text,size=17,col='#493453')=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="${col}">${esc(sup(text))}</text>`;
 // Every tile is one unit of its labelled term. Fractional units occupy proportional area.
 s+=`<g class="machine-products" transform="translate(${px-tileW/2} ${315-rows*pitch})">`;
 if(!finalHidden&&group)for(let i=0;i<group.length;i++){const t=group[i],x=i%cols*pitch,y=Math.floor(i/cols)*pitch;s+=`<g class="machine-unit" data-origin="${t.color}"><rect x="${x}" y="${y}" width="14" height="14" fill="white" stroke="${t.color}" ${t.sign<0?'stroke-dasharray="2 1"':''}/><rect x="${x}" y="${y+14*(1-t.amount)}" width="14" height="${14*t.amount}" fill="${t.color}"/>${t.key?label(x+7,y+11,MM.monoText(t.key),9,'white'):t.sign<0?label(x+7,y+11,'−',9,'white'):''}<title>${esc((t.sign<0?'−':'')+t.amount+' '+(MM.monoText(t.key)||'unit'))}</title></g>`}
 s+='</g>';
 for(const[c,i]of centres.map((c,i)=>[c,i])){const col=colors[i%colors.length],title=model.stages[i].label,parts=title.split(' · ');s+=`<g class="machine-front"><rect x="${c-80}" y="100" width="160" height="250" rx="12" fill="${simple?'#f4eef8':col}" stroke="${col}" stroke-width="4"/><rect x="${c-70}" y="120" width="140" height="70" rx="6" fill="white"/>`+label(c,149,parts[0],Math.max(9,Math.min(24,180/Math.max(7,parts[0].length))),col)+(parts[1]?label(c,175,parts[1],13,col):'')+(simple?'':`<circle cx="${c-40}" cy="280" r="12" fill="#eac36a"/><path d="M${c+15} 270h35m-35 12h35m-35 12h35" stroke="#fff9" stroke-width="4"/>`)+'</g>'}
 // Processing labels and the working table never announce a result inside a machine.
 s+=label(px,65,inside?'Processing…':finalHidden?'?':currentText,20,ink);
 if(!inside&&!finalHidden&&!group)s+=label(px,300,'Value shown above · tile detail unavailable',11);
 s+=label(95,410,'Input: '+model.inputText,17,ink)+label(W-120,410,progress===1&&revealed()?'Output: '+currentText:'Output: ?',17,ink);
 svg(s,'Function production line with individually coloured input and added units');const root=$('viz').querySelector('svg');root.setAttribute('viewBox',`0 0 ${W} 460`);root.style.minWidth=W+'px';root.style.height='auto';$('viz').style.height='auto';$('viz').style.overflowX='auto';if(running)$('viz').scrollLeft=Math.max(0,px-$('viz').clientWidth*.65);
 formula('f('+model.variable+') = '+sup($('machineFunction').value.replace(/\*/g,'×').replace(/\//g,'÷')));
 const visibleRows=[['Input',model.inputText],...model.stages.slice(0,done).map((s,i)=>['After '+s.label,i===N-1&&!revealed()?'?':s.text])];
 $('results').innerHTML='';table(['Stage','Value'],visibleRows.map(r=>r.map(sup)));legend([['Original input',ink],...model.stages.map((s,i)=>[sup(s.label),colors[i%colors.length]])]);
 note('Original units keep their colour. Extra units take the colour of the machine that creates them. Subtraction removes units; dashed tiles are negative and partly filled tiles are fractions. Letters label algebraic units. Bracketed products are expanded. Results appear after the whole group leaves a machine. Up to 144 individual tiles are drawn; larger or rational expressions use a value display.');
 };
};
if(current==='patterns')launch('patterns');
})();
