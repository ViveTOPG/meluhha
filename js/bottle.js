// The Stela — procedural 3D stand-in for the client's bottle (swap for the CAD/GLB model in production).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('bottleGL');
const sticky = document.querySelector('.vessel-sticky');

// world states: Stela intro, then ME · LI · ḪA · KI · FINAL RITE
const STATES = [
  { bg: '#0f2a20', fg: '#efe6d8', oil: '#b8621c', cap: '#c9a77a' },
  { bg: '#eadac2', fg: '#2a1c12', oil: '#b8621c', cap: '#c9a77a' },
  { bg: '#f1ddd6', fg: '#3a2220', oil: '#e8a79a', cap: '#cf7f73' },
  { bg: '#e5ebdf', fg: '#1f2b22', oil: '#e4e6c4', cap: '#a9c3bd' },
  { bg: '#e6e3c9', fg: '#272712', oil: '#a9ad2a', cap: '#c2795b' },
  { bg: '#231a17', fg: '#efe6d8', oil: '#5a2412', cap: '#8c8494' },
];
const span = (p, a, b) => Math.max(0, Math.min(1, (p - a) / (b - a)));
const smooth = t => t * t * (3 - 2 * t);
function stateAt(p) {
  if (p < .46) return 0;
  if (p < .5) return smooth(span(p, .46, .5));
  const local = (p - .5) / .1, i = Math.min(4, Math.floor(local));
  return 1 + i + (i < 4 ? smooth(span(local - i, .8, 1)) : 0);
}
const cA = new THREE.Color(), cB = new THREE.Color();
const mix = (key, s, out) => { const i = Math.floor(s), f = s - i; cA.set(STATES[i][key]); cB.set(STATES[Math.min(5, i + 1)][key]); return out.copy(cA).lerp(cB, f); };

let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); }
catch (e) { console.warn('WebGL unavailable', e); }

if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(STATES[0].bg);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
  const camera = new THREE.PerspectiveCamera(28, 1, .1, 50);
  camera.position.set(0, 0, 9.4);

  const key = new THREE.DirectionalLight('#ffe7c4', 2.2); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight('#d8b878', 1.4); rim.position.set(-4, 2, -3); scene.add(rim);

  // ---- geometry helpers
  const pill = (w, h) => { const r = w / 2, s = new THREE.Shape();
    s.moveTo(-r, -h / 2 + r); s.lineTo(-r, h / 2 - r); s.absarc(0, h / 2 - r, r, Math.PI, 0, true);
    s.lineTo(r, -h / 2 + r); s.absarc(0, -h / 2 + r, r, 0, Math.PI, true); return s; };
  const slab = (w, h, depth, bev, size) => { const g = new THREE.ExtrudeGeometry(pill(w, h),
    { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: size, bevelSegments: 12, curveSegments: 64 }); g.center(); g.computeVertexNormals(); return g; };

  // ---- canvas textures: seal + carved passage motif
  function sealCanvas(size, fg, bg) {
    const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
    if (bg) { x.fillStyle = bg; x.fillRect(0, 0, size, size); }
    const k = size / 120; x.strokeStyle = fg; x.fillStyle = fg; x.lineCap = 'round'; x.lineWidth = 2.6 * k;
    x.beginPath(); x.arc(60 * k, 60 * k, 54 * k, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.moveTo(60 * k, 22 * k); x.lineTo(60 * k, 88 * k); x.stroke();
    x.beginPath(); x.arc(60 * k, 18 * k, 4 * k, 0, Math.PI * 2); x.fill();
    const u = (w, top, bot) => { x.beginPath(); x.moveTo((60 - w) * k, top * k); x.lineTo((60 - w) * k, (bot - w) * k);
      x.arc(60 * k, (bot - w) * k, w * k, Math.PI, 0, true); x.lineTo((60 + w) * k, top * k); x.stroke(); };
    u(16, 40, 78); u(28, 46, 90);
    [96, 103].forEach((yy, j) => { x.beginPath(); for (let i = 0; i <= 60; i++) { const xx = 30 + j * 8 + i * (60 - j * 16) / 60;
      const y = yy + Math.sin(i / 60 * Math.PI * 4) * 2.4; i ? x.lineTo(xx * k, y * k) : x.moveTo(xx * k, y * k); } x.stroke(); });
    return c;
  }
  function motifCanvas() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#808080'; x.fillRect(0, 0, 1024, 256);
    x.strokeStyle = '#ffffff'; x.lineWidth = 9; x.lineJoin = 'round';
    for (let row = 0; row < 2; row++) for (let i = 0; i < 16; i++) { // interlocking "passage" meander — original motif placeholder
      const ox = i * 64, oy = 24 + row * 112, f = (i + row) % 2 ? 1 : -1;
      x.beginPath(); x.moveTo(ox + 6, oy + 80); x.lineTo(ox + 6, oy + 8); x.lineTo(ox + 50, oy + 8); x.lineTo(ox + 50, oy + 56);
      x.lineTo(ox + 24, oy + 56); x.lineTo(ox + 24, oy + 30 + f * 4); x.stroke(); }
    x.strokeStyle = '#3a3a3a'; x.lineWidth = 4; x.beginPath(); x.moveTo(0, 128); x.lineTo(1024, 128); x.stroke();
    return c;
  }

  // ---- materials
  const glass = new THREE.MeshPhysicalMaterial({ color: '#ffffff', transmission: 1, thickness: .35, roughness: 0, ior: 1.42,
    clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: 1.6, specularIntensity: 1 });
  const oil = new THREE.MeshPhysicalMaterial({ color: STATES[0].oil, roughness: .12, clearcoat: 1, clearcoatRoughness: .1,
    emissive: STATES[0].oil, emissiveIntensity: .28, sheen: .5, sheenColor: new THREE.Color('#fff3d6') });
  const metal = new THREE.MeshStandardMaterial({ color: '#c8a46a', metalness: 1, roughness: .28 });
  const motif = new THREE.CanvasTexture(motifCanvas()); motif.wrapS = THREE.RepeatWrapping; motif.repeat.set(1, 1);
  const capSide = new THREE.MeshStandardMaterial({ color: STATES[0].cap, roughness: .9, bumpMap: motif, bumpScale: 3.2 });
  const capTopTex = new THREE.CanvasTexture(sealCanvas(512, '#ffffff', '#7a7a7a'));
  const capTop = new THREE.MeshStandardMaterial({ color: STATES[0].cap, roughness: .85, bumpMap: capTopTex, bumpScale: 3.5 });
  const sealTex = new THREE.CanvasTexture(sealCanvas(512, '#ffffff'));
  const sealMat = new THREE.MeshPhysicalMaterial({ color: '#fff7e6', transparent: true, alphaMap: sealTex, opacity: .55, roughness: .1,
    metalness: .2, depthWrite: false });

  // ---- assemble the Stela
  const bottle = new THREE.Group();
  const outer = new THREE.Mesh(slab(1.25, 2.3, .34, .24, .12), glass);
  const inner = new THREE.Mesh(slab(.72, 1.7, .1, .12, .08), oil); inner.position.y = .02;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .5, 32), oil); neck.position.y = 1.08;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(.27, .29, .1, 48), metal); collar.position.y = 1.42;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, .34, 96), [capSide, capTop, capTop]); cap.position.y = 1.64;
  const seal = new THREE.Mesh(new THREE.PlaneGeometry(.62, .62), sealMat); seal.position.set(0, .12, .42);
  bottle.add(inner, neck, outer, collar, cap, seal);
  bottle.scale.setScalar(.8);
  scene.add(bottle);

  // ---- gold dust
  const N = 400, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 9; pos[i * 3 + 1] = (Math.random() - .5) * 6; pos[i * 3 + 2] = (Math.random() - .5) * 4 - 1; }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: '#d8b878', size: .022, transparent: true, opacity: .7, depthWrite: false }));
  scene.add(dust);

  // ---- loop
  const mouse = { x: 0, y: 0 }; addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; });
  let visible = false; new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(canvas);
  const resize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = w / h < .8 ? 12.5 : 9.4; camera.updateProjectionMatrix(); };
  addEventListener('resize', resize); resize();

  const bg = new THREE.Color(), fg = new THREE.Color(), tmp = new THREE.Color();
  let rotY = 0, posX = 0, posY = 0;
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const t = clock.getElapsedTime(), p = window.MELUHHA?.vessel ?? 0, mobile = innerWidth <= 800;
    const s = stateAt(p);
    scene.background.copy(mix('bg', s, bg));
    sticky.style.color = '#' + mix('fg', s, fg).getHexString();
    mix('oil', s, tmp); oil.color.copy(tmp); oil.emissive.copy(tmp); neck.material = oil;
    mix('cap', s, tmp); capSide.color.copy(tmp); capTop.color.copy(tmp);
    dust.material.color.set(s < .5 || s > 4.5 ? '#d8b878' : '#a5814a');

    // choreography: spin in → present for callouts → spin into each threshold, alternating sides
    let targetRot, targetX = 0, targetY = 0;
    if (p < .46) targetRot = -Math.PI * 2 * (1 - smooth(span(p, 0, .1))) + Math.sin(t * .5) * .18 + span(p, .1, .4) * .5 - .25;
    else {
      const local = Math.max(0, (p - .5) / .1), i = Math.min(4, Math.floor(local));
      targetRot = Math.PI * 2 * (1 + s) + Math.sin(t * .5) * .15 - .2;
      const side = j => (j % 2 === 0 ? -1.25 : 1.25);
      const f = i < 4 ? smooth(span(local - i, .8, 1)) : 0;
      targetX = mobile ? 0 : (p < .5 ? side(0) * smooth(span(p, .46, .5)) : side(i) + (side(i + 1) - side(i)) * f);
      targetY = mobile ? .7 : 0;
    }
    rotY += (targetRot - rotY) * .08; posX += (targetX - posX) * .07; posY += (targetY - posY) * .07;
    bottle.rotation.y = rotY + mouse.x * .3; bottle.rotation.x = mouse.y * .12 + Math.sin(t * .7) * .02;
    bottle.position.x = posX; bottle.position.y = -.3 + posY + Math.sin(t * .9) * .04;
    dust.rotation.y = t * .02; dust.position.y = Math.sin(t * .2) * .1;
    renderer.render(scene, camera);
  });
}
