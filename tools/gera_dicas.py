"""
Gera guia-dicas.html: as dicas rápidas de configuração, organizadas por etapa.

Cada dica tem o valor de partida, uma frase do porquê e o link para o artigo
do guia que explica a fundo. Os números seguem os artigos (gera_guia.py) e a
tabela de referência (gera_guia_extra.py): se mudar um valor lá, mude aqui.

    python3 tools/gera_dicas.py      (o build.py já roda)
"""
import html
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from gera_guia import head, header, RODAPE, ROOT  # noqa: E402

# (título, valor em destaque, explicação, link, texto do link)
ETAPAS = [
    ("Antes de imprimir", "Metade dos problemas some aqui, antes de apertar o botão.", [
        ("Mesa limpa", "água + detergente",
         "Gordura de dedo é a causa número um de peça soltando. Lave a placa ou passe álcool isopropílico, e não encoste na área de impressão.",
         "guia-primeira-camada.html", "Primeira camada"),
        ("Primeira camada devagar", "15 a 25 mm/s",
         "Altura de 0,16 a 0,24 mm e largura de 110 a 130%. O resto da peça pode correr; só a primeira camada precisa de calma para assentar.",
         "guia-primeira-camada.html", "Primeira camada"),
        ("Orientação na mesa", "pense na força",
         "A peça é mais fraca entre camadas. Deite-a de forma que o esforço fique ao longo das linhas, e você ganha resistência e ainda gasta menos suporte.",
         "guia-paredes-e-preenchimento.html", "O que deixa a peça forte"),
        ("Filamento seco", "PETG, TPU e nylon",
         "Filamento úmido estala, solta fio e deixa a superfície áspera. Se o rolo ficou aberto por semanas, seque antes de imprimir.",
         "guia-secagem-de-filamento.html", "Secagem de filamento"),
    ]),
    ("Qualidade da superfície", "O que muda o que o olho vê, sem triplicar o tempo.", [
        ("Altura de camada", "0,16 mm",
         "Melhor equilíbrio para decoração. Use 0,20 mm no dia a dia, 0,08 a 0,12 mm só em peça de exposição e 0,24 a 0,28 mm para rascunho.",
         "guia-altura-de-camada.html", "Altura de camada"),
        ("Camada variável", "Adaptativa + Suavizar",
         "Em topo arredondado, o Bambu Studio afina a camada só onde há curva: selecione o modelo, abra Altura de camada variável, clique em Adaptativa e depois em Suavizar. Confira o tempo antes de imprimir.",
         "guia-altura-de-camada.html", "Altura de camada"),
        ("Parede externa devagar", "PLA 60 a 90 mm/s",
         "Só a parede de fora aparece. PETG 40 a 60, TPU 25 a 40. Preenchimento pode ir a 120 a 150 mm/s sem prejuízo nenhum.",
         "guia-velocidade-e-aceleracao.html", "Velocidade e aceleração"),
        ("Aceleração da parede externa", "3.000 a 5.000 mm/s²",
         "Em peça pequena o bico nem chega na velocidade máxima, então quem decide o acabamento é a aceleração. Ondulação depois da quina é sinal para baixar.",
         "guia-velocidade-e-aceleracao.html", "Velocidade e aceleração"),
        ("Ventoinha no PLA", "90 a 100%",
         "Resfriamento forte melhora ponte, balanço e detalhe pequeno. Em PETG e ABS/ASA a ventoinha fica bem mais baixa; veja a tabela.",
         "guia-referencia.html", "Valores por material"),
    ]),
    ("Calibração", "Duas calibrações que parecem iguais e fazem coisas diferentes.", [
        ("Taxa de fluxo", "quanto material sai",
         "Corrige sub e sobre-extrusão. Faixas comuns: PLA 0,96 a 0,99, PETG 0,93 a 0,97, PLA silk 0,90 a 0,95. Meça um cubo de parede única com paquímetro.",
         "guia-calibracao-fluxo.html", "Fluxo e pressure advance"),
        ("Pressure advance (valor K)", "quando o material sai",
         "Corrige quina abaulada ou afundada. Partida: PLA 0,02 a 0,05, PETG 0,03 a 0,06, TPU 0,015 a 0,03. Refaça a cada filamento diferente.",
         "guia-calibracao-fluxo.html", "Fluxo e pressure advance"),
    ]),
    ("Suportes e costura", "Acabamento de quem olha a peça de perto.", [
        ("Suporte que não sai", "Top Z distance",
         "É o ajuste que mais pesa. Aumente uma altura de camada por vez e confira no preview: mais vão solta fácil, mas deixa a parte de baixo mais áspera.",
         "guia-suportes.html", "Suportes"),
        ("Interface de suporte", "PETG embaixo de PLA",
         "PETG e PLA quase não colam um no outro. Imprimir só a interface do suporte em PETG faz o suporte sair praticamente sozinho.",
         "guia-suportes.html", "Suportes"),
        ("Suporte em árvore", "figura orgânica",
         "Toca a peça em menos pontos e gasta menos material. Ótimo em braço, asa e capa. Mude uma regulagem por vez e teste numa peça pequena.",
         "guia-suportes.html", "Suportes"),
        ("Costura", "Alinhada ou Atrás",
         "Cilindro pede alinhada; figura com costas pede atrás. Aleatória costuma espalhar pontinhos pela peça inteira e só funciona em superfície texturizada.",
         "guia-costura.html", "A costura da peça"),
        ("Costura invisível", "Scarf seam",
         "A costura em bisel espalha a emenda numa rampa e dissolve a marca em cilindro e vaso. Para controle total, pinte a costura onde ela vai sumir.",
         "guia-costura.html", "A costura da peça"),
    ]),
    ("Resistência e topo", "Para peça que vai ser usada, não só olhada.", [
        ("Paredes antes de preenchimento", "3 a 4 paredes",
         "Quem segura a peça é a casca. Três a quatro paredes com 15% de giroide é mais forte, mais rápido e mais barato que subir o preenchimento.",
         "guia-paredes-e-preenchimento.html", "O que deixa a peça forte"),
        ("Topo liso", "linhas monotônicas",
         "Topo em linhas monotônicas e fluxo calibrado resolvem a maioria dos casos. Ironing só nas superfícies de cima que aparecem, a 30 a 60 mm/s.",
         "guia-topo-liso.html", "Topo liso"),
        ("ABS e ASA", "câmara fechada",
         "Material de engenharia empena e racha com corrente de ar. A P2S é fechada, então mantenha a tampa no lugar e deixe a câmara aquecer antes de começar.",
         "guia-materiais-de-engenharia.html", "Materiais de engenharia"),
    ]),
]


def pagina():
    blocos = []
    for i, (nome, sub, dicas) in enumerate(ETAPAS, 1):
        cards = "\n".join(
            f"""          <article class="tip-card reveal">
            <h3>{html.escape(t)}</h3>
            <p class="tip-value">{html.escape(v)}</p>
            <p>{html.escape(d)}</p>
            <a class="tip-link" href="{href}">Ler: {html.escape(lt)} →</a>
          </article>"""
            for t, v, d, href, lt in dicas
        )
        blocos.append(f"""      <section class="tips-stage" aria-labelledby="etapa{i}">
        <div class="tips-stage-head reveal">
          <span class="tips-stage-n" aria-hidden="true">{i}</span>
          <div>
            <h2 id="etapa{i}">{html.escape(nome)}</h2>
            <p>{html.escape(sub)}</p>
          </div>
        </div>
        <div class="tip-grid">
{cards}
        </div>
      </section>""")

    return (
        head(
            "Dicas rápidas de impressão 3D — Zanshin 3D Studio",
            "As regulagens que mais mudam o resultado na impressão 3D, com o valor de partida de cada uma: primeira camada, altura de camada, velocidade, fluxo, suportes, costura e resistência.",
            "guia-dicas.html",
        )
        + header("guia.html")
        + f"""
<main id="conteudo">
  <section class="page-hero">
    <div class="container">
      <p class="eyebrow reveal"><a href="guia.html" style="color:inherit">Guia</a></p>
      <h1 class="reveal">Dicas rápidas</h1>
      <p class="section-lead reveal">
        As regulagens que mais mudam o resultado, na ordem em que aparecem no trabalho.
        Cada uma traz um valor de partida e o link para o artigo que explica o porquê.
        Mude uma coisa por vez e teste numa peça pequena.
      </p>
    </div>
  </section>

  <section class="section tips">
    <div class="container">
{chr(10).join(blocos)}

      <p class="tips-note reveal">
        Valores de partida para bico de 0,4 mm, testados na nossa Bambu Lab P2S com base na
        documentação da Bambu Lab. Cada filamento tem sua faixa: em caso de dúvida, siga o
        fabricante e consulte a <a href="guia-referencia.html">tabela por material</a>.
        Algo deu errado? Comece pelo <a href="guia-problemas.html">diagnóstico por sintoma</a>.
      </p>
    </div>
  </section>
</main>
"""
        + RODAPE
    )


if __name__ == "__main__":
    open(os.path.join(ROOT, "guia-dicas.html"), "w", encoding="utf-8").write(pagina())
    print(f"guia-dicas.html ({sum(len(d) for _, _, d in ETAPAS)} dicas em {len(ETAPAS)} etapas)")
