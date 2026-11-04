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
