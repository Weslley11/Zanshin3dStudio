"""
Regenera a faixa em movimento da home a partir de uma lista única.

A faixa roda com translateX(-50%), então as DUAS metades precisam ter
exatamente a mesma largura — senão o loop dá um salto visível. Gerar as
duas do mesmo IDs garante isso; editar à mão já quebrou antes.
A segunda metade é cópia acessível-invisível (aria-hidden, alt vazio).
"""
import html
import os
import re

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))


def miniatura(src):
    """Versão de 600 px da foto ('x.webp' -> 'x-600.webp'). Todo card usa ela:
    card é exibido com no máximo ~500 px físicos, mesmo em celular de tela densa."""
    return src[: -len(".webp")] + "-600.webp" if src.endswith(".webp") else src

IDS = [
    "kratos", "gengar", "dragao-articulado", "ninja", "darth-vader", "banguela-furia-luz",
    "encapuzado", "dobby", "batman-armadura", "deadpool", "dragao-laranja", "goku-shenron",
    "sagrada-familia", "homem-aranha-streetwear", "mascote-espartano", "diorama-hollow-knight",
    "revolver-resident-evil", "gato-samurai", "suporte-headset-pistao", "esqueletos-dragao",
    "bone-mario", "suporte-ps5-oni", "trofeu-copa", "cachorro-fantasma", "bailarina-classica",
    "leao", "capivara-bailarina", "esqueleto-trex", "coelho-laco",
]

data = open(os.path.join(ROOT, "js/pecas-data.js"), encoding="utf-8").read()
pecas = {}
for p in re.split(r"\n\s*\{\s*\n\s*id:", data)[1:]:
    pecas[re.match(r'\s*"([^"]+)"', p).group(1)] = {
        "titulo": re.search(r'titulo:\s*"([^"]+)"', p).group(1),
        "src": re.search(r'src:\s*"([^"]+)"', p).group(1),
    }

faltando = [i for i in IDS if i not in pecas]
if faltando:
    raise SystemExit(f"ids inexistentes em pecas-data.js: {faltando}")


def item(pid, duplicado):
    p = pecas[pid]
    alt = "" if duplicado else html.escape(f'{p["titulo"]} impresso em 3D', quote=True)
    extra = ' aria-hidden="true" tabindex="-1"' if duplicado else ""
    return (f'      <a href="peca.html?id={pid}" class="marquee-item"{extra}>'
            f'<img loading="lazy" decoding="async" src="{miniatura(p["src"])}" alt="{alt}"></a>')


bloco = (
    "\n".join(item(i, False) for i in IDS)
    + "\n\n      <!-- repetição para a faixa correr sem emenda -->\n"
    + "\n".join(item(i, True) for i in IDS)
)

caminho = os.path.join(ROOT, "index.html")
pagina = open(caminho, encoding="utf-8").read()
novo, n = re.subn(
    r'(<div class="marquee-track">\n).*?(\n    </div>)',
    lambda m: m.group(1) + bloco + m.group(2),
    pagina, count=1, flags=re.S,
)
if n != 1:
    raise SystemExit("não achei a faixa — abortando sem escrever")
open(caminho, "w", encoding="utf-8").write(novo)
print(f"faixa: {len(IDS)} peças por metade, {len(IDS) * 2} itens no total")
