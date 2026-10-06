"""Gera sitemap.xml e robots.txt a partir das páginas que existem de verdade."""
import datetime
import glob
import os
import re
import xml.sax.saxutils as sx

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
BASE = "https://weslley11.github.io/Zanshin3dStudio/"
HOJE = datetime.date.today().isoformat()

# páginas que não fazem sentido indexar sozinhas
IGNORAR = {"peca.html"}          # é um template, só vale com ?id=
# prioridade por página (o resto fica no padrão)
PRIORIDADE = {"index.html": "1.0", "galeria.html": "0.9", "orcamento.html": "0.9",
              "guia.html": "0.8", "servicos.html": "0.8", "materiais.html": "0.8"}

paginas = sorted(os.path.basename(p) for p in glob.glob(os.path.join(ROOT, "*.html")))
urls = [(p, PRIORIDADE.get(p, "0.6")) for p in paginas if p not in IGNORAR]

# uma URL por peça da galeria — é conteúdo real, com texto e foto próprios
data = open(os.path.join(ROOT, "js/pecas-data.js"), encoding="utf-8").read()
for pid in re.findall(r"\n\s*id:\s*\"([^\"]+)\"", data):
    urls.append((f"peca.html?id={pid}", "0.5"))

corpo = "\n".join(
    f"  <url>\n"
    f"    <loc>{sx.escape(BASE + u)}</loc>\n"
    f"    <lastmod>{HOJE}</lastmod>\n"
    f"    <priority>{p}</priority>\n"
    f"  </url>"
    for u, p in urls
)

open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    f"{corpo}\n"
    "</urlset>\n"
)

open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8").write(
    "User-agent: *\n"
    "Allow: /\n\n"
    f"Sitemap: {BASE}sitemap.xml\n"
)

print(f"sitemap.xml: {len(urls)} URLs ({len(paginas) - len(IGNORAR)} páginas + "
      f"{len(urls) - len(paginas) + len(IGNORAR)} peças)")
print("robots.txt: ok")
