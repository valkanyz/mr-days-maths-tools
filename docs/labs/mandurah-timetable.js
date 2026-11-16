(function (root) {
'use strict';

const data = typeof module === 'undefined' ? root.MandurahTimetable : require('./mandurah-timetable-data.js');
const stations = Object.freeze([
 'Perth Underground', 'Elizabeth Quay', 'Canning Bridge', 'Bull Creek', 'Murdoch',
 'Cockburn Central', 'Aubin Grove', 'Kwinana', 'Wellard', 'Rockingham', 'Warnbro', 'Lakelands', 'Mandurah'
]);

function parseServices(rows, north) {
 return rows.trim().split('\n').map(line => {
  const cells = line.split(' ');
  const fridayOnly = cells[0] === 'F';
  if (fridayOnly) cells.shift();
  const times = cells.map(value => value === '-' ? null : Number(value));
  const first = times.findIndex(value => value !== null);
  const last = times.findLastIndex(value => value !== null);
  const startsAt = north ? stations.length - 1 - first : first;
  const terminatesAt = north ? stations.length - 1 - last : last;
  if (north) times.reverse();
  return {times, fridayOnly, startsAt, terminatesAt};
 });
}

const schedules = Object.fromEntries(Object.entries(data).map(([direction, days]) =>
 [direction, Object.fromEntries(Object.entries(days).map(([day, rows]) => [day, parseServices(rows, direction === 'north')]))]
));

function services(day, direction) {
 const rows = schedules[direction][day === 'friday' ? 'weekday' : day];
 return day === 'weekday' ? rows.filter(row => !row.fridayOnly) : rows;
}

function trip(service, origin, destination) {
 const departure = service.times[origin], arrival = service.times[destination];
 if (departure === null || arrival === null || departure >= arrival) return null;
 return {departure, arrival, duration:arrival - departure};
}

function findJourneys(day, origin, destination, target, arriveBy) {
 const rows = services(day, origin < destination ? 'south' : 'north');
 const journeys = rows.flatMap((service, index) => {
  const times = trip(service, origin, destination);
  return times ? [{...times, index}] : [];
 }).sort((a, b) => a.departure - b.departure || a.arrival - b.arrival);
 const withinTime = journeys.filter(row => arriveBy ? row.arrival <= target : row.departure >= target);
 const recommended = arriveBy ? withinTime.at(-1) : withinTime.reduce((best, row) =>
  !best || row.arrival < best.arrival ? row : best, null);
 return {rows, journeys, recommended};
}

function formatTime(minutes, twelveHour) {
 if (minutes === null) return '—';
 const hour = Math.floor(minutes / 60) % 24;
 const minute = String(minutes % 60).padStart(2, '0');
 return twelveHour ? `${hour % 12 || 12}:${minute} ${hour < 12 ? 'am' : 'pm'}`
  : `${String(hour).padStart(2, '0')}:${minute}`;
}

const model = {stations, services, trip, findJourneys, formatTime};
if (typeof module !== 'undefined') module.exports = model;
else root.MandurahLine = model;
})(typeof window !== 'undefined' ? window : globalThis);
