/* Exact arithmetic and symbolic polynomial model for the function production line. */
(function(root){
'use strict';
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a||1n};
const rat=(n,d=1n)=>{if(!d)throw Error('Division by zero is undefined.');if(d<0n){n=-n;d=-d}const g=gcd(n,d);return[n/g,d/g]};
const add=(a,b)=>rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),mul=(a,b)=>rat(a[0]*b[0],a[1]*b[1]),neg=a=>[-a[0],a[1]],div=(a,b)=>rat(a[0]*b[1],a[1]*b[0]),rtext=a=>a[1]===1n?String(a[0]):a.join('/'),num=a=>Number(a[0])/Number(a[1]);
const decimal=s=>{const p=s.split('.');return rat(BigInt((p[0]||'0')+(p[1]||'')),10n**BigInt((p[1]||'').length))};
function parse(text){
 text=text.trim().replace(/√(\d+)/g,'sqrt($1)').replaceAll('π','pi').replace(/(^|[^a-zA-Z])(sin|cos|tan)(?=\s*\()/gi,(_,prefix,name)=>prefix+name.toLowerCase()).replace(/^[a-zA-Z]+\([^)]*\)\s*=\s*/,'').replace(/^[a-zA-Z]\s*=\s*/,'').replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,s=>'^'+[...s].map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join(''));
 if(!text||text.length>200)throw Error('Enter an expression of up to 200 characters.');
 const raw=text.match(/\d*\.\d+|\d+|[a-zA-Z]+|[()+*/^\-]/g)||[];
 if(raw.join('')!==text.replace(/\s/g,''))throw Error('Use numbers, letters, +, −, ×, ÷, powers and brackets.');
 const ts=[];for(const t of raw){const prev=ts.at(-1);if(prev&&!(['sin','cos','tan','sqrt'].includes(prev)&&t==='(')&&(/[\w.)]$/.test(prev))&&(/^[a-zA-Z.(]/.test(t)||/^\d/.test(t)&&prev===')'))ts.push('*');ts.push(t)}let i=0;
 function atom(){const t=ts[i++];if(['sin','cos','tan','sqrt'].includes(t)){if(ts[i++]!=='(')throw Error('Use brackets, for example sin(x).');const a=sum();if(ts[i++]!==')')throw Error('Close the trigonometric bracket.');return {op:t,a};}if(t==='pi')return {op:'number',v:decimal(Math.PI.toFixed(15)),pi:true};if(t==='('){const e=sum();if(ts[i++]!==')')throw Error('Close each opening bracket.');return e}if(/^\d*\.?\d+$/.test(t||''))return{op:'number',v:decimal(t)};if(/^[a-zA-Z]+$/.test(t||'')&&t.length<=12)return{op:'variable',v:t};throw Error('An operand is missing or invalid.')}
 function power(){let a=atom();if(ts[i]==='^'){i++;a={op:'^',a,b:unary()}}return a}
 function unary(){if(ts[i]==='+'){i++;return unary()}if(ts[i]==='-'){i++;return{op:'*',a:{op:'number',v:rat(-1n)},b:unary()}}return power()}
 function product(){let a=unary();while(['*','/'].includes(ts[i])){const op=ts[i++];a={op,a,b:unary()}}return a}
 function sum(){let a=product();while(['+','-'].includes(ts[i])){const op=ts[i++];a={op,a,b:product()}}return a}
 const ast=sum();if(i!==ts.length)throw Error('Check the expression and brackets.');return ast;
}
const mono=k=>k?Object.fromEntries(k.split('*').map(s=>{const[a,b]=s.split('^');return[a,Number(b)]})):{};
const key=m=>Object.keys(m).sort().filter(k=>m[k]).map(k=>k+'^'+m[k]).join('*');
const monomul=(a,b,d=1)=>{const m=mono(a);for(const[k,v]of Object.entries(mono(b)))m[k]=(m[k]||0)+d*v;return key(m)};
function combine(a,b,op){
 if(op==='/'&&b&&!b.size)throw Error('Division by zero is undefined.');if(!a||!b)return null;const c=new Map(a);
 if(op==='+'||op==='-'){for(const[k,v]of b)c.set(k,add(c.get(k)||rat(0n),op==='-'?neg(v):v))}
 if(op==='*'){c.clear();for(const[k,v]of a)for(const[l,w]of b){const t=monomul(k,l);c.set(t,add(c.get(t)||rat(0n),mul(v,w)))}}
 if(op==='/'){if(!b.size)throw Error('Division by zero is undefined.');if(b.size!==1)return null;c.clear();const[k,v]=[...b][0];for(const[l,w]of a)c.set(monomul(l,k,-1),div(w,v))}
 if(op==='^'){if(b.size>1||b.size===1&&!b.has(''))throw Error('Use a whole-number exponent from 0 to 8.');const n=b.size?num(b.get('')):0;if(!Number.isInteger(n)||n<0||n>8)throw Error('Use a whole-number exponent from 0 to 8.');let p=new Map([['',rat(1n)]]);for(let i=0;i<n;i++)p=combine(p,a,'*');return p}
 for(const[k,v]of c)if(v[0]===0n)c.delete(k);if(c.size>100)throw Error('This expansion is too large; use a simpler expression.');return c;
}
const trigOp=op=>['sin','cos','tan'].includes(op);
function evaluate(ast,variable,input,mode='radians'){
 if(ast.op==='number')return new Map(ast.v[0]?[['',ast.v]]:[]);
 if(ast.op==='variable')return ast.v===variable?input:new Map([[ast.v+'^1',rat(1n)]]);
 if(ast.op==='sqrt'){const p=evaluate(ast.a,variable,input,mode);if(!p||p.size>1||p.size===1&&!p.has(''))return null;const v=Math.sqrt(p.size?num(p.get('')):0);if(!Number.isFinite(v))throw Error('Square root is not real.');return new Map(v?[['',decimal(v.toFixed(12))]]:[]);}
 if(trigOp(ast.op)){const p=evaluate(ast.a,variable,input,mode);if(!p||p.size>1||p.size===1&&!p.has(''))return null;let angle=p.size?num(p.get('')):0;if(mode==='degrees')angle*=Math.PI/180;if(!Number.isFinite(angle))throw Error('The angle is too large.');if(ast.op==='tan'&&Math.abs(Math.cos(angle))<1e-10)throw Error('tan is undefined at this angle (a vertical asymptote).');let v=Math[ast.op](angle);if(Math.abs(v)<1e-10)v=0;if(Math.abs(v-Math.round(v))<1e-10)v=Math.round(v);return new Map(v?[['',decimal(v.toFixed(12))]]:[]);}
 return combine(evaluate(ast.a,variable,input,mode),evaluate(ast.b,variable,input,mode),ast.op);
}
const monoText=k=>Object.entries(mono(k)).map(([v,p])=>v+(p===1?'':'^'+p)).join('');
function format(p){if(!p)return '';if(!p.size)return'0';return [...p].sort(([a],[b])=>{const degree=k=>Object.values(mono(k)).reduce((s,v)=>s+v,0);return degree(b)-degree(a)||a.localeCompare(b)}).map(([k,v],i)=>{const negative=v[0]<0n,abs=rat(negative?-v[0]:v[0],v[1]),c=rtext(abs),term=(k&&c==='1'?'':c)+monoText(k);return(i?(negative?' − ':' + '):negative?'−':'')+term}).join('')}
function expression(ast,variable,inputText){if(ast.op==='number')return ast.pi?'π':rtext(ast.v);if(trigOp(ast.op))return ast.op+'('+expression(ast.a,variable,inputText)+')';if(ast.op==='variable')return ast.v===variable?'('+inputText+')':ast.v;return '('+expression(ast.a,variable,inputText)+' '+({'*':'×','/':'÷'}[ast.op]||ast.op)+' '+expression(ast.b,variable,inputText)+')'}
const depends=(a,v)=>!a?false:a.op==='variable'?a.v===v:a.a?depends(a.a,v)||depends(a.b,v):false;
// Exact arithmetic in Q(√2, √3), covering the familiar 15° special angles.
function surdAdd(a,b){const c=new Map(a);for(const[k,v]of b)c.set(k,add(c.get(k)||rat(0n),v));for(const[k,v]of c)if(!v[0])c.delete(k);return c;}
function surdScale(a,q){return new Map([...a].map(([k,v])=>[k,mul(v,q)]).filter(([,v])=>v[0]));}
function surdMul(a,b){let c=new Map;for(const[k,v]of a)for(const[l,w]of b){let r=k*l,f=1;for(let p=2;p*p<=r;p++)while(r%(p*p)===0){r/=p*p;f*=p;}c=surdAdd(c,new Map([[r,mul(mul(v,w),rat(BigInt(f)))]]));}return c;}
function surdDiv(a,b){let numerator=new Map(a),denominator=new Map(b);if(!b.size)return null;for(const prime of [2,3]){if([...denominator.keys()].some(k=>k%prime===0)){const conjugate=new Map([...denominator].map(([k,v])=>[k,k%prime===0?neg(v):v]));numerator=surdMul(numerator,conjugate);denominator=surdMul(denominator,conjugate);}}if(denominator.size!==1||!denominator.has(1))return null;return surdScale(numerator,div(rat(1n),denominator.get(1)));}
function exactAngle(ast,variable,inputAst,mode){
 const subst=a=>a.op==='variable'&&a.v===variable?substInput(inputAst):a.pi?{op:'variable',v:'ExactPi'}:{...a,...(a.a?{a:subst(a.a)}:{}),...(a.b?{b:subst(a.b)}:{})};
 const substInput=a=>a.pi?{op:'variable',v:'ExactPi'}:{...a,...(a.a?{a:substInput(a.a)}:{}),...(a.b?{b:substInput(a.b)}:{})};
 try{const p=evaluate(subst(ast),'',null,mode);if(!p||p.size>1)return null;if(!p.size)return rat(0n);const key=mode==='degrees'?'':'ExactPi^1';if(!p.has(key))return null;return mode==='degrees'?div(p.get(key),rat(15n)):mul(p.get(key),rat(12n));}catch{return null;}
}
function exactValue(ast,variable,inputAst,mode,substituted=false){
 const rational=v=>new Map(v[0]?[[1,v]]:[]),root=(n,d=1)=>new Map([[n,rat(1n,BigInt(d))]]);
 if(ast.op==='number')return ast.pi?null:rational(ast.v);
 if(ast.op==='variable')return !substituted&&ast.v===variable?exactValue(inputAst,'',null,mode,true):null;
 if(trigOp(ast.op)){const q=exactAngle(ast.a,variable,inputAst,mode);if(!q||q[1]!==1n)return null;let t=Number((q[0]%24n+24n)%24n);if(ast.op==='cos')t=(t+6)%24;
 if(ast.op==='tan'){t%=12;if(t===6)return null;const negative=t>6;if(negative)t=12-t;const values=[new Map,surdAdd(rational(rat(2n)),surdScale(root(3),rat(-1n))),root(3,3),rational(rat(1n)),root(3),surdAdd(rational(rat(2n)),root(3))];return surdScale(values[t],rat(negative?-1n:1n));}
 const negative=t>12;if(negative)t=24-t;if(t>6)t=12-t;const values=[new Map,surdScale(surdAdd(root(6),surdScale(root(2),rat(-1n))),rat(1n,4n)),rational(rat(1n,2n)),root(2,2),root(3,2),surdScale(surdAdd(root(6),root(2)),rat(1n,4n)),rational(rat(1n))];return surdScale(values[t],rat(negative?-1n:1n));}
 if(ast.op==='sqrt'){const p=exactValue(ast.a,variable,inputAst,mode,substituted);if(!p||p.size!==1||!p.has(1))return null;const q=p.get(1);if(q[1]!==1n||![1n,2n,3n,6n].includes(q[0]))return null;return root(Number(q[0]));}
 const a=exactValue(ast.a,variable,inputAst,mode,substituted),b=exactValue(ast.b,variable,inputAst,mode,substituted);if(!a||!b)return null;
 if(ast.op==='+')return surdAdd(a,b);if(ast.op==='-')return surdAdd(a,surdScale(b,rat(-1n)));if(ast.op==='*')return surdMul(a,b);if(ast.op==='/')return surdDiv(a,b);if(ast.op==='^'){const q=b.size?b.get(1):rat(0n);if(b.size>1||!q||q[1]!==1n||q[0]<0n||q[0]>8n)return null;let p=rational(rat(1n));for(let i=0n;i<q[0];i++)p=surdMul(p,a);return p;}return null;
}
function exactText(p){if(!p)return null;if(!p.size)return '0';let denominator=1n;for(const[,q]of p)denominator=denominator/gcd(denominator,q[1])*q[1];const parts=[...p].sort(([a],[b])=>a===1?-1:b===1?1:b-a).map(([r,q],i)=>{const n=q[0]*(denominator/q[1]),abs=n<0n?-n:n;return(i?(n<0n?' − ':' + '):n<0n?'−':'')+(r===1?String(abs):(abs===1n?'':String(abs))+'√'+r);});const top=parts.join('');return denominator===1n?top:(parts.length>1?'('+top+')':top)+'/'+denominator;}
function plan(functionText,inputText,mode='radians'){
 const ev=(a,v,i)=>evaluate(a,v,i,mode);
 const ast=parse(functionText),inputAst=parse(inputText),vars=[];function collect(a){if(!a)return;if(a.op==='variable')vars.push(a.v);else if(a.a){collect(a.a);collect(a.b)}}collect(ast);const variable=vars.includes('x')?'x':vars[0]||'x',input=ev(inputAst,'',null);if(!input)throw Error('Use a number, fraction, letter or polynomial as the input.');const stages=[];
 function build(a){if(!a.a)return;if(trigOp(a.op)){build(a.a);const poly=ev(a,variable,input);stages.push({sourceAst:a,beforeAst:a.a,label:a.op+' ('+mode+')',op:a.op,poly,text:format(poly)||expression(a,variable,format(input)),beforeText:format(ev(a.a,variable,input))||expression(a.a,variable,format(input)),angleMode:mode});return;}const left=depends(a.a,variable),right=depends(a.b,variable);let branch,other,reverse=false;if(left){branch=a.a;other=a.b}else if(right){branch=a.b;other=a.a;reverse=true}else{stages.push({label:'Set '+format(ev(a,'',null)),op:'set',poly:ev(a,'',null),text:format(ev(a,'',null))});return}build(branch);const otherPoly=ev(other,variable,input),otherText=format(otherPoly)||expression(other,variable,format(input)),poly=ev(a,variable,input),text=format(poly)||expression(a,variable,format(input));let label=({'*':'×','/':'÷','+':'+','-':'−','^':'Power'}[a.op]||a.op)+' '+otherText;if(reverse&&['/','-','^'].includes(a.op))label=otherText+' '+({'/':'÷','-':'−','^':'^'}[a.op])+' current';if((a.op==='*')&&(branch.op==='+'||branch.op==='-'))label+=' · distribute';stages.push({sourceAst:a,beforeAst:branch,label,op:a.op,poly,text,operand:otherText,operandPoly:otherPoly,reverse,beforeText:format(ev(branch,variable,input))||expression(branch,variable,format(input))})}
 const hasFork=a=>!!(a&&a.a&&((depends(a.a,variable)&&depends(a.b,variable))||hasFork(a.a)||hasFork(a.b)));
 const branched=hasFork(ast);
 function graph(a){
  if(!a.a)return -1;if(trigOp(a.op)){const parent=graph(a.a),poly=ev(a,variable,input);stages.push({sourceAst:a,beforeAst:a.a,label:a.op+' ('+mode+')',op:a.op,poly,text:format(poly)||expression(a,variable,format(input)),beforeText:format(ev(a.a,variable,input))||expression(a.a,variable,format(input)),angleMode:mode,parents:[parent],expressionText:expression(a,variable,variable)});return stages.length-1;}
  const left=depends(a.a,variable),right=depends(a.b,variable),both=left&&right;
  const branch=left?a.a:a.b,other=left?a.b:a.a,reverse=!left&&right;
  const parents=both?[graph(a.a),graph(a.b)]:[graph(branch)];
  const otherPoly=ev(other,variable,input),operand=format(otherPoly)||expression(other,variable,format(input));
  const poly=ev(a,variable,input),text=format(poly)||expression(a,variable,format(input));
  let label=both?({'+' : 'Add branches','-':'Subtract branches','*':'Multiply branches','/':'Divide branches','^':'Power from branches'}[a.op]):({'*':'×','/':'÷','+':'+','-':'−','^':'Power'}[a.op]||a.op)+' '+operand;
  if(!both&&reverse&&['/','-','^'].includes(a.op))label=operand+' '+({'/':'÷','-':'−','^':'^'}[a.op])+' current';
  const symbolic=new Map([[variable+'^1',rat(1n)]]),expressionText=format(ev(a,variable,symbolic))||expression(a,variable,variable);
  stages.push({sourceAst:a,beforeAst:branch,label,op:a.op,poly,text,operand,operandPoly:otherPoly,reverse,beforeText:format(ev(branch,variable,input))||expression(branch,variable,format(input)),parents,join:both,expressionText});return stages.length-1;
 }
 if(branched)graph(ast);else build(ast);if(!depends(ast,variable)&&!ast.a)stages.push({label:'Set '+format(ev(ast,'',null)),op:'set',poly:ev(ast,'',null),text:format(ev(ast,'',null))});if(stages.length>10)throw Error('Use at most 10 operations in one production line.');const trig=/(?:^|[^a-zA-Z])(sin|cos|tan)\s*\(/i.test(functionText);if(trig)for(const stage of stages){if(stage.poly&&(!stage.poly.size||stage.poly.size===1&&stage.poly.has(''))){const value=stage.poly.size?num(stage.poly.get('')):0;stage.text=(stage.sourceAst?exactText(exactValue(stage.sourceAst,variable,inputAst,mode)):null)||String(Number(value.toFixed(10))).replace('-','−');}if(stage.beforeAst){let exact=exactText(exactValue(stage.beforeAst,variable,inputAst,mode));if(trigOp(stage.op)&&mode==='radians'){const steps=exactAngle(stage.beforeAst,variable,inputAst,mode);if(steps){const q=div(steps,rat(12n)),n=q[0],d=q[1];exact=n===0n?'0':(n<0n?'−':'')+((n<0n?-n:n)===1n?'':String(n<0n?-n:n))+'π'+(d===1n?'':'/'+d);}}if(exact!==null)stage.beforeText=exact;else {const p=ev(stage.beforeAst,variable,input);if(p&&(!p.size||p.size===1&&p.has('')))stage.beforeText=String(Number((p.size?num(p.get('')):0).toFixed(10))).replace('-','−');}}delete stage.sourceAst;delete stage.beforeAst;}for(const stage of stages){delete stage.sourceAst;delete stage.beforeAst;}return{variable,input,inputText:trig?inputText.replaceAll('pi','π'):format(input),stages,branched,output:ev(ast,variable,input)};
}
function tiles(poly,previous,color,transform=false){
 if(!poly)return null;
 previous=(previous||[]).flatMap(t=>t.segments?.length?t.segments.map(part=>({...t,color:part.color,amount:part.amount,segments:undefined})):t);
 const out=[],used=new Set;
 const append=(key,amount,sign,color)=>{const last=out.at(-1);if(last&&last.key===key&&last.sign===sign&&last.color===color)last.amount+=amount;else out.push({key,amount,sign,color})};
 for(const[k,v]of poly){let remaining=Math.abs(num(v));if(!Number.isFinite(remaining))return null;const sign=v[0]<0n?-1:1;for(let i=0;i<(previous||[]).length&&remaining>1e-9;i++){const t=previous[i];if(!used.has(i)&&t.sign===sign&&(t.key===k||transform&&!poly.has(t.key))){const amount=Math.min(t.amount,remaining);append(k,amount,sign,t.color);remaining-=amount;used.add(i)}}if(remaining>1e-9)append(k,remaining,sign,color)}
 // Consolidate equal signed terms before choosing blocks, including fractional pieces.
 const terms=new Map();for(const t of out){const id=t.key+'|'+t.sign;if(!terms.has(id))terms.set(id,[]);terms.get(id).push(t);}
 const total=out.reduce((sum,t)=>sum+t.amount,0),packed=[];
 for(const pieces of terms.values()){
  let remaining=pieces.reduce((sum,t)=>sum+t.amount,0),source=0,available=pieces[0].amount;
  const emit=amount=>{const segments=[];let need=amount;while(need>1e-9&&source<pieces.length){const take=Math.min(need,available),color=pieces[source].color,last=segments.at(-1);if(last&&last.color===color)last.amount+=take;else segments.push({color,amount:take});need-=take;available-=take;if(available<1e-9){source++;available=pieces[source]?.amount||0;}}const block={key:pieces[0].key,sign:pieces[0].sign,color:segments[0].color,amount,bundle:amount>1};if(segments.length>1)block.segments=segments;packed.push(block);};
  if(total<=64){while(remaining>=1-1e-9){emit(1);remaining-=1;}}
  else for(let power=Math.floor(Math.log10(remaining));power>=0;power--){const unit=10**power,count=Math.floor(remaining/unit+1e-10);for(let i=0;i<count;i++)emit(unit);remaining-=count*unit;}
  if(remaining>1e-9)emit(remaining);
 }

 return packed;
}
const api={parse,plan,format,tiles,monoText,num,evaluate};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.MachineMath=api;
})(typeof window!=='undefined'?window:globalThis);
