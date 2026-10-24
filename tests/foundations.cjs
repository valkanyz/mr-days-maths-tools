const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('docs/labs/foundations.js','utf8').split('(function(){')[0];const c={};vm.runInNewContext(code+';this.F=Foundation',c);const F=c.F,near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`),pair=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
near(F.percent(80,25,'part').total,20);near(F.percent(80,25,'increase').total,100);near(F.percent(80,100,'decrease').total,0);near(F.percent(0,75,'increase').total,0);
pair(F.transform([2,-3],'reflectX'),[2,3]);pair(F.transform([2,-3],'reflectY'),[-2,-3]);pair(F.transform([2,-3],'reflectD'),[-3,2]);pair(F.transform([2,-3],'rotate',90),[3,2]);pair(F.transform([2,-3],'rotate',180),[-2,3]);pair(F.transform([2,-3],'rotate',270),[-3,-2]);pair(F.transform([2,-3],'translate',4,5),[6,2]);pair(F.transform([2,-3],'dilate',.5),[1,-1.5]);
near(F.area('triangle',3,4).area,6);near(F.area('triangle',3,4).perimeter,12);near(F.area('rectangle',8,5).area,40);near(F.area('rectangle',8,5).perimeter,26);
let s=F.stats([1,2,2,3,3,7]);near(s.mean,3);near(s.median,2.5);pair(s.modes,[2,3]);near(s.range,6);pair(F.stats([0,1,2]).modes,[]);near(F.stats([9]).median,9);near(F.stats([0,0]).mean,0);
near(F.time(1290,8,10,240),1650);assert.equal(F.clock(1650,true).text,'3:30 am');near(F.clock(1650,true).day,1);assert.equal(F.clock(-30,false).text,'23:30');near(F.clock(-30,false).day,-1);near(F.time(720,8,9.5,0),810);assert.equal(F.clock(720,true).text,'12:00 pm');assert.equal(F.clock(0,true).text,'12:00 am');
near(F.decimals(.1,.2,'add'),.3);near(F.decimals(.1,.2,'subtract'),-.1);near(F.decimals(.3,.2,'multiply'),.06);near(F.decimals(.12,.03,'divide'),4);assert.throws(()=>F.decimals(1,0,'divide'));
console.log('Foundation models: percentages, transformations, area, statistics, midnight/fractional time zones and decimals passed.');

near(F.roundDecimal(1.005,2),1.01);near(F.roundDecimal(2.675,2),2.68);near(F.roundDecimal(99.999,0),100);
