/* Pure classroom models. No DOM and no network dependencies. */
(function(root){
'use strict';
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
function series(data,period=4){
 if(![4,12].includes(period)||data.length<period*3||data.length>240||data.some(x=>!Number.isFinite(x)||x<=0||x>1e9))throw Error('Enter 3–20 complete years of positive quarterly or monthly values.');
 if(data.length%period)throw Error('Include complete years.');
 const moving=data.map((_,i)=>{const half=period/2;if(i<half||i>=data.length-half)return null;return (data[i-half]/2+data[i+half]/2+data.slice(i-half+1,i+half).reduce((s,x)=>s+x,0))/period;});
 const buckets=Array.from({length:period},()=>[]);data.forEach((v,i)=>{if(moving[i])buckets[i%period].push(v/moving[i]);});
 const raw=buckets.map(mean),adjust=mean(raw),indices=raw.map(v=>v/adjust),adjusted=data.map((v,i)=>v/indices[i%period]),xm=(data.length+1)/2,ym=mean(adjusted),slope=adjusted.reduce((s,v,i)=>s+(i+1-xm)*(v-ym),0)/data.reduce((s,_,i)=>s+(i+1-xm)**2,0),intercept=ym-slope*xm;
 return {moving,indices,adjusted,slope,intercept,forecast:Array.from({length:period},(_,i)=>(intercept+slope*(data.length+i+1))*indices[i])};
}
function capacity(shape,l,w,h){if([l,w,h].some(x=>!Number.isFinite(x)||x<=0||x>1e9))throw Error('Dimensions must be positive.');return shape==='box'?l*w*h:shape==='cylinder'?Math.PI*l*l*h:shape==='cone'?Math.PI*l*l*h/3:4*Math.PI*l*l*l/3;}
function heightFraction(shape,f){if(shape==='cone')return Math.cbrt(f);if(shape==='sphere'){let lo=0,hi=1;for(let i=0;i<60;i++){const x=(lo+hi)/2;if(3*x*x-2*x*x*x<f)lo=x;else hi=x;}return(lo+hi)/2;}return f;}
function clock(s){const m=String(s).trim().match(/^(\d{1,2}):(\d{2})$/);if(!m||+m[1]>47||+m[2]>59)throw Error('Use HH:MM times (00:00–47:59; 24:00 onward means the next day).');return +m[1]*60 + +m[2];}
function time(n){return (n>=1440?'Day '+(Math.floor(n/1440)+1)+' · ':'')+String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
function journeys(text,origin,destination,ready,transfer){
 const trips=text.trim().split('\n').filter(x=>x.trim()).map((line,i)=>{const p=line.split(',').map(x=>x.trim());if(p.length!==5||p.some(x=>!x))throw Error('Each row needs service, from, to, departure, arrival.');const dep=clock(p[3]);let arr=clock(p[4]);while(arr<dep)arr+=1440;return {id:i,service:p[0],from:p[1],to:p[2],dep,arr};});
 if(trips.length>100)throw Error('Use up to 100 services.');
 if(!origin||!destination||origin===destination)throw Error('Choose different start and destination stops.');
 const routes=[];
 function visit(stop,at,path,seen){if(path.length>6)return;if(stop===destination){routes.push({legs:path,arrival:at,duration:at-ready,waiting:at-ready-path.reduce((s,t)=>s+t.arr-t.dep,0)});return;}for(const t of trips){if(t.from!==stop||t.dep<at+(path.length?transfer:0)||seen.has(t.to))continue;visit(t.to,t.arr,[...path,t],new Set([...seen,t.to]));if(routes.length>500)throw Error('Too many connections; reduce the timetable.');}}
 visit(origin,ready,[],new Set([origin]));return {trips,routes:routes.sort((a,b)=>a.arrival-b.arrival||a.legs.length-b.legs.length)};
}
function circleAngle(a,b,c){const u=[a[0]-b[0],a[1]-b[1]],v=[c[0]-b[0],c[1]-b[1]];return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/Math.hypot(...u)/Math.hypot(...v))))*180/Math.PI;}
root.ClassroomModels={series,capacity,heightFraction,clock,time,journeys,circleAngle};if(typeof module!=='undefined')module.exports=root.ClassroomModels;
})(typeof window!=='undefined'?window:globalThis);
