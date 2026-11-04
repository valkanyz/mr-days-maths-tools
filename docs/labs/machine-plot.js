/* Completed numeric input/output pairs only: no predictions or fitted curve. */
(function(root){
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function number(text){try{const p=root.MachineMath.plan('x',text).input;if(!p.size)return 0;if(p.size!==1||!p.has(''))return null;const v=root.MachineMath.num(p.get(''));return Number.isFinite(v)?v:null;}catch{return null;}}
function axis(values){
 const lo=Math.min(0,...values),hi=Math.max(0,...values),span=hi-lo||2,pad=span*.1,raw=(span+pad*2)/6,power=10**Math.floor(Math.log10(raw)),step=([1,2,5,10].find(n=>n*power>=raw)||10)*power;
 const min=Math.floor((lo-pad)/step)*step,max=Math.ceil((hi+pad)/step)*step;
 return {min,max,step};
}
const label=n=>n===0?'0':Math.abs(n)>=1e6||Math.abs(n)<.001?Number(n.toPrecision(3)).toExponential():String(Number(n.toPrecision(6)));
// Calculate once per function, independently of the points completed so far.
let cachedFunction=null,cachedBounds=null;
function bounds(functionText){
 if(functionText===cachedFunction)return cachedBounds;
 const values=[];
 // Includes all integer, half and quarter inputs used by continuous production,
 // plus finer samples to leave room for turning points between them.
 for(let i=-400;i<=400;i++){try{const p=root.MachineMath.plan(functionText,String(i/40)).output;if(!p)continue;const v=!p.size?0:p.size===1&&p.has('')?root.MachineMath.num(p.get('')):NaN;if(Number.isFinite(v))values.push(v);}catch{}}
 cachedFunction=functionText;cachedBounds={x:{min:-10,max:10,step:2},y:axis(values),numeric:values.length>0};return cachedBounds;
}
function render(records,show=true,functionText=records[0]?.[0]||'2x+3'){
 if(!show)return '<p>Show answers to see the input/output graph.</p>';
 const numericPoints=records.map(r=>({x:number(r[1]),y:number(r[2]),input:r[1],output:r[2]})).filter(p=>p.x!==null&&p.y!==null),{x,y}=bounds(functionText),points=numericPoints.filter(p=>p.x>=x.min&&p.x<=x.max&&p.y>=y.min&&p.y<=y.max),X=v=>90+(v-x.min)/(x.max-x.min)*650,Y=v=>370-(v-y.min)/(y.max-y.min)*320;
 let s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 440" role="img" aria-label="Completed input and output pairs" preserveAspectRatio="xMidYMid meet" style="display:block;width:100%;height:auto;aspect-ratio:800/440;max-height:480px;background:white;border-radius:8px"><title>Input x and output y</title>';
 for(let i=0;i<=Math.round((x.max-x.min)/x.step);i++){const v=x.min+i*x.step,px=X(v);s+=`<path d="M${px} 50V370" stroke="#e5ddee"/><text x="${px}" y="395" text-anchor="middle" font-size="15" fill="#574266">${label(Math.abs(v)<x.step*1e-8?0:v)}</text>`;}
 for(let i=0;i<=Math.round((y.max-y.min)/y.step);i++){const v=y.min+i*y.step,py=Y(v);s+=`<path d="M90 ${py}H740" stroke="#e5ddee"/><text x="80" y="${py+5}" text-anchor="end" font-size="15" fill="#574266">${label(Math.abs(v)<y.step*1e-8?0:v)}</text>`;}
 s+=`<path d="M90 ${Y(0)}H740M${X(0)} 50V370" stroke="#806691" stroke-width="2"/><text x="415" y="430" text-anchor="middle" font-size="19" fill="#493453">Input (x)</text><text transform="translate(23 210) rotate(-90)" text-anchor="middle" font-size="19" fill="#493453">Output (y)</text>`;
 for(const p of points)s+=`<circle data-pair="${esc(p.input)},${esc(p.output)}" cx="${X(p.x)}" cy="${Y(p.y)}" r="6" fill="#8050b4" stroke="white" stroke-width="2" tabindex="0" role="img" aria-label="Input ${esc(p.input)}, output ${esc(p.output)}"><title>(${esc(p.input)}, ${esc(p.output)})</title></circle>`;
 if(!points.length)s+='<text x="415" y="30" text-anchor="middle" font-size="17" fill="#493453">Run a numeric input to plot its result.</text>';
 s+='</svg><p style="font-size:13px;margin:8px 0">Axes are fixed for this function over x = −10 to 10, using sampled finite outputs. Each point is a completed input/output pair. Hover for its values.</p>';
 if(numericPoints.length>points.length)s+='<p style="font-size:13px">'+(numericPoints.length-points.length)+' completed point(s) fall outside these fixed axes; their values remain in the table.</p>';
 if(numericPoints.length<records.length)s+='<p style="font-size:13px">Symbolic pairs are listed in the table; only numeric pairs can be plotted.</p>';
 return s;
}
root.MachinePlot={render,number,axis,bounds};if(typeof module!=='undefined'&&module.exports)module.exports=root.MachinePlot;
})(typeof window!=='undefined'?window:globalThis);
