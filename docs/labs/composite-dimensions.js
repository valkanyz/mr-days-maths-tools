/* Task-specific dimensions for the finished outline and its defining shapes. */
(function(root) {
'use strict';
const Geometry=typeof module!=='undefined'&&module.exports?require('./composite-geometry.js'):root.CompositeGeometry;
const TAU=2*Math.PI,step=28;
const screen=point=>point.map(n=>28+n*step);
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const equal=(a,b)=>distance(a,b)<1e-7;
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const subtract=(a,b)=>a.map((n,i)=>n-b[i]);
function straightSides(boundaries) {
 const edges=boundaries.filter(edge=>edge.type==='line').map(edge=>({
  a:edge.interiorLeft?edge.a:edge.b,b:edge.interiorLeft?edge.b:edge.a,subtracted:edge.subtracted
 }));
 let merged=true;
 while(merged){
  merged=false;
  for(let i=0;i<edges.length&&!merged;i++)for(let j=0;j<edges.length;j++){
   if(i===j||edges[i].subtracted!==edges[j].subtracted||!equal(edges[i].b,edges[j].a))continue;
   const a=subtract(edges[i].b,edges[i].a),b=subtract(edges[j].b,edges[j].a);
   if(Math.abs(cross(a,b))>1e-7||a[0]*b[0]+a[1]*b[1]<=0)continue;
   edges[i].b=edges[j].b;edges.splice(j,1);merged=true;break;
  }
 }
 return edges;
}
function extent(boundaries) {
 const points=[];
 for(const edge of boundaries){
  if(edge.type==='line'){points.push(edge.a,edge.b);continue;}
  const angles=[edge.start,edge.end];
  for(let i=0;i<4;i++){
   const angle=i*Math.PI/2,delta=((angle-edge.start)%TAU+TAU)%TAU;
   if(delta<=edge.end-edge.start+1e-8)angles.push(angle);
  }
  points.push(...angles.map(a=>[edge.cx+edge.r*Math.cos(a),edge.cy+edge.r*Math.sin(a)]));
 }
 if(!points.length)return null;
 return {left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),
  top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))};
}
function render(measurement,pieces,options) {
 const box=extent(measurement.boundaries);
 if(!box)return '';
 const area=options.task!=='perimeter',occupied=[],dimensionKeys=new Set(),stroke='#1c2530';
 const number=n=>Number(n.toFixed(3)).toString();
 const unit=options.unit==='units'?' units':' '+options.unit,label=n=>number(n)+unit;
 const line=(a,b,style='')=>'<path d="M'+a+'L'+b+'" fill="none" stroke="'+stroke+'" stroke-width="1.5" '+style+'/>';
 function labelBox(x,y,value,angle,anchor) {
  const width=value.length*9+10,height=25,radians=angle*Math.PI/180;
  const w=Math.abs(width*Math.cos(radians))+Math.abs(height*Math.sin(radians));
  const h=Math.abs(width*Math.sin(radians))+Math.abs(height*Math.cos(radians));
  const centre=x+(anchor==='end'?-width/2:anchor==='start'?width/2:0);
  return {left:centre-w/2,right:centre+w/2,top:y-h/2,bottom:y+h/2};
 }
 const available=box=>!occupied.some(other=>box.left<other.right+5&&box.right>other.left-5&&box.top<other.bottom+5&&box.bottom>other.top-5);
 function text(x,y,value,angle=0,anchor='middle') {
  occupied.push(labelBox(x,y,value,angle,anchor));
  return '<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" dominant-baseline="middle"'
   +(angle?' transform="rotate('+angle+' '+x+' '+y+')"':'')
   +' font-family="Arial,sans-serif" font-size="17" fill="'+stroke+'" stroke="white" stroke-width="5" paint-order="stroke">'+value+'</text>';
 }
 function freeText(x,y,value) {
  for(const [dx,dy]of [[0,0],[0,-24],[0,24],[28,0],[-28,0],[0,-48],[0,48]])
   if(available(labelBox(x+dx,y+dy,value,0,'middle')))return text(x+dx,y+dy,value);
  return text(x,y-72,value);
 }
 function dimension(a,b,offset,prefix='') {
  const length=distance(a,b);
  if(length<1e-6)return '';
  const key=[a,b].map(p=>p.map(n=>n.toFixed(5)).join(',')).sort().join('|');
  if(dimensionKeys.has(key))return '';
  dimensionKeys.add(key);
  const normal=[(b[1]-a[1])/length,-(b[0]-a[0])/length],sign=Math.sign(offset)||1;
  const sloping=Math.abs(a[0]-b[0])>1e-6&&Math.abs(a[1]-b[1])>1e-6;
  let angle=sloping?Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI:0;
  if(angle>90)angle-=180;if(angle< -90)angle+=180;
  const value=prefix+label(length/step);
  const anchor=!sloping&&Math.abs(normal[0])>.9?(normal[0]*sign<0?'end':'start'):'middle';
  let chosen;
  for(const extra of [0,20,40,60]){
   const distance=offset+sign*extra;
   const p=a.map((n,i)=>n+normal[i]*distance),q=b.map((n,i)=>n+normal[i]*distance);
   const mid=p.map((n,i)=>(n+q[i])/2+normal[i]*sign*18);
   chosen={p,q,mid};
   if(available(labelBox(mid[0],mid[1],value,angle,anchor)))break;
  }
  const {p,q,mid}=chosen,extension=sign*4;
  return line(a,p.map((n,i)=>n+normal[i]*extension),'opacity=".4"')
   +line(b,q.map((n,i)=>n+normal[i]*extension),'opacity=".4"')
   +line(p,q,'marker-start="url(#composite-dimension-arrow)" marker-end="url(#composite-dimension-arrow)"')
   +text(mid[0],mid[1],value,angle,anchor);
 }
 function height(apex,foot,baseStart,baseEnd) {
  const a=screen(apex),b=screen(foot),u=subtract(screen(baseEnd),screen(baseStart));
  const baseLength=Math.hypot(...u),h=distance(a,b);
  if(h<1e-5)return '';
  const unitBase=u.map(n=>n/baseLength),unitHeight=subtract(a,b).map(n=>n/h),size=Math.min(9,h/4);
  const corner=[b.map((n,i)=>n+unitBase[i]*size),
   b.map((n,i)=>n+(unitBase[i]+unitHeight[i])*size),b.map((n,i)=>n+unitHeight[i]*size)];
  return line(a,b,'stroke-dasharray="5 4"')+'<path d="M'+corner.join('L')+'" fill="none" stroke="'+stroke+'" stroke-width="1.2"/>'
   +dimension(a,b,-20,'h = ');
 }
 let svg='<defs><marker id="composite-dimension-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0L5 5L0 10" fill="none" stroke="'+stroke+'" stroke-width="1.6"/></marker></defs><g data-composite-dimensions="true" pointer-events="none">';
 const width=box.right-box.left,totalHeight=box.bottom-box.top;
 if(options.overall){
  if(width>1e-7)svg+=dimension(screen([box.left,box.bottom]),screen([box.right,box.bottom]),-65);
  if(totalHeight>1e-7)svg+=dimension(screen([box.left,box.top]),screen([box.left,box.bottom]),-65);
 }
 if(area&&options.sides)for(const [index,piece]of pieces.entries()){
  if(!measurement.boundaries.some(edge=>edge.piece===index)&&index!==options.selected)continue;
  if(piece.kind!=='triangle'&&piece.kind!=='trapezium')continue;
  const edges=Geometry.shape(piece).segments;
  if(piece.kind==='triangle'){
   const {a,b}=edges[0],apex=edges[1].b,base=subtract(b,a);
   const t=((apex[0]-a[0])*base[0]+(apex[1]-a[1])*base[1])/(base[0]**2+base[1]**2);
   const foot=a.map((n,i)=>n+base[i]*t);
   svg+=dimension(screen(a),screen(b),-22,'b = ')+height(apex,foot,a,b);
  }else{
   const top=edges[0],bottom=edges[2],a=bottom.a,b=bottom.b,apex=top.a,base=subtract(b,a);
   const t=((apex[0]-a[0])*base[0]+(apex[1]-a[1])*base[1])/(base[0]**2+base[1]**2);
   const foot=a.map((n,i)=>n+base[i]*t);
   svg+=dimension(screen(top.a),screen(top.b),22)+dimension(screen(a),screen(b),22)+height(apex,foot,a,b);
  }
 }
 if(options.sides)for(const edge of straightSides(measurement.boundaries)){
  const dx=edge.b[0]-edge.a[0],dy=edge.b[1]-edge.a[1],length=distance(edge.a,edge.b);
  if(area&&Math.abs(dx)>1e-7&&Math.abs(dy)>1e-7)continue;
  if(options.overall&&((Math.abs(dy)<1e-7&&Math.abs(length-width)<1e-7)
   ||(Math.abs(dx)<1e-7&&Math.abs(length-totalHeight)<1e-7)))continue;
  if(length<.1)continue;
  svg+=dimension(screen(edge.a),screen(edge.b),edge.subtracted?-24:24);
 }
 const circles=new Set();
 for(const arc of measurement.boundaries.filter(edge=>edge.type==='arc')){
  const key=[arc.cx,arc.cy,arc.r].map(n=>n.toFixed(7)).join(',');
  if(circles.has(key))continue;
  circles.add(key);
  const candidates=measurement.boundaries.filter(e=>e.type==='arc'
   &&Math.hypot(e.cx-arc.cx,e.cy-arc.cy)<1e-7&&Math.abs(e.r-arc.r)<1e-7);
  const longest=candidates.reduce((a,b)=>b.end-b.start>a.end-a.start?b:a),angle=(longest.start+longest.end)/2;
  const centre=screen([arc.cx,arc.cy]),end=screen([arc.cx+arc.r*Math.cos(angle),arc.cy+arc.r*Math.sin(angle)]);
  svg+=line(centre,end,'marker-end="url(#composite-dimension-arrow)"')
   +'<circle cx="'+centre[0]+'" cy="'+centre[1]+'" r="2.5" fill="'+stroke+'"/>'
   +freeText((centre[0]+end[0])/2+Math.sin(angle)*18,(centre[1]+end[1])/2-Math.cos(angle)*18,'r = '+label(arc.r));
  for(const segment of candidates){
   const span=segment.end-segment.start;
   if(span>=TAU-1e-7)continue;
   const mid=(segment.start+segment.end)/2,r=segment.r*step+32;
   svg+=freeText(centre[0]+r*Math.cos(mid),centre[1]+r*Math.sin(mid),'arc '+number(span*180/Math.PI)+'°');
  }
 }
 return svg+'</g>';
}
const api={render,straightSides,extent};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.CompositeDimensions=api;
})(typeof window!=='undefined'?window:globalThis);
