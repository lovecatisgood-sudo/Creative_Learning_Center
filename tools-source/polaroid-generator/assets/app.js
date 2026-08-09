(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const canvas = $('#previewCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  const locale = document.documentElement.lang.startsWith('th') ? 'th' : 'en';
  const track = (eventName) => {
    if (typeof window.gtag === 'function') window.gtag('event', eventName, { tool_name: 'polaroid_generator' });
  };
  const copy = {
    en: { ready:'Ready — your photo stays on this device.', loaded:'Photo loaded. Drag the photo inside the frame to reposition it.', saved:'PNG downloaded.', paste:'Image pasted from clipboard.', invalid:'Please choose a JPG, PNG, WebP or other browser-supported image.', none:'Add a photo first.', processing:'Preparing image…' },
    th: { ready:'พร้อมใช้งาน — รูปของคุณอยู่บนอุปกรณ์นี้เท่านั้น', loaded:'โหลดรูปแล้ว ลากรูปในกรอบเพื่อจัดตำแหน่งได้', saved:'ดาวน์โหลดไฟล์ PNG แล้ว', paste:'วางรูปจากคลิปบอร์ดแล้ว', invalid:'กรุณาเลือกไฟล์ JPG, PNG, WebP หรือไฟล์รูปที่เบราว์เซอร์รองรับ', none:'กรุณาเพิ่มรูปก่อน', processing:'กำลังเตรียมรูป…' }
  }[locale];
  const state = {
    ratio:'square', padding:56, bottom:148, radius:8, frame:'#fffaf2', caption:(document.documentElement.lang.startsWith('th') ? 'ความทรงจำที่บางนา ♡' : 'Bangna memories ♡'),
    font:'hand', fontSize:32, shadow:true, texture:true, rotation:-3, zoom:1,
    brightness:100, contrast:100, saturation:100, warmth:0, fade:0, grain:8,
    quality:2, image:null, imageW:0, imageH:0, offsetX:0, offsetY:0
  };
  const ratioMap = {
    square:[1000,1000], portrait:[800,1100], wide:[1000,625]
  };
  const fontMap = {
    hand:'cursive', serif:'Georgia, "Times New Roman", serif', sans:'Arial, Tahoma, "Noto Sans Thai", sans-serif', mono:'"Courier New", monospace'
  };
  let geom = null, drag = null, grainTile = null, paperTile = null;

  function status(msg){ const el=$('#status'); if(el) el.textContent=msg || ''; }
  function makeNoiseTile(size, alpha, warm=false){
    const c=document.createElement('canvas'); c.width=c.height=size; const x=c.getContext('2d');
    const id=x.createImageData(size,size); const d=id.data;
    for(let i=0;i<d.length;i+=4){
      const n=Math.random()*255; const base=warm ? 150+n*.2 : n;
      d[i]=warm?base:n; d[i+1]=warm?base*.94:n; d[i+2]=warm?base*.82:n; d[i+3]=Math.random()*alpha;
    }
    x.putImageData(id,0,0); return c;
  }
  grainTile=makeNoiseTile(96,42,false); paperTile=makeNoiseTile(96,26,true);

  function roundedRectPath(c,x,y,w,h,r){
    r=Math.min(r,w/2,h/2); c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath();
  }
  function getBase(){
    const [pw,ph]=ratioMap[state.ratio];
    const cardW=pw+state.padding*2, cardH=ph+state.padding+state.bottom;
    const rad=Math.abs(state.rotation)*Math.PI/180, cs=Math.abs(Math.cos(rad)), sn=Math.abs(Math.sin(rad));
    return {pw,ph,cardW,cardH,boundW:Math.ceil(cardW*cs+cardH*sn+80),boundH:Math.ceil(cardW*sn+cardH*cs+80)};
  }
  function drawPhoto(c, x, y, w, h, scale){
    c.save(); roundedRectPath(c,x,y,w,h,state.radius*scale); c.clip();
    if(state.image){
      const cover=Math.max(w/state.imageW,h/state.imageH)*state.zoom;
      const dw=state.imageW*cover, dh=state.imageH*cover;
      const dx=x+(w-dw)/2+state.offsetX*w*.5, dy=y+(h-dh)/2+state.offsetY*h*.5;
      c.filter=`brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%) sepia(${Math.max(0,state.warmth)*.32}%)`;
      c.drawImage(state.image,dx,dy,dw,dh); c.filter='none';
      if(state.warmth<0){ c.globalCompositeOperation='source-atop'; c.globalAlpha=Math.min(.16,Math.abs(state.warmth)/100*.16); c.fillStyle='#7aa8cf'; c.fillRect(x,y,w,h); c.globalCompositeOperation='source-over'; c.globalAlpha=1; }
      if(state.fade>0){ c.globalAlpha=state.fade/100*.32; c.fillStyle='#fff8ec'; c.fillRect(x,y,w,h); c.globalAlpha=1; }
      if(state.grain>0){ c.globalAlpha=state.grain/100*.18; c.globalCompositeOperation='soft-light'; const p=c.createPattern(grainTile,'repeat'); c.fillStyle=p; c.fillRect(x,y,w,h); c.globalCompositeOperation='source-over'; c.globalAlpha=1; }
    } else {
      const g=c.createLinearGradient(x,y,x+w,y+h); g.addColorStop(0,'#79aaa6'); g.addColorStop(1,'#eccba4'); c.fillStyle=g; c.fillRect(x,y,w,h);
      c.strokeStyle='rgba(255,255,255,.86)'; c.lineWidth=Math.max(2,4*scale); c.strokeRect(x+w*.32,y+h*.28,w*.36,h*.28);
      c.beginPath(); c.moveTo(x+w*.5,y+h*.35); c.lineTo(x+w*.5,y+h*.49); c.moveTo(x+w*.43,y+h*.42); c.lineTo(x+w*.57,y+h*.42); c.stroke();
      c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='rgba(255,255,255,.92)'; c.font=`700 ${Math.max(16,26*scale)}px Arial, Tahoma, sans-serif`; c.fillText(locale==='th'?'เพิ่มรูปของคุณ':'Add your photo',x+w/2,y+h*.66);
    }
    c.restore();
  }
  function render(target=canvas, scale=1, record=true){
    const base=getBase(), rad=state.rotation*Math.PI/180;
    const W=Math.max(1,Math.round(base.boundW*scale)), H=Math.max(1,Math.round(base.boundH*scale));
    target.width=W; target.height=H; const c=target.getContext('2d',{alpha:true}); c.clearRect(0,0,W,H);
    const cardW=base.cardW*scale, cardH=base.cardH*scale, pw=base.pw*scale, ph=base.ph*scale, pad=state.padding*scale;
    c.save(); c.translate(W/2,H/2); c.rotate(rad); c.translate(-cardW/2,-cardH/2);
    if(state.shadow){ c.shadowColor='rgba(45,31,22,.28)'; c.shadowBlur=32*scale; c.shadowOffsetY=18*scale; }
    roundedRectPath(c,0,0,cardW,cardH,Math.max(4,state.radius*scale*.65)); c.fillStyle=state.frame; c.fill(); c.shadowColor='transparent';
    if(state.texture){ c.save(); roundedRectPath(c,0,0,cardW,cardH,Math.max(4,state.radius*scale*.65)); c.clip(); c.globalAlpha=.32; c.globalCompositeOperation='multiply'; c.fillStyle=c.createPattern(paperTile,'repeat'); c.fillRect(0,0,cardW,cardH); c.restore(); }
    drawPhoto(c,pad,pad,pw,ph,scale);
    if(state.caption.trim()){
      c.fillStyle=state.frame.toLowerCase()==='#252321' ? '#f6efe6' : '#423a34'; c.textAlign='center'; c.textBaseline='middle';
      c.font=`${Math.max(12,state.fontSize*scale)}px ${fontMap[state.font]}`;
      const maxW=cardW-pad*1.2; let text=state.caption.trim();
      while(c.measureText(text).width>maxW && text.length>3) text=text.slice(0,-2)+'…';
      c.fillText(text,cardW/2,pad+ph+(cardH-pad-ph)/2+4*scale);
    }
    c.restore();
    if(record){
      geom={...base,canvasW:W,canvasH:H,scale,rad,pad:state.padding,photoX:state.padding,photoY:state.padding};
      const dims=$('#dimensions'); if(dims) dims.textContent=`${Math.round(base.boundW*state.quality)} × ${Math.round(base.boundH*state.quality)} px`;
    }
  }
  function update(){
    render();
    $$('[data-ratio]').forEach(b=>b.classList.toggle('active',b.dataset.ratio===state.ratio));
    $$('[data-frame]').forEach(b=>b.classList.toggle('active',b.dataset.frame.toLowerCase()===state.frame.toLowerCase()));
    const map={padding:state.padding,bottom:state.bottom,radius:state.radius,rotation:state.rotation,zoom:Math.round(state.zoom*100),brightness:state.brightness,contrast:state.contrast,saturation:state.saturation,warmth:state.warmth,fade:state.fade,grain:state.grain,fontSize:state.fontSize};
    Object.entries(map).forEach(([k,v])=>{const o=$(`[data-output="${k}"]`); if(o) o.textContent=k==='zoom'?`${v}%`:k==='rotation'?`${v}°`:k==='fontSize'?`${v}px`:String(v)});
  }
  async function loadFile(file){
    if(!file || !file.type.startsWith('image/')){ status(copy.invalid); return; }
    status(copy.processing);
    try{
      let source;
      if ('createImageBitmap' in window) {
        source=await createImageBitmap(file);
      } else {
        source=await new Promise((resolve,reject)=>{
          const img=new Image(); const url=URL.createObjectURL(file);
          img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};
          img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Image decode failed'))};
          img.src=url;
        });
      }
      const sw=source.width||source.naturalWidth, sh=source.height||source.naturalHeight;
      const max=4096, ratio=Math.min(1,max/Math.max(sw,sh));
      if(ratio<1){
        const c=document.createElement('canvas'); c.width=Math.round(sw*ratio); c.height=Math.round(sh*ratio); c.getContext('2d').drawImage(source,0,0,c.width,c.height);
        state.image=c; source.close?.();
      } else state.image=source;
      state.imageW=state.image.width||state.image.naturalWidth; state.imageH=state.image.height||state.image.naturalHeight; state.offsetX=state.offsetY=0; state.zoom=1;
      const zi=$('#zoom'); if(zi) zi.value='1'; update(); status(copy.loaded); track('tool_image_loaded');
    }catch(e){ console.error(e); status(copy.invalid); }
  }
  $('#fileInput')?.addEventListener('change',e=>loadFile(e.target.files?.[0]));
  $('#dropzone')?.addEventListener('click',()=>$('#fileInput')?.click());
  $('#dropzone')?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#fileInput')?.click();}});
  ['dragenter','dragover'].forEach(ev=>$('#dropzone')?.addEventListener(ev,e=>{e.preventDefault();e.currentTarget.classList.add('dragover')}));
  ['dragleave','drop'].forEach(ev=>$('#dropzone')?.addEventListener(ev,e=>{e.preventDefault();e.currentTarget.classList.remove('dragover')}));
  $('#dropzone')?.addEventListener('drop',e=>loadFile(e.dataTransfer.files?.[0]));
  document.addEventListener('paste',e=>{const f=[...(e.clipboardData?.files||[])].find(x=>x.type.startsWith('image/')); if(f){loadFile(f);status(copy.paste)}});
  $$('[data-ratio]').forEach(b=>b.addEventListener('click',()=>{state.ratio=b.dataset.ratio;state.offsetX=state.offsetY=0;update()}));
  $$('[data-frame]').forEach(b=>b.addEventListener('click',()=>{state.frame=b.dataset.frame;update()}));
  const bindings={padding:'padding',bottom:'bottom',radius:'radius',rotation:'rotation',zoom:'zoom',brightness:'brightness',contrast:'contrast',saturation:'saturation',warmth:'warmth',fade:'fade',grain:'grain',fontSize:'fontSize'};
  Object.entries(bindings).forEach(([id,key])=>$('#'+id)?.addEventListener('input',e=>{state[key]=Number(e.target.value);update()}));
  $('#caption')?.addEventListener('input',e=>{state.caption=e.target.value;update()});
  $('#font')?.addEventListener('change',e=>{state.font=e.target.value;update()});
  $('#quality')?.addEventListener('change',e=>{state.quality=Number(e.target.value);update()});
  $('#shadow')?.addEventListener('change',e=>{state.shadow=e.target.checked;update()});
  $('#texture')?.addEventListener('change',e=>{state.texture=e.target.checked;update()});
  $('#reset')?.addEventListener('click',()=>{Object.assign(state,{padding:56,bottom:148,radius:8,frame:'#fffaf2',caption:(document.documentElement.lang.startsWith('th') ? 'ความทรงจำที่บางนา ♡' : 'Bangna memories ♡'),font:'hand',fontSize:32,shadow:true,texture:true,rotation:-3,zoom:1,brightness:100,contrast:100,saturation:100,warmth:0,fade:0,grain:8,offsetX:0,offsetY:0}); syncInputs();update();status(copy.ready)});
  function syncInputs(){
    const vals={padding:state.padding,bottom:state.bottom,radius:state.radius,rotation:state.rotation,zoom:state.zoom,brightness:state.brightness,contrast:state.contrast,saturation:state.saturation,warmth:state.warmth,fade:state.fade,grain:state.grain,fontSize:state.fontSize,caption:state.caption,font:state.font};
    Object.entries(vals).forEach(([id,v])=>{const el=$('#'+id);if(el)el.value=v}); if($('#shadow'))$('#shadow').checked=state.shadow;if($('#texture'))$('#texture').checked=state.texture;
  }
  $('#download')?.addEventListener('click',()=>{
    if(!state.image){status(copy.none);return}
    const base=getBase(), maxDim=Math.max(base.boundW,base.boundH), requested=state.quality, scale=Math.min(requested,4096/maxDim);
    const out=document.createElement('canvas'); render(out,scale,false);
    out.toBlob(blob=>{if(!blob)return;const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download=locale==='th'?'siamese-cat-polaroid-th.png':'siamese-cat-polaroid.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);status(copy.saved);track('tool_export_png')},'image/png');
  });
  function pointerToCanvas(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}}
  function localPoint(p){if(!geom)return null;const dx=p.x-geom.canvasW/2,dy=p.y-geom.canvasH/2,c=Math.cos(-geom.rad),s=Math.sin(-geom.rad);return{x:dx*c-dy*s+geom.cardW/2,y:dx*s+dy*c+geom.cardH/2}}
  canvas.addEventListener('pointerdown',e=>{if(!state.image)return;const p=pointerToCanvas(e),l=localPoint(p);if(!l)return;if(l.x>=geom.photoX&&l.x<=geom.photoX+geom.pw&&l.y>=geom.photoY&&l.y<=geom.photoY+geom.ph){drag={p,l};canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging')}});
  canvas.addEventListener('pointermove',e=>{if(!drag||!geom)return;const p=pointerToCanvas(e),l=localPoint(p);const dx=l.x-drag.l.x,dy=l.y-drag.l.y;state.offsetX=Math.max(-2.5,Math.min(2.5,state.offsetX+dx/(geom.pw*.5)));state.offsetY=Math.max(-2.5,Math.min(2.5,state.offsetY+dy/(geom.ph*.5)));drag={p,l};render()});
  function endDrag(){drag=null;canvas.classList.remove('dragging')}
  canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
  syncInputs(); update(); status(copy.ready);
})();
