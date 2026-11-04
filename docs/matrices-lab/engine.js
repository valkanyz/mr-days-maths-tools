(function(root){
'use strict';
const copy=A=>A.map(r=>r.slice()), identity=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));
function validate(A){if(!Array.isArray(A)||!A.length||!A[0].length||A.some(r=>r.length!==A[0].length||r.some(v=>!Number.isFinite(v))))throw Error('Enter a finite number or fraction in every cell.');return A;}
function square(A){validate(A);if(A.length!==A[0].length)throw Error('A must be square for this operation.');}
function mul(A,B){validate(A);validate(B);if(A[0].length!==B.length)throw Error('For A × B, the columns of A must equal the rows of B.');return A.map(r=>B[0].map((_,j)=>r.reduce((s,v,k)=>s+v*B[k][j],0)));}
function det(A){square(A);if(A.length===1)return A[0][0];return A[0].reduce((s,v,j)=>s+(-1)**j*v*det(A.slice(1).map(r=>r.filter((_,k)=>k!==j))),0);}
function inverse(A){square(A);let L=copy(A),R=identity(A.length),steps=[];for(let c=0;c<L.length;c++){let p=c;for(let i=c+1;i<L.length;i++)if(Math.abs(L[i][c])>Math.abs(L[p][c]))p=i;if(L[p][c]===0)throw Error('A is singular: no inverse exists, so there is no unique solution using A⁻¹.');if(p!==c){[L[c],L[p]]=[L[p],L[c]];[R[c],R[p]]=[R[p],R[c]];steps.push({label:`Swap R${c+1} and R${p+1}`,L:copy(L),R:copy(R)});}let divisor=L[c][c];L[c]=L[c].map(v=>v/divisor);R[c]=R[c].map(v=>v/divisor);steps.push({label:`R${c+1} ÷ (${divisor})`,L:copy(L),R:copy(R)});for(let i=0;i<L.length;i++)if(i!==c){const f=L[i][c];if(f===0)continue;L[i]=L[i].map((v,j)=>v-f*L[c][j]);R[i]=R[i].map((v,j)=>v-f*R[c][j]);steps.push({label:`R${i+1} − (${f})R${c+1}`,L:copy(L),R:copy(R)});}}return {out:R,steps};}
function power(A,n){square(A);if(!Number.isInteger(n)||n<0||n>20)throw Error('Use a whole-number power from 0 to 20.');let out=identity(A.length),stages=[];for(let i=0;i<n;i++){let left=out;out=mul(left,A);stages.push({left,right:A,out,title:`A${i===0?'⁰':`^${i}`} × A = A^${i+1}`});}return {out,stages};}
function parse(s){s=String(s).trim();if(!s)throw Error('Fill every matrix cell.');if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?:\s*\/\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)?$/i.test(s))throw Error('Use numbers or fractions, such as −2, 0.5 or 1/3.');let parts=s.split('/').map(Number),v=parts.length===2?parts[0]/parts[1]:parts[0];if(!Number.isFinite(v))throw Error('Every entry must be finite; a fraction cannot have denominator zero.');return v;}
function calculate(op,A,B,k=2,n=2){validate(A);validate(B);let result;
if(['add','subtract'].includes(op)){if(A.length!==B.length||A[0].length!==B[0].length)throw Error('Addition and subtraction need matrices of the same order.');result={out:A.map((r,i)=>r.map((v,j)=>v+(op==='add'?1:-1)*B[i][j]))};}
else if(op==='multiply'||op==='transform')result={out:mul(A,B)};
else if(op==='scale')result={out:A.map(r=>r.map(v=>v*k))};
else if(op==='transpose')result={out:A[0].map((_,j)=>A.map(r=>r[j]))};
else if(op==='determinant')result={out:[[det(A)]]};
else if(op==='inverse')result=inverse(A);
else if(op==='solve'){const inv=inverse(A);result={out:mul(inv.out,B),steps:inv.steps,stages:[{left:inv.out,right:B,out:mul(inv.out,B),title:'X = A⁻¹B'}]};}
else if(op==='power')result=power(A,n);
else if(op==='transition'){square(A);if(B[0].length!==1||B.length!==A.length)throw Error('The initial state B must be a column with one entry per state.');if(A.some(r=>r.some(v=>v<0))||A[0].some((_,j)=>Math.abs(A.reduce((s,r)=>s+r[j],0)-1)>1e-9))throw Error('Transition probabilities must be non-negative and each column must sum to 1.');if(B.some(r=>r[0]<0))throw Error('Initial populations must be non-negative.');if(!Number.isInteger(n)||n<0||n>20)throw Error('Use 0–20 transition steps.');let out=B,stages=[];for(let i=0;i<n;i++){const right=out;out=mul(A,right);stages.push({left:A,right,out,title:`State ${i+1} = A × state ${i}`});}result={out,stages};}
else throw Error('Choose an operation.');
if(result.out.some(r=>r.some(v=>!Number.isFinite(v))))throw Error('The result is too large to display. Try smaller entries or a smaller power.');return result;
}
const api={mul,det,inverse,power,parse,calculate,identity};if(typeof module!=='undefined')module.exports=api;root.MatrixMath=api;
})(globalThis);
