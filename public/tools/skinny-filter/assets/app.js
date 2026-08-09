const DICT = {
  th: {
    loadingAI: "กำลังโหลด AI ตรวจจับท่าทางบนอุปกรณ์ของคุณ…",
    aiReady: "AI พร้อมแล้ว — ระบบจะพยายามจับตำแหน่งช่วงลำตัวอัตโนมัติ",
    aiDetected: "ตรวจพบช่วงลำตัวแล้ว — จุดโฟกัสถูกวางอัตโนมัติ",
    aiNoPose: "ยังจับช่วงลำตัวไม่ชัด ลองใช้รูปที่เห็นไหล่และสะโพก หรือแตะรูปเพื่อวางจุดโฟกัสเอง",
    aiOff: "ปิด AI แล้ว — แตะบริเวณเอวบนรูปเพื่อกำหนดจุดโฟกัสเอง",
    aiError: "AI โหลดไม่สำเร็จ แต่ยังใช้ตัวปรับรูปร่างแบบ manual ได้ตามปกติ",
    uploadError: "กรุณาใช้ไฟล์ JPG, PNG หรือ WebP ขนาดไม่เกิน 20 MB",
    imageError: "ไม่สามารถอ่านรูปนี้ได้ กรุณาลองไฟล์รูปอื่น",
    readyManual: "รูปพร้อมแล้ว — กำลังตั้งค่าจุดโฟกัสเริ่มต้น",
    focusSet: "ตั้งจุดโฟกัสใหม่แล้ว",
    downloaded: "ดาวน์โหลดรูป PNG แล้ว",
    processing: "กำลังประมวลผล…",
    imageSize: (w,h) => `${w.toLocaleString()} × ${h.toLocaleString()} px`,
    presetGentle: "เบา",
    presetBalanced: "พอดี",
    presetStrong: "ชัด",
  },
  en: {
    loadingAI: "Loading on-device AI pose detection…",
    aiReady: "AI is ready — the tool will try to locate the torso automatically.",
    aiDetected: "Torso detected — the reshape focus was positioned automatically.",
    aiNoPose: "Torso not clear. Try a photo with shoulders and hips visible, or tap the image to place the focus manually.",
    aiOff: "AI is off — tap the waist area in the image to position the reshape focus manually.",
    aiError: "AI could not load, but the manual reshape controls still work normally.",
    uploadError: "Please use a JPG, PNG or WebP image up to 20 MB.",
    imageError: "This image could not be read. Please try another image file.",
    readyManual: "Image ready — using a safe default focus while AI loads.",
    focusSet: "Reshape focus updated.",
    downloaded: "PNG downloaded.",
    processing: "Processing…",
    imageSize: (w,h) => `${w.toLocaleString()} × ${h.toLocaleString()} px`,
    presetGentle: "Gentle",
    presetBalanced: "Balanced",
    presetStrong: "Strong",
  }
};

const lang = document.documentElement.lang?.toLowerCase().startsWith('th') ? 'th' : 'en';
const t = DICT[lang];
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_DIMENSION = 2400;
const MEDIAPIPE_VERSION = '1.0.1';
const MEDIAPIPE_MODULE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/vision_bundle.mjs`;
const MEDIAPIPE_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const POSE_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

const el = {
  canvasWrap: document.getElementById('canvasWrap'),
  glCanvas: document.getElementById('glCanvas'),
  dropPanel: document.getElementById('dropPanel'),
  fileInput: document.getElementById('fileInput'),
  uploadButton: document.getElementById('uploadButton'),
  replaceButton: document.getElementById('replaceButton'),
  editorToolbar: document.getElementById('editorToolbar'),
  imageMeta: document.getElementById('imageMeta'),
  statusBox: document.getElementById('statusBox'),
  statusText: document.getElementById('statusText'),
  strength: document.getElementById('strength'),
  strengthValue: document.getElementById('strengthValue'),
  blend: document.getElementById('blend'),
  blendValue: document.getElementById('blendValue'),
  area: document.getElementById('area'),
  areaValue: document.getElementById('areaValue'),
  aiToggle: document.getElementById('aiToggle'),
  detectButton: document.getElementById('detectButton'),
  resetButton: document.getElementById('resetButton'),
  compareButton: document.getElementById('compareButton'),
  downloadButton: document.getElementById('downloadButton'),
  presets: [...document.querySelectorAll('[data-preset]')],
  toast: document.getElementById('toast'),
  menuButton: document.getElementById('menuButton'),
  mainNav: document.getElementById('mainNav'),
};

let gl;
let program;
let texture;
let uniforms = {};
let imageLoaded = false;
let imageBitmap = null;
let imageWidth = 0;
let imageHeight = 0;
let sourceCanvas = null;
let focus = { x: .5, y: .58, radiusX: .33, radiusY: .27 };
let detectedFocus = null;
let manualFocus = false;
let poseLandmarker = null;
let poseLoading = null;
let compareActive = false;
let renderQueued = false;

function toast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.toast.classList.remove('show'), 1800);
}

function setStatus(message, isError = false) {
  el.statusText.textContent = message;
  el.statusBox.classList.toggle('error', isError);
}

function setControlsEnabled(enabled) {
  [el.strength, el.blend, el.area, el.aiToggle, el.detectButton, el.resetButton, el.compareButton, el.downloadButton].forEach(node => {
    if (node) node.disabled = !enabled;
  });
  el.presets.forEach(node => node.disabled = !enabled);
}

function initGL() {
  gl = el.glCanvas.getContext('webgl', {
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  if (!gl) throw new Error('WebGL unavailable');

  const vertexSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  `;

  const fragmentSource = `
    precision mediump float;
    uniform sampler2D u_image;
    uniform vec2 u_center;
    uniform vec2 u_radius;
    uniform float u_strength;
    uniform float u_blend;
    varying vec2 v_texCoord;

    void main() {
      vec2 p = v_texCoord;
      float rx = max(u_radius.x, 0.001);
      float ry = max(u_radius.y, 0.001);
      float dx = (p.x - u_center.x) / rx;
      float dy = (p.y - u_center.y) / ry;

      float vertical = exp(-pow(abs(dy), 2.0) * mix(2.2, 5.3, u_blend));
      float local = pow(max(0.0, 1.0 - abs(dx)), 2.15);
      float envelope = 1.0 - smoothstep(0.05, 1.16, abs(dx));
      float displacement = sign(dx) * u_strength * rx * vertical * local * envelope;

      vec2 samplePoint = p;
      samplePoint.x = clamp(samplePoint.x + displacement, 0.0, 1.0);
      gl_FragColor = texture2D(u_image, samplePoint);
    }
  `;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed');
    }
    return shader;
  };

  program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'WebGL program link failed');
  }
  gl.useProgram(program);

  const positions = new Float32Array([
    -1, -1,   0, 1,
     1, -1,   1, 1,
    -1,  1,   0, 0,
    -1,  1,   0, 0,
     1, -1,   1, 1,
     1,  1,   1, 0,
  ]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const stride = 4 * Float32Array.BYTES_PER_ELEMENT;
  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0);
  const texLoc = gl.getAttribLocation(program, 'a_texCoord');
  gl.enableVertexAttribArray(texLoc);
  gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);

  uniforms = {
    image: gl.getUniformLocation(program, 'u_image'),
    center: gl.getUniformLocation(program, 'u_center'),
    radius: gl.getUniformLocation(program, 'u_radius'),
    strength: gl.getUniformLocation(program, 'u_strength'),
    blend: gl.getUniformLocation(program, 'u_blend'),
  };
  gl.uniform1i(uniforms.image, 0);
}

function fitSize(w, h) {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
}

async function decodeFile(file) {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > MAX_FILE_BYTES) {
    throw new Error('invalid-file');
  }
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (_) {
      return await createImageBitmap(file);
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    return image;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

async function loadFile(file) {
  try {
    const decoded = await decodeFile(file);
    if (imageBitmap && typeof imageBitmap.close === 'function') imageBitmap.close();
    imageBitmap = decoded;

    const sourceW = decoded.width || decoded.naturalWidth;
    const sourceH = decoded.height || decoded.naturalHeight;
    const fitted = fitSize(sourceW, sourceH);
    imageWidth = fitted.w;
    imageHeight = fitted.h;
    el.glCanvas.width = imageWidth;
    el.glCanvas.height = imageHeight;

    if (!gl) initGL();
    gl.viewport(0, 0, imageWidth, imageHeight);
    texture = texture || gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const staging = document.createElement('canvas');
    staging.width = imageWidth;
    staging.height = imageHeight;
    const sctx = staging.getContext('2d', { alpha: false });
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = 'high';
    sctx.drawImage(decoded, 0, 0, imageWidth, imageHeight);
    sourceCanvas = staging;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, staging);

    imageLoaded = true;
    manualFocus = false;
    detectedFocus = null;
    focus = { x: .5, y: .58, radiusX: .33, radiusY: .27 };
    el.dropPanel.hidden = true;
    el.glCanvas.style.display = 'block';
    el.editorToolbar.style.display = 'flex';
    el.imageMeta.textContent = t.imageSize(imageWidth, imageHeight);
    setControlsEnabled(true);
    setStatus(t.readyManual);
    resetControls(false);
    render();

    if (el.aiToggle.checked) detectPose();
  } catch (err) {
    console.error(err);
    if (err?.message === 'invalid-file') {
      setStatus(t.uploadError, true);
      toast(t.uploadError);
    } else {
      setStatus(t.imageError, true);
      toast(t.imageError);
    }
  } finally {
    el.fileInput.value = '';
  }
}

function currentStrength() {
  if (!imageLoaded || compareActive) return 0;
  return Number(el.strength.value) / 100 * 1.15;
}

function currentBlend() {
  return Number(el.blend.value) / 100;
}

function currentRadius() {
  const area = Number(el.area.value) / 100;
  return {
    x: Math.min(.48, Math.max(.12, focus.radiusX * (0.65 + area * .75))),
    y: Math.min(.48, Math.max(.08, focus.radiusY * (0.58 + area * .86)))
  };
}

function render() {
  if (!imageLoaded || !gl || !texture) return;
  const r = currentRadius();
  gl.useProgram(program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform2f(uniforms.center, focus.x, focus.y);
  gl.uniform2f(uniforms.radius, r.x, r.y);
  gl.uniform1f(uniforms.strength, currentStrength());
  gl.uniform1f(uniforms.blend, currentBlend());
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    render();
  });
}

function syncValues() {
  el.strengthValue.textContent = `${el.strength.value}%`;
  el.blendValue.textContent = `${el.blend.value}%`;
  el.areaValue.textContent = `${el.area.value}%`;
}

function setPreset(name) {
  const presets = {
    gentle: { strength: 10, blend: 58, area: 52 },
    balanced: { strength: 18, blend: 48, area: 60 },
    strong: { strength: 28, blend: 42, area: 68 },
  };
  const p = presets[name];
  if (!p) return;
  el.strength.value = p.strength;
  el.blend.value = p.blend;
  el.area.value = p.area;
  el.presets.forEach(btn => btn.classList.toggle('active', btn.dataset.preset === name));
  syncValues();
  queueRender();
}

function resetControls(useToast = true) {
  el.strength.value = 18;
  el.blend.value = 48;
  el.area.value = 60;
  el.presets.forEach(btn => btn.classList.toggle('active', btn.dataset.preset === 'balanced'));
  manualFocus = false;
  focus = detectedFocus ? { ...detectedFocus } : { x: .5, y: .58, radiusX: .33, radiusY: .27 };
  syncValues();
  queueRender();
  if (useToast && imageLoaded) toast(lang === 'th' ? 'รีเซ็ตแล้ว' : 'Reset complete.');
}

async function ensurePoseLandmarker() {
  if (poseLandmarker) return poseLandmarker;
  if (poseLoading) return poseLoading;

  poseLoading = (async () => {
    setStatus(t.loadingAI);
    const vision = await import(MEDIAPIPE_MODULE);
    const fileset = await vision.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);
    const options = delegate => ({
      baseOptions: {
        modelAssetPath: POSE_MODEL,
        delegate,
      },
      runningMode: 'IMAGE',
      numPoses: 1,
      minPoseDetectionConfidence: 0.45,
      minPosePresenceConfidence: 0.45,
      minTrackingConfidence: 0.45,
      outputSegmentationMasks: false,
    });
    try {
      poseLandmarker = await vision.PoseLandmarker.createFromOptions(fileset, options('GPU'));
    } catch (gpuError) {
      console.warn('MediaPipe GPU delegate unavailable, falling back to CPU.', gpuError);
      poseLandmarker = await vision.PoseLandmarker.createFromOptions(fileset, options('CPU'));
    }
    setStatus(t.aiReady);
    return poseLandmarker;
  })().catch(err => {
    poseLoading = null;
    throw err;
  });
  return poseLoading;
}

function validLandmark(lm) {
  if (!lm) return false;
  const visibility = lm.visibility ?? 1;
  const presence = lm.presence ?? 1;
  return visibility > .35 && presence > .35 && Number.isFinite(lm.x) && Number.isFinite(lm.y);
}

function focusFromLandmarks(landmarks) {
  const s1 = landmarks[11], s2 = landmarks[12], h1 = landmarks[23], h2 = landmarks[24];
  if (![s1,s2,h1,h2].every(validLandmark)) return null;

  const sx1 = Math.min(s1.x, s2.x), sx2 = Math.max(s1.x, s2.x);
  const hx1 = Math.min(h1.x, h2.x), hx2 = Math.max(h1.x, h2.x);
  const shoulderY = (s1.y + s2.y) / 2;
  const hipY = (h1.y + h2.y) / 2;
  const torsoH = Math.abs(hipY - shoulderY);
  const shoulderW = Math.abs(s2.x - s1.x);
  const hipW = Math.abs(h2.x - h1.x);
  if (torsoH < .07 || Math.max(shoulderW, hipW) < .07) return null;

  const centerX = (s1.x + s2.x + h1.x + h2.x) / 4;
  const waistY = Math.min(.9, Math.max(.1, shoulderY + (hipY - shoulderY) * .72));
  const torsoW = Math.max(shoulderW, hipW);
  return {
    x: Math.min(.92, Math.max(.08, centerX)),
    y: waistY,
    radiusX: Math.min(.44, Math.max(.16, torsoW * .78)),
    radiusY: Math.min(.42, Math.max(.12, torsoH * .92))
  };
}

async function detectPose() {
  if (!imageLoaded || !el.aiToggle.checked) return;
  try {
    const detector = await ensurePoseLandmarker();
    setStatus(t.processing);
    const result = detector.detect(sourceCanvas || el.glCanvas);
    const landmarks = result?.landmarks?.[0];
    const autoFocus = landmarks ? focusFromLandmarks(landmarks) : null;
    if (autoFocus) {
      detectedFocus = autoFocus;
      if (!manualFocus) focus = { ...autoFocus };
      setStatus(t.aiDetected);
      queueRender();
    } else {
      setStatus(t.aiNoPose, true);
    }
  } catch (err) {
    console.error('Pose detection failed:', err);
    setStatus(t.aiError, true);
  }
}

function canvasPointFromEvent(event) {
  const rect = el.glCanvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
}

function setManualFocus(event) {
  if (!imageLoaded) return;
  const p = canvasPointFromEvent(event);
  focus.x = p.x;
  focus.y = p.y;
  manualFocus = true;
  setStatus(t.focusSet);
  queueRender();
}

function downloadResult() {
  if (!imageLoaded) return;
  render();
  el.glCanvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'siamese-cat-skinny-filter.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast(t.downloaded);
  }, 'image/png');
}

function beginCompare(event) {
  if (!imageLoaded) return;
  event.preventDefault();
  compareActive = true;
  queueRender();
}
function endCompare() {
  if (!compareActive) return;
  compareActive = false;
  queueRender();
}

function bindEvents() {
  el.uploadButton.addEventListener('click', () => el.fileInput.click());
  el.replaceButton.addEventListener('click', () => el.fileInput.click());
  el.fileInput.addEventListener('change', e => e.target.files?.[0] && loadFile(e.target.files[0]));

  ['dragenter','dragover'].forEach(type => el.canvasWrap.addEventListener(type, e => {
    e.preventDefault();
    el.canvasWrap.classList.add('dragging');
  }));
  ['dragleave','drop'].forEach(type => el.canvasWrap.addEventListener(type, e => {
    e.preventDefault();
    el.canvasWrap.classList.remove('dragging');
  }));
  el.canvasWrap.addEventListener('drop', e => {
    const file = e.dataTransfer?.files?.[0];
    if (file) loadFile(file);
  });

  [el.strength, el.blend, el.area].forEach(input => input.addEventListener('input', () => {
    syncValues();
    el.presets.forEach(btn => btn.classList.remove('active'));
    queueRender();
  }));
  el.presets.forEach(button => button.addEventListener('click', () => setPreset(button.dataset.preset)));
  el.resetButton.addEventListener('click', () => resetControls(true));
  el.detectButton.addEventListener('click', detectPose);
  el.downloadButton.addEventListener('click', downloadResult);

  el.aiToggle.addEventListener('change', () => {
    if (el.aiToggle.checked) {
      manualFocus = false;
      detectPose();
    } else {
      setStatus(t.aiOff);
    }
  });

  el.glCanvas.addEventListener('pointerup', e => {
    if (compareActive) return;
    setManualFocus(e);
  });

  ['pointerdown','mousedown','touchstart'].forEach(type => el.compareButton.addEventListener(type, beginCompare, { passive: false }));
  ['pointerup','pointercancel','mouseup','mouseleave','touchend','touchcancel'].forEach(type => el.compareButton.addEventListener(type, endCompare));
  window.addEventListener('pointerup', endCompare);
  window.addEventListener('blur', endCompare);

  el.menuButton?.addEventListener('click', () => {
    const open = el.mainNav.classList.toggle('open');
    el.menuButton.setAttribute('aria-expanded', String(open));
  });
  el.mainNav?.addEventListener('click', e => {
    if (e.target.closest('a')) {
      el.mainNav.classList.remove('open');
      el.menuButton?.setAttribute('aria-expanded', 'false');
    }
  });
}

setControlsEnabled(false);
syncValues();
bindEvents();
