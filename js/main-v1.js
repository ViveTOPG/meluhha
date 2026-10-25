// MELUHHA — scroll choreography (GSAP + ScrollTrigger + Lenis)
window.MELUHHA = { vessel: 0 };
gsap.registerPlugin(ScrollTrigger);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp01 = v => Math.max(0, Math.min(1, v));
const span = (p, a, b) => clamp01((p - a) / (b - a)); // local 0..1 of p within [a,b]

/* ---------- smooth scroll ---------- */
let lenis;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ lerp: .085, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  window.lenis = lenis;
}
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href'); if (id.length < 2) return;
  e.preventDefault(); lenis ? lenis.scrollTo(id, { duration: 2.2 }) : $(id).scrollIntoView({ behavior: 'smooth' });
}));

/* ---------- split words ---------- */
$$('.split').forEach(el => {
  el.innerHTML = el.innerHTML.split(/(<br>)/).map(part => part === '<br>' ? part :
    part.split(/\s+/).filter(Boolean).map(w => `<span class="w"><span>${w}</span></span>`).join(' ')).join('');
});

/* ---------- loader ---------- */
function runLoader(done) {
  const y = $('#loaderYear'), era = $('#loaderEra');
  const o = { v: -2600 };
  gsap.to(o, { v: 2026, duration: reduce ? .1 : 2.4, ease: 'power3.inOut', delay: .4,
    onUpdate() { const v = Math.round(o.v); y.textContent = Math.abs(v || 1); era.textContent = v < 0 ? 'BCE' : 'CE'; },
    onComplete() { setTimeout(() => { $('#loader').classList.add('done'); document.body.classList.remove('is-loading'); lenis && lenis.start(); done(); }, 350); } });
}
runLoader(() => {
  gsap.from('.hero-title span', { yPercent: 110, opacity: 0, rotateX: -70, stagger: .07, duration: 1.6, ease: 'expo.out' });
  gsap.from(['.kicker', '.hero-sub', '.scroll-cue'], { opacity: 0, y: 20, stagger: .15, delay: .6, duration: 1.2 });
  gsap.to('.hero-quote .w>span', { y: 0, stagger: .04, delay: 1, duration: 1.2, ease: 'expo.out' });
});

/* ---------- generic reveals ---------- */
$$('.split').forEach(el => { if (el.closest('.hero')) return;
  gsap.to($$('.w>span', el), { y: 0, stagger: .05, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } }); });
$$('.pro-copy p, .house-cols p, .northstar, .care-truth > div, .col-head, .objects-head, .layer-flow p').forEach(el =>
  gsap.from(el, { opacity: 0, y: 40, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
$$('.mask-reveal').forEach(f => {
  gsap.fromTo(f, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.8, ease: 'expo.inOut', scrollTrigger: { trigger: f, start: 'top 80%' } });
  gsap.fromTo($('img', f), { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: f, scrub: true } });
});
$$('.care-truth img').forEach(img => gsap.fromTo(img, { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img, scrub: true } }));

/* helper: scrubbed sticky section -> progress callback */
function sticky(sel, fn) {
  const el = $(sel);
  ScrollTrigger.create({ trigger: el, start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: s => fn(s.progress), onRefresh: s => fn(s.progress) });
  ScrollTrigger.create({ trigger: el, start: 'top 60%', end: 'bottom 40%', toggleClass: 'in-view' });
}

/* ---------- I · voyage ---------- */
(() => {
  const route = $('#route'), dot = $('#vessel'), L = route.getTotalLength();
  route.style.strokeDasharray = L; route.style.strokeDashoffset = L;
  const ports = $$('.port'), lines = $$('.v-line'), tablet = $('.tablet');
  const show = (el, k) => { el.style.opacity = k; el.style.transform = `translateY(${(1 - k) * 30}px)`; };
  sticky('.voyage', p => {
    const d = span(p, .05, .8);
    route.style.strokeDashoffset = L * (1 - d);
    const pt = route.getPointAtLength(L * d); dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
    ports.forEach(g => g.classList.toggle('on', d >= +g.dataset.at - .001));
    const steps = [[0, .26], [.26, .5], [.5, .74], [.74, 1.01]];
    lines.forEach((l, i) => { const [a, b] = steps[i]; const k = Math.min(span(p, a, a + .06), i === 3 ? 1 : 1 - span(p, b - .05, b)); show(l, k); });
    const tk = span(p, .76, .9); tablet.style.opacity = tk; tablet.style.transform = `rotate(${-8 + 8 * tk}deg) scale(${.6 + .4 * tk})`;
  });
})();

/* ---------- II · cities ---------- */
(() => {
  const frame = $('.cities-frame'), i1 = $('.c-img-1'), i2 = $('.c-img-2'), i3 = $('.c-img-3'), lines = $$('.c-line'), st = $('.cities-sticky');
  sticky('.cities', p => {
    const o = 1 - span(p, 0, .22), r = 300 * o;
    frame.style.clipPath = `inset(${18 * o}% ${30 * o}% ${18 * o}% ${30 * o}% round ${r}px ${r}px 0 0)`;
    i1.style.transform = `scale(${1.25 - .25 * span(p, 0, .45)})`;
    i2.style.opacity = span(p, .4, .5); i2.style.transform = `scale(${1.15 - .15 * span(p, .4, .75)})`;
    i3.style.opacity = span(p, .72, .82); i3.style.transform = `scale(${1.1 - .1 * span(p, .72, 1)})`;
    st.style.setProperty('--shade', span(p, .12, .22));
    [[.18, .4], [.45, .7], [.75, 1.01]].forEach(([a, b], i) => {
      lines[i].style.opacity = Math.min(span(p, a, a + .05), 1 - span(p, b - .04, b));
    });
    // "silence": final line blurs and fades into stillness
    const s = span(p, .9, 1); lines[2].style.filter = `blur(${s * 6}px)`; lines[2].style.letterSpacing = `${s * .08}em`;
  });
})();

/* ---------- III · return ---------- */
(() => {
  const num = $('#yearNum'), era = $('#yearEra'), nots = $$('.r-nots li'), ans = $('.r-answer'), seal = $('.r-seal'), intro = $('.r-intro');
  sticky('.return', p => {
    const y = Math.round(-2600 + 4626 * gsap.parseEase('power2.inOut')(span(p, 0, .35)));
    num.textContent = Math.abs(y || 1); era.textContent = y < 0 ? 'BCE' : 'CE';
    intro.style.opacity = span(p, .3, .38);
    nots.forEach((li, i) => { li.style.opacity = span(p, .38 + i * .08, .42 + i * .08) * (1 - .55 * span(p, .44 + i * .08, .5 + i * .08));
      li.style.setProperty('--strike', span(p, .44 + i * .08, .5 + i * .08)); });
    ans.style.opacity = span(p, .68, .76); ans.style.transform = `translateY(${(1 - span(p, .68, .76)) * 30}px)`;
    seal.style.setProperty('--draw', 400 * (1 - span(p, .76, .95)));
  });
})();

/* ---------- IV · vessel (3D lives in bottle.js) ---------- */
(() => {
  const intro = $('.stela-intro'), calls = $$('.callout'), pal = $('.palette'), head = $('.thresholds-head'),
    ths = $$('.th'), dots = $('.th-dots'), dotEls = $$('.th-dots i'), tag = $('.vessel .chapter-tag');
  const fadeIO = (p, a, b, f = .03) => Math.min(span(p, a, a + f), 1 - span(p, b - f, b));
  sticky('.vessel', p => {
    window.MELUHHA.vessel = p;
    intro.style.opacity = fadeIO(p, 0, .4);
    calls.forEach((c, i) => { const a = .08 + i * .07, k = fadeIO(p, a, .4);
      c.style.opacity = k; c.style.transform = `translateY(${(1 - k) * 16}px)`; $('i', c).style.transform = `scaleX(${k})`; });
    pal.style.opacity = fadeIO(p, .3, .4);
    tag.style.opacity = 1 - span(p, .4, .44);
    head.style.opacity = fadeIO(p, .42, .52); head.style.transform = `translateY(${(1 - span(p, .42, .46)) * 30}px)`;
    let active = -1;
    ths.forEach((t, i) => { const a = .5 + i * .1, k = fadeIO(p, a, i === 4 ? 1.01 : a + .1, .025);
      t.style.opacity = k; t.style.transform = innerWidth > 800 ? `translateY(calc(-50% + ${(1 - k) * 40}px))` : `translateY(${(1 - k) * 30}px)`;
      if (k > .5) active = i; });
    dots.style.opacity = span(p, .48, .52);
    dotEls.forEach((d, i) => d.classList.toggle('on', i === active));
  });
})();

/* ---------- V · ritual ---------- */
(() => {
  const steps = $$('.steps li'), frames = $$('.rf');
  sticky('.ritual', p => {
    const i = Math.min(4, Math.floor(span(p, .05, .95) * 5));
    steps.forEach((s, k) => s.classList.toggle('on', k === i));
    frames.forEach((f, k) => { const local = span(p, .05 + k * .18, .05 + (k + 1) * .18 + .05);
      f.style.opacity = k === 0 ? 1 : span(p, .05 + k * .18 - .03, .05 + k * .18 + .02);
      f.style.transform = `scale(${1.15 - .15 * local})`; });
  });
})();

/* ---------- layering words fill ---------- */
$$('.fill-words span').forEach(s => gsap.fromTo(s, { backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0', ease: 'none',
  scrollTrigger: { trigger: s, start: 'top 80%', end: 'top 35%', scrub: true } }));

/* ---------- objects: horizontal drift ---------- */
(() => {
  const track = $('.objects-track');
  gsap.to(track, { x: () => -(track.scrollWidth - innerWidth), ease: 'none',
    scrollTrigger: { trigger: '.objects', start: 'top 30%', end: 'bottom top', scrub: 1, invalidateOnRefresh: true } });
})();

/* ---------- collection hover image ---------- */
(() => {
  const box = $('.col-hover'), img = $('img', box);
  let x = 0, y = 0, tx = 0, ty = 0;
  $$('.col-row').forEach(r => {
    r.addEventListener('mouseenter', () => { img.src = r.dataset.img; box.classList.add('on'); });
    r.addEventListener('mouseleave', () => box.classList.remove('on'));
  });
  addEventListener('pointermove', e => { tx = e.clientX + 30; ty = e.clientY - 165; });
  gsap.ticker.add(() => { x += (tx - x) * .12; y += (ty - y) * .12; box.style.transform = `translate(${x}px,${y}px) ${box.classList.contains('on') ? '' : 'scale(.8)'}`; });
})();

/* ---------- finale: wax seal press ---------- */
(() => {
  const wax = $('.wax'), pre = $('.finale-pre'), title = $('.finale-title'), join = $('.join');
  sticky('.finale', p => {
    const k = gsap.parseEase('power4.in')(span(p, .05, .4));
    wax.style.opacity = span(p, .02, .12);
    wax.style.transform = `scale(${3 - 2 * k}) translateY(${-30 * (1 - k)}%)`;
    wax.style.filter = `blur(${8 * (1 - k)}px)`;
    const thud = span(p, .4, .46); wax.style.boxShadow = `inset -8px -10px 22px rgba(0,0,0,.45),inset 8px 8px 16px rgba(255,255,255,.12),0 ${40 - 30 * thud}px ${60 - 40 * thud}px rgba(0,0,0,${.25 + .15 * thud})`;
    pre.style.opacity = span(p, .45, .55); title.style.opacity = span(p, .55, .68);
    title.style.letterSpacing = `${.3 - .16 * span(p, .55, .8)}em`;
    join.style.opacity = span(p, .72, .82);
  });
})();

/* ---------- nav: progress + active chapter ---------- */
ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => $('#progressBar').style.transform = `scaleX(${s.progress})` });
$$('.nav-chapters a').forEach(a => ScrollTrigger.create({ trigger: a.getAttribute('href'), start: 'top 50%', end: 'bottom 50%',
  onToggle: s => a.classList.toggle('on', s.isActive) }));
// notes on hero / non-sticky sections
$$('section:not(.voyage):not(.cities):not(.return):not(.vessel):not(.ritual):not(.finale)').forEach(s =>
  ScrollTrigger.create({ trigger: s, start: 'top 60%', end: 'bottom 40%', toggleClass: 'in-view' }));

/* ---------- build notes toggle ---------- */
const notesBtn = $('#toggleNotes');
const setNotes = on => { document.body.classList.toggle('notes', on); notesBtn.setAttribute('aria-pressed', on); };
notesBtn.addEventListener('click', () => setNotes(!document.body.classList.contains('notes')));
addEventListener('keydown', e => { if (e.key.toLowerCase() === 'n' && e.target.tagName !== 'INPUT') setNotes(!document.body.classList.contains('notes')); });
if (new URLSearchParams(location.search).has('notes')) setNotes(true);

/* ---------- cursor ---------- */
(() => {
  const c = $('.cursor'); let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; });
  gsap.ticker.add(() => { x += (tx - x) * .2; y += (ty - y) * .2; c.style.transform = `translate(${x}px,${y}px)`; });
  $$('a,button,.col-row,.objects-track figure').forEach(el => {
    el.addEventListener('mouseenter', () => c.classList.add('hover')); el.addEventListener('mouseleave', () => c.classList.remove('hover')); });
})();

addEventListener('load', () => ScrollTrigger.refresh());
