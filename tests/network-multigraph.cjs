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
