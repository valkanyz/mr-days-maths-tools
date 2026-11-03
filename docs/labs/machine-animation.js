/* SVG operation demonstrations. All displayed quantities come from the exact engine. */
(function(root){
'use strict';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const text=(x,y,s,size=18,color='#493453')=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="${color}">${esc(s)}</text>`;
const lerp=(a,b,t)=>a+(b-a)*t,clamp=t=>Math.max(0,Math.min(1,t));
function tileLayout(count,width=220){
 const w=Math.max(20,width-10),h=Math.min(160,w),cols=Math.max(1,Math.min(count||1,Math.ceil(Math.sqrt(count*w/h)))),rows=Math.max(1,Math.ceil(count/cols));
 return {cols,rows,size:Math.min(32,w/cols,h/rows)};
}
function operationTitle(stage){
 if(stage.reverse&&['-','/','^'].includes(stage.op))return stage.label;
 if(stage.op==='^')return stage.operand==='2'?'Square':stage.operand==='3'?'Cube':'Power '+stage.operand;
 return stage.label.split(' · ')[0];
}
function tiles(items,cx,cy,width=220,opacity=1){
 if(!items)return text(cx,cy,'Expression model',16);
 if(!items.length)return ''; // Empty animation subgroups must not display a zero label.
 const {cols,rows,size}=tileLayout(items.length,width),gap=Math.min(3,size*.12);
 return `<g opacity="${opacity}">`+items.map((t,i)=>{const x=cx-cols*size/2+i%cols*size,y=cy-rows*size/2+Math.floor(i/cols)*size,term=root.MachineMath.monoText(t.key),caption=(t.sign<0?'−':'')+(t.bundle?String(Number(t.amount.toPrecision(5))):'')+(term||(!t.bundle&&t.sign<0?'1':''));return `<g data-amount="${t.amount}" data-origin="${t.color}"><rect x="${x+1}" y="${y+1}" width="${size-gap}" height="${size-gap}" rx="3" fill="white" stroke="${t.color}" ${t.sign<0?'stroke-dasharray="3 2"':''}/><rect x="${x+1}" y="${y+1+(size-gap)*(1-Math.min(t.amount,1))}" width="${size-gap}" height="${(size-gap)*Math.min(t.amount,1)}" rx="3" fill="${t.color}" opacity="${t.sign<0?.55:1}"/>${caption?text(x+size/2,y+size*.62,caption,Math.min(12,size*.4,(size-gap)*1.5/Math.max(1,caption.length)),'white'):''}<title>${esc((t.sign<0?'-':'')+t.amount+' '+(term||'units'))}</title></g>`;}).join('')+'</g>';
}
const scalar=p=>p&&(!p.size||p.size===1&&p.has(''))?(p.size?root.MachineMath.num(p.get('')):0):null;
function working(stage,before){const op={'*':'×','/':'÷','-':'−','+':'+','^':'^'}[stage.op];if(!op)return stage.label;const a=stage.reverse?stage.operand:before,b=stage.reverse?before:stage.operand;return `(${a}) ${op} (${b})`;}
// Match each retained unit to its original slot, then move it to its output slot.
function tileSlots(items,cx=500,cy=245,width=210){
 const {cols,rows,size}=tileLayout(items.length,width),gap=Math.min(3,size*.12);
 return items.map((t,i)=>({x:cx-cols*size/2+(i%cols+.5)*size,y:cy-rows*size/2+(Math.floor(i/cols)+.5)*size,size}));
}
function transition(before,after,u){
 const from=tileSlots(before),to=tileSlots(after),used=new Set();let s='';
 const unit=(t,x,y,size,opacity)=>`<g transform="translate(${x} ${y}) scale(${size/32})">${tiles([t],0,0,220,opacity)}</g>`;
 after.forEach((t,i)=>{const j=before.findIndex((p,k)=>!used.has(k)&&p.key===t.key&&p.sign===t.sign&&Math.abs(p.amount-t.amount)<1e-9&&p.color===t.color),end=to[i];
 if(j>=0){used.add(j);const start=from[j];s+=unit(t,lerp(start.x,end.x,u),lerp(start.y,end.y,u),lerp(start.size,end.size,u),1);}
 else s+=unit(t,end.x,lerp(end.y-110,end.y,u),end.size,u);
 });
 before.forEach((t,i)=>{if(used.has(i))return;const p=from[i];s+=unit(t,p.x,lerp(p.y,p.y+90,u),p.size,1-u);if(u>0&&u<.9)s+=text(p.x,lerp(p.y,p.y+90,u)+5,'×',20,'#c6374e');});
 return s;
}
function scene({stage,before,after,phase,inside,color,hideResult=false,waiting=false,sharedBelt=false,showInput=true,hideAfter=false}){
 const input=stage.beforeText||'',u=clamp((phase-.18)/.60),finished=phase>=.86,operand=scalar(stage.operandPoly),positive=before&&before.every(t=>t.sign>0&&t.amount===1&&!t.bundle),count=before?.length||0;
 let s=(sharedBelt?'':'<rect x="25" y="80" width="950" height="370" rx="18" fill="#f5f0f8"/>')+`<g data-flow-arrow="true" stroke="#725a82" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M115 110H180L165 95M180 110L165 125M815 110H880L865 95M880 110L865 125"/></g>`;
 if(!sharedBelt)s+=`<path d="M45 345H955" stroke="#555565" stroke-width="26"/><path d="M45 345H955" stroke="#bbc0c9" stroke-width="3" stroke-dasharray="12 8" stroke-dashoffset="${-phase*200}"/>`;
 // The coloured housing remains visible around an exposed working chamber.
 s+=`<path d="M310 110L335 85H690V350H310Z" fill="${color}" stroke="${color}" stroke-width="4"/><path d="M310 110H665L690 85M665 110V350" fill="none" stroke="white" stroke-opacity=".4" stroke-width="3"/><rect x="330" y="145" width="330" height="185" rx="8" fill="${inside?'#f7f9fc':color}" stroke="${inside?'#b8a9c7':color}" stroke-width="2" ${inside?'stroke-dasharray="7 4"':''}/>`+`<rect x="347" y="91" width="296" height="47" rx="7" fill="white"/><g data-operation-sign="true" font-weight="750">${text(495,126,operationTitle(stage),Math.min(36,430/Math.max(10,operationTitle(stage).length)),color)}<title>${esc(stage.label)}</title></g>`;
 s+=(showInput?text(150,405,waiting?'?':input,20):'')+text(850,405,finished&&!hideResult&&!waiting?stage.text:'?',20);
 if(waiting)return s+text(500,240,'Waiting',22,inside?'#806b91':'white');
 let description='';
 if(finished){if(!hideResult&&!hideAfter){s+=tiles(after,lerp(500,850,clamp((phase-.86)/.14)),245,210);if(after&&!after.length)s+=text(lerp(500,850,clamp((phase-.86)/.14)),245,'0',24);}s+=text(500,190,'Complete',19,inside?color:'white');description='Output ready.';}
 else if(phase<.18){s+=tiles(before,lerp(150,500,phase/.18),245,210);if(before&&!before.length)s+=text(lerp(150,500,phase/.18),245,'0',24);description='Move the input into the machine.';}
 else if(!inside){s+=text(500,240,'Processing…',22,'white');description='Turn on “Cutaway view” to watch the operation.';}
 else if(hideResult){s+=text(500,235,'Result hidden',22);description='Show answers to see this final transformation.';}
 else if(stage.op==='*'&&!stage.reverse&&Number.isInteger(operand)&&operand>=1&&operand<=8&&before&&count*operand<=144 || stage.op==='*'&&stage.reverse&&Number.isInteger(operand)&&operand>=1&&operand<=8&&before&&count*operand<=144){
  const n=operand;description=stage.label.includes('distribute')?`Make ${n} copies of every term in the bracket.`:`Make ${n} equal copies of the input.`;
  for(let k=0;k<n;k++){const col=k===0?null:color,copy=before.map(t=>({...t,color:col||t.color})),cols=Math.min(n,4),x=500+(k%cols-(cols-1)/2)*80,y=n>4?205+Math.floor(k/4)*80:245;s+=`<rect x="${x-40}" y="${y-40}" width="80" height="80" rx="7" fill="none" stroke="${color}" opacity=".3"/>`+tiles(copy,lerp(500,x,u),lerp(245,y,u),72,k===0?1:u);}
 }else if(stage.op==='/'&&!stage.reverse&&Number.isInteger(operand)&&operand>=2&&operand<=8&&positive&&count<=144){
  const n=operand;description=`Share the input equally into ${n} groups. One group is the output.`;
  // Split each original unit equally, retaining its colour and term, including fractional shares.
  for(let k=0;k<n;k++){const cols=Math.min(n,4),x=500+(k%cols-(cols-1)/2)*80,y=n>4?205+Math.floor(k/4)*80:245,share=count%n===0&&before.every(t=>t.key===before[0].key)?before.filter((t,i)=>i%n===k):before.map(t=>({...t,amount:t.amount/n}));s+=`<rect x="${x-40}" y="${y-43}" width="80" height="86" rx="7" fill="${k===0?'#eef7f4':'none'}" stroke="${color}" stroke-width="${k===0?3:1}"/>`+tiles(share,lerp(500,x,u),lerp(245,y,u),72,k===0?1:1-u*.5);}
 }else if(['+','-'].includes(stage.op)&&before&&after&&!stage.reverse){
  description=stage.op==='+'?'Bring in the added units and combine like terms.':'Remove the subtracted units; use negative units if needed.';
  s+=transition(before,after,u);
 }else if(stage.op==='^'&&!stage.reverse&&operand===2&&positive&&count>0&&count<=10&&before.every(t=>t.key==='')){
  description=`Build a ${count} by ${count} square: ${count} groups of ${count}.`;
  const size=Math.min(23,170/count);for(let i=0;i<count*count;i++){const t=after?.[i]||{color},x=500+(i%count-(count-1)/2)*size,y=245+(Math.floor(i/count)-(count-1)/2)*size;s+=`<rect x="${lerp(500,x,u)-size/2}" y="${lerp(245,y,u)-size/2}" width="${size-2}" height="${size-2}" fill="${t.color}" opacity="${i<count?1:u}"/>`;}
  s+=text(500,335,`${count} × ${count}`,18);
 }else{
  const factors=stage.op==='^'&&!stage.reverse&&Number.isInteger(operand)&&operand>0?Array.from({length:operand},()=>`(${input})`).join(' × '):working(stage,input);
  description=stage.op==='^'?'Multiply the input by itself the indicated number of times.':stage.op==='/'?'Divide and simplify each term.':stage.label.includes('distribute')?'Multiply every term, then collect like terms.':'Apply the operation and simplify.';
  s+=text(500,205,factors,Math.max(12,Math.min(22,520/Math.max(20,factors.length))),color)+`<path d="M500 225V${225+u*35}" stroke="${color}" stroke-width="3"/>`+`<g opacity="${u}">${text(500,290,stage.text,22,color)}</g>`;
 }
 s+=text(500,40,finished&&!hideResult?working(stage,input)+' = '+stage.text:working(stage,input),22,color)+text(500,490,description,16);
 return s;
}
root.MachineAnimation={scene,tiles,working,tileSlots,transition,tileLayout,operationTitle};if(typeof module!=='undefined'&&module.exports)module.exports=root.MachineAnimation;
})(typeof window!=='undefined'?window:globalThis);
