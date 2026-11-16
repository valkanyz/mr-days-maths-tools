(() => {
'use strict';

const {stations, findJourneys, trip, formatTime} = MandurahLine;
const days = [
 ['weekday', 'Monday–Thursday'],
 ['friday', 'Friday'],
 ['saturday', 'Saturday'],
 ['sunday', 'Sunday and public holidays']
];
const shortNames = ['Perth Underground', 'Elizabeth Quay', 'Canning Bridge', 'Bull Creek', 'Murdoch',
 'Cockburn Central', 'Aubin Grove', 'Kwinana', 'Wellard', 'Rockingham', 'Warnbro', 'Lakelands', 'Mandurah'];

labs.journeys = {
 title:'Mandurah Line Timetable',
 tag:'TIMETABLES & ELAPSED TIME',
 subtitle:'Plan a train journey',
 setup() {
  const stationOptions = stations.map((name, index) => [String(index), name]);
  controls(
   select('mlDay', 'Service day', days) +
   select('mlFrom', 'Origin', stationOptions) +
   select('mlTo', 'Destination', stationOptions) +
   '<button type="button" id="mlSwap" class="wide">Swap origin and destination</button>' +
   select('mlMode', 'Plan by', [['depart', 'Depart after'], ['arrive', 'Arrive by']]) +
   '<div><label for="mlTime">Departure time</label><input id="mlTime" type="time" value="08:00" step="60"></div>' +
   check('mlOvernight', 'Time is after midnight on the following day') +
   select('mlClock', 'Display times as', [['24', '24-hour time'], ['12', 'am/pm']]) +
   check('mlDirect', 'Only show trains serving both stations')
  );
  $('mlFrom').value = '11';
  $('mlTo').value = '0';

  const viz = $('viz');
  let state, keys, selected, hover, hoveredCell;
  $('mlSwap').onclick = () => {
   const from = $('mlFrom').value;
   $('mlFrom').value = $('mlTo').value;
   $('mlTo').value = from;
   run();
  };

  function time(minutes) {
   return formatTime(minutes, state.twelveHour);
  }

  function showTime(minutes) {
   return esc(time(minutes)) + (minutes >= 1440 ? '<sup aria-label="next day">+1</sup>' : '');
  }

  function bounds(row) {
   return row.startsAt === 0 || row.startsAt === stations.length - 1
    ? `To ${stations[row.terminatesAt]}`
    : `${stations[row.startsAt]} to ${stations[row.terminatesAt]}`;
  }

  function readoutMarkup() {
   const {from, to, rows, recommended, target, arriveBy, shown, journeys} = state;
   const row = rows[hover?.index ?? selected];
   const origin = arriveBy ? hover?.station ?? from : from;
   const destination = arriveBy ? to : hover?.station ?? to;
   const title = `${stations[origin]} → ${stations[destination]}`;
   const recommendation = arriveBy ? 'Latest train that arrives by' : 'First train at or after';
   if (!shown) return `<p>Use the timetable to find a train from <strong>${stations[from]}</strong> to <strong>${stations[to]}</strong> ${arriveBy ? 'arriving by' : 'departing at or after'} <strong>${showTime(target)}</strong>.</p>`;
   if (!row) {
    const message = journeys.length
     ? (arriveBy ? 'No train arrives by this time.' : 'No more trains depart after this time.')
     : 'No direct train serves both stations.';
    return `<p><strong>${message}</strong> Choose a row in the timetable or change the time.</p>`;
   }

   const details = trip(row, origin, destination);
   if (!details) {
    let message = 'This station is in the opposite direction from the selected journey.';
    if (origin === destination) message = 'Choose a different station to compare with this stop.';
    else if (row.times[origin] === null || row.times[destination] === null) message = 'This train does not serve both stations.';
    return `<div class="ml-readout-title"><strong>${esc(title)}</strong></div><p>${message}</p>`;
   }
   const margin = arriveBy ? target - details.arrival : details.departure - target;
   const label = arriveBy ? (margin < 0 ? 'Late by' : 'Early by') : (margin < 0 ? 'Departs before' : 'Wait at origin');
   const isRecommended = !hover && selected === recommended?.index;
   return `<div class="ml-readout-title"><strong>${esc(title)}</strong>${isRecommended ? `<span>${recommendation} ${showTime(target)}</span>` : ''}</div>
    <dl class="ml-times">
      <div><dt>Board at ${stations[origin]}</dt><dd>${showTime(details.departure)}</dd></div>
      <div><dt>Arrive at ${stations[destination]}</dt><dd>${showTime(details.arrival)}</dd></div>
      <div><dt>Time on train</dt><dd>${details.duration} min</dd></div>
      <div><dt>${label}</dt><dd${margin < 0 ? ' class="ml-late"' : ''}>${Math.abs(margin)} min</dd></div>
    </dl>`;
  }

  function updateReadout() {
   $('mlReadout').innerHTML = readoutMarkup();
   $('mlStage').querySelectorAll('.ml-preview-row, .ml-preview-stop').forEach(node => {
    node.classList.remove('ml-preview-row', 'ml-preview-stop');
   });
   if (hover) {
    $('mlStage').querySelector(`tr[data-ml-row="${hover.index}"]`)?.classList.add('ml-preview-row');
    $('mlStage').querySelector(`[data-ml-stop="${hover.station}"]`)?.classList.add('ml-preview-stop');
    $('mlGrid').querySelector(`[data-ml-column="${hover.station}"]`)?.classList.add('ml-preview-stop');
    const cell = hoveredCell || $('mlGrid').querySelector(`[data-ml-row="${hover.index}"] [data-ml-cell="${hover.station}"]`);
    if (cell) cell.classList.add('ml-preview-stop');
   }
  }

  function stopMarkup(index) {
   const anchor = state.arriveBy ? state.to : state.from;
   const isAnchor = index === anchor;
   const endpoint = state.arriveBy ? state.from : state.to;
   return `<button type="button" data-ml-stop="${index}"${isAnchor ? ' data-ml-anchor="true"' : ''} aria-pressed="${index === endpoint}"
     aria-label="${stations[index]}${isAnchor ? (state.arriveBy ? ', fixed destination' : ', fixed origin') : ''}">
     <span aria-hidden="true"></span>${stations[index]}</button>`;
  }

  function choose(index, focus = false) {
   selected = index;
   hover = hoveredCell = null;
   run();
   centerService(index, focus);
  }

  function centerService(index, focus = false) {
   const pane = $('mlGrid');
   const row = pane?.querySelector(`tr[data-ml-row="${index}"]`);
   if (!row) return;
   pane.scrollTop = row.offsetTop - Math.max(0, (pane.clientHeight - row.offsetHeight) / 2);
   if (focus) row.querySelector('button').focus({preventScroll:true});
  }

  function render() {
   const {from,to,rows,shown,arriveBy,journeys,day} = state;
   const order = Array.from(stations.keys());
   if (from > to) order.reverse();
   const direct = new Set(journeys.map(row => row.index));
   const onlyDirect = $('mlDirect').checked;
   const currentOption = journeys.findIndex(row => row.index === selected);
   const reference = arriveBy ? 'arrival' : 'departure';
   const earlier = currentOption === -1 ? journeys.findLastIndex(row => row[reference] <= state.target) : currentOption - 1;
   const later = currentOption === -1 ? journeys.findIndex(row => row[reference] >= state.target) : currentOption + 1;
   const tableRows = rows.map((row, index) => {
    if (onlyDirect && !direct.has(index)) return '';
    const active = shown && selected === index;
    return `<tr data-ml-row="${index}"${active ? ' class="ml-active-row"' : ''}>
     <th scope="row"><button type="button" data-ml-service="${index}" aria-label="${esc(`${bounds(row)}, ${time(row.times[row.startsAt])}${row.times[row.startsAt] >= 1440 ? ' next day' : ''}`)}"${shown ? ` aria-pressed="${active}"` : ''}>${showTime(row.times[row.startsAt])}
       <small>${row.startsAt !== 0 && row.startsAt !== stations.length - 1 ? 'From ' + stations[row.startsAt] : 'To ' + stations[row.terminatesAt]}${row.fridayOnly ? ' · Fri night' : ''}</small></button></th>
     ${order.map(station => `<td data-ml-cell="${station}" data-ml-route="${station === from ? 'origin' : station === to ? 'destination' : ''}">${showTime(row.times[station])}</td>`).join('')}
    </tr>`;
   }).join('');
   viz.innerHTML = `<section id="mlStage">
    <div id="mlReadout" class="ml-readout" aria-live="polite">${readoutMarkup()}</div>
    <p class="ml-instruction">${arriveBy ? 'Hover over a station to see when to board for your destination. Select it to change your origin.'
      : 'Hover over a station to check its arrival time on the selected train. Select it to change your destination.'}</p>
    <div id="mlStops" class="ml-stops" aria-label="Station explorer">${order.map(stopMarkup).join('')}</div>
    <div class="ml-toolbar">
     <h3>${from < to ? 'To Mandurah' : 'To Perth'} <small>${days.find(([id]) => id === day)[1]}</small></h3>
     <div class="ml-buttons">
      <button type="button" id="mlFirst"${journeys.length ? '' : ' disabled'}>First</button>
      <button type="button" id="mlEarlier"${earlier >= 0 ? '' : ' disabled'}>Earlier</button>
      <button type="button" id="mlLater"${later >= 0 && later < journeys.length ? '' : ' disabled'}>Later</button>
      <button type="button" id="mlLast"${journeys.length ? '' : ' disabled'}>Last</button>
     </div>
    </div>
    <p id="mlGridHelp" class="ml-instruction">Each row is one train. Hover over a time to trace the row and station. Click a row to keep that train selected.</p>
    <div id="mlGrid" class="ml-grid" tabindex="0" aria-label="Train times" aria-describedby="mlGridHelp">
     <table><thead><tr><th scope="col">Service</th>${order.map(index =>
      `<th scope="col" data-ml-column="${index}" data-ml-route="${index === from ? 'origin' : index === to ? 'destination' : ''}" aria-label="${stations[index]}">${shortNames[index]}</th>`).join('')}</tr></thead>
      <tbody>${tableRows}</tbody></table>
    </div>
    <p class="ml-instruction">— Train does not stop here. <strong>+1</strong> Time is on the following day.</p>
   </section>`;
   const stops = $('mlStops'), grid = $('mlGrid');

   function preview(station, index, cell = null) {
    hover = {index, station};
    hoveredCell = cell;
    updateReadout();
   }

   function clearPreview() {
    hover = hoveredCell = null;
    updateReadout();
   }

   stops.querySelectorAll('button').forEach(button => {
    const index = Number(button.dataset.mlStop);
    const explore = () => {
     if (selected !== null && button.dataset.mlAnchor !== 'true') preview(index, selected);
    };
    button.onpointerenter = button.onfocus = explore;
    button.onpointerleave = button.onblur = clearPreview;
    button.onclick = () => {
     if (button.dataset.mlAnchor === 'true') return;
     $(arriveBy ? 'mlFrom' : 'mlTo').value = String(index);
     run();
     $('mlStops').querySelector(`[data-ml-stop="${index}"]`).focus({preventScroll:true});
    };
   });
   grid.onpointerover = event => {
    const row = event.target.closest('[data-ml-row]');
    if (!row) {
     if (hover) clearPreview();
     return;
    }
    const index = Number(row.dataset.mlRow);
    const cell = event.target.closest('[data-ml-cell]');
    const station = cell ? Number(cell.dataset.mlCell) : (arriveBy ? from : to);
    preview(station, index, cell);
   };
   grid.onpointerleave = clearPreview;
   grid.onclick = event => {
    const row = event.target.closest('[data-ml-row]');
    if (row) choose(Number(row.dataset.mlRow), Boolean(event.target.closest('button')) && event.detail === 0);
   };
   const step = (id, option) => {
    $(id).onclick = () => {
     choose(journeys[option].index);
     const button = $(id);
     if (button.disabled) $('mlGrid').focus({preventScroll:true});
     else button.focus({preventScroll:true});
    };
   };
   step('mlFirst', 0);
   step('mlEarlier', earlier);
   step('mlLater', later);
   step('mlLast', journeys.length - 1);
  }

  update = () => {
   const from = value('mlFrom'), to = value('mlTo');
   const clockValue = $('mlTime').value;
   const arriveBy = $('mlMode').value === 'arrive';
   const day = $('mlDay').value;
   const shown = $('reveal').checked;
   $('mlTime').labels[0].textContent = arriveBy ? 'Arrival deadline' : 'Earliest departure';
   formula('');
   legend([]);
   results([]);
   note('Source: Transperth Train Timetable 2, Mandurah Line, effective 30 November 2025. Published schedule for classroom use. For current trips, use Transperth. Christmas Day services may differ.');
   if (from === to) throw Error('Choose different origin and destination stations.');
   if (!clockValue) throw Error('Enter a time to find a train.');
   const target = ClassroomModels.clock(clockValue) + ($('mlOvernight').checked ? 1440 : 0);
   const nextKeys = [from,to,day,target,arriveBy,shown].join(',');
   const changed = keys !== nextKeys;
   if (changed) {
    selected = null;
    keys = nextKeys;
   }
   const timetable = findJourneys(day, from, to, target, arriveBy);
   state = {from,to,day,target,arriveBy,shown,twelveHour:$('mlClock').value === '12',...timetable};
   if (shown && (changed || ($('mlDirect').checked && !state.journeys.some(row => row.index === selected)))) {
    selected = state.recommended?.index ?? null;
   }
   hover = hoveredCell = null;
   const oldTop = $('mlGrid')?.scrollTop ?? 0;
   const oldLeft = $('mlGrid')?.scrollLeft ?? 0;
   render();
   $('mlGrid').scrollLeft = oldLeft;
   if (changed && shown && selected !== null) centerService(selected);
   else $('mlGrid').scrollTop = oldTop;
   table(['Origin','Destination','Departure','Arrival','Time on train (min)'], state.journeys.map(row =>
    [stations[from], stations[to], showTimeText(row.departure), showTimeText(row.arrival), row.duration]));
  };

  function showTimeText(minutes) {
   return time(minutes) + (minutes >= 1440 ? ' (+1 day)' : '');
  }
 }
};
})();
