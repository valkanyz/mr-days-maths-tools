const assert=require('node:assert/strict');
const G=require('../docs/geometry-maker/model.js');
const state={page:'landscape',fontSize:28,lineWidth:2,grid:true,snap:true,nts:false,objects:[]};
for(const type of ['triangle','right','rectangle','trapezium','parallelogram','line','angle','circle','sector','text','parallel']){
 const o=G.preset(type,1);state.objects=[o];assert(G.valid(state),type);const svg=G.render(state,1,false);assert(svg.includes('Arial'));assert(svg.includes('fill="white"'));assert(!svg.includes('data-editor'));assert(!/NaN|undefined/.test(svg),type);assert(G.render(state,1,true).includes('data-editor'));
}
assert.equal(G.corner([1,0],[0,0],[0,1]).degrees,90);
const sector=G.preset('sector',2);assert(Math.abs(G.corner(sector.points[1],sector.points[0],sector.points[2]).degrees-60)<1e-9);
state.objects=[G.preset('triangle',1)];state.objects[0].labels[0]='<script>&';assert(G.render(state).includes('&lt;script&gt;&amp;'));
state.objects[0].edges=[{parallel:1000000}];assert(!G.valid(state));state.objects[0].edges=[null,{ticks:3}];assert(G.valid(state));state.objects[0].points[0]=null;assert(!G.valid(state));assert(!G.valid(null));
console.log('Geometry maker: all presets, exact angles, export cleanup, escaped labels and shared-state validation passed.');
const target=G.preset('rectangle',4);target.points=[[353,247],[753,247],[753,507],[353,507]];
assert.deepEqual(G.snapPoint([350,250],[target],1,18,true).point,[353,247]);
assert.deepEqual(G.snapPoint([350,250],[target],4,18,true).point,[360,260]);
assert.deepEqual(G.snapPoint([400,300],[target],1,18,false).point,[400,300]);
const joined=G.snapTranslation([[350,500],[750,500],[540,220]],[0,-250],[target],1,18,true);
assert.deepEqual(joined.delta,[3,-253]);
assert.deepEqual([350+joined.delta[0],500+joined.delta[1]],target.points[0]);
assert.deepEqual([750+joined.delta[0],500+joined.delta[1]],target.points[1]);
state.objects=[G.preset('point',8)];state.objects[0].labels=['P'];assert(G.valid(state));assert.deepEqual(G.edges(state.objects[0]),[]);assert(G.render(state).includes('r="4" fill="black"'));assert(G.render(state).includes('>P</text>'));assert(!G.render(state).includes('data-editor'));
console.log('Vertex snapping: off-grid joins, exclusions, whole-shape joins and labelled point exports passed.');
