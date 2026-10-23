/* Independent fair coins: 0 = tails, 1 = heads. */
(function(root){
function distribution(n){let p=[1];for(let i=0;i<n;i++){const next=Array(p.length+1).fill(0);p.forEach((v,k)=>{next[k]+=v/2;next[k+1]+=v/2});p=next}return p}
function randomSide(source){const v=new Uint32Array(1);(source||crypto).getRandomValues(v);return v[0]%2}
class Experiment{
constructor(n=2){this.configure(n)}
configure(n){if(!Number.isInteger(n)||n<1||n>100)throw Error('Choose 1 to 100 coins');this.n=n;this.probabilities=distribution(n);this.reset()}
reset(){this.frequencies=Array(this.n+1).fill(0);this.faceFrequencies=[0,0];this.total=0;this.history=[]}
run(size){if(!Number.isInteger(size)||size<1||size>1000)throw Error('Invalid trial count');const delta=Array(this.n+1).fill(0),faceDelta=[0,0];let values;for(let t=0;t<size;t++){values=Array.from({length:this.n},()=>randomSide());values.forEach(v=>faceDelta[v]++);delta[values.reduce((a,b)=>a+b,0)]++}delta.forEach((v,i)=>this.frequencies[i]+=v);faceDelta.forEach((v,i)=>this.faceFrequencies[i]+=v);this.total+=size;this.history.push({size,delta,faceDelta,values});return values}
undo(){const last=this.history.pop();if(!last)return;last.delta.forEach((v,i)=>this.frequencies[i]-=v);last.faceDelta.forEach((v,i)=>this.faceFrequencies[i]-=v);this.total-=last.size}
get last(){return this.history.at(-1)}
view(mode='sum'){const each=mode==='each';return {min:0,max:each?1:this.n,frequencies:each?this.faceFrequencies:mode==='tails'?[...this.frequencies].reverse():this.frequencies,probabilities:each?[.5,.5]:this.probabilities,total:this.total*(each?this.n:1),label:each?'Side':mode==='tails'?'Tails':mode==='both'?'Count':'Heads',each}}
csv(mode='sum',grouped=false){const d=this.view(mode);if(mode==='both'){const h=bins(this.view('sum'),grouped),t=bins(this.view('tails'),grouped),pct=v=>this.total?(100*v/this.total).toFixed(1):'0.0';const rows=['Number of coins,Count,Heads frequency,Tails frequency,Heads relative frequency (%),Tails relative frequency (%)'];h.forEach((g,i)=>rows.push([this.n,g.label,g.count,t[i].count,pct(g.count),pct(t[i].count)].join(',')));rows.push([this.n,'Total',this.total,this.total,pct(this.total),pct(this.total)].join(','));return rows.join('\r\n')}let rows=[`Number of coins,${d.label}${grouped&&!d.each?' group':''},Frequency,Relative frequency (%)`];for(const g of bins(d,grouped))rows.push([this.n,g.label,g.count,d.total?(100*g.count/d.total).toFixed(1):'0.0'].join(','));rows.push([this.n,'Total',d.total,d.total?'100.0':'0.0'].join(','));return rows.join('\r\n')}
}
function bins(d,grouped){if(d.each)return [1,0].map(v=>({lo:v,hi:v,label:v?'Heads':'Tails',count:d.frequencies[v],probability:.5}));const width=grouped?Math.max(2,Math.ceil((d.max-d.min+1)/10)):1,out=[];for(let lo=d.min;lo<=d.max;lo+=width){const hi=Math.min(d.max,lo+width-1);let count=0,probability=0;for(let k=lo;k<=hi;k++){count+=d.frequencies[k];probability+=d.probabilities[k]}out.push({lo,hi,label:lo===hi?String(lo):`${lo}–${hi}`,count,probability})}return out}
const api={distribution,randomSide,Experiment,bins};if(typeof module!=='undefined')module.exports=api;else root.CoinEngine=api;
})(globalThis);
