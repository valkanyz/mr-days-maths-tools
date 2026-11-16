const assert = require('node:assert/strict');
const {stations, services, trip, findJourneys, formatTime} = require('../docs/labs/mandurah-timetable.js');

assert.equal(stations.length, 13);
assert.equal(stations[5], 'Cockburn Central');
assert.equal(stations[11], 'Lakelands');

const counts = {
 north: {weekday: 125, friday: 127, saturday: 68, sunday: 59},
 south: {weekday: 129, friday: 131, saturday: 69, sunday: 59}
};
for (const [direction, groups] of Object.entries(counts)) {
 for (const [day, count] of Object.entries(groups)) {
  const rows = services(day, direction);
  assert.equal(rows.length, count);
  for (const row of rows) {
   assert.equal(row.times.length, stations.length);
   const times = row.times.filter(value => value !== null);
   assert.ok(times.every(Number.isInteger));
   assert.ok(times.every((time, index) => index === 0 ||
    (direction === 'north' ? time < times[index - 1] : time > times[index - 1])));
  }
 }
}

const lakelandsToPerth = findJourneys('weekday', 11, 0, 480, false);
assert.deepEqual(lakelandsToPerth.recommended, {departure:481, arrival:531, duration:50, index:29});
assert.deepEqual(findJourneys('weekday', 11, 0, 540, true).recommended, lakelandsToPerth.recommended);
assert.equal(findJourneys('weekday', 11, 0, 531, true).recommended.departure, 481);
assert.equal(findJourneys('weekday', 11, 0, 240, true).recommended, undefined);

const shortSouth = services('weekday', 'south').find(row => row.terminatesAt === 5);
assert.equal(shortSouth.times[0], 392);
assert.equal(shortSouth.times[5], 410);
assert.equal(trip(shortSouth, 0, 12), null);
const shortNorth = services('weekday', 'north').find(row => row.startsAt === 5);
assert.equal(shortNorth.times[5], 427);
assert.equal(shortNorth.times[0], 446);
assert.equal(trip(shortNorth, 12, 0), null);

assert.equal(findJourneys('saturday', 0, 12, 500, false).recommended.arrival, 555);
assert.equal(findJourneys('sunday', 12, 0, 720, true).recommended.arrival, 708);
assert.equal(findJourneys('weekday', 0, 12, 1480, false).recommended, null);
assert.equal(findJourneys('friday', 0, 12, 1480, false).recommended.arrival, 1569);
assert.equal(formatTime(1505, true), '1:05 am');
assert.equal(formatTime(720, true), '12:00 pm');
assert.equal(formatTime(1505, false), '01:05');

console.log('PASS: timetable data, both directions, day patterns, short services, arrive by and overnight times.');
