/* ================================================
   캐릭터 인터랙션 홈페이지 - 메인 스크립트
   ================================================ */

/* =============================================
   기본 데이터 (DEFAULT CONFIG)
   ============================================= */
const DEFAULT_CONFIG = {
  name: '캐릭터',
  initAffection: 50,
  image: {
    width: 320,
    height: 600,
    x: 50,      // left 기준 %
    y: 50,      // top 기준 % (사용 여부에 따라 적용)
    scale: 1.0,
    valign: 'flex-end'
  },
  emotionImages: {
    normal:    '',
    happy:     '',
    shy:       '',
    blush:     '',
    surprised: '',
    sad:       ''
  },
  theme: {
    mainColor:  '#e87c8d',
    subColor:   '#ffb6c1',
    bgColor:    '#fff0f5',
    textColor:  '#5a3a3a',
    bgImage:    ''
  },
  hotspots: [
    { part:'head',     label:'머리',  top: 0,  left:22, width:56, height:27, side:false },
    { part:'shoulder', label:'어깨',  top:35,  left: 5, width:90, height:14, side:false },
    { part:'chest',    label:'가슴',  top:36,  left:20, width:60, height:18, side:false },
    { part:'waist',    label:'허리',  top:54,  left:22, width:56, height:13, side:false },
    { part:'handL',    label:'손(좌)', top:47,  left: 0, width:20, height:16, side:false },
    { part:'handR',    label:'손(우)', top:47,  left:80, width:20, height:16, side:false },
    { part:'leg',      label:'다리',  top:78,  left:15, width:70, height:22, side:false }
  ],
  scripts: {
    head: [
      { text: '머리 클릭에 대한 반응1', delta: -3, emotion: 'shy' },
      { text: '머리 클릭에 대한 반응2', delta: -2, emotion: 'surprised' },
      { text: '머리 클릭에 대한 반응3', delta: 5, emotion: 'blush' }
    ],
    shoulder: [
      { text: '어깨 클릭에 대한 반응1', delta: 2, emotion: 'happy' },
      { text: '어깨 클릭에 대한 반응2', delta: 1, emotion: 'shy' },
      { text: '어깨 클릭에 대한 반응3', delta: -1, emotion: 'blush' }
    ],
    chest: [
      { text: '가슴 클릭에 대한 반응1', delta: -8, emotion: 'surprised' },
      { text: '가슴 클릭에 대한 반응2', delta: -5, emotion: 'sad' },
      { text: '가슴 클릭에 대한 반응3', delta: -3, emotion: 'shy' }
    ],
    waist: [
      { text: '허리 클릭에 대한 반응1', delta: 1, emotion: 'shy' },
      { text: '허리 클릭에 대한 반응2', delta: 2, emotion: 'blush' },
      { text: '허리 클릭에 대한 반응3', delta: -2, emotion: 'surprised' }
    ],
    handL: [
      { text: '왼손 클릭에 대한 반응1', delta: 4, emotion: 'happy' },
      { text: '왼손 클릭에 대한 반응2', delta: 6, emotion: 'blush' },
      { text: '왼손 클릭에 대한 반응3', delta: 3, emotion: 'happy' }
    ],
    handR: [
      { text: '오른손 클릭에 대한 반응1', delta: 4, emotion: 'happy' },
      { text: '오른손 클릭에 대한 반응2', delta: 5, emotion: 'blush' },
      { text: '오른손 클릭에 대한 반응3', delta: 2, emotion: 'shy' }
    ],
    leg: [
      { text: '다리 클릭에 대한 반응1', delta: -5, emotion: 'sad' },
      { text: '다리 클릭에 대한 반응2', delta: -3, emotion: 'shy' },
      { text: '다리 클릭에 대한 반응3', delta: -4, emotion: 'surprised' }
    ]
  }
};

/* PART 메타 */
const PART_META = {
  head:     { label:'머리',   icon:'🎀', anim:'bounce' },
  shoulder: { label:'어깨',   icon:'💫', anim:'bounce' },
  chest:    { label:'가슴',   icon:'💔', anim:'shake'  },
  waist:    { label:'허리',   icon:'🎀', anim:'bounce' },
  handL:    { label:'손(좌)', icon:'🤝', anim:'bounce' },
  handR:    { label:'손(우)', icon:'🤝', anim:'bounce' },
  leg:      { label:'다리',   icon:'⚡', anim:'shake'  }
};

const EMOTION_LIST = ['normal','happy','shy','blush','surprised','sad'];
const AFFECTION_STAGES = [
  { min:0,  max:19,  label:'냉랭함',  color:'#8ab4e8' },
  { min:20, max:39,  label:'어색함',  color:'#a0d0c8' },
  { min:40, max:59,  label:'보통',    color:'#e8b86d' },
  { min:60, max:79,  label:'친근함',  color:'#f08060' },
  { min:80, max:100, label:'최고!',   color:'#e87c8d' }
];

/* =============================================
   상태 변수
   ============================================= */
let cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG)); // deep copy
let affection = cfg.initAffection;
let scriptIndex = {};     // 각 파트별 순환 인덱스
let currentEmotion = 'normal';
let typingTimer = null;
let hotspotEditMode = false;
let isDragging = false;

/* =============================================
   초기화
   ============================================= */
window.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  affection = getStoredAffection();
  renderAll();
  buildSettingsUI();
  bindHotspots();
});

function renderAll() {
  applyTheme();
  applyCharacterLayout();
  updateAffectionBar();
  document.getElementById('char-name-display').textContent = cfg.name;
}

/* =============================================
   localStorage
   ============================================= */
function loadFromStorage() {
  const saved = localStorage.getItem('charInteract_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // deep merge
      cfg = deepMerge(JSON.parse(JSON.stringify(DEFAULT_CONFIG)), parsed);
    } catch(e) { cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG)); }
  }
}

function saveToStorage() {
  localStorage.setItem('charInteract_config', JSON.stringify(cfg));
}

function getStoredAffection() {
  const v = localStorage.getItem('charInteract_affection');
  return v !== null ? parseInt(v) : cfg.initAffection;
}

function saveAffection() {
  localStorage.setItem('charInteract_affection', String(affection));
}

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

/* =============================================
   테마 적용
   ============================================= */
function applyTheme() {
  const t = cfg.theme;
  const root = document.documentElement;
  root.style.setProperty('--main-color', t.mainColor);
  root.style.setProperty('--sub-color', t.subColor);
  root.style.setProperty('--bg-color', t.bgColor);
  root.style.setProperty('--text-color', t.textColor);

  const overlay = document.getElementById('bg-overlay');
  if (t.bgImage) {
    overlay.style.backgroundImage = `url(${t.bgImage})`;
    overlay.style.backgroundColor = 'transparent';
  } else {
    overlay.style.backgroundImage = 'none';
    overlay.style.backgroundColor = t.bgColor;
  }
}

/* =============================================
   캐릭터 레이아웃 적용
   ============================================= */
function applyCharacterLayout() {
  const im = cfg.image;
  const wrap = document.getElementById('character-img-wrap');
  const imgEl = document.getElementById('character-img');
  const msgEl = document.getElementById('no-image-message');

  wrap.style.width  = im.width  + 'px';
  wrap.style.height = im.height + 'px';
  wrap.style.alignItems = im.valign;

  // 스케일
  imgEl.style.transform = `scale(${im.scale})`;
  imgEl.style.position = 'absolute';
  imgEl.style.left = im.x + '%';
  imgEl.style.top  = im.y + '%';
  imgEl.style.transform = `translate(-50%, -50%) scale(${im.scale})`;

  // 이미지 표시
  const emotionUrl = cfg.emotionImages[currentEmotion] || cfg.emotionImages['normal'] || '';

  if (emotionUrl) {
    imgEl.src = emotionUrl;
    imgEl.classList.add('visible');
    msgEl.classList.remove('show');
  } else {
    imgEl.classList.remove('visible');
    msgEl.classList.add('show');
  }

  renderHotspots();
}

/* =============================================
   핫스팟 렌더링
   ============================================= */
function renderHotspots() {
  const overlay = document.getElementById('hotspot-overlay');
  overlay.innerHTML = '';
  cfg.hotspots.forEach((hs, idx) => {
    const div = document.createElement('div');
    div.className = 'hotspot';
    div.dataset.part  = hs.part;
    div.dataset.label = hs.label;
    div.dataset.idx   = idx;
    div.style.cssText = `top:${hs.top}%;left:${hs.left}%;width:${hs.width}%;height:${hs.height}%;`;
    div.addEventListener('mouseenter', (e) => showBodyLabel(e, hs.label));
    div.addEventListener('mouseleave', hideBodyLabel);
    div.addEventListener('mousemove', moveBodyLabel);
    div.addEventListener('click', (e) => { e.stopPropagation(); handleHotspotClick(hs.part, e); });
    overlay.appendChild(div);
  });
}

function bindHotspots() { /* 초기 바인딩은 renderHotspots에서 처리 */ }

/* =============================================
   신체부위 클릭 처리
   ============================================= */
function handleHotspotClick(part, event) {
  if (hotspotEditMode) return;
  const scripts = cfg.scripts[part];
  if (!scripts || scripts.length === 0) return;

  if (scriptIndex[part] === undefined) scriptIndex[part] = 0;
  const entry = scripts[scriptIndex[part] % scripts.length];
  scriptIndex[part]++;

  // 호감도
  changeAffection(entry.delta);

  // 표정 변경
  setEmotion(entry.emotion || 'normal');

  // 대사 출력
  typeDialogue(entry.text);

  // 캐릭터 반응 애니메이션
  const meta = PART_META[part];
  const animClass = meta ? `react-${meta.anim}` : 'react-bounce';
  triggerCharAnim(animClass);

  // 파티클
  spawnParticles(event.clientX, event.clientY, entry.delta);
}

/* =============================================
   호감도
   ============================================= */
function changeAffection(delta) {
  affection = Math.max(0, Math.min(100, affection + delta));
  updateAffectionBar();
  saveAffection();
  showToast(delta > 0 ? `+${delta} 호감도 ♡` : `${delta} 호감도`);
}

function updateAffectionBar() {
  const fill = document.getElementById('affection-fill');
  const label = document.getElementById('affection-label');
  const status = document.getElementById('affection-status-text');

  fill.style.width = affection + '%';
  label.textContent = affection;

  const stage = AFFECTION_STAGES.find(s => affection >= s.min && affection <= s.max);
  if (stage) {
    status.textContent = stage.label;
    status.style.color = stage.color;
    fill.style.background = `linear-gradient(90deg, ${stage.color}88, ${stage.color})`;
    document.getElementById('heart-icon').style.color = stage.color;
  }
}

/* =============================================
   표정/이미지 변경
   ============================================= */
function setEmotion(emotion) {
  if (!EMOTION_LIST.includes(emotion)) emotion = 'normal';
  currentEmotion = emotion;

  const imgEl = document.getElementById('character-img');
  const msgEl = document.getElementById('no-image-message');

  const url = cfg.emotionImages[emotion] || cfg.emotionImages['normal'];

  if (url) {
    imgEl.src = url;
    imgEl.classList.add('visible');
    msgEl.classList.remove('show');
  } else {
    imgEl.classList.remove('visible');
    msgEl.classList.add('show');
  }

  // 3초 후 노멀로 복귀
  clearTimeout(window._emotionTimer);
  window._emotionTimer = setTimeout(() => {
    setEmotion('normal');
  }, 3000);
}

function applySVGEmotion(emotion) {
  const svg = document.getElementById('character-svg');
  // 볼터치 ellipse
  const blushes = svg.querySelectorAll('ellipse[fill="#ffb6c1"]');
  blushes.forEach(b => {
    if (emotion === 'blush' || emotion === 'shy') {
      b.style.opacity = '0.7';
      b.setAttribute('fill', '#ff8fa0');
    } else {
      b.style.opacity = '0.45';
      b.setAttribute('fill', '#ffb6c1');
    }
  });
}

/* =============================================
   대사 타이핑 효과
   ============================================= */
function typeDialogue(text) {
  const el = document.getElementById('dialogue-text');
  if (typingTimer) clearInterval(typingTimer);
  el.textContent = '';
  let i = 0;
  typingTimer = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(typingTimer);
  }, 38);
}

/* =============================================
   캐릭터 애니메이션
   ============================================= */
function triggerCharAnim(cls) {
  const wrap = document.getElementById('character-img-wrap');
  wrap.classList.remove('react-bounce','react-shake');
  void wrap.offsetWidth; // reflow
  wrap.classList.add(cls);
  setTimeout(() => wrap.classList.remove(cls), 500);
}

/* =============================================
   파티클
   ============================================= */
const PARTICLES_POS = ['💕','✨','💖','🌸','💗'];
const PARTICLES_NEG = ['💢','😣','💦','⚡','😓'];

function spawnParticles(x, y, delta) {
  const container = document.getElementById('particle-container');
  const pool = delta >= 0 ? PARTICLES_POS : PARTICLES_NEG;
  const count = Math.min(Math.abs(delta), 5) + 2;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.textContent = pool[Math.floor(Math.random() * pool.length)];
    p.style.left = (x + (Math.random()-0.5)*60) + 'px';
    p.style.top  = (y + (Math.random()-0.5)*30) + 'px';
    p.style.animationDelay = (Math.random()*0.3) + 's';
    container.appendChild(p);
    setTimeout(() => p.remove(), 1500);
  }
}

/* =============================================
   신체부위 라벨
   ============================================= */
function showBodyLabel(e, label) {
  const el = document.getElementById('body-part-label');
  el.textContent = label;
  el.classList.add('visible');
  moveBodyLabel(e);
}
function hideBodyLabel() {
  document.getElementById('body-part-label').classList.remove('visible');
}
function moveBodyLabel(e) {
  const el = document.getElementById('body-part-label');
  el.style.left = (e.clientX + 14) + 'px';
  el.style.top  = (e.clientY - 30) + 'px';
}

/* =============================================
   토스트
   ============================================= */
function showToast(msg) {
  const toast = document.getElementById('affection-toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

/* =============================================
   설정 패널 UI 빌드
   ============================================= */
function buildSettingsUI() {
  buildEmotionImgUI();
  buildScriptsUI();
  buildHotspotSettingsUI();
  loadSettingsValues();
}

function loadSettingsValues() {
  document.getElementById('cfg-name').value = cfg.name;
  document.getElementById('cfg-init-affection').value = cfg.initAffection;
  document.getElementById('cfg-img-width').value  = cfg.image.width;
  document.getElementById('cfg-img-height').value = cfg.image.height;
  document.getElementById('cfg-img-x').value     = cfg.image.x;
  document.getElementById('cfg-img-y').value     = cfg.image.y;
  document.getElementById('cfg-img-scale').value = cfg.image.scale;
  document.getElementById('cfg-img-valign').value = cfg.image.valign;
  document.getElementById('cfg-bg-img').value    = cfg.theme.bgImage;
  document.getElementById('cfg-bg-color').value  = cfg.theme.bgColor;
  document.getElementById('cfg-main-color').value = cfg.theme.mainColor;
  document.getElementById('cfg-sub-color').value  = cfg.theme.subColor;
  document.getElementById('cfg-text-color').value = cfg.theme.textColor;
}

/* ---- 감정 이미지 UI ---- */
function buildEmotionImgUI() {
  const wrap = document.getElementById('emotion-imgs-wrap');
  wrap.innerHTML = '';
  const emotionNames = { normal:'기본', happy:'행복', shy:'수줍음', blush:'쑥스러움', surprised:'놀람', sad:'슬픔' };
  EMOTION_LIST.forEach(em => {
    const row = document.createElement('div');
    row.className = 'emotion-img-item';
    row.innerHTML = `
      <label style="min-width:64px;">${emotionNames[em]}</label>
      <input type="text" id="em-${em}" placeholder="이미지 URL" value="${cfg.emotionImages[em] || ''}" />
      <img class="emotion-img-preview" id="em-preview-${em}" src="${cfg.emotionImages[em] || ''}" alt="" />
    `;
    wrap.appendChild(row);
    const input = row.querySelector(`#em-${em}`);
    const preview = row.querySelector(`#em-preview-${em}`);
    input.addEventListener('input', () => {
      preview.src = input.value;
    });
  });
}

/* ---- 스크립트 어코디언 UI ---- */
function buildScriptsUI() {
  const container = document.getElementById('scripts-accordion');
  container.innerHTML = '';

  Object.keys(PART_META).forEach(part => {
    const meta = PART_META[part];
    if (!cfg.scripts[part]) cfg.scripts[part] = [];

    const section = document.createElement('div');
    section.className = 'script-section';
    section.id = `script-sec-${part}`;

    const header = document.createElement('div');
    header.className = 'script-section-header';
    header.innerHTML = `<span class="part-icon">${meta.icon}</span>${meta.label}<i class="fas fa-chevron-down arrow"></i>`;
    header.onclick = () => toggleScriptSection(part);

    const body = document.createElement('div');
    body.className = 'script-section-body';
    body.id = `script-body-${part}`;

    const colLabels = document.createElement('div');
    colLabels.className = 'script-col-labels';
    colLabels.innerHTML = '<span>대사</span><span>호감도</span><span>표정</span><span></span>';
    body.appendChild(colLabels);

    const itemsWrap = document.createElement('div');
    itemsWrap.id = `script-items-${part}`;
    body.appendChild(itemsWrap);

    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add-script';
    addBtn.innerHTML = '<i class="fas fa-plus"></i> 대사 추가';
    addBtn.onclick = () => addScriptItem(part);
    body.appendChild(addBtn);

    section.appendChild(header);
    section.appendChild(body);
    container.appendChild(section);

    renderScriptItems(part);
  });
}

function renderScriptItems(part) {
  const wrap = document.getElementById(`script-items-${part}`);
  if (!wrap) return;
  wrap.innerHTML = '';
  const scripts = cfg.scripts[part] || [];
  scripts.forEach((s, idx) => {
    const item = document.createElement('div');
    item.className = 'script-item';
    item.innerHTML = `
      <textarea rows="2" data-part="${part}" data-idx="${idx}" data-field="text">${s.text}</textarea>
      <input type="number" min="-20" max="20" step="1"
             data-part="${part}" data-idx="${idx}" data-field="delta" value="${s.delta}" />
      <select data-part="${part}" data-idx="${idx}" data-field="emotion">
        ${EMOTION_LIST.map(em => `<option value="${em}" ${em===s.emotion?'selected':''}>${em}</option>`).join('')}
      </select>
      <button class="btn-del-script" title="삭제" onclick="deleteScriptItem('${part}',${idx})">
        <i class="fas fa-trash"></i>
      </button>
    `;
    // 변경 감지
    item.querySelectorAll('[data-field]').forEach(el => {
      el.addEventListener('change', syncScriptField);
      el.addEventListener('input', syncScriptField);
    });
    wrap.appendChild(item);
  });
}

function syncScriptField(e) {
  const el = e.target;
  const part = el.dataset.part;
  const idx  = parseInt(el.dataset.idx);
  const field = el.dataset.field;
  if (!cfg.scripts[part] || !cfg.scripts[part][idx]) return;
  if (field === 'delta') cfg.scripts[part][idx].delta = parseInt(el.value) || 0;
  else cfg.scripts[part][idx][field] = el.value;
}

function addScriptItem(part) {
  if (!cfg.scripts[part]) cfg.scripts[part] = [];
  cfg.scripts[part].push({ text: '새로운 대사를 입력하세요.', delta: 2, emotion: 'happy' });
  renderScriptItems(part);
}

function deleteScriptItem(part, idx) {
  cfg.scripts[part].splice(idx, 1);
  renderScriptItems(part);
}

function toggleScriptSection(part) {
  const header = document.querySelector(`#script-sec-${part} .script-section-header`);
  const body   = document.getElementById(`script-body-${part}`);
  header.classList.toggle('open');
  body.classList.toggle('open');
}

/* ---- 핫스팟 설정 UI ---- */
function buildHotspotSettingsUI() {
  const list = document.getElementById('hotspot-settings-list');
  list.innerHTML = '';
  cfg.hotspots.forEach((hs, idx) => {
    const meta = PART_META[hs.part] || {};
    const row = document.createElement('div');
    row.className = 'hs-setting-row';
    row.id = `hs-row-${idx}`;
    row.innerHTML = `
      <div class="hs-title">
        <span>${meta.icon || '📍'}</span> ${hs.label}
        <span style="font-size:0.72rem;color:#bbb;font-weight:400;">(part: ${hs.part})</span>
      </div>
      <div class="hs-coord-grid">
        <label>top (%)
          <input type="number" min="0" max="100" step="0.5"
                 data-hsidx="${idx}" data-field="top" value="${hs.top}" />
        </label>
        <label>left (%)
          <input type="number" min="-20" max="100" step="0.5"
                 data-hsidx="${idx}" data-field="left" value="${hs.left}" />
        </label>
        <label>width (%)
          <input type="number" min="1" max="100" step="0.5"
                 data-hsidx="${idx}" data-field="width" value="${hs.width}" />
        </label>
        <label>height (%)
          <input type="number" min="1" max="100" step="0.5"
                 data-hsidx="${idx}" data-field="height" value="${hs.height}" />
        </label>
      </div>
    `;
    row.querySelectorAll('input[data-hsidx]').forEach(inp => {
      inp.addEventListener('input', syncHotspotField);
    });
    list.appendChild(row);
  });
}

function syncHotspotField(e) {
  const el = e.target;
  const idx   = parseInt(el.dataset.hsidx);
  const field = el.dataset.field;
  cfg.hotspots[idx][field] = parseFloat(el.value) || 0;
  // 실시간 핫스팟 반영
  renderHotspots();
  if (hotspotEditMode) renderHotspotEditOverlay();
}

/* =============================================
   핫스팟 편집 모드 (드래그 앤 드롭)
   ============================================= */
function toggleHotspotEditMode() {
  hotspotEditMode = !hotspotEditMode;
  const btn = document.getElementById('btn-hs-edit');
  const tip = document.getElementById('hs-edit-tip');
  const editOverlay = document.getElementById('hotspot-edit-overlay');

  if (hotspotEditMode) {
    btn.classList.add('active');
    btn.innerHTML = '<i class="fas fa-crosshairs"></i> 편집 모드 끄기';
    tip.style.display = 'inline';
    editOverlay.style.display = 'block';
    document.body.classList.add('debug-hotspots');
    renderHotspotEditOverlay();
  } else {
    btn.classList.remove('active');
    btn.innerHTML = '<i class="fas fa-crosshairs"></i> 핫스팟 편집 모드 켜기';
    tip.style.display = 'none';
    editOverlay.style.display = 'none';
    editOverlay.innerHTML = '';
    document.body.classList.remove('debug-hotspots');
  }
}

function renderHotspotEditOverlay() {
  const editOverlay = document.getElementById('hotspot-edit-overlay');
  const wrap = document.getElementById('character-img-wrap');
  editOverlay.innerHTML = '';
  editOverlay.style.position = 'absolute';
  editOverlay.style.inset = '0';

  cfg.hotspots.forEach((hs, idx) => {
    const el = document.createElement('div');
    el.className = 'hs-draggable';
    el.dataset.idx = idx;
    el.style.cssText = `top:${hs.top}%;left:${hs.left}%;width:${hs.width}%;height:${hs.height}%;`;

    const badge = document.createElement('div');
    badge.className = 'hs-label-badge';
    badge.textContent = hs.label;
    el.appendChild(badge);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'hs-resize-handle';
    el.appendChild(resizeHandle);

    // 드래그: 이동
    el.addEventListener('mousedown', (e) => {
      if (e.target === resizeHandle) return;
      e.preventDefault();
      startDrag(e, idx, 'move', wrap);
    });
    // 드래그: 리사이즈
    resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      startDrag(e, idx, 'resize', wrap);
    });

    editOverlay.appendChild(el);
  });
}

function startDrag(e, idx, mode, wrapEl) {
  isDragging = true;
  const rect = wrapEl.getBoundingClientRect();
  const startX = e.clientX;
  const startY = e.clientY;
  const origTop   = cfg.hotspots[idx].top;
  const origLeft  = cfg.hotspots[idx].left;
  const origW     = cfg.hotspots[idx].width;
  const origH     = cfg.hotspots[idx].height;

  const onMove = (em) => {
    const dx = em.clientX - startX;
    const dy = em.clientY - startY;
    const dxPct = (dx / rect.width)  * 100;
    const dyPct = (dy / rect.height) * 100;

    if (mode === 'move') {
      cfg.hotspots[idx].top  = Math.max(0, Math.min(95, origTop  + dyPct));
      cfg.hotspots[idx].left = Math.max(-20, Math.min(95, origLeft + dxPct));
    } else {
      cfg.hotspots[idx].width  = Math.max(5, Math.min(100, origW + dxPct));
      cfg.hotspots[idx].height = Math.max(5, Math.min(100, origH + dyPct));
    }
    renderHotspots();
    renderHotspotEditOverlay();
    updateHotspotSettingsRow(idx);
  };

  const onUp = () => {
    isDragging = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function updateHotspotSettingsRow(idx) {
  const hs = cfg.hotspots[idx];
  const row = document.getElementById(`hs-row-${idx}`);
  if (!row) return;
  ['top','left','width','height'].forEach(f => {
    const inp = row.querySelector(`[data-field="${f}"]`);
    if (inp) inp.value = Math.round(hs[f] * 10) / 10;
  });
}

/* =============================================
   설정 저장
   ============================================= */
function saveSettings() {
  // 기본
  cfg.name = document.getElementById('cfg-name').value || '캐릭터';
  cfg.initAffection = parseInt(document.getElementById('cfg-init-affection').value) || 50;

  // 이미지
  cfg.image.width  = parseInt(document.getElementById('cfg-img-width').value)  || 320;
  cfg.image.height = parseInt(document.getElementById('cfg-img-height').value) || 600;
  cfg.image.x      = parseFloat(document.getElementById('cfg-img-x').value)    || 50;
  cfg.image.y      = parseFloat(document.getElementById('cfg-img-y').value)    || 50;
  cfg.image.scale  = parseFloat(document.getElementById('cfg-img-scale').value) || 1;
  cfg.image.valign = document.getElementById('cfg-img-valign').value;

  // 감정 이미지
  EMOTION_LIST.forEach(em => {
    const inp = document.getElementById(`em-${em}`);
    if (inp) cfg.emotionImages[em] = inp.value.trim();
  });

  // 테마
  cfg.theme.bgImage   = document.getElementById('cfg-bg-img').value.trim();
  cfg.theme.bgColor   = document.getElementById('cfg-bg-color').value;
  cfg.theme.mainColor = document.getElementById('cfg-main-color').value;
  cfg.theme.subColor  = document.getElementById('cfg-sub-color').value;
  cfg.theme.textColor = document.getElementById('cfg-text-color').value;

  // 스크립트는 이미 실시간 syncScriptField에서 동기화됨
  // 핫스팟도 이미 동기화됨

  saveToStorage();
  renderAll();
  closeSettings();
  showToast('설정이 저장되었습니다 ✓');
}

/* =============================================
   설정 패널 열기/닫기
   ============================================= */
function openSettings() {
  buildSettingsUI();
  document.getElementById('settings-overlay').classList.add('open');
  // 핫스팟 편집 모드 리셋
  if (hotspotEditMode) toggleHotspotEditMode();
}

function closeSettings() {
  document.getElementById('settings-overlay').classList.remove('open');
}

function closeSettingsOutside(e) {
  if (e.target === document.getElementById('settings-overlay')) closeSettings();
}

/* =============================================
   탭 전환
   ============================================= */
function switchTab(tabId, btn) {
  document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.stab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(`tab-${tabId}`).classList.add('active');
}

/* =============================================
   초기화
   ============================================= */
function confirmReset() {
  document.getElementById('confirm-overlay').style.display = 'flex';
}

function cancelReset() {
  document.getElementById('confirm-overlay').style.display = 'none';
}

function doReset() {
  affection = cfg.initAffection;
  saveAffection();
  updateAffectionBar();
  scriptIndex = {};
  setEmotion('normal');
  typeDialogue('호감도가 초기화되었습니다.');
  document.getElementById('confirm-overlay').style.display = 'none';
  showToast('호감도 초기화 완료!');
}
