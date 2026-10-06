"""
Regenera tudo que é derivado de js/pecas-data.js e do conteúdo do guia.

    python3 tools/build.py

Rode sempre depois de:
  - adicionar ou editar uma peça em js/pecas-data.js
  - colocar uma foto nova (.jpg) em assets/img/gallery/
  - mudar a lista de peças de uma landing page ou da faixa da home
  - escrever ou editar um artigo do guia

O que ele faz, nesta ordem:
  1. otimiza_imagens   — gera as duas versões WebP de cada foto nova
  2. gera_galeria      — o grid de galeria.html
  3. gera_faixa        — a faixa em movimento da home (as duas metades idênticas)
  4. gera_landing      — presentes, colecionáveis, gamer e empresas
  5. gera_guia         — o índice do guia e os artigos
  6. gera_guia_extra   — o diagnóstico por sintoma e a tabela de referência
  7. gera_sitemap      — sitemap.xml e robots.txt

Partes da home escritas à mão (destaque, cards de público e os 6 cards da
seção de galeria) NÃO são geradas — se trocar uma peça lá, edite index.html.
"""
import os
import runpy
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)

ETAPAS = [
    "otimiza_imagens", "gera_galeria", "gera_faixa", "gera_landing",
    "gera_guia", "gera_guia_extra", "gera_sitemap",
]

for etapa in ETAPAS:
    print(f"── {etapa}")
    # o .jpg só serve de entrada: depois de virar WebP, sai da pasta pra não
    # ser publicado à toa (o original fica no histórico do git, se foi commitado)
    sys.argv = [f"{etapa}.py"] + (["--apagar-jpg"] if etapa == "otimiza_imagens" else [])
    runpy.run_path(os.path.join(AQUI, f"{etapa}.py"), run_name="__main__")

print("── pronto")
