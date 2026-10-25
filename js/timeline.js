// Through Time — a 3D corridor of sandstone stelae standing in dark water.
// Scroll moves the camera through 4,600 years; each stela carries one moment.
import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water2.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const canvas = document.getElementById('timeGL');
const section = document.getElementById('ch-time');
if (canvas && section) init();

async function init() {
  await Promise.all([document.fonts.load('400 120px Marcellus'), document.fonts.load('italic 300 60px "Cormorant Garamond"'),
    document.fonts.load('400 40px "Cormorant Garamond"')]).catch(() => {});

  const MOMENTS = [
    { year: '2600', era: 'BCE', title: 'Cities of baked brick', line: 'Planned streets, covered drains, wells — and great places for bathing — rise along the Indus.' },
    { year: '2300', era: 'BCE', title: 'Ships from Meluhha', line: 'Sargon of Akkad records vessels from Meluhha, Magan and Dilmun moored at his quays.' },
    { year: '2100', era: 'BCE', title: 'What the water carried', line: 'Mesopotamian texts name its gifts: carnelian, fine timber, ivory, gold.' },
    { year: '1900', era: 'BCE', title: 'The silence', line: 'The great cities empty. Rivers shift their course. The script keeps its voice — undeciphered still.' },
    { year: '1924', era: 'CE', title: 'Back into the light', line: 'Excavations at Harappa and Mohenjo-daro reveal a civilisation the world had forgotten.' },
    { year: '2026', era: 'CE', title: 'The name returns', line: 'Not as a kingdom restored. As a house of ritual.' },
  ];
  window.MELUHHA = window.MELUHHA || {}; window.MELUHHA.moments = MOMENTS;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const FOG = new THREE.Color('#0b1a14');
  scene.background = FOG; scene.fog = new THREE.FogExp2(FOG, .038);
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 200);

  // light: a low sun at the far end of time, warm fill near the camera
  const sun = new THREE.DirectionalLight('#ffd49a', 2.4); sun.position.set(-6, 8, -60); scene.add(sun);
  scene.add(new THREE.HemisphereLight('#5d7a66', '#1a120a', 1.1));
  const lantern = new THREE.PointLight('#e8b670', 18, 14, 1.6); scene.add(lantern);

  // ---- sandstone texture (procedural)
  function stoneCanvas(w, h, seed) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    x.fillStyle = '#b8946a'; x.fillRect(0, 0, w, h);
    let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 9000; i++) { const g = rnd(); x.fillStyle = `rgba(${g > .5 ? '255,236,205' : '70,45,25'},${rnd() * .09})`;
      x.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3); }
    for (let i = 0; i < 26; i++) { x.strokeStyle = `rgba(90,60,35,${.05 + rnd() * .08})`; x.lineWidth = 1 + rnd() * 2;
      x.beginPath(); const y = rnd() * h; x.moveTo(0, y); for (let k = 0; k <= 10; k++) x.lineTo(k * w / 10, y + (rnd() - .5) * 26); x.stroke(); }
    return c;
  }
  // engraved face: the moment carved into stone (map + bump from the same drawing)
  function faceCanvas(m, i) {
    const w = 1024, h = 1536, c = stoneCanvas(w, h, 7 + i * 13), x = c.getContext('2d');
    const carve = (draw) => { x.save(); x.globalCompositeOperation = 'multiply'; x.fillStyle = '#6b4a2c'; x.strokeStyle = '#6b4a2c'; draw(); x.restore();
      x.save(); x.translate(-2, -2); x.globalCompositeOperation = 'screen'; x.fillStyle = 'rgba(255,240,215,.35)'; x.strokeStyle = 'rgba(255,240,215,.35)'; draw(); x.restore(); };
    x.textAlign = 'center';
    carve(() => { x.font = '400 300px Marcellus'; x.fillText(m.year, w / 2, 560); });
    carve(() => { x.font = '400 64px Marcellus'; x.letterSpacing = '22px'; x.fillText(m.era, w / 2 + 11, 680); });
    carve(() => { x.lineWidth = 4; x.beginPath(); x.moveTo(w / 2 - 120, 760); x.lineTo(w / 2 + 120, 760); x.stroke(); });
    carve(() => { x.font = 'italic 300 88px "Cormorant Garamond"'; x.fillText(m.title, w / 2, 900); });
    carve(() => { x.font = '400 50px "Cormorant Garamond"'; wrap(x, m.line, w / 2, 1010, 780, 66); });
    // passage motif border
    carve(() => { x.lineWidth = 6; x.strokeRect(60, 60, w - 120, h - 120); x.lineWidth = 2; x.strokeRect(84, 84, w - 168, h - 168); });
    return c;
  }
  function wrap(x, text, cx, y, maxW, lh) {
    const words = text.split(' '); let line = '';
    for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (x.measureText(t).width > maxW) { x.fillText(line, cx, y); y += lh; line = wd; } else line = t; }
    x.fillText(line, cx, y);
  }

  // soft round glow used for lamps
  const glowC = document.createElement('canvas'); glowC.width = glowC.height = 128;
  { const x = glowC.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,220,160,.6)'); g.addColorStop(1, 'rgba(255,180,90,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }
  const glowTex = new THREE.CanvasTexture(glowC);

  // ---- stelae along a winding path through the water
  const GAP = 9;
  const stelae = MOMENTS.map((m, i) => {
    const side = i % 2 ? 1 : -1, z = -10 - i * GAP, x = side * (innerWidth < 700 ? 1.45 : 2.75);
    const face = new THREE.CanvasTexture(faceCanvas(m, i)); face.colorSpace = THREE.SRGBColorSpace; face.anisotropy = 8;
    const sideTex = new THREE.CanvasTexture(stoneCanvas(256, 512, 99 + i)); sideTex.colorSpace = THREE.SRGBColorSpace;
    const faceMat = new THREE.MeshStandardMaterial({ map: face, bumpMap: face, bumpScale: 2.2, roughness: .92 });
    const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: .95 });
    const geo = new RoundedBoxGeometry(2.4, 3.6, .5, 4, .06);
    // RoundedBox groups: +x,-x,+y,-y,+z,-z
    const mesh = new THREE.Mesh(geo, [sideMat, sideMat, sideMat, sideMat, faceMat, sideMat]);
    mesh.position.set(x, 1.55, z); mesh.rotation.y = -side * .38; mesh.rotation.z = side * .015;
    scene.add(mesh);
    // an oil lamp floating at the foot of each stela
    const lamp = new THREE.PointLight('#ffb867', 9, 9, 1.4); lamp.position.set(x - side * .9, .35, z + 1.4); scene.add(lamp);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffc27a', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(.9, .9, 1); glow.position.copy(lamp.position); scene.add(glow);
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#fff1c9', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    flame.scale.set(.12, .22, 1); flame.position.copy(lamp.position).add(new THREE.Vector3(0, .08, 0)); scene.add(flame);
    return { mesh, z, x, side, lamp, glow, flame };
  });

  // the seal at the end of the corridor — a ring of light the name passes through
  const sealC = document.createElement('canvas'); sealC.width = sealC.height = 1024;
  { const x = sealC.getContext('2d'), k = 1024 / 120; x.strokeStyle = '#ffd99a'; x.fillStyle = '#ffd99a'; x.lineCap = 'round'; x.lineWidth = 2.2 * k;
    x.shadowColor = '#ffb85c'; x.shadowBlur = 40;
    x.beginPath(); x.arc(512, 512, 54 * k, 0, 7); x.stroke(); x.beginPath(); x.moveTo(60 * k, 22 * k); x.lineTo(60 * k, 88 * k); x.stroke();
    x.beginPath(); x.arc(60 * k, 18 * k, 4 * k, 0, 7); x.fill();
    const u = (w, t, b) => { x.beginPath(); x.moveTo((60 - w) * k, t * k); x.lineTo((60 - w) * k, (b - w) * k); x.arc(60 * k, (b - w) * k, w * k, Math.PI, 0, true); x.lineTo((60 + w) * k, t * k); x.stroke(); };
    u(16, 40, 78); u(28, 46, 90);
    [96, 103].forEach((yy, j) => { x.beginPath(); for (let i = 0; i <= 60; i++) { const xx = 30 + j * 8 + i * (60 - j * 16) / 60, y = yy + Math.sin(i / 60 * Math.PI * 4) * 2.4;
      i ? x.lineTo(xx * k, y * k) : x.moveTo(xx * k, y * k); } x.stroke(); }); }
  const sealTex = new THREE.CanvasTexture(sealC); sealTex.colorSpace = THREE.SRGBColorSpace;
  const seal = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ map: sealTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  const END = -10 - (MOMENTS.length - 1) * GAP - 14; seal.position.set(0, 2.6, END); scene.add(seal);

  // ---- water
  // tileable ripple normal maps, generated from a sum of wrapped sine waves
  function rippleNormals(seed) {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S);
    let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const waves = Array.from({ length: 9 }, () => ({ kx: Math.round(1 + rnd() * 5) * (rnd() > .5 ? 1 : -1), ky: Math.round(1 + rnd() * 5), ph: rnd() * 6.28, a: .3 + rnd() }));
    const h = (u, v) => waves.reduce((acc, w) => acc + w.a * Math.sin((u * w.kx + v * w.ky) * Math.PI * 2 + w.ph), 0);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const u = i / S, v = j / S, e = 1 / S, dx = h(u + e, v) - h(u - e, v), dy = h(u, v + e) - h(u, v - e);
      const nx = -dx * 2.2, ny = -dy * 2.2, nz = 1, l = Math.hypot(nx, ny, nz), k = (j * S + i) * 4;
      img.data[k] = (nx / l * .5 + .5) * 255; img.data[k + 1] = (ny / l * .5 + .5) * 255; img.data[k + 2] = (nz / l * .5 + .5) * 255; img.data[k + 3] = 255;
    }
    x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  const water = new Water(new THREE.PlaneGeometry(60, 140), { color: '#6f8f7c', scale: 7, flowDirection: new THREE.Vector2(.25, .6), textureWidth: 768, textureHeight: 768,
    normalMap0: rippleNormals(11), normalMap1: rippleNormals(29), reflectivity: .55 });
  water.rotation.x = -Math.PI / 2; water.position.z = -40; scene.add(water);
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(60, 140), new THREE.MeshStandardMaterial({ color: '#1a1410', roughness: 1 }));
  bed.rotation.x = -Math.PI / 2; bed.position.set(0, -.6, -40); scene.add(bed);

  // ---- god rays: soft additive shafts from the sun
  const rayC = document.createElement('canvas'); rayC.width = 64; rayC.height = 512;
  { const x = rayC.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(255,214,150,.0)'); g.addColorStop(.25, 'rgba(255,214,150,.55)'); g.addColorStop(1, 'rgba(255,214,150,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 512); const h = x.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)');
    x.globalCompositeOperation = 'destination-out'; x.fillStyle = h; x.fillRect(0, 0, 64, 512); }
  const rayTex = new THREE.CanvasTexture(rayC);
  for (let i = 0; i < 14; i++) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(1.2 + Math.random() * 2.5, 22), new THREE.MeshBasicMaterial({ map: rayTex, transparent: true, opacity: .05 + Math.random() * .08,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    r.position.set((Math.random() - .5) * 16, 7, -8 - Math.random() * 60); r.rotation.z = .5 + (Math.random() - .5) * .15; r.rotation.y = Math.random() * .6; scene.add(r);
  }

  // ---- drifting dust in the light
  const N = 1800, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 18; pos[i * 3 + 1] = Math.random() * 7; pos[i * 3 + 2] = 2 - Math.random() * 80; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: '#e9c88e', size: .035, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  // ---- camera path weaving between the stelae
  const pts = [new THREE.Vector3(0, 1.9, 4)];
  stelae.forEach(s => { pts.push(new THREE.Vector3(-s.side * .5, 1.8, s.z + 6.2)); pts.push(new THREE.Vector3(-s.side * .15, 1.7, s.z + 3.6)); });
  pts.push(new THREE.Vector3(0, 2.3, END + 13), new THREE.Vector3(0, 2.6, END + 8.5));
  const path = new THREE.CatmullRomCurve3(pts, false, 'centripetal', .5);

  // ---- DOM hooks
  const hudYear = document.getElementById('timeYear'), hudEra = document.getElementById('timeEra'), hudTitle = document.getElementById('timeTitle');
  const finale = section.querySelector('.time-finale');
  const yearVals = MOMENTS.map(m => (m.era === 'BCE' ? -1 : 1) * +m.year);
  // progress of each stela along the path (closest point)
  const stops = stelae.map(s => { let best = 0, bd = 1e9; for (let t = 0; t <= 1; t += .002) { const d = Math.abs(path.getPoint(t).z - (s.z + 3.6)); if (d < bd) { bd = d; best = t; } } return best; });

  let target = 0, prog = 0, visible = false;
  const mouse = { x: 0, y: 0 }; addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; });
  new IntersectionObserver(([e]) => visible = e.isIntersecting, { rootMargin: '200px' }).observe(canvas);
  const resize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < .8 ? 60 : 42; camera.updateProjectionMatrix(); };
  addEventListener('resize', resize); resize();

  ScrollTrigger.create({ trigger: section, start: 'top top', end: 'bottom bottom', onUpdate: s => target = s.progress, onRefresh: s => target = s.progress });

  const look = new THREE.Vector3(), clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const t = clock.getElapsedTime();
    prog += (target - prog) * .06;
    const p = Math.min(.999, prog * .985);
    const cp = path.getPoint(p); camera.position.copy(cp);
    camera.position.y += Math.sin(t * .6) * .03;
    path.getPoint(Math.min(1, p + .02), look);
    look.x += mouse.x * 1.4; look.y += -mouse.y * .6;
    camera.lookAt(look);
    lantern.position.copy(camera.position).add(new THREE.Vector3(0, .4, -2.5));
    dust.rotation.y = Math.sin(t * .05) * .05; stelae.forEach((s, k) => { const fl = .85 + Math.sin(t * 9 + k) * .08 + Math.sin(t * 23 + k * 3) * .05; s.lamp.intensity = 9 * fl; s.glow.material.opacity = .75 * fl; s.flame.scale.y = .22 * fl; }); dust.position.y = Math.sin(t * .2) * .15;
    seal.material.opacity = .55 * Math.min(1, Math.max(0, (p - .8) / .15)); seal.rotation.z = t * .03;

    // HUD year: interpolate between the stelae we are passing
    let i = 0; while (i < stops.length - 1 && p > stops[i + 1]) i++;
    const a = stops[i], b = stops[Math.min(stops.length - 1, i + 1)], f = b > a ? Math.min(1, Math.max(0, (p - a) / (b - a))) : 0;
    const raw = p < stops[0] ? -4000 + (yearVals[0] + 4000) * (p / stops[0]) : yearVals[i] + (yearVals[Math.min(yearVals.length - 1, i + 1)] - yearVals[i]) * f ** 3;
    const y = Math.round(raw) || 1;
    if (hudYear) { hudYear.textContent = Math.abs(y); hudEra.textContent = y < 0 ? 'BCE' : 'CE'; }
    const near = stops.findIndex(s => Math.abs(p - s) < .045);
    if (hudTitle) { hudTitle.textContent = near >= 0 ? MOMENTS[near].title : ''; hudTitle.classList.toggle('on', near >= 0); }
    window.MELUHHA.year = y;
    if (finale) finale.style.opacity = Math.max(0, (prog - .9) / .08);
    renderer.render(scene, camera);
  });
}
