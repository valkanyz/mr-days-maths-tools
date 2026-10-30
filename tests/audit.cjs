const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('docs/class-games/index.html','utf8');const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);const context={module:{exports:{}}};vm.runInNewContext(scripts[0],context);const G=context.module.exports;
const easy=G.targetPuzzle('easy',()=>0);assert.ok(easy.target>=20&&easy.target<=100);assert.ok(easy.nums.every(n=>n>=1&&n<=10));assert.equal(easy.target,20);
const {Experiment}=require('../docs/dice-lab/engine.js');const model=new Experiment();for(const n of [0,-1,1.5,Infinity,1000001]){assert.throws(()=>model.run(n));assert.equal(model.total,0);assert.equal(model.frequencies.reduce((a,b)=>a+b,0),0)};
console.log('PASS: accessible target fallback and invalid dice-trial counts leave experiments unchanged.');
