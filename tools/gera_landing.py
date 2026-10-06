"""Gera as 4 landing pages por público, lendo as peças reais de js/pecas-data.js."""

import json
import re
import os

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))


def miniatura(src):
    """Versão de 600 px da foto ('x.webp' -> 'x-600.webp'). Todo card usa ela:
    card é exibido com no máximo ~500 px físicos, mesmo em celular de tela densa."""
    return src[: -len(".webp")] + "-600.webp" if src.endswith(".webp") else src

# ---- lê as peças reais (id -> titulo, primeira imagem, alt) ----
data = open(os.path.join(ROOT, "js/pecas-data.js"), encoding="utf-8").read()
PECAS = {}
for bloco in re.findall(r"\{\s*id:\s*\"(.*?)\".*?\}\s*,\s*(?=\{|\]\s*;)", data, re.S):
    pass

# parse mais direto: quebra por "id:" e pega os campos dentro de cada peça
partes = re.split(r"\n\s*\{\s*\n\s*id:", data)
for p in partes[1:]:
    pid = re.match(r'\s*"([^"]+)"', p).group(1)
    titulo = re.search(r'titulo:\s*"([^"]+)"', p).group(1)
    img = re.search(r'src:\s*"([^"]+)"', p).group(1)
    alt = re.search(r'alt:\s*"([^"]+)"', p).group(1)
    PECAS[pid] = {"titulo": titulo, "src": img, "alt": alt}

print(f"{len(PECAS)} peças lidas")

NAV = [
    ("sobre.html", "Sobre"), ("servicos.html", "Serviços"), ("materiais.html", "Materiais"),
    ("orcamento.html", "Orçamento"), ("galeria.html", "Galeria"), ("guia.html", "Guia"),
    ("faq.html", "FAQ"), ("pedidos.html", "Pedidos"),
]

WA = "5547991677070"

ICON = {
    "nome": '<path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2"/><path d="M9 20h6"/><path d="M12 4v16"/>',
    "cor": '<circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="13" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="10" cy="19" r="2.5"/>',
    "lote": '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    "mao": '<path d="M12 3v9"/><path d="M8 7v5"/><path d="M16 7v5"/><path d="M5 12a7 7 0 0 0 14 0"/><path d="M12 19v2"/>',
    "tamanho": '<path d="M3 16V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M7 10v4M11 9v6M15 10v4"/>',
    "escudo": '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z"/>',
    "encaixe": '<path d="M9 3h6v4h4v6a3 3 0 0 1-3 3h-2v5H10v-5H8a3 3 0 0 1-3-3V7h4V3Z"/>',
    "tecnico": '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    "reposicao": '<path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7.5 4"/><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7.5-4"/><path d="M19.5 3v4h-4M4.5 21v-4h4"/>',
    "marca": '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 3 12V5a2 2 0 0 1 2-2h7a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.6Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    "entrega": '<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
}


def svg(key):
    return f'<svg viewBox="0 0 24 24" aria-hidden="true">{ICON[key]}</svg>'


PAGES = [
    {
        "file": "presentes.html",
        "nome": "Presentes personalizados",
        "title": "Presentes personalizados em 3D — Zanshin 3D Studio",
        "desc": "Chaveiros com nome, lembrancinhas e presentes únicos impressos em 3D em Jaraguá do Sul, SC. Peça seu orçamento.",
        "eyebrow": "Presentes personalizados",
        "h1": "Um presente que ninguém mais vai ter igual",
        "lead": "Chaveiro com o nome, lembrancinha de festa, peça de decoração com a cara da pessoa. "
                "Você conta a ideia e a gente imprime aqui em Jaraguá do Sul.",
        "points": ["Feito sob medida", "Cor do filamento à sua escolha", "Serve pra uma peça ou pra festa inteira"],
        "pecas": ["chaveiro-gabi", "coelho-laco", "sagrada-familia", "gatos-tres", "jogo-da-velha",
                  "capivara-bailarina", "gatinho-texturizado", "porta-copos-hp", "bailarina-classica",
                  "ovelha", "bailarina", "gato-samurai", "cavalo", "chaveiro-minecraft",
                  "mascotes-spfc-flamengo", "pomo-de-ouro"],
        "pecas_titulo": "Presentes que já saíram daqui",
        "pecas_lead": "Fotos reais de peças impressas no studio. Clique pra ver cada uma em detalhe.",
        "benefits_titulo": "Por que dar um presente impresso em 3D",
        "benefits": [
            ("nome", "Com o nome, a data ou o que você quiser", "Dá pra imprimir texto na própria peça — nome, apelido, data de aniversário ou aquela frase interna."),
            ("cor", "A cor que combina", "Trabalhamos com várias cores de filamento. Dá pra casar com o tema da festa ou com o gosto da pessoa."),
            ("lote", "Uma peça ou várias iguais", "Serve tanto pro presente único quanto pra lembrancinha de festa, em quantidade."),
            ("mao", "Acabamento feito à mão", "Cada peça sai com os supports removidos e o acabamento combinado antes de ir pra você."),
        ],
        "wa": "Olá! Quero um presente personalizado impresso em 3D 🙂",
    },
    {
        "file": "colecionaveis.html",
        "nome": "Colecionáveis e figuras",
        "title": "Colecionáveis e action figures em 3D — Zanshin 3D Studio",
        "desc": "Action figures, bustos, réplicas e dioramas impressos e pintados em 3D em Jaraguá do Sul, SC. Peça seu orçamento.",
        "eyebrow": "Colecionáveis e figuras",
        "h1": "Action figures, bustos e réplicas do que você curte",
        "lead": "Do Kratos ao Pomo de Ouro: a gente imprime, monta e pinta a peça do personagem, "
                "filme ou jogo que você escolher.",
        "points": ["Pintura feita à mão", "Do chaveiro ao busto grande", "Dioramas e bases inclusos"],
        "pecas": ["kratos", "batman-armadura", "encapuzado", "gengar", "dragao-laranja", "goku-shenron",
                  "darth-vader", "dobby", "banguela", "homem-de-ferro", "diorama-hollow-knight",
                  "gato-samurai", "deadpool", "dragao-verde", "machado-resident-evil",
                  "homem-aranha-streetwear", "revolver-resident-evil", "esqueletos-dragao",
                  "dragao-preto-articulado", "mascote-espartano", "ovelha", "boneco-articulado-roxo",
                  "trofeu-copa", "esqueleto-trex", "batman"],
        "pecas_titulo": "Peças de coleção que já saíram daqui",
        "pecas_lead": "Fotos reais, sem render nem foto de catálogo. Clique pra ver cada peça em detalhe.",
        "benefits_titulo": "Como a gente trabalha essas peças",
        "benefits": [
            ("mao", "Pintura à mão, peça por peça", "A pintura é feita aqui no studio. Dá pra seguir as cores originais do personagem ou inventar a sua versão."),
            ("tamanho", "Você escolhe o tamanho", "A mesma figura sai pequena pra estante ou grande pra chamar atenção — o orçamento acompanha o tamanho."),
            ("escudo", "Props e réplicas", "Além das figuras, imprimimos armas, machados e objetos de cena pra coleção ou cosplay."),
            ("lote", "Base e diorama", "Dá pra montar a peça sobre base, com cenário, como no Goku & Shenron."),
        ],
        "wa": "Olá! Quero um colecionável impresso em 3D 🙂",
    },
    {
        "file": "gamer.html",
        "nome": "Acessórios gamer e setup",
        "title": "Acessórios gamer e para setup em 3D — Zanshin 3D Studio",
        "desc": "Suportes de controle, organizadores e peças temáticas para seu setup, impressos em 3D em Jaraguá do Sul, SC.",
        "eyebrow": "Acessórios gamer e setup",
        "h1": "Seu setup com peças que ninguém mais tem",
        "lead": "Suporte de controle, organizador de mesa, peça temática pro seu cantinho gamer — "
                "impresso sob medida, do jeito que você quiser.",
        "points": ["Encaixe pensado pro seu controle", "Material resistente pro uso diário", "Tema que você escolher"],
        "pecas": ["suporte-headset-pistao", "suporte-ps5-oni", "suporte-celular", "suporte-ps5-banguela",
                  "caneca-monster", "diorama-hollow-knight", "bone-mario", "banguela", "pad-texturizado"],
        "pecas_titulo": "Acessórios que já saíram daqui",
        "pecas_lead": "Fotos reais das peças impressas no studio.",
        "benefits_titulo": "O que dá pra fazer pro seu setup",
        "benefits": [
            ("encaixe", "Encaixe sob medida", "O suporte é pensado pro modelo do seu controle, pra ele entrar e sair sem forçar."),
            ("escudo", "Aguenta o uso do dia a dia", "Pra peça que vai ser manuseada todo dia, usamos PETG ou ABS/ASA, que não quebram fácil."),
            ("cor", "Do jeito que combina com a mesa", "Escolha a cor do filamento e o acabamento pra fechar com o resto do setup."),
            ("tamanho", "Peça que não existe pronta", "Precisa de um organizador com medida específica? É só descrever que a gente modela em cima disso."),
        ],
        "wa": "Olá! Quero um acessório pro meu setup impresso em 3D 🙂",
    },
    {
        "file": "empresas.html",
        "nome": "Empresas e protótipos",
        "title": "Impressão 3D para empresas e protótipos — Zanshin 3D Studio",
        "desc": "Protótipos, peças de reposição e brindes corporativos impressos em 3D em Jaraguá do Sul, SC. Orçamento por peça ou por lote.",
        "eyebrow": "Empresas e protótipos",
        "h1": "Protótipos e peças sob encomenda para empresas",
        "lead": "Precisa validar um protótipo, repor uma peça que não se acha mais ou fazer um brinde "
                "com a marca da empresa? A gente imprime aqui em Jaraguá do Sul, falando direto com você.",
        "points": ["Orçamento por peça ou por lote", "PETG, ABS e ASA pra uso técnico", "Atendimento direto, sem intermediário"],
        "pecas": ["suporte-headset-pistao", "gancho-parede", "leao", "suporte-celular", "pad-texturizado",
                  "encapuzado", "torre-pisa", "suporte-bananas", "pensador-abstrato",
                  "esqueletos-dragao", "esqueleto-trex", "machado-resident-evil"],
        "pecas_titulo": "O nível de detalhe e acabamento",
        "pecas_lead": "Estas são peças do nosso portfólio escolhidas por mostrarem o que a impressora entrega: "
                      "textura fina, detalhe pequeno, montagem em partes e peça grande em uma só impressão.",
        "benefits_titulo": "Como atendemos empresas",
        "benefits": [
            ("tecnico", "Materiais técnicos", "PETG pra resistência no dia a dia, ABS/ASA pra peça que pega sol e chuva sem ressecar. "
             'Acha que precisa de algo além? Veja <a href="guia-materiais-de-engenharia.html">quando vale um material de engenharia</a>.'),
            ("lote", "Lote pequeno sem custo de molde", "Pra poucas unidades, imprimir sai mais barato e mais rápido do que abrir molde."),
            ("reposicao", "Peça de reposição", "Aquela peça descontinuada pode ser remodelada e impressa a partir de uma amostra ou desenho."),
            ("marca", "Brindes e peças com a marca", "Chaveiros, troféus e lembranças com o logo da empresa, em quantidade."),
        ],
        "nota": "Transparência: nosso portfólio publicado é de peças decorativas e colecionáveis — "
                "ainda não temos cases técnicos de clientes para mostrar aqui. Me mande o desenho, a "
                "amostra ou o arquivo que eu avalio a viabilidade e o material antes de qualquer compromisso.",
        "wa": "Olá! Sou de uma empresa e quero um orçamento de impressão 3D 🙂",
    },
]


def nav_html(ativo):
    itens = []
    for href, label in NAV:
        itens.append(f'        <li><a href="{href}" class="nav-link">{label}</a></li>')
    itens.append('        <li><a href="contato.html" class="nav-link btn-nav">Contato</a></li>')
    return "\n".join(itens)


def render(p):
    pontos = "\n".join(
        f'          <span class="landing-point">{t}</span>' for t in p["points"]
    )

    pecas_html = []
    for pid in p["pecas"]:
        peca = PECAS[pid]
        pecas_html.append(
            f'        <a href="peca.html?id={pid}" class="gallery-item reveal">\n'
            f'          <img loading="lazy" decoding="async" src="{miniatura(peca["src"])}" alt="{peca["alt"]}">\n'
            f'          <span class="gallery-item-caption">{peca["titulo"]}</span>\n'
            f'        </a>'
        )
    pecas_html = "\n".join(pecas_html)

    benefits_html = "\n".join(
        f'        <article class="benefit reveal">\n'
        f'          <span class="benefit-icon">{svg(icone)}</span>\n'
        f'          <h3>{titulo}</h3>\n'
        f'          <p>{texto}</p>\n'
        f'        </article>'
        for icone, titulo, texto in p["benefits"]
    )

    nota = ""
    if p.get("nota"):
        nota = f'\n      <p class="landing-note quote-disclaimer reveal center">{p["nota"]}</p>'

    wa_url = f'https://wa.me/{WA}?text=' + p["wa"].replace(" ", "%20").replace("!", "%21").replace("?", "%3F")

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{p["title"]}</title>
<meta name="description" content="{p["desc"]}">
<meta name="theme-color" content="#0d0d10">
<meta property="og:type" content="website">
<meta property="og:title" content="{p["title"]}">
<meta property="og:description" content="{p["desc"]}">

<link rel="icon" type="image/png" href="assets/img/brand/icon.png">
<link rel="apple-touch-icon" href="assets/img/brand/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
</head>
<body>

<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>

<header class="site-header">
  <div class="container navbar">
    <a href="index.html" class="logo">
      <img src="assets/img/brand/logo-horizontal-dark-bg.png" alt="Zanshin 3D Studio" class="logo-img">
    </a>

    <button class="nav-toggle" id="navToggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="navLinks">
      <span></span><span></span><span></span>
    </button>

    <nav>
      <ul class="nav-links" id="navLinks">
{nav_html(p["file"])}
      </ul>
    </nav>
  </div>
</header>

<main id="conteudo">

  <section class="landing-hero">
    <div class="container">
      <p class="eyebrow reveal">{p["eyebrow"]}</p>
      <h1 class="reveal">{p["h1"]}</h1>
      <p class="section-lead reveal">{p["lead"]}</p>

      <div class="landing-points reveal">
{pontos}
      </div>

      <div class="hero-actions reveal">
        <a href="orcamento.html" class="btn btn-primary">Calcular meu orçamento</a>
        <a href="{wa_url}" target="_blank" rel="noopener" class="btn btn-ghost">Falar no WhatsApp</a>
      </div>
    </div>
  </section>

  <section class="gallery section-alt">
    <div class="container">
      <h2 class="reveal center">{p["pecas_titulo"]}</h2>
      <p class="section-lead reveal center">{p["pecas_lead"]}</p>

      <div class="gallery-grid">
{pecas_html}
      </div>{nota}

      <p class="gallery-note reveal center">
        <a href="galeria.html">Ver a galeria completa ({len(PECAS)} peças) →</a>
      </p>
    </div>
  </section>

  <section class="services">
    <div class="container">
      <h2 class="reveal center">{p["benefits_titulo"]}</h2>

      <div class="benefit-grid">
{benefits_html}
      </div>
    </div>
  </section>

  <section class="process section-alt" style="height:auto">
    <div class="process-sticky" style="position:static;height:auto;padding:96px 0">
      <div class="container">
        <p class="eyebrow reveal center">Como funciona</p>
        <h2 class="reveal center">Simples assim</h2>

        <div class="benefit-grid">
          <article class="benefit reveal">
            <span class="process-step-number">01</span>
            <h3>Você conta a ideia</h3>
            <p>Manda o arquivo 3D pronto (STL/OBJ) ou só descreve o que quer — a gente ajuda a pensar.</p>
          </article>
          <article class="benefit reveal">
            <span class="process-step-number">02</span>
            <h3>A gente orça</h3>
            <p>Valor calculado por tamanho, material e tempo de impressão. Você aprova antes de começarmos.</p>
          </article>
          <article class="benefit reveal">
            <span class="process-step-number">03</span>
            <h3>Imprime e acaba</h3>
            <p>Impressão na Bambu Lab P2S, supports removidos e o acabamento combinado.</p>
          </article>
          <article class="benefit reveal">
            <span class="process-step-number">04</span>
            <h3>Chega até você</h3>
            <p>Combinamos retirada aqui em Jaraguá do Sul ou envio.</p>
          </article>
        </div>
      </div>
    </div>
  </section>

  <section class="cta-band">
    <div class="container">
      <h2 class="reveal">Vamos tirar essa ideia do papel?</h2>
      <p class="section-lead reveal">
        Faça uma estimativa na hora pela calculadora, ou manda a ideia no WhatsApp que a gente te ajuda a pensar.
      </p>
      <div class="hero-actions reveal">
        <a href="orcamento.html" class="btn btn-primary">Calcular meu orçamento</a>
        <a href="{wa_url}" target="_blank" rel="noopener" class="btn btn-ghost">Falar no WhatsApp</a>
      </div>
    </div>
  </section>

</main>

<footer class="site-footer">
  <div class="container footer-inner">
    <div class="footer-brand">
      <img src="assets/img/brand/logo-horizontal-dark-bg.png" alt="Zanshin 3D Studio" class="logo-img footer-logo-img">
    </div>
    <p>© <span id="year"></span> Zanshin 3D Studio · Jaraguá do Sul, SC</p>
    <div class="footer-social">
      <a href="https://wa.me/{WA}" target="_blank" rel="noopener" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24"><path d="M20.5 3.5a11 11 0 0 0-17.4 13.2L2 21.5l4.9-1.3A11 11 0 0 0 20.5 3.5Z"/></svg>
      </a>
      <a href="https://www.instagram.com/zanshin_3dstudio/" target="_blank" rel="noopener" aria-label="Instagram">
        <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>
      </a>
    </div>
  </div>
</footer>

<a class="whatsapp-float" href="https://wa.me/{WA}" target="_blank" rel="noopener" aria-label="Fale conosco no WhatsApp" id="floatWhatsapp">
  <svg viewBox="0 0 24 24"><path d="M20.5 3.5a11 11 0 0 0-17.4 13.2L2 21.5l4.9-1.3A11 11 0 0 0 20.5 3.5Z"/><path d="M8.5 8.4c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .5.4.2.5.6 1.6.7 1.7.1.1.1.3 0 .5-.1.2-.2.3-.3.5-.2.2-.3.3-.1.6.2.3.8 1.3 1.8 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.2.4-.2.6-.1.2.1 1.5.7 1.8.8.3.1.5.2.5.3.1.4.1.8-.1 1.2-.2.4-1.1 1-1.9 1.1-.6.1-1.3.1-4.2-1-3.5-1.4-5.7-4.9-5.9-5.1-.2-.2-1.4-1.8-1.4-3.5 0-1.6.9-2.4 1.2-2.7Z" fill="var(--bg)" stroke="none"/></svg>
</a>

<script src="js/script.js"></script>
</body>
</html>
"""


for p in PAGES:
    out = os.path.join(ROOT, p["file"])
    html = render(p)
    open(out, "w", encoding="utf-8").write(html)
    print(f'{p["file"]:<22} {len(p["pecas"])} peças, {len(html)//1024} KB')
