/* ---------------------------------------------------
   Zanshin 3D Studio — só a home
   1. Hero: Three.js imprime um vaso camada por camada.
      A impressão começa sozinha e termina com a rolagem.
   2. Vitrine: a seção fica fixa e cada rolagem troca a peça,
      com a cor da cena seguindo o filamento (Motion).
   Sem WebGL, mostra uma foto no hero. Sem Motion ou com
   "reduzir movimento", a vitrine fica como telas empilhadas.
--------------------------------------------------- */
(function () {
  "use strict";
  var M = window.Motion || {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  var $ = function (s) { return document.querySelector(s); };
  var EASE = [0.16, 1, 0.3, 1];

  /* ================= entrada do hero ================= */
  if (M.animate && !reduce) {
    M.animate(".home-hero h1 .ln > span", { y: ["110%", "0%"] },
      { duration: 1.1, delay: M.stagger(0.09, { startDelay: 0.25 }), easing: EASE });
    M.animate(".home-hero .eyebrow, .home-hero-lead, .home-hero .hero-actions, .print-hud",
      { opacity: [0, 1], y: [18, 0] },
      { duration: 0.9, delay: M.stagger(0.1, { startDelay: 0.55 }), easing: EASE });
  }

  /* ================= hero 3D ================= */
  var hud = { layer: $("#hudLayer"), bar: $("#hudBar") };
  var introP = reduce ? 1 : 0, scrollP = 0;
  var INTRO = 0.5;

  function initScene() {
    var canvas = $("#printScene");
    var T = window.THREE;
    if (!canvas || !T) throw new Error("sem three");
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: "high-performance" });
    if (!renderer.getContext()) throw new Error("sem webgl");
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.localClippingEnabled = true;
    renderer.setClearColor(0x0d0d10, 1);

    var scene = new T.Scene();
    scene.fog = new T.Fog(0x0d0d10, 9, 20);
    var cam = new T.PerspectiveCamera(32, 1, 0.1, 60);

    scene.add(new T.HemisphereLight(0x8a90a0, 0x120c08, 0.55));
    var key = new T.DirectionalLight(0xfff1e2, 1.5); key.position.set(-4, 7, 5); scene.add(key);
    var rim = new T.DirectionalLight(0xff2a2a, 1.3); rim.position.set(4, 3, -5); scene.add(rim);
    var hot = new T.PointLight(0xff3a1a, 0, 3.2, 2); scene.add(hot);

    // mesa da impressora (placa PEI texturizada)
    var plate = (function () {
      var c = document.createElement("canvas"); c.width = c.height = 256;
      var g = c.getContext("2d"); g.fillStyle = "#17171a"; g.fillRect(0, 0, 256, 256);
      for (var i = 0; i < 5000; i++) { var v = 20 + Math.random() * 22 | 0; g.fillStyle = "rgb(" + v + "," + v + "," + (v + 2) + ")"; g.fillRect(Math.random() * 256, Math.random() * 256, 1.4, 1.4); }
      g.strokeStyle = "rgba(255,255,255,.06)";
      for (var k = 0; k <= 256; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 256); g.stroke(); g.beginPath(); g.moveTo(0, k); g.lineTo(256, k); g.stroke(); }
      var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(3, 3); t.encoding = T.sRGBEncoding; return t;
    })();
    var bed = new T.Mesh(new T.BoxGeometry(6, 0.12, 6), new T.MeshStandardMaterial({ map: plate, roughness: 0.85, metalness: 0.2 }));
    bed.position.y = -0.06; scene.add(bed);

    // vaso torcido gerado por código
    var H = 3.1, LAYERS = 240;
    function rad(y01, th) {
      var base = 0.62 + 0.5 * Math.sin(y01 * Math.PI * 0.95 + 0.25) - 0.12 * y01;
      return base * (1 + 0.075 * Math.cos(7 * th + y01 * 7.5));
    }
    function vaseGeo(rs, hs) {
      var g = new T.CylinderGeometry(1, 1, H, rs, hs, true);
      var p = g.attributes.position;
      for (var i = 0; i < p.count; i++) {
        var x = p.getX(i), y = p.getY(i), z = p.getZ(i), th = Math.atan2(z, x), r = rad((y + H / 2) / H, th);
        p.setXYZ(i, Math.cos(th) * r, y + H / 2, Math.sin(th) * r);
      }
      g.computeVertexNormals(); return g;
    }
    var layerTex = (function () {
      var c = document.createElement("canvas"); c.width = 4; c.height = 32;
      var g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 32);
      gr.addColorStop(0, "#000"); gr.addColorStop(0.5, "#fff"); gr.addColorStop(1, "#000");
      g.fillStyle = gr; g.fillRect(0, 0, 4, 32);
      var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1, LAYERS); return t;
    })();
    var clip = new T.Plane(new T.Vector3(0, -1, 0), 0);
    var vaseMat = new T.MeshStandardMaterial({ color: 0xc8100f, roughness: 0.32, metalness: 0.35, bumpMap: layerTex, bumpScale: 0.035, side: T.DoubleSide, clippingPlanes: [clip] });
    var vase = new T.Group(); scene.add(vase);
    vase.add(new T.Mesh(vaseGeo(260, 200), vaseMat));
    var disk = new T.Mesh(new T.CircleGeometry(1, 96), vaseMat);
    var dp = disk.geometry.attributes.position;
    for (var i = 1; i < dp.count; i++) { var dx = dp.getX(i), dy = dp.getY(i), dth = Math.atan2(dy, dx), dr = rad(0, dth); dp.setXY(i, Math.cos(dth) * dr, Math.sin(dth) * dr); }
    disk.rotation.x = -Math.PI / 2; disk.position.y = 0.004; vase.add(disk);
    // contorno do fatiador
    vase.add(new T.Mesh(vaseGeo(56, 34), new T.MeshBasicMaterial({ color: 0xc7cdd3, wireframe: true, transparent: true, opacity: 0.05, depthWrite: false })));

    // filete quente na camada atual
    var RN = 220, ringPos = new Float32Array(RN * 3);
    var ringGeo = new T.BufferGeometry(); ringGeo.setAttribute("position", new T.BufferAttribute(ringPos, 3));
    var ring = new T.Points(ringGeo, new T.PointsMaterial({ color: 0xffa060, size: 0.045, transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false }));
    vase.add(ring);

    // cabeçote: bloco prata e bico de latão
    var head = new T.Group();
    var block = new T.Mesh(new T.BoxGeometry(0.5, 0.34, 0.42), new T.MeshStandardMaterial({ color: 0xb9bec5, roughness: 0.28, metalness: 0.85 }));
    block.position.y = 0.42; head.add(block);
    var sink = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.22, 24), new T.MeshStandardMaterial({ color: 0x9a9ca3, roughness: 0.35, metalness: 0.9 }));
    sink.position.y = 0.17; head.add(sink);
    var nozzle = new T.Mesh(new T.ConeGeometry(0.085, 0.16, 24), new T.MeshStandardMaterial({ color: 0xc89a52, roughness: 0.3, metalness: 1 }));
    nozzle.rotation.x = Math.PI; nozzle.position.y = 0.08; head.add(nozzle);
    var gantry = new T.Mesh(new T.BoxGeometry(9, 0.12, 0.12), new T.MeshStandardMaterial({ color: 0x1d1e22, roughness: 0.6, metalness: 0.5 }));
    scene.add(head, gantry);

    function resize() {
      var r = canvas.getBoundingClientRect();
      renderer.setSize(r.width, r.height, false);
      cam.aspect = r.width / r.height;
      var wide = r.width > 760;
      vase.position.x = wide ? Math.min(2.2, r.width / r.height * 1.05) : 0;
      vase.position.z = wide ? 0 : -0.6;
      cam.fov = wide ? 30 : 38;
      cam.updateProjectionMatrix();
    }
    resize(); window.addEventListener("resize", resize);

    var px = 0, py = 0, tx = 0, ty = 0;
    window.addEventListener("pointermove", function (e) { tx = e.clientX / window.innerWidth - 0.5; ty = e.clientY / window.innerHeight - 0.5; }, { passive: true });

    var visible = true, t0 = performance.now(), last = -1, lift = 0;
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe($(".home-hero"));

    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible) return;
      var t = (now - t0) / 1000;
      var p = Math.min(1, reduce ? 1 : introP + scrollP * (1 - INTRO));
      px += (tx - px) * 0.05; py += (ty - py) * 0.05;
      var c = H * p; clip.constant = c + 0.0005;
      vase.rotation.y = reduce ? 0.6 : t * 0.18 + scrollP * 1.2;
      var y01 = Math.min(0.999, p);
      for (var i = 0; i < RN; i++) { var th = i / RN * Math.PI * 2, r = rad(y01, th) * 1.004; ringPos[i * 3] = Math.cos(th) * r; ringPos[i * 3 + 1] = c; ringPos[i * 3 + 2] = Math.sin(th) * r; }
      ringGeo.attributes.position.needsUpdate = true;
      var done = p >= 0.999;
      ring.material.opacity = done ? Math.max(0, ring.material.opacity - 0.03) : 0.95;
      var worldTh = Math.PI * 0.5 + Math.sin(t * 2.4) * 0.9;
      var rr = rad(y01, worldTh + vase.rotation.y);
      var nx = vase.position.x + Math.cos(worldTh) * rr, nz = vase.position.z + Math.sin(worldTh) * rr;
      lift = done ? Math.min(1.6, lift + 0.02) : 0;
      head.position.set(nx, c + 0.01 + lift, nz);
      gantry.position.set(vase.position.x, c + 0.43 + lift, nz);
      hot.position.set(nx, c + 0.05, nz);
      hot.intensity = done ? Math.max(0, hot.intensity - 0.05) : 2.2 + Math.sin(t * 30) * 0.3;
      cam.position.set(px * 1.2, 2.8 + p * 1.1 - py * 0.6, 9.2);
      cam.lookAt(vase.position.x * 0.55, 1.25 + p * 0.35, 0);
      renderer.render(scene, cam);
      var L = Math.round(p * LAYERS);
      if (L !== last && hud.layer) { last = L; hud.layer.textContent = L; hud.bar.style.transform = "scaleX(" + p + ")"; }
    }
    requestAnimationFrame(frame);
  }
  try { root.classList.add("print-on"); initScene(); }
  catch (e) { root.classList.remove("print-on"); }

  if (M.animate && !reduce) M.animate(0, INTRO, { duration: 3.2, delay: 0.4, easing: [0.45, 0, 0.2, 1], onUpdate: function (v) { introP = v; } });
  else introP = 1;
  if (M.scroll) M.scroll(function (p) { scrollP = p; }, { target: $(".home-hero"), offset: ["start start", "end end"] });

  /* ================= vitrine ================= */
  var show = $("#destaques");
  var pieces = show ? Array.prototype.slice.call(show.querySelectorAll(".sc-piece")) : [];
  if (!pieces.length || !M.scroll || !M.animate || reduce) return;

  root.classList.add("sc-on");
  show.style.setProperty("--n", pieces.length);
  var stick = show.querySelector(".sc-stick"), word = $("#scWord"), dots = $("#scDots");
  $("#scTotal").textContent = String(pieces.length).padStart(2, "0");

  pieces.forEach(function (el, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", "Ver " + el.querySelector(".sc-title").textContent.replace(/\s+/g, " "));
    b.addEventListener("click", function () {
      var top = show.getBoundingClientRect().top + window.scrollY;
      var span = show.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + span * ((i + 0.5) / pieces.length), behavior: "smooth" });
    });
    dots.appendChild(b);
  });

  var cur = -1;
  function parts(el) {
    return { text: el.querySelectorAll(".sc-text > *"), main: el.querySelector(".sc-main"), alt: el.querySelector(".sc-alt") };
  }
  function setPiece(i) {
    if (i === cur) return;
    var prev = cur; cur = i;
    var el = pieces[i], cs = getComputedStyle(el);
    stick.style.setProperty("--sc-scene", cs.getPropertyValue("--scene"));
    stick.style.setProperty("--sc-glow", cs.getPropertyValue("--glow"));
    word.textContent = el.getAttribute("data-word");
    $("#scIndex").textContent = String(i + 1).padStart(2, "0");
    Array.prototype.forEach.call(dots.children, function (d, k) { d.setAttribute("aria-current", k === i ? "true" : "false"); });
    pieces.forEach(function (p, k) { p.classList.toggle("is-on", k === i || k === prev); p.setAttribute("aria-hidden", k === i ? "false" : "true"); });
    var dir = prev < 0 ? 1 : (i > prev ? 1 : -1);
    if (prev >= 0) {
      var o = parts(pieces[prev]), pe = pieces[prev];
      M.animate(o.text, { opacity: 0, y: -30 * dir }, { duration: 0.35 }).then(function () { if (cur !== prev) pe.classList.remove("is-on"); });
      M.animate(o.main, { opacity: 0, y: -120 * dir, rotate: -6 * dir, scale: 0.9 }, { duration: 0.45, easing: [0.7, 0, 0.84, 0] });
      M.animate(o.alt, { opacity: 0, y: -200 * dir }, { duration: 0.4, easing: [0.7, 0, 0.84, 0] });
    }
    var n = parts(el);
    M.animate(n.text, { opacity: [0, 1], y: [40 * dir, 0] }, { duration: 0.8, delay: M.stagger(0.07, { startDelay: 0.2 }), easing: EASE });
    M.animate(n.main, { opacity: [0, 1], y: [160 * dir, 0], rotate: [7 * dir, 0], scale: [0.88, 1] }, { type: "spring", stiffness: 90, damping: 18, delay: 0.1 });
    M.animate(n.alt, { opacity: [0, 1], y: [260 * dir, 0], rotate: [-8 * dir, 4] }, { type: "spring", stiffness: 80, damping: 16, delay: 0.22 });
  }
  setPiece(0);
  M.scroll(function (p) {
    var n = pieces.length;
    setPiece(Math.min(n - 1, Math.floor(p * n)));
    word.style.transform = "translate3d(" + ((1 - p) * 20 - 40) + "vw,-50%,0)";
  }, { target: show, offset: ["start start", "end end"] });
})();
