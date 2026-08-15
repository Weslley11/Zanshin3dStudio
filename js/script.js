/* ---------------------------------------------------
   Zanshin 3D Studio — script principal
   Edite a seção CONFIG abaixo com os seus dados reais.
--------------------------------------------------- */

const CONFIG = {
  // Número de WhatsApp no formato internacional, só dígitos: 55 + DDD + número.
  whatsappNumber: "5547991677070",

  // Usuário do Instagram, sem o @.
  instagramUser: "zanshin_3dstudio",

  // Valores para a calculadora de orçamento, a partir dos seus custos reais.
  pricing: {
    filamentCostPerKg: 100.0, // R$ por kg de filamento — mesmo custo para todos os materiais por padrão; se você paga preços diferentes por material, dá pra separar por chave (PLA/PETG/...) como em pricePerGram antes.
    energyTariff: 1.8, // R$ por kWh (tarifa da distribuidora)
    printerPowerWatts: 180, // consumo médio da Bambu Lab P2S, em watts

    // Margem sobre o custo (filamento + energia). Você passou "200/250%" —
    // interpretei como multiplicar o custo por 2 a 2,5x, e usei o meio da
    // faixa (2,25x = 225%). Se quiser um dos extremos, troque para 2 (200%)
    // ou 2.5 (250%). Se na verdade você quis dizer "markup" (200% de markup
    // = custo + 200% em cima = 3x o custo), me avisa que eu ajusto.
    marginMultiplier: 2.25,

    setupFee: 5, // taxa fixa de preparo/manuseio por pedido — ainda é um valor de exemplo meu, ajuste à vontade
    finishFee: 15, // acréscimo por acabamento extra (lixamento/pintura), por peça — também exemplo
  },
};

document.addEventListener("DOMContentLoaded", () => {
  applyConfig();
  initNav();
  initReveal();
  initQuoteForm();
  initMaterialQuiz();

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

const MATERIAL_QUIZ_RESULTS = {
  PLA: "PLA é a escolha certa: acabamento liso e ótimo pra peças decorativas de uso interno.",
  PETG: "PETG é o ideal: equilíbrio entre resistência e flexibilidade pro uso do dia a dia.",
  "ABS/ASA": "ABS/ASA é o mais indicado: aguenta sol e chuva sem ressecar ou perder cor.",
  TPU: "TPU é o que você precisa: emborrachado, dobra e volta ao normal sem trincar.",
};

/** Quiz de 1 pergunta na seção de materiais: sugere o material pelo caso de uso. */
function initMaterialQuiz() {
  const quiz = document.getElementById("materialQuiz");
  const resultEl = document.getElementById("materialQuizResult");
  if (!quiz || !resultEl) return;

  quiz.querySelectorAll(".material-quiz-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      quiz.querySelectorAll(".material-quiz-btn").forEach((b) => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");

      const material = btn.dataset.answer;
      resultEl.innerHTML = `<strong>${material}.</strong> ${MATERIAL_QUIZ_RESULTS[material]}`;
      resultEl.hidden = false;

      document.querySelectorAll(".material-card").forEach((card) => {
        card.classList.toggle("is-recommended", card.dataset.material === material);
      });
    });
  });
}

function estimatePrice({ weight, hours, qty, finish }) {
  const { filamentCostPerKg, energyTariff, printerPowerWatts, marginMultiplier, setupFee, finishFee } =
    CONFIG.pricing;

  const materialCost = weight * (filamentCostPerKg / 1000);
  const energyCost = hours * (printerPowerWatts / 1000) * energyTariff;
  const rawCost = materialCost + energyCost;

  const pricePerPiece = rawCost * marginMultiplier + (finish ? finishFee : 0);
  const total = pricePerPiece * qty + setupFee;

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
