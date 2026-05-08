const seed = {
  athlete: {
    name: 'Tommaso',
    primaryGoal: '70.3 performance around 5:00–5:15 while staying lean and muscular',
    targets: { raceTimeMinutesLow: 300, raceTimeMinutesHigh: 315, weeklyCompletionPct: 90 }
  },
  weeklyStructure: [
    ['Monday', 'Chest + Triceps + Ride'],
    ['Tuesday', 'Legs + Neuromuscular Ride'],
    ['Wednesday', 'Run + Swim, no gym'],
    ['Thursday', 'Back + Biceps + Ride'],
    ['Friday', 'Shoulders + Run'],
    ['Saturday', 'Long Ride + Brick'],
    ['Sunday', 'Long Run']
  ],
  sessions: [
    { date: 'May 2', type: 'bike', label: 'Long ride', durationMin: 143.02, distanceKm: 73.11, calories: 1084, avgPowerW: 151, avgHr: 130 },
    { date: 'May 2', type: 'run', label: 'Brick run', durationMin: 30.13, distanceKm: 5.47, paceSecPerKm: 331, avgHr: 140 },
    { date: 'Apr 30', type: 'run', label: 'Wednesday run', durationMin: 59.57, distanceKm: 10.40, paceSecPerKm: 344, avgHr: 137, calories: 776 },
    { date: 'Apr 29', type: 'bike', label: 'Neuromuscular ride', durationMin: 60, avgPowerW: 161, maxPowerW: 606 },
    { date: 'May 1', type: 'bike', label: 'Sofia ride', durationMin: 60, avgPowerW: 144, speedMph: 18.3 }
  ],
  strengthProgression: [
    ['DB Shoulder Press', '45x10/10/10', '50x8/8/7', '50x8/8/8'],
    ['Lat Pulldown', '160x8/8', '160x8/9', '160x9/9'],
    ['Hammer Curl', '40x10/10/8', '40x10/10/10', '45x8'],
    ['DB Curl', '27.5x10/10/8', '27.5x10/10/10', '30x8'],
    ['Rear Delt Fly', '90x12x3', '100x12/10', '100x12/12/10'],
    ['Leg Curl', '110x10x2', '120x10x2', '120x12/10/10']
  ],
  nutritionPreferences: ['Siggi yogurt + oats + fruit + egg whites + whey', 'banana / pineapple / berries', 'espresso mixed into yogurt', 'rice waffle + jam around workouts', 'low-fat correction after high-fat meals']
};

const missing = [
  ['Race date + course', 'Needed to calculate required weekly ramp and split targets.'],
  ['Body profile', 'Height, current weight, target weight/look, body fat or photo cadence.'],
  ['Thresholds', 'FTP, run threshold pace, swim CSS, HR zones, max HR.'],
  ['Nutrition targets', 'Maintenance kcal, protein grams, carb/fat ranges, hydration/sodium.'],
  ['Recovery feed', 'Sleep, HRV, resting HR, soreness/readiness, injury flags.'],
  ['Data integrations', 'Garmin/Strava/Apple Health + nutrition tracker/source of truth.']
];

const colors = { bike: '#72e0a8', run: '#6bb7ff', swim: '#b79cff', strength: '#ffc857' };
const fmt = n => Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—';
const pace = sec => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}/km`;

function calculateKpis() {
  const totalMin = seed.sessions.reduce((s, x) => s + (x.durationMin || 0), 0);
  const bikeMin = seed.sessions.filter(x => x.type === 'bike').reduce((s, x) => s + x.durationMin, 0);
  const runKm = seed.sessions.filter(x => x.type === 'run').reduce((s, x) => s + (x.distanceKm || 0), 0);
  const avgBikePower = seed.sessions.filter(x => x.avgPowerW).reduce((s, x, _, arr) => s + x.avgPowerW / arr.length, 0);
  const bestRunPace = Math.min(...seed.sessions.filter(x => x.paceSecPerKm).map(x => x.paceSecPerKm));
  return [
    { label: 'Known training load', value: `${fmt(totalMin)}m`, delta: 'Baseline only · needs weekly history', status: 'warn', spark: [30,60,60,143,60] },
    { label: 'Bike evidence', value: `${fmt(bikeMin)}m`, delta: `${fmt(avgBikePower)}W avg across known rides`, status: 'good', spark: [144,161,151] },
    { label: 'Run evidence', value: `${fmt(runKm)}km`, delta: `Best known pace ${pace(bestRunPace)}`, status: 'good', spark: [344,331] },
    { label: 'Goal delta', value: 'Missing', delta: 'Race date + current estimate required', status: 'missing', spark: [10,20,26,35,44] },
    { label: 'Strength momentum', value: '6 lifts', delta: 'Shoulders / back / curls / hamstrings progressing', status: 'good', spark: [2,3,4,5,6] },
    { label: 'Nutrition precision', value: 'Partial', delta: 'Preferences known; kcal/macros/bodyweight missing', status: 'warn', spark: [30,38,42,45] },
    { label: 'Recovery score', value: 'Missing', delta: 'No sleep, HRV, RHR, soreness feed yet', status: 'missing', spark: [20,20,20] },
    { label: 'Data quality', value: '42%', delta: 'Good screenshots for workouts; weak body/nutrition/recovery', status: 'warn', spark: [20,24,35,42] }
  ];
}

function sparkline(values) {
  const max = Math.max(...values), min = Math.min(...values), w = 140, h = 34;
  const pts = values.map((v, i) => {
    const x = values.length === 1 ? w : i * (w / (values.length - 1));
    const y = h - ((v - min) / (max - min || 1)) * (h - 6) - 3;
    return `${x},${y}`;
  }).join(' ');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="3" opacity=".85"/><line x1="0" y1="${h-2}" x2="${w}" y2="${h-2}" stroke="currentColor" opacity=".15"/></svg>`;
}

function renderKpis() {
  document.getElementById('kpiGrid').innerHTML = calculateKpis().map(k => `
    <article class="kpi ${k.status}">
      <div><div class="label">${k.label}</div><div class="value">${k.value}</div><div class="delta">${k.delta}</div></div>
      ${sparkline(k.spark)}
    </article>`).join('');
}

function renderChart() {
  const canvas = document.getElementById('trainingChart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = 260 * dpr; ctx.scale(dpr, dpr);
  const w = rect.width, h = 260, pad = 42;
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1;
  for (let i=0;i<5;i++){ const y=pad+i*(h-pad*1.5)/4; ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(w-20,y); ctx.stroke(); }
  const max = Math.max(...seed.sessions.map(s => s.durationMin));
  const bw = (w - pad - 30) / seed.sessions.length * .62;
  seed.sessions.forEach((s,i)=>{
    const x = pad + i * ((w - pad - 30) / seed.sessions.length) + 8;
    const barH = (s.durationMin / max) * (h - pad*1.8);
    const y = h - pad - barH;
    ctx.fillStyle = colors[s.type] || '#fff';
    roundRect(ctx,x,y,bw,barH,9); ctx.fill();
    ctx.fillStyle = '#a7b8ad'; ctx.font = '12px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(s.label.split(' ')[0], x + bw/2, h - 18);
    ctx.save(); ctx.translate(x+bw/2,y-8); ctx.rotate(-Math.PI/6); ctx.fillText(`${Math.round(s.durationMin)}m`,0,0); ctx.restore();
  });
  document.getElementById('trainingLegend').innerHTML = Object.entries(colors).slice(0,2).map(([k,c])=>`<span style="--c:${c}">${k}</span>`).join('');
}

function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}

function renderBars() {
  const counts = seed.sessions.reduce((acc,s)=>{acc[s.type]=(acc[s.type]||0)+1;return acc;},{});
  const max = Math.max(...Object.values(counts), 1);
  const rows = ['bike','run','swim','strength'].map(type => {
    const n = counts[type] || 0;
    return `<div class="bar-row"><div class="bar-meta"><b>${type}</b><span>${n} known entries</span></div><div class="bar"><span style="--c:${colors[type]};--w:${(n/max)*100}%"></span></div></div>`;
  });
  document.getElementById('disciplineBars').innerHTML = rows.join('');
}

function renderStrength() {
  document.getElementById('strengthTable').innerHTML = seed.strengthProgression.map(([ex, prev, cur, target]) => `
    <div class="lift"><strong>${ex}</strong><span>Previous: ${prev}</span><span>Current: ${cur}</span><span>Next: ${target}</span></div>`).join('');
}

function renderMissing() {
  document.getElementById('missingData').innerHTML = missing.map(([title, why]) => `<div class="check"><span>□</span><span><b>${title}</b><br>${why}</span></div>`).join('');
}

function renderPlan() {
  document.getElementById('weeklyPlan').innerHTML = seed.weeklyStructure.map(([d,p]) => `<div class="day"><b>${d}</b><span>${p}</span></div>`).join('');
  document.getElementById('nutritionPrefs').innerHTML = seed.nutritionPreferences.map(x => `<span class="chip">${x}</span>`).join('');
}

renderKpis(); renderChart(); renderBars(); renderStrength(); renderMissing(); renderPlan();
window.addEventListener('resize', renderChart);
