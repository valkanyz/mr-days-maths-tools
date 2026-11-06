(()=>{
'use strict';
const original=labs.networks.setup;
labs.networks.setup=function(){original();$('controls').querySelector('.section').insertAdjacentHTML('beforebegin','<div id="ntControls">'+check('ntTeach','Follow algorithm decisions',true)+input('ntStep','Decision step',0,0,100,1)+input('ntSpeed','Seconds per decision',1,0.2,5,.2)+'<button id="ntPrev">Previous decision</button><button id="ntNext">Next decision</button><button id="netPlay">Play / pause decisions</button><div><label for="ntGuess">Predict next edge (e.g. A B)</label><input id="ntGuess"></div><button id="ntCheck">Check prediction</button><p id="ntFeedback" role="status"></p></div>');let playing=false,stamp=0,key='',steps=[];const base=update;
 $('ntPrev').onclick=()=>{$('ntStep').value=Math.max(0,+$('ntStep').value-1);run();};$('ntNext').onclick=()=>{$('ntStep').value=Math.min(steps.length,+$('ntStep').value+1);run();};
 $('netPlay').onclick=()=>{playing=!playing;stamp=0;if(playing)requestAnimationFrame(tick);};function tick(t){if(!playing||current!=='networks'){playing=false;return;}if(!stamp)stamp=t;if(t-stamp>=value('ntSpeed')*1000){$('ntStep').value=Math.min(steps.length,+$('ntStep').value+1);stamp=t;run();if(+$('ntStep').value>=steps.length)playing=false;}if(playing)requestAnimationFrame(tick);}
 $('ntCheck').onclick=()=>{const next=steps[+$('ntStep').value],guess=$('ntGuess').value.trim().split(/[ ,–-]+/).sort().join(' ');$('ntFeedback').textContent=!next?'All decisions have been shown.':guess===next.edge.slice(0,2).sort().join(' ')?'Yes. Reveal the next decision to check its effect.':'Try again: compare the eligible edge weights or tentative distances.';};
 update=()=>{base();const task=$('task').value,on=['mst','path'].includes(task);$('ntControls').hidden=!on;for(const id of ['ntPrev','ntNext'])$(id).hidden=!on||!$('ntTeach').checked;if(!on||!$('ntTeach').checked)return;const {edges,names}=NetworkGraph.parse($('edges').value),nextKey=JSON.stringify([edges,task,$('start').value,$('end').value]);if(key!==nextKey){key=nextKey;$('ntStep').value=0;playing=false;}
 steps=[];if(task==='mst'){const parent=Object.fromEntries(names.map(n=>[n,n])),find=n=>parent[n]===n?n:find(parent[n]),accepted=[];for(const edge of [...edges].sort((a,b)=>a[2]-b[2])){const [a,b,w]=edge;const keep=find(a)!==find(b);if(keep){parent[find(a)]=find(b);accepted.push(edge);}steps.push({edge,accepted:[...accepted],label:`${a}–${b} (${w}): ${keep?'add; it connects separate components':'skip; it would form a cycle'}.`});}}
 else{const dist=Object.fromEntries(names.map(n=>[n,Infinity])),done=new Set(),accepted=[];dist[$('start').value.trim()]=0;while(done.size<names.length){const u=names.filter(n=>!done.has(n)).sort((a,b)=>dist[a]-dist[b])[0];if(!Number.isFinite(dist[u]))break;done.add(u);for(const e of edges){const v=e[0]===u?e[1]:e[1]===u?e[0]:null;if(v===null||done.has(v))continue;const candidate=dist[u]+e[2],better=candidate<dist[v];if(better){dist[v]=candidate;accepted.push(e);}steps.push({edge:e,accepted:[...accepted],label:`Settle ${u} (${dist[u]}). Test ${u} → ${v}: ${candidate}${better?' improves the tentative distance':' does not improve it'}.`,dist:{...dist}});}}}
 $('ntStep').max=steps.length;const n=Math.min(steps.length,value('ntStep')),state=n&&shown()?steps[n-1]:null;$('ntPrev').disabled=n===0;$('ntNext').disabled=n===steps.length;
 let s=NetworkGraph.draw(names,edges,false,(i,edge)=>{
   const active=state?.edge===edge,selected=state?.accepted.includes(edge);
   return {color:active?C.gold:selected?C.teal:'#aaa',width:active?6:selected?4:2};
 },$('vertexDegrees').checked);
 if(state?.dist){const pts=NetworkGraph.positions(names);for(const name of names){const [x,y]=pts[name];s+=txt(x,y+($('vertexDegrees').checked?56:38),Number.isFinite(state.dist[name])?state.dist[name]:'∞',16);}}
 svg(s,'Algorithm decisions on a weighted network');formula(state?state.label:steps.length?'Predict the first edge, then reveal a decision.':'There are no eligible edges to test.');results([['Decision',n+' / '+steps.length],['Algorithm',task==='mst'?'Kruskal':'Dijkstra']]);table(['Decision','Explanation'],shown()?steps.slice(0,n).map((s,i)=>[i+1,s.label]):[]);legend([['Current edge',C.gold],['Accepted / improved so far',C.teal]]);note(task==='mst'?'Edges are tested in ascending weight order. Equal weights use their input order; other valid tie choices may give a different minimum spanning tree.':'Each settled vertex has the smallest remaining tentative distance. Green edges record improvements during the algorithm; they are not necessarily the final shortest path. Turn off “Follow algorithm decisions” to see the final solution.');};
 function shown(){return $('reveal').checked;}
 const teachingUpdate=update;
 $('ntControls').insertAdjacentHTML('beforebegin',check('adjMatrix','Show adjacency matrix')+check('vertexDegrees','Show vertex degrees'));
 let lastTask='';
 update=()=>{
   const task=$('task').value;
   if(lastTask!==task&&task==='communication')$('adjMatrix').checked=true;
   lastTask=task;
   for(const id of ['adjMatrix','vertexDegrees'])showControl(id,task!=='assignment');
   if(task!=='assignment'){
     const {names}=NetworkGraph.parse($('edges').value);
     for(const [id,fallback] of [['start',names[0]],['end',names.at(-1)]]){
       let el=$(id);
       if(el.tagName!=='SELECT'){const select=document.createElement('select');select.id=id;const old=el.value;el.replaceWith(select);el=select;el.dataset.initial=old;}
       const before=el.dataset.initial||el.value;delete el.dataset.initial;
       if([...el.options].map(o=>o.value).join('|')!==names.join('|')){
         el.replaceChildren(...names.map(name=>new Option(name,name)));
         el.value=names.includes(before)?before:fallback;
       }
       el.disabled=task!=='path'&&task!=='flow';
     }
   }
   teachingUpdate();
   if(task==='assignment'||task==='communication'||!$('adjMatrix').checked)return;
   const {names,edges}=NetworkGraph.parse($('edges').value);
   const rows=NetworkGraph.matrix(names,edges,task==='flow');
   const matrix=document.createElement('section');
   matrix.innerHTML='<h3>Adjacency matrix</h3><div style="overflow-x:auto"><table><thead><tr><th>From / to</th>'+names.map(v=>'<th>'+esc(v)+'</th>').join('')+'</tr></thead><tbody>'+rows.map((row,i)=>'<tr><th>'+esc(names[i])+'</th>'+row.map(n=>'<td>'+n+'</td>').join('')+'</tr>').join('')+'</tbody></table></div><p>Each entry counts edges. Each loop counts once on the diagonal.</p>';
   $('viz').after(matrix);matrix.id='networkAdjacency';
 };
 const render=update;update=()=>{$('networkAdjacency')?.remove();render()};
};if(current==='networks')launch(current);
})();
