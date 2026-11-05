const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('docs/labs/osm-timezones.js','utf8');
const zones=JSON.parse(fs.readFileSync('docs/labs/assets/timezones.geojson','utf8'));
const zonePoints=JSON.parse(fs.readFileSync('docs/labs/assets/zone-points.json','utf8'));
const counts={maps:0,tiles:0,geo:0,bands:0,markers:0,lines:0,destroyed:0};
const featuresSeen=[];
let activeMap=null,styleUrl=null;
const layer=(kind,options)=>({kind,options,bindTooltip(value){assert.equal(typeof value,'object','Labels must be safe DOM nodes');this.tooltip=value;return this},bindPopup(value){assert.equal(typeof value,'object');this.popup=value;return this},addTo(map){map.layers.push(this);return this}});
const L={
 map(node,options){
  counts.maps++;
  activeMap={layers:[],options,attributionControl:{addAttribution(text){assert.match(text,/OpenMapTiles/);assert.match(text,/OpenStreetMap/);}},fitBounds(bounds,options){this.fit={bounds,options}},setView(point,zoom){this.view={point,zoom}},removeLayer(item){this.layers.splice(this.layers.indexOf(item),1)},off(){},remove(){counts.destroyed++},invalidateSize(){this.invalidated=true}};
  return activeMap;
 },
 maplibreGL(options){counts.tiles++;styleUrl=options.style;return layer('vector-basemap',options)},
 geoJSON(data,options){
  counts.geo++;
  const matches=data.features.filter(options.filter);
  for(const feature of matches){options.onEachFeature(feature,layer('boundary',{}));assert(options.style(feature).weight>0);}
  featuresSeen.push(matches.map(x=>x.properties.tzid));
  return layer('geo',options);
 },
 rectangle(bounds,options){counts.bands++;return layer('band',options)},
 circleMarker(position,options){counts.markers++;return layer('city',options)},
 polyline(points,options){counts.lines++;assert.equal(points.length,65);return layer('journey',options)},
 latLngBounds(points){return {points,pad(){return this}}}
};
const doc={createElement(){return {textContent:''}}};
const window={L};
vm.runInNewContext(source,{window,document:doc});
const O=window.TimeZoneOSM;
assert(O.available());
const toolbar={addEventListener(name,fn){this.listener=fn}};
const fromOffset={textContent:''},toOffset={textContent:''};
const key={innerHTML:'',querySelector(selector){return selector.includes('from')?fromOffset:toOffset}};
const worldMapEl={};
const host={style:{},innerHTML:'',querySelector(selector){
 if(selector==='.timezone-osm-map')return this.innerHTML.includes('timezone-osm-map')?worldMapEl:null;
 if(selector==='.tz-osm-actions')return toolbar;
 if(selector==='.tz-osm-key')return key;
 return null;
}};
const offsetAt=(ms,z)=>{
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:z,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(ms)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
 return (Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute)-ms)/60000;
};
const settings={
 container:host,mode:'real',colourMode:'focus',zoneMap:zones,zonePoints,
 from:'Australia/Perth',to:'Europe/Istanbul',
 fromCity:['Rockingham','AU','Western Australia','Australia/Perth',115.77,-32.28],
 toCity:['Istanbul','TR','Istanbul','Europe/Istanbul',28.97,41.01],
 ms:Date.parse('2026-11-05T01:00:00Z'),offsetAt,
 offsetLabel:n=>'UTC'+(n>=0?'+':'−')+Math.abs(n)/60,
 zoneCanonical:z=>new Intl.DateTimeFormat('en',{timeZone:z}).resolvedOptions().timeZone,
 zoneLookup:(z,ids)=>ids.find(x=>x===z),timeZoneMapFill:n=>'hsl(100 40% 80%)'
};
assert(O.render(settings));
assert.deepEqual(featuresSeen[0].sort(),['Australia/Perth','Europe/Istanbul']);
assert.equal(counts.tiles,1);
assert.equal(counts.maps,1);
assert.equal(styleUrl,'https://tiles.openfreemap.org/styles/positron');
assert(!source.includes('tile.openstreetmap.org/{z}/{x}/{y}.png'),'Old raster tiles should not be requested');
assert(!source.includes('basemaps.cartocdn.com'),'Avoid CARTO tiles that require an API key');
assert.equal(fromOffset.textContent,'UTC+8');
assert.equal(toOffset.textContent,'UTC+3');
assert.equal(counts.markers,2);
assert.equal(counts.lines,1);
assert(activeMap.fit,'Default zoom fits the selected cities');
assert(O.render({...settings,colourMode:'all'}));
assert.equal(featuresSeen[1].length,zones.features.length,'Full mode uses all known timezone geometry');
assert(O.render({...settings,mode:'simple'}));
assert.equal(counts.bands,25);
assert.equal(counts.tiles,1,'Map tiles and instance are reused on UI updates');
assert.equal(counts.maps,1);
assert(activeMap.invalidated);
const arc=O.greatCircle([-32.28,115.77],[41.01,28.97]);
assert.equal(arc.length,65);
assert(Math.abs(arc[0][0]+32.28)<1e-8);
assert(Math.abs(arc.at(-1)[1]-28.97)<1e-8);
toolbar.listener({target:{closest(){return {dataset:{tzAction:'world'}}}}});
assert(activeMap.fit,'World view button can fit global bounds');
O.destroy();
assert.equal(counts.destroyed,1,'Map and Leaflet handlers are removed when switching labs');
console.log('PASS: OpenFreeMap Positron vector style, geographic polygons, both map modes, controls, markers, great circle, lifecycle and attribution.');