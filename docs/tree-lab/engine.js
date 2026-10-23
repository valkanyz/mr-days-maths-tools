(function(root){
const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a;
function frac(n,d=1n){n=BigInt(n);d=BigInt(d);if(!d)throw Error('Zero denominator');const g=gcd(n,d);return {n:n/g,d:d/g}}
const mul=(a,b)=>frac(a.n*b.n,a.d*b.d),add=(a,b)=>frac(a.n*b.d+b.n*a.d,a.d*b.d);
const text=p=>p.d===1n?String(p.n):`${p.n}/${p.d}`;
function build({outcomes,stages,replacement,weighted}){
 if(!Number.isInteger(stages)||stages<1||stages>4)throw Error('Choose 1–4 stages.');
 if(outcomes.length<2||outcomes.length>6)throw Error('Use 2–6 outcomes.');
 const counts=outcomes.map(o=>weighted?o.count:1);
 if(counts.some(c=>!Number.isInteger(c)||c<1||c>50))throw Error('Each item count must be a whole number from 1 to 50.');
 if(!replacement&&stages>counts.reduce((a,b)=>a+b,0))throw Error('There are not enough items for this many draws without replacement.');
 let id=0;const leaves=[];
 function visit(left,depth,path,p){const node={id:id++,depth,path,p,children:[]};if(depth===stages){leaves.push(node);if(leaves.length>256)throw Error('This tree has more than 256 paths. Reduce the stages or outcomes.');return node}
 const total=left.reduce((a,b)=>a+b,0);left.forEach((c,i)=>{if(!c)return;const next=left.slice();if(!replacement)next[i]--;const branch=frac(c,total),child=visit(next,depth+1,[...path,i],mul(p,branch));child.branch=branch;child.outcome=i;node.children.push(child)});return node}
 const tree=visit(counts,0,[],frac(1));return {tree,leaves};
}
const api={frac,mul,add,text,build};if(typeof module!=='undefined')module.exports=api;else root.TreeMath=api;
})(typeof window==='undefined'?globalThis:window);
