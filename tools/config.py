"""
Endereço oficial do site.

É o que vai no sitemap.xml, no robots.txt e na tag canonical de cada página —
ou seja, o endereço que o Google considera "o" site. Ao trocar de hospedagem ou
colocar domínio próprio, mude só aqui e rode:

    python3 tools/build.py
"""
import re

BASE_URL = "https://weslley11.github.io/Zanshin3dStudio/"

# A Cloudflare Pages redireciona /pagina.html para /pagina. Lá o endereço oficial
# precisa ser sem ".html", senão o Google encontra um redirecionamento em cada
# URL do sitemap. No GitHub Pages fica com ".html".
URL_SEM_HTML = False


def url_oficial(caminho):
    """'guia-suportes.html' ou 'peca.html?id=leao' -> endereço oficial completo."""
    arquivo, _, consulta = caminho.partition("?")
    if arquivo == "index.html":
        arquivo = ""
    elif URL_SEM_HTML and arquivo.endswith(".html"):
        arquivo = arquivo[: -len(".html")]
    return BASE_URL + arquivo + (f"?{consulta}" if consulta else "")


def fora_do_google(html):
    """Páginas com <meta name="robots" content="noindex"> (a 404, o painel de
    pedidos) pedem pra não aparecer no Google: ficam sem canonical e fora do
    sitemap, senão o site manda dois recados contraditórios."""
    return re.search(r'<meta name="robots" content="[^"]*noindex', html) is not None
