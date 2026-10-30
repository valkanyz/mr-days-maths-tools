/* Exact arithmetic and symbolic polynomial model for the function production line. */
(function(root){
'use strict';
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a||1n};
const rat=(n,d=1n)=>{if(!d)throw Error('Division by zero is undefined.');if(d<0n){n=-n;d=-d}const g=gcd(n,d);return[n/g,d/g]};
const add=(a,b)=>rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),mul=(a,b)=>rat(a[0]*b[0],a[1]*b[1]),neg=a=>[-a[0],a[1]],div=(a,b)=>rat(a[0]*b[1],a[1]*b[0]),rtext=a=>a[1]===1n?String(a[0]):a.join('/'),num=a=>Number(a[0])/Number(a[1]);
const decimal=s=>{const p=s.split('.');return rat(BigInt((p[0]||'0')+(p[1]||'')),10n**BigInt((p[1]||'').length))};
function parse(text){
 text=text.trim().replace(/^[a-zA-Z]+\([^)]*\)\s*=\s*/,'').replace(/^[a-zA-Z]\s*=\s*/,'').replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,s=>'^'+[...s].map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join(''));
 if(!text||text.length>200)throw Error('Enter an expression of up to 200 characters.');
 const raw=text.match(/\d*\.\d+|\d+|[a-zA-Z]+|[()+*/^\-]/g)||[];
 if(raw.join('')!==text.replace(/\s/g,''))throw Error('Use numbers, letters, +, −, ×, ÷, powers and brackets.');
 const ts=[];for(const t of raw){const prev=ts.at(-1);if(prev&&(/[\w.)]$/.test(prev))&&(/^[a-zA-Z.(]/.test(t)||/^\d/.test(t)&&prev===')'))ts.push('*');ts.push(t)}let i=0;
 function atom(){const t=ts[i++];if(t==='('){const e=sum();if(ts[i++]!==')')throw Error('Close each opening bracket.');return e}if(/^\d*\.?\d+$/.test(t||''))return{op:'number',v:decimal(t)};if(/^[a-zA-Z]+$/.test(t||'')&&t.length<=12)return{op:'variable',v:t};throw Error('An operand is missing or invalid.')}
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
function evaluate(ast,variable,input){if(ast.op==='number')return new Map(ast.v[0]?[['',ast.v]]:[]);if(ast.op==='variable')return ast.v===variable?input:new Map([[ast.v+'^1',rat(1n)]]);return combine(evaluate(ast.a,variable,input),evaluate(ast.b,variable,input),ast.op)}
const monoText=k=>Object.entries(mono(k)).map(([v,p])=>v+(p===1?'':'^'+p)).join('');
function format(p){if(!p)return '';if(!p.size)return'0';return [...p].sort(([a],[b])=>{const degree=k=>Object.values(mono(k)).reduce((s,v)=>s+v,0);return degree(b)-degree(a)||a.localeCompare(b)}).map(([k,v],i)=>{const negative=v[0]<0n,abs=rat(negative?-v[0]:v[0],v[1]),c=rtext(abs),term=(k&&c==='1'?'':c)+monoText(k);return(i?(negative?' − ':' + '):negative?'−':'')+term}).join('')}
function expression(ast,variable,inputText){if(ast.op==='number')return rtext(ast.v);if(ast.op==='variable')return ast.v===variable?'('+inputText+')':ast.v;return '('+expression(ast.a,variable,inputText)+' '+({'*':'×','/':'÷'}[ast.op]||ast.op)+' '+expression(ast.b,variable,inputText)+')'}
const depends=(a,v)=>a.op==='variable'?a.v===v:a.a?depends(a.a,v)||depends(a.b,v):false;
function plan(functionText,inputText){
 const ast=parse(functionText),inputAst=parse(inputText),vars=[];function collect(a){if(a.op==='variable')vars.push(a.v);else if(a.a){collect(a.a);collect(a.b)}}collect(ast);const variable=vars.includes('x')?'x':vars[0]||'x',input=evaluate(inputAst,'',null);if(!input)throw Error('Use a number, fraction, letter or polynomial as the input.');const stages=[];
 function build(a){if(!a.a)return;const left=depends(a.a,variable),right=depends(a.b,variable);let branch,other,reverse=false;if(left){branch=a.a;other=a.b}else if(right){branch=a.b;other=a.a;reverse=true}else{stages.push({label:'Set '+format(evaluate(a,'',null)),op:'set',poly:evaluate(a,'',null),text:format(evaluate(a,'',null))});return}build(branch);const otherPoly=evaluate(other,variable,input),otherText=format(otherPoly)||expression(other,variable,format(input)),poly=evaluate(a,variable,input),text=format(poly)||expression(a,variable,format(input));let label=({'*':'×','/':'÷','+':'+','-':'−','^':'Power'}[a.op]||a.op)+' '+otherText;if(reverse&&['/','-','^'].includes(a.op))label=otherText+' '+({'/':'÷','-':'−','^':'^'}[a.op])+' current';if((a.op==='*')&&(branch.op==='+'||branch.op==='-'))label+=' · distribute';stages.push({label,op:a.op,poly,text})}
 build(ast);if(!depends(ast,variable)&&!ast.a)stages.push({label:'Set '+format(evaluate(ast,'',null)),op:'set',poly:evaluate(ast,'',null),text:format(evaluate(ast,'',null))});if(stages.length>10)throw Error('Use at most 10 operations in one production line.');return{variable,input,inputText:format(input),stages,output:evaluate(ast,variable,input)};
}
function tiles(poly,previous,color,transform=false){
 if(!poly)return null;const total=[...poly.values()].reduce((s,r)=>s+Math.ceil(Math.abs(num(r))),0);if(total>144||!Number.isFinite(total))return null;
 const out=[],used=new Set;
 for(const[k,v]of poly){let remaining=Math.abs(num(v));const sign=v[0]<0n?-1:1;for(let i=0;i<(previous||[]).length&&remaining>1e-9;i++){const t=previous[i];if(!used.has(i)&&t.sign===sign&&(t.key===k||transform&&!poly.has(t.key))){const amount=Math.min(t.amount,remaining);out.push({key:k,amount,sign,color:t.color});remaining-=amount;used.add(i)}}while(remaining>1e-9){const amount=Math.min(1,remaining);out.push({key:k,amount,sign,color});remaining-=amount}}
 return out;
}
const api={parse,plan,format,tiles,monoText,num};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.MachineMath=api;
})(typeof window!=='undefined'?window:globalThis);
