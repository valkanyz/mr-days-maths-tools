/* Angle-aware windows and progressively finer sampling for trig functions. */
(function(root){
'use strict';
const M=root.MachineMath,ops=['sin','cos','tan'],isTrig=text=>/(?:^|[^a-zA-Z])(?:sin|cos|tan)\s*\(/i.test(text),scalar=p=>p&&(!p.size||p.size===1&&p.has(''))?(p.size?M.num(p.get('')):0):null;
function piLabel(x){if(Math.abs(x)<1e-10)return '0';const ratio=x/Math.PI;for(let d=1;d<=720;d++){const n=Math.round(ratio*d);if(Math.abs(ratio-n/d)<1e-9){const sign=n<0?'−':'',v=Math.abs(n);return sign+(v===1?'':v)+'π'+(d===1?'':'/'+d);}}return String(Number(x.toFixed(10)));}
function describe(text,mode='radians'){
 if(!isTrig(text))return null;const ast=M.parse(text),trigs=[],variables=[];
 function visit(a){if(!a)return;if(a.op==='variable')variables.push(a.v);if(ops.includes(a.op))trigs.push(a);visit(a.a);visit(a.b);}visit(ast);
 const variable=variables.includes('x')?'x':variables[0]||'x',unit=mode==='degrees'?1:Math.PI/180,full=360*unit,windows=[];
 for(const node of trigs){try{const p=M.evaluate(node.a,variable,new Map([[variable+'^1',[1n,1n]]]),mode);if(!p||[...p.keys()].some(k=>k!==''&&k!==variable+'^1'))continue;const b=p.has(variable+'^1')?M.num(p.get(variable+'^1')):0,c=p.has('')?M.num(p.get('')):0;if(!Number.isFinite(b)||!Number.isFinite(c)||!b)continue;const h=-c/b,width=full/Math.abs(b);if(Number.isFinite(h)&&Number.isFinite(width)&&width>0)windows.push({min:h,max:h+width,b,c,op:node.op});}catch{}}
 if(!windows.length)windows.push({min:0,max:full,b:1,c:0});
 const min=Math.min(...windows.map(w=>w.min)),max=Math.max(...windows.map(w=>w.max)),hasTan=trigs.some(a=>a.op==='tan');
 const asymptotes=[];
 for(const w of windows.filter(w=>w.op==='tan')){
  const a=Math.min(w.b*min+w.c,w.b*max+w.c),z=Math.max(w.b*min+w.c,w.b*max+w.c),half=180*unit;
  for(let k=Math.ceil((a-90*unit)/half-1e-10);k<=Math.floor((z-90*unit)/half+1e-10);k++){
   const value=(90*unit+k*half-w.c)/w.b;
   if(!asymptotes.some(v=>Math.abs(v-value)<1e-9))asymptotes.push(value);
  }
 }
 asymptotes.sort((a,b)=>a-b);
 const ticks=[];for(let i=0;i<=8;i++){const x=min+(max-min)*i/8;ticks.push({value:x,label:mode==='radians'?piLabel(x):String(Number(x.toFixed(8)))+'°'});}
 // Substitute tan values of -5, 0 and 5 to carry vertical scaling/translation
 // through the surrounding expression without sampling arbitrarily near a pole.
 const limits=[];
 if(hasTan){const replace=(a,t)=>a.op==='tan'?{op:'number',v:[BigInt(t),1n]}:{...a,...(a.a?{a:replace(a.a,t)}:{}),...(a.b?{b:replace(a.b,t)}:{})};for(const t of [-5,0,5])for(const w of windows)try{const input=M.plan('x',String(Number((w.min+(w.max-w.min)/8).toFixed(12)))).input,v=scalar(M.evaluate(replace(ast,t),variable,input,mode));if(v!==null&&Number.isFinite(v))limits.push(v);}catch{}}
 return {min,max,ticks,windows,asymptotes,hasTan,limits,mode,unit,variable};
}
function inputs(text,mode='radians'){
 const info=describe(text,mode);if(!info)return [];const seen=new Set(),entries=[];
 for(const [tier,step]of [90,60,30,15,10,5].entries())for(const w of info.windows)for(let angle=0;angle<=360;angle+=step){const value=w.min+angle*info.unit/Math.abs(w.b),key=value.toFixed(10);if(seen.has(key))continue;seen.add(key);const input=mode==='radians'?piLabel(value).replaceAll('π','pi').replaceAll('−','-'):String(Number(value.toFixed(10)));try{M.plan(text,input,mode);entries.push({value,input,tier});}catch{}}
 return entries;
}
const api={isTrig,describe,inputs,piLabel};root.MachineTrig=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
