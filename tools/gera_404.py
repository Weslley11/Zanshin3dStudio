"""
Gera 404.html, a página de endereço inexistente.

Sem ela, a Cloudflare Pages trata o site como aplicativo de página única e
responde QUALQUER endereço errado com a home, com status 200 — pro Google isso
vira um monte de cópias da home. Com ela, endereço errado devolve 404 de verdade.
O GitHub Pages também usa este arquivo no lugar da página de erro genérica dele.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gera_guia import ROOT, WA, header, RODAPE  # noqa: E402

# A 404 é servida em qualquer caminho, inclusive aninhado (/a/b/c). Sem uma
# base fixa, css/, js/ e assets/ seriam procurados em /a/b/css/ e a página
# sairia sem estilo. A raiz depende da hospedagem: no GitHub Pages o site
# vive em /Zanshin3dStudio/, nos outros fica na raiz do domínio.
BASE_DINAMICA = """<script>
  (function () {
    var base = document.createElement("base");
    base.href = location.hostname.endsWith("github.io") ? "/Zanshin3dStudio/" : "/";
    document.head.prepend(base);
  })();
</script>"""

PAGINA = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
{BASE_DINAMICA}
<title>Página não encontrada — Zanshin 3D Studio</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="#0d0d10">

<link rel="icon" type="image/png" href="assets/img/brand/icon.png">
<link rel="apple-touch-icon" href="assets/img/brand/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
</head>
<body>

<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
{header("")}
<main id="conteudo">
  <section class="page-hero center">
    <div class="container">
      <p class="eyebrow">Erro 404</p>
      <h1>Essa página não existe</h1>
      <p class="section-lead">
        O endereço pode ter mudado ou ter sido digitado errado.
        Um destes caminhos deve levar aonde você queria:
      </p>
      <div class="hero-actions" style="justify-content:center">
        <a href="index.html" class="btn btn-primary">Página inicial</a>
        <a href="galeria.html" class="btn btn-ghost">Galeria de peças</a>
        <a href="orcamento.html" class="btn btn-ghost">Fazer orçamento</a>
        <a href="guia.html" class="btn btn-ghost">Guia de impressão 3D</a>
      </div>
      <p class="gallery-note">
        Procurando uma peça específica? <a href="https://wa.me/{WA}" target="_blank" rel="noopener">Chama a gente no WhatsApp</a>.
      </p>
    </div>
  </section>
</main>
{RODAPE}"""

if __name__ == "__main__":
    open(os.path.join(ROOT, "404.html"), "w", encoding="utf-8").write(PAGINA)
    print("404.html")
