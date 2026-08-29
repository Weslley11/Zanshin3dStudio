/* ---------------------------------------------------
   Zanshin 3D Studio — página de detalhe de uma peça
   Lê ?id=... da URL, busca em PECAS (js/pecas-data.js) e monta a página.
--------------------------------------------------- */

document.addEventListener("DOMContentLoaded", initPecaPage);

function initPecaPage() {
  const content = document.getElementById("pecaContent");
  const notFound = document.getElementById("pecaNotFound");
  if (!content || typeof PECAS === "undefined") return;

  const id = new URLSearchParams(window.location.search).get("id");
  const peca = PECAS.find((p) => p.id === id);

  if (!peca) {
    notFound.hidden = false;
    return;
  }

  content.hidden = false;
  renderPeca(peca);
  renderRelated(peca);
}

function renderPeca(peca) {
  document.title = `${peca.titulo} — Zanshin 3D Studio`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", peca.descricao);

  document.getElementById("pecaCategoria").textContent = peca.categoria;
  document.getElementById("pecaTitulo").textContent = peca.titulo;
  document.getElementById("pecaDescricao").textContent = peca.descricao;

  const mainImg = document.getElementById("pecaImgMain");
  const thumbsWrap = document.getElementById("pecaThumbs");

  function showImage(index) {
    mainImg.src = peca.imagens[index].src;
    mainImg.alt = peca.imagens[index].alt;
    thumbsWrap.querySelectorAll(".peca-thumb").forEach((thumb, i) => {
      thumb.classList.toggle("is-active", i === index);
    });
  }

  showImage(0);

  if (peca.imagens.length > 1) {
    thumbsWrap.hidden = false;
    peca.imagens.forEach((img, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "peca-thumb" + (i === 0 ? " is-active" : "");
      btn.setAttribute("aria-label", `Ver foto ${i + 1} de ${peca.imagens.length}`);
      btn.innerHTML = `<img src="${img.src}" alt="" loading="lazy">`;
      btn.addEventListener("click", () => showImage(i));
      thumbsWrap.appendChild(btn);
    });
  }

  const waBtn = document.getElementById("pecaWhatsapp");
  if (waBtn && typeof CONFIG !== "undefined") {
    const message = `Olá! Vi a peça "${peca.titulo}" no site da Zanshin 3D Studio e queria saber mais 🙂`;
    waBtn.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }
}

function renderRelated(peca) {
  const section = document.getElementById("pecaMoreSection");
  const wrap = document.getElementById("pecaRelated");
  if (!section || !wrap) return;

  const others = PECAS.filter((p) => p.id !== peca.id).sort(() => Math.random() - 0.5).slice(0, 6);
  if (!others.length) return;

  others.forEach((p) => {
    const a = document.createElement("a");
    a.href = `peca.html?id=${p.id}`;
    a.className = "gallery-item reveal";
    a.innerHTML = `
      <img loading="lazy" decoding="async" src="${p.imagens[0].src}" alt="${p.imagens[0].alt}">
      <span class="gallery-item-caption">${p.titulo}</span>
    `;
    wrap.appendChild(a);
  });

  section.hidden = false;
  if (typeof initReveal === "function") initReveal();
  if (typeof initTiltCards === "function") initTiltCards();
}
