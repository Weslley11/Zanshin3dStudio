/* ---------------------------------------------------
   Zanshin 3D Studio — painel de pedidos
   Lê uma planilha do Google Sheets publicada como CSV e mostra os
   pedidos agrupados por status. Veja o passo a passo no README
   ("Painel de pedidos") para criar e publicar a planilha.
--------------------------------------------------- */

const PEDIDOS_CONFIG = {
  // Cole aqui o link gerado em Arquivo → Compartilhar → Publicar na web
  // (escolha a aba "Painel", formato CSV). Deixe vazio para manter o
  // estado "ainda não configurado".
  sheetCsvUrl: "",
};

const STATUS_PIPELINE = ["Orçamento", "Fila", "Imprimindo", "Acabamento", "Pronto", "Entregue"];

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  initNav();
  loadPedidos();
});

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

async function loadPedidos() {
  const board = document.getElementById("board");
  const emptyState = document.getElementById("emptyState");
  const setupState = document.getElementById("setupState");
  const errorState = document.getElementById("errorState");

  if (!PEDIDOS_CONFIG.sheetCsvUrl) {
    setupState.hidden = false;
    return;
  }

  try {
    const res = await fetch(PEDIDOS_CONFIG.sheetCsvUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csvText = await res.text();
    const pedidos = parseCsv(csvText);

    if (!pedidos.length) {
      emptyState.hidden = false;
      return;
    }

    renderBoard(pedidos, board);
    board.hidden = false;
  } catch (err) {
    console.error("Não foi possível carregar os pedidos:", err);
    errorState.hidden = false;
  }
}

/** Parser de CSV simples que lida com campos entre aspas (vírgulas dentro do texto). */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((r) => r.some((cell) => cell.trim() !== ""));
  if (!header) return [];

  const cols = header.map((h) => h.trim().toLowerCase());
  return body.map((r) => {
    const entry = {};
    cols.forEach((col, idx) => (entry[col] = (r[idx] || "").trim()));
    return entry;
  }).filter((p) => p.codigo);
}

function renderBoard(pedidos, board) {
  board.innerHTML = "";

  STATUS_PIPELINE.forEach((status) => {
    const items = pedidos.filter((p) => p.status === status);
    const column = document.createElement("div");
    column.className = "board-column";
    column.innerHTML = `
      <h3 class="board-column-title">${status} <span class="board-count">${items.length}</span></h3>
      <div class="board-cards"></div>
    `;

    const cardsContainer = column.querySelector(".board-cards");
    if (!items.length) {
      cardsContainer.innerHTML = `<p class="board-empty-col">Nenhum pedido</p>`;
    } else {
      items.forEach((p) => cardsContainer.appendChild(renderCard(p)));
    }

    board.appendChild(column);
  });

  const outros = pedidos.filter((p) => !STATUS_PIPELINE.includes(p.status));
  if (outros.length) {
    const column = document.createElement("div");
    column.className = "board-column";
    column.innerHTML = `<h3 class="board-column-title">Outros <span class="board-count">${outros.length}</span></h3><div class="board-cards"></div>`;
    const cardsContainer = column.querySelector(".board-cards");
    outros.forEach((p) => cardsContainer.appendChild(renderCard(p)));
    board.appendChild(column);
  }
}

function renderCard(pedido) {
  const card = document.createElement("article");
  card.className = "board-card";

  const details = [];
  if (pedido.material) details.push(pedido.material);
  if (pedido.previsao) details.push(`previsão: ${pedido.previsao}`);

  card.innerHTML = `
    <span class="board-card-code">${escapeHtml(pedido.codigo)}</span>
    <p class="board-card-title">${escapeHtml(pedido.peca || "Peça sem nome")}</p>
    ${details.length ? `<p class="board-card-meta">${escapeHtml(details.join(" · "))}</p>` : ""}
  `;
  return card;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
