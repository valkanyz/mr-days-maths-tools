/* SVG operation demonstrations. All displayed quantities come from the exact engine. */
(function(root){
'use strict';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const text=(x,y,s,size=18,color='#493453')=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="${color}">${esc(s)}</text>`;
const lerp=(a,b,t)=>a+(b-a)*t,clamp=t=>Math.max(0,Math.min(1,t));
function tiles(items,cx,cy,width=220,opacity=1){
 if(!items)return text(cx,cy,'Expression model',16);
 if(!items.length)return text(cx,cy,'0 units',20);
 const cols=Math.min(10,Math.max(1,Math.ceil(Math.sqrt(items.length)))),size=Math.min(32,(width-10)/cols),rows=Math.ceil(items.length/cols);
 return `<g opacity="${opacity}">`+items.map((t,i)=>{const x=cx-cols*size/2+i%cols*size,y=cy-rows*size/2+Math.floor(i/cols)*size,term=root.MachineMath.monoText(t.key),caption=(t.sign<0?'−':'')+(t.bundle?String(Number(t.amount.toPrecision(5))):'')+(term||(!t.bundle&&t.sign<0?'1':''));return `<g data-amount="${t.amount}" data-origin="${t.color}"><rect x="${x+1}" y="${y+1}" width="${size-3}" height="${size-3}" rx="3" fill="white" stroke="${t.color}" ${t.sign<0?'stroke-dasharray="3 2"':''}/><rect x="${x+1}" y="${y+1+(size-3)*(1-Math.min(t.amount,1))}" width="${size-3}" height="${(size-3)*Math.min(t.amount,1)}" rx="3" fill="${t.color}" opacity="${t.sign<0?.55:1}"/>${caption?text(x+size/2,y+size*.62,caption,Math.min(12,size*.4),'white'):''}<title>${esc((t.sign<0?'-':'')+t.amount+' '+(term||'units'))}</title></g>`;}).join('')+'</g>';
}
const scalar=p=>p&&(!p.size||p.size===1&&p.has(''))?(p.size?root.MachineMath.num(p.get('')):0):null;
function working(stage,before){const op={'*':'×','/':'÷','-':'−','+':'+','^':'^'}[stage.op];if(!op)return stage.label;const a=stage.reverse?stage.operand:before,b=stage.reverse?before:stage.operand;return `(${a}) ${op} (${b})`;}
function scene({stage,before,after,phase,inside,color,hideResult=false}){
 const input=stage.beforeText||'',u=clamp((phase-.18)/.60),finished=phase>=.86,operand=scalar(stage.operandPoly),positive=before&&before.every(t=>t.sign>0&&t.amount===1&&!t.bundle),count=before?.length||0;
 let s='<rect x="25" y="80" width="950" height="370" rx="18" fill="#f5f0f8"/>'+text(150,110,'Input',19)+text(850,110,'Output',19);
 s+=`<path d="M45 345H955" stroke="#555565" stroke-width="26"/><path d="M45 345H955" stroke="#bbc0c9" stroke-width="3" stroke-dasharray="12 8" stroke-dashoffset="${-phase*200}"/>`;
 s+=`<rect x="310" y="90" width="380" height="270" rx="16" fill="${inside?'#fff':color}" stroke="${color}" stroke-width="4"/>`+text(500,123,stage.label,22,inside?color:'white');
 s+=text(150,405,input,20)+text(850,405,finished&&!hideResult?stage.text:'?',20);
 let description='';
 if(phase<.18){s+=tiles(before,lerp(150,500,phase/.18),245,210);description='Move the input into the machine.';}
 else if(!inside){s+=text(500,240,'Processing…',22,'white');description='Turn on “See inside machines” to watch the operation.';}
 else if(hideResult){s+=text(500,235,'Result hidden',22);description='Show answers to see this final transformation.';}
 else if(stage.op==='*'&&!stage.reverse&&Number.isInteger(operand)&&operand>=1&&operand<=8&&before&&count*operand<=144 || stage.op==='*'&&stage.reverse&&Number.isInteger(operand)&&operand>=1&&operand<=8&&before&&count*operand<=144){
  const n=operand;description=stage.label.includes('distribute')?`Make ${n} copies of every term in the bracket.`:`Make ${n} equal copies of the input.`;
  for(let k=0;k<n;k++){const col=k===0?null:color,copy=before.map(t=>({...t,color:col||t.color})),cols=Math.min(n,4),x=500+(k%cols-(cols-1)/2)*85,y=n>4?215+Math.floor(k/4)*85:245;s+=`<rect x="${x-40}" y="${y-40}" width="80" height="80" rx="7" fill="none" stroke="${color}" opacity=".3"/>`+tiles(copy,lerp(500,x,u),lerp(245,y,u),72,k===0?1:u);}
 }else if(stage.op==='/'&&!stage.reverse&&Number.isInteger(operand)&&operand>=2&&operand<=8&&positive&&count<=144){
  const n=operand;description=`Share the input equally into ${n} groups. One group is the output.`;
  // Split each original unit equally, retaining its colour and term, including fractional shares.
  for(let k=0;k<n;k++){const cols=Math.min(n,4),x=500+(k%cols-(cols-1)/2)*85,y=n>4?210+Math.floor(k/4)*85:245,share=count%n===0&&before.every(t=>t.key===before[0].key)?before.filter((t,i)=>i%n===k):before.map(t=>({...t,amount:t.amount/n}));s+=`<rect x="${x-40}" y="${y-43}" width="80" height="86" rx="7" fill="${k===0?'#eef7f4':'none'}" stroke="${color}" stroke-width="${k===0?3:1}"/>`+tiles(share,lerp(500,x,u),lerp(245,y,u),72,k===0?1:1-u*.5);}
 }else if(['+','-'].includes(stage.op)&&before&&after&&!stage.reverse){
  description=stage.op==='+'?'Bring in the added units and combine like terms.':'Remove the subtracted units; use negative units if needed.';
  const pool=before.map(t=>({...t,used:false})),keep=[],add=[];for(const t of after){const match=pool.find(p=>!p.used&&p.key===t.key&&p.sign===t.sign&&Math.abs(p.amount-t.amount)<1e-9&&p.color===t.color);if(match){match.used=true;keep.push(t);}else add.push(t);}const remove=pool.filter(t=>!t.used);
  s+=tiles(keep,470,245,150)+tiles(add,lerp(640,550,u),lerp(155,245,u),130,u)+tiles(remove,lerp(470,340,u),lerp(245,320,u),130,1-u);
  if(remove.length&&u<.95)s+=text(lerp(470,340,u),lerp(245,320,u),'×',40,'#c6374e');
 }else if(stage.op==='^'&&!stage.reverse&&operand===2&&positive&&count>0&&count<=10&&before.every(t=>t.key==='')){
  description=`Build a ${count} by ${count} square: ${count} groups of ${count}.`;
  const size=Math.min(23,170/count);for(let i=0;i<count*count;i++){const t=after?.[i]||{color},x=500+(i%count-(count-1)/2)*size,y=245+(Math.floor(i/count)-(count-1)/2)*size;s+=`<rect x="${lerp(500,x,u)-size/2}" y="${lerp(245,y,u)-size/2}" width="${size-2}" height="${size-2}" fill="${t.color}" opacity="${i<count?1:u}"/>`;}
  s+=text(500,335,`${count} × ${count}`,18);
 }else{
  const factors=stage.op==='^'&&!stage.reverse&&Number.isInteger(operand)&&operand>0?Array.from({length:operand},()=>`(${input})`).join(' × '):working(stage,input);
  description=stage.op==='^'?'Multiply the input by itself the indicated number of times.':stage.op==='/'?'Divide and simplify each term.':stage.label.includes('distribute')?'Multiply every term, then collect like terms.':'Apply the operation and simplify.';
  s+=text(500,205,factors,Math.max(12,Math.min(22,520/Math.max(20,factors.length))),color)+`<path d="M500 225V${225+u*35}" stroke="${color}" stroke-width="3"/>`+`<g opacity="${u}">${text(500,290,stage.text,22,color)}</g>`;
 }
 if(phase>=.86&&!hideResult)s+=tiles(after,lerp(500,850,(phase-.86)/.14),245,210);
 if(finished&&inside&&!hideResult)s+=`<rect x="320" y="145" width="360" height="195" fill="white"/>`+text(500,235,'Complete',23,color);
 s+=text(500,40,finished&&!hideResult?working(stage,input)+' = '+stage.text:working(stage,input),22,color)+text(500,490,description,16);
 return s;
}
root.MachineAnimation={scene,tiles,working};if(typeof module!=='undefined'&&module.exports)module.exports=root.MachineAnimation;
})(typeof window!=='undefined'?window:globalThis);
