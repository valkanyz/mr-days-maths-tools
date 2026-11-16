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
function timetableRows(text) {
 return text.trim().split(/\r?\n/).filter(line => line.trim()).map(line =>
  line.split(line.includes('\t') ? '\t' : ',').map(cell => cell.trim())
 );
}

function journeys(data, origin, destination, ready, transfer, deadline = null) {
 if (!origin || !destination || origin === destination) throw Error('Choose different start and destination stops.');
 if (!Number.isInteger(transfer) || transfer < 0 || transfer > 120) throw Error('Enter a transfer time of 0–120 minutes.');
 const rows = typeof data === 'string' ? timetableRows(data) : data;
 if (rows.length > 100) throw Error('Use up to 100 timetable rows.');
 const trips = rows.map(([service, from, to, start, end, mode = 'Service', ...extra], id) => {
  if (!service || !from || !to || !start || extra.length) throw Error(`Complete timetable row ${id + 1}.`);
  const flexible = mode === 'Walk' || mode === 'Bike';
  if (flexible) {
   const minutes = Number(start);
   if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
    throw Error(`Enter a duration of 1–1440 minutes in row ${id + 1}.`);
   }
   return {id, service, from, to, mode, minutes, flexible};
  }
  const dep = clock(start);
  let arr = clock(end);
  while (arr < dep) arr += 1440;
  return {id, service, from, to, mode, dep, arr, flexible};
 });
 const departures = new Map();
 for (const trip of trips) {
  if (!departures.has(trip.from)) departures.set(trip.from, []);
  departures.get(trip.from).push(trip);
 }
 const routes = [];
 let searches = 0;
 function visit(stop, at, path, seen, hasService) {
  if (++searches > 25000 || routes.length >= 500) throw Error('Too many connections. Use a smaller timetable.');
  if (stop === destination) {
   const firstService = path.findIndex(leg => !leg.flexible);
   const flexibleCount = firstService < 0 ? path.length : firstService;
   const anchor = firstService < 0 ? deadline : path[firstService].dep;
   const slack = deadline === null || !flexibleCount ? 0 : Math.max(0, anchor - path[flexibleCount - 1].arr);
   const legs = path.map((leg, i) => i < flexibleCount ? {...leg, dep: leg.dep + slack, arr: leg.arr + slack} : leg);
   const departure = legs[0].dep;
   const arrival = legs.at(-1).arr;
   const start = deadline === null ? ready : departure;
   const travel = legs.reduce((sum, leg) => sum + leg.arr - leg.dep, 0);
   const eventWait = deadline === null ? 0 : Math.max(0, deadline - arrival);
   const modes = [...new Set(legs.map(leg => leg.mode).filter(mode => mode !== 'Walk'))];
   routes.push({
    legs, start, departure, arrival, travel, eventWait,
    waiting: arrival - start - travel,
    duration: arrival - start + eventWait,
    modes: modes.join(' + ') || 'Walk',
    key: legs.map(leg => leg.id).join('-')
   });
   return;
  }
  if (path.length === 6) return;
  for (const trip of departures.get(stop) || []) {
   if (seen.has(trip.to)) continue;
   const leg = trip.flexible ? {...trip, dep: at, arr: at + trip.minutes} : trip;
   if (leg.dep < at + (!leg.flexible && hasService ? transfer : 0)) continue;
   visit(leg.to, leg.arr, [...path, leg], new Set([...seen, leg.to]), hasService || !leg.flexible);
  }
 }
 visit(origin, ready, [], new Set([origin]), false);
 routes.sort((a, b) => {
  if (deadline !== null) {
   const aLate = a.arrival > deadline;
   const bLate = b.arrival > deadline;
   if (aLate !== bLate) return Number(aLate) - Number(bLate);
   const order = aLate ? a.arrival - b.arrival : b.departure - a.departure;
   if (order) return order;
  }
  return a.arrival - b.arrival || a.legs.length - b.legs.length;
 });
 return {trips, routes};
}
function circleAngle(a,b,c){const u=[a[0]-b[0],a[1]-b[1]],v=[c[0]-b[0],c[1]-b[1]];return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/Math.hypot(...u)/Math.hypot(...v))))*180/Math.PI;}
root.ClassroomModels={series,capacity,heightFraction,clock,time,timetableRows,journeys,circleAngle};if(typeof module!=='undefined')module.exports=root.ClassroomModels;
})(typeof window!=='undefined'?window:globalThis);
