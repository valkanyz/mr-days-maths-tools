/* Dependency-aware belts: a merge consumes two results from the same input batch. */
(function(root){
'use strict';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=(x,y,s,size=17,color='#493453')=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="${color}">${escape(s)}</text>`;
function schedule(stages,durations){const starts=[],ends=[];for(let i=0;i<stages.length;i++){starts[i]=Math.max(0,...stages[i].parents.map(p=>p<0?0:ends[p]));ends[i]=starts[i]+durations[i];}const factor=stages.length/ends.at(-1);return {starts:starts.map(t=>t*factor),ends:ends.map(t=>t*factor),durations:durations.map(t=>t*factor)};}
function layout(stages){let lane=0;const nodes=[],sources=[];function place(i){const st=stages[i],parents=st.parents.map((p,k)=>{if(p<0){const source={x:90,y:100+(lane++)*240,target:i,port:k};sources.push(source);return source;}return nodes[p]||place(p);});const node={x:Math.max(...parents.map(p=>p.x))+310,y:parents.reduce((s,p)=>s+p.y,0)/parents.length,parents};nodes[i]=node;return node;}place(stages.length-1);return {nodes,sources,width:Math.max(...nodes.map(n=>n.x))+175,height:Math.max(...nodes.map(n=>n.y),...sources.map(n=>n.y))+160};}
function render({model,groups,batchAt,clock,elapsed,continuous,starts,ends,durations,cycleTime,show,inside,colors,ink}){
 const graph=layout(model.stages),{nodes,sources,width,height}=graph,N=nodes.length;
 let content='<defs><marker id="branchArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#8c8198"/></marker></defs>';
 const packet=(tiles,x,y)=>`<g transform="translate(${x} ${y}) scale(.35)">${MachineAnimation.tiles(tiles,0,0,160)}</g>`;
 // Sources are independent copies, not a split of the input's quantity.
 for(const source of sources){const c=clock(source.target),batch=batchAt(Math.max(0,c.batch));content+=`<g data-branch-source="${source.target}-${source.port}"><rect x="${source.x-60}" y="${source.y-52}" width="120" height="104" rx="12" fill="#f4eafb" stroke="${ink}" stroke-width="2"/>${label(source.x,source.y-25,'Same input',14,ink)}${label(source.x,source.y+8,batch.model.inputText,22,ink)}${label(source.x,source.y+34,'copy of x',12,ink)}</g>`;}
 nodes.forEach((pos,i)=>{const st=model.stages[i],c=clock(i),batch=batchAt(Math.max(0,c.batch)),bst=batch.model.stages[i],active=continuous?c.active:elapsed>=starts[i]&&elapsed<ends[i],complete=!continuous&&elapsed>=ends[i],phase=continuous?c.phase:complete?1:Math.max(0,Math.min(1,(elapsed-starts[i])/durations[i]));
 pos.parents.forEach((parent,k)=>{const p=st.parents[k],x1=parent.x+(p<0?60:110),y1=parent.y,x2=pos.x-110,y2=pos.y+(st.join?(k?28:-28):0),mid=(x1+x2)/2,path=`M${x1} ${y1} C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}`;content+=`<path d="${path}" fill="none" stroke="#e1dbe7" stroke-width="13"/><path d="${path}" fill="none" stroke="#8c8198" stroke-width="2" marker-end="url(#branchArrow)"/>`;
 const ready=p<0?0:ends[p],batchNo=continuous?Math.max(0,c.batch):0,age=elapsed-batchNo*cycleTime;
 if(age>=ready&&age<starts[i]+durations[i]*.2){let t=age<starts[i]?0.8:Math.min(1,(age-starts[i])/(durations[i]*.2)),u=1-t,x=u*u*u*x1+3*u*u*t*mid+3*u*t*t*mid+t*t*t*x2,y=u*u*u*y1+3*u*u*t*y1+3*u*t*t*y2+t*t*t*y2;content+=`<g data-branch-transfer="${i}-${k}" data-batch="${batchNo}" data-input="${escape(batch.model.inputText)}">${packet(batch.groups[p+1],x,y)}</g>`;}
 });
 const color=colors[i%colors.length],finished=continuous?c.completed>0:complete,finishedBatch=continuous?batchAt(c.completed-1):batch,answer=finished&&!(i===N-1&&!show)?finishedBatch.model.stages[i].text:'?',symbol={'*':'×','/':'÷','+':'+','-':'−','^':'^'}[st.op]||st.op;
 let inner='';if(inside){const parent=st.parents[0],before=batch.groups[parent+1],after=batch.groups[i+1],u=Math.max(0,Math.min(1,(phase-.2)/.6));if(active||complete){inner=`<g transform="translate(${pos.x} ${pos.y+5}) scale(.43) translate(-500 -245)">${i===N-1&&!show?'':MachineAnimation.transition(before,after,u)}</g>`;if(st.join){const left=parent<0?batch.model.inputText:batch.model.stages[parent].text,right=st.parents[1]<0?batch.model.inputText:batch.model.stages[st.parents[1]].text;inner+=label(pos.x,pos.y-42,`${left} ${symbol} (${right})`,14,color);}}else inner=label(pos.x,pos.y+8,'Waiting',18,'#8c8198');}else inner=label(pos.x,pos.y+8,active?'Processing…':complete?'Complete':'Waiting',18,color);
 content+=`<g data-machine="${i}" data-branch-join="${!!st.join}" data-batch="${c.batch}" data-input="${escape(batch.model.inputText)}"><rect x="${pos.x-110}" y="${pos.y-66}" width="220" height="132" rx="12" fill="${active?'#f8f0fc':'#fff'}" stroke="${color}" stroke-width="${active?3:2}"/>${label(pos.x,pos.y-84,st.label,18,color)}${inner}${label(pos.x,pos.y+91,st.expressionText.replace(/\^2/g,'²').replace(/\^3/g,'³'),17,color)}${label(pos.x,pos.y+116,continuous&&finished?'x = '+finishedBatch.model.inputText+' → '+answer:answer,18,color)}</g>`;
 });
 content+=label(width/2,height-10,'Each branch receives the same x. The merge waits for both results from that input.',16);
 return {content,width,height};
}
const api={schedule,layout,render};root.MachineBranches=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
