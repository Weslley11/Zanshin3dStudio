"""
Carimba em todas as páginas a tag que diz ao Google qual é o endereço oficial.

    <link rel="canonical" href="...">

O site é publicado em mais de um lugar (a hospedagem principal e o GitHub Pages
como espelho, pra links antigos continuarem funcionando). Sem essa tag, o Google
vê as cópias competindo entre si. Com ela, todas apontam pro endereço de
tools/config.py.

Vale também pras páginas escritas à mão: rode o build depois de trocar o
endereço e todas se atualizam. Idempotente — rodar de novo não muda nada.

Duas exceções:
- páginas com noindex (a 404, o painel de pedidos) ficam sem canonical;
- o peca.html é um arquivo só pras 60 peças. Um canonical fixo ali diria ao
  Google que todas são cópias de uma página só, então ele recebe só a base do
  endereço (<meta name="url-oficial">) e o js/peca.js cria o canonical de cada
  peça, com o ?id= dela.
"""
import glob
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import fora_do_google, url_oficial  # noqa: E402

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

CANONICAL = re.compile(r'<link rel="canonical" href="[^"]*">')
LINHA_CANONICAL = re.compile(r'<link rel="canonical" href="[^"]*">\n')
BASE_PECA = re.compile(r'<meta name="url-oficial" content="[^"]*">')
DESCRICAO = re.compile(r'(<meta name="description"[^>]*>\n)')


def carimba(nome, html):
    """Devolve o html com a tag certa pra essa página (ou sem nenhuma)."""
    if fora_do_google(html):
        return LINHA_CANONICAL.sub("", html)

    if nome == "peca.html":
        html = LINHA_CANONICAL.sub("", html)
        padrao, tag = BASE_PECA, f'<meta name="url-oficial" content="{url_oficial(nome)}">'
    else:
        padrao, tag = CANONICAL, f'<link rel="canonical" href="{url_oficial(nome)}">'

    if padrao.search(html):
        return padrao.sub(tag, html, count=1)
    novo, n = DESCRICAO.subn(lambda m: m.group(1) + tag + "\n", html, count=1)
    if n != 1:
        raise SystemExit(f"{nome}: sem <meta name=\"description\"> pra ancorar o canonical")
    return novo


if __name__ == "__main__":
    mudadas = iguais = 0
    for caminho in sorted(glob.glob(os.path.join(ROOT, "*.html"))):
        nome = os.path.basename(caminho)
        html = open(caminho, encoding="utf-8").read()
        novo = carimba(nome, html)
        if novo == html:
            iguais += 1
            continue
        open(caminho, "w", encoding="utf-8").write(novo)
        mudadas += 1
        print(f"  {nome}")

    print(f"canonical: {mudadas} páginas atualizadas, {iguais} já certas")
