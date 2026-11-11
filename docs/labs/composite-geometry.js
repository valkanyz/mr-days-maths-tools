/* Analytic boundaries for the union of added shapes with subtracted shapes removed. */
(function(root) {
'use strict';
const TAU=2*Math.PI, EPS=1e-8;
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const minus=(a,b)=>[a[0]-b[0],a[1]-b[1]];
const length=v=>Math.hypot(...v);
const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const normalAngle=a=>(a%TAU+TAU)%TAU;
const line=(a,b)=>({type:'line',a,b});
function at(edge,t) {
 if(edge.type==='line')return lerp(edge.a,edge.b,t);
 const angle=edge.start+(edge.end-edge.start)*t;
 return [edge.cx+edge.r*Math.cos(angle),edge.cy+edge.r*Math.sin(angle)];
}
function parameter(edge,point) {
 if(edge.type==='line'){
  const d=minus(edge.b,edge.a),v=minus(point,edge.a);
  return (d[0]*v[0]+d[1]*v[1])/(d[0]*d[0]+d[1]*d[1]);
 }
 let angle=normalAngle(Math.atan2(point[1]-edge.cy,point[0]-edge.cx)-edge.start);
 if(TAU-angle<EPS)angle=0;
 return angle/(edge.end-edge.start);
}
function shape(piece) {
 const kind=piece.kind||'rectangle',angle=(piece.rotation||0)*Math.PI/180;
 const circle=kind==='circle'||kind==='sector',r=piece.r||piece.w/2;
 const w=circle?2*r:piece.w,h=circle?2*r:piece.h;
 const transform=([x,y])=>{
  const u=x-w/2,v=y-h/2;
  const rotatedW=Math.abs(w*Math.cos(angle))+Math.abs(h*Math.sin(angle));
  const rotatedH=Math.abs(w*Math.sin(angle))+Math.abs(h*Math.cos(angle));
  return [piece.x+rotatedW/2+u*Math.cos(angle)-v*Math.sin(angle),
   piece.y+rotatedH/2+u*Math.sin(angle)+v*Math.cos(angle)];
 };
 if(circle){
  const [cx,cy]=transform([r,r]),span=kind==='circle'?TAU:(piece.angle||90)*Math.PI/180;
  const arc={type:'arc',cx,cy,r,start:-Math.PI/2+angle,end:-Math.PI/2+angle+span};
  const full=span>=TAU-EPS;
  const segments=full?[arc]:[line([cx,cy],at(arc,0)),arc,line(at(arc,1),[cx,cy])];
  return {segments,contains:([x,y])=>Math.hypot(x-cx,y-cy)<r
   &&(full||normalAngle(Math.atan2(y-cy,x-cx)-arc.start)<span)};
 }
 let points;
 if(kind==='triangle')points=[[0,h],[w,h],[piece.apex??w/2,0]];
 else if(kind==='trapezium'){
  const top=piece.top??w/2;
  points=[[(w-top)/2,0],[(w+top)/2,0],[w,h],[0,h]];
 }else points=[[0,0],[w,0],[w,h],[0,h]];
 points=points.map(transform);
 return {segments:points.map((p,i)=>line(p,points[(i+1)%points.length])),contains:([x,y])=>{
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
   const [a,b]=[points[i],points[j]];
   if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
 }};
}
function intersections(a,b) {
 if(a.type==='line'&&b.type==='line'){
  const u=minus(a.b,a.a),v=minus(b.b,b.a),d=minus(b.a,a.a),den=cross(u,v);
  if(Math.abs(den)>EPS){
   const t=cross(d,v)/den,s=cross(d,u)/den;
   return t>=-EPS&&t<=1+EPS&&s>=-EPS&&s<=1+EPS?[at(a,t)]:[];
  }
  if(Math.abs(cross(d,u))>EPS)return [];
  return [a.a,a.b,b.a,b.b].filter(p=>{
   const t=parameter(a,p),s=parameter(b,p);
   return t>=-EPS&&t<=1+EPS&&s>=-EPS&&s<=1+EPS;
  });
 }
 if(a.type==='arc'&&b.type==='line')return intersections(b,a);
 let points=[];
 if(a.type==='line'){
  const d=minus(a.b,a.a),q=minus(a.a,[b.cx,b.cy]),A=d[0]**2+d[1]**2;
  const B=2*(q[0]*d[0]+q[1]*d[1]),C=q[0]**2+q[1]**2-b.r**2,D=B*B-4*A*C;
  if(D< -EPS)return [];
  for(const t of [(-B-Math.sqrt(Math.max(0,D)))/(2*A),(-B+Math.sqrt(Math.max(0,D)))/(2*A)])
   if(t>=-EPS&&t<=1+EPS)points.push(at(a,t));
 }else{
  const dx=b.cx-a.cx,dy=b.cy-a.cy,d=Math.hypot(dx,dy);
  if(d<EPS){
   if(Math.abs(a.r-b.r)>EPS)return [];
   points=[at(a,0),at(a,1),at(b,0),at(b,1)];
  }else{
   if(d>a.r+b.r+EPS||d<Math.abs(a.r-b.r)-EPS)return [];
   const x=(a.r*a.r-b.r*b.r+d*d)/(2*d),height=Math.sqrt(Math.max(0,a.r*a.r-x*x));
   const cx=a.cx+x*dx/d,cy=a.cy+x*dy/d;
   points=[[cx-height*dy/d,cy+height*dx/d],[cx+height*dy/d,cy-height*dx/d]];
  }
 }
 return points.filter(p=>{
  const t=parameter(a,p),s=parameter(b,p);
  return t>=-EPS&&t<=1+EPS&&s>=-EPS&&s<=1+EPS;
 });
}
function measure(pieces) {
 const shapes=pieces.map(shape),added=shapes.filter((_,i)=>pieces[i].operation!=='subtract');
 const removed=shapes.filter((_,i)=>pieces[i].operation==='subtract');
 const inside=p=>added.some(s=>s.contains(p))&&!removed.some(s=>s.contains(p));
 const segments=shapes.flatMap(s=>s.segments),cuts=segments.map(()=>[0,1]);
 for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++)
  for(const point of intersections(segments[i],segments[j])){
   cuts[i].push(Math.max(0,Math.min(1,parameter(segments[i],point))));
   cuts[j].push(Math.max(0,Math.min(1,parameter(segments[j],point))));
  }
 const boundaries=[],seen=new Set();let area=0,perimeter=0;
 for(const [i,edge]of segments.entries()){
  const times=cuts[i].sort((a,b)=>a-b).filter((t,j,list)=>!j||t-list[j-1]>EPS);
  for(let j=1;j<times.length;j++){
   const from=times[j-1],to=times[j],mid=(from+to)/2,point=at(edge,mid);
   let tangent,segment,segmentLength,integral;
   if(edge.type==='line'){
    const a=at(edge,from),b=at(edge,to);
    tangent=minus(b,a);segmentLength=length(tangent);
    segment={type:'line',a,b};integral=cross(a,b)/2;
   }else{
    const start=edge.start+(edge.end-edge.start)*from,end=edge.start+(edge.end-edge.start)*to;
    const theta=(start+end)/2;
    tangent=[-Math.sin(theta),Math.cos(theta)];
    segment={...edge,start,end};segmentLength=edge.r*(end-start);
    integral=(edge.cx*edge.r*(Math.sin(end)-Math.sin(start))
     +edge.cy*edge.r*(Math.cos(start)-Math.cos(end))+edge.r*edge.r*(end-start))/2;
   }
   if(segmentLength<EPS)continue;
   const norm=length(tangent),offset=Math.min(1e-6,segmentLength*1e-4);
   const normal=[-tangent[1]/norm*offset,tangent[0]/norm*offset];
   const left=inside(point.map((v,k)=>v+normal[k])),right=inside(point.map((v,k)=>v-normal[k]));
   if(left===right)continue;
   const round=p=>p.map(n=>Math.round(n*1e7)).join(',');
   const ends=[round(at(edge,from)),round(at(edge,to))].sort();
   const key=edge.type+ends.join('|')+'|'+round(point);
   if(seen.has(key))continue;
   seen.add(key);
   boundaries.push({...segment,interiorLeft:left});perimeter+=segmentLength;area+=left?integral:-integral;
  }
 }
 return {area:Math.max(0,area),perimeter,boundaries,
  edges:boundaries.filter(e=>e.type==='line').map(e=>[e.a,e.b])};
}
function pathSegment(edge) {
 if(edge.type==='line')return 'M'+edge.a+'L'+edge.b;
 const point=angle=>[edge.cx+edge.r*Math.cos(angle),edge.cy+edge.r*Math.sin(angle)];
 const span=edge.end-edge.start;
 if(Math.abs(span)>=TAU-EPS){
  const mid=(edge.start+edge.end)/2;
  return pathSegment({...edge,end:mid})+pathSegment({...edge,start:mid});
 }
 return 'M'+point(edge.start)+'A'+edge.r+','+edge.r+' 0 '+(Math.abs(span)>Math.PI?1:0)+' '+(span>0?1:0)+' '+point(edge.end);
}
function path(piece) {
 const segments=shape(piece).segments;
 return segments.map(pathSegment).join('').replace(/M/g,'L').replace(/^L/,'M')+'Z';
}
const api={measure,path,pathSegment,shape};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.CompositeGeometry=api;
})(typeof window!=='undefined'?window:globalThis);
