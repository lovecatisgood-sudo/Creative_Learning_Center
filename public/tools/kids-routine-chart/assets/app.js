(() => {
  const app=document.querySelector('[data-routine-app]'); if(!app) return;
  const lang=app.dataset.lang||'th', pageKey=app.dataset.routine||'main';
  const requestedPreset=new URLSearchParams(window.location.search).get('preset');
  const t=lang==='th'?{
    routineTitle:'ตารางของเรา', empty:'ลากกิจกรรมมาวางที่นี่ หรือแตะกิจกรรมทางซ้ายเพื่อเพิ่ม',
    added:'เพิ่มกิจกรรมแล้ว', saved:'บันทึกในเครื่องนี้แล้ว', reset:'เริ่มใหม่แล้ว', png:'ดาวน์โหลด PNG แล้ว',
    confirmReset:'เริ่มใหม่และแทนที่กิจวัตรที่แก้ไขอยู่หรือไม่?', nameFallback:'ตารางกิจวัตรของฉัน', brand:'Siamese Cat Creative Club', free:'เครื่องมือฟรีสำหรับครอบครัว',
    complete:'ทำเสร็จ', remove:'ลบ', up:'เลื่อนขึ้น', down:'เลื่อนลง', time:'เวลา'
  }:{
    routineTitle:'My routine', empty:'Drag activities here, or click an activity on the left to add it.',
    added:'Activity added', saved:'Saved on this device', reset:'Starter routine restored', png:'PNG downloaded',
    confirmReset:'Replace your current edits with the starter routine?', nameFallback:'My Routine Chart', brand:'Siamese Cat Creative Club', free:'Free family tool',
    complete:'Complete', remove:'Remove', up:'Move up', down:'Move down', time:'Time'
  };
  const activities={
    wake:{emoji:'☀️',en:'Wake up',th:'ตื่นนอน'}, toilet:{emoji:'🚽',en:'Toilet',th:'เข้าห้องน้ำ'}, brush:{emoji:'🪥',en:'Brush teeth',th:'แปรงฟัน'},
    dress:{emoji:'👕',en:'Get dressed',th:'แต่งตัว'}, breakfast:{emoji:'🥣',en:'Breakfast',th:'อาหารเช้า'}, bag:{emoji:'🎒',en:'Pack school bag',th:'จัดกระเป๋า'},
    school:{emoji:'🏫',en:'Go to school',th:'ไปโรงเรียน'}, arrive:{emoji:'🏠',en:'Arrive home',th:'กลับถึงบ้าน'}, snack:{emoji:'🍎',en:'Snack',th:'ของว่าง'},
    homework:{emoji:'📚',en:'Homework',th:'ทำการบ้าน'}, creative:{emoji:'🎨',en:'Creative time',th:'เวลาสร้างสรรค์'}, lego:{emoji:'🧱',en:'LEGO / building',th:'เลโก้ / ต่อบล็อก'},
    outdoor:{emoji:'🛝',en:'Outdoor play',th:'เล่นกลางแจ้ง'}, chores:{emoji:'🧺',en:'Small chore',th:'งานบ้านเล็ก ๆ'}, dinner:{emoji:'🍽️',en:'Dinner',th:'อาหารเย็น'},
    shower:{emoji:'🛁',en:'Shower / bath',th:'อาบน้ำ'}, pajamas:{emoji:'🌙',en:'Pajamas',th:'ใส่ชุดนอน'}, reading:{emoji:'📖',en:'Reading',th:'อ่านหนังสือ'},
    quiet:{emoji:'🧸',en:'Quiet time',th:'เวลาสงบ'}, tomorrow:{emoji:'✅',en:'Prepare for tomorrow',th:'เตรียมของพรุ่งนี้'}, sleep:{emoji:'😴',en:'Sleep',th:'เข้านอน'},
    family:{emoji:'💛',en:'Family time',th:'เวลาครอบครัว'}, lunch:{emoji:'🍱',en:'Lunch',th:'อาหารกลางวัน'}
  };
  const presets={
    morning:{
      '3-5':[['wake','07:00'],['toilet','07:05'],['brush','07:10'],['dress','07:20'],['breakfast','07:35'],['bag','08:00']],
      '6-8':[['wake','06:30'],['toilet','06:35'],['brush','06:40'],['dress','06:50'],['breakfast','07:10'],['bag','07:30'],['school','07:40']],
      '9-12':[['wake','06:20'],['brush','06:30'],['dress','06:40'],['breakfast','07:00'],['bag','07:20'],['tomorrow','07:25'],['school','07:35']]},
    'after-school':{
      '3-5':[['arrive','15:30'],['snack','15:40'],['quiet','16:00'],['creative','16:30'],['outdoor','17:00'],['dinner','18:00'],['shower','18:40'],['reading','19:10']],
      '6-8':[['arrive','15:30'],['snack','15:40'],['homework','16:00'],['creative','16:40'],['lego','17:10'],['dinner','18:00'],['shower','18:40'],['reading','19:10'],['sleep','20:00']],
      '9-12':[['arrive','16:00'],['snack','16:10'],['quiet','16:30'],['homework','17:00'],['chores','18:00'],['dinner','18:30'],['shower','19:10'],['tomorrow','19:40'],['reading','20:00'],['sleep','21:00']]},
    bedtime:{
      '3-5':[['dinner','18:00'],['quiet','18:40'],['shower','19:00'],['pajamas','19:20'],['brush','19:25'],['reading','19:35'],['sleep','20:00']],
      '6-8':[['dinner','18:15'],['chores','18:45'],['shower','19:10'],['pajamas','19:30'],['brush','19:35'],['tomorrow','19:40'],['reading','19:50'],['sleep','20:30']],
      '9-12':[['dinner','18:30'],['chores','19:00'],['shower','19:30'],['tomorrow','20:00'],['quiet','20:15'],['brush','20:35'],['reading','20:40'],['sleep','21:15']]},
    weekend:{
      '3-5':[['wake','07:30'],['breakfast','08:00'],['outdoor','09:00'],['creative','10:30'],['lunch','12:00'],['quiet','13:00'],['family','15:00'],['dinner','18:00'],['reading','19:15']],
      '6-8':[['wake','07:30'],['breakfast','08:00'],['chores','08:45'],['outdoor','09:30'],['creative','11:00'],['lunch','12:30'],['quiet','13:30'],['family','15:00'],['reading','19:30']],
      '9-12':[['wake','08:00'],['breakfast','08:30'],['chores','09:15'],['outdoor','10:00'],['lunch','12:30'],['creative','14:00'],['family','16:00'],['tomorrow','19:00'],['reading','20:00']]}
  };
  const allowedPresets=new Set(['morning','after-school','bedtime','weekend']);
  let key=allowedPresets.has(requestedPreset)?requestedPreset:(pageKey==='main'?'morning':pageKey);
  function track(eventName){if(typeof window.gtag==='function')window.gtag('event',eventName,{tool_name:'kids_routine_chart',routine_preset:key})}
  const storageKey=`scroutine:${lang}:${key}`;
  const nameEl=document.querySelector('#child-name'), ageEl=document.querySelector('#age-band'), themeEl=document.querySelector('#theme-select');
  const listEl=document.querySelector('#routine-list'), emptyEl=document.querySelector('#empty-state'), drop=document.querySelector('#drop-zone');
  const progressEl=document.querySelector('#progress-count');
  const labels={th:{morning:'กิจวัตรตอนเช้า','after-school':'กิจวัตรหลังเลิกเรียน',bedtime:'กิจวัตรก่อนนอน',weekend:'กิจวัตรวันหยุด'},en:{morning:'Morning Routine','after-school':'After-School Routine',bedtime:'Bedtime Routine',weekend:'Weekend Routine'}};
  let state={name:'',age:'6-8',theme:'classic',items:[]};
  function starter(){return presets[key][state.age].map(([id,time])=>({uid:crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2),id,emoji:activities[id].emoji,label:activities[id][lang],time,done:false}))}
  function load(){try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null'); if(saved&&Array.isArray(saved.items))state=saved; else state.items=starter()}catch(e){state.items=starter()} nameEl.value=state.name||'';ageEl.value=state.age||'6-8';themeEl.value=state.theme||'classic';render()}
  function save(show=false){state.name=nameEl.value.trim();state.age=ageEl.value;state.theme=themeEl.value;try{localStorage.setItem(storageKey,JSON.stringify(state))}catch(e){} if(show)toast(t.saved)}
  function render(){listEl.textContent=''; emptyEl.hidden=state.items.length>0; listEl.hidden=state.items.length===0; drop.dataset.theme=state.theme;
    state.items.forEach((item,idx)=>{const li=document.createElement('li');li.className='routine-item'+(item.done?' completed':'');li.draggable=true;li.dataset.uid=item.uid;
      const drag=document.createElement('button');drag.type='button';drag.className='drag-handle';drag.title='Drag';drag.setAttribute('aria-label','Drag');drag.textContent='⋮⋮';
      const check=document.createElement('button');check.type='button';check.className='check';check.title=t.complete;check.setAttribute('aria-label',t.complete);check.textContent='✓';
      const em=document.createElement('div');em.className='item-emoji';em.textContent=item.emoji;
      const time=document.createElement('input');time.className='item-time';time.type='time';time.value=item.time||'';time.setAttribute('aria-label',t.time);
      const label=document.createElement('div');label.className='item-label';label.textContent=item.label;
      const acts=document.createElement('div');acts.className='row-actions';
      const up=iconBtn('↑',t.up,()=>move(idx,idx-1));const down=iconBtn('↓',t.down,()=>move(idx,idx+1));const del=iconBtn('×',t.remove,()=>{state.items.splice(idx,1);save();render()});acts.append(up,down,del);
      check.addEventListener('click',()=>{item.done=!item.done;save();render()}); time.addEventListener('change',()=>{item.time=time.value;save();});
      li.addEventListener('dragstart',e=>{li.classList.add('dragging');e.dataTransfer.setData('text/routine-uid',item.uid);e.dataTransfer.effectAllowed='move'}); li.addEventListener('dragend',()=>li.classList.remove('dragging'));
      li.append(drag,check,em,time,label,acts); listEl.append(li)
    });
    const done=state.items.filter(x=>x.done).length;progressEl.textContent=`${done}/${state.items.length}`;
    document.querySelector('#routine-display-title').textContent=(state.name?state.name+' · ':'')+labels[lang][key];
  }
  function iconBtn(txt,label,fn){const b=document.createElement('button');b.type='button';b.className='icon-btn';b.textContent=txt;b.title=label;b.setAttribute('aria-label',label);b.addEventListener('click',fn);return b}
  function move(a,b){if(b<0||b>=state.items.length)return;const [x]=state.items.splice(a,1);state.items.splice(b,0,x);save();render()}
  function addActivity(id){const a=activities[id]; if(!a)return;state.items.push({uid:crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2),id,emoji:a.emoji,label:a[lang],time:'',done:false});save();render();toast(t.added)}
  document.querySelectorAll('.activity-card').forEach(card=>{card.addEventListener('click',()=>addActivity(card.dataset.activity));card.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/library-id',card.dataset.activity);e.dataTransfer.effectAllowed='copy'})});
  drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('is-over')});drop.addEventListener('dragleave',()=>drop.classList.remove('is-over'));drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('is-over');const id=e.dataTransfer.getData('text/library-id');if(id){addActivity(id);return}const uid=e.dataTransfer.getData('text/routine-uid');if(!uid)return;const from=state.items.findIndex(x=>x.uid===uid);const target=e.target.closest('.routine-item');let to=target?state.items.findIndex(x=>x.uid===target.dataset.uid):state.items.length-1;if(from<0||to<0)return;const [x]=state.items.splice(from,1);state.items.splice(to,0,x);save();render()});
  document.querySelector('#custom-add').addEventListener('submit',e=>{e.preventDefault();const emoji=e.currentTarget.elements.emoji.value.trim()||'⭐';const label=e.currentTarget.elements.label.value.trim();if(!label)return;state.items.push({uid:crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2),id:'custom',emoji,label,time:'',done:false});e.currentTarget.reset();save();render();toast(t.added)});
  ageEl.addEventListener('change',()=>{state.age=ageEl.value;save()});themeEl.addEventListener('change',()=>{state.theme=themeEl.value;save();render()});nameEl.addEventListener('input',()=>{state.name=nameEl.value;save();render()});
  document.querySelector('#starter-btn').addEventListener('click',()=>{if(state.items.length&&!confirm(t.confirmReset))return;state.age=ageEl.value;state.items=starter();save();render();toast(t.reset)});
  document.querySelector('#save-btn').addEventListener('click',()=>save(true));document.querySelector('#print-btn').addEventListener('click',()=>window.print());document.querySelector('#download-btn').addEventListener('click',downloadPng);
  document.querySelector('#clear-checks-btn').addEventListener('click',()=>{state.items.forEach(x=>x.done=false);save();render()});
  function toast(msg){const el=document.querySelector('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove('show'),1800)}
  function wrapText(ctx,text,maxWidth){const words=text.split(/\s+/);const lines=[];let line='';for(const w of words){const test=line?line+' '+w:w;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=w}else line=test}if(line)lines.push(line);return lines}
  function downloadPng(){const width=1400,rowH=104,headH=250,footH=110,height=headH+Math.max(1,state.items.length)*rowH+footH;const c=document.createElement('canvas');c.width=width;c.height=height;const x=c.getContext('2d');
    x.fillStyle='#f7f3ea';x.fillRect(0,0,width,height);x.fillStyle='#347a5a';x.fillRect(0,0,width,22);x.fillStyle='#3c3027';x.font='700 58px Georgia,serif';x.fillText(state.name||t.nameFallback,72,92);x.fillStyle='#347a5a';x.font='700 31px system-ui,sans-serif';x.fillText(labels[lang][key],72,142);x.fillStyle='#746657';x.font='24px system-ui,sans-serif';x.fillText(`${t.free} · ${state.age}`,72,184);
    state.items.forEach((it,i)=>{const y=headH+i*rowH;x.fillStyle=it.done?'#eef5ed':'#fffdf8';roundRect(x,62,y,1276,rowH-14,20,true,false);x.strokeStyle='#ded4c4';x.lineWidth=2;roundRect(x,62,y,1276,rowH-14,20,false,true);x.font='40px serif';x.fillText(it.emoji,94,y+58);x.fillStyle='#746657';x.font='23px system-ui,sans-serif';x.fillText(it.time||'—',170,y+55);x.fillStyle='#3c3027';x.font='700 28px system-ui,sans-serif';const lines=wrapText(x,it.label,780);lines.slice(0,2).forEach((line,j)=>x.fillText(line,300,y+48+j*31));x.fillStyle=it.done?'#347a5a':'#e5a85d';x.beginPath();x.arc(1288,y+45,21,0,Math.PI*2);x.fill();if(it.done){x.fillStyle='#fff';x.font='700 23px system-ui';x.fillText('✓',1278,y+53)}});
    const fy=height-72;x.fillStyle='#746657';x.font='22px system-ui,sans-serif';x.fillText(`${t.brand} · creative.siamesecat.cafe/tools/kids-routine-chart`,72,fy);const a=document.createElement('a');a.download=`kids-routine-${key}.png`;a.href=c.toDataURL('image/png');a.click();track('tool_export_png');toast(t.png)}
  function roundRect(ctx,x,y,w,h,r,fill,stroke){if(w<2*r)r=w/2;if(h<2*r)r=h/2;ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();if(fill)ctx.fill();if(stroke)ctx.stroke()}
  document.querySelectorAll('.routine-tabs a').forEach(link=>{if(new URL(link.href).searchParams.get('preset')===key)link.setAttribute('aria-current','page')});
  document.querySelector('#print-btn').addEventListener('click',()=>track('tool_print'));
  const navToggle=document.querySelector('.nav-toggle'),nav=document.querySelector('.main-nav');if(navToggle)navToggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');navToggle.setAttribute('aria-expanded',open?'true':'false')});
  load();
})();
