const STORE_KEY='athlete_os_activity_v04';
const IMAGE_KEY='athlete_os_images_v04';
const MEALS='athlete_os_meal_approvals_v05';
const base={sets:[
{id:'s1',t:'07:42',day:'2026-05-08',source:'manual',sport:'strength',type:'set',ex:'DB Shoulder Press',set:1,w:50,reps:8,rpe:8,rest:'2:00',note:'clean'},
{id:'s2',t:'07:46',day:'2026-05-08',source:'manual',sport:'strength',type:'set',ex:'DB Shoulder Press',set:2,w:50,reps:8,rpe:8.5,rest:'2:15',note:'slower lockout'},
{id:'s3',t:'07:51',day:'2026-05-08',source:'manual',sport:'strength',type:'set',ex:'DB Shoulder Press',set:3,w:50,reps:7,rpe:9,rest:'2:30',note:'hold 50 until 8/8/8'},
{id:'s4',t:'08:02',day:'2026-05-08',source:'manual',sport:'strength',type:'set',ex:'Cable Lateral Raise',set:1,w:25,reps:12,rpe:8,rest:'1:15',note:'strict'},
{id:'s5',t:'08:11',day:'2026-05-08',source:'manual',sport:'strength',type:'set',ex:'Rear Delt Fly',set:1,w:100,reps:12,rpe:8,rest:'1:30',note:'progress'},
{id:'g1',t:'20:40',day:'2026-05-02',source:'garmin',source_id:'garmin_run_demo',locked:true,deletable:false,sport:'run',type:'activity',ex:'Garmin brick run',set:1,w:0,reps:30,rpe:7,rest:'—',note:'5.47km @ 5:31/km · locked device record'},
{id:'g2',t:'06:50',day:'2026-05-06',source:'garmin',source_id:'garmin_swim_demo',locked:true,deletable:false,sport:'swim',type:'activity',ex:'Garmin swim technique',set:1,w:0,reps:42,rpe:6,rest:'—',note:'pool swim placeholder · locked device record'},
{id:'p1',t:'18:10',day:'2026-05-02',source:'peloton',source_id:'peloton_ride_demo',locked:true,deletable:false,sport:'bike',type:'activity',ex:'Peloton endurance ride',set:1,w:151,reps:45,rpe:6,rest:'—',note:'power/output from Peloton · locked device record'},
{id:'n1',t:'21:10',day:'2026-05-08',source:'manual',sport:'nutrition',type:'nutrition',ex:'Protein',value:'160g target',rpe:'',note:'bulk compliance input needed'}],
history:{'DB Shoulder Press':[{d:'04-21',load:45,reps:10,est:60},{d:'04-28',load:45,reps:10,est:60},{d:'05-08',load:50,reps:8,est:63.3}], 'Rear Delt Fly':[{d:'04-22',load:90,reps:12,est:126},{d:'05-01',load:100,reps:10,est:133},{d:'05-08',load:100,reps:12,est:140}], 'Cable Lateral Raise':[{d:'04-22',load:20,reps:15,est:30},{d:'05-01',load:25,reps:10,est:33},{d:'05-08',load:25,reps:12,est:35}], 'Lat Pulldown':[{d:'04-24',load:150,reps:10,est:200},{d:'05-01',load:160,reps:8,est:203},{d:'05-07',load:160,reps:9,est:208}], 'Leg Curl':[{d:'04-23',load:110,reps:10,est:147},{d:'05-05',load:120,reps:10,est:160}]},
forecast:[{ex:'DB Shoulder Press',why:'Last set failed at 7 reps but first two sets stable.',next:'50 lb × 8 / 8 / 8',len:'12–14 min',rule:'If set 3 <8 again: keep 50, add 30s rest.'},{ex:'Rear Delt Fly',why:'100×12/12/10 shows strong adaptation.',next:'100 lb × 12 / 12 / 11+',len:'7–9 min',rule:'Do not jump to 110 until 12/12/12.'},{ex:'Cable Lateral Raise',why:'Side delts need quality volume without elbow fatigue.',next:'25 lb × 13 / 12 / 12',len:'6–8 min',rule:'Tempo 2 sec down, no body English.'},{ex:'Bike aerobic',why:'Protect strength gains while building the engine.',next:'Z2 75–90 min @ 145–155W',len:'75–90 min',rule:'Fuel 40–60g carbs/hour.'},{ex:'Run off bike',why:'Brick pace known; avoid overloading legs after heavy lower body.',next:'20–30 min easy brick @ 5:45–6:05/km',len:'20–30 min',rule:'Only progress if calves/hamstrings green.'}],
missing:['Intervals API key','bodyweight daily','protein/kcal daily','sleep + HRV','RPE/RIR per set','race date + course','progress photos: front/side/back','thresholds: FTP, run LT pace, swim CSS']};
const $=id=>document.getElementById(id);const q=s=>document.querySelector(s);let view='gym-input';
const lockedSources=new Set(['garmin','peloton','intervals','api']);
const athleteProfile={age:46,heightCm:177,weightKg:75.75,goal:'Muscular triathlon athlete: swim/bike/run engine + visible athletic physique; cut fat without becoming endurance-skinny.',meals:'3 meals + 1 snack/day',coachSop:'Self-critical coach: correct the athlete when an ask conflicts with the goal.'};
const baseMetabolicBurn=1640, restDayBurn=1970;
function deficitRuleForDay(trainingBurn){
  if(trainingBurn===0) return {type:'full rest / no exercise',deficit:'350–500 kcal',target:`${restDayBurn-500}–${restDayBurn-350} kcal`,why:'best day to create fat loss without compromising session quality'};
  if(trainingBurn<400) return {type:'light training',deficit:'~350 kcal',target:`burn − 350 kcal`,why:'small fuel need, still protect recovery'};
  if(trainingBurn<900) return {type:'normal training',deficit:'250–350 kcal',target:`burn − 250/350 kcal`,why:'fuel swim/bike/run and preserve muscle'};
  return {type:'long / brick / hard day',deficit:'0–250 kcal',target:'maintenance to burn − 250 kcal',why:'performance and adaptation first; under-fueling hurts next sessions'};
}
const bulkSurplus=0;

const weekPlan={1:['Incline DB Press','Flat DB Press','Cable Fly low-to-high','Chest Fly high-to-low','Triceps Pushdown','Overhead Tricep Extension','Single-Arm Cross-Body Pushdown'],2:['Bulgarian Split Squat','Hack Squat','Leg Curl','Glute Drive','Calf Raise'],3:['Swim technique','Z2 bike','Mobility'],4:['Lat Pulldown','Seated Row','Straight-Arm Pulldown','Hammer Curl','Seated DB Curl','Cross-Body Hammer Curl'],5:['DB Shoulder Press','DB Lateral Raise','Cable Lateral Raise','Rear Delt Fly','Face Pull','Single-Arm Rear Shoulder Cable Pull'],6:['Long bike / brick run'],0:['Recovery walk','Mobility','Progress photos']};
const gymWeekPlan={
  1:{title:'Monday — Chest + Triceps',focus:'Chest + Triceps',dateHint:'2026-05-11',exercises:[
    {name:'Incline DB Press',unit:'lb',prev:'55×8/8/6',prevTop:55,prevReps:22,target:'55×8/8/7+',sets:[{w:55,r:8},{w:55,r:8},{w:55,r:7}],growth:'+4.5% volume',coach:'micro-progress: add 1 rep on set 3 before jumping load'},
    {name:'Flat DB Press',unit:'lb',prev:'55×8/8/6',prevTop:55,prevReps:22,target:'55×8/8/7+',sets:[{w:55,r:8},{w:55,r:8},{w:55,r:7}],growth:'+4.5% volume',coach:'same weight, cleaner final set'},
    {name:'Cable Fly low-to-high',unit:'lb',prev:'17.5×10/10/10 + 15×20',prevTop:17.5,prevReps:50,target:'17.5×11/10/10 + 15×20',sets:[{w:17.5,r:11},{w:17.5,r:10},{w:17.5,r:10},{w:15,r:20}],growth:'+2.0% reps',coach:'keep tension; no shoulder irritation'},
    {name:'Chest Fly high-to-low',unit:'lb',prev:'17.5×12/12, 20×12',prevTop:20,prevReps:36,target:'20×10/10/10',sets:[{w:20,r:10},{w:20,r:10},{w:20,r:10}],growth:'+14.3% load',coach:'load progression, accept slightly lower reps'},
    {name:'Triceps Pushdown',unit:'kg',prev:'60×12,70×12/12',prevTop:70,prevReps:36,target:'70×12/12/12',sets:[{w:70,r:12},{w:70,r:12},{w:70,r:12}],growth:'+7.7% tonnage',coach:'all working sets at top weight'},
    {name:'Overhead Tricep Extension',unit:'lb',prev:'60×12,70×10/10',prevTop:70,prevReps:32,target:'70×10/10/11+',sets:[{w:70,r:10},{w:70,r:10},{w:70,r:11}],growth:'+3.1% volume',coach:'elbows warm; only chase last-set rep'},
    {name:'Single-Arm Cross-Body Pushdown',unit:'lb',prev:'10×12/12/12',prevTop:10,prevReps:36,target:'12.5×10/10/10 or 10×13s',sets:[{w:12.5,r:10},{w:12.5,r:10},{w:12.5,r:10}],growth:'+4.2% tonnage',coach:'if form breaks, edit back to 10×13'}]},
  2:{title:'Tuesday — Legs',focus:'Legs',exercises:[
    {name:'Bulgarian Split Squat',unit:'lb',prev:'45×15/15,55×13',target:'45×15,55×12/12',sets:[{w:45,r:15},{w:55,r:12},{w:55,r:12}],growth:'+6–8% intensity',coach:'don’t destroy brick/run legs'},
    {name:'Hack Squat',unit:'lb',prev:'45×15,70×12,90×12',target:'70×12,90×12/12',sets:[{w:70,r:12},{w:90,r:12},{w:90,r:12}],growth:'+14% top-set volume',coach:'controlled depth'},
    {name:'Leg Curl',unit:'lb',prev:'90×12,120×10/10',target:'120×10/10/11+',sets:[{w:120,r:10},{w:120,r:10},{w:120,r:11}],growth:'+3.3% volume',coach:'hamstring priority for run durability'},
    {name:'Glute Drive',unit:'lb',prev:'110×12,130×10/10',target:'130×10/10/11+',sets:[{w:130,r:10},{w:130,r:10},{w:130,r:11}],growth:'+3.3% volume',coach:'hips locked, no lumbar extension'},
    {name:'Calf Raise',unit:'lb',prev:'150×12×3',target:'150×13/12/12',sets:[{w:150,r:13},{w:150,r:12},{w:150,r:12}],growth:'+2.8% reps',coach:'run-protective calf capacity'}]},
  4:{title:'Thursday — Back + Biceps',focus:'Back + Biceps',exercises:[
    {name:'Lat Pulldown',unit:'lb',prev:'160×8/9 top',target:'160×9/9/9',sets:[{w:160,r:9},{w:160,r:9},{w:160,r:9}],growth:'+5–8% volume',coach:'own 160 before 170'},
    {name:'Seated Row',unit:'lb',prev:'120×10,140×10/10',target:'140×10/10/11',sets:[{w:140,r:10},{w:140,r:10},{w:140,r:11}],growth:'+3.3% volume',coach:'scapular control'},
    {name:'Straight-Arm Pulldown',unit:'lb',prev:'57.5×12,65×12/10',target:'65×12/11/11',sets:[{w:65,r:12},{w:65,r:11},{w:65,r:11}],growth:'+3–6% volume',coach:'lats, not triceps'},
    {name:'Hammer Curl',unit:'lb',prev:'40×10×3',target:'40×11/10/10',sets:[{w:40,r:11},{w:40,r:10},{w:40,r:10}],growth:'+3.3% reps',coach:'earn 40×12s before 45'},
    {name:'Seated DB Curl',unit:'lb',prev:'27.5×10×3',target:'27.5×11/10/10',sets:[{w:27.5,r:11},{w:27.5,r:10},{w:27.5,r:10}],growth:'+3.3% reps',coach:'no swing'},
    {name:'Cross-Body Hammer Curl',unit:'lb',prev:'35×10×3',target:'35×11/10/10',sets:[{w:35,r:11},{w:35,r:10},{w:35,r:10}],growth:'+3.3% reps',coach:'forearm/brachialis quality'}]},
  5:{title:'Friday — Shoulders + Rear Delts',focus:'Shoulders + Rear Delts',exercises:[
    {name:'DB Shoulder Press',unit:'lb',prev:'50×8/8/7',target:'50×8/8/8',sets:[{w:50,r:8},{w:50,r:8},{w:50,r:8}],growth:'+4.3% volume',coach:'must hit 8/8/8 before increasing'},
    {name:'DB Lateral Raise',unit:'lb',prev:'20×15,25×12,27.5×10',target:'25×12,27.5×10/10',sets:[{w:25,r:12},{w:27.5,r:10},{w:27.5,r:10}],growth:'+7–10% intensity',coach:'strict side delt'},
    {name:'Cable Lateral Raise',unit:'lb',prev:'12.5×12×3',target:'12.5×13/12/12',sets:[{w:12.5,r:13},{w:12.5,r:12},{w:12.5,r:12}],growth:'+2.8% reps',coach:'slow negative'},
    {name:'Rear Delt Fly',unit:'lb',prev:'90×12,100×12/10',target:'100×12/12/11+',sets:[{w:100,r:12},{w:100,r:12},{w:100,r:11}],growth:'+6–9% volume',coach:'rear delt priority'},
    {name:'Face Pull',unit:'lb',prev:'25×12,30×12/12',target:'30×12×3',sets:[{w:30,r:12},{w:30,r:12},{w:30,r:12}],growth:'+8.7% tonnage',coach:'shoulder health'},
    {name:'Single-Arm Rear Shoulder Cable Pull',unit:'lb',prev:'5×12,7.5×10',target:'7.5×10/10/10',sets:[{w:7.5,r:10},{w:7.5,r:10},{w:7.5,r:10}],growth:'+50% set volume',coach:'small load; exact form'}]}
};

let activity=load(STORE_KEY,base.sets);let images=load(IMAGE_KEY,[]);let mealApprovals=load(MEALS,{});
function load(k,f){try{return JSON.parse(localStorage.getItem(k))||f}catch{return f}}function save(){localStorage.setItem(STORE_KEY,JSON.stringify(activity));localStorage.setItem(IMAGE_KEY,JSON.stringify(images));localStorage.setItem(MEALS,JSON.stringify(mealApprovals))}
function now(){return new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}function uid(){return Math.random().toString(36).slice(2,9)}function est1rm(w,r){return w&&r?w*(1+r/30):0}
function inferSport(type,title){if(type==='body')return'body';if(type==='nutrition')return'nutrition';if(type==='recovery')return'recovery';if(type==='interval')return /run/i.test(title)?'run':/swim/i.test(title)?'swim':'bike';return'strength'}
function filtered(){let d=$('day').value,src=$('sourceFilter').value,s=$('sport').value;return activity.filter(x=>(!d||x.day===d||view!=='today')&&(src==='all'||x.source===src)&&(s==='all'||x.sport===s)).sort((a,b)=>(b.day+b.t).localeCompare(a.day+a.t))}
function renderViews(){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$(`view-${view}`).classList.add('active');document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===view))}
function renderStrip(){const rows=filtered(),sets=rows.filter(x=>x.type==='set'),ton=sets.reduce((a,x)=>a+(+x.w||0)*(+x.reps||0),0),device=activity.filter(x=>lockedSources.has(x.source)).length,manual=activity.filter(x=>!lockedSources.has(x.source)).length;$('coachStrip').innerHTML=[['Feed rows',rows.length,'visible atomic records','good'],['Manual/locked',`${manual}/${device}`,'editable vs device records','good'],['Tonnage',Math.round(ton).toLocaleString()+' lb','visible strength rows','good'],['Images',images.length,'progress-photo records',images.length?'good':'warn'],['Coach confidence',confidence()+'%','data completeness','warn'],['Next decision','Open Today at gym','program + reps/weight only','good']].map(x=>`<div class="tile ${x[3]}"><small>${x[0]}</small><b>${x[1]}</b><small>${x[2]}</small></div>`).join('')}
function confidence(){let score=35;if(activity.some(x=>x.source==='api'))score+=15;if(activity.some(x=>x.rpe))score+=10;if(images.length)score+=10;if(activity.some(x=>x.sport==='nutrition'))score+=10;if(activity.some(x=>x.sport==='recovery'))score+=10;return Math.min(90,score)}
function isLocked(x){return x.locked || lockedSources.has(x.source)}
function rowMeta(x){if(x.type==='set')return `${x.w||'—'} lb × ${x.reps||'—'} · set ${x.set||1} · ${x.rpe?'RPE '+x.rpe:'RPE —'}`;return x.value||x.note||'logged'}
function renderActivity(){const rows=filtered();$('activityFeed').innerHTML=rows.map(x=>`<div class="activityRow ${x.source}"><div class="time"><b>${x.t}</b><small>${x.day}</small></div><div><div><span class="pill ${x.source}">${x.source}</span><span class="pill">${x.type}</span><span class="pill">${x.sport}</span></div><strong>${x.ex}</strong><small>${rowMeta(x)}</small><em>${x.note||''}</em></div><div class="rightStat"><b>${x.type==='set'&&x.w?est1rm(+x.w,+x.reps).toFixed(1):'—'}</b><small>${x.type==='set'?'e1RM':'score'}</small></div>${isLocked(x)?'<button class="lock" disabled>locked</button>':`<button class="delete" data-del="${x.id}">delete</button>`}</div>`).join('')||'<div class="empty">No records for this filter.</div>';document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{let row=activity.find(x=>x.id===b.dataset.del);if(row&&isLocked(row))return;activity=activity.filter(x=>x.id!==b.dataset.del);save();render()});renderIntel();renderPipeline()}
function renderIntel(){let rows=filtered(),last=rows[0],heavy=rows.filter(x=>x.rpe>=9).length;$('feedIntel').innerHTML=[`Latest input: ${last?last.ex+' · '+rowMeta(last):'none'}`,`High strain rows: ${heavy}`,`Forecast rule: progress only after target reps with RPE ≤8.5`,images.length?'Vision: compare latest photo against baseline':'Vision: add baseline front/side/back photos'].map(x=>`<div class="card"><b>${x}</b></div>`).join('')}
function renderPipeline(){$('pipeline').innerHTML=[['Garmin','run/swim/outdoor bike source; API adapter scaffolded','warn'],['Peloton','indoor bike power source; adapter scaffolded','warn'],['Intervals.icu','aggregator fallback, not primary ledger','good'],['Gym mobile input','program card + weight/reps only','good'],['Telegram','training-thread parser target','warn'],['Delete policy','manual deletable; device locked','good']].map(x=>`<div class="pipe"><span>${x[0]}</span><b class="${x[2]}">${x[1]}</b></div>`).join('')}
function renderFeed(){const rows=filtered().filter(x=>x.type==='set'||x.type==='interval');$('feedTable').innerHTML=`<div class="row header"><span>time</span><span>source</span><span>activity</span><span>set</span><span>load</span><span>reps/min</span><span>RPE</span><span>coach note</span><span>e1RM</span></div>`+rows.map(x=>`<div class="row"><span>${x.t}</span><span class="pill ${x.source}">${x.source}</span><strong>${x.ex}</strong><span class="tag">${x.set||'—'}</span><span>${x.w||'—'}</span><span>${x.reps||'—'}</span><span class="tag ${x.rpe>=9?'amber':'green'}">${x.rpe||'—'}</span><span>${x.note||''}</span><b>${x.w?est1rm(+x.w,+x.reps).toFixed(1):'—'}</b></div>`).join('')}
function renderForecast(){$('forecastList').innerHTML=base.forecast.map(card).join('');$('forecastList2').innerHTML=base.forecast.map(card).join('')}function card(f,i){return`<div class="forecast"><div class="rank">${(i||0)+1}</div><div><b>${f.ex}</b><small>${f.why}</small><br><em>${f.next}</em><br><small>${f.rule}</small></div><strong>${f.len}</strong></div>`}
function renderEvolution(){let exs=Object.keys(base.history);$('exerciseSelect').innerHTML=exs.map(x=>`<option>${x}</option>`).join('');$('exerciseSelect').onchange=()=>{drawExercise();renderMovementNotes()};renderMovementNotes();setTimeout(drawExercise,0)}
function drawExercise(){const ex=$('exerciseSelect').value,arr=base.history[ex]||[],c=$('exerciseChart');if(!c)return;const ctx=c.getContext('2d'),r=c.getBoundingClientRect(),dpr=devicePixelRatio||1;c.width=r.width*dpr;c.height=260*dpr;ctx.scale(dpr,dpr);let w=r.width,h=260,p=30;ctx.clearRect(0,0,w,h);ctx.strokeStyle='rgba(255,255,255,.08)';for(let i=0;i<4;i++){let y=p+i*(h-p*2)/3;ctx.beginPath();ctx.moveTo(p,y);ctx.lineTo(w-p,y);ctx.stroke()}let max=Math.max(...arr.map(x=>x.est),1);ctx.strokeStyle='#72f5a5';ctx.lineWidth=2;ctx.beginPath();arr.forEach((x,i)=>{let xx=p+i*(w-p*2)/(arr.length-1||1),yy=h-p-(x.est/max)*(h-p*2);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)});ctx.stroke();arr.forEach((x,i)=>{let xx=p+i*(w-p*2)/(arr.length-1||1),yy=h-p-(x.est/max)*(h-p*2);ctx.fillStyle='#72f5a5';ctx.beginPath();ctx.arc(xx,yy,4,0,7);ctx.fill();ctx.fillStyle='#8c9d92';ctx.fillText(x.d,xx-12,h-8);ctx.fillStyle='#edf5ef';ctx.fillText(Math.round(x.est),xx-8,yy-9)})}
function renderMovementNotes(){let ex=$('exerciseSelect').value,arr=base.history[ex]||[],last=arr.at(-1)||{est:0,reps:0},prev=arr.at(-2)||last,gain=prev.est?((last.est-prev.est)/prev.est*100):0;$('movementNotes').innerHTML=[['Current e1RM',last.est.toFixed(1),'latest best set'],['Last delta',gain.toFixed(1)+'%','exercise-specific'],['Next decision',gain>3?'hold + consolidate':'micro-progress','coach rule'],['Risk flag',last.reps<8?'strength limit':'volume OK','latest reps']].map(c=>`<div class="card"><b>${c[1]}</b><small>${c[0]} · ${c[2]}</small><div class="bar"><span style="width:${Math.min(100,Math.abs(gain)*15+35)}%"></span></div></div>`).join('')}
function renderBottom(){$('enduranceCards').innerHTML=[['Bike','Z2 75–90 min @ 145–155W','Fuel 40–60g carbs/hour'],['Run','20–30 min easy brick','Only progress if calves green'],['Swim','2/wk technique + aerobic','Need CSS baseline'],['Strength interference','Avoid hard run after heavy legs','Preserve bulk']].map(c=>`<div class="card"><b>${c[0]}</b><small>${c[1]}<br>${c[2]}</small></div>`).join('');$('readiness').innerHTML=['Shoulders: green; progress but keep form','Leg fatigue: unknown without soreness score','Endurance load: safe until Intervals sync','Today decision: log every set live'].map(x=>`<div class="card"><b>${x}</b></div>`).join('');$('nutrition').innerHTML=['Protein target: 160g+','Carbs around bike/run mandatory','Morning weight trend needed','Goal: slow bulk, not sloppy'].map(x=>`<div class="card"><b>${x}</b></div>`).join('');$('missing').innerHTML=base.missing.slice(0,6).map(x=>`<div class="card"><b>${x}</b><small>needed for smarter forecasts</small></div>`).join('')}
function renderImages(){$('imageTimeline').innerHTML=images.map(img=>`<div class="imageCard"><img src="${img.src}" alt="progress"><div><b>${img.label}</b><small>${img.day} · ${img.t}</small><button class="delete img" data-img="${img.id}">delete</button></div></div>`).join('')||'<div class="empty">No photos yet. Add baseline front / side / back.</div>';document.querySelectorAll('[data-img]').forEach(b=>b.onclick=()=>{images=images.filter(x=>x.id!==b.dataset.img);save();render()});$('visionMetrics').innerHTML=[['Goal','Track physique change while bulking and building triathlon capacity'],['Inputs needed','standardized photos, bodyweight, waist/chest/arm/thigh, lighting tag'],['CV analysis later','pose alignment, silhouette ratios, shoulder-waist trend, muscle fullness, posture'],['Coach usage','adjust calories, gym emphasis, fatigue, and endurance interference'],['Privacy design','local-first storage; explicit consent before cloud CV processing']].map(x=>`<div class="visionTile"><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}

function calcBurn(){
  const rows=activity.filter(x=>x.day===$('day').value), device=rows.filter(x=>lockedSources.has(x.source));
  const deviceBurn=device.reduce((a,x)=>a+(+x.calories||0),0) || Math.round(rows.filter(x=>x.sport==='bike').length*520 + rows.filter(x=>x.sport==='run').length*420 + rows.filter(x=>x.sport==='swim').length*360 + rows.filter(x=>x.sport==='strength').length*180);
  const grossBurn=restDayBurn+deviceBurn;
  const rule=deficitRuleForDay(deviceBurn);
  const deficit=deviceBurn===0?370:deviceBurn<400?350:deviceBurn<900?300:150;
  const total=Math.round(grossBurn-deficit);
  return {deviceBurn,grossBurn,deficit,total,rule,protein:170,carbs:Math.round(total*.42/4),fat:Math.round(total*.25/9)};
}
function nutritionTemplate(){
  const b=calcBurn(), longRide=activity.some(x=>x.day===$('day').value&&x.sport==='bike'&&((+x.reps||0)>=60||/long|endurance/i.test(x.ex+x.note)));
  return [
    {slot:'pre-training',when:'before long ride/run',items:longRide?'banana + rice waffle with jam + electrolytes':'espresso + banana if needed',kcal:longRide?260:110,p:2,c:58,f:1,note:longRide?'add gels every ~30 min during ride':'optional for short Z2'},
    {slot:'breakfast',when:'post triathlon + pre/after gym',items:'60g oats + 150g Greek yogurt + berries + honey + whey',kcal:620,p:48,c:82,f:12,note:'front-loaded recovery carbs + protein'},
    {slot:'lunch',when:'midday',items:'180g chicken/rice bowl + olive oil + vegetables',kcal:780,p:58,c:92,f:20,note:'primary glycogen + micronutrients'},
    {slot:'snack',when:'afternoon',items:'protein shake + fruit + nuts or bagel',kcal:430,p:35,c:52,f:12,note:'keeps surplus without dinner overload'},
    {slot:'dinner',when:'evening',items:'salmon/lean beef + potatoes/pasta + vegetables',kcal:Math.max(650,b.total-1830),p:45,c:Math.max(70,b.carbs-226),f:22,note:'finish macros based on actual burn'}
  ];
}
function renderNutrition(){
  const b=calcBurn(), day=$('day').value, plan=nutritionTemplate();
  const approved=mealApprovals[day]||{};
  if($('nutritionMath')) $('nutritionMath').innerHTML=[['rest-day burn',restDayBurn+' kcal'],['training burn',b.deviceBurn+' kcal'],['gross burn',b.grossBurn+' kcal'],['planned deficit','−'+b.deficit+' kcal'],['target intake',b.total+' kcal'],['macro target',`${b.protein}g P · ${b.carbs}g C · ${b.fat}g F`]].map(x=>`<div class="metric"><b>${x[1]}</b><small>${x[0]}</small></div>`).join('');
  if($('deficitRules')) $('deficitRules').innerHTML=[['goal',athleteProfile.goal],['coach SOP',athleteProfile.coachSop],['today type',b.rule.type],['deficit rule',b.rule.deficit],['intake logic',b.rule.target],['why',b.rule.why],['normal training day','250–350 kcal deficit; fuel performance first'],['long / brick day','0–250 kcal deficit; never chase fat loss at the cost of adaptation']].map(x=>`<div class="card"><b>${x[0]}</b><small>${x[1]}</small></div>`).join('');
  if($('nutritionPlan')) $('nutritionPlan').innerHTML=plan.map((m,i)=>`<div class="mealCard ${approved[m.slot]?'approved':''}"><div><b>${m.slot}</b><small>${m.when}</small></div><textarea id="meal${i}">${approved[m.slot]?.items||m.items}</textarea><div class="macroLine">${m.kcal} kcal · ${m.p}g P · ${m.c}g C · ${m.f}g F</div><small>${m.note}</small><div class="mealActions"><button data-approve-meal="${i}">${approved[m.slot]?'approved':'approve'}</button><button data-edit-meal="${i}">save edit</button></div></div>`).join('');
  document.querySelectorAll('[data-approve-meal]').forEach(btn=>btn.onclick=()=>{const m=plan[+btn.dataset.approveMeal];mealApprovals[day]=mealApprovals[day]||{};mealApprovals[day][m.slot]={...m,items:$('meal'+btn.dataset.approveMeal).value,approved:true};localStorage.setItem(MEALS,JSON.stringify(mealApprovals));activity.unshift({id:uid(),t:now(),day,source:'manual',sport:'nutrition',type:'nutrition',ex:m.slot,value:$('meal'+btn.dataset.approveMeal).value,note:'approved nutrition prescription'});save();render()});
  document.querySelectorAll('[data-edit-meal]').forEach(btn=>btn.onclick=()=>{const m=plan[+btn.dataset.editMeal];mealApprovals[day]=mealApprovals[day]||{};mealApprovals[day][m.slot]={...m,items:$('meal'+btn.dataset.editMeal).value,approved:false};localStorage.setItem(MEALS,JSON.stringify(mealApprovals));renderNutrition()});
  renderCalendar();
}
function renderCalendar(){
  if(!$('adaptiveCalendar')) return; const names=['Sun recovery','Mon push','Tue legs','Wed pull/adjust','Thu endurance','Fri pump','Sat long ride/run'];
  $('adaptiveCalendar').innerHTML=names.map((n,i)=>`<div class="dayCard"><b>${n}</b><small>${i===3?'flex/shift day if Tue missed':i===6?'fuel: gels + electrolytes':'planned but movable'}</small><button data-shift="${i}">shift here</button></div>`).join('');
  document.querySelectorAll('[data-shift]').forEach(b=>b.onclick=()=>{activity.unshift({id:uid(),t:now(),day:$('day').value,source:'manual',sport:'recovery',type:'coach_note',ex:'Plan shift',value:'session moved',note:'calendar shift requested'});save();render()});
}
function renderProgram(){let dt=new Date($('day').value+'T12:00:00'),dow=dt.getDay(),names=weekPlan[dow]||weekPlan[1];$('programTitle').textContent=['Sunday recovery','Monday push/shoulders','Tuesday legs','Wednesday pull/chest','Thursday endurance','Friday pump/accessory','Saturday long endurance'][dow]||'Today’s program';$('programList').innerHTML=names.map((ex,i)=>`<div class="programItem"><div><b>${ex}</b><small>${i<3?'priority lift':'support work'} · enter only actual load + reps</small></div><input inputmode="decimal" placeholder="lb/kg" id="pw${i}"><input inputmode="numeric" placeholder="reps" id="pr${i}"><button data-log-program="${i}">log</button></div>`).join('');document.querySelectorAll('[data-log-program]').forEach(b=>b.onclick=()=>{let i=b.dataset.logProgram,w=$('pw'+i).value,r=$('pr'+i).value;if(!w&&!r)return;activity.unshift({id:uid(),t:now(),day:$('day').value,source:'manual',sport:'strength',type:'set',ex:names[i],value:`${w} × ${r}`,w:+w||0,reps:+r||0,set:1,rpe:'',note:'mobile program input'});save();render()})}


function plannedGymForDay(){
  const dt=new Date($('day').value+'T12:00:00'), dow=dt.getDay();
  return gymWeekPlan[dow] || {title:['Sunday recovery','Monday — Chest + Triceps','Tuesday — Legs','Wednesday — Endurance / Mobility','Thursday — Back + Biceps','Friday — Shoulders + Rear Delts','Saturday — Long endurance'][dow],focus:'fallback',exercises:(weekPlan[dow]||weekPlan[1]).map(name=>({name,unit:'lb',prev:'—',target:'edit target',sets:[{w:'',r:''}],growth:'—',coach:'fallback until calendar sync'}))};
}
function renderGymInput(){
  if(!$('gymInputList')) return;
  const plan=plannedGymForDay();
  if($('gymInputTitle')) $('gymInputTitle').textContent=plan.title;
  if($('gymInputMeta')) $('gymInputMeta').innerHTML=`<b>${plan.focus}</b> · targets are prefilled from last week. Edit any field, then approve one exercise or the whole day.`;
  $('gymInputList').innerHTML=plan.exercises.map((ex,i)=>{
    const setText=ex.sets.map((s,j)=>`<div class="setLine"><span>set ${j+1}</span><input inputmode="decimal" value="${s.w}" id="giw${i}_${j}" aria-label="${ex.name} set ${j+1} weight"><b>${ex.unit}</b><input inputmode="numeric" value="${s.r}" id="gir${i}_${j}" aria-label="${ex.name} set ${j+1} reps"><em>reps</em></div>`).join('');
    return `<div class="programItem inputCard gymPlanCard"><div class="planHead"><div><b contenteditable="true" id="gex${i}">${ex.name}</b><small>previous: ${ex.prev} → target: ${ex.target}</small></div><span class="growthBadge">${ex.growth}</span></div><div class="setGrid">${setText}</div><small class="coachNote">${ex.coach}</small><button data-approve-exercise="${i}">approve exercise</button></div>`;
  }).join('');
  document.querySelectorAll('[data-approve-exercise]').forEach(b=>b.onclick=()=>approveGymExercise(+b.dataset.approveExercise));
}
function collectGymExerciseRows(i){
  const plan=plannedGymForDay(), ex=plan.exercises[i], name=$('gex'+i).textContent.trim()||ex.name, rows=[];
  ex.sets.forEach((s,j)=>{let w=$(`giw${i}_${j}`).value,r=$(`gir${i}_${j}`).value;if(w||r) rows.push({id:uid(),t:now(),day:$('day').value,source:'manual',sport:'strength',type:'set',ex:name,value:`${w} ${ex.unit} × ${r}`,w:+w||0,reps:+r||0,set:j+1,rpe:'',note:`approved plan · prev ${ex.prev} · growth ${ex.growth}`})});
  return rows;
}
function approveGymExercise(i){
  activity.unshift(...collectGymExerciseRows(i));
  save();render();
}
function approveGymDay(){
  const plan=plannedGymForDay(), rows=[];
  plan.exercises.forEach((_,i)=>rows.push(...collectGymExerciseRows(i)));
  activity.unshift(...rows);
  save();render();
}

function renderFoodInput(){
  if(!$('foodInputList')) return;
  const b=calcBurn(), day=$('day').value, plan=nutritionTemplate(), approved=mealApprovals[day]||{};
  $('foodInputList').innerHTML=plan.map((m,i)=>`<div class="mealCard inputCard ${approved[m.slot]?'approved':''}"><div><b>${m.slot}</b><small>${m.when}</small></div><textarea id="food${i}">${approved[m.slot]?.items||m.items}</textarea><div class="macroLine">suggested: ${m.kcal} kcal · ${m.p}g P · ${m.c}g C · ${m.f}g F</div><small>${m.note}</small><div class="mealActions"><button data-food-approve="${i}">${approved[m.slot]?'approved':'approve log'}</button><button data-food-save="${i}">save edit only</button></div></div>`).join('');
  $('foodInputMath').innerHTML=[['day type',b.rule.type],['target intake',b.total+' kcal'],['training burn',b.deviceBurn+' kcal'],['deficit rule',b.rule.deficit],['macro target',`${b.protein}g P · ${b.carbs}g C · ${b.fat}g F`]].map(x=>`<div class="metric"><b>${x[1]}</b><small>${x[0]}</small></div>`).join('');
  document.querySelectorAll('[data-food-approve]').forEach(btn=>btn.onclick=()=>{const m=plan[+btn.dataset.foodApprove];mealApprovals[day]=mealApprovals[day]||{};mealApprovals[day][m.slot]={...m,items:$('food'+btn.dataset.foodApprove).value,approved:true};activity.unshift({id:uid(),t:now(),day,source:'manual',sport:'nutrition',type:'nutrition',ex:m.slot,value:$('food'+btn.dataset.foodApprove).value,note:'food input approved'});save();render()});
  document.querySelectorAll('[data-food-save]').forEach(btn=>btn.onclick=()=>{const m=plan[+btn.dataset.foodSave];mealApprovals[day]=mealApprovals[day]||{};mealApprovals[day][m.slot]={...m,items:$('food'+btn.dataset.foodSave).value,approved:false};save();renderFoodInput()});
}
function renderSportOutputs(){
  const metric=(k,v,n='')=>`<div class="card"><b>${v}</b><small>${k}${n?` · ${n}`:''}</small></div>`;
  const rows=s=>activity.filter(x=>x.sport===s), sets=rows('strength').filter(x=>x.type==='set'), ton=sets.reduce((a,x)=>a+(+x.w||0)*(+x.reps||0),0);
  if($('bikeMetrics')) $('bikeMetrics').innerHTML=[metric('records',rows('bike').length,'bike only'),metric('next',base.forecast.find(x=>x.ex==='Bike aerobic')?.next||'Z2 bike pending'),metric('source','Peloton / Garmin / Intervals','locked when imported')].join('');
  if($('runMetrics')) $('runMetrics').innerHTML=[metric('records',rows('run').length,'run only'),metric('next','20–30 min easy brick when legs green'),metric('missing','LT pace + recent HR zones')].join('');
  if($('swimMetrics')) $('swimMetrics').innerHTML=[metric('records',rows('swim').length,'swim only'),metric('next','2×/week technique + aerobic'),metric('missing','CSS / pace per 100m baseline')].join('');
  if($('gymMetrics')) $('gymMetrics').innerHTML=[metric('sets',sets.length,'manual editable'),metric('tonnage',Math.round(ton).toLocaleString()+' lb'),metric('coverage','strength + physique output')].join('');
  if($('gymForecast')) $('gymForecast').innerHTML=base.forecast.filter(x=>!['Bike aerobic','Run off bike'].includes(x.ex)).map((f,i)=>`<div class="forecast"><div class="rank">${i+1}</div><div><b>${f.ex}</b><small>${f.why}</small><br><em>${f.next}</em><br><small>${f.rule}</small></div><strong>${f.len}</strong></div>`).join('');
  if($('analyticsMetrics')) $('analyticsMetrics').innerHTML=[metric('coach confidence',confidence()+'%'),metric('manual / locked',`${activity.filter(x=>!lockedSources.has(x.source)).length} / ${activity.filter(x=>lockedSources.has(x.source)).length}`),metric('nutrition records',rows('nutrition').length),metric('body images',images.length)].join('');
  if($('goalGapMetrics')) $('goalGapMetrics').innerHTML=base.missing.concat(['Training-plan calendar sync','Food actuals by meal','Gym RPE/RIR and soreness']).map((x,i)=>`<div class="gap"><b>${String(i+1).padStart(2,'0')}</b><span>${x}</span><small>${i<5?'P0':'P1'}</small></div>`).join('');
}

function renderGaps(){$('gapBoard').innerHTML=base.missing.concat(['Manual edit after delete','API sync scheduler','Nutrition source: MacroFactor/Cronometer/MFP','Recovery source: Garmin/Oura/Whoop/Apple Health','Race plan: A/B/C events','Injury flags and pain scale']).map((x,i)=>`<div class="gap"><b>${String(i+1).padStart(2,'0')}</b><span>${x}</span><small>${i<4?'P0':'P1'}</small></div>`).join('')}
function bind(){document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{view=b.dataset.view;render()});['day','sport','sourceFilter','density'].forEach(id=>$(id).oninput=render);$('saveActivity').onclick=()=>{let type=$('typeInput').value,title=$('titleInput').value.trim()||'Manual input',value=$('valueInput').value.trim(),rpe=($('rpeInput').value||'').replace('RPE ','');let m=value.match(/(\d+(?:\.\d+)?)\s*(?:lb|kg)?\s*[x×]\s*(\d+)/i);activity.unshift({id:uid(),t:now(),day:$('day').value,source:'manual',sport:inferSport(type,title),type,ex:title,value,w:m?+m[1]:0,reps:m?+m[2]:0,set:1,rpe:rpe?+rpe:'',note:value||'manual entry'});$('titleInput').value='';$('valueInput').value='';save();render()};$('seedGarminBtn').onclick=()=>{activity.unshift({id:uid(),t:now(),day:$('day').value,source:'garmin',source_id:'demo_'+uid(),locked:true,deletable:false,sport:'run',type:'activity',ex:'Garmin synced run/swim',value:'device import',w:0,reps:38,rpe:6,note:'locked Garmin device record'});save();render()};$('seedPelotonBtn').onclick=()=>{activity.unshift({id:uid(),t:now(),day:$('day').value,source:'peloton',source_id:'demo_'+uid(),locked:true,deletable:false,sport:'bike',type:'activity',ex:'Peloton synced ride',value:'power/output import',w:165,reps:45,rpe:7,note:'locked Peloton bike record'});save();render()};$('exportBtn').onclick=()=>{let blob=new Blob([JSON.stringify({activity,images:images.map(x=>({...x,src:'[image-data-url omitted]'}))},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='athlete-os-activity.json';a.click()};$('imageInput').onchange=e=>{[...e.target.files].forEach(file=>{let fr=new FileReader();fr.onload=()=>{images.unshift({id:uid(),src:fr.result,label:$('imageLabel').value||file.name,day:$('day').value,t:now()});activity.unshift({id:uid(),t:now(),day:$('day').value,source:'image',sport:'body',type:'body',ex:'Progress photo',value:$('imageLabel').value||file.name,note:'body vision input'});save();render()};fr.readAsDataURL(file)})};$('saveImageNote').onclick=()=>{activity.unshift({id:uid(),t:now(),day:$('day').value,source:'image',sport:'body',type:'body',ex:'Image analysis note',value:$('imageLabel').value||'photo note',note:'manual body vision note'});save();render()}}

document.addEventListener('click',e=>{
  if(e.target?.id==='approveGymDay'){approveGymDay();return;}
  if(e.target?.id==='addCustomGym'){
    const ex=$('customGymName').value.trim()||'Custom gym set',w=$('customGymWeight').value,r=$('customGymReps').value;
    if(!ex||(!w&&!r)) return;
    activity.unshift({id:uid(),t:now(),day:$('day').value,source:'manual',sport:'strength',type:'set',ex,value:`${w} × ${r}`,w:+w||0,reps:+r||0,set:1,rpe:'',note:'custom gym input'});
    $('customGymName').value='';$('customGymWeight').value='';$('customGymReps').value='';save();render();
  }
  if(e.target?.id==='addCustomFood'){
    const ex=$('customFoodName').value.trim()||'Custom food',value=$('customFoodValue').value.trim();
    if(!ex&&!value) return;
    activity.unshift({id:uid(),t:now(),day:$('day').value,source:'manual',sport:'nutrition',type:'nutrition',ex,value,note:'custom food input'});
    $('customFoodName').value='';$('customFoodValue').value='';save();render();
  }
});

function render(){document.body.classList.toggle('compact',$('density').value==='0');renderViews();renderStrip();renderActivity();renderProgram();renderGymInput();renderNutrition();renderFoodInput();renderFeed();renderForecast();renderEvolution();renderBottom();renderSportOutputs();renderImages();renderGaps()}bind();render();addEventListener('resize',drawExercise);
