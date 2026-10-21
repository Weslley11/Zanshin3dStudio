/* ---------------------------------------------------
   Zanshin 3D Studio — camada de animação (Motion)
   Carregado em todas as páginas, ANTES do js/script.js.

   - Assume as animações de entrada dos elementos .reveal
     (o script.js antigo deixa de cuidar deles quando isto roda)
   - Títulos entram com máscara, imagens com zoom de lente
   - Cortina vermelha na troca de página
   - Header some ao descer e volta ao subir
   - Brilho dos cards segue o cursor

   Sem Motion (biblioteca não carregou) ou com "reduzir movimento"
   ligado no sistema, nada disso roda e o site funciona como antes.
--------------------------------------------------- */
(function () {
  "use strict";
  var M = window.Motion;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!M || !M.animate || !M.inView || reduce) return;

  var root = document.documentElement;
  root.classList.add("motion");
  var EASE = [0.16, 1, 0.3, 1];

  function clean(el, props) {
    props.forEach(function (p) { el.style[p] = ""; });
  }

  /* ---------- entradas ---------- */
  function setupReveals(scope) {
    var items = Array.prototype.slice.call((scope || document).querySelectorAll(".reveal"));
    var perParent = new Map();
    items.forEach(function (el) {
      el.classList.remove("reveal");
      el.setAttribute("data-m", "");
      var i = perParent.get(el.parentElement) || 0;
      perParent.set(el.parentElement, i + 1);
      var delay = Math.min(i, 6) * 0.07;
      var isTitle = /^H[12]$/.test(el.tagName);
      var img = el.querySelector("img");
      M.inView(el, function () {
        var run;
        if (isTitle) {
          run = M.animate(el,
            { opacity: [0, 1], y: [36, 0], clipPath: ["inset(0 0 100% 0)", "inset(0 0 -10% 0)"] },
            { duration: 1, delay: delay, easing: EASE });
        } else {
          run = M.animate(el,
            { opacity: [0, 1], y: [42, 0], filter: ["blur(6px)", "blur(0px)"] },
            { duration: 0.9, delay: delay, easing: EASE });
          if (img && !el.closest(".hero")) {
            M.animate(img, { scale: [1.06, 1] }, { duration: 1.2, delay: delay, easing: EASE })
              .then(function () { clean(img, ["transform"]); });
          }
        }
        run.then(function () {
          clean(el, ["opacity", "transform", "filter", "clipPath"]);
          el.removeAttribute("data-m");
          el.classList.add("is-visible");
        });
      }, { amount: 0.15 });
    });
  }
  window.ZanshinMotion = { reveal: setupReveals };
  setupReveals(document);

  document.addEventListener("DOMContentLoaded", function () {
    /* conteúdo criado depois (página de peça, galeria) */
    setupReveals(document);

    /* ---------- grão ---------- */
    var grain = document.createElement("div");
    grain.className = "film-grain";
    grain.setAttribute("aria-hidden", "true");
    document.body.appendChild(grain);

    /* ---------- brilho dos cards ---------- */
    if (window.matchMedia("(hover: hover)").matches) {
      document.addEventListener("pointermove", function (e) {
        var card = e.target.closest && e.target.closest(".card, .audience-card, .material-card");
        if (!card) return;
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      }, { passive: true });
    }

    /* ---------- header ---------- */
    var header = document.querySelector(".site-header");
    var nav = document.getElementById("navLinks");
    if (header && M.scroll) {
      var lastY = window.scrollY;
      M.scroll(function () {
        var y = window.scrollY;
        var menuOpen = nav && nav.classList.contains("open");
        var down = y > lastY + 4, up = y < lastY - 4;
        if (down && y > 240 && !menuOpen) header.classList.add("is-hidden");
        else if (up || y < 120) header.classList.remove("is-hidden");
        if (down || up) lastY = y;
      });
      header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });
    }

    /* ---------- botões: aperto com mola ---------- */
    document.querySelectorAll(".btn").forEach(function (b) {
      b.addEventListener("pointerdown", function () {
        M.animate(b, { scale: [1, 0.95, 1] }, { duration: 0.45, easing: EASE })
          .then(function () { clean(b, ["transform"]); });
      });
    });
  });

  /* ---------- cortina entre páginas ---------- */
  var curtain = document.createElement("div");
  curtain.className = "m-curtain";
  curtain.setAttribute("aria-hidden", "true");
  curtain.innerHTML = '<i></i><i><img src="assets/img/brand/icon.png" alt=""></i>';
  var KEY = "zanshin-curtain";
  var arriving = false;
  try { arriving = sessionStorage.getItem(KEY) === "1"; sessionStorage.removeItem(KEY); } catch (e) {}

  function mountCurtain() {
    if (!curtain.isConnected) document.body.appendChild(curtain);
  }
  function openCurtain() {
    var layers = curtain.querySelectorAll("i");
    layers.forEach(function (l) { l.style.transformOrigin = "top"; l.style.transform = "scaleY(1)"; });
    M.animate(layers[1], { scaleY: [1, 0] }, { duration: 0.6, easing: [0.7, 0, 0.2, 1], delay: 0.05 });
    M.animate(layers[0], { scaleY: [1, 0] }, { duration: 0.6, easing: [0.7, 0, 0.2, 1], delay: 0.16 })
      .then(function () { curtain.classList.remove("is-covering"); });
  }
  if (arriving) {
    if (document.body) { mountCurtain(); openCurtain(); }
    else document.addEventListener("DOMContentLoaded", function () { mountCurtain(); openCurtain(); });
  }

  function isInternal(a) {
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return false;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || /^(mailto|tel|sms|javascript):/i.test(href)) return false;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return false;
    if (url.pathname === location.pathname && url.search === location.search) return false;
    return true;
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a");
    if (!isInternal(a)) return;
    e.preventDefault();
    mountCurtain();
    curtain.classList.add("is-covering");
    var layers = curtain.querySelectorAll("i");
    layers.forEach(function (l) { l.style.transformOrigin = "bottom"; });
    M.animate(layers[0], { scaleY: [0, 1] }, { duration: 0.45, easing: [0.7, 0, 0.2, 1] });
    M.animate(layers[1], { scaleY: [0, 1] }, { duration: 0.45, easing: [0.7, 0, 0.2, 1], delay: 0.1 })
      .then(function () {
        try { sessionStorage.setItem(KEY, "1"); } catch (err) {}
        location.href = a.href;
      });
  });

  /* voltar pelo navegador com a página em cache: tira a cortina */
  window.addEventListener("pageshow", function (e) {
    if (e.persisted && curtain.isConnected) {
      curtain.classList.remove("is-covering");
      curtain.querySelectorAll("i").forEach(function (l) { l.style.transform = "scaleY(0)"; });
    }
  });
})();
