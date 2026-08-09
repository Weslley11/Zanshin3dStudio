/* ---------------------------------------------------
   Zanshin 3D Studio — script principal
   Edite a seção CONFIG abaixo com os seus dados reais.
--------------------------------------------------- */

const CONFIG = {
  // Número de WhatsApp no formato internacional, só dígitos: 55 + DDD + número.
  // TODO: troque pelo número real da Zanshin 3D Studio.
  whatsappNumber: "5547900000000",

  // Usuário do Instagram, sem o @.
  // TODO: troque pelo usuário real do Instagram.
  instagramUser: "zanshin3dstudio",

  // Valores de referência para a calculadora de orçamento.
  // São só um ponto de partida — ajuste conforme o custo real do seu
  // filamento, energia e a margem que você quer praticar.
  pricing: {
    pricePerGram: {
      PLA: 0.09,
      PETG: 0.11,
      "ABS/ASA": 0.12,
      TPU: 0.18,
    },
    pricePerHour: 6, // custo de máquina/energia por hora de impressão
    setupFee: 5, // taxa fixa de preparo/manuseio por pedido
    finishFee: 15, // acréscimo por acabamento extra (lixamento/pintura), por peça
  },
};

document.addEventListener("DOMContentLoaded", () => {
  applyConfig();
  initNav();
  initReveal();
  initQuoteForm();

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

/**
 * Aplica os dados de CONFIG nos links de WhatsApp e Instagram espalhados pela página,
 * para que só precisem ser editados em um lugar.
 */
function applyConfig() {
  const waLink = `https://wa.me/${CONFIG.whatsappNumber}`;
  const igLink = `https://www.instagram.com/${CONFIG.instagramUser}/`;

  ["contactWhatsapp", "floatWhatsapp"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = waLink;
  });

  ["contactInstagram", "instagramInlineLink"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = igLink;
  });

  const igHandle = document.getElementById("contactInstagram");
  if (igHandle) igHandle.textContent = `@${CONFIG.instagramUser}`;
}

/** Menu mobile: abre/fecha e fecha ao clicar em um link. */
function initNav() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
  });

  links.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu");
    });
  });
}

/** Anima elementos .reveal à medida que entram na tela. */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  items.forEach((el) => observer.observe(el));
}

/** Calculadora de orçamento + geração da mensagem para o WhatsApp. */
function initQuoteForm() {
  const form = document.getElementById("quoteForm");
  const resultBox = document.getElementById("quoteResult");
  const valueEl = document.getElementById("quoteValue");
  const sendBtn = document.getElementById("sendWhatsapp");
  if (!form || !resultBox || !valueEl || !sendBtn) return;

  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = form.qName.value.trim();
    const phone = form.qPhone.value.trim();
    const weight = parseFloat(form.qWeight.value);
    const hours = parseFloat(form.qHours.value);
    const material = form.qMaterial.value;
    const qty = Math.max(1, parseInt(form.qQty.value, 10) || 1);
    const finish = form.qFinish.checked;
    const details = form.qDetails.value.trim();

    if (!name || !phone || !weight || weight <= 0 || isNaN(hours) || hours < 0) {
      form.reportValidity();
      return;
    }

    const total = estimatePrice({ weight, hours, material, qty, finish });

    valueEl.textContent = currency.format(total);
    resultBox.hidden = false;
    resultBox.scrollIntoView({ behavior: "smooth", block: "center" });

    const message = buildWhatsappMessage({
      name,
      phone,
      weight,
      hours,
      material,
      qty,
      finish,
      details,
      total: currency.format(total),
    });
    sendBtn.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  });
}

function estimatePrice({ weight, hours, material, qty, finish }) {
  const { pricePerGram, pricePerHour, setupFee, finishFee } = CONFIG.pricing;
  const gramRate = pricePerGram[material] ?? pricePerGram.PLA;

  const perPiece = weight * gramRate + hours * pricePerHour + (finish ? finishFee : 0);
  const total = perPiece * qty + setupFee;

  return Math.round(total * 100) / 100;
}

function buildWhatsappMessage({ name, phone, weight, hours, material, qty, finish, details, total }) {
  const lines = [
    "Olá! Vim pelo site da Zanshin 3D Studio e gostaria de um orçamento 🙂",
    "",
    `Nome: ${name}`,
    `WhatsApp: ${phone}`,
    `Material: ${material}`,
    `Peso estimado: ${weight} g`,
    `Tempo estimado: ${hours} h`,
    `Quantidade: ${qty}`,
    `Acabamento extra: ${finish ? "sim" : "não"}`,
    `Estimativa calculada no site: ${total}`,
  ];

  if (details) {
    lines.push("", `Detalhes da peça: ${details}`);
  }

  return lines.join("\n");
}
