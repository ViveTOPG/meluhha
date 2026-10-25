// Hero: real-time water caustics in Indus green + gold light. Raw WebGL, no deps.
(() => {
  const canvas = document.getElementById('waterGL');
  const gl = canvas && canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
  if (!gl) return;

  const vert = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const frag = `
precision highp float;
uniform vec2 r; uniform float t; uniform vec2 m; uniform float fade;
// caustic pattern after the classic "tileable water caustic" iteration
float caustic(vec2 uv, float time){
  vec2 p = mod(uv*6.2831, 6.2831) - 250.;
  vec2 i = p; float c = 1.; float inten = .005;
  for (int n = 0; n < 5; n++) {
    float tt = time * (1. - (3.5 / float(n+1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1. / length(vec2(p.x / (sin(i.x+tt)/inten), p.y / (cos(i.y+tt)/inten)));
  }
  c /= 5.; c = 1.17 - pow(c, 1.4);
  return pow(abs(c), 8.);
}
void main(){
  vec2 uv = gl_FragCoord.xy / r; vec2 a = vec2(r.x/r.y, 1.);
  vec2 q = uv*a;
  // cursor ripple
  float d = length(q - m*a);
  q += .015 * sin(d*40. - t*3.) * exp(-d*4.);
  float c = caustic(q*.55 + vec2(t*.01, 0.), t*.35);
  vec3 deep = vec3(.035,.13,.095), mid = vec3(.07,.22,.16), gold = vec3(.85,.70,.43);
  vec3 col = mix(deep, mid, smoothstep(0., 1., uv.y*.8 + .1));
  col += gold * c * .55 * (.4 + .6*uv.y);
  // light shaft from top right
  float shaft = smoothstep(.0, .9, 1. - abs((uv.x - uv.y*.4) - .62) * 2.2) * uv.y;
  col += gold * shaft * .08;
  // vignette
  col *= 1. - .55 * pow(length(uv - .5) * 1.25, 2.2);
  gl_FragColor = vec4(col * fade, 1.);
}`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vert)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(prog, n);
  const uR = U('r'), uT = U('t'), uM = U('m'), uF = U('fade');

  const mouse = { x: .5, y: .5, tx: .5, ty: .5 };
  window.addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth; mouse.ty = 1 - e.clientY / innerHeight; });

  let visible = true, fade = 0;
  new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(canvas);
  const resize = () => { const dpr = Math.min(devicePixelRatio, 1.5); canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr; gl.viewport(0, 0, canvas.width, canvas.height); };
  addEventListener('resize', resize); resize();

  const t0 = performance.now();
  (function loop(now) {
    requestAnimationFrame(loop);
    if (!visible) return;
    fade = Math.min(1, fade + .01);
    mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05;
    gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform1f(uT, (now - t0) / 1000);
    gl.uniform2f(uM, mouse.x, mouse.y); gl.uniform1f(uF, fade);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  })(t0);
})();
