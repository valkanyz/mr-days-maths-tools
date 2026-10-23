(function(root){
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
class Q{
 constructor(n,d=1){if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||!d)throw Error('Number is too large. Undo a step or start again.');if(d<0){n=-n;d=-d}const g=gcd(n,d);this.n=n===0?0:n/g;this.d=d/g;if(Math.abs(this.n)>1e9||this.d>1e9)throw Error('Number is too large. Undo a step or start again.')}
 static of(v){if(v instanceof Q)return v;const s=String(v).trim().replace(/−/g,'-');if(/^[+-]?\d+\s*\/\s*[+-]?\d+$/.test(s)){const [n,d]=s.split('/').map(Number);if(!d)throw Error('A fraction cannot have a zero denominator.');return new Q(n,d)}if(!/^[+-]?\d+(\.\d{1,3})?$/.test(s))throw Error('Enter a number, decimal or fraction such as 1/2.');let d=s.includes('.')?10**s.split('.')[1].length:1;return new Q(Math.round(Number(s)*d),d)}
 add(v){v=Q.of(v);return new Q(this.n*v.d+v.n*this.d,this.d*v.d)} neg(){return new Q(-this.n,this.d)} sub(v){return this.add(Q.of(v).neg())} mul(v){v=Q.of(v);return new Q(this.n*v.n,this.d*v.d)} div(v){v=Q.of(v);if(!v.n)throw Error('Cannot divide by zero.');return new Q(this.n*v.d,this.d*v.n)} value(){return this.n/this.d} toString(){return this.d===1?String(this.n):`${this.n}/${this.d}`}
}
function side(a,b){return {a:Q.of(a),b:Q.of(b)}}
function expression(s){let a=s.a,b=s.b,out='';if(a.n)out=(a.value()===1?'':a.value()===-1?'−':a.toString().replace('-','−'))+'x';if(b.n)out+=(out?(b.n<0?' − ':' + '):(b.n<0?'−':''))+new Q(Math.abs(b.n),b.d);return out||'0'}
function equation(s){return `${expression(s.l)} = ${expression(s.r)}`}
function solve(s){let a=s.l.a.sub(s.r.a),b=s.r.b.sub(s.l.b);return a.n?{kind:'one',x:b.div(a)}:{kind:b.n?'none':'all'}}
function apply(s,op,v,term='constant',target='both'){
 v=Q.of(v);if((op==='divide'||op==='multiply')&&!v.n)throw Error(op==='divide'?'Cannot divide by zero.':'Multiplying by zero loses the original equation. Choose another number.');
 function change(t){if(op==='add'||op==='subtract'){let n=op==='subtract'?v.neg():v;return term==='x'?{a:t.a.add(n),b:t.b}:{a:t.a,b:t.b.add(n)}}if(op==='multiply')return {a:t.a.mul(v),b:t.b.mul(v)};if(op==='divide')return {a:t.a.div(v),b:t.b.div(v)};throw Error('Choose an operation.')}
 return {l:target==='right'?s.l:change(s.l),r:target==='left'?s.r:change(s.r)}
}
const api={Q,side,expression,equation,solve,apply};if(typeof module!=='undefined')module.exports=api;else root.BalanceMath=api;
})(typeof window==='undefined'?globalThis:window);
