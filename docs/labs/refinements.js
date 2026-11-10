/* Classroom refinements. Pure mathematics helpers are independently tested. */
const R = {
 parse(source){
  const raw=source.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g,t=>'^('+[...t].map(c=>'0123456789-+'['⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺'.indexOf(c)]).join('')+')').toLowerCase().replaceAll('−','-').replaceAll('π','pi').replaceAll('²','^2').replaceAll('³','^3').replaceAll('×','*').replaceAll('÷','/');
  const tokens=raw.match(/(?:\d*\.\d+|\d+\.?\d*)(?:e[+-]?\d+)?|[a-z]+|[()+\-*/^]/g)||[];
  if(tokens.join('')!==raw.replace(/\s/g,'')||tokens.length>150)throw Error('Use x, numbers, + − × ÷, superscript powers, parentheses, sin, cos, tan, exp, ln, sqrt or abs.');
  const trigRatio=(num,den)=>Math.abs(den)<1e-15?NaN:num/den;
  let i=0;const functions={sin:Math.sin,cos:Math.cos,tan:t=>trigRatio(Math.sin(t),Math.cos(t)),sec:t=>trigRatio(1,Math.cos(t)),asin:Math.asin,acos:Math.acos,atan:Math.atan,csc:t=>trigRatio(1,Math.sin(t)),cot:t=>trigRatio(Math.cos(t),Math.sin(t)),exp:Math.exp,ln:Math.log,sqrt:Math.sqrt,abs:Math.abs};
  const atom=()=>{const t=tokens[i++];if(t==='('){const n=add();if(tokens[i++]!==')')throw Error('Close each parenthesis.');return n}if(t==='x')return ['x'];if(t==='pi'||t==='e')return ['n',t==='pi'?Math.PI:Math.E];if(Object.hasOwn(functions,t)){if(tokens[i++]!=='(')throw Error('Use parentheses after '+t+'.');const n=add();if(tokens[i++]!==')')throw Error('Close each function parenthesis.');return[t,n]}if(t!==undefined&&/^\d|^\./.test(t))return ['n',Number(t)];throw Error('Enter a complete function, for example 2x² − 3x + 1.');};
  const power=()=>{let a=atom();if(tokens[i]==='^'){i++;a=['^',a,unary()]}return a};
  const unary=()=>tokens[i]==='-'?(i++,['neg',unary()]):tokens[i]==='+'?(i++,unary()):power();
  const mul=()=>{let a=unary();while(i<tokens.length){let op=tokens[i];if(op==='*'||op==='/'){i++;a=[op,a,unary()]}else if(op==='('||op==='x'||op==='pi'||op==='e'||Object.hasOwn(functions,op))a=['*',a,unary()];else break}return a};
  const add=()=>{let a=mul();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++];a=[op,a,mul()]}return a};
  const ast=add();if(i!==tokens.length)throw Error('Check your function syntax.');
  const evaluate=(n,x)=>{const[o,a,b]=n;if(o==='n')return a;if(o==='x')return x;if(o==='neg')return-evaluate(a,x);if(Object.hasOwn(functions,o))return functions[o](evaluate(a,x));const A=evaluate(a,x),B=evaluate(b,x);
   if(o==='^' && A<0 && b[0]==='/' && !b.flat(Infinity).includes('x')){
    const num=evaluate(b[1],x),den=evaluate(b[2],x);
    if(Number.isSafeInteger(num)&&Number.isSafeInteger(den)&&den){
     const gcd=(u,v)=>v?gcd(v,u%v):u, divisor=gcd(Math.abs(num),Math.abs(den));
     if(Math.abs(den/divisor)%2)return (Math.abs(num/divisor)%2?-1:1)*Math.abs(A)**B;
    }
   }
   return o==='+'?A+B:o==='-'?A-B:o==='*'?A*B:o==='/'?A/B:A**B};
  const combine=(a,b,op)=>{const c=Array(Math.max(a.length,b.length)).fill(0);for(let j=0;j<c.length;j++)c[j]=(a[j]||0)+op*(b[j]||0);return c};
  const product=(a,b)=>{if(a.length+b.length>14)throw Error('Polynomial degree is too large.');const c=Array(a.length+b.length-1).fill(0);a.forEach((v,j)=>b.forEach((w,k)=>c[j+k]+=v*w));return c};
  const polynomial=n=>{const[o,a,b]=n;if(o==='n')return[a];if(o==='x')return[0,1];if(o==='neg')return polynomial(a).map(x=>-x);if(!['+','-','*','/','^'].includes(o))return null;const A=polynomial(a),B=polynomial(b);if(!A||!B)return null;if(o==='+')return combine(A,B,1);if(o==='-')return combine(A,B,-1);if(o==='*')return product(A,B);if(o==='/')return B.length===1&&B[0]!==0?A.map(x=>x/B[0]):null;if(B.length!==1||!Number.isInteger(B[0])||B[0]<0||B[0]>10)return null;let c=[1];for(let j=0;j<B[0];j++)c=product(c,A);return c};
  let coefficients;try{coefficients=polynomial(ast)}catch{coefficients=null}if(coefficients)while(coefficients.length>1&&Math.abs(coefficients.at(-1))<1e-12)coefficients.pop();
  return {ast,f:x=>evaluate(ast,x),evaluate,coefficients,source};
 },
 clip(poly,a,b,c){const out=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],u=a*p[0]+b*p[1]-c,v=a*q[0]+b*q[1]-c;if(u<=1e-10)out.push(p);if((u<0&&v>0)||(u>0&&v<0)){const t=u/(u-v);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])])}}return out},
 matrixMultiply(A,B){return A.map(row=>B[0].map((_,j)=>row.reduce((sum,v,k)=>sum+v*B[k][j],0)))},
 matrixPower(A,n){let B=A.map((r,i)=>r.map((_,j)=>+(i===j)));for(let i=0;i<n;i++)B=R.matrixMultiply(B,A);return B},
 // Row/column reductions, maximum zero matching, minimum line cover, adjustment.
 hungarian(cost,maximise=false){
  const n=cost.length;if(n<2||n>8||cost.some(r=>r.length!==n||r.some(x=>!Number.isFinite(x))))throw Error('Enter a square 2–8 by 2–8 matrix of finite costs.');
  const max=Math.max(...cost.flat());let A=cost.map(r=>r.map(x=>maximise?max-x:x));const steps=[{label:maximise?'Convert profit to cost: largest entry − each entry':'Original cost matrix',A:A.map(r=>r.slice())}];
  A=A.map(r=>{const m=Math.min(...r);return r.map(x=>x-m)});steps.push({label:'Subtract each row minimum',A:A.map(r=>r.slice())});
  for(let j=0;j<n;j++){const m=Math.min(...A.map(r=>r[j]));A.forEach(r=>r[j]-=m)}steps.push({label:'Subtract each column minimum',A:A.map(r=>r.slice())});
  for(let loop=0;loop<100;loop++){
   const col=Array(n).fill(-1);const visit=(i,seen)=>{for(let j=0;j<n;j++)if(Math.abs(A[i][j])<1e-8&&!seen[j]){seen[j]=true;if(col[j]<0||visit(col[j],seen)){col[j]=i;return true}}return false};for(let i=0;i<n;i++)visit(i,Array(n).fill(false));const row=Array(n).fill(-1);col.forEach((i,j)=>{if(i>=0)row[i]=j});
   if(row.every(j=>j>=0)){steps.push({label:'Choose one independent zero in each row and column',A:A.map(r=>r.slice()),assignment:row});return{assignment:row,total:row.reduce((s,j,i)=>s+cost[i][j],0),steps}}
   const rows=new Set(row.map((j,i)=>j<0?i:-1).filter(i=>i>=0)),cols=new Set();let changed=true;while(changed){changed=false;for(const i of rows)for(let j=0;j<n;j++)if(Math.abs(A[i][j])<1e-8&&!cols.has(j)){cols.add(j);changed=true;if(col[j]>=0)rows.add(col[j])}}
   const coverRows=Array.from({length:n},(_,i)=>i).filter(i=>!rows.has(i)),coverCols=[...cols];let delta=Infinity;for(const i of rows)for(let j=0;j<n;j++)if(!cols.has(j))delta=Math.min(delta,A[i][j]);
   steps.push({label:`Cover zeros with ${coverRows.length+coverCols.length} lines; smallest uncovered value = ${delta}`,A:A.map(r=>r.slice()),coverRows,coverCols});
   A=A.map((r,i)=>r.map((x,j)=>x-(rows.has(i)&&!cols.has(j)?delta:0)+(!rows.has(i)&&cols.has(j)?delta:0)));steps.push({label:'Subtract from uncovered cells; add at line intersections',A:A.map(r=>r.slice())});
  }throw Error('Assignment did not converge.');
 },
 maxFlow(edges,start,end,nodes=[...new Set(edges.flatMap(e=>e.slice(0,2)))]){if(start===end)throw Error('Source and sink must differ.');if(!nodes.includes(start)||!nodes.includes(end))throw Error('Choose source and sink vertices in the network.');const N=nodes.length,idx=x=>nodes.indexOf(x),capacity=Array.from({length:N},()=>Array(N).fill(0));edges.forEach(([a,b,c])=>capacity[idx(a)][idx(b)]+=c);const residual=capacity.map(r=>r.slice()),s=idx(start),t=idx(end),steps=[];let total=0;
  while(true){const prev=Array(N).fill(-1),q=[s];prev[s]=s;for(let k=0;k<q.length&&prev[t]<0;k++)for(let j=0;j<N;j++)if(prev[j]<0&&residual[q[k]][j]>1e-9){prev[j]=q[k];q.push(j)}if(prev[t]<0){const cut=nodes.filter((_,i)=>prev[i]>=0);const remaining=capacity.map((row,i)=>row.map((cap,j)=>Math.max(0,cap-residual[i][j])));
   const flows=edges.map(([a,b,c])=>{const i=idx(a),j=idx(b),used=Math.min(c,remaining[i][j]);remaining[i][j]-=used;return used});
   return{total,steps,cut,flows}}let amount=Infinity,path=[t];for(let v=t;v!==s;v=prev[v]){amount=Math.min(amount,residual[prev[v]][v]);path.push(prev[v])}for(let v=t;v!==s;v=prev[v]){residual[prev[v]][v]-=amount;residual[v][prev[v]]+=amount}total+=amount;steps.push({path:path.reverse().map(i=>nodes[i]),amount,total})}
 }
};
const field=(id,label,text)=>`<div class="wide"><label for="${id}">${label}</label><input id="${id}" value="${esc(text)}" autocomplete="off" spellcheck="false"></div>`;
const workPanel=(title,html)=>`<section style="padding:18px 22px;border-bottom:1px solid #e1d4eb"><div style="font-size:13px;color:#765b87;margin-bottom:10px">${esc(title)}</div><div style="font-size:clamp(18px,2vw,25px);overflow-x:auto;padding:8px 0">${html}</div></section>`;
const equationBanner=text=>{const el=document.createElement('div');el.className='equation-banner';el.style.cssText='padding:14px 18px;background:#ede3f5;color:#493354;font-weight:700;font-size:clamp(18px,2vw,26px);border-radius:10px;margin-bottom:10px;overflow-wrap:anywhere';el.textContent=text;$('viz').before(el)};
const originalLaunch=launch;launch=function(id){document.querySelectorAll('.equation-banner').forEach(el=>el.remove());originalLaunch(id)};
const functionSetup=labs.functions.setup;labs.functions.setup=function(){functionSetup();const base=update;update=()=>{base();document.querySelectorAll('.equation-banner').forEach(el=>el.remove());const a=value('a'),b=value('b'),h=value('h'),k=value('k'),u=`(${b}(x ${h<0?'+':'−'} ${Math.abs(h)}))`,name=$('type').value;equationBanner(`f(x) = ${a} × ${{linear:u,quadratic:u+'²',cubic:u+'³',sine:'sin'+u,cosine:'cos'+u,tangentFn:'tan'+u,exponential:'e^'+u}[name]} ${k<0?'−':'+'} ${Math.abs(k)}`)}};
const trigSetup=labs.trigonometry.setup;labs.trigonometry.setup=function(){trigSetup();$('circleAngle').parentElement.insertAdjacentHTML('afterend',select('circleSnap','Snap angle',[['1','Free (1°)'],['30','30°'],['45','45°'],['60','60°'],['90','90°']])+select('circleUnits','Angle display',[['degrees','Degrees'],['radians','Radians']]));const base=update;update=()=>{const circle=$('mode').value==='circle',snap=value('circleSnap');$('circleAngle').step=snap;$('circleAngle').value=Math.round(Number($('circleAngle').value)/snap)*snap;base();showControl('circleSnap',circle);showControl('circleUnits',circle);if(circle){const d=value('circleAngle'),rad=$('circleUnits').value==='radians',gcd=(a,b)=>b?gcd(b,a%b):a,div=gcd(Math.abs(d),180),num=d/div,den=180/div,label=rad?(d===0?'0':(num<0?'−':'')+(Math.abs(num)===1?'':Math.abs(num))+'π'+(den===1?'':'/'+den)):d+'°';$('circleAngleval').textContent=label;document.querySelector('label[for="circleAngle"]').firstChild.textContent='Circle angle '+(rad?'(radians) ':'(degrees) ');formula('θ = '+label);const S=$('viz').querySelector('svg');S.insertAdjacentHTML('beforeend',txt(420,35,'θ = '+label,22,C.purple));}}};
function firstFunction(source) {
 const normal = source.trim().replace(/^f\s*\(x\)\s*=\s*/i,'').replace(/\|([^|]+)\|/g,'abs($1)').replace(/\b(sin|cos|tan|sec|cosec|csc|cot|ln|exp|sqrt|abs)\s+(x|[0-9.]+)\b/gi,'$1($2)').replace(/\barc(sin|cos|tan)\b/gi,'a$1').replace(/\b(asin|acos|atan)\s+x\b/gi,'$1(x)').replace(/\b(sin|cos|tan|sec|csc|cot)([²³])\s*(\([^()]*\)|x)/gi,(_,name,power,arg)=>'('+name+'('+arg+'))'+power).replace(/cosec/gi,'csc').replace(/√\s*\(/g,'sqrt(').replace(/√\s*x/g,'sqrt(x)').replace(/∛\s*x/g,'x^(1/3)');
 if (!normal.includes(';')) return R.parse(normal);
 const parts = normal.split(';');
 const match = /^\s*x\s*(<=|≤|<)\s*([+−-]?(?:\d+\.?\d*|\.\d+))\s*$/.exec(parts[1]);
 if (parts.length!==3 || !match) throw Error('Enter left rule ; x < boundary ; right rule.');
 const join = Number(match[2].replace('−','-')), left=R.parse(parts[0]), right=R.parse(parts[2]);
 return {left,right,includeLeft:match[1]!=='<',label:parts[0].trim()+' for x '+match[1]+' '+join+', '+parts[2].trim()+' for x '+(match[1]==='<'?'≥':'>')+' '+join,f:x=>(x<join || (x===join && match[1]!=='<') ? left : right).f(x),join};
}
function firstDiagram(f,x,h,join) {
 const ys=Array.from({length:81},(_,i)=>f(x-2+i/20)).filter(Number.isFinite);
 if(!ys.length)return '';
 const g=chart(x-2,x+2,...padded(ys)), y=f(x), end=f(x+h);
 let paths=g.s,previous=null;
 for(let i=0;i<=400;i++){
  const t=x-2+i/100,v=f(t);
  if(previous && Number.isFinite(v) && Math.abs(g.Y(v)-g.Y(previous[1]))<180 && !(previous[0]<join && t>=join))
   paths+=line(g,previous,[t,v],C.purple);
  previous=Number.isFinite(v)?[t,v]:null;
 }
 if(Number.isFinite(y)&&Number.isFinite(end)){
  paths+=curve(g,t=>y+(end-y)/h*(t-x),C.teal)+point(g,x,y)+point(g,x+h,end,C.teal);
 }
 const main=$('viz').innerHTML;
 svg(paths,'Function and secant at x and x+h');
 $('viz').innerHTML=main+'<div style="height:300px">'+$('viz').innerHTML+'</div>';
}

// Expression trees are shared with the input parser. Keep fractions and powers
// structured all the way to MathML, including in intermediate working.
const FirstProof = (() => {
 const n=value=>['n',value], X=['x'], H=['h'], zero=n(0), one=n(1);
 const is=(a,v)=>a[0]==='n' && a[1]===v;
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const neg=a=>is(a,0)?zero:a[0]==='neg'?a[1]:a[0]==='n'?n(-a[1]):['neg',a];
 const add=(a,b)=>is(a,0)?b:is(b,0)?a:b[0]==='neg'?sub(a,b[1]):['+',a,b];
 const sub=(a,b)=>is(b,0)?a:same(a,b)?zero:is(a,0)?neg(b):a[0]==='n'&&b[0]==='n'?n(a[1]-b[1]):['-',a,b];
 const mul=(a,b)=>is(a,0)||is(b,0)?zero:is(a,1)?b:is(b,1)?a:is(a,-1)?neg(b):is(b,-1)?neg(a):a[0]==='n'&&b[0]==='n'?n(a[1]*b[1]):b[0]==='n'?['*',b,a]:['*',a,b];
 const div=(a,b)=>is(a,0)?zero:is(b,1)?a:['/',a,b];
 const pow=(a,b)=>is(b,1)?a:is(b,0)?one:['^',a,b];
 const fn=(name,a)=>[name,a];
 const plusH=add(X,H);
 function replace(node,variable,value){
  if(node[0]===variable)return value;
  return node.map(el=>Array.isArray(el)?replace(el,variable,value):el);
 }
 const shift=node=>replace(node,'x',plusH);
 const delta=node=>['-',shift(node),node];
 const quotient=node=>['/',delta(node),H];
 const op=s=>'<mo>'+esc(s)+'</mo>', row=s=>'<mrow>'+s+'</mrow>';
 const group=s=>row(op('(')+s+op(')'));
 const frac=(a,b)=>'<mfrac>'+row(a)+row(b)+'</mfrac>';
 function math(node,parent=0){
  const [kind,a,b]=node;
  if(kind==='n'){
   if(a===Math.E)return '<mi>e</mi>';
   if(a===Math.PI)return '<mi>π</mi>';
   const m='<mn>'+String(a).replace('-','−')+'</mn>';
   return a<0&&parent>=3?group(m):m;
  }
  if(!a)return '<mi>'+esc(kind)+'</mi>';
  const precedence={'+':1,'-':1,'*':2,neg:2,'^':4};
  let m;
  switch(kind){
   case '+':case '-':{
    const negative=b[0]==='neg'||(b[0]==='n'&&b[1]<0)||(b[0]==='*'&&b[1][0]==='n'&&b[1][1]<0);
    const right=negative?(b[0]==='*'?mul(n(-b[1][1]),b[2]):neg(b)):b;
    m=math(a,1)+op((kind==='-')!==negative?'−':'+')+math(right,kind==='-'||negative?2:1);break;
   }
   case '*':m=math(a,2)+(a[0]==='n'&&b[0]==='n'?op('×'):op('⁢'))+math(b,2);break;
   case 'neg':m=op('−')+math(a,2);break;
   case '/':m=frac(math(a),math(b));break;
   case '^':m='<msup>'+row(math(a,5))+row(math(b))+'</msup>';break;
   case 'sqrt':m='<msqrt>'+math(a)+'</msqrt>';break;
   case 'abs':m=op('|')+math(a)+op('|');break;
   case 'exp':m='<msup><mi>e</mi>'+row(math(a))+'</msup>';break;
   default:m='<mi mathvariant="normal">'+esc(({asin:'arcsin',acos:'arccos',atan:'arctan'})[kind]||kind)+'</mi>'+group(math(a));
  }
  return precedence[kind]<parent?group(m):row(m);
 }
 const eq=(...items)=>items.join(op('='));
 const limit=(variable,towards,body)=>'<munder><mo>lim</mo>'+row(math(variable)+op('→')+towards)+'</munder>'+body;
 const sided=sign=>'<msup>'+math(zero)+op(sign)+'</msup>';
 const lim=body=>limit(H,math(zero),body);
 const prime='<mi>f</mi><mo>′</mo>'+group(math(X));
 const lhs='<mi>f</mi>'+group(math(X));
 const definition=eq(prime,lim(frac(math(fn('f',plusH))+op('−')+math(fn('f',X)),math(H))));
 const cases=entries=>op('{')+'<mtable columnalign="left left">'+entries.map(([a,b])=>'<mtr><mtd>'+a+'</mtd><mtd>'+b+'</mtd></mtr>').join('')+'</mtable>';
 const hasX=a=>a.flat(Infinity).includes('x');
 function derive(node,rows){
  const [kind,a,b]=node;
  if(!hasX(node))return zero;
  if(kind==='x')return one;
  const emit=(title,...exprs)=>rows.push([title,eq(...exprs.map(m=>typeof m==='string'?m:math(m)))]);
  const d=t=>derive(t,rows);
  // An affine argument has an exact increment mh, before the limit.
  function affine(t){
   if(!hasX(t))return 0;
   const [k,l,r]=t;if(k==='x')return 1;
   if(k==='neg')return -affine(l);
   if(k==='+'||k==='-')return affine(l)+(k==='+'?1:-1)*affine(r);
   if(k==='*' && l[0]==='n')return l[1]*affine(r);
   if(k==='*' && r[0]==='n')return r[1]*affine(l);
   if(k==='/' && r[0]==='n')return affine(l)/r[1];
   return NaN;
  }
  if(kind==='neg')return neg(d(a));
  if(kind==='+'||kind==='-'){
   const da=d(a),db=d(b);
   emit('Separate the difference quotient',quotient(node),[kind,quotient(a),quotient(b)]);
   return kind==='+'?add(da,db):sub(da,db);
  }
  if(kind==='*'){
   const da=d(a),db=d(b);
   emit('Add and subtract the cross term',delta(node),add(mul(shift(a),delta(b)),mul(b,delta(a))));
   emit('Divide each term by h',quotient(node),add(mul(shift(a),quotient(b)),mul(b,quotient(a))));
   return add(mul(a,db),mul(b,da));
  }
  if(kind==='/'){
   const da=d(a),db=d(b),den=mul(shift(b),b);
   emit('Use a common denominator',delta(node),div(sub(mul(shift(a),b),mul(a,shift(b))),den));
   const change=t=>Number.isFinite(affine(t))?mul(n(affine(t)),H):delta(t);
   const numerator=sub(mul(b,change(a)),mul(a,change(b)));
   emit('Collect the changes in numerator and denominator',quotient(node),div(numerator,mul(H,den)));
   const rate=t=>Number.isFinite(affine(t))?n(affine(t)):quotient(t);
   const qa=rate(a),qb=rate(b);
   emit('Factor out h and cancel for h ≠ 0',quotient(node),div(sub(mul(b,qa),mul(a,qb)),den));
   return div(sub(mul(b,da),mul(a,db)),pow(b,n(2)));
  }
  if(kind==='^' && hasX(b)){
   if(!hasX(a)){
    const inner=d(b),t=['t'],base=math(a);
    emit('Factor the exponential increment',quotient(node),mul(node,div(sub(pow(a,delta(b)),one),H)));
    if(b[0]==='x')emit('Cancel x in the exponent increment',quotient(node),mul(node,div(sub(pow(a,H),one),H)));
    else emit('Separate the exponential limit and the inner quotient',quotient(node),mul(node,mul(div(sub(pow(a,delta(b)),one),delta(b)),quotient(b))));
    emit('Use the standard exponential limit for a positive base',limit(t,math(zero),frac(math(sub(pow(a,t),one)),math(t))),is(a,Math.E)?one:fn('ln',a));
    return mul(mul(node,is(a,Math.E)?one:fn('ln',a)),inner);
   }
   const rewritten=fn('exp',mul(b,fn('ln',a)));
   emit('Rewrite the variable power on a positive base',node,rewritten);
   return d(rewritten);
  }
  // Work with a single increment in the argument for compositions.
  const simple=a[0]==='x',u=simple?X:['u'],t=simple?H:['t'],v=add(u,t);
  const inner=d(a), wrap=arg=>kind==='^'?pow(arg,b):fn(kind,arg);
  if(!simple){
   emit('Name the inner value',u,a);
   emit('Name its increment',t,delta(a));
   emit('Factor the difference quotient (use the continuous limit at zero increment)',quotient(node),mul(div(sub(wrap(v),wrap(u)),t),div(t,H)));
  }
  const q=div(sub(wrap(v),wrap(u)),t);
  const lt=body=>limit(t,math(zero),body);
  const sine=arg=>fn('sin',arg),cosine=arg=>fn('cos',arg);
  let outer;
  if(['asin','acos','atan'].includes(kind)){
   const direct={asin:'sin',acos:'cos',atan:'tan'}[kind],angle=['A'],inc=['k'];
   emit('Name the original angle and its change',angle,wrap(u));
   emit('Name the angle increment',inc,sub(wrap(v),wrap(u)));
   emit('Apply the original trigonometric function',t,sub(fn(direct,add(angle,inc)),fn(direct,angle)));
   const forward=div(sub(fn(direct,add(angle,inc)),fn(direct,angle)),inc);
   emit('Invert the forward difference quotient',q,div(one,forward));
   const forwardSlope={asin:cosine(angle),acos:neg(sine(angle)),atan:pow(fn('sec',angle),n(2))}[kind];
   emit('Take the forward trigonometric limit in radians',limit(inc,math(zero),math(forward)),forwardSlope);
   const radical=fn('sqrt',sub(one,pow(a,n(2))));
   outer=kind==='atan'?div(one,add(one,pow(a,n(2)))):div(kind==='asin'?one:n(-1),radical);
  }else if(['sin','cos','tan','cot','sec','csc'].includes(kind)){
   const sinQ=div(sine(t),t),cosQ=div(sub(cosine(t),one),t);
   const sinInc=add(mul(sine(u),sub(cosine(t),one)),mul(cosine(u),sine(t)));
   const cosInc=sub(mul(cosine(u),sub(cosine(t),one)),mul(sine(u),sine(t)));
   if(kind==='sin'||kind==='cos'){
    emit('Expand using the '+(kind==='sin'?'sine':'cosine')+' addition formula',sub(wrap(v),wrap(u)),kind==='sin'?sinInc:cosInc);
    emit('Divide each term by the increment',q,kind==='sin'?add(mul(sine(u),cosQ),mul(cosine(u),sinQ)):sub(mul(cosine(u),cosQ),mul(sine(u),sinQ)));
    outer=kind==='sin'?cosine(a):neg(sine(a));
   }else{
    const bottom=(kind==='tan'||kind==='sec')?cosine:sine;
    const top={tan:sine,cot:cosine,sec:()=>one,csc:()=>one}[kind];
    const denom=mul(bottom(v),bottom(u));
    emit('Write the trigonometric difference over a common denominator',sub(wrap(v),wrap(u)),div(sub(mul(top(v),bottom(u)),mul(top(u),bottom(v))),denom));
    const numer={tan:sine(t),cot:neg(sine(t)),sec:neg(cosInc),csc:neg(sinInc)}[kind];
    emit('Apply the angle addition or subtraction identity',q,div(numer,mul(t,denom)));
    const scaled={tan:sinQ,cot:neg(sinQ),sec:sub(mul(sine(u),sinQ),mul(cosine(u),cosQ)),csc:neg(add(mul(sine(u),cosQ),mul(cosine(u),sinQ)))}[kind];
    emit('Separate the standard limit factors',q,div(scaled,denom));
    outer={tan:pow(fn('sec',a),n(2)),cot:neg(pow(fn('csc',a),n(2))),sec:mul(fn('sec',a),fn('tan',a)),csc:neg(mul(fn('csc',a),fn('cot',a)))}[kind];
   }
   emit('Use the sine limit in radians',lt(math(sinQ)),one);
   if(!['tan','cot'].includes(kind))emit('Use the cosine limit in radians',lt(math(cosQ)),zero);
  }else if(kind==='sqrt'){
   const conjugate=add(wrap(v),wrap(u));
   emit('Multiply by the conjugate',q,mul(q,div(conjugate,conjugate)));
   emit('Use the difference of squares',div(sub(v,u),mul(t,conjugate)),div(one,conjugate));
   outer=div(one,mul(n(2),fn('sqrt',a)));
  }else if(kind==='exp'){
   emit('Factor out the unchanged exponential',q,mul(wrap(u),div(sub(wrap(t),one),t)));
   emit('Use the exponential limit',lt(math(div(sub(wrap(t),one),t))),one);
   outer=fn('exp',a);
  }else if(kind==='ln'){
   emit('Use the logarithm quotient law',q,div(fn('ln',div(v,u)),t),div(fn('ln',add(one,div(t,u))),t));
   const z=['z'];emit('Set the new increment',z,div(t,u));
   emit('Separate the constant factor',q,mul(div(one,u),div(fn('ln',add(one,z)),z)));
   emit('Use the natural logarithm limit',limit(z,math(zero),math(div(fn('ln',add(one,z)),z))),one);
   outer=div(one,a);
  }else if(kind==='abs'){
   const slope=cases([[math(one),math(u)+op('>')+math(zero)],[math(n(-1)),math(u)+op('<')+math(zero)]]);
   emit('Use each linear branch away from zero',lt(math(q)),slope);
   emit('At zero, approach from the left',limit(t,sided('−'),math(div(fn('abs',t),t))),n(-1));
   emit('At zero, approach from the right',limit(t,sided('+'),math(div(fn('abs',t),t))),one);
   outer=div(a,fn('abs',a));
  }else if(kind==='^'){
   if(b[0]==='/' && is(b[1],1) && is(b[2],3)){
    const A=['A'],B=['B'],factor=add(add(pow(A,n(2)),mul(A,B)),pow(B,n(2)));
    emit('Name the cube roots',A,wrap(v));emit('Name the original cube root',B,wrap(u));
    emit('Factor the difference of cubes',t,sub(pow(A,n(3)),pow(B,n(3))),mul(sub(A,B),factor));
    emit('Cancel the common factor',q,div(one,factor));
    outer=div(one,mul(n(3),pow(wrap(a),n(2))));
   }else if(b[0]==='n' && Number.isInteger(b[1]) && b[1]>0 && b[1]<=12){
    const degree=b[1],terms=Array.from({length:degree},(_,i)=>mul(pow(v,n(degree-i-1)),pow(u,n(i)))).reduce(add);
    emit('Factor the difference of powers and cancel the increment',q,terms);
    outer=mul(b,pow(a,n(degree-1)));
   }else{
    const z=['z'],r=b;
    emit('Factor out the original power at a nonzero base',q,mul(div(wrap(u),u),div(sub(pow(add(one,div(t,u)),r),one),div(t,u))));
    emit('Use the standard power limit with z equal to the relative increment',limit(z,math(zero),math(div(sub(pow(add(one,z),r),one),z))),r);
    const exp=r[0]==='n'?n(r[1]-1):r[0]==='/'?div(sub(r[1],r[2]),r[2]):sub(r,one);
    outer=mul(r,pow(a,exp));
   }
  }else throw Error('This function is outside the supported first-principles rules.');
  const local=outer;
  emit(simple?'Take the limit':'Multiply the outer limit by the inner limit',lim(math(quotient(node))),mul(local,inner));
  return mul(local,inner);
 }
 function polynomialRows(parsed,rows){
  const coeff=parsed.coefficients, terms=[],changed=[],cancelled=[];
  const sum=items=>items.reduce(add,zero);
  for(let i=coeff.length-1;i>=0;i--){
   for(let j=0;j<=i;j++){
    const coefficient=n(coeff[i]*E.pascal(i)[i][j]),xPart=pow(X,n(i-j));
    terms.push(mul(coefficient,mul(xPart,pow(H,n(j)))));
    if(j>0){changed.push(terms.at(-1));cancelled.push(mul(coefficient,mul(xPart,pow(H,n(j-1)))));}
   }
  }
  const base=sum(coeff.map((v,i)=>mul(n(v),pow(X,n(i)))).reverse());
  rows.push(['Expand the numerator',lim(math(div(['-',sum(terms),base],H)))],
   ['Cancel like terms',lim(math(div(sum(changed),H)))],
   ['Cancel h for h ≠ 0',lim(math(sum(cancelled)))]);
  return sum(coeff.slice(1).map((v,i)=>mul(n(v*(i+1)),pow(X,n(i)))).reverse());
 }
 function working(branch,rows){
  rows.push(['Substitute the function at x + h and at x',eq(prime,lim(math(quotient(branch.ast))))]);
  // For non-integer coefficients retain their original fractions in the proof.
  const polynomial=branch.coefficients?.length<=11 && branch.coefficients.every(Number.isSafeInteger);
  const derivative=polynomial?polynomialRows(branch,rows):derive(branch.ast,rows);
  rows.push(['Derivative on the interior of each valid branch',eq(prime,math(derivative))]);
  return derivative;
 }
 function restrictions(ast,rows){
  const notes=new Set();
  function visit(node){
   const [kind,a,b]=node;
   if(['asin','acos'].includes(kind))notes.add(math(fn('abs',a))+op('<')+math(one)+mathText(' for the inverse trig derivative formula'));
   if(kind==='/' && (hasX(b)||is(b,0)))notes.add(math(b)+op('≠')+math(zero));
   if(kind==='ln')notes.add(math(a)+op('>')+math(zero));
   if(kind==='sqrt')notes.add(math(a)+op('>')+math(zero)+mathText(' for the radical derivative formula'));
   if(['tan','sec','cot','csc'].includes(kind))notes.add(math(fn(['tan','sec'].includes(kind)?'cos':'sin',a))+op('≠')+math(zero));
   if(kind==='abs')notes.add(math(a)+op('≠')+math(zero)+mathText(' for the branch formula'));
   if(kind==='^' && !hasX(b) && !(b[0]==='n'&&Number.isInteger(b[1])&&b[1]>=1)){
    notes.add(mathText('Use real powers in their domain. At a zero base, check the limit separately.'));
   }
   if(kind==='^' && hasX(b))notes.add(math(a)+op('>')+math(zero));
   for(const child of [a,b])if(Array.isArray(child))visit(child);
  }
  visit(ast);for(const line of notes)rows.push(['Domain of the working',line]);
  if(ast[0]==='sqrt'&&ast[1][0]==='x')rows.push(['At the endpoint x = 0',eq(limit(H,sided('+'),math(div(one,fn('sqrt',H)))),op('+')+'<mi>∞</mi>')]);
  if(ast[0]==='abs'&&ast[1][0]==='x')rows.push(['At the corner x = 0',mathText('The one-sided gradients differ, so f′(0) is undefined.')]);
  if(ast[0]==='^'&&same(ast[1],X)&&same(ast[2],['/',one,n(3)]))rows.push(['At the vertical tangent x = 0',eq(lim(math(div(one,pow(pow(H,ast[2]),n(2))))),'<mi>∞</mi>')]);
 }
 function build(parsed){
  const rows=[['Start with the definition',definition]];
  if(parsed.ast){
   working(parsed,rows);restrictions(parsed.ast,rows);
   return {formula:eq(lhs,math(parsed.ast)),rows};
  }
  const j=n(parsed.join), boundary=math(j), relation=s=>math(X)+op(s)+boundary;
  const L=parsed.left,R=parsed.right;
  const formula=eq(lhs,cases([[math(L.ast),relation(parsed.includeLeft?'≤':'<')],[math(R.ast),relation(parsed.includeLeft?'>':'≥')]]));
  const slopes=[L,R].map((branch,i)=>{
   rows.push([i?'Right branch':'Left branch',eq(lhs,math(branch.ast))+op(',')+relation(i?'>':'<')]);
   const result=working(branch,rows);restrictions(branch.ast,rows);return result;
  });
  const at=parsed.f(parsed.join), finite=Number.isFinite;
  const side=(branch,i)=>limit(H,sided(i?'+':'−'),frac(math(replace(branch.ast,'x',add(j,H)))+op('−')+math(n(at)),math(H)));
  if(!finite(at))rows.push(['Check the join',mathText('The function is undefined at the join, so the derivative is undefined there.')]);
  else{
   rows.push(['Evaluate the function at the join',eq(math(fn('f',j)),math(n(at)))]);
   const values=[L,R].map(b=>b.f(parsed.join));
   const rates=[L,R].map((b,i)=>b.evaluate(slopes[i],parsed.join));
   const regular=[L,R].every(branch=>branch.coefficients || !branch.ast.flat(Infinity).some(op=>['abs','sqrt','^','/','ln','tan','cot','sec','csc'].includes(op)));
   for(const [i,b] of [L,R].entries()){
    const fields=[side(b,i)];
    if(regular && values[i]===at && finite(rates[i]))fields.push(math(n(rates[i])));
    rows.push([i?'Right-hand difference quotient at the join':'Left-hand difference quotient at the join',eq(...fields)]);
   }
   const sameSlope=regular && values.every(v=>v===at) && rates.every(finite) && rates[0]===rates[1];
   const conclusion=sameSlope?eq('<mi>f</mi><mo>′</mo>'+group(boundary),math(n(rates[0]))):regular?mathText('The join is discontinuous or the one-sided slopes differ. The derivative is undefined there.'):mathText('The derivative at the join exists exactly when these limits agree at a finite value.');
   rows.push(['Compare the two one-sided limits',conclusion]);
  }
  return {formula,rows};
 }
 return {build};
})();

labs.calculus.setup=function(){
 let step=0,previous='',proof,parsed;
 controls(field('ownFunction','Function f(x)','1/x')+
  '<div class="muted wide">Type a function, for example <code>1/(2x+3)</code>, <code>cos(3x)</code> or <code>sqrt(x)</code>. Trig uses radians. Use sin, cos, tan, sec, csc, cot or the inverse functions asin, acos and atan. For two branches use <code>x² ; x &lt; 1 ; 2x−1</code>.</div>'+
  `<div class="actions">${btn('proofPrev','Previous step')}${btn('proofNext','Next step')}</div>`+
  check('secantGraph','Show secant diagram')+slider('at','Point x',1,-5,5,.1)+slider('hstep','Step h',1,.01,2,.01));
 $('proofPrev').onclick=()=>{step=Math.max(0,step-1);run()};
 $('proofNext').onclick=()=>{step=Math.min(proof.rows.length-1,step+1);run()};
 update=()=>{
  const source=$('ownFunction').value;
  if(!proof || source!==previous){
   parsed=firstFunction(source);proof=FirstProof.build(parsed);previous=source;step=0;
  }
  const {rows}=proof,x=value('at'),h=value('hstep'),y=parsed.f(x),gradient=d=>(parsed.f(x+d)-y)/d;
  const show=v=>Number.isFinite(v)?fmt(v,7):'Undefined';
  $('formula').innerHTML=mathDisplay(proof.formula);
  $('viz').style.height='auto';
  $('viz').innerHTML=rows.slice(0,revealed()?step+1:1).map(([title,m],i)=>workPanel((i+1)+' · '+title,mathDisplay(m))).join('');
  showControl('hstep',$('secantGraph').checked);
  if($('secantGraph').checked)firstDiagram(parsed.f,x,h,parsed.join);
  results([['Step',(step+1)+' / '+rows.length],['f('+x+')',show(y)],['Secant gradient',show(gradient(h))]]);
  table(['Distance |h|','Gradient from left','Gradient from right'],[1,.1,.01,.001,.0001].map(d=>[d,show(gradient(-d)),show(gradient(d))]));
  $('proofPrev').disabled=step===0;$('proofNext').disabled=step===rows.length-1;
  note('Use Next step to reveal the working. Move x to compare the difference quotients from either side.');
 };
};
// Retain the established strip geometry; provide a parsed custom function and integral notation.
const integrationSetup=labs.integration.setup;labs.integration.setup=function(){
 integrationSetup();$('intFamily').insertAdjacentHTML('beforeend','<option value="custom">Own function</option>');$('intFamily').parentElement.insertAdjacentHTML('afterend',field('integrand','Function f(x)','x²')+'<div id="functionHelp" class="muted wide">Use x, superscript powers (², ³), brackets, sin, cos, tan, exp, ln, sqrt or abs. Trigonometric functions use radians.</div>');const originals={quadratic:'x²',cubic:'x³ − 3x',sine:'sin(x)',linear:'2x + 1'};$('intFamily').onchange=()=>{if(originals[$('intFamily').value])$('integrand').value=originals[$('intFamily').value];run()};$('integrand').oninput=()=>{$('intFamily').value='custom'};
 update=()=>{const P=R.parse($('integrand').value),f=P.f,a=value('lower'),b=value('upper'),w=value('stripWidth'),method=$('method').value,strips=E.strips(f,a,b,w,method),ys=Array.from({length:1001},(_,i)=>f(a+(b-a)*i/1000));if(ys.some(y=>!Number.isFinite(y)||Math.abs(y)>1e10)||strips.some(v=>!Number.isFinite(v.area)))throw Error('Choose an interval where the function is finite and continuous.');const lo=Math.min(0,...ys),hi=Math.max(0,...ys),pad=Math.max(.25,(hi-lo)*.12),g=chart(a,b,lo-pad,hi+pad,'x','f(x)');$('selectedStrip').max=strips.length;$('selectedStrip').value=Math.max(1,Math.min(strips.length,Number($('selectedStrip').value)||1));const selected=value('selectedStrip')-1;let s=g.s;
 strips.forEach((v,i)=>{const{l,r,yl,yr}=v,col=i===selected?C.gold:i%2?C.blue:C.teal,polygon=coords=>`<polygon data-strip="${i}" points="${coords.map(([x,y])=>[g.X(x),g.Y(y)].join(',')).join(' ')}" fill="${col}" fill-opacity=".24" stroke="${col}" stroke-width="${i===selected?3:1.5}"/>`;if(yl*yr<0){const z=l+(r-l)*-yl/(yr-yl);s+=polygon([[l,0],[l,yl],[z,0]])+polygon([[z,0],[r,yr],[r,0]])}else s+=polygon([[l,0],[l,yl],[r,yr],[r,0]]);s+=`<path data-strip="${i}" d="M${g.X(l)} ${g.Y(yl)}L${g.X(r)} ${g.Y(yr)}" stroke="${col}" stroke-width="3"/>`});if($('showCurve').checked)s+=curve(g,f);svg(s,'Signed rectangle or trapezium approximation');const total=strips.reduce((t,v)=>t+v.area,0),p=P.coefficients,reference=p?p.reduce((sum,c,i)=>sum+c*(b**(i+1)-a**(i+1))/(i+1),0):E.integrate(f,a,b,4000,'trap'),v=strips[selected];
 $('formula').innerHTML=mathDisplay(`<msubsup><mo>∫</mo><mn>${a}</mn><mn>${b}</mn></msubsup>`+mathText('('+P.source+')')+'<mi>dx</mi>'+mathText(revealed()?' ≈ '+fmt(total,6):''));const label=$('showExact')?.closest('label');if(label)label.lastChild.textContent=' Compare with integral';
 results([['Strips',strips.length],['Approximation',fmt(total,6)],...($('showExact').checked?[['Integral '+(p?'(exact)':'(numerical reference)'),fmt(reference,6)],['Difference',fmt(total-reference,6)]]:[])]);table(['Strip','Left x','Right x','Width','Left height','Right height','Signed area'],strips.map((v,i)=>[i+1,v.l,v.r,v.r-v.l,v.yl,v.yr,v.area]));legend([['Function',C.purple],['Approximation',C.teal],['Selected strip',C.gold]]);$('note').innerHTML=mathDisplay(mathText('Strip '+(selected+1)+' area = ')+(method==='trap'?fraction('('+fmt(v.yl)+' + '+fmt(v.yr)+') × '+fmt(v.r-v.l),'2'):mathText(fmt(v.yl)+' × '+fmt(v.r-v.l))))+'Click a strip to inspect it. Use a continuous function on the interval; numerical references are approximations. The final strip is shortened if necessary.';
 };
};
const simultaneousSetup=labs.simultaneous.setup;labs.simultaneous.setup=function(){simultaneousSetup();$('controls').querySelector('.section').insertAdjacentHTML('beforebegin',check('simGraph','Show graph'));const base=update;update=()=>{base();const graph=$('viz').innerHTML,rows=exportRows.slice(1),original=rows[0]?.[1]||'',sol=E.solve(...['aa','bb','cc','dd','ee','ff'].map(value));let html=workPanel('Original equations',esc(original).split('; ').join('<br>'));rows.slice(1).forEach(([title,working])=>{if(title==='Solve and substitute'&&sol.kind==='unique'){const el=$('eliminate').value,other=el==='y'?'x':'y',coeffs=['aa','bb','cc','dd','ee','ff'].map(value),[a,b,c,d,e,f]=coeffs;let A=a,B=b,T=c;if((el==='y'?B:A)===0){A=d;B=e;T=f}const known=el==='y'?A:B,unknown=el==='y'?B:A;working=`${other} = ${fmt(sol[other])}.<br>${known} × (${fmt(sol[other])}) + ${unknown}${el} = ${T}<br>${unknown}${el} = ${fmt(T-known*sol[other])}<br>`+mathDisplay(mathText(el+' = ')+fraction(fmt(T-known*sol[other]),fmt(unknown))+mathText(' = '+fmt(sol[el])));html+=workPanel(title,working)}else html+=workPanel(title,esc(working).split('; ').join('<br>'))});$('viz').style.height='auto';$('viz').innerHTML=html+($('simGraph').checked?'<div style="height:300px">'+graph+'</div>':'');formula('Solve the system · use Next step to work through elimination');};};
const inequalities1D=labs.inequalities.setup;
labs.inequalities.setup=function(){
 controls(input('constraintCount','Number of inequalities',1,1,3,1)+[0,1,2].map((i)=>`<div id="constraint${i}" class="wide">`+pair(input('ix'+i,'x coefficient',i===0?1:i===1?1:0,-20,20),input('iy'+i,'y coefficient',i===0?1:i===1?-1:1,-20,20))+pair(select('rel'+i,'Relation',[['≤','≤'],['≥','≥'],['<','<'],['>','>']]),input('bound'+i,'Right side',[6,2,0][i],-100,100))+'</div>').join('')+input('planeRange','View ±',10,1,100)+check('shade','Shade solution region',true)+check('individual','Show each half-plane')+pair(input('testX','Test point x',0,-100,100),input('testY','Test point y',0,-100,100)));
 update=()=>{const n=value('constraintCount'),r=value('planeRange'),tick=Math.max(1,Math.ceil(r/4)),xt=Array.from({length:Math.floor(2*r*750/365/tick)+1},(_,i)=>Math.ceil(-r*750/365/tick)*tick+i*tick),yt=Array.from({length:Math.floor(2*r/tick)+1},(_,i)=>Math.ceil(-r/tick)*tick+i*tick),g=chart(-r,r,-r,r,'x','y',true,{x:xt,y:yt}),box=[[g.xmin,g.ymin],[g.xmax,g.ymin],[g.xmax,g.ymax],[g.xmin,g.ymax]],constraints=[];for(let i=0;i<3;i++){$('constraint'+i).hidden=i>=n;if(i<n){const a=value('ix'+i),b=value('iy'+i),c=value('bound'+i),rel=$('rel'+i).value;if(!a&&!b)throw Error('Each boundary needs a non-zero x or y coefficient.');constraints.push({a,b,c,rel,sign:rel==='≥'||rel==='>'?-1:1})}}let region=box,s=g.s;const polygon=(p,col,opacity)=>p.length?`<polygon points="${p.map(([x,y])=>[g.X(x),g.Y(y)].join(',')).join(' ')}" fill="${col}" fill-opacity="${opacity}"/>`:'';
 for(const[q,i]of constraints.map((q,i)=>[q,i])){const{a,b,c,sign,rel}=q;region=R.clip(region,a*sign,b*sign,c*sign);if($('individual').checked)s+=polygon(R.clip(box,a*sign,b*sign,c*sign),Object.values(C)[i],.1)}if($('shade').checked&&revealed())s+=polygon(region,C.teal,.3);
 constraints.forEach(({a,b,c,rel},i)=>{const col=Object.values(C)[i],dash=rel==='<'||rel==='>'?'7 5':'';if(b){const p1=[g.xmin,(c-a*g.xmin)/b],p2=[g.xmax,(c-a*g.xmax)/b];s+=line(g,p1,p2,col,dash)}else s+=line(g,[c/a,g.ymin],[c/a,g.ymax],col,dash)});const x=value('testX'),y=value('testY'),pass=constraints.map(({a,b,c,rel})=>rel==='<'?a*x+b*y<c:rel==='>'?a*x+b*y>c:rel==='≤'?a*x+b*y<=c+1e-10:a*x+b*y>=c-1e-10);s+=point(g,x,y,pass.every(Boolean)?C.teal:C.red,7);svg(s,'Cartesian inequalities: shaded intersection with solid inclusive and dashed strict boundaries');const eq=q=>`${q.a}x ${q.b<0?'−':'+'} ${Math.abs(q.b)}y ${q.rel} ${q.c}`;formula(constraints.map(eq).join('   AND   '));legend(constraints.map((q,i)=>[eq(q),Object.values(C)[i]]));results([['Test point',`(${x}, ${y})`],['Satisfies all inequalities?',pass.every(Boolean)?'Yes':'No']]);table(['Inequality','Left side at test point','Satisfied?'],constraints.map((q,i)=>[eq(q),q.a*x+q.b*y,pass[i]?'Yes':'No']));note('The shaded region satisfies every inequality. Solid boundaries are included; dashed boundaries are excluded. A region may extend beyond this window. Change the test point to check membership.');
 };
};
const ratioSetup=labs.ratios.setup;labs.ratios.setup=function(){
 ratioSetup();let step=0,key='';$('controls').querySelector('.section').insertAdjacentHTML('beforebegin',`<div id="ratioSteps" class="actions">${btn('ratioPrev','Previous step')}${btn('ratioNext','Next step')}</div><div id="routeInput" class="wide"><label for="route">Journey stops: time (minutes), distance from start (km)</label><textarea id="route" rows="7">0, 0\n20, 15\n30, 15\n50, 30\n60, 30\n90, 0</textarea><p class="muted">One point per line. Equal distances make a stop; decreasing distances make a return trip.</p></div>`+check('customRoute','Use multiple stops / return trip',true));
 $('ratioPrev').onclick=()=>{step=Math.max(0,step-1);run()};$('ratioNext').onclick=()=>{step=Math.min(3,step+1);run()};const base=update;
 update=()=>{const mode=$('mode').value,custom=mode==='speed'&&$('customRoute').checked;$('ratioSteps').hidden=mode!=='ratio';showControl('customRoute',mode==='speed');$('routeInput').hidden=!custom;
 if(!custom)base();
 if(mode==='ratio'){const a=value('ra'),b=value('rb'),total=value('total'),k=[a,b,total].join();if(k!==key){key=k;step=0}const unit=total/(a+b),count=a+b,W=710/count;let s=txt(420,70,'Share '+fmt(total)+' in the ratio '+a+' : '+b,25);if(step===0)s+=`<rect x="65" y="140" width="710" height="100" rx="8" fill="${C.purple}"/>`+txt(420,200,fmt(total),28,'white');else for(let i=0;i<count;i++){const isA=i<a,col=isA?C.purple:C.teal,y=step===3?(isA?130:270):160;s+=`<rect x="${65+i*W}" y="${y}" width="${Math.max(1,W-2)}" height="70" rx="3" fill="${col}"><animate attributeName="opacity" from="0.3" to="1" dur=".35s" fill="freeze"/></rect>`;if(step>=2&&count<=20)s+=txt(65+(i+.5)*W,y+42,fmt(unit,2),Math.min(18,W/3),'white')}if(step===3)s+=txt(220,110,'A = '+fmt(a*unit),23,C.purple)+txt(620,370,'B = '+fmt(b*unit),23,C.teal);svg(s,'Ratio sharing step diagram');const working=['Start with the total',`Count the parts: ${a} + ${b} = ${count}`,`Find one part: ${total} ÷ ${count} = ${fmt(unit)}`,`A = ${a} × ${fmt(unit)} = ${fmt(a*unit)}; B = ${b} × ${fmt(unit)} = ${fmt(b*unit)}`];formula('Step '+(step+1)+' · '+working[step]);results(step<2?[['Total',total],['Ratio',a+' : '+b]]:step===2?[['One part',fmt(unit)]]:[['Share A',fmt(a*unit)],['Share B',fmt(b*unit)]]);$('ratioPrev').disabled=step===0;$('ratioNext').disabled=step===3;note('Next step splits the total into equal parts, finds one part, then allocates the shares.');}
 if(custom){for(const id of ['ra','rb','total','time','distance','costA','costB','qtyA','qtyB','priceUnit','third','costC','qtyC','speedA','speedB','journeyExtras','delayB','stopA'])showControl(id,false);showControl('elapsed',true);const pts=$('route').value.trim().split('\n').map(row=>row.split(',').map(Number));if(pts.length<2||pts.length>30||pts.some((p,i)=>p.length!==2||p.some(v=>!Number.isFinite(v)||v<0)||i>0&&p[0]<=pts[i-1][0])||pts[0][0]!==0)throw Error('Use 2–30 time, distance pairs. Start at time 0; times must increase and values must be non-negative.');const end=pts.at(-1)[0],height=Math.max(1,...pts.map(p=>p[1]));$('elapsed').max=end;$('elapsed').step=.1;$('elapsed').value=Math.min(Number($('elapsed').value),end);const t=value('elapsed'),segment=pts.findIndex(p=>p[0]>=t),j=Math.max(1,segment),p=pts[j-1],q=pts[j],y=p[1]+(q[1]-p[1])*(t-p[0])/(q[0]-p[0]),g=chart(0,end,0,height*1.1,'Time (minutes)','Distance from start (km)');let s=g.s;for(let i=1;i<pts.length;i++)s+=line(g,pts[i-1],pts[i],pts[i][1]<pts[i-1][1]?C.red:pts[i][1]===pts[i-1][1]?C.gold:C.teal);s+=point(g,t,y,C.purple,8);svg(s,'Journey with multiple stops and return trips');const travelled=pts.slice(1).reduce((s,p,i)=>s+Math.abs(p[1]-pts[i][1]),0);formula('A descending section represents returning towards the start.');results([['Current position',fmt(y)+' km'],['Total travelled',fmt(travelled)+' km'],['Total time',end+' min'],['Average speed',fmt(travelled/(end/60))+' km/h']]);table(['From time','To time','From km','To km','Speed (km/h)','Movement'],pts.slice(1).map((p,i)=>[pts[i][0],p[0],pts[i][1],p[1],Math.abs(p[1]-pts[i][1])/(p[0]-pts[i][0])*60,p[1]===pts[i][1]?'Stopped':p[1]<pts[i][1]?'Return':'Outward']));legend([['Outward',C.teal],['Stop',C.gold],['Return',C.red]]);note('This is distance from the starting point on a single route. Return travel increases total distance travelled, even while the plotted position decreases. Edit the rows to add as many as 28 intermediate stops.');}
 };
};
const financeSetup=labs.finance.setup;labs.finance.setup=function(){financeSetup();const base=update;update=()=>{base();const tip=$('plotReadout');if(tip){tip.style.cssText='padding:12px 16px;background:#ede3f5;color:#493354;border-radius:8px;font-size:18px;font-weight:700;margin-top:8px';tip.setAttribute('aria-live','polite')}const handler=$('viz').onpointermove;$('viz').onclick=handler;$('viz').querySelectorAll('circle').forEach(c=>c.setAttribute('r','5'));};};
const networkSetup=labs.networks.setup;labs.networks.setup=function(){
 networkSetup();$('task').insertAdjacentHTML('beforeend','<option value="communication">Communication matrices</option><option value="bipartite">Bipartite graphs</option><option value="assignment">Hungarian algorithm · Assignment</option><option value="flow">Maximum flow / minimum cut</option><option value="euler">Euler trails & circuits</option>');$('controls').querySelector('.section').insertAdjacentHTML('beforebegin',check('directed','Directed communication links')+input('walkLength','Number of links k',2,1,6,1)+`<div class="wide"><label for="costMatrix">Cost / profit matrix (rows = workers, columns = jobs)</label><textarea id="costMatrix" rows="5">9, 2, 7, 8\n6, 4, 3, 7\n5, 8, 1, 8\n7, 6, 9, 4</textarea></div>`+check('maximise','Maximise profit')+`<div id="networkSteps" class="actions">${btn('netPrev','Previous step')}${btn('netNext','Next step')}</div>`);let step=0,key='';$('netPrev').onclick=()=>{step=Math.max(0,step-1);run()};$('netNext').onclick=()=>{step++;run()};const base=update;
 const matrixHTML=(A,names,cols=names,info={})=>`<div style="overflow-x:auto"><table style="width:100%;text-align:center"><thead><tr><th>From / to</th>${cols.map(n=>`<th>${esc(n)}</th>`).join('')}</tr></thead><tbody>${A.map((row,i)=>`<tr><th>${esc(names[i])}</th>${row.map((v,j)=>`<td style="padding:14px;border:1px solid #e0d5e8;background:${info.assignment?.[i]===j?'#bee7d9':info.coverRows?.includes(i)||info.coverCols?.includes(j)?'#ede2f6':'#faf7fd'};font-weight:${v===0?700:400};color:${v===0?C.teal:'#493354'}">${fmt(v,5)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 update=()=>{const task=$('task').value,assignment=task==='assignment',comm=task==='communication',flow=task==='flow',bipartite=task==='bipartite',advanced=assignment||comm||flow||bipartite||task==='euler';for(const id of ['costMatrix','maximise'])showControl(id,assignment);for(const id of ['directed','walkLength'])showControl(id,comm);$('networkSteps').hidden=!assignment;showControl('edges',!assignment);showControl('start',!assignment&&!comm&&!bipartite&&task!=='euler'&&task!=='mst');showControl('end',!assignment&&!comm&&!bipartite&&task!=='euler'&&task!=='mst');if(!advanced){base();return}
 if(assignment){const rows=$('costMatrix').value.trim().split('\n').filter(r=>r.trim()).map(r=>r.trim().split(/[\s,]+/).map(Number)),k=JSON.stringify([rows,$('maximise').checked]);if(k!==key){key=k;step=0}const H=R.hungarian(rows,$('maximise').checked);step=Math.min(step,H.steps.length-1);const item=H.steps[revealed()?step:0],names=rows.map((_,i)=>'Worker '+String.fromCharCode(65+i)),jobs=rows.map((_,i)=>'Job '+(i+1));$('viz').style.height='auto';$('viz').innerHTML=workPanel('Step '+(step+1)+' / '+H.steps.length,item.label)+matrixHTML(item.A,names,jobs,item)+(step===H.steps.length-1&&revealed()?workPanel('Optimal assignment',H.assignment.map((j,i)=>`${names[i]} → ${jobs[j]}: ${rows[i][j]}`).join('<br>')):'');formula('Hungarian algorithm · one worker per job, one job per worker');results([['Objective',$('maximise').checked?'Maximise profit':'Minimise cost'],['Optimal total',step===H.steps.length-1?fmt(H.total):'Use Next step']]);table(['Worker','Assigned job','Original value'],H.assignment.map((j,i)=>[names[i],jobs[j],rows[i][j]]));if(step<H.steps.length-1){$('table').innerHTML='';exportRows=[]}$('netPrev').disabled=step===0;$('netNext').disabled=step===H.steps.length-1;legend([]);note('Green cells show the final independent zeros. Purple cells are covered by the minimum set of lines. For maximisation, first subtract each profit from the largest entry. Use original values to calculate the final total.');return}
 const {names,edges}=NetworkGraph.parse($('edges').value),isDirected=flow||comm&&$('directed').checked;
 $('viz').style.height='';let F;if(flow)F=R.maxFlow(edges,$('start').value.trim(),$('end').value.trim(),names);
 if(bipartite){
   const parts=NetworkGraph.bipartition(names,edges);
   const layout=parts?NetworkGraph.columns(parts):undefined;
   const headings=parts?txt(215,45,'Set 1',22)+txt(625,45,'Set 2',22):'';
   const drawing=NetworkGraph.draw(names,edges,false,()=>({}),$('vertexDegrees')?.checked,true,layout);
   svg(headings+drawing,parts?'Bipartite network drawn in two columns':'Network with no bipartition');
   formula(parts?'Bipartite graph · every edge joins the two sets':'No bipartition exists · the graph contains an odd cycle');
   results(parts?parts.map((part,i)=>['Set '+(i+1),part.join(', ')||'Empty']):[['Bipartite?','No']]);
   table(['Vertex','Set'],parts?parts.flatMap((part,i)=>part.map(name=>[name,i+1])):[]);
   note('A bipartite graph can be split into two sets with no edges within either set. A loop is a cycle of length one. Parallel edges can join the same pair of vertices across the sets.');
   legend([]);
   return;
 }
 const drawing=NetworkGraph.draw(names,edges,isDirected,(i,[a,b,w])=>{
   const cut=flow&&revealed()&&F.cut.includes(a)&&!F.cut.includes(b);
   return {color:cut?C.red:C.purple,width:cut?4:2,label:flow&&revealed()?fmt(F.flows[i])+'/'+w:w};
 },$('vertexDegrees')?.checked,!comm);
 svg(drawing,'Network with labelled vertices'+(isDirected?' and directed arrows':''));
 if(comm){const A=NetworkGraph.matrix(names,edges,isDirected),k=value('walkLength'),B=R.matrixPower(A,k),graph=$('viz').innerHTML;$('viz').style.height='auto';$('viz').innerHTML='<div class="network-diagram">'+graph+'</div>'+($('adjMatrix')?.checked?workPanel('Adjacency matrix A',matrixHTML(A,names)):'')+(revealed()?workPanel('A^'+k+' · number of walks using exactly '+k+' links',matrixHTML(B,names)):'');formula('Rows are senders; columns are receivers. Aᵏ counts k-link walks.');results([['Vertices',names.length],['Links per walk',k],['Direction',isDirected?'One way':'Two way']]);table(['From',...names],B.map((r,i)=>[names[i],...r]));note('Communication matrices count links, ignoring the entered weights. A² counts walks via one intermediary; walks may revisit vertices and edges. Directed links run from the first named vertex to the second.');legend([])}
 else if(flow){formula('Maximum flow = minimum cut capacity');results([['Maximum flow',F.total],['Source side of minimum cut',F.cut.join(', ')],['Augmenting paths',F.steps.length]]);table(['Path','Additional flow','Cumulative flow'],F.steps.map(o=>[o.path.join(' → '),o.amount,o.total]));note('Arrows follow the entered edge direction. Labels show flow / capacity. Red edges cross a minimum cut from the source side to the sink side. Reverse residual edges can cancel earlier flow; an augmenting path may use them.');legend([['Minimum cut',C.red]])}
 else{const degrees=names.map(v=>edges.reduce((d,[a,b])=>d+Number(a===v)+Number(b===v),0)),odd=names.filter((v,i)=>degrees[i]%2),seen=new Set([edges[0]?.[0]??names[0]]);let changed=true;while(changed){changed=false;edges.forEach(([a,b])=>{if(seen.has(a)&&!seen.has(b)){seen.add(b);changed=true}if(seen.has(b)&&!seen.has(a)){seen.add(a);changed=true}})}formula('Euler trails use every edge exactly once.');results([['Connected?',seen.size===names.length?'Yes':'No'],['Odd-degree vertices',odd.join(', ')||'None'],['Euler result',names.some((v,i)=>degrees[i]>0&&!seen.has(v))?'No trail':odd.length===0?'Circuit exists':odd.length===2?'Open trail exists':'No Euler trail']]);table(['Vertex','Degree','Parity'],names.map((v,i)=>[v,degrees[i],degrees[i]%2?'Odd':'Even']));note('A loop counts twice towards degree. All edges must lie in one component. Isolated vertices do not affect an Euler trail. Zero odd degrees gives a circuit, and two gives an open trail.');legend([])}
 };
};
// Keep both inequality activities available.
const inequalities2D=labs.inequalities.setup;
labs.inequalities.setup=function(){
 const mount=mode=>{$('legend').innerHTML='';(mode==='1d'?inequalities1D:inequalities2D)();$('controls').insertAdjacentHTML('afterbegin',select('inequalityDimension','Inequality model',[['1d','1D · solve on a number line'],['2d','2D · shaded Cartesian regions']]));$('inequalityDimension').value=mode;$('inequalityDimension').onchange=()=>{mount($('inequalityDimension').value);run()};};mount('1d');
};
const countingTypeset=labs.counting.setup;labs.counting.setup=function(){countingTypeset();const base=update;update=()=>{base();const n=value('objects'),r=value('places'),ordered=$('ordered').checked,repeat=$('repeat').checked;let m;
 if(ordered&&repeat)m='<msup><mi>n</mi><mi>r</mi></msup><mo>=</mo><msup><mn>'+n+'</mn><mn>'+r+'</mn></msup>';
 else{const top=repeat?'(n + r − 1)!':'n!',bottom=ordered?'(n − r)!':repeat?'r! (n − 1)!':'r! (n − r)!',nt=repeat?n+r-1:n,bt=ordered?(n-r)+'!':r+'! × '+(repeat?n-1:n-r)+'!';m=mathText(ordered?'P(n, r) = ':'C('+(repeat?'n+r−1':'n')+', r) = ')+fraction(top,bottom)+mathText(' = ')+fraction(nt+'!',bt)}
 const count=ordered?(repeat?n**r:E.factorial(n)/E.factorial(n-r)):repeat?E.factorial(n+r-1)/E.factorial(r)/E.factorial(n-1):E.factorial(n)/E.factorial(r)/E.factorial(n-r);$('formula').innerHTML=mathDisplay(m+(revealed()?mathText(' = '+Math.round(count).toLocaleString()):''));};};
const circleExactSetup=labs.trigonometry.setup;labs.trigonometry.setup=function(){circleExactSetup();$('circleUnits').parentElement.insertAdjacentHTML('afterend',check('exactCircle','Show exact values',true));const base=update;update=()=>{base();const circle=$('mode').value==='circle';showControl('exactCircle',circle);if(!circle||!$('exactCircle').checked)return;const d=value('circleAngle'),t=((d%360)+360)%360,ref=t<=90?t:t<=180?180-t:t<=270?t-180:360-t;
 const root=n=>'<msqrt><mn>'+n+'</mn></msqrt>',half=top=>'<mfrac>'+top+'<mn>2</mn></mfrac>',sgn=(negative,m)=>negative&&m!=='<mn>0</mn>'?'<mo>−</mo>'+m:m;
 const special={0:['<mn>0</mn>','<mn>1</mn>','<mn>0</mn>'],30:[half('<mn>1</mn>'),half(root(3)),'<mfrac>'+root(3)+'<mn>3</mn></mfrac>'],45:[half(root(2)),half(root(2)),'<mn>1</mn>'],60:[half(root(3)),half('<mn>1</mn>'),root(3)],90:['<mn>1</mn>','<mn>0</mn>',mathText('Undefined')]}[ref];
 let vals;if(special)vals=[sgn(t>180,special[0]),sgn(t>90&&t<270,special[1]),ref===90?special[2]:sgn(t>90&&t<180||t>270,special[2])];else vals=['sin','cos','tan'].map(f=>mathText(f+'('+d+'°)'));
 results([['sin θ',''],['cos θ',''],['tan θ','']]);$('results').querySelectorAll('strong').forEach((el,i)=>el.innerHTML=mathDisplay(vals[i]));note(special?'Exact special-angle values. Switch off exact values to see decimal approximations.':'This is not a standard special angle. Exact values remain in trigonometric form; switch off exact values for decimal approximations.');};};
launch(location.hash.slice(1));
