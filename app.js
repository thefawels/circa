/* Circa, an offline-first chord workstation. No dependencies or external requests. */
'use strict';

const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const RUS_NOTES = ['До','До♯','Ре','Ре♯','Ми','Фа','Фа♯','Соль','Соль♯','Ля','Ля♯','Си'];
const QUALITIES = [
  {id:'maj', label:'Major', short:'maj', suffix:'', intervals:[0,4,7], formula:'1 · 3 · 5', desc:'Мажорное трезвучие'},
  {id:'min', label:'Minor', short:'min', suffix:'m', intervals:[0,3,7], formula:'1 · ♭3 · 5', desc:'Минорное трезвучие'},
  {id:'dim', label:'Diminished', short:'dim', suffix:'dim', intervals:[0,3,6], formula:'1 · ♭3 · ♭5', desc:'Уменьшённое трезвучие'},
  {id:'aug', label:'Augmented', short:'aug', suffix:'aug', intervals:[0,4,8], formula:'1 · 3 · ♯5', desc:'Увеличенное трезвучие'},
  {id:'sus2', label:'Suspended 2', short:'sus2', suffix:'sus2', intervals:[0,2,7], formula:'1 · 2 · 5', desc:'Без терции, с секундой'},
  {id:'sus4', label:'Suspended 4', short:'sus4', suffix:'sus4', intervals:[0,5,7], formula:'1 · 4 · 5', desc:'Без терции, с квартой'},
  {id:'maj7', label:'Major seventh', short:'maj7', suffix:'maj7', intervals:[0,4,7,11], formula:'1 · 3 · 5 · 7', desc:'Мажорный септаккорд'},
  {id:'min7', label:'Minor seventh', short:'m7', suffix:'m7', intervals:[0,3,7,10], formula:'1 · ♭3 · 5 · ♭7', desc:'Минорный септаккорд'},
  {id:'dom7', label:'Dominant seventh', short:'7', suffix:'7', intervals:[0,4,7,10], formula:'1 · 3 · 5 · ♭7', desc:'Доминантсептаккорд'},
  {id:'minmaj7', label:'Minor major 7', short:'mM7', suffix:'m(maj7)', intervals:[0,3,7,11], formula:'1 · ♭3 · 5 · 7', desc:'Минорный мажорный септаккорд'},
  {id:'halfdim', label:'Half-diminished', short:'m7♭5', suffix:'m7♭5', intervals:[0,3,6,10], formula:'1 · ♭3 · ♭5 · ♭7', desc:'Полууменьшённый септаккорд'},
  {id:'dim7', label:'Diminished 7', short:'dim7', suffix:'dim7', intervals:[0,3,6,9], formula:'1 · ♭3 · ♭5 · 𝄫7', desc:'Уменьшённый септаккорд'},
  {id:'six', label:'Major sixth', short:'6', suffix:'6', intervals:[0,4,7,9], formula:'1 · 3 · 5 · 6', desc:'Мажорный секстаккорд'},
  {id:'min6', label:'Minor sixth', short:'m6', suffix:'m6', intervals:[0,3,7,9], formula:'1 · ♭3 · 5 · 6', desc:'Минорный секстаккорд'},
  {id:'add9', label:'Add 9', short:'add9', suffix:'add9', intervals:[0,4,7,14], formula:'1 · 3 · 5 · 9', desc:'Мажор с добавленной ноной'},
  {id:'min9', label:'Minor ninth', short:'m9', suffix:'m9', intervals:[0,3,7,10,14], formula:'1 · ♭3 · 5 · ♭7 · 9', desc:'Минорный нонаккорд'},
  {id:'power', label:'Power chord', short:'5', suffix:'5', intervals:[0,7], formula:'1 · 5', desc:'Квинта без терции'}
];
const SCALES = [
  {id:'major',label:'Major / Ionian',intervals:[0,2,4,5,7,9,11],desc:'Мажорная гамма'},
  {id:'natural-minor',label:'Natural minor / Aeolian',intervals:[0,2,3,5,7,8,10],desc:'Натуральный минор'},
  {id:'harmonic-minor',label:'Harmonic minor',intervals:[0,2,3,5,7,8,11],desc:'Гармонический минор'},
  {id:'dorian',label:'Dorian',intervals:[0,2,3,5,7,9,10],desc:'Дорийский лад'},
  {id:'phrygian',label:'Phrygian',intervals:[0,1,3,5,7,8,10],desc:'Фригийский лад'},
  {id:'lydian',label:'Lydian',intervals:[0,2,4,6,7,9,11],desc:'Лидийский лад'},
  {id:'mixolydian',label:'Mixolydian',intervals:[0,2,4,5,7,9,10],desc:'Миксолидийский лад'},
  {id:'locrian',label:'Locrian',intervals:[0,1,3,5,6,8,10],desc:'Локрийский лад'},
  {id:'minor-pentatonic',label:'Minor pentatonic',intervals:[0,3,5,7,10],desc:'Минорная пентатоника'},
  {id:'major-pentatonic',label:'Major pentatonic',intervals:[0,2,4,7,9],desc:'Мажорная пентатоника'},
  {id:'blues',label:'Blues',intervals:[0,3,5,6,7,10],desc:'Блюзовая гамма'}
];
const VISIBLE_QUALITIES = ['maj','min','maj7','min7','dom7','sus2','sus4','dim'];
const STORAGE_KEY = 'circa-studio-v1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const mod=n=>(n%12+12)%12;
const byId=id=>document.getElementById(id);
const nameOf=(root,qualityId)=>NOTES[mod(root)]+(QUALITIES.find(q=>q.id===qualityId)?.suffix||'');
const noteNames=notes=>notes.map(pc=>NOTES[mod(pc)]).join(' · ');
const qById=id=>QUALITIES.find(q=>q.id===id)||QUALITIES[0];
const safeText=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
function defaults(){return {root:0,qualityId:'maj',manual:false,selected:[0,4,7],scaleId:null,scaleRoot:0,progression:[],projects:[],projectName:'Без названия',bpm:120,beats:4,inversion:0,loop:true,theme:'dark',voice:'soft',tuning:440,haptics:true,exploreTab:'chords'};}
let state=defaults();
try{
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
  if(saved && typeof saved==='object'){
    state={...state,...saved};
    if(!Array.isArray(state.selected))state.selected=[0,4,7];
    state.selected=state.selected.filter(n=>Number.isInteger(n)&&n>=0&&n<12).slice(0,12);
    if(!Array.isArray(state.progression))state.progression=[];
    state.progression=state.progression.filter(c=>Array.isArray(c.notes)&&c.notes.every(n=>Number.isInteger(n)&&n>=0&&n<12)).slice(0,64);
    if(!Array.isArray(state.projects))state.projects=[];
    state.projects=state.projects.filter(p=>p&&typeof p.name==='string'&&Array.isArray(p.progression)).slice(0,100);
  }
}catch(error){console.warn('Could not load saved work',error);}
let page='compose', playTimer=null, playingIndex=-1, playToken=0, audioCtx=null, master=null, currentVoices=[], toastTimer=null;
let gesture=null;
function saveState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));byId('autosave-caption').textContent='Автосохранено';}catch(e){showToast('Место для локального сохранения закончилось');}}
function haptic(){if(state.haptics && typeof navigator.vibrate==='function')navigator.vibrate(7);}
function showToast(message){const el=byId('toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),2900);}
const ICONS={
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  circle:'<circle cx="12" cy="12" r="9"/><path d="M12 3V21M3 12h18"/>',
  search:'<circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 5 5"/>',
  plus:'<path d="M12 3v18M3 12h18"/>',
  layers:'<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 10h16M10 4v16"/>',
  folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10H3z"/>',
  play:'<path d="m8 4 12 8-12 8z" fill="currentColor" stroke="none"/>',
  left:'<path d="m15 4-8 8 8 8"/>', right:'<path d="m9 4 8 8-8 8"/>'
};
function svgIcon(k){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;}
function setupIcons(){document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=svgIcon(el.dataset.icon));byId('top-action').innerHTML=svgIcon('more');byId('search-icon').innerHTML=svgIcon('search');byId('transpose-down').innerHTML=svgIcon('left');byId('transpose-up').innerHTML=svgIcon('right');byId('listen-chord').innerHTML=svgIcon('play');}
function currentQuality(){return qById(state.qualityId);}
function preset(root,qualityId){const q=qById(qualityId);state.root=mod(root);state.qualityId=q.id;state.selected=[...new Set(q.intervals.map(x=>mod(state.root+x)))];state.manual=false;saveState();renderCompose();haptic();}
function transpose(steps){state.root=mod(state.root+steps);state.selected=state.selected.map(pc=>mod(pc+steps));state.scaleRoot=mod(state.scaleRoot+steps);saveState();renderCompose();haptic();}
function detectChord(notes,preferredRoot){if(!notes.length)return null;
  const input=[...new Set(notes)].sort((a,b)=>a-b).join(',');
  const matches=[];
  for(let root=0;root<12;root++)for(const q of QUALITIES){
    const pcs=[...new Set(q.intervals.map(i=>mod(root+i)))].sort((a,b)=>a-b).join(',');
    if(pcs===input)matches.push({root,q});
  }
  matches.sort((a,b)=>(a.root===preferredRoot?-1:0)-(b.root===preferredRoot?-1:0)||QUALITIES.indexOf(a.q)-QUALITIES.indexOf(b.q));
  return matches[0]||null;
}
function chordDisplay(notes,root,qualityId,manual){
  if(!notes.length)return {title:'No notes',subtitle:'Нажми на круг, чтобы выбрать ноты',quality:null,root};
  if(!manual){const q=qById(qualityId);return {title:NOTES[root]+' '+q.label,subtitle:noteNames(q.intervals.map(i=>mod(root+i))),quality:q,root};}
  const match=detectChord(notes,root);
  if(match)return {title:NOTES[match.root]+' '+match.q.label,subtitle:noteNames(match.q.intervals.map(i=>mod(match.root+i))),quality:match.q,root:match.root};
  return {title:notes.length===1?NOTES[notes[0]]+' note':'Custom chord',subtitle:noteNames([...notes].sort((a,b)=>a-b)),quality:null,root};
}
function noteXY(pc,r=120){const a=(pc*30-90)*Math.PI/180;return [Math.cos(a)*r,Math.sin(a)*r];}
function circleSVG(){
  const selected=new Set(state.selected);
  const chosen=[...selected].sort((a,b)=>a-b);
  const polygon=chosen.map(pc=>noteXY(pc).map(n=>n.toFixed(2)).join(',')).join(' ');
  const mids=state.scaleId?SCALES.find(s=>s.id===state.scaleId)?.intervals.map(n=>mod(state.scaleRoot+n))||[]:[];
  const scale=new Set(mids);
  let s='<circle class="outer-ring" r="120"/>';
  if(chosen.length>=3)s+=`<polygon class="chord-fill" points="${polygon}"/>`;
  if(chosen.length===2)s+=`<polyline class="chord-line" points="${polygon}"/>`;
  if(chosen.length===1){const [x,y]=noteXY(chosen[0]);s+=`<circle class="chord-line" cx="${x}" cy="${y}" r="11"/>`;}
  if(!chosen.length)s+='<text class="center-info" x="0" y="0">SELECT NOTES</text>';
  for(let pc=0;pc<12;pc++){
    const [x,y]=noteXY(pc),[lx,ly]=noteXY(pc,153);
    s+=`<g data-pc="${pc}" role="button" aria-label="Нота ${RUS_NOTES[pc]}${selected.has(pc)?', выбрана':''}" tabindex="0">`+
      (scale.has(pc)?`<circle class="scale-point" cx="${x}" cy="${y}" r="9"/>`:``)+
      `<circle class="tick note-point ${selected.has(pc)?'selected':''}" cx="${x}" cy="${y}" r="${selected.has(pc)?5.3:2.5}"/>`+
      `<text class="note-label ${selected.has(pc)?'selected':''}" x="${lx}" y="${ly}">${NOTES[pc]}</text>`+
      `<circle class="note-hit" cx="${lx}" cy="${ly}" r="20"/><circle class="note-hit" cx="${x}" cy="${y}" r="11"/></g>`;
  }
  return s;
}
function renderRootPills(){byId('root-pills').innerHTML=NOTES.map((n,pc)=>`<button type="button" class="pill ${state.root===pc?'active':''}" data-root="${pc}">${n}</button>`).join('');}
function renderQualityPills(){byId('quality-pills').innerHTML=VISIBLE_QUALITIES.map(id=>{const q=qById(id);return `<button type="button" class="pill ${state.qualityId===q.id&&!state.manual?'active':''}" data-quality="${q.id}">${safeText(q.short)}</button>`;}).join('');}
function renderPiano(){
  const whites=[0,2,4,5,7,9,11];
  let out='';
  for(let i=0;i<14;i++){
    const pc=whites[i%7];out+=`<div class="white-key ${state.selected.includes(pc)?'active':''}" data-key="${pc}" role="button" tabindex="0" aria-label="Сыграть ${RUS_NOTES[pc]}"></div>`;
  }
  for(let i=0;i<14;i++){
    const pc=whites[i%7];if(![0,2,5,7,9].includes(pc))continue;
    const blackPc=mod(pc+1);const left=((i+1)/14)*100;
    out+=`<div class="black-key ${state.selected.includes(blackPc)?'active':''}" data-key="${blackPc}" role="button" tabindex="0" style="left:calc(${left}% - 2.5%)" aria-label="Сыграть ${RUS_NOTES[blackPc]}"></div>`;
  }
  byId('piano').innerHTML=out;
}
function renderCompose(){
  const info=chordDisplay(state.selected,state.root,state.qualityId,state.manual);
  byId('chord-name').textContent=info.title;
  byId('chord-notes').textContent=info.subtitle;
  byId('compose-counter').textContent=`${String(state.selected.length).padStart(2,'0')} / 12`;
  byId('current-root-label').textContent=NOTES[state.root];
  byId('chromatic-circle').innerHTML=circleSVG();
  byId('add-to-progression').disabled=!state.selected.length;
  renderRootPills();renderQualityPills();renderPiano();
  byId('progression-mini').textContent=state.progression.length?`В прогрессии ${state.progression.length} ${russianChords(state.progression.length)}`:'Прогрессия пока пуста';
  const n=byId('scale-notice');
  if(state.scaleId){const s=SCALES.find(s=>s.id===state.scaleId);n.classList.remove('hidden');n.innerHTML=`<span>Подсвечена гамма: <b>${NOTES[state.scaleRoot]} ${safeText(s?.label||'')}</b></span><button type="button" id="remove-scale" aria-label="Убрать подсветку">×</button>`;}
  else n.classList.add('hidden');
}
function russianChords(n){return n%10===1&&n%100!==11?'аккорд':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'аккорда':'аккордов';}
function getCurrentChord(){const match=state.manual?detectChord(state.selected,state.root):null;return {root:match?.root??state.root,qualityId:match?.q.id??(state.manual?'custom':state.qualityId),notes:[...state.selected]};}
function formatChord(chord){if(chord.qualityId==='custom')return chord.notes.length+' notes';return nameOf(chord.root,chord.qualityId);}
function addChord(){if(!state.selected.length)return showToast('Сначала выбери хотя бы одну ноту');if(state.progression.length>=64)return showToast('Максимум 64 аккорда в последовательности');state.progression.push(getCurrentChord());stopPlayback();saveState();renderProgression();renderCompose();haptic();showToast('Аккорд добавлен в прогрессию');}
function updateProgressionItem(index,action){const item=state.progression[index];if(!item)return;
  if(action==='delete'){state.progression.splice(index,1);}
  if(action==='left'&&index>0){[state.progression[index-1],state.progression[index]]=[item,state.progression[index-1]];}
  if(action==='right'&&index<state.progression.length-1){[state.progression[index+1],state.progression[index]]=[item,state.progression[index+1]];}
  if(action==='edit'){state.root=item.root;state.qualityId=qById(item.qualityId).id;state.manual=item.qualityId==='custom';state.selected=[...item.notes];navigate('compose');}
  else{stopPlayback();saveState();renderProgression();renderCompose();}
  haptic();
}
function renderProgression(){
  const arr=state.progression;
  byId('sequence-counter').textContent=String(arr.length).padStart(2,'0')+' CHORDS';
  byId('progression-cards').innerHTML=arr.length?arr.map((c,i)=>`<div class="sequence-card ${playingIndex===i?'playing':''}"><div class="seq-top"><span>${String(i+1).padStart(2,'0')} / ${String(arr.length).padStart(2,'0')}</span><button type="button" aria-label="Удалить аккорд" data-seq-action="delete" data-index="${i}">✕</button></div><div class="seq-title">${safeText(formatChord(c))}</div><div class="seq-notes">${safeText(noteNames(c.notes))}</div><div class="seq-actions"><button type="button" data-seq-action="left" data-index="${i}" ${i===0?'disabled':''} aria-label="Сдвинуть влево">←</button><button type="button" data-seq-action="edit" data-index="${i}">Изменить ↗</button><button type="button" data-seq-action="right" data-index="${i}" ${i===arr.length-1?'disabled':''} aria-label="Сдвинуть вправо">→</button></div></div>`).join(''):'<div class="empty-state">Пока ни одного аккорда.<br>Открой Compose и добавь первый.</div>';
  byId('bpm').value=state.bpm;byId('beats').value=String(state.beats);byId('inversion').value=String(state.inversion);byId('loop').checked=state.loop;
  byId('play-progression').disabled=!arr.length;byId('export-midi').disabled=!arr.length;byId('share-midi').disabled=!arr.length;
  byId('play-progression').firstElementChild.textContent=playingIndex>=0?'Остановить':'Слушать прогрессию';byId('play-action-icon').textContent=playingIndex>=0?'□':'▷';
}
function miniSvg(intervals){const p=intervals.map(i=>noteXY(mod(i),20));const pts=p.map(x=>x.join(',')).join(' ');let shape='';if(p.length>2)shape=`<polygon points="${pts}" class="mini-polygon"/>`;if(p.length===2)shape=`<polyline points="${pts}" class="mini-polygon"/>`;
  return `<svg class="mini-circle" viewBox="-30 -30 60 60" aria-hidden="true"><circle class="mini-ring" r="20"/>${shape}${p.map(([x,y])=>`<circle class="mini-node" cx="${x}" cy="${y}" r="2.2"/>`).join('')}</svg>`;
}
function renderExplore(){
  const scales=state.exploreTab==='scales',list=scales?SCALES:QUALITIES;
  document.querySelectorAll('[data-explore]').forEach(btn=>btn.classList.toggle('active',btn.dataset.explore===state.exploreTab));
  const query=byId('explore-search').value.trim().toLowerCase();
  const filtered=list.filter(v=>[v.label,v.desc,v.formula||'',v.short||''].some(n=>n.toLowerCase().includes(query)));
  byId('explore-list').innerHTML=filtered.map(x=>`<button class="explore-card" type="button" data-pick="${x.id}" data-kind="${scales?'scale':'chord'}">${miniSvg(x.intervals)}<div class="explore-meta"><div class="explore-title">${safeText(x.label)}</div><div class="explore-desc">${safeText(x.formula||x.desc)}</div></div><span class="explore-arrow">›</span></button>`).join('')||'<div class="empty-state">Ничего не найдено</div>';
}
function renderProjects(){byId('project-name').value=state.projectName;byId('project-count').textContent=String(state.projects.length).padStart(2,'0')+' SAVED';byId('saved-caption').textContent=String(state.projects.length).padStart(2,'0');
  byId('projects-list').innerHTML=state.projects.length?state.projects.map((p,i)=>`<div class="project-card"><div class="project-meta"><div class="project-title">${safeText(p.name)}</div><div class="project-details">${p.progression.length} ${russianChords(p.progression.length)} · ${new Date(p.created).toLocaleDateString('ru-RU')}</div></div><div class="project-actions"><button type="button" data-project="load" data-index="${i}">Открыть</button><button type="button" data-project="delete" data-index="${i}" aria-label="Удалить">✕</button></div></div>`).join(''):'<div class="empty-state">Сохранённых проектов пока нет.</div>';
}
function applyTheme(){let theme=state.theme;if(theme==='system')theme=window.matchMedia?.('(prefers-color-scheme: light)').matches?'light':'dark';document.body.dataset.theme=theme;document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#050505':'#fafafa';}
function renderSettings(){byId('theme-choice').value=state.theme;byId('voice-choice').value=state.voice;byId('tuning-choice').value=String(state.tuning);byId('haptics-choice').checked=state.haptics;byId('offline-status').textContent=!navigator.onLine?'Офлайн':('serviceWorker' in navigator && navigator.serviceWorker.controller?'Готово':'После установки');}
const pageNames={compose:'Compose',explore:'Explore',progression:'Progression',projects:'Projects',settings:'Settings'};
function navigate(to){if(!(to in pageNames))return;if(page!==to && to==='compose'){}page=to;document.querySelectorAll('main.screen').forEach(el=>el.classList.toggle('active',el.id==='screen-'+to));byId('page-name').textContent=pageNames[to];document.querySelectorAll('[data-tab]').forEach(btn=>btn.classList.toggle('active',btn.dataset.tab===to));
  byId('top-action').style.visibility=to==='settings'?'hidden':'visible';if(to==='settings')renderSettings();if(to==='progression')renderProgression();if(to==='projects')renderProjects();if(to==='explore')renderExplore();if(to==='compose')renderCompose();document.title=`Circa / ${pageNames[to]}`;window.scrollTo({top:0,behavior:'instant'});haptic();}
function toggleNote(pc){if(state.selected.includes(pc)){state.selected=state.selected.filter(x=>x!==pc);}else state.selected.push(pc);
  state.manual=true;const match=detectChord(state.selected,state.root);if(match){state.root=match.root;state.qualityId=match.q.id;}saveState();renderCompose();haptic();playNotes([pc],.24);
}
function relativeAngle(evt,svg){const r=svg.getBoundingClientRect();const x=evt.clientX-r.left-r.width/2,y=evt.clientY-r.top-r.height/2;return Math.atan2(y,x);}
function setupCircleGesture(){const svg=byId('chromatic-circle');
  svg.addEventListener('pointerdown',event=>{if(event.button!==0)return;gesture={id:event.pointerId,start:relativeAngle(event,svg),last:0,pc:event.target.closest('[data-pc]')?.dataset.pc,originRoot:state.root,originNotes:[...state.selected],originScaleRoot:state.scaleRoot,moved:false};svg.setPointerCapture(event.pointerId);});
  svg.addEventListener('pointermove',event=>{if(!gesture||event.pointerId!==gesture.id)return;const now=relativeAngle(event,svg);let angle=(now-gesture.start)*180/Math.PI;while(angle>180)angle-=360;while(angle< -180)angle+=360;const steps=Math.round(angle/30);if(Math.abs(angle)>11)gesture.moved=true;
    if(gesture.moved&&steps!==gesture.last){gesture.last=steps;state.root=mod(gesture.originRoot+steps);state.selected=gesture.originNotes.map(pc=>mod(pc+steps));state.scaleRoot=mod(gesture.originScaleRoot+steps);renderCompose();haptic();}
  });
  svg.addEventListener('pointerup',event=>{if(!gesture||event.pointerId!==gesture.id)return;const old=gesture;gesture=null;if(old.moved){saveState();return;}if(old.pc!==undefined)toggleNote(Number(old.pc));});
  svg.addEventListener('pointercancel',()=>{if(gesture){gesture=null;saveState();}});
  svg.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.closest('[data-pc]')){event.preventDefault();toggleNote(Number(event.target.closest('[data-pc]').dataset.pc));}});
}
async function ensureAudio(){const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx){showToast('Браузер не поддерживает Web Audio');return null;}
  try{if(!audioCtx){audioCtx=new Ctx();master=audioCtx.createGain();master.gain.value=.68;master.connect(audioCtx.destination);}if(audioCtx.state==='suspended')await audioCtx.resume();return audioCtx;}
  catch(e){showToast('Не удалось включить звук');return null;}}
function voicing(chord){if(!chord?.notes?.length)return [];
  let root=mod(chord.root);const q=QUALITIES.find(x=>x.id===chord.qualityId);
  let intervals=q?Array.from(new Set(q.intervals)).sort((a,b)=>a-b):[...new Set(chord.notes.map(pc=>mod(pc-root)))].sort((a,b)=>a-b);
  let result=intervals.map(interval=>60+root+interval);
  const inversion=Number(state.inversion)||0;
  for(let i=0;i<inversion;i++){if(!result.length)break;result.push(result.shift()+12);}
  return result;
}
function soundNote(pitch,start,duration=.85){const context=audioCtx;if(!context||!master)return;
  const a4=Number(state.tuning)||440,freq=a4*Math.pow(2,(pitch-69)/12);
  const voiceGain=context.createGain();voiceGain.gain.setValueAtTime(0.0001,start);
  const count=state.voice==='soft'?2:1;const volume=state.voice==='pluck'?.12:state.voice==='pure'?.13:.075;
  const attack=state.voice==='pluck'?.008:.025;const release=state.voice==='pluck'?.22:.31;
  const end=start+Math.max(.11,duration);
  voiceGain.gain.exponentialRampToValueAtTime(volume,start+attack);
  if(state.voice==='pluck')voiceGain.gain.exponentialRampToValueAtTime(0.0002,end+release);
  else{voiceGain.gain.setValueAtTime(volume,end);voiceGain.gain.exponentialRampToValueAtTime(0.0002,end+release);}
  let output=voiceGain;
  if(state.voice==='soft'){const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1900;filter.Q.value=.35;voiceGain.connect(filter);output=filter;}
  output.connect(master);
  const oscs=[];
  for(let i=0;i<count;i++){
    const osc=context.createOscillator();osc.type=state.voice==='pure'?'sine':state.voice==='pluck'?'triangle':i?'sine':'triangle';osc.frequency.setValueAtTime(i?freq*2:freq,start);osc.connect(voiceGain);osc.start(start);osc.stop(end+release+.07);oscs.push(osc);
  }
  const voice={gain:voiceGain,oscs};currentVoices.push(voice);
  oscs[0].onended=()=>{voiceGain.disconnect();output!==voiceGain&&output.disconnect();currentVoices=currentVoices.filter(v=>v!==voice);};
}
async function playNotes(notes,duration=1.2){if(!notes.length)return;const ctx=await ensureAudio();if(!ctx)return;const start=ctx.currentTime+.012;notes.forEach(pc=>soundNote(60+mod(pc),start,duration));}
async function previewChord(){if(!state.selected.length)return showToast('Выбери ноты на круге');const ctx=await ensureAudio();if(!ctx)return;const chord=getCurrentChord();voicing(chord).forEach(n=>soundNote(n,ctx.currentTime+.01,1.15));haptic();}
function stopPlayback(){playToken++;if(playTimer!==null){clearTimeout(playTimer);playTimer=null;}playingIndex=-1;if(audioCtx){const now=audioCtx.currentTime;for(const voice of currentVoices){try{voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setTargetAtTime(0.0001,now,.012);}catch(e){}}}renderProgression();}
async function startPlayback(){if(!state.progression.length)return showToast('Добавь хотя бы один аккорд');const ctx=await ensureAudio();if(!ctx)return;
  stopPlayback();const token=++playToken;const step=()=>{if(token!==playToken)return;if(playingIndex+1>=state.progression.length){if(!state.loop){stopPlayback();return;}playingIndex=-1;}
    playingIndex++;const chord=state.progression[playingIndex],duration=60/state.bpm*state.beats;
    voicing(chord).forEach(n=>soundNote(n,ctx.currentTime+.012,Math.max(.15,duration-.065)));
    renderProgression();playTimer=setTimeout(step,duration*1000);
  };step();haptic();}
function midiVlq(n){let bytes=[n&0x7f];while((n>>=7)>0)bytes.unshift((n&0x7f)|0x80);return bytes;}
function midiUint32(n){return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255];}
function makeMidi(){const ticks=480,us=Math.round(60000000/state.bpm),duration=ticks*state.beats;let track=[];const event=(delta,bytes)=>{track.push(...midiVlq(delta),...bytes);};
  event(0,[0xff,0x51,0x03,(us>>16)&255,(us>>8)&255,us&255]);event(0,[0xff,0x58,0x04,4,2,24,8]);event(0,[0xc0,0]);
  for(const chord of state.progression){const pitches=voicing(chord).filter(n=>n>=0&&n<=127);if(!pitches.length){event(duration,[0xff,0x01,0]);continue;}
    pitches.forEach(n=>event(0,[0x90,n,82]));pitches.forEach((n,i)=>event(i===0?duration:0,[0x80,n,0]));
  }
  event(0,[0xff,0x2f,0]);
  const hdr=[0x4d,0x54,0x68,0x64,0,0,0,6,0,0,0,1,(ticks>>8)&255,ticks&255];
  const chunk=[0x4d,0x54,0x72,0x6b,...midiUint32(track.length),...track];
  return new Blob([new Uint8Array([...hdr,...chunk])],{type:'audio/midi'});
}
function midiFilename(){return 'circa-'+new Date().toISOString().slice(0,10)+'.mid';}
function exportMidi(){if(!state.progression.length)return showToast('В прогрессии нет аккордов');const file=makeMidi(),link=document.createElement('a'),url=URL.createObjectURL(file);link.href=url;link.download=midiFilename();document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);showToast('MIDI подготовлен для сохранения');}
async function shareMidi(){if(!state.progression.length)return showToast('В прогрессии нет аккордов');const file=new File([makeMidi()],midiFilename(),{type:'audio/midi'});
  if(navigator.canShare?.({files:[file]})&&navigator.share){try{await navigator.share({files:[file],title:'Circa — MIDI progression'});return;}catch(e){if(e.name==='AbortError')return;}}
  exportMidi();showToast('Открыт экспорт. Если меню «Поделиться» недоступно, файл можно сохранить через Safari.');
}
function saveProject(){const name=state.projectName.trim()||'Без названия';const snapshot={id:Date.now()+'-'+Math.random().toString(16).slice(2,7),name,created:Date.now(),progression:state.progression.map(c=>({...c,notes:[...c.notes]})),bpm:state.bpm,beats:state.beats,inversion:state.inversion};state.projects.unshift(snapshot);state.projects=state.projects.slice(0,100);saveState();renderProjects();haptic();showToast('Проект сохранён');}
function projectAction(action,index){const p=state.projects[index];if(!p)return;
  if(action==='delete'){if(!confirm(`Удалить «${p.name}»?`))return;state.projects.splice(index,1);saveState();renderProjects();showToast('Проект удалён');}
  if(action==='load'){if(state.progression.length&&!confirm('Открыть сохранённый проект? Текущая прогрессия будет заменена (её можно сохранить отдельно).'))return;stopPlayback();state.projectName=p.name;state.progression=p.progression.map(c=>({...c,notes:[...c.notes]}));state.bpm=clamp(Number(p.bpm)||120,40,240);state.beats=[1,2,4,8].includes(Number(p.beats))?Number(p.beats):4;state.inversion=clamp(Number(p.inversion)||0,0,3);saveState();navigate('progression');showToast(`Открыт проект «${p.name}»`);}
}
function showModal(title,html){byId('modal-content').innerHTML=`<h2>${safeText(title)}</h2>${html}`;byId('modal').showModal();}
function setupEvents(){
  document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>navigate(btn.dataset.tab)));
  byId('nav-add').addEventListener('click',()=>{if(page!=='compose'){navigate('compose');showToast('Выбери аккорд и нажми «Добавить»');}else addChord();});
  byId('top-action').addEventListener('click',()=>showModal('Circa', '<button type="button" class="outline-action with-arrow" data-menu="settings"><span>Настройки</span><span>↗</span></button><button type="button" class="outline-action with-arrow" data-menu="help"><span>Как пользоваться</span><span>↗</span></button>'));
  byId('modal-content').addEventListener('click',e=>{const b=e.target.closest('[data-menu]');if(!b)return;if(b.dataset.menu==='settings'){byId('modal').close();navigate('settings');}else showModal('Как пользоваться','<p>Выбирай тонику и тип аккорда или нажимай ноты на круге. Потяни фигуру вокруг окружности, чтобы транспонировать её на нужное количество полутонов.</p><p>Кнопка ▶ воспроизводит аккорд. Добавь его в прогрессию, настрой темп и экспортируй MIDI.</p>');});
  byId('root-pills').addEventListener('click',e=>{const btn=e.target.closest('[data-root]');if(btn)preset(Number(btn.dataset.root),state.qualityId);});
  byId('quality-pills').addEventListener('click',e=>{const btn=e.target.closest('[data-quality]');if(btn)preset(state.root,btn.dataset.quality);});
  byId('show-all-chords').addEventListener('click',()=>{state.exploreTab='chords';navigate('explore');});
  byId('transpose-down').addEventListener('click',()=>transpose(-1));byId('transpose-up').addEventListener('click',()=>transpose(1));
  byId('listen-chord').addEventListener('click',previewChord);byId('add-to-progression').addEventListener('click',addChord);
  byId('scale-notice').addEventListener('click',e=>{if(e.target.closest('#remove-scale')){state.scaleId=null;saveState();renderCompose();}});
  const piano=byId('piano');piano.addEventListener('click',e=>{const key=e.target.closest('[data-key]');if(key){playNotes([Number(key.dataset.key)],.3);haptic();}});
  piano.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const key=e.target.closest('[data-key]');if(key){e.preventDefault();playNotes([Number(key.dataset.key)],.3);}}});
  byId('progression-cards').addEventListener('click',e=>{const btn=e.target.closest('[data-seq-action]');if(btn)updateProgressionItem(Number(btn.dataset.index),btn.dataset.seqAction);});
  byId('new-chord').addEventListener('click',()=>navigate('compose'));
  byId('clear-progression').addEventListener('click',()=>{if(!state.progression.length)return;if(!confirm('Очистить всю последовательность?'))return;stopPlayback();state.progression=[];saveState();renderProgression();renderCompose();});
  byId('bpm').addEventListener('change',e=>{state.bpm=clamp(Math.round(Number(e.target.value)||120),40,240);stopPlayback();saveState();renderProgression();});
  byId('beats').addEventListener('change',e=>{state.beats=Number(e.target.value);stopPlayback();saveState();});
  byId('inversion').addEventListener('change',e=>{state.inversion=Number(e.target.value);stopPlayback();saveState();});
  byId('loop').addEventListener('change',e=>{state.loop=e.target.checked;saveState();});
  byId('play-progression').addEventListener('click',()=>{playingIndex>=0?stopPlayback():startPlayback();});
  byId('export-midi').addEventListener('click',exportMidi);byId('share-midi').addEventListener('click',shareMidi);
  document.querySelectorAll('[data-explore]').forEach(btn=>btn.addEventListener('click',()=>{state.exploreTab=btn.dataset.explore;byId('explore-search').value='';saveState();renderExplore();}));
  byId('explore-search').addEventListener('input',renderExplore);
  byId('explore-list').addEventListener('click',e=>{const btn=e.target.closest('[data-pick]');if(!btn)return;
    if(btn.dataset.kind==='scale'){state.scaleId=btn.dataset.pick;state.scaleRoot=state.root;saveState();navigate('compose');showToast('Гамма подсвечена на круге');}
    else{preset(state.root,btn.dataset.pick);navigate('compose');}
  });
  byId('project-name').addEventListener('change',e=>{state.projectName=e.target.value.slice(0,60);saveState();});
  byId('save-project').addEventListener('click',()=>{state.projectName=byId('project-name').value.slice(0,60);saveProject();});
  byId('projects-list').addEventListener('click',e=>{const b=e.target.closest('[data-project]');if(b)projectAction(b.dataset.project,Number(b.dataset.index));});
  byId('theme-choice').addEventListener('change',e=>{state.theme=e.target.value;applyTheme();saveState();});
  byId('voice-choice').addEventListener('change',e=>{state.voice=e.target.value;saveState();});
  byId('tuning-choice').addEventListener('change',e=>{state.tuning=Number(e.target.value);saveState();});
  byId('haptics-choice').addEventListener('change',e=>{state.haptics=e.target.checked;saveState();haptic();});
  byId('install-guide').addEventListener('click',()=>showModal('Установка на iPhone','<ol><li>Опубликуй папку Circa на GitHub Pages или другом HTTPS-хостинге.</li><li>Открой опубликованный адрес в <strong>Safari</strong>.</li><li>Нажми «Поделиться» и выбери «На экран Домой».</li><li>Открой Circa с домашнего экрана. После первой загрузки интерфейс и инструменты доступны без интернета.</li></ol><p>При запуске через локальный файл или без HTTPS полноценная установка PWA недоступна.</p>'));
  byId('close-modal').addEventListener('click',()=>byId('modal').close());
  window.addEventListener('online',renderSettings);window.addEventListener('offline',renderSettings);
  if(window.matchMedia){const mq=window.matchMedia('(prefers-color-scheme: light)');mq.addEventListener?.('change',()=>{if(state.theme==='system')applyTheme();});}
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playingIndex>=0)stopPlayback();});
  setupCircleGesture();
}
function init(){setupIcons();applyTheme();setupEvents();renderCompose();renderProgression();renderExplore();renderProjects();renderSettings();
  if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('Service worker unavailable',e));
}
init();
