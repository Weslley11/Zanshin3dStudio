"""
Gera as duas portas de entrada do guia:
 - guia-problemas.html  — sintoma -> causa -> o que mexer
 - guia-referencia.html — valores de partida por material, numa tabela só

Reaproveita head/header/rodapé do gen_guia.py pra não duplicar template.
"""
import html
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gera_guia import ROOT, WA, head, header, RODAPE  # noqa: E402

# (grupo, sintoma, descrição, [passos], slug do artigo que aprofunda)
PROBLEMAS = [
    ("Adesão e primeira camada", [
        ("A peça descola da mesa no meio da impressão",
         "Soltou depois de já ter começado, normalmente por um canto.",
         ["Lave a chapa com <strong>água morna e detergente neutro</strong>. Gordura de dedo é a causa número um, e álcool não tira ela por completo.",
          "Baixe o <strong>Z offset</strong>: se as linhas da primeira camada não se tocam, não há área de contato suficiente.",
          "Reduza a <strong>velocidade da primeira camada</strong> para 15–25&nbsp;mm/s.",
          "Em peça alta e de base pequena, ligue o <strong>brim</strong>.",
          "Em ABS e ASA, use cola em bastão — não é opcional."],
         "primeira-camada"),
        ("Os cantos levantam e a base fica torta (empenamento)",
         "A peça continua colada no centro, mas as bordas sobem e deformam.",
         ["É contração: o material encolhe ao esfriar e puxa as pontas. ABS e ASA são os piores.",
          "Use <strong>impressora fechada</strong> ou, no mínimo, proteja de corrente de ar — porta e janela abertas perto da máquina bastam para causar isso.",
          "Suba a <strong>temperatura da mesa</strong> e mantenha aquecida durante toda a impressão.",
          "Reduza a ventoinha: resfriar rápido demais aumenta a contração.",
          "Use <strong>brim</strong> largo para segurar as bordas.",
          "Se a peça não precisa de resistência térmica, troque para PLA e o problema some."],
         None),
        ("A base saiu com uma saia para fora (pé de elefante)",
         "As primeiras camadas ficaram mais largas que o resto, e o encaixe trava na base.",
         ["As primeiras camadas são espremidas pelo peso e pelo calor.",
          "Ligue a <strong>compensação de pé de elefante</strong> no slicer, em torno de 0,15&nbsp;mm.",
          "Suba um pouco o <strong>Z offset</strong>, se ele estiver baixo demais.",
          "Baixe a <strong>temperatura da mesa</strong> alguns graus."],
         "tolerancia-de-encaixe"),
    ]),
    ("Extrusão", [
        ("As linhas estão finas e com falhas (sub-extrusão)",
         "Falta material: aparecem vãos entre as linhas e o topo não fecha.",
         ["Verifique se o filamento está <strong>úmido</strong> — é a causa mais comum e a mais ignorada.",
          "Suba a <strong>temperatura do bico</strong> em 5&nbsp;°C e teste.",
          "Suba a <strong>taxa de fluxo</strong> se a parede está medindo menos que o configurado.",
          "Reduza a velocidade: pode ser que você esteja pedindo mais vazão do que o bico entrega.",
          "Se vier acompanhado de estalo no extrusor, trate como entupimento."],
         "calibracao-fluxo"),
        ("Sobra material: rebarba, topo com relevo e peça fora de medida",
         "O oposto do anterior — sai plástico demais.",
         ["Baixe a <strong>taxa de fluxo</strong>. Imprima um cubo de parede única e meça com paquímetro.",
          "Filamento silk quase sempre precisa de fluxo bem menor, na faixa de 0,90–0,95.",
          "Confira a <strong>temperatura</strong>: alta demais deixa o plástico mole e espalhado."],
         "calibracao-fluxo"),
        ("Fiapos finos entre as partes da peça (stringing)",
         "Teias de plástico ligando pontos que deveriam estar separados.",
         ["<strong>Filamento úmido</strong> é a primeira suspeita, principalmente em PETG. Seque antes de mexer em qualquer outra coisa.",
          "Baixe a <strong>temperatura do bico</strong> em 5–10&nbsp;°C.",
          "Aumente um pouco a <strong>retração</strong> — mas pouco: retração exagerada causa entupimento.",
          "Aumente a velocidade de deslocamento, para o bico passar mais rápido pelo vão."],
         "bico-entupido"),
        ("O extrusor estala e a extrusão falha",
         "Som de clique ritmado, e trechos sem material.",
         ["É entupimento parcial ou pressão alta demais.",
          "Confira se a <strong>ventoinha do dissipador</strong> está girando e desobstruída — essa é a causa de entupimento que aparece no meio de impressão longa.",
          "Suba a temperatura, ou baixe a velocidade.",
          "Faça uma <strong>limpeza a frio</strong> (cold pull).",
          "Se você imprimiu material abrasivo com bico de latão, o bico pode estar gasto."],
         "bico-entupido"),
    ]),
    ("Superfície e acabamento", [
        ("Ondulação que se repete depois de cada quina",
         "Um padrão de eco na parede, que vai sumindo alguns milímetros depois do canto.",
         ["Isso é <strong>ringing</strong>, causado por vibração — quase nunca é defeito de máquina.",
          "Baixe a <strong>velocidade da parede externa</strong>: 60–90&nbsp;mm/s em PLA, 40–60 em PETG.",
          "Baixe a <strong>aceleração da parede externa</strong> para 3.000–5.000&nbsp;mm/s². Em peça pequena isso pesa mais que a velocidade.",
          "Calibre a compensação de vibração (input shaper), com a mesa aquecida.",
          "Confira se a impressora está em superfície estável e sem parafuso solto no carro do bico."],
         "velocidade-e-aceleracao"),
        ("A quina ficou com bolinha, ou afundada",
         "Acúmulo de material logo na quina, ou falha logo depois dela.",
         ["É <strong>pressure advance</strong> (dinâmica de fluxo) descalibrado.",
          "Bolinha na quina = valor baixo demais. Quina afundada = valor alto demais.",
          "Rode o teste de torre do seu slicer e refaça a cada filamento novo."],
         "calibracao-fluxo"),
        ("O topo ficou rugoso, com linhas cruzadas",
         "A superfície de cima não fica lisa nem uniforme.",
         ["Calibre o <strong>fluxo</strong> primeiro. Topo com relevo quase sempre é fluxo alto.",
          "Ligue <strong>linhas monotônicas</strong> no topo: mesmo tempo, superfície bem mais uniforme.",
          "Baixe a <strong>velocidade do topo</strong> para 30–50&nbsp;mm/s.",
          "Use camada de 0,12–0,16&nbsp;mm se o acabamento importa.",
          "Só então ligue o <strong>ironing</strong>, com fluxo de 10–20%."],
         "topo-liso"),
        ("Uma linha vertical aparece na lateral da peça",
         "A marca onde cada camada começa e termina.",
         ["Isso é a <strong>costura</strong>, e ela sempre existe — a questão é onde cai.",
          "Em peça com frente definida, use o modo <em>atrás</em> e gire o modelo.",
          "Em cilindro, use <em>alinhado</em> ou a <strong>costura em bisel</strong> (scarf seam).",
          "Evite o modo <em>aleatório</em> em superfície lisa: ele troca uma linha por pontinhos espalhados.",
          "Para controle total, pinte a costura no modelo."],
         "costura"),
        ("O degrau das camadas aparece nas curvas",
         "Superfície arredondada com aspecto de escada.",
         ["Baixe a <strong>altura de camada</strong> — o degrau só aparece em superfície inclinada, não em parede reta.",
          "Melhor ainda: use <strong>camada variável</strong>, que deixa fina só onde precisa e mantém o resto rápido."],
         "altura-de-camada"),
        ("A saliência saiu caída e enrolada",
         "Partes que avançam no ar ficam com fios pendurados.",
         ["Aumente o <strong>resfriamento</strong>: em PLA, ventoinha em 90–100%.",
          "Reduza a velocidade nas saliências.",
          "Gire a peça: saliência de até cerca de <strong>45°</strong> imprime sem suporte nenhum.",
          "Se passar de 45°, use suporte — de preferência em árvore."],
         "suportes"),
    ]),
    ("Resistência e dimensão", [
        ("A peça quebrou fácil, separando entre camadas",
         "A ruptura aconteceu numa linha horizontal, acompanhando a emenda das camadas.",
         ["A ligação entre camadas é o ponto fraco de toda peça impressa.",
          "<strong>Mude a orientação na mesa</strong>: o esforço precisa correr ao longo das camadas, não através delas. Esse é o fator que mais pesa.",
          "Aumente o <strong>número de paredes</strong> para 3 ou 4 — conta mais que preenchimento.",
          "Suba a temperatura do bico um pouco: mais calor, melhor adesão entre camadas.",
          "Reduza o resfriamento em materiais que não sejam PLA.",
          "Confira se o filamento está seco."],
         "paredes-e-preenchimento"),
        ("Aumentei o preenchimento e a peça continua fraca",
         "Mais tempo, mais filamento, mesmo resultado.",
         ["Preenchimento quase nunca é o problema. A resistência vem do material <strong>longe do centro</strong>.",
          "Volte o preenchimento para 15% em giroide e suba as <strong>paredes</strong> para 3 ou 4.",
          "Revise a orientação na mesa antes de qualquer outra coisa.",
          "Confira o material: PLA não aguenta esforço contínuo nem calor."],
         "paredes-e-preenchimento"),
        ("As duas peças não encaixam",
         "O pino não entra no furo, ou entra e não segura.",
         ["Dimensão externa sai maior e furo sai menor — os dois erros somam no encaixe.",
          "Deixe <strong>0,2&nbsp;mm de folga total</strong> como ponto de partida; 0,3–0,4 se precisa girar.",
          "Ligue a compensação de <strong>pé de elefante</strong>, senão trava na base.",
          "Calibre o <strong>fluxo</strong>: fluxo alto engorda tudo.",
          "Imprima só a região do encaixe para testar, não a peça inteira.",
          "Chanfre a entrada do furo em 0,5&nbsp;mm — perdoa muito desvio."],
         "tolerancia-de-encaixe"),
        ("A peça entortou depois de pronta",
         "Ficou boa na impressão e deformou com o tempo ou com o uso.",
         ["Quase sempre é <strong>calor</strong>. PLA começa a amolecer por volta de 55&nbsp;°C, e um carro fechado no sol passa disso fácil.",
          "Para peça que pega sol ou calor, use PETG, ABS ou ASA.",
          "Se a peça ficou sob carga constante, pode ser fluência: PLA cede devagar sob peso permanente."],
         None),
    ]),
    ("Suportes e mecânico", [
        ("O suporte não sai, ou arranca pedaço da peça",
         "Fica grudado demais e estraga a superfície ao remover.",
         ["Aumente a <strong>distância Z do topo</strong> — em passos de uma altura de camada, porque o valor é arredondado.",
          "Aumente o <strong>espaçamento da interface</strong> em 0,05–0,1&nbsp;mm.",
          "Reduza (ou zere) as <strong>camadas de interface</strong>.",
          "Se puder usar dois materiais, faça a interface em PETG sob peça de PLA: praticamente não aderem.",
          "Mude uma coisa de cada vez, e teste em peça pequena."],
         "suportes"),
        ("As camadas saíram deslocadas no meio da peça",
         "A impressão 'pulou' de lugar e seguiu torta a partir dali.",
         ["Isso é mecânico, não de slicer.",
          "Confira se o bico <strong>bateu na peça</strong> — saliência enrolada ou blob levantado derrubam o eixo.",
          "Verifique correias e polias: folga ou parafuso solto causam perda de passo.",
          "Reduza velocidade e aceleração de deslocamento.",
          "Confira se algo está obstruindo o movimento dos eixos."],
         None),
        ("Pontinhos e bolhas espalhados pela superfície",
         "Pequenos relevos onde o bico começou ou terminou um trecho.",
         ["Se estão espalhados por toda a peça, pode ser o modo de costura <em>aleatório</em>. Troque para alinhado ou atrás.",
          "Se vêm acompanhados de estalo e fiapo, é <strong>filamento úmido</strong>: seque.",
          "Ajuste o pressure advance, que controla o acúmulo no fim de cada trecho."],
         "costura"),
    ]),
]

# material -> valores de partida
REFERENCIA = [
    ("PLA", "190–220 °C", "50–60 °C", "90–100%", "60–90 mm/s", "0,96–0,99", "50–55 °C · 8 h"),
    ("PETG", "230–250 °C", "70–85 °C", "30–50%", "40–60 mm/s", "0,93–0,97", "60–65 °C · 8 h"),
    ("ABS / ASA", "240–270 °C", "90–100 °C", "0–30%", "40–60 mm/s", "0,95–1,00", "75–85 °C · 8 h"),
    ("TPU", "215–235 °C", "40–60 °C", "40–60%", "25–40 mm/s", "0,95–1,00", "50–55 °C · 8 h"),
]


def pagina_problemas():
    blocos = []
    for grupo, itens in PROBLEMAS:
        linhas = []
        for sintoma, desc, passos, slug in itens:
            passos_html = "\n".join(f"            <li>{p}</li>" for p in passos)
            leia = (f'\n          <a class="diag-leia" href="guia-{slug}.html">Entender a fundo</a>'
                    if slug else "")
            linhas.append(
                f"""      <details class="diag-item">
        <summary>{html.escape(sintoma)}</summary>
        <div class="diag-body">
          <p>{html.escape(desc)}</p>
          <ol>
{passos_html}
          </ol>{leia}
        </div>
      </details>"""
            )
        blocos.append(
            f'    <div class="diag-group reveal">\n'
            f"      <h2>{html.escape(grupo)}</h2>\n" + "\n".join(linhas) + "\n    </div>"
        )

    total = sum(len(i) for _, i in PROBLEMAS)
    return (
        head(
            "Minha impressão deu problema: diagnóstico rápido — Zanshin 3D Studio",
            f"Índice de {total} problemas de impressão 3D por sintoma: o que está acontecendo e, em ordem, o que mexer para resolver.",
            "guia-problemas.html",
        )
        + header("guia.html")
        + f"""
<main id="conteudo">
  <section class="page-hero center">
    <div class="container">
      <p class="eyebrow reveal"><a href="guia.html" style="color:inherit">Guia</a> · Diagnóstico</p>
      <h1 class="reveal">Minha impressão deu problema</h1>
      <p class="section-lead reveal">
        Ache o sintoma, abra, e siga a lista <strong>na ordem</strong> — ela vai do que mais
        resolve para o que menos resolve. Mude uma coisa por vez: se mexer em três, você não
        vai saber qual funcionou.
      </p>
    </div>
  </section>

  <section class="section">
    <div class="container" style="max-width:860px">
{chr(10).join(blocos)}

      <div class="article-cta reveal" style="margin-top:72px">
        <h2>Não quer caçar regulagem?</h2>
        <p>Você manda a ideia ou o arquivo e a gente entrega a peça pronta — com tudo
        isso já resolvido do nosso lado.</p>
        <a href="orcamento.html" class="btn btn-primary">Fazer um orçamento</a>
        <a href="https://wa.me/{WA}" class="btn btn-ghost" target="_blank" rel="noopener">Chamar no WhatsApp</a>
      </div>

      <nav class="article-nav" aria-label="Outras páginas do guia">
        <a href="guia.html">Todos os artigos</a>
        <a href="guia-referencia.html">Tabela de valores de partida →</a>
      </nav>
    </div>
  </section>
</main>
"""
        + RODAPE
    )


def pagina_referencia():
    linhas = "\n".join(
        f"""            <tr>
              <th scope="row">{m}</th>
              <td class="spec-temp">{bico}</td>
              <td class="spec-temp">{mesa}</td>
              <td class="spec-temp">{fan}</td>
              <td class="spec-temp">{vel}</td>
              <td class="spec-temp">{fluxo}</td>
              <td class="spec-temp">{sec}</td>
            </tr>"""
        for m, bico, mesa, fan, vel, fluxo, sec in REFERENCIA
    )

    return (
        head(
            "Valores de partida por material — Zanshin 3D Studio",
            "Tabela de referência para configurar impressão 3D: temperatura de bico e mesa, ventoinha, velocidade da parede externa, fluxo e secagem, por material.",
            "guia-referencia.html",
        )
        + header("guia.html")
        + f"""
<main id="conteudo">
  <section class="page-hero center">
    <div class="container">
      <p class="eyebrow reveal"><a href="guia.html" style="color:inherit">Guia</a> · Referência</p>
      <h1 class="reveal">Valores de partida por material</h1>
      <p class="section-lead reveal">
        Tudo numa tabela só, para consultar com a impressora na frente.
      </p>
    </div>
  </section>

  <section class="section">
    <div class="container" style="max-width:980px">
      <div class="article-note reveal" style="margin-bottom:40px">
        <p><strong>Isto é ponto de partida, não preset.</strong> Cada marca de filamento se
        comporta de um jeito, e o valor certo muda com o bico, a máquina e até a umidade do
        dia. Use a tabela para começar perto, e calibre a partir dela.</p>
      </div>

      <p class="spec-table-hint reveal" style="margin:0 0 -40px">Arraste a tabela para o lado para ver todas as colunas</p>
      <div class="spec-table-wrap reveal" style="margin-top:56px">
        <table class="spec-table">
          <caption>Velocidade é da parede externa — o resto da peça pode correr bem mais rápido.</caption>
          <thead>
            <tr>
              <th scope="col">Material</th>
              <th scope="col">Bico</th>
              <th scope="col">Mesa</th>
              <th scope="col">Ventoinha</th>
              <th scope="col">Parede externa</th>
              <th scope="col">Fluxo</th>
              <th scope="col">Secagem</th>
            </tr>
          </thead>
          <tbody>
{linhas}
          </tbody>
        </table>
      </div>

      <div class="article-body reveal" style="margin-top:72px">
        <h2 style="margin-top:0;padding-top:0;border:0">Valores que não dependem do material</h2>

        <h3>Primeira camada</h3>
        <ul>
          <li>Altura: 0,16 a 0,24&nbsp;mm</li>
          <li>Largura: 110 a 130%</li>
          <li>Velocidade: 15 a 25&nbsp;mm/s</li>
        </ul>

        <h3>Altura de camada (bico de 0,4&nbsp;mm)</h3>
        <ul>
          <li>0,08–0,12&nbsp;mm — acabamento fino, peça de exposição</li>
          <li>0,16&nbsp;mm — equilíbrio</li>
          <li>0,20&nbsp;mm — dia a dia, peça funcional</li>
          <li>0,24–0,28&nbsp;mm — rascunho</li>
          <li>Nunca passe de 75–80% do diâmetro do bico</li>
        </ul>

        <h3>Aceleração</h3>
        <ul>
          <li>Parede externa: 3.000 a 5.000&nbsp;mm/s²</li>
          <li>Parede interna: 6.000 a 10.000&nbsp;mm/s²</li>
          <li>Deslocamento: 15.000 a 20.000&nbsp;mm/s²</li>
        </ul>

        <h3>Resistência</h3>
        <ul>
          <li>Paredes: 3 a 4 (conta mais que preenchimento)</li>
          <li>Preenchimento: giroide a 15%</li>
          <li>Oriente a peça para o esforço correr ao longo das camadas</li>
        </ul>

        <h3>Suporte e encaixe</h3>
        <ul>
          <li>Saliência até 45°: não precisa de suporte</li>
          <li>Folga de encaixe: 0,2&nbsp;mm justo · 0,3–0,4&nbsp;mm para girar</li>
          <li>Compensação de pé de elefante: cerca de 0,15&nbsp;mm</li>
        </ul>

        <div class="article-note">
          <p><strong>Retração:</strong> em impressora de acionamento direto, 0,5 a
          1,0&nbsp;mm resolve. Valores de sistema Bowden são muito maiores e, copiados para
          uma máquina direct drive, causam entupimento.</p>
        </div>
      </div>

      <nav class="article-nav" aria-label="Outras páginas do guia">
        <a href="guia-problemas.html">← Diagnóstico por sintoma</a>
        <a href="guia.html">Todos os artigos</a>
      </nav>
    </div>
  </section>
</main>
"""
        + RODAPE
    )


if __name__ == "__main__":
    total = sum(len(i) for _, i in PROBLEMAS)
    for nome, conteudo in (("guia-problemas.html", pagina_problemas()),
                           ("guia-referencia.html", pagina_referencia())):
        open(os.path.join(ROOT, nome), "w", encoding="utf-8").write(conteudo)
        print(f"{nome:<26} {len(conteudo) // 1024} KB")
    print(f"diagnóstico: {total} sintomas em {len(PROBLEMAS)} grupos")
