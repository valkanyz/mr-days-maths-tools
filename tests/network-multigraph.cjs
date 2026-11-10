const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const M = require('../docs/labs/maths.js');
const G = vm.runInNewContext(fs.readFileSync('docs/labs/network-graph.js','utf8')+';NetworkGraph', {
  C:{purple:'purple'}, fmt:String, esc:String
});
const source=fs.readFileSync('docs/labs/refinements.js','utf8');
const R=vm.runInNewContext(source.slice(0,source.indexOf('const field='))+';R');
const {names,edges}=G.parse('A A 4\nA B 5\nB A 2\nB A 2\nC');
const plain=x=>JSON.parse(JSON.stringify(x));
assert.deepEqual(plain(G.matrix(names,edges,false)),[[1,3,0],[3,0,0],[0,0,0]]);
assert.deepEqual(plain(G.matrix(names,edges,true)),[[1,1,0],[2,0,0],[0,0,0]]);
const graph=M.network(edges,'A','C',names);
assert.equal(graph.distance,Infinity);
assert.equal(graph.weight,2);
assert.equal(graph.connected,false);
assert.deepEqual(graph.mst,[2]);
const drawing=G.draw(names,edges,false,()=>({}),true);
assert.equal(new Set([...drawing.matchAll(/<path d="([^"]+)"/g)].map(m=>m[1])).size,4);
assert.match(drawing,/deg 5</);
assert.match(drawing,/deg 0</);
assert.doesNotMatch(drawing,/NaN/);
const flow=R.maxFlow(edges,'B','A',names);
assert.deepEqual(plain(flow.flows),[0,0,2,2]);
assert.equal(R.maxFlow(edges,'A','C',names).total,0);
assert.equal(M.network([], 'C','C',['C']).distance,0);
console.log('Passed loops, parallel edges, isolated vertices, degree labels, adjacency, shortest paths, forest and flows.');

const bipartite=G.parse('A B 4\nA B 2\nA D 1\nC B 3\nC D 4\nE\nF G 7');
const parts=G.bipartition(bipartite.names,bipartite.edges);
assert.deepEqual(plain(parts),[['A','C','E','F'],['B','D','G']]);
const columns=G.columns(parts);
assert.equal(columns.points.A[0],columns.points.C[0]);
assert.notEqual(columns.points.A[0],columns.points.B[0]);
assert.match(G.draw(bipartite.names,bipartite.edges,false,()=>({}),true,true,columns),/deg 0</);
assert.equal(G.bipartition(names,edges),null);
const triangle=G.parse('A B 2\nB C 1\nC A 4');
assert.equal(G.bipartition(triangle.names,triangle.edges),null);

const prim=G.parse('A A 1\nA B 9\nA B 5\nA C 6\nB C 2\nD E 3\nF');
const forest=G.prim(prim.names,prim.edges,'C');
assert.deepEqual(plain(forest.accepted),[['B','C',2],['A','B',5],['D','E',3]]);
assert.equal(forest.components,3);
assert.match(forest.steps[0].label,/Start at C/);
assert.match(forest.steps[2].label,/Start at D/);
assert.equal(G.prim(prim.names,prim.edges,'A').accepted[0][2],5);
assert.equal(forest.accepted.reduce((total,edge)=>total+edge[2],0),M.network(prim.edges,'A','F',prim.names).weight);
console.log('Passed bipartition, odd cycles and Prim’s minimum spanning forest with a selectable start.');
