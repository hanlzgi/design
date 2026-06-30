(function () {
  // 데이터는 런타임에 .json 로드 (문안=content, 레이아웃=sitemap, 매니페스트=photos)
  let SM = null, PAGES = [], PHOTOS = {}, STAGE_W = 1920, STAGE_H = 1080, R = 34;
  const CONTENT = window.TEXTBOOK_CONTENT || { pages: [] }; // 타이틀/목차 카드(별도)
  const CONTENT_KEY = { title: 'cover', toc: 'toc' };

  const wrap = document.getElementById('stageWrap');
  const stage = document.getElementById('stage');
  const chrome = document.getElementById('chrome');
  const pagerPos = document.getElementById('pagerPos');
  const toastEl = document.getElementById('toast');

  let idx = 0;
  const history = [];
  const scraps = JSON.parse(localStorage.getItem('bohun_scraps') || '[]');
  const textCache = {};

  const GLYPH = {
    link: '⧉', share: '⤴', scrap: '\u{1F516}', note: '\u{1F4D3}', search: '\u{1F50D}',
    pdf: '⬇', fullscreen: '⛶', back: '←', portal: '\u{1F310}', map: '\u{1F4CD}', settings: '⚙'
  };

  const HOME_SVG = '<svg viewBox="0 0 40 40" fill="none"><path d="M20 7 L34 19 H30 V33 H24 V24 H16 V33 H10 V19 H6 Z" fill="#fff"/></svg>';

  const ICONS = {
    home: HOME_SVG,
    share: '<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M29 22v7a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V13a2 2 0 0 1 2-2h7"/><path d="M24 9h7v7"/><path d="M31 9 19 21"/></svg>',
    scrap: '<svg viewBox="0 0 40 40" fill="#fff"><path d="M13 7h14a2 2 0 0 1 2 2v25l-9-6.6L11 34V9a2 2 0 0 1 2-2z"/></svg>',
    note: '<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M27 8l5 5-16 16-6 2 2-6z"/><path d="M11 33h19"/></svg>',
    search: '<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><circle cx="18" cy="18" r="9"/><line x1="25" y1="25" x2="32" y2="32"/></svg>',
    pdf: '<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 8v15"/><path d="M13 17l7 7 7-7"/><path d="M9 29v3a1 1 0 0 0 1 1h20a1 1 0 0 0 1-1v-3"/></svg>',
    fullscreen: '<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 15v-5a1 1 0 0 1 1-1h5"/><path d="M25 9h5a1 1 0 0 1 1 1v5"/><path d="M31 25v5a1 1 0 0 1-1 1h-5"/><path d="M15 31h-5a1 1 0 0 1-1-1v-5"/></svg>',
    back: '<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12l-8 8 8 8"/><path d="M14 20h13"/></svg>',
    portal: '<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="2.5"><circle cx="20" cy="20" r="12"/><ellipse cx="20" cy="20" rx="5" ry="12"/><line x1="8" y1="20" x2="32" y2="20"/><line x1="11" y1="13" x2="29" y2="13"/><line x1="11" y1="27" x2="29" y2="27"/></svg>',
    map: '<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="2.8" stroke-linejoin="round"><path d="M20 9c4.4 0 8 3.6 8 8 0 5.5-8 14-8 14s-8-8.5-8-14c0-4.4 3.6-8 8-8z"/><circle cx="20" cy="17" r="3.2"/></svg>',
    settings: '<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"><circle cx="20" cy="20" r="4.5"/><path d="M20 7l1.6 3.4 3.7-.6 1 3.6 3.4 1.6-.6 3.7L33 20l-2.6 2.8.6 3.7-3.4 1.6-1 3.6-3.7-.6L20 33l-1.6-3.4-3.7.6-1-3.6-3.4-1.6.6-3.7L7 20l2.6-2.8-.6-3.7 3.4-1.6 1-3.6 3.7.6z"/></svg>'
  }; const el = (t, c, css) => { const n = document.createElement(t); if (c) n.className = c; if (css) Object.assign(n.style, css); return n; };
  const px = v => v + 'px';
  const V = '?v=' + Date.now();
  const pad3 = n => String(n).padStart(3, '0');

  function scaleF() { return wrap.clientWidth / STAGE_W; }
  function layout() {
    const s = scaleF();
    stage.style.transform = `scale(${s})`;
    chrome.querySelectorAll('.hot').forEach(h => {
      const x = +h.dataset.x, y = +h.dataset.y, d = (+h.dataset.r || R) * 2 * s;
      h.style.left = (x * s) + 'px'; h.style.top = (y * s) + 'px'; h.style.width = d + 'px'; h.style.height = d + 'px';
    });
  }
  window.addEventListener('resize', () => { layout(); checkPortrait(); });

  let tT;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(tT); tT = setTimeout(() => toastEl.classList.remove('show'), 2200); }

  function makeHot(cfg, cls) {
    const b = document.createElement('button');
    b.className = 'hot ' + cls; b.dataset.x = cfg.x; b.dataset.y = cfg.y; b.dataset.action = cfg.action;
    if (cfg.r) b.dataset.r = cfg.r;
    const _inner = cfg.action === 'logo' ? '<img class="logo-img" src="assets/logo.png' + V + '" alt="국가보훈부">' : (ICONS[cfg.action] || GLYPH[cfg.action] || '');
    b.innerHTML = `<span class="glyph">${_inner}</span><span class="tip">${cfg.label || ''}</span>`;
    b.addEventListener('click', () => handle(cfg));
    return b;
  }
  function buildChrome() {
    const c = SM.chrome;
    chrome.appendChild(makeHot({ ...c.logo, action: 'logo' }, 'logo'));
    if (c.home) { const hb = makeHot({ ...c.home, action: 'home' }, 'rail home'); const g = hb.querySelector('.glyph'); if (g) g.innerHTML = HOME_SVG; chrome.appendChild(hb); }
    c.rail.forEach(r => chrome.appendChild(makeHot(r, 'rail')));
    c.top.forEach(t => chrome.appendChild(makeHot(t, 'top')));
  }

  const curPage = () => PAGES[idx];
  async function go(i, push = true) {
    if (i < 0 || i >= PAGES.length) return;
    if (push) history.push(idx);
    idx = i; await ensureContent(pad3(idx + 1)); render();
  }
  function goId(id) { const i = PAGES.findIndex(p => p.id === id); if (i >= 0) go(i); }

  function handle(cfg) {
    const a = cfg.action, p = curPage();
    switch (a) {
      case 'logo': window.open(cfg.url || 'https://www.mpva.go.kr', '_blank'); break;
      case 'home': goId('title'); break;
      case 'portal': window.open(cfg.url, '_blank'); break;
      case 'back': if (history.length) { idx = history.pop(); ensureContent(pad3(idx + 1)).then(render); } else go(Math.max(0, idx - 1), false); break;
      case 'map': if (p.mapPin && p.course) { goId(`c${p.course}-map`); } else { toast('이 페이지에서는 지도 이동이 비활성화입니다'); } break;
      case 'settings': toast('설정 (준비 중)'); break;
      case 'share': navigator.clipboard?.writeText(location.href.split('#')[0] + '#' + p.id).catch(() => { }); toast('링크가 복사되었습니다'); break;
      case 'scrap': captureScrap(p); break;
      case 'note': goId('note'); break;
      case 'search': openSearch(); break;
      case 'pdf': { const l = document.createElement('a'); l.href = 'content/download.pdf'; l.download = '보훈교재.pdf'; document.body.appendChild(l); l.click(); l.remove(); toast('PDF 다운로드를 시작합니다'); break; }
      case 'fullscreen': if (!document.fullscreenElement) { document.documentElement.requestFullscreen?.(); } else { document.exitFullscreen?.(); } break;
    }
  }

  function renderText(t) {
    const n = el('div', 'tx f-' + (t.font || 'sans-r'), { left: px(t.x), top: px(t.y), fontSize: px(t.size), color: t.color || '#000' });
    if (t.w) n.style.width = px(t.w); n.textContent = t.text; return n;
  }
  function renderCard(c) {
    const hot = el('div', 'card-hotspot toc-card', { left: px(c.x), top: px(c.y), width: px(c.w), height: px(c.h) });
    const img = el('img', 'toc-card-img'); img.src = c.img + V; img.draggable = false; hot.appendChild(img);
    hot.appendChild(renderText({ text: c.category, x: c.badge_x - c.x, y: c.badge_y - c.y, size: 18, font: 'sans-sb', color: '#fff' }));
    hot.appendChild(renderText({ text: c.region, x: c.region_x - c.x, y: c.region_y - c.y, size: 20, font: 'sans-r', color: '#000' }));
    hot.appendChild(renderText({ text: c.title, x: c.title_x - c.x, y: c.title_y - c.y, size: 44, font: 'sans-sb', color: '#000', w: c.title_w }));
    hot.addEventListener('click', () => { toast('코스 선택: ' + c.title); goId('c1-map'); });
    return hot;
  }
  function renderEditable(page, root) {
    const cp = CONTENT.pages.find(x => x.id === CONTENT_KEY[page.id]);
    if (page.type === 'toc') { root.classList.add('framed'); root.appendChild(el('div', 'frm-panel')); }
    else if (page.type === 'title') { root.classList.add('framed'); const ci = el('img', 'cover-img'); ci.src = page.bg + V; ci.draggable = false; root.appendChild(ci); }
    else { const bg = el('div', 'bg'); bg.style.backgroundImage = `url("${page.bg}${V}")`; root.appendChild(bg); }
    if (cp) { (cp.texts || []).forEach(t => root.appendChild(renderText(t))); (cp.cards || []).forEach(c => root.appendChild(renderCard(c))); }
  }

  function addMapInteraction(page, root) {
    const cr = page.mapCardRect || { x: 733, y: 214, w: 562, h: 679 };
    const dim = el('div', 'map-dim');
    const card = el('img', 'map-card', { left: px(cr.x), top: px(cr.y), width: px(cr.w), height: px(cr.h) });
    dim.appendChild(card); root.appendChild(dim);
    const lay = el('div', 'map-hotspots'); root.appendChild(lay);
    let curLink = null;
    const open = (src, link) => { card.src = src + V; curLink = link || null; root.classList.add('map-open'); };
    const hide = () => root.classList.remove('map-open');
    dim.addEventListener('click', hide);
    card.addEventListener('click', e => { e.stopPropagation(); if (curLink) goId(curLink); });
    page.mapHotspots.forEach(h => {
      const b = el('div', 'map-hot', { left: px(h.x - h.r), top: px(h.y - h.r), width: px(h.r * 2), height: px(h.r * 2) });
      b.title = h.label;
      b.addEventListener('mouseenter', () => open(h.card, h.link));
      b.addEventListener('click', e => { e.stopPropagation(); open(h.card, h.link); });
      lay.appendChild(b);
    });
  }

  function appendAnnotated(parent, text, anns, used) {
    if (!anns || !anns.length) { parent.appendChild(document.createTextNode(text)); return; }
    let rest = text, guard = 0;
    while (rest.length && guard++ < 500) {
      let best = null, bi = Infinity;
      anns.forEach(a => { if (used && used.has(a.term)) return; const k = rest.indexOf(a.term); if (k >= 0 && (k < bi || (k === bi && a.term.length > best.term.length))) { bi = k; best = a; } });
      if (!best) { parent.appendChild(document.createTextNode(rest)); break; }
      if (bi > 0) parent.appendChild(document.createTextNode(rest.slice(0, bi)));
      const span = el('span', 'annot'); span.appendChild(document.createTextNode(best.term));
      const tip = el('span', 'annot-tip');
      const h = el('span', 'annot-h'); h.textContent = best.label || best.term; tip.appendChild(h);
      const dd = el('span', 'annot-d'); dd.textContent = best.def; tip.appendChild(dd);
      span.appendChild(tip); parent.appendChild(span);
      if (used) used.add(best.term);
      rest = rest.slice(bi + best.term.length);
    }
  }

  function renderTextBlocks(page, root, content) {
    const fam = { sans: 'var(--font-sans)', rounded: '"NanumSquare",var(--font-sans)' };
    const usedAnnot = new Set();
    (page.textBlocks || []).forEach(b => {
      const val = content && content.text ? content.text[b.id] : null;
      if (val == null) return;
      const anns = (content && content.annotations) || [];
      const n = el('div', 'txt-block', {
        left: px(b.x), top: px(b.y), width: px(b.w), fontSize: px(b.size),
        color: b.color || '#1d1d1b', fontFamily: fam[b.family] || 'var(--font-sans)', fontWeight: String(b.weight || 400),
        textAlign: b.align || 'left', lineHeight: String(b.lineHeight || 1.5)
      });
      if (b.type === 'section' && val && typeof val === 'object') {
        n.appendChild(el('div', 'sec-bullet'));
        if (val.label) { const l = el('div', 'sec-label'); l.textContent = val.label; n.appendChild(l); }
        if (val.body) { const bd = el('div', 'sec-body'); appendAnnotated(bd, val.body, anns, usedAnnot); n.appendChild(bd); }
      }
      else if (Array.isArray(val)) { val.forEach(t => { const p = el('p', 'txt-para'); appendAnnotated(p, t, anns, usedAnnot); n.appendChild(p); }); }
      else n.textContent = val;
      root.appendChild(n);
    });
  }

  function positionTip(tip, rc, place) {
    if (place === 'right') { tip.style.left = px(rc.x + rc.w + 12); tip.style.top = px(rc.y + rc.h - 34); tip.style.transform = 'translateY(-50%)'; }
    else { tip.style.left = px(rc.x + rc.w / 2); tip.style.top = px(rc.y - 8); tip.style.transform = 'translate(-50%,-100%)'; }
  }

  function addPageInteractions(page, root, content) {
    const pdata = (PHOTOS || {})[pad3(idx + 1)] || { display: [], gallery: [] };
    const dim = el('div', 'gal-dim');
    const gimg = el('img', 'gal-img');
    const prev = el('button', 'gal-nav gal-prev'); prev.innerHTML = '‹';
    const next = el('button', 'gal-nav gal-next'); next.innerHTML = '›';
    const cnt = el('div', 'gal-count');
    dim.appendChild(gimg); dim.appendChild(prev); dim.appendChild(next); dim.appendChild(cnt); root.appendChild(dim);
    let glist = [], gi = 0;
    const gshow = () => { gimg.src = glist[gi]; cnt.textContent = (gi + 1) + ' / ' + glist.length; const m = glist.length > 1; prev.style.display = next.style.display = m ? 'flex' : 'none'; cnt.style.display = m ? 'block' : 'none'; };
    const gopen = (arr, st) => { glist = arr; gi = st || 0; gshow(); dim.classList.add('show'); };
    prev.addEventListener('click', e => { e.stopPropagation(); gi = (gi - 1 + glist.length) % glist.length; gshow(); });
    next.addEventListener('click', e => { e.stopPropagation(); gi = (gi + 1) % glist.length; gshow(); });
    gimg.addEventListener('click', e => e.stopPropagation());
    dim.addEventListener('click', () => dim.classList.remove('show'));
    const tipLayer = el('div', 'tip-layer'); root.appendChild(tipLayer);
    (page.buttons || []).forEach(bt => {
      const rc = bt.rect, key = bt.key;
      const label = content && content.labels ? content.labels[key] : '';
      const tipTxt = content && content.tips ? content.tips[key] : '';
      const url = content && content.links ? content.links[key] : null;
      let b;
      if (bt.type === 'ar') {
        b = el('div', 'btn-ar', { left: px(rc.x), top: px(rc.y), width: px(rc.w), height: px(rc.h) });
        b.innerHTML = '<img class="ar-ico-img" src="assets/icons/ar-ico.svg' + V + '" alt="AR">';
      }
      else if (bt.type === 'gmap') {
        b = el('div', 'btn-gmap', { left: px(rc.x), top: px(rc.y), width: px(rc.w), height: px(rc.h) });
        const gi = el('img', 'btn-gmap-img'); gi.src = 'assets/icons/gmap-marker.png' + V; b.appendChild(gi);
      }
      else if (bt.type === 'vr') {
        b = el('div', 'btn-vr', { left: px(rc.x), top: px(rc.y), width: px(rc.w), height: px(rc.h) });
        b.innerHTML = '<img class="ar-ico-img" src="assets/icons/vr-ico.svg' + V + '" alt="VR">';
      }
      else { b = el('div', 'btn-add', { left: px(rc.x), top: px(rc.y), width: px(rc.w), height: px(rc.h) }); b.textContent = label || ''; }
      if (url) b.addEventListener('click', () => window.open(url, '_blank'));
      if (tipTxt) {
        const tip = el('div', 'btn-tip'); tip.textContent = tipTxt; tipLayer.appendChild(tip);
        b.addEventListener('mouseenter', () => { positionTip(tip, rc, bt.place); tip.classList.add('show'); });
        b.addEventListener('mouseleave', () => tip.classList.remove('show'));
      }
      root.appendChild(b);
    });
    (page.photoSlots || []).forEach((slot, i) => {
      const fn = pdata.display[i] || pdata.gallery[0]; if (!fn) return; const rc = slot.rect;
      const im = el('img', 'page-photo', { left: px(rc.x), top: px(rc.y), width: px(rc.w), height: px(rc.h), borderRadius: px(slot.radius || 20) });
      im.src = 'photos/' + fn + V; im.title = '사진 크게 보기';
      im.addEventListener('error', () => { im.style.display = 'none'; });
      im.addEventListener('click', () => { const arr = (pdata.gallery.length ? pdata.gallery : [fn]).map(f => 'photos/' + f + V); gopen(arr, 0); });
      root.appendChild(im);
    });
  }

  function renderQuiz(page, root, content) {
    const q = (content && content.quiz) || {};
    const pnum = pad3(idx + 1); const pd = (PHOTOS || {})[pnum] || { display: [] };
    // 문제 텍스트 (편집 가능)
    if (page.qtext && q.question) {
      const c = page.qtext;
      const qt = el('div', 'quiz-q', { left: px(c.x), top: px(c.y), width: px(c.w), fontSize: px(c.size), color: c.color || '#fff', fontWeight: String(c.weight || 600), lineHeight: String(c.lineHeight || 1.3) });
      qt.textContent = q.question; root.appendChild(qt);
    }
    // 사진 (폴더) + 확대
    const zoom = el('div', 'quiz-zoom'); const zimg = el('img', 'quiz-zoom-img'); zoom.appendChild(zimg); root.appendChild(zoom);
    zoom.addEventListener('click', () => zoom.classList.remove('show'));
    if (page.photoSlot && pd.display[0]) {
      const rc = page.photoSlot.rect;
      const im = el('img', 'quiz-photo', { left: px(rc.x), top: px(rc.y), width: px(rc.w), height: px(rc.h), borderRadius: px(page.photoSlot.radius || 10) });
      im.src = 'photos/' + pd.display[0] + V; im.addEventListener('error', () => { im.style.display = 'none'; });
      if (page.photoSlot.zoom) { im.style.cursor = 'zoom-in'; im.addEventListener('click', () => { zimg.src = 'photos/' + pd.display[0] + V; zoom.classList.add('show'); }); }
      root.appendChild(im);
    }
    // 정답 팝업: 딤 레이어 + ansN.svg + 텍스트 오버레이
    const ans = el('div', 'quiz-ans');
    const ap = page.answerPanel;
    if (ap) { const aimg = el('img', 'quiz-ans-svg', { left: px(ap.x), top: px(ap.y), width: px(ap.w), height: px(ap.h) }); aimg.src = ap.src + V; aimg.draggable = false; ans.appendChild(aimg); }
    const AL = page.answerLayout || {};
    const mkTxt = (cfg, text) => { if (!cfg || text == null || text === '') return; const t = el('div', 'quiz-anstext', { left: px(cfg.x), top: px(cfg.y), width: px(cfg.w), fontSize: px(cfg.size || 28), color: cfg.color || '#1d1d1b', fontWeight: String(cfg.weight || 400), textAlign: cfg.align || 'left', lineHeight: String(cfg.lineHeight || 1.5) }); t.textContent = text; ans.appendChild(t); };
    mkTxt(AL.question, q.question);
    mkTxt(AL.label, q.answerLabel || '정답');
    mkTxt(AL.explanation, q.explanation || '');
    ans.addEventListener('click', () => ans.classList.remove('show')); root.appendChild(ans);
    // 오답
    const wrong = el('div', 'quiz-wrong'); const wm = el('div', 'quiz-wrong-msg'); wm.textContent = q.wrongMsg || '다시 풀어보세요!'; wrong.appendChild(wm);
    wrong.addEventListener('click', () => wrong.classList.remove('show')); root.appendChild(wrong);
    // 보기
    const o = page.options || { x: 1063, y: 486, stepY: 123, w: 677, h: 81 };
    (q.options || []).forEach((txt, i) => {
      const row = el('div', 'quiz-opt', { left: px(o.x), top: px(o.y + i * o.stepY), width: px(o.w), height: px(o.h) });
      const c = el('div', 'quiz-opt-num'); c.textContent = String(i + 1); row.appendChild(c);
      const bx = el('div', 'quiz-opt-box'); bx.textContent = txt; row.appendChild(bx);
      row.addEventListener('click', () => { (i + 1 === q.correct ? ans : wrong).classList.add('show'); });
      root.appendChild(row);
    });
  }

  function renderPlaceholder(page, root) {
    const ph = el('div', 'placeholder');
    const tag = page.course ? `${page.course}코스` : '공통';
    ph.innerHTML = `<div class="ph-badge">${tag} · ${typeLabel(page.type)}</div><div class="ph-title">${page.title}</div>
      <div class="ph-sub">${page.available ? '소스 보유 — 콘텐츠 작업 예정' : '세부 페이지 구축 예정'}</div><div class="ph-tag">${page.id}</div>`;
    root.appendChild(ph);
  }
  const typeLabel = t => ({ title: '타이틀', toc: '목차', map: '지도', 'map-popup': '지도 팝업', prestudy: '사전 학습', intro: '개론', reading: '읽기자료', quiz: '퀴즈', note: '탐방노트' }[t] || t);

  // ===== 탐방노트 저장소 (IndexedDB · 로그인 불필요, 브라우저 영속) =====
  const NDB = 'bohun_note'; let _ndb = null;
  function idb() {
    return new Promise((res, rej) => {
      if (_ndb) return res(_ndb); const r = indexedDB.open(NDB, 1);
      r.onupgradeneeded = e => { const db = e.target.result; if (!db.objectStoreNames.contains('scraps')) db.createObjectStore('scraps', { keyPath: 'id', autoIncrement: true }); if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv'); };
      r.onsuccess = e => { _ndb = e.target.result; res(_ndb); }; r.onerror = () => rej(r.error);
    });
  }
  function idbAdd(s, v) { return idb().then(db => new Promise((res, rej) => { const rq = db.transaction(s, 'readwrite').objectStore(s).add(v); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); })); }
  function idbAll(s) { return idb().then(db => new Promise((res, rej) => { const rq = db.transaction(s, 'readonly').objectStore(s).getAll(); rq.onsuccess = () => res(rq.result || []); rq.onerror = () => rej(rq.error); })); }
  function idbDel(s, k) { return idb().then(db => new Promise((res, rej) => { const rq = db.transaction(s, 'readwrite').objectStore(s).delete(k); rq.onsuccess = () => res(); rq.onerror = () => rej(rq.error); })); }
  function idbPut(s, k, v) { return idb().then(db => new Promise((res, rej) => { const rq = db.transaction(s, 'readwrite').objectStore(s).put(v, k); rq.onsuccess = () => res(); rq.onerror = () => rej(rq.error); })); }
  function idbGet(s, k) { return idb().then(db => new Promise((res, rej) => { const rq = db.transaction(s, 'readonly').objectStore(s).get(k); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); })); }

  // 어느 페이지에서든 '스크랩' → 현재 페이지 이미지 캡처 → 스크랩 모음에 저장
  async function captureScrap(p) {
    if (!window.html2canvas) { toast('스크랩 모듈 로딩 중입니다. 잠시 후 다시 시도하세요'); return; }
    const node = stage.querySelector('.page') || stage;
    try {
      toast('스크랩 중…');
      const cv = await html2canvas(node, { scale: 0.55, backgroundColor: '#ffffff', useCORS: true, logging: false });
      const maxW = 760; let out = cv;
      if (cv.width > maxW) { const c2 = document.createElement('canvas'); c2.width = maxW; c2.height = Math.round(cv.height * maxW / cv.width); c2.getContext('2d').drawImage(cv, 0, 0, c2.width, c2.height); out = c2; }
      const data = out.toDataURL('image/jpeg', 0.82);
      await idbAdd('scraps', { img: data, title: p.title, pid: p.id, ts: Date.now() });
      const all = await idbAll('scraps');
      toast("'" + p.title + "' 스크랩됨 · 모음 " + all.length + "장");
    } catch (e) { toast('스크랩에 실패했습니다'); }
  }

  // ===== 탐방노트 렌더 =====
  let SCRAPS = [];
  const ERASER_SVG = '<svg viewBox="0 0 18 18"><path class="ql-stroke" d="M5 12.5 L12.5 5 L15.5 8 L8 15.5 Z" fill="none"></path><line class="ql-stroke" x1="3" y1="15.5" x2="15.5" y2="15.5"></line></svg>';
  function noteToolbarHTML() {
    return '<span class="ql-formats"><button type="button" class="ql-bold"></button><button type="button" class="ql-italic"></button><button type="button" class="ql-underline"></button></span>' +
      '<span class="ql-formats"><button type="button" class="ql-list" value="ordered"></button><button type="button" class="ql-list" value="bullet"></button></span>' +
      '<span class="ql-formats"><button type="button" class="ql-image"></button><button type="button" class="ql-link"></button><button type="button" class="ql-eraser" title="선택한 이미지/글 지우기">' + ERASER_SVG + '</button></span>';
  }
  function noteIndexFromPoint(q, x, y) {
    try {
      const rng = document.caretRangeFromPoint && document.caretRangeFromPoint(x, y);
      if (rng) { const blot = Quill.find(rng.startContainer, true); if (blot && blot.offset) { return blot.offset(q.scroll) + (rng.startOffset || 0); } }
    } catch (e) { }
    const sel = q.getSelection(); return sel ? sel.index : q.getLength();
  }
  function renderScrapGrid(grid) {
    idbAll('scraps').then(list => {
      SCRAPS = list; grid.innerHTML = '';
      if (!list.length) { grid.innerHTML = '<div class="scrap-empty">아직 스크랩한 페이지가 없습니다.<br>교재를 보다가 상단/좌측의 <b>스크랩</b> 버튼을 누르면<br>이 곳에 페이지 이미지가 모입니다.</div>'; return; }
      list.slice().reverse().forEach(s => {
        const cell = el('div', 'scrap-cell'); cell.draggable = true; cell.dataset.id = s.id; cell.title = '끌어다 노트에 넣기 (더블클릭으로도 삽입)';
        const img = el('img'); img.src = s.img; img.alt = s.title || ''; cell.appendChild(img);
        const cap = el('div', 'scrap-cap'); cap.textContent = s.title || ''; cell.appendChild(cap);
        const del = el('button', 'scrap-del'); del.type = 'button'; del.innerHTML = '×'; del.title = '삭제';
        del.addEventListener('click', ev => { ev.stopPropagation(); idbDel('scraps', s.id).then(() => renderScrapGrid(grid)); });
        cell.appendChild(del);
        cell.addEventListener('dragstart', ev => { ev.dataTransfer.setData('text/plain', 'scrap:' + s.id); ev.dataTransfer.effectAllowed = 'copy'; cell.classList.add('dragging'); });
        cell.addEventListener('dragend', () => cell.classList.remove('dragging'));
        cell.addEventListener('dblclick', () => { const q = window._noteQuill; if (q) { const i = q.getSelection() ? q.getSelection().index : q.getLength(); q.insertEmbed(i, 'image', s.img, 'user'); q.setSelection(i + 1, 0, 'user'); } });
        grid.appendChild(cell);
      });
    });
  }
  // 노트 이미지 편집(크기·자르기·삭제·복사·붙여넣기)
  let imgClip = null;
  function setupNoteImages(q, edc, card) {
    const eEl = edc.querySelector('.ql-editor');
    let selImg = null, selIndex = -1;
    const ov = el('div', 'img-ov'); const handle = el('div', 'img-ov-handle');
    const cropBtn = el('button', 'img-ov-crop'); cropBtn.type = 'button'; cropBtn.title = '자르기(crop)';
    cropBtn.innerHTML = '<svg viewBox="0 0 20 20"><path d="M6 2 V6 H2 M14 2 V6 H18 M6 18 V14 H2 M14 18 V14 H18" stroke="#fff" stroke-width="2" fill="none"/></svg>';
    const delb = el('button', 'img-ov-del'); delb.type = 'button'; delb.innerHTML = '×'; delb.title = '이미지 삭제';
    ov.appendChild(handle); ov.appendChild(cropBtn); ov.appendChild(delb); ov.style.display = 'none'; card.appendChild(ov);
    function idxOf(img) { try { const b = Quill.find(img); if (b) return b.offset(q.scroll); } catch (e) { } return -1; }
    function scaleOf() { const cr = card.getBoundingClientRect(); return cr.width / card.offsetWidth || 1; }
    function place() {
      if (!selImg || !selImg.isConnected) { ov.style.display = 'none'; return; }
      const cr = card.getBoundingClientRect(), ir = selImg.getBoundingClientRect(), er = eEl.getBoundingClientRect(), sc = scaleOf();
      if (ir.bottom < er.top + 2 || ir.top > er.bottom - 2) { ov.style.display = 'none'; return; }
      ov.style.display = 'block';
      ov.style.left = ((ir.left - cr.left) / sc) + 'px'; ov.style.top = ((ir.top - cr.top) / sc) + 'px';
      ov.style.width = (ir.width / sc) + 'px'; ov.style.height = (ir.height / sc) + 'px';
    }
    eEl.addEventListener('click', e => { if (e.target && e.target.tagName === 'IMG') { selImg = e.target; selIndex = idxOf(selImg); if (selIndex >= 0) q.setSelection(selIndex, 1, 'user'); place(); } else { selImg = null; ov.style.display = 'none'; } });
    eEl.addEventListener('scroll', place);
    delb.addEventListener('click', () => { if (selImg && selIndex >= 0) { q.deleteText(selIndex, 1, 'user'); selImg = null; ov.style.display = 'none'; idbPut('kv', 'note_delta', q.getContents()); } });
    let rz = null;
    handle.addEventListener('mousedown', e => { e.preventDefault(); if (!selImg) return; const sc = scaleOf(); rz = { x: e.clientX, w: selImg.getBoundingClientRect().width / sc }; document.addEventListener('mousemove', rzMove); document.addEventListener('mouseup', rzUp); });
    function rzMove(e) { if (!rz || !selImg) return; const sc = scaleOf(); let nw = Math.max(60, rz.w + (e.clientX - rz.x) / sc); nw = Math.min(nw, eEl.clientWidth - 24); if (selIndex >= 0) q.formatText(selIndex, 1, 'width', String(Math.round(nw)), 'user'); place(); }
    function rzUp() { rz = null; document.removeEventListener('mousemove', rzMove); document.removeEventListener('mouseup', rzUp); idbPut('kv', 'note_delta', q.getContents()); }
    cropBtn.addEventListener('click', startCrop);
    function startCrop() {
      if (!selImg) return; const sc = scaleOf();
      const cr = card.getBoundingClientRect(), ir = selImg.getBoundingClientRect();
      const ix = (ir.left - cr.left) / sc, iy = (ir.top - cr.top) / sc, iw = ir.width / sc, ih = ir.height / sc;
      ov.style.display = 'none';
      const layer = el('div', 'crop-layer'); const box = el('div', 'crop-box');
      let bx = ix + iw * 0.1, by = iy + ih * 0.1, bw = iw * 0.8, bh = ih * 0.8;
      function draw() { box.style.left = bx + 'px'; box.style.top = by + 'px'; box.style.width = bw + 'px'; box.style.height = bh + 'px'; }
      ['nw', 'ne', 'sw', 'se'].forEach(pos => { const h = el('div', 'crop-h crop-' + pos); h.dataset.pos = pos; box.appendChild(h); });
      const bar = el('div', 'crop-bar'); const ok = el('button', 'crop-ok'); ok.type = 'button'; ok.textContent = '자르기 적용';
      const no = el('button', 'crop-cancel'); no.type = 'button'; no.textContent = '취소'; bar.appendChild(no); bar.appendChild(ok);
      layer.appendChild(box); layer.appendChild(bar); card.appendChild(layer); draw();
      bar.style.left = ix + 'px'; bar.style.top = (Math.min(iy + ih + 8, card.offsetHeight - 44)) + 'px';
      let mode = null, start = null;
      box.addEventListener('mousedown', e => { if (e.target.classList.contains('crop-h')) { mode = { resize: e.target.dataset.pos }; } else { mode = { move: true }; } start = { x: e.clientX, y: e.clientY, bx: bx, by: by, bw: bw, bh: bh }; e.preventDefault(); e.stopPropagation(); document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up); });
      function mv(e) {
        if (!mode) return; const dx = (e.clientX - start.x) / sc, dy = (e.clientY - start.y) / sc;
        if (mode.move) { bx = Math.min(Math.max(ix, start.bx + dx), ix + iw - bw); by = Math.min(Math.max(iy, start.by + dy), iy + ih - bh); }
        else {
          const p = mode.resize; let nx = start.bx, ny = start.by, nw = start.bw, nh = start.bh;
          if (p.indexOf('w') >= 0) { nx = start.bx + dx; nw = start.bw - dx; } if (p.indexOf('e') >= 0) { nw = start.bw + dx; }
          if (p.indexOf('n') >= 0) { ny = start.by + dy; nh = start.bh - dy; } if (p.indexOf('s') >= 0) { nh = start.bh + dy; }
          if (nw > 30 && nx >= ix && nx + nw <= ix + iw) { bx = nx; bw = nw; } if (nh > 30 && ny >= iy && ny + nh <= iy + ih) { by = ny; bh = nh; }
        }
        draw();
      }
      function up() { mode = null; document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); }
      no.addEventListener('click', () => { if (layer.parentNode) card.removeChild(layer); place(); });
      ok.addEventListener('click', () => {
        const nat = selImg.naturalWidth, natH = selImg.naturalHeight;
        const fx = (bx - ix) / iw, fy = (by - iy) / ih, fw = bw / iw, fh = bh / ih;
        const sxN = Math.max(0, Math.round(fx * nat)), syN = Math.max(0, Math.round(fy * natH)), swN = Math.round(fw * nat), shN = Math.round(fh * natH);
        const cv = document.createElement('canvas'); cv.width = swN; cv.height = shN;
        try { cv.getContext('2d').drawImage(selImg, sxN, syN, swN, shN, 0, 0, swN, shN); } catch (err) { toast('자르기에 실패했습니다'); if (layer.parentNode) card.removeChild(layer); return; }
        const url = cv.toDataURL('image/png'); const dispW = Math.round(bw);
        if (selIndex >= 0) { q.deleteText(selIndex, 1, 'user'); q.insertEmbed(selIndex, 'image', url, 'user'); q.formatText(selIndex, 1, 'width', String(dispW), 'user'); q.setSelection(selIndex + 1, 0, 'user'); }
        if (layer.parentNode) card.removeChild(layer); selImg = null; ov.style.display = 'none'; idbPut('kv', 'note_delta', q.getContents());
      });
    }
    eEl.addEventListener('keydown', e => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && (e.key === 'c' || e.key === 'C') && selImg) { imgClip = selImg.getAttribute('src'); toast('이미지를 복사했습니다 (Ctrl+V로 붙여넣기)'); }
      else if (ctrl && (e.key === 'v' || e.key === 'V') && imgClip) { e.preventDefault(); const sel = q.getSelection(true); const i = sel ? sel.index : q.getLength(); q.insertEmbed(i, 'image', imgClip, 'user'); q.setSelection(i + 1, 0, 'user'); }
    });
    eEl.addEventListener('paste', e => { const items = (e.clipboardData && e.clipboardData.items) || []; for (let i = 0; i < items.length; i++) { if (items[i].type.indexOf('image') === 0) { const f = items[i].getAsFile(); if (!f) continue; const rd = new FileReader(); rd.onload = ev => { const sel = q.getSelection(true); const idx = sel ? sel.index : q.getLength(); q.insertEmbed(idx, 'image', ev.target.result, 'user'); q.setSelection(idx + 1, 0, 'user'); }; rd.readAsDataURL(f); e.preventDefault(); return; } } });
    q.on('selection-change', (range) => { if (!range) { selImg = null; ov.style.display = 'none'; } });
    q.on('text-change', () => { if (selImg && !selImg.isConnected) { selImg = null; ov.style.display = 'none'; } else place(); });
  }

  function renderNote(page, root) {
    const im = el('img', 'full'); im.src = page.image + V; root.appendChild(im);
    const cfg = page.note || {};
    const ed = cfg.editor || { x: 287, y: 291, w: 861, h: 677 };
    const card = el('div', 'note-card', { left: px(ed.x), top: px(ed.y), width: px(ed.w), height: px(ed.h) });
    const tb = el('div', 'note-toolbar'); tb.innerHTML = noteToolbarHTML();
    card.appendChild(tb);
    const edc = el('div', 'note-editor'); card.appendChild(edc);
    const btns = el('div', 'note-btns');
    const clr = el('button', 'note-clear'); clr.type = 'button'; clr.textContent = '전체 지우기';
    const pdf = el('button', 'note-pdf'); pdf.type = 'button'; pdf.textContent = cfg.pdfLabel || 'PDF 출력';
    btns.appendChild(clr); btns.appendChild(pdf); card.appendChild(btns);
    root.appendChild(card);
    const sc = cfg.scrap || { x: 1252, y: 354, w: 540, h: 612 };
    const scard = el('div', 'note-scrap', { left: px(sc.x), top: px(sc.y), width: px(sc.w), height: px(sc.h) });
    const grid = el('div', 'scrap-grid'); scard.appendChild(grid); root.appendChild(scard);
    renderScrapGrid(grid);
    if (!window.Quill) { edc.innerHTML = '<div class="note-noeditor">에디터를 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 새로고침하세요.</div>'; return; }
    const q = new Quill(edc, {
      theme: 'snow', placeholder: '이번 탐방에서 보고 느낀 점을 자유롭게 작성하세요. 오른쪽 스크랩 이미지를 끌어다 넣을 수 있어요.',
      modules: { toolbar: { container: tb, handlers: { eraser: function () { const r = this.quill.getSelection(); if (r && r.length > 0) { this.quill.deleteText(r.index, r.length, 'user'); } else { toast('지울 이미지나 글을 먼저 선택하세요'); } } } } }
    });
    window._noteQuill = q;
    setupNoteImages(q, edc, card);
    idbGet('kv', 'note_delta').then(d => { if (d) { try { q.setContents(d); } catch (e) { } } });
    let st; q.on('text-change', () => { clearTimeout(st); st = setTimeout(() => idbPut('kv', 'note_delta', q.getContents()), 300); });
    const eEl = edc.querySelector('.ql-editor');
    eEl.addEventListener('dragover', e => { const t = e.dataTransfer.types || []; if ([].indexOf.call(t, 'text/plain') >= 0) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; eEl.classList.add('drop-on'); } });
    eEl.addEventListener('dragleave', () => eEl.classList.remove('drop-on'));
    eEl.addEventListener('drop', e => { eEl.classList.remove('drop-on'); const d = e.dataTransfer.getData('text/plain'); if (d.indexOf('scrap:') !== 0) return; e.preventDefault(); const id = +d.slice(6); const s = SCRAPS.find(x => x.id === id); if (!s) return; const i = noteIndexFromPoint(q, e.clientX, e.clientY); q.insertEmbed(i, 'image', s.img, 'user'); q.setSelection(i + 1, 0, 'user'); });
    clr.addEventListener('click', () => { if (window.confirm('작성한 탐방노트 내용을 모두 지울까요? 되돌릴 수 없습니다.')) { q.setContents([]); idbPut('kv', 'note_delta', q.getContents()); toast('탐방노트를 비웠습니다'); } });
    pdf.addEventListener('click', () => {
      if (!window.html2pdf) { toast('PDF 모듈 로딩 중입니다'); return; }
      const srcEl = eEl.cloneNode(true); const wrap2 = document.createElement('div'); wrap2.className = 'pdf-page'; wrap2.appendChild(srcEl);
      const opt = { margin: [12, 12, 12, 12], filename: '탐방노트.pdf', image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['css', 'legacy'], avoid: 'img' } };
      toast('PDF를 생성합니다…'); html2pdf().set(opt).from(wrap2).save();
    });
  }


  function renderFrame(page, root) {
    root.classList.add('framed');
    root.appendChild(el('div', 'frm-panel'));
    root.appendChild(el('div', 'frm-card frm-titlebar'));
    root.appendChild(el('div', 'frm-card frm-body'));
    const bd = el('div', 'frm-badge'); bd.appendChild(el('span', 'frm-flag')); root.appendChild(bd);
    if (page.type === 'prestudy') { const ms = el('div', 'frm-search'); ms.innerHTML = '<svg viewBox="0 0 40 40" fill="none" stroke="#575756" stroke-width="3.4" stroke-linecap="round"><circle cx="17" cy="17" r="10"/><line x1="25" y1="25" x2="33" y2="33"/></svg>'; root.appendChild(ms); }
  }

  function render() {
    stage.innerHTML = '';
    const page = curPage();
    const content = textCache[pad3(idx + 1)];
    const root = el('div', 'page');
    if (page.render === 'editable') renderEditable(page, root);
    else if (page.type === 'quiz') {
      root.classList.add('framed'); root.appendChild(el('div', 'frm-panel'));
      if (page.questionPanel) { const qp = page.questionPanel; const bp = el('img', 'quiz-panel', { left: px(qp.x), top: px(qp.y), width: px(qp.w), height: px(qp.h) }); bp.src = qp.src + V; bp.draggable = false; root.appendChild(bp); }
      renderQuiz(page, root, content);
    }
    else if (page.type === 'note') { renderNote(page, root); }
    else if (page.type === 'reading' || page.type === 'intro' || page.type === 'prestudy') { renderFrame(page, root); }
    else if (page.type === 'map' && page.mapSvg) {
      root.classList.add('framed'); root.appendChild(el('div', 'frm-panel'));
      const mp = el('img', 'map-svg'); mp.src = page.mapSvg + V; mp.draggable = false; root.appendChild(mp);
      if (page.mapBadge) { const bd = el('div', 'map-badge'); bd.textContent = page.mapBadge; root.appendChild(bd); }
      if (page.mapTitle) { const tt = el('div', 'map-title'); tt.textContent = page.mapTitle; root.appendChild(tt); }
    }
    else if (page.render === 'image' && page.image) {
      const im = el('img', 'full'); im.src = page.image + V; root.appendChild(im);
      if (page.imageAnswer) {
        let shown = false; const btn = el('button', 'reveal-btn'); btn.textContent = '정답 확인';
        btn.addEventListener('click', () => { shown = !shown; im.src = (shown ? page.imageAnswer : page.image) + V; btn.textContent = shown ? '문제 보기' : '정답 확인'; });
        root.appendChild(btn);
      }
    } else renderPlaceholder(page, root);
    if (page.mapHotspots) addMapInteraction(page, root);
    if (page.hasText) renderTextBlocks(page, root, content);
    if (page.photoSlots || page.buttons) addPageInteractions(page, root, content);
    stage.appendChild(root);
    chrome.classList.toggle('hide-top', page.type === 'title');
    chrome.classList.toggle('show-glyphs', page.render === 'placeholder');
    chrome.classList.toggle('on-frame', page.type==='reading'||page.type==='intro'||page.type==='prestudy'||page.type==='note'||page.type==='map'||page.type==='quiz'||page.type==='toc');
    const pin=chrome.querySelector('.hot[data-action="map"]');
    if(pin){ pin.disabled = !(page.mapPin && page.course); }
    const _pg=document.querySelector('.pager'); if(_pg) _pg.style.display=(page.type==='note')?'none':'';
    pagerPos.textContent=(idx+1)+' / '+PAGES.length;
    layout();
  }

  const sov=document.getElementById('searchOv'), sin=document.getElementById('searchInput'), sres=document.getElementById('searchRes');
  function openSearch(){ sov.classList.add('open'); sin.value=''; sres.innerHTML=''; sin.focus(); }
  function closeSearch(){ sov.classList.remove('open'); }
  function doSearch(q){
    q=q.trim(); if(!q){ sres.innerHTML=''; return; }
    const hits=PAGES.filter(p=>p.title.includes(q)||p.id.includes(q)).slice(0,30);
    sres.innerHTML=hits.length? hits.map(p=>`<div class="res" data-id="${p.id}">${p.title} <small>${p.id}</small></div>`).join('') : '<div class="res">검색 결과 없음</div>';
    sres.querySelectorAll('.res[data-id]').forEach(d=>d.addEventListener('click',()=>{ closeSearch(); goId(d.dataset.id); }));
  }
  sin.addEventListener('input',e=>doSearch(e.target.value));
  document.getElementById('searchClose').addEventListener('click',closeSearch);

  function checkPortrait(){ document.body.classList.toggle('is-portrait', window.innerHeight>window.innerWidth); }

  document.getElementById('prev').addEventListener('click',()=>go(idx-1));
  document.getElementById('next').addEventListener('click',()=>go(idx+1));
  document.addEventListener('keydown',e=>{
    if(sov.classList.contains('open')){ if(e.key==='Escape')closeSearch(); return; }
    if(e.key==='ArrowLeft')go(idx-1); if(e.key==='ArrowRight')go(idx+1);
  });

  async function ensureContent(num){
    if(num in textCache) return textCache[num];
    try{ const r=await fetch('content/text/'+num+'.json'); textCache[num]=r.ok?await r.json():null; }
    catch(e){ textCache[num]=null; }
    return textCache[num];
  }

  async function boot(){
    try{
      const [sm,ph]=await Promise.all([
        fetch('content/sitemap.json').then(r=>r.json()),
        fetch('content/photos.json').then(r=>r.ok?r.json():{}).catch(()=>({}))
      ]);
      SM=sm; PAGES=sm.pages; STAGE_W=sm.stage.w; STAGE_H=sm.stage.h; R=(sm.chrome&&sm.chrome.iconR)||34; PHOTOS=ph;
    }catch(e){
      stage.style.transform='none';
      stage.innerHTML='<div style="padding:60px 40px;font-size:24px;line-height:1.6;color:#1d1d1b">데이터를 불러오지 못했습니다.<br>이 교재는 로컬 서버로 실행해야 합니다 —<br>폴더의 <b>start.bat</b> 더블클릭 (또는 <code>python -m http.server</code> 후 localhost:8000).</div>';
      return;
    }
    buildChrome(); checkPortrait();
    const hash=location.hash.replace('#',''); const hi=PAGES.findIndex(p=>p.id===hash);
    idx=hi>=0?hi:0; await ensureContent(pad3(idx+1)); render();
  }
  boot();
})();
