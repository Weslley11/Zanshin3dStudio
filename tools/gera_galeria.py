"""Regenera o grid da galeria a partir de js/pecas-data.js, pra não sair de sincronia."""
import html
import os
import re

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))


def miniatura(src):
    """Versão de 600 px da foto ('x.webp' -> 'x-600.webp'). Todo card usa ela:
    card é exibido com no máximo ~500 px físicos, mesmo em celular de tela densa."""
    return src[: -len(".webp")] + "-600.webp" if src.endswith(".webp") else src

data = open(os.path.join(ROOT, "js/pecas-data.js"), encoding="utf-8").read()
pecas = []
for p in re.split(r"\n\s*\{\s*\n\s*id:", data)[1:]:
    pecas.append({
        "id": re.match(r'\s*"([^"]+)"', p).group(1),
        "titulo": re.search(r'titulo:\s*"([^"]+)"', p).group(1),
        "src": re.search(r'src:\s*"([^"]+)"', p).group(1),
        "alt": re.search(r'alt:\s*"([^"]+)"', p).group(1),
    })

cards = "\n".join(
    f'        <a href="peca.html?id={p["id"]}" class="gallery-item reveal">\n'
    f'          <img loading="lazy" decoding="async" src="{miniatura(p["src"])}" alt="{html.escape(p["alt"], quote=True)}">\n'
    f'          <span class="gallery-item-caption">{html.escape(p["titulo"])}</span>\n'
    f'        </a>'
    for p in pecas
)

caminho = os.path.join(ROOT, "galeria.html")
pagina = open(caminho, encoding="utf-8").read()
novo, n = re.subn(
    r'(<div class="gallery-grid">\n).*?(\n      </div>)',
    lambda m: m.group(1) + cards + m.group(2),
    pagina, flags=re.S,
)
if n != 1:
    raise SystemExit(f"esperava 1 grid, encontrei {n} — abortando sem escrever")
open(caminho, "w", encoding="utf-8").write(novo)
print(f"galeria.html: {len(pecas)} cards")
