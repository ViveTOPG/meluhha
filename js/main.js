// MELUHHA v0.2 — gate, Time River, index, film chapters, choreography
window.MELUHHA = window.MELUHHA || {};
window.MELUHHA.vessel = 0;
gsap.registerPlugin(ScrollTrigger);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp01 = v => Math.max(0, Math.min(1, v));
const span = (p, a, b) => clamp01((p - a) / (b - a));
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const fmtYear = y => y <= -4000 ? ['Before borders', ''] : [String(Math.abs(Math.round(y) || 1)), y < 0 ? 'BCE' : 'CE'];

/* ---------- smooth scroll ---------- */
let lenis;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ lerp: .075, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  window.lenis = lenis;
}
const scrollToEl = el => lenis ? lenis.scrollTo(el, { duration: 2.4 }) : el.scrollIntoView({ behavior: 'smooth' });
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href'); if (id.length < 2) return; e.preventDefault(); scrollToEl($(id));
}));

/* ---------- split words ---------- */
$$('.split').forEach(el => {
  el.innerHTML = el.innerHTML.split(/(<br>|<em>|<\/em>)/).map(part => /^<\/?(br|em)>$/.test(part) ? part :
    part.split(/\s+/).filter(Boolean).map(w => `<span class="w"><span>${w}</span></span>`).join(' ')).join(' ');
});

/* ---------- gate ---------- */
(() => {
  const gate = $('#gate'), load = $('#gateLoad'), bSound = $('#enterSound'), bSilent = $('#enterSilent');
  let ready = false;
  const arm = () => { if (ready) return; ready = true; load.textContent = 'Sound is part of the ritual'; bSound.disabled = bSilent.disabled = false; };
  Promise.race([Promise.all([document.fonts.ready, new Promise(r => addEventListener('load', r))]), new Promise(r => setTimeout(r, 4500))]).then(arm);
  const enter = withSound => {
    if (withSound) { MeluhhaSound.start(); $('#soundToggle').setAttribute('aria-pressed', 'true'); }
    // prime films so they can be seeked on mobile
    $$('video').forEach(v => { if (v.src) v.play().then(() => v.pause()).catch(() => {}); });
    gate.classList.add('gone'); document.body.classList.remove('is-gated'); lenis && lenis.start();
    gsap.from('.hero-title span', { yPercent: 60, opacity: 0, filter: 'blur(12px)', stagger: .09, duration: 2, ease: 'expo.out', delay: .3 });
    gsap.from(['.hero-kicker', '.hero-sub', '.hero-cue'], { opacity: 0, y: 16, stagger: .2, delay: 1, duration: 1.4 });
    gsap.to('.hero-quote .w>span', { y: 0, stagger: .05, delay: 1.4, duration: 1.4, ease: 'expo.out' });
    gsap.from('.frame, .river', { opacity: 0, duration: 2, delay: 1.2 });
  };
  bSound.addEventListener('click', () => enter(true));
  bSilent.addEventListener('click', () => enter(false));
  if (new URLSearchParams(location.search).has('skip')) { arm(); enter(false); }
})();

/* ---------- chapters: Time River + Index ---------- */
const chapters = $$('.chapter').map((el, i) => ({ el, i, name: el.dataset.ch, year: +el.dataset.year, peek: el.dataset.peek }));
(() => {
  const notches = $('#riverNotches'), list = $('#indexList'), peek = $('#indexPeek'), index = $('#index');
  chapters.forEach(c => {
    const b = document.createElement('button'); b.innerHTML = `<span>${c.name}</span>`; b.setAttribute('aria-label', c.name);
    b.addEventListener('click', () => scrollToEl(c.el)); notches.appendChild(b); c.notch = b;
    const li = document.createElement('li'), [y, e] = fmtYear(c.year);
    li.innerHTML = `<a href="#${c.el.id}"><b>${ROMAN[c.i]}</b><span>${c.name}</span><em>${c.year > -4000 ? (c.year < 0 ? 'c. ' : '') + y + ' ' + e : ''}</em></a>`;
    const a = $('a', li);
    a.addEventListener('mouseenter', () => { peek.style.opacity = 0; setTimeout(() => { peek.src = c.peek; peek.style.opacity = 1; }, 150); });
    a.addEventListener('click', e2 => { e2.preventDefault(); closeIndex(); setTimeout(() => scrollToEl(c.el), 500); });
    list.appendChild(li);
  });
  peek.src = chapters[0].peek;
  const openIndex = () => { index.classList.add('open'); index.setAttribute('aria-hidden', 'false'); lenis && lenis.stop(); };
  const closeIndex = () => { index.classList.remove('open'); index.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); };
  $('#openIndex').addEventListener('click', openIndex); $('#closeIndex').addEventListener('click', closeIndex);
  addEventListener('keydown', e => { if (e.key === 'Escape') closeIndex(); });

  const path = $('#riverPath'), bead = $('#riverBead'), line = $('.river-line'), L = path.getTotalLength();
  const yEl = $('#riverYear'), eEl = $('#riverEra'), nEl = $('#riverName'), numEl = $('#riverNum');
  const docH = () => document.documentElement.scrollHeight - innerHeight;
  const placeNotches = () => chapters.forEach(c => { const f = clamp01(c.el.offsetTop / docH()); c.f = f;
    const pt = path.getPointAtLength(L * f); c.notch.style.left = (pt.x / 400 * 100) + '%'; c.notch.style.top = (pt.y / 20 * 100) + '%'; });
  ScrollTrigger.addEventListener('refresh', placeNotches); placeNotches();

  let shownYear = -4000, current = -1;
  gsap.ticker.add(() => {
    const y = scrollY, f = clamp01(y / docH()), pt = path.getPointAtLength(L * f);
    bead.style.left = (pt.x / 400 * 100) + '%'; bead.style.top = (pt.y / 20 * 100) + '%';
    let idx = 0; chapters.forEach((c, k) => { if (y + innerHeight * .5 >= c.el.offsetTop) idx = k; });
    const c = chapters[idx];
    const targetYear = c.el.id === 'ch-time' && window.MELUHHA.year ? window.MELUHHA.year : c.year;
    shownYear += (targetYear - shownYear) * (c.el.id === 'ch-time' ? 1 : .06);
    const [ys, es] = fmtYear(shownYear); yEl.textContent = ys; eEl.textContent = es;
    if (idx !== current) {
      current = idx; nEl.textContent = c.name; numEl.textContent = `${ROMAN[idx]} / ${ROMAN[chapters.length - 1]}`;
      MeluhhaSound.mood(c.name); if (MeluhhaSound.on) MeluhhaSound.chime(440 + idx * 55);
      chapters.forEach(k => k.notch.classList.toggle('on', k === c));
    }
    // frame colour follows the page
    const light = ['ch-body', 'ch-collection', 'ch-finale'].some(id => { const el = document.getElementById(id); if (!el) return false;
      const r = el.getBoundingClientRect(); return r.top < 60 && r.bottom > 60; });
    document.body.classList.toggle('on-light', light && !(c.el.id === 'ch-body' && window.MELUHHA.proOpen));
  });
})();

/* ---------- sound toggle + live waveform ---------- */
(() => {
  const btn = $('#soundToggle'), cv = $('#soundWave'), x = cv.getContext('2d');
  btn.addEventListener('click', () => btn.setAttribute('aria-pressed', MeluhhaSound.toggle()));
  let t = 0;
  gsap.ticker.add(() => {
    t += .05; x.clearRect(0, 0, 56, 20); x.strokeStyle = getComputedStyle(btn).color; x.lineWidth = 1;
    const lv = MeluhhaSound.level(), amp = MeluhhaSound.on ? 2 + (lv[3] || 0) / 40 : .6;
    x.beginPath(); for (let i = 0; i <= 56; i++) { const yy = 10 + Math.sin(i * .35 + t) * amp * Math.sin(i / 56 * Math.PI); i ? x.lineTo(i, yy) : x.moveTo(i, yy); } x.stroke();
  });
})();

/* ---------- film chapters: scroll-scrubbed footage ---------- */
$$('.film').forEach(sec => {
  const media = $('.film-media', sec), vids = $$('.fv', sec), subs = $$('.subs p', sec), spots = $$('.hotspot', sec), cards = $$('.hs-card', sec);
  vids.forEach(v => {
    const src = v.dataset.src;
    fetch(src, { method: 'HEAD' }).then(r => { if (!r.ok) throw 0; v.src = src; v.load();
      // the film's own soundtrack becomes this room's ambience
      const room = new Audio(src.replace(/\.mp4$/, '.m4a')); room.loop = true; room.volume = 0; v.room = room; })
      .catch(() => { v.classList.add('poster-only'); v.style.background = `center/cover url(${v.poster})`; });
    v.state = { t: 0 };
  });
  spots.forEach(s => s.addEventListener('click', () => {
    const card = $('#' + s.dataset.card); const was = card.classList.contains('on');
    cards.forEach(c => c.classList.remove('on')); if (!was) card.classList.add('on');
  }));
  sec.addEventListener('click', e => { if (!e.target.closest('.hotspot,.hs-card')) cards.forEach(c => c.classList.remove('on')); });
  const range = el => (el.dataset.at || '0,1').split(',').map(Number);
  let p = 0;
  ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', onUpdate: s => p = s.progress, onRefresh: s => p = s.progress });
  ScrollTrigger.create({ trigger: sec, start: 'top 60%', end: 'bottom 40%', toggleClass: 'in-view' });
  // entrance: the frame opens like a lens
  ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'top top', scrub: true, onUpdate: s => {
    media.style.setProperty('--ci', `${(1 - s.progress) * 8}% ${(1 - s.progress) * 14}%`); media.style.setProperty('--cr', `${(1 - s.progress) * 28}px`); } });
  gsap.ticker.add(() => {
    const inside = sec.classList.contains('in-view');
    vids.forEach(v => { if (!v.room) return;
      const want = MeluhhaSound.on && inside ? .55 * (v.op || 0) : 0;
      v.room.volume += (want - v.room.volume) * .05;
      if (want > .01 && v.room.paused) v.room.play().catch(() => {});
      if (want === 0 && v.room.volume < .01 && !v.room.paused) v.room.pause(); });
    if (!inside && (p <= 0 || p >= 1)) return;
    vids.forEach((v, i) => {
      const a = +v.dataset.from, b = +v.dataset.to, local = span(p, a, b);
      const fadeIn = i === 0 ? 1 : span(p, a, a + .06), fadeOut = i === vids.length - 1 ? 1 : 1 - span(p, b - .06, b);
      const op = Math.min(fadeIn, fadeOut), stage = v.closest('.arch-stage');
      if (stage) { stage.style.opacity = op; v.style.opacity = 1; v.style.transform = `scale(${1.12 - .12 * local})`;
        $('.arch', stage).style.setProperty('--as', .9 + .14 * gsap.parseEase('power2.inOut')(local));
        $('.arch-bg', stage).style.transform = `scale(${1.1 + .1 * local})`; }
      else { v.style.opacity = op; v.style.transform = `scale(${1.08 - .08 * local})`; }
      v.op = op;
      if (v.duration && v.readyState >= 1) {
        const want = local * (v.duration - .05);
        v.state.t += (want - v.state.t) * .18;
        if (Math.abs(v.currentTime - v.state.t) > .033) { v.fastSeek && Math.abs(v.currentTime - v.state.t) > 1 ? v.fastSeek(v.state.t) : (v.currentTime = v.state.t); }
      }
    });
    subs.forEach(el => { const [a, b] = range(el), k = Math.min(span(p, a, a + .05), b > 1 ? 1 : 1 - span(p, b - .05, b));
      el.style.opacity = k; el.style.filter = `blur(${(1 - k) * 8}px)`; el.style.transform = `translateY(${(1 - k) * 18}px)`; });
    spots.forEach(s => { const [a, b] = range(s); s.classList.toggle('on', p >= a && p <= b); });
    $$('.steps li', sec).forEach(li => { const [a, b] = range(li); li.classList.toggle('on', p >= a && p < b); });
  });
});

/* ---------- V · the body remembers ---------- */
(() => {
  const media = $('.pro-media'), img = $('.pro-media img'), quote = $('.pro-quote');
  ScrollTrigger.create({ trigger: '.pro-stage', start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: s => {
    const k = gsap.parseEase('power2.inOut')(s.progress), w = 34 * (1 - k), h = 12 * (1 - k), r = 999 * (1 - k);
    media.style.clipPath = `inset(${h}% ${innerWidth < 800 ? 10 * (1 - k) : w}% ${h}% ${innerWidth < 800 ? 10 * (1 - k) : w}% round ${r}px ${r}px 0 0)`;
    img.style.transform = `scale(${1.2 - .2 * k})`;
    quote.style.opacity = span(s.progress, .45, .6) * (1 - span(s.progress, .92, 1));
    $('.pro-sticky').style.setProperty('--shade', quote.style.opacity);
    if (s.progress > .45 && !quote.dataset.on) { quote.dataset.on = 1; gsap.to($$('.w>span', quote), { y: 0, stagger: .04, duration: 1.4, ease: 'expo.out' }); }
    window.MELUHHA.proOpen = s.progress > .4 && s.progress < 1; } });
  $$('[data-count]').forEach(b => gsap.to(b, { innerText: +b.dataset.count, snap: { innerText: 1 }, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: b, start: 'top 85%' } }));
})();

/* ---------- generic reveals ---------- */
$$('.split').forEach(el => { if (el.closest('.hero') || el.closest('.pro-stage')) return;
  gsap.to($$('.w>span', el), { y: 0, stagger: .05, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } }); });
$$('.lede, .stat-row, .northstar, .care-truth > div, .col-head').forEach(el =>
  gsap.from(el, { opacity: 0, y: 40, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
$$('.care-truth img').forEach(img => gsap.fromTo(img, { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img, scrub: true } }));

/* ---------- VI · vessel (3D lives in bottle.js) ---------- */
(() => {
  const sec = $('.vessel'); if (!sec) return;
  const intro = $('.stela-intro'), calls = $$('.callout'), pal = $('.palette'), head = $('.thresholds-head'),
    ths = $$('.th'), dots = $('.th-dots'), dotEls = $$('.th-dots i'), tag = $('.vessel .film-tag');
  const fadeIO = (p, a, b, f = .03) => Math.min(span(p, a, a + f), 1 - span(p, b - f, b));
  ScrollTrigger.create({ trigger: sec, start: 'top 60%', end: 'bottom 40%', toggleClass: 'in-view' });
  ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: s => {
    const p = s.progress; window.MELUHHA.vessel = p;
    intro.style.opacity = fadeIO(p, 0, .4);
    calls.forEach((c, i) => { const a = .08 + i * .07, k = fadeIO(p, a, .4);
      c.style.opacity = k; c.style.transform = `translateY(${(1 - k) * 16}px)`; $('i', c).style.transform = `scaleX(${k})`; });
    pal.style.opacity = fadeIO(p, .3, .4);
    tag.style.opacity = .8 * (1 - span(p, .4, .44));
    head.style.opacity = fadeIO(p, .42, .52); head.style.transform = `translateY(${(1 - span(p, .42, .46)) * 30}px)`;
    let active = -1;
    ths.forEach((t, i) => { const a = .5 + i * .1, k = fadeIO(p, a, i === 4 ? 1.01 : a + .1, .025);
      t.style.opacity = k; t.style.transform = innerWidth > 800 ? `translateY(calc(-50% + ${(1 - k) * 40}px))` : `translateY(${(1 - k) * 30}px)`;
      if (k > .5) active = i; });
    dots.style.opacity = span(p, .48, .52);
    dotEls.forEach((d, i) => d.classList.toggle('on', i === active));
  } });
})();

/* ---------- VIII · layering words + drifting objects ---------- */
$$('.fill-words span').forEach(s => gsap.fromTo(s, { backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0', ease: 'none',
  scrollTrigger: { trigger: s, start: 'top 80%', end: 'top 35%', scrub: true } }));
(() => { const track = $('.objects-track');
  gsap.fromTo(track, { x: () => innerWidth * .3 }, { x: () => -(track.scrollWidth - innerWidth * .7), ease: 'none',
    scrollTrigger: { trigger: track, start: 'top bottom', end: 'bottom top', scrub: 1, invalidateOnRefresh: true } }); })();

/* ---------- IX · collection hover ---------- */
(() => {
  const box = $('.col-hover'), img = $('img', box); let x = 0, y = 0, tx = 0, ty = 0;
  $$('.col-row').forEach(r => { r.addEventListener('mouseenter', () => { img.src = r.dataset.img; box.classList.add('on'); }); r.addEventListener('mouseleave', () => box.classList.remove('on')); });
  addEventListener('pointermove', e => { tx = e.clientX + 30; ty = e.clientY - 165; });
  gsap.ticker.add(() => { x += (tx - x) * .12; y += (ty - y) * .12; box.style.transform = `translate(${x}px,${y}px)`; });
})();

/* ---------- finale: the seal presses ---------- */
(() => {
  // the seal film is scrubbed by scroll: wax pools, the stamp descends, presses, lifts — then the house speaks
  const veil = $('.finale-veil'), pre = $('.finale-pre'), title = $('.finale-title'), join = $('.join'), film = $('.finale-film');
  fetch(film.dataset.src, { method: 'HEAD' }).then(r => { if (r.ok) { film.src = film.dataset.src; film.load(); } }).catch(() => {});
  let p = 0, ft = 0, thud = false;
  ScrollTrigger.create({ trigger: '.finale', start: 'top top', end: 'bottom bottom', onUpdate: s => p = s.progress, onRefresh: s => p = s.progress });
  gsap.ticker.add(() => {
    if (film.duration) { const want = span(p, 0, .62) * (film.duration - .05); ft += (want - ft) * .16;
      if (Math.abs(film.currentTime - ft) > .033) film.currentTime = ft; }
    film.style.transform = `scale(${1.08 + .06 * span(p, .55, 1)})`;
    veil.style.opacity = span(p, .6, .72);
    pre.style.opacity = span(p, .64, .72); title.style.opacity = span(p, .7, .8);
    title.style.letterSpacing = `${.3 - .16 * span(p, .7, .9)}em`; join.style.opacity = span(p, .82, .9);
    if (p > .3 && !thud) { thud = true; MeluhhaSound.chime(196); } if (p < .2) thud = false;
  });
})();

/* ---------- notes on non-film sections ---------- */
$$('section:not(.film):not(.vessel)').forEach(s => ScrollTrigger.create({ trigger: s, start: 'top 60%', end: 'bottom 40%', toggleClass: 'in-view' }));
const notesBtn = $('#toggleNotes');
const setNotes = on => { document.body.classList.toggle('notes', on); notesBtn.setAttribute('aria-pressed', on); };
notesBtn.addEventListener('click', () => setNotes(!document.body.classList.contains('notes')));
addEventListener('keydown', e => { if (e.key.toLowerCase() === 'n' && e.target.tagName !== 'INPUT') setNotes(!document.body.classList.contains('notes')); });
if (new URLSearchParams(location.search).has('notes')) setNotes(true);

/* ---------- cursor ---------- */
(() => {
  const c = $('.cursor'), label = $('em', c); let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; });
  gsap.ticker.add(() => { x += (tx - x) * .22; y += (ty - y) * .22; c.style.transform = `translate(${x}px,${y}px)`; });
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('a,button,.col-row,.objects-track figure,.hotspot');
    c.classList.toggle('hover', !!t);
    const txt = t?.classList.contains('hotspot') ? 'Explore' : t?.classList.contains('col-row') ? 'Discover' : '';
    label.textContent = txt; c.classList.toggle('label', !!txt);
  });
})();

addEventListener('load', () => ScrollTrigger.refresh());
