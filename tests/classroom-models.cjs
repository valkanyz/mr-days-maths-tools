const assert=require('node:assert/strict');const M=require('../docs/labs/classroom-models.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const s=M.series(Array.from({length:16},(_,i)=>[80,120,160,40][i%4]));
s.indices.forEach((v,i)=>near(v,[.8,1.2,1.6,.4][i]));s.moving.slice(2,-2).forEach(v=>near(v,100));s.adjusted.forEach(v=>near(v,100));s.forecast.forEach((v,i)=>near(v,[80,120,160,40][i]));near(s.indices.reduce((a,b)=>a+b),4);
assert.throws(()=>M.series([1,2,3]));assert.throws(()=>M.series(Array(12).fill(0)));
near(M.capacity('box',10,8,15),1200);near(M.capacity('cylinder',3,1,10),90*Math.PI);near(M.capacity('cone',3,1,10),30*Math.PI);near(M.capacity('sphere',3,1,1),36*Math.PI);
near(M.heightFraction('sphere',.5),.5);near(M.heightFraction('cone',.125),.5);
const t='Bus,A,B,08:00,08:20\nTrain,B,C,08:24,08:40\nLater,B,C,08:30,08:50';
assert.equal(M.journeys(t,'A','C',M.clock('07:55'),5).routes[0].arrival,M.clock('08:50'));
assert.equal(M.journeys(t,'A','C',M.clock('07:55'),4).routes[0].arrival,M.clock('08:40'));
assert.equal(M.journeys('Night,A,B,23:50,00:10\nLink,B,C,24:15,24:40','A','C',M.clock('23:45'),5).routes[0].arrival,1480);
assert.equal(M.journeys(t,'C','A',0,0).routes.length,0);assert.throws(()=>M.clock('09:65'));assert.throws(()=>M.clock('48:00'));
near(M.circleAngle([-1,0],[0,1],[1,0]),90);
const rehearsal = [
 'Walk,A,Stop,6,,Walk', 'Bus,Stop,Gate,09:40,10:05,Bus',
 'Bus,Stop,Gate,09:55,10:17,Bus', 'Walk,Gate,Hall,9,,Walk',
 'Bike,A,Hall,37,,Bike'
].join('\n');
const deadline = M.clock('10:20');
const planned = M.journeys(rehearsal, 'A', 'Hall', 0, 5, deadline).routes;
assert.deepEqual(planned.map(r => [r.modes, M.time(r.departure), M.time(r.arrival), r.waiting, r.eventWait, r.duration]), [
 ['Bike', '09:43', '10:20', 0, 0, 37],
 ['Bus', '09:34', '10:14', 0, 6, 46],
 ['Bus', '09:49', '10:26', 0, 0, 37]
]);
const forward = M.journeys(rehearsal, 'A', 'Hall', M.clock('09:30'), 5).routes[0];
assert.deepEqual([forward.start, forward.departure, forward.arrival, forward.waiting], [570, 570, 607, 0]);
assert.deepEqual(M.timetableRows('Cycle\tA\tB\t30\t\tBike'), [['Cycle', 'A', 'B', '30', '', 'Bike']]);
assert.equal(M.journeys('Bike,A,B,30,,Bike', 'A', 'B', 0, 0, 20).routes[0].arrival, 30);
assert.throws(() => M.journeys('Bike,A,B,0,,Bike', 'A', 'B', 0, 0), /duration/);
console.log('PASS: centred averages, seasonal forecasts, solid capacities, nonlinear fill heights, connections and overnight journeys.');
const engine=require('../docs/labs/machine-engine.js');
assert.equal(engine.plan('sin(x)','45','degrees').stages.at(-1).text,'√2/2');
assert.equal(engine.plan('sin(x)^2+cos(x)^2','15','degrees').stages.at(-1).text,'1');
assert.equal(engine.plan('1/tan(x)','75','degrees').stages.at(-1).text,'2 − √3');
assert.equal(engine.plan('sin(x)','30.000000001','degrees').stages.at(-1).text.includes('/'),false);
assert.equal(engine.plan('sin(x)','pi/12').stages.at(-1).text,'(√6 − √2)/4');
console.log('PASS: structural exact surds, identities, rationalisation and non-special angle distinction.');
