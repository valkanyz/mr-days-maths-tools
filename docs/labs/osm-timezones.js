/* An actual slippy map for the Time Zones Lab, using OpenStreetMap raster
   tiles and OSM-derived IANA boundaries from Timezone Boundary Builder.
   Only the visible viewport requests tiles; no bulk downloads/prefetch. */
(function(root){
 'use strict';
 let map=null, host=null, overlays=[], latest=null, previousLocations='';
 const START='#8050b4',END='#d24452',SHARED='#078477';

 function available(){return !!(root.L && root.L.map && root.L.geoJSON && root.L.tileLayer);}
 function clearLayers(){
  if(!map)return;
  for(const layer of overlays)map.removeLayer(layer);
  overlays=[];
 }
 function destroy(){
  clearLayers();
  if(map){map.off();map.remove();}
  map=null;host=null;latest=null;previousLocations='';
 }
 function label(text){
  const span=document.createElement('span');
  span.textContent=String(text);
  return span;
 }
 function add(layer){
  layer.addTo(map);
  overlays.push(layer);
  return layer;
 }
 function locationOf(city,coordinateFallback){
  const lon=Number(city[4]),lat=Number(city[5]);
  if(city[4]!==null && city[5]!==null && Number.isFinite(lon)&&Number.isFinite(lat))
   return [lat,lon];
  const p=coordinateFallback(city[3]);
  if(!Array.isArray(p)||p.length<2)return null;
  return [Number(p[1]),Number(p[0])];
 }
 function greatCircle(a,b){
  const d=Math.PI/180;
  const lat1=a[0]*d,lon1=a[1]*d,lat2=b[0]*d,lon2=b[1]*d;
  const va=[Math.cos(lat1)*Math.cos(lon1),Math.cos(lat1)*Math.sin(lon1),Math.sin(lat1)];
  const vb=[Math.cos(lat2)*Math.cos(lon2),Math.cos(lat2)*Math.sin(lon2),Math.sin(lat2)];
  const dot=Math.max(-1,Math.min(1,va[0]*vb[0]+va[1]*vb[1]+va[2]*vb[2]));
  const omega=Math.acos(dot),sin=Math.sin(omega);
  if(sin<1e-8)return [a,b];
  const out=[];
  for(let i=0;i<=64;i++){
   const t=i/64,x=Math.sin((1-t)*omega)/sin,y=Math.sin(t*omega)/sin;
   const v=[x*va[0]+y*vb[0],x*va[1]+y*vb[1],x*va[2]+y*vb[2]];
   const lat=Math.atan2(v[2],Math.hypot(v[0],v[1]))/d;
   let lon=Math.atan2(v[1],v[0])/d;
   if(out.length){while(lon-out[out.length-1][1]>180)lon-=360;while(lon-out[out.length-1][1]<-180)lon+=360;}
   out.push([lat,lon]);
  }
  return out;
 }
 function placesBounds(){
  if(!latest)return;
  const pair=[latest.fromPosition,latest.toPosition].filter(Boolean);
  if(!pair.length)return;
  if(pair.length===1){map.setView(pair[0],5);return;}
  const bounds=root.L.latLngBounds(pair);
  map.fitBounds(bounds.pad(.22),{padding:[28,28],maxZoom:4,animate:false});
 }
 function worldView(){
  if(!map)return;
  map.fitBounds([[-55,-169],[75,169]],{padding:[15,15],animate:false});
 }
 function create(rootEl){
  if(map&&host===rootEl&&rootEl.querySelector('.timezone-osm-map'))return;
  destroy();
  host=rootEl;
  rootEl.style.height='auto';
  rootEl.style.overflow='visible';
  rootEl.style.touchAction='auto';
  rootEl.innerHTML='<div class="tz-osm-heading"><div><strong>Geographic map</strong><small>OpenStreetMap basemap · pan or zoom to explore</small></div><div class="tz-osm-actions"><button type="button" data-tz-action="places">Fit places</button><button type="button" data-tz-action="world">World</button></div></div><div class="timezone-osm-map" role="region" aria-label="Interactive OpenStreetMap with time zones"></div><div class="tz-osm-key" aria-live="polite"></div>';
  const mapEl=rootEl.querySelector('.timezone-osm-map');
  map=root.L.map(mapEl,{
   center:[12,16],zoom:2,minZoom:1,maxZoom:16,zoomSnap:.25,zoomDelta:.5,
   scrollWheelZoom:false,worldCopyJump:true,preferCanvas:true,
   attributionControl:true
  });
  root.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
   minZoom:1,maxZoom:19,noWrap:true,detectRetina:false,updateWhenIdle:true,
   keepBuffer:1,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
  }).addTo(map);
  rootEl.querySelector('.tz-osm-actions').addEventListener('click',function(event){
   const button=event.target.closest('[data-tz-action]');
   if(!button||!map)return;
   if(button.dataset.tzAction==='places')placesBounds();
   if(button.dataset.tzAction==='world')worldView();
  });
 }
 function show(opts){
  if(!available())return false;
  const {container,mode,colourMode,zoneMap,from,to,fromCity,toCity,ms,offsetAt,offsetLabel,zoneCanonical,zoneLookup,zonePoints,timeZoneMapFill}=opts;
  create(container);
  latest={
   fromPosition:locationOf(fromCity,function(z){return zonePoints && zonePoints[zoneLookup(z,Object.keys(zonePoints))]}),
   toPosition:locationOf(toCity,function(z){return zonePoints && zonePoints[zoneLookup(z,Object.keys(zonePoints))]})
  };
  clearLayers();
  const startZone=zoneCanonical(from),endZone=zoneCanonical(to),same=startZone===endZone;
  const startColor=same?SHARED:START,endColor=same?SHARED:END;
  const formatZone=function(tz){
   try{return tz.replaceAll('_',' ')+' · '+offsetLabel(offsetAt(ms,tz))+' at departure';}
   catch{return tz.replaceAll('_',' ');}
  };
  if(mode==='real'&&zoneMap){
   const showAll=colourMode==='all';
   const primary=root.L.geoJSON(zoneMap,{
    filter:function(feature){
     const z=zoneCanonical(feature.properties.tzid);
     return showAll||z===startZone||z===endZone;
    },
    style:function(feature){
     const id=feature.properties.tzid,z=zoneCanonical(id);
     const chosen=z===startZone||z===endZone;
     const colour=z===startZone?startColor:endColor;
     const offset=offsetAt(ms,id);
     return chosen?{
      color:colour,weight:2.5,opacity:.94,fillColor:colour,fillOpacity:.16
     }:{
      color:'#718998',weight:.6,opacity:.35,
      fillColor:timeZoneMapFill(offset),fillOpacity:.14
     };
    },
    onEachFeature:function(feature,layer){
     layer.bindTooltip(label(formatZone(feature.properties.tzid)),{sticky:true,opacity:.95});
    }
   });
   add(primary);
  }
  if(mode==='simple'){
   for(let i=-12;i<=12;i++){
    const west=Math.max(-180,(i-.5)*15),east=Math.min(180,(i+.5)*15);
    const band=root.L.rectangle([[-75,west],[78,east]],{
     color:'#526d7b',weight:.55,opacity:.38,
     fillColor:timeZoneMapFill(i*60),fillOpacity:.18,
     interactive:true
    });
    band.bindTooltip(label(offsetLabel(i*60)+' · simplified 15° longitude band'),{sticky:true});
    add(band);
   }
  }
  const positions=[latest.fromPosition,latest.toPosition];
  if(positions[0]&&positions[1]&&(positions[0][0]!==positions[1][0]||positions[0][1]!==positions[1][1])){
   const path=greatCircle(positions[0],positions[1]);
   add(root.L.polyline(path,{color:'#ab781c',weight:2,opacity:.8,dashArray:'5 6',interactive:true})
    .bindTooltip(label('Great-circle reference only · not an actual flight route'),{sticky:true}));
  }
  for(const item of [
   {p:positions[0],city:fromCity,zone:from,colour:startColor},
   {p:positions[1],city:toCity,zone:to,colour:endColor}
  ]){
   if(!item.p)continue;
   const marker=root.L.circleMarker(item.p,{
    radius:7,weight:2.5,color:'#fff',fillColor:item.colour,fillOpacity:1
   });
   marker.bindTooltip(label(item.city[0]),{
    permanent:true,direction:'bottom',offset:[0,7],className:'tz-map-city'
   });
   marker.bindPopup(label(item.city[0]+' · '+formatZone(item.zone)));
   add(marker);
  }
  const key=container.querySelector('.tz-osm-key');
  key.innerHTML='<span class="tz-osm-key-item"><i class="tz-key-start"></i><b>Departure</b><span data-tz-offset="from"></span></span><span class="tz-osm-key-item"><i class="tz-key-end"></i><b>Destination</b><span data-tz-offset="to"></span></span><small>Time-zone outlines: OpenStreetMap-derived boundaries. Map: OpenStreetMap contributors.</small>';
  key.querySelector('[data-tz-offset="from"]').textContent=offsetLabel(offsetAt(ms,from));
  key.querySelector('[data-tz-offset="to"]').textContent=offsetLabel(offsetAt(ms,to));
  const places=positions.map(p=>p&&p.join(',')).join('|');
  if(places!==previousLocations){
   previousLocations=places;
   placesBounds();
  }else map.invalidateSize({pan:false});
  return true;
 }
 root.TimeZoneOSM={available,render:show,destroy,greatCircle};
})(window);
