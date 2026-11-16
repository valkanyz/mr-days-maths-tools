(() => {
'use strict';

const {clock, time, timetableRows, journeys} = ClassroomModels;
const practice = `Walk to bus stop,Rockingham Library,Library bus stop,6,,Walk
Bus 24,Library bus stop,Arts Centre stop,09:34,10:05,Bus
Bus 24,Library bus stop,Arts Centre stop,09:49,10:22,Bus
Bus 24,Library bus stop,Arts Centre stop,10:04,10:37,Bus
Walk to rehearsal,Arts Centre stop,Arts Centre,9,,Walk
Walk to station,Rockingham Library,Rockingham Station,14,,Walk
Train,Rockingham Station,Event Station,09:46,10:00,Train
Train,Rockingham Station,Event Station,10:01,10:15,Train
Train,Rockingham Station,Event Station,10:16,10:30,Train
Walk to rehearsal,Event Station,Arts Centre,8,,Walk
Cycle to rehearsal,Rockingham Library,Arts Centre,37,,Bike`;
const connections = `Bus 1,Lakelands,Station,08:05,08:17,Bus
Bus 2,Lakelands,Station,08:20,08:32,Bus
Train 1,Station,City,08:22,09:12,Train
Train 2,Station,City,08:37,09:27,Train
Shuttle 1,City,Museum,09:20,09:35,Shuttle
Shuttle 2,City,Museum,09:35,09:50,Shuttle
Express,Lakelands,Museum,08:15,09:45,Bus`;

const colours = {Walk:'#267351', Bike:'#8450a8', Bus:'#245da5', Train:'#227786', Shuttle:'#834989', Ferry:'#33618d', Tram:'#5f6933', transfer:'#987020', event:'#ad541d'};
const colour = mode => Object.hasOwn(colours, mode) ? colours[mode] : '#425275';
const minuteText = diff => diff === 0 ? 'Exactly on time' : `${Math.abs(diff)} min ${diff > 0 ? 'late' : 'early'}`;
const describe = route => route.legs.filter(leg => leg.mode !== 'Walk').map(leg =>
 leg.flexible ? leg.mode : `${leg.service} ${time(leg.dep)}`
).join(' + ') || 'Walk';

function parts(route) {
 const list = [];
 let at = route.start;
 for (const leg of route.legs) {
  if (leg.dep > at) list.push({mode:'transfer', label:at === route.start ? 'Initial wait' : 'Transfer wait', dep:at, arr:leg.dep});
  list.push({...leg, label:`${leg.service} · ${leg.from} to ${leg.to}`});
  at = leg.arr;
 }
 if (route.eventWait) list.push({mode:'event', label:'Wait at destination', dep:at, arr:at + route.eventWait});
 return list;
}

function timeline(routes, deadline, selected, byDeadline) {
 const low = Math.min(deadline, ...routes.map(route => route.start));
 const high = Math.max(deadline, ...routes.map(route => route.arrival), low + 1);
 const tickStep = [1, 2, 5, 10, 15, 30, 60, 120, 240, 480].find(step => (high - low) / step <= 8) || 720;
 const min = Math.floor(low / tickStep) * tickStep;
 const max = Math.ceil(high / tickStep) * tickStep;
 const width = 840, left = 184, right = 806;
 const x = t => left + (t - min) * (right - left) / (max - min);
 const bottom = 64 + routes.length * 49;
 let diagram = '';
 for (let t = min; t <= max; t += tickStep) {
  diagram += `<path d="M${x(t)} 42V${bottom}" stroke="#dfd9e9"/><text x="${x(t)}" y="31" text-anchor="middle">${esc(time(t))}</text>`;
 }
 diagram += `<path d="M${x(deadline)} 49V${bottom}" stroke="#ad541d" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="${x(deadline)}" y="12" text-anchor="${deadline === max ? 'end' : 'middle'}" fill="#803b16">${byDeadline ? 'Event' : 'Deadline'} ${esc(time(deadline))}</text>`;
 routes.forEach((route, index) => {
  const y = 66 + index * 49;
  const name = route.modes.length > 20 ? route.modes.slice(0, 19) + '…' : route.modes;
  diagram += `<text x="10" y="${y + 3}" font-weight="${route === selected ? 750 : 550}">${esc(name)}</text>
   <text x="10" y="${y + 19}" fill="#60566e">${esc(time(route.departure))} → ${esc(time(route.arrival))} · ${route.duration} min</text>`;
  for (const part of parts(route)) {
   const label = `${part.label} · ${time(part.dep)}–${time(part.arr)} · ${part.arr - part.dep} min`;
   diagram += `<path d="M${x(part.dep)} ${y}H${x(part.arr)}" stroke="${colour(part.mode)}" stroke-width="13"
    ${part.mode === 'transfer' ? 'stroke-dasharray="4 3"' : part.mode === 'event' ? 'stroke-dasharray="2 3"' : ''}><title>${esc(label)}</title></path>`;
  }
  diagram += `<circle cx="${x(route.arrival)}" cy="${y}" r="4" fill="#fff" stroke="#342049" stroke-width="2"/>`;
 });
 diagram += `<path id="jpCursor" d="M${x(selected.start)} 43V${bottom}" stroke="#342049" stroke-width="2" hidden/>`;
 return {
  html:`<div class="jp-scroll"><svg class="jp-chart" viewBox="0 0 ${width} ${bottom + 10}" role="img" aria-label="Journey comparison on a shared time scale">${diagram}</svg></div>`,
  x, bottom
 };
}

const headers = ['Service', 'From', 'To', 'Departure / duration', 'Arrival', 'Mode'];
const transport = ['Bus', 'Train', 'Bike', 'Walk', 'Service', 'Shuttle', 'Ferry', 'Tram'];
function sourceTable(rows, editing, active) {
 return `<div class="jp-scroll"><table class="jp-source"><thead><tr>${headers.map(label => `<th scope="col">${label}</th>`).join('')}${editing ? '<th scope="col">Remove</th>' : ''}</tr></thead>
  <tbody>${rows.map(([name, from, to, start, end, mode = 'Service'], index) => {
   const flexible = mode === 'Walk' || mode === 'Bike';
   const cells = [name, from, to, start, end, mode];
   const choices = transport.includes(mode) ? transport : [...transport, mode];
   return `<tr${active === index ? ' class="jp-active"' : ''}>${cells.map((cell = '', column) => {
    if (editing) {
     const label = esc(`${headers[column]}, row ${index + 1}`);
     if (column === 5) return `<td><select aria-label="${label}" data-jp-cell="${index},${column}">${choices.map(choice =>
      `<option${choice === mode ? ' selected' : ''}>${esc(choice)}</option>`).join('')}</select></td>`;
     return `<td><input aria-label="${label}" data-jp-cell="${index},${column}" value="${esc(cell)}" ${flexible && column === 4 ? 'disabled' : ''}></td>`;
    }
    if (column === 0) return `<td><button type="button" data-jp-trip="${index}" aria-pressed="${active === index}" aria-label="${esc(`Trace ${name}, ${flexible ? start + ' minutes' : start}`)}">${esc(name)}</button></td>`;
    if (column === 3 && flexible) return `<td>${esc(start)} min</td>`;
    return `<td>${flexible && column === 4 ? '—' : esc(cell)}</td>`;
   }).join('')}${editing ? `<td><button type="button" data-jp-remove="${index}" aria-label="Remove row ${index + 1}">Remove</button></td>` : ''}</tr>`;
  }).join('')}</tbody></table></div>`;
}

labs.journeys = {
 title:'Timetable & Journey Planner',
 tag:'YEARS 7–11 · ESSENTIAL',
 subtitle:'Read timetables and compare journeys',
 setup() {
  const field = (id, label) => `<div><label for="${id}">${label}</label><input id="${id}" autocomplete="off"></div>`;
  controls(select('jpPreset','Timetable',[['practice','Get to rehearsal'],['connections','Lakelands to the museum']]) +
   select('jpMode','Planning mode',[['arrive','Arrive by'],['depart','Depart after']]) +
   field('jpFrom','Start') + field('jpTo','Destination') +
   field('jpReady','Ready to leave (HH:MM)') + field('jpDeadline','Arrive by (HH:MM)') +
   input('jpTransfer','Minimum time between services (min)',0,0,120,1) +
   '<div style="display:none"><input type="hidden" id="jpData"></div>');
  let rows, selectedTrip, selectedKey, editing, pasteOpen, pasteValue, pasteError, diagram, animation = 0;
  let preset, modelKey, model;
  const viz = $('viz');
  const renderTimetable = () => {
   $('jpSource').innerHTML = sourceTable(rows, editing, selectedTrip);
   $('jpSource').querySelectorAll('[data-jp-trip]').forEach(button => {
    button.onclick = () => {
     selectedTrip = Number(button.dataset.jpTrip);
     selectedKey = null;
     run();
     $('jpSource').querySelector(`[data-jp-trip="${selectedTrip}"]`)?.focus({preventScroll:true});
    };
   });
   $('jpSource').querySelectorAll('[data-jp-cell]').forEach(cell => {
    cell.oninput = () => {
     const [row, column] = cell.dataset.jpCell.split(',').map(Number);
     rows[row][column] = cell.value.trim();
     if (column === 5) {
      const arrival = $('jpSource').querySelector(`[data-jp-cell="${row},4"]`);
      arrival.disabled = cell.value === 'Walk' || cell.value === 'Bike';
     }
    };
   });
   $('jpSource').querySelectorAll('[data-jp-remove]').forEach(button => {
    button.onclick = () => {
     rows.splice(Number(button.dataset.jpRemove), 1);
     renderTimetable();
    };
   });
  };

  function loadPreset() {
   preset = $('jpPreset').value;
   const example = preset === 'practice';
   rows = timetableRows(example ? practice : connections);
   $('jpData').value = JSON.stringify(rows);
   $('jpMode').value = example ? 'arrive' : 'depart';
   $('jpFrom').value = example ? 'Rockingham Library' : 'Lakelands';
   $('jpTo').value = example ? 'Arts Centre' : 'Museum';
   $('jpReady').value = example ? '09:00' : '08:00';
   $('jpDeadline').value = example ? '10:30' : '09:40';
   $('jpTransfer').value = example ? '0' : '5';
   selectedTrip = selectedKey = modelKey = null;
   editing = pasteOpen = false;
   pasteValue = pasteError = '';
  }

  function readPlan() {
   const byDeadline = $('jpMode').value === 'arrive';
   const ready = byDeadline ? 0 : clock($('jpReady').value);
   const deadline = clock($('jpDeadline').value);
   const from = $('jpFrom').value.trim(), to = $('jpTo').value.trim();
   const transfer = value('jpTransfer');
   const nextKey = JSON.stringify([rows, from, to, ready, transfer, byDeadline, deadline]);
   if (nextKey !== modelKey) {
    model = journeys(rows, from, to, ready, transfer, byDeadline ? deadline : null);
    modelKey = nextKey;
   }
   return {byDeadline, deadline, routes:model.routes};
  }

  function renderPlan({routes, byDeadline, deadline}) {
   const shown = $('reveal').checked;
   const trace = selectedTrip === null ? routes : routes.filter(route => route.legs.some(leg => leg.id === selectedTrip));
   const selected = trace.find(route => route.key === selectedKey) || trace[0];
   const stage = $('jpPlan');
   if (!shown) {
    stage.innerHTML = `<p>Choose a service in the timetable. Work out whether it can get you there by ${esc(time(deadline))}, then reveal the results to check.</p>`;
    return;
   }
   if (!routes.length) {
    stage.textContent = 'No connected journeys. Check the stops, times and transfer allowance.';
    return;
   }
   const best = new Map();
   for (const route of routes) {
    if (!best.has(route.modes)) best.set(route.modes, route);
    if (best.size === 5) break;
   }
   const displayed = selected && ![...best.values()].includes(selected) ? [...best.values(), selected] : [...best.values()];
   diagram = timeline(displayed, deadline, selected || displayed[0], byDeadline);
   const routeOptions = trace.map(route => [route.key, `${describe(route)} · ${time(route.departure)}–${time(route.arrival)}`]);
   const detail = selected ? parts(selected).map(part => [part.label, time(part.dep), time(part.arr), part.arr - part.dep]) : [];
   const modes = [...new Set(displayed.flatMap(route => route.legs.map(leg => leg.mode)))];
   const key = [...modes.map(mode => [mode, mode]), ['transfer', 'Initial / transfer wait']];
   if (byDeadline) key.push(['event', 'Wait at destination']);
   stage.innerHTML = diagram.html + `<p class="jp-key">
    ${key.map(([mode, label]) => `<span style="--jp-colour:${colour(mode)}">${esc(label)}</span>`).join('')}</p>
    ${selectedTrip === null ? '' : '<button type="button" id="jpClearTrip">Show all journeys</button>'}
    ${selected ? `<div class="jp-route-bar">${select('jpRoute','Journey to inspect',routeOptions.map(([key,label]) => [esc(key),esc(label)]))}
      <button type="button" id="jpPlay">Play journey</button><output id="jpClock"></output></div>
      <label for="jpProgress">Journey progress</label><input type="range" id="jpProgress" min="0" max="100" value="0">
      <p><strong>${selected.duration} min</strong> · ${esc(minuteText(selected.arrival - deadline))}${byDeadline && selected.eventWait ? ` · ${selected.eventWait} min at destination` : ''}</p>
      <div class="jp-scroll"><table><thead><tr><th scope="col">Leg</th><th scope="col">Start</th><th scope="col">Finish</th><th scope="col">Minutes</th></tr></thead>
      <tbody>${detail.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
     : '<p>This service does not connect the selected start and destination under the current settings.</p>'}`;
   if ($('jpClearTrip')) $('jpClearTrip').onclick = () => {
    selectedTrip = selectedKey = null;
    run();
    $('jpRoute')?.focus();
   };
   if (selected) {
    $('jpRoute').value = selected.key;
    $('jpRoute').onchange = event => {
     selectedKey = event.target.value;
     run();
     $('jpRoute').focus();
    };
    const cursor = $('jpCursor'), output = $('jpClock'), button = $('jpPlay'), progress = $('jpProgress');
    const duration = selected.arrival + selected.eventWait - selected.start;
    const moveCursor = fraction => {
     const instant = selected.start + duration * fraction;
     cursor.removeAttribute('hidden');
     cursor.setAttribute('d', `M${diagram.x(instant)} 43V${diagram.bottom}`);
     output.textContent = time(Math.round(instant));
    };
    const stop = () => {
     cancelAnimationFrame(animation);
     animation = 0;
     button.textContent = +progress.value === 100 ? 'Replay journey' : 'Play journey';
    };
    progress.oninput = () => {
     stop();
     moveCursor(+progress.value / 100);
    };
    button.onclick = () => {
     if (animation) {
      stop();
      return;
     }
     if (+progress.value === 100) progress.value = 0;
     const initial = +progress.value / 100;
     let start;
     button.textContent = 'Pause journey';
     const tick = timestamp => {
      if (current !== 'journeys' || !cursor.isConnected) { animation = 0; return; }
      start ??= timestamp;
      const fraction = Math.min(1, initial + (timestamp - start) / 6000);
      progress.value = Math.round(100 * fraction);
      moveCursor(fraction);
      if (fraction < 1) animation = requestAnimationFrame(tick);
      else stop();
     };
     animation = requestAnimationFrame(tick);
    };
   }
   const onTime = routes.filter(route => route.arrival <= deadline).length;
   results([['On time', onTime], ['Late', routes.length - onTime]]);
   table(['Mode', 'Services', 'Leave', 'Arrive', 'Travel (min)', 'Waiting before arrival (min)', 'Waiting at destination (min)', 'Elapsed (min)', 'Deadline'],
    routes.map(route => [route.modes, describe(route), time(route.departure), time(route.arrival), route.travel, route.waiting, route.eventWait,
     route.duration, minuteText(route.arrival - deadline)]));
  }

  loadPreset();
  $('controls').restoreState = items => {
   if (items) {
    const saved = new Map(items);
    $('jpPreset').value = saved.get('jpPreset') || 'connections';
    if ($('jpPreset').value) loadPreset();
    return;
   }
   const data = $('jpData').value;
   if (data.startsWith('[[') || data === '[]') {
    try {
     const saved = JSON.parse(data);
     if (Array.isArray(saved) && saved.every(row => Array.isArray(row) && row.every(cell => typeof cell === 'string'))) {
      rows = saved;
     }
    } catch {
     // Keep the preset when a saved timetable cannot be parsed.
    }
   } else if (data) rows = timetableRows(data);
   $('jpData').value = JSON.stringify(rows);
  };
  update = () => {
   if ($('jpPreset').value !== preset) loadPreset();
   cancelAnimationFrame(animation);
   animation = 0;
   showControl('jpReady', $('jpMode').value === 'depart');
   formula(preset === 'practice' ? 'Plan a trip from Rockingham Library to an Arts Centre rehearsal.' : 'Connect the services from Lakelands to the museum.');
   legend([]);
   results([]);
   note('Fictional teaching timetable. Use 24:00 onward for times on the following day. In Arrive by mode, elapsed time includes any wait at the destination before the event.');
   viz.innerHTML = `<section class="jp-planner">
    <div id="jpPlan"></div>
    <div class="jp-tools"><h3>Timetable</h3><button type="button" id="jpEdit" aria-pressed="${editing}">${editing ? 'Apply edits' : 'Edit timetable'}</button>
    <button type="button" id="jpPaste" aria-expanded="${pasteOpen}">Paste rows</button></div>
    <div id="jpSource"></div>
    ${editing ? '<p>For a Walk or Bike row, enter minutes in the departure column and leave arrival blank.</p><button type="button" id="jpAdd">Add row</button>' : ''}
    ${pasteOpen ? `<div class="jp-paste"><label for="jpPasteData">Service, from, to, departure, arrival, mode</label>
    <textarea id="jpPasteData" rows="5">${esc(pasteValue)}</textarea><p>Paste tab-separated or comma-separated rows with no header. For Walk and Bike, put minutes in the departure column and leave arrival blank.</p>
    <button type="button" id="jpApplyPaste">Replace timetable</button><p role="alert">${esc(pasteError)}</p></div>` : ''}</section>`;
   renderTimetable();
   $('jpEdit').onclick = () => {
    editing = !editing;
    if (!editing) $('jpData').value = JSON.stringify(rows);
    selectedTrip = selectedKey = null;
    run();
    $('jpEdit').focus();
   };
   $('jpPaste').onclick = () => {
    pasteOpen = !pasteOpen;
    run();
    $(pasteOpen ? 'jpPasteData' : 'jpPaste').focus();
   };
   if (editing) $('jpAdd').onclick = () => {
    if (rows.length >= 100) return;
    rows.push(['', '', '', '', '', 'Bus']);
    renderTimetable();
    $('jpSource').querySelector(`[data-jp-cell="${rows.length - 1},0"]`).focus();
   };
   if (pasteOpen) {
    $('jpPasteData').oninput = event => { pasteValue = event.target.value; };
    $('jpApplyPaste').onclick = () => {
     const replacement = timetableRows(pasteValue);
     try {
      if (!replacement.length) throw Error('Paste at least one timetable row.');
      journeys(replacement, $('jpFrom').value.trim(), $('jpTo').value.trim(), 0, 0);
     } catch (error) {
      pasteError = error.message;
      run();
      $('jpPasteData').focus();
      return;
     }
     rows = replacement;
     $('jpData').value = JSON.stringify(rows);
     selectedTrip = selectedKey = null;
     pasteOpen = editing = false;
     pasteValue = pasteError = '';
     run();
     $('jpPaste').focus();
    };
   }
   if (editing) {
    $('jpPlan').textContent = 'Apply the timetable edits to update the journeys.';
    return;
   }
   try {
    renderPlan(readPlan());
   } catch (error) {
    $('jpPlan').textContent = error.message;
   }
  };
 }
};
})();
