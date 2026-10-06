"""
Gera a área de guia: guia.html (índice) + uma página por artigo.

Todo o texto é original, escrito na voz do site. Os números são faixas de
partida, não presets — está dito em cada artigo, porque varia com filamento,
modelo e máquina.
"""
import html
import os

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
WA = "5547991677070"

NAV = [
    ("sobre.html", "Sobre"), ("servicos.html", "Serviços"), ("materiais.html", "Materiais"),
    ("orcamento.html", "Orçamento"), ("galeria.html", "Galeria"), ("guia.html", "Guia"),
    ("faq.html", "FAQ"), ("pedidos.html", "Pedidos"),
]

ARTIGOS = [
    {
        "slug": "altura-de-camada",
        "categoria": "Qualidade",
        "tempo": "6 min",
        "titulo": "Altura de camada: qual usar em cada peça",
        "lead": "A regulagem que mais muda o resultado visual — e a que mais gente deixa no padrão sem pensar.",
        "resumo": "0,08, 0,16, 0,20 ou 0,28 mm? O que cada faixa entrega, onde a diferença realmente aparece e por que subir a altura nem sempre economiza tempo.",
        "corpo": """
<p>Altura de camada é a espessura de cada fatia que a impressora empilha. Com bico de
0,4&nbsp;mm — o padrão — dá pra trabalhar de 0,08 a 0,28&nbsp;mm. Quanto mais fina, mais
camadas, mais detalhe e mais tempo. É o <em>trade-off</em> mais direto da impressão 3D.</p>

<p>O erro comum é tratar isso como uma régua simples de "fino&nbsp;=&nbsp;melhor". Não é:
em boa parte das peças a diferença entre 0,12 e 0,20&nbsp;mm é invisível, e você pagou o dobro
do tempo por nada.</p>

<h2>As quatro faixas, e o que cada uma serve</h2>

<h3>0,08 a 0,12 mm — acabamento fino</h3>
<p>Para peças de exposição e superfícies curvas: busto, miniatura, rosto, qualquer coisa
com inclinação suave. É aqui que a camada fina se paga, porque é onde o degrau aparece.
Em compensação, o tempo sobe muito.</p>

<h3>0,16 mm — equilíbrio</h3>
<p>O meio-termo honesto. Decorativo com bom acabamento sem o tempo do 0,12. É a altura
que a gente usa na maior parte das peças da galeria.</p>

<h3>0,20 mm — dia a dia</h3>
<p>Ponto de partida para quase tudo que é funcional: suporte, gancho, caixa, encaixe,
protótipo de forma. O degrau existe, mas em peça utilitária ninguém olha.</p>

<h3>0,24 a 0,28 mm — rascunho</h3>
<p>Para validar formato e encaixe rápido, ou para peça grande e de geometria simples.
O degrau fica bem visível em curva.</p>

<h2>Onde a diferença aparece de verdade</h2>

<p>Essa é a parte que quase nenhum guia explica: a altura de camada <strong>mal muda a
parede vertical</strong>. Uma parede reta sai praticamente igual em 0,12 e em 0,24.</p>

<p>O degrau aparece em <strong>superfície inclinada e em curva suave</strong> — o topo de uma
cúpula, o ombro de uma figura, a lateral arredondada de um vaso. Quanto mais próxima da
horizontal a superfície, mais larga fica cada "prateleira" entre camadas, e mais o olho
enxerga a escada.</p>

<div class="article-note">
  <p><strong>Regra prática:</strong> olhe a peça e pergunte onde existe superfície quase
  horizontal. Se não existe quase nenhuma, suba a altura sem medo. Se a peça é toda curva,
  desça.</p>
</div>

<h2>Camada variável: o melhor dos dois</h2>

<p>Em vez de escolher um número para a peça inteira, dá pra deixar a altura fina só onde
precisa. No Bambu Studio e no Orca isso é a <strong>camada variável (adaptive layer
height)</strong>: você seleciona o modelo, aplica o adaptativo e suaviza.</p>

<p>Numa cúpula, por exemplo, a base reta sai em 0,24 e o topo curvo em 0,12. O resultado
visual é quase o de 0,12 na peça inteira, com uma fração do tempo. Vale conferir o preview
por altura de camada antes de mandar imprimir, porque a transição mal distribuída deixa
uma faixa visível.</p>

<h2>Dois limites que não dá pra ignorar</h2>

<ul>
  <li><strong>Altura máxima:</strong> não passe de cerca de 75–80% do diâmetro do bico. Em
  bico de 0,4&nbsp;mm, isso dá uns 0,30&nbsp;mm. Acima disso a camada não gruda direito na
  de baixo e a peça fica frágil.</li>
  <li><strong>Resistência:</strong> camada mais fina não deixa a peça mais forte de forma
  automática. O que mais pesa na resistência é o número de paredes, não o preenchimento
  nem a altura de camada.</li>
</ul>

<h2>Como a gente decide aqui</h2>

<p>Figura e colecionável: 0,12 a 0,16. Peça funcional: 0,20. Protótipo de validação:
0,24. Peça grande e curva: camada variável. E quando o cliente pede acabamento máximo
numa peça de exposição, 0,08 — avisando que o tempo de impressão mais que dobra, porque
isso entra no orçamento.</p>
""",
    },
    {
        "slug": "primeira-camada",
        "categoria": "Fundamentos",
        "tempo": "7 min",
        "titulo": "Primeira camada: o que decide se a peça vai colar",
        "lead": "A maior parte das impressões que falham, falha nos primeiros dois minutos.",
        "resumo": "Mesa limpa, Z offset no ponto e três regulagens. Como reconhecer camada alta demais, baixa demais e no ponto — e o que fazer em cada caso.",
        "corpo": """
<p>Impressão que descola, peça que empena, canto que levanta: quase sempre o problema
nasceu na primeira camada. É a única camada que não gruda em plástico — gruda na mesa — e
por isso ela tem regras próprias.</p>

<h2>1. Mesa limpa é metade do trabalho</h2>

<p>Gordura de dedo é o inimigo número um. A oleosidade da mão forma um filme que o plástico
não atravessa, e o ponto onde você segurou a chapa vira exatamente o ponto onde a peça
descola.</p>

<p>Lave a chapa com <strong>água morna e detergente neutro</strong>, esfregando com a mão ou
esponja macia, e seque com pano limpo. Álcool isopropílico ajuda a tirar poeira e resíduo
entre impressões, mas não remove gordura tão bem quanto detergente. Depois de limpar,
pegue a chapa pelas bordas.</p>

<h2>2. Z offset: o ajuste mais importante</h2>

<p>O Z offset define a distância entre o bico e a mesa na primeira camada. Ele precisa
deixar o filamento <strong>levemente esmagado</strong> contra a chapa — nem encostado de
leve, nem espremido.</p>

<ul>
  <li><strong>Alto demais:</strong> dá pra ver vão entre as linhas, elas ficam
  arredondadas e separadas, e a peça descola com facilidade.</li>
  <li><strong>No ponto:</strong> as linhas se tocam e formam uma superfície contínua, com
  textura suave e sem buracos.</li>
  <li><strong>Baixo demais:</strong> a superfície fica áspera e ondulada, com plástico
  empurrado para os lados formando rebarba, e a peça gruda tanto que pode danificar a
  chapa na hora de tirar.</li>
</ul>

<div class="article-note">
  <p><strong>Teste rápido:</strong> imprima só um quadrado fino de primeira camada. Olhar
  esse quadrado contra a luz diz na hora se o offset está certo — se passa luz entre as
  linhas, está alto.</p>
</div>

<h2>3. As regulagens da primeira camada</h2>

<p>No slicer, a primeira camada tem parâmetros separados do resto. Pontos de partida que
funcionam bem em bico de 0,4&nbsp;mm:</p>

<ul>
  <li><strong>Altura:</strong> 0,16 a 0,24&nbsp;mm — um pouco mais grossa que as demais,
  para absorver variação da mesa.</li>
  <li><strong>Largura:</strong> 110 a 130% — linha mais larga tem mais área de contato.</li>
  <li><strong>Velocidade:</strong> 15 a 25&nbsp;mm/s. Essa é a que mais gente esquece.
  Devagar dá tempo do plástico assentar e aderir.</li>
  <li><strong>Fluxo:</strong> 95 a 105%.</li>
</ul>

<p>O resto da peça pode correr rápido. Só a primeira camada precisa de paciência — são
poucos minutos que decidem as próximas oito horas.</p>

<h2>4. Chapa certa para o material</h2>

<p>Cada superfície de mesa tem um comportamento:</p>

<ul>
  <li><strong>PEI lisa:</strong> boa para quase tudo, deixa a base da peça espelhada.</li>
  <li><strong>PEI texturizada:</strong> adesão mais forte e base com textura fosca.
  É a mais tolerante.</li>
  <li><strong>Chapa fria (cool plate):</strong> pensada para PLA, solta fácil quando
  esfria.</li>
</ul>

<p>Para ABS e ASA, cola em bastão não é opcional: ajuda na adesão e, tão importante
quanto, protege a chapa na hora de soltar.</p>

<h2>5. Brim: quando usar</h2>

<p>Brim é uma aba de uma camada em volta da peça, que aumenta a área colada. Use quando a
peça é <strong>alta e de base pequena</strong> — torre, figura em pé, haste — porque é o
caso em que a alavanca do próprio movimento do bico tomba a impressão. Também ajuda em
peça grande e chata, que tende a levantar os cantos.</p>

<h2>Checklist antes de confiar na impressão</h2>

<ol>
  <li>As linhas da primeira camada se tocam, sem vão entre elas?</li>
  <li>A superfície está lisa, sem ondulação nem rebarba?</li>
  <li>Os cantos continuam colados depois de alguns minutos?</li>
  <li>A peça só solta quando a chapa esfria?</li>
</ol>

<p>Se as quatro respostas forem sim, pode deixar rodando.</p>
""",
    },
    {
        "slug": "suportes",
        "categoria": "Qualidade",
        "tempo": "7 min",
        "titulo": "Suportes que saem fácil sem estragar a peça",
        "lead": "Três regulagens resolvem quase todo caso de suporte grudado — e uma quarta evita o suporte inteiro.",
        "resumo": "Top Z distance, camadas de interface e espaçamento: o que cada um faz, o que você perde ao mexer, e por que mudar um de cada vez importa.",
        "corpo": """
<p>Suporte é material descartável que segura o que ficaria no ar. O problema é que ele
precisa ser forte o bastante para sustentar e fraco o bastante para sair — e esses dois
objetivos puxam para lados opostos.</p>

<p>Quando o suporte não sai, ou sai arrancando pedaço, quase sempre é uma destas três
regulagens.</p>

<h2>1. Distância Z do topo (top Z distance)</h2>

<p>É o vão vertical entre o topo do suporte e a peça. O ajuste mais decisivo dos três.</p>

<ul>
  <li><strong>Menor:</strong> contato melhor, superfície de baixo mais lisa — e suporte
  mais difícil de tirar, com risco de marcar a peça.</li>
  <li><strong>Maior:</strong> sai fácil, menos risco de marca — e a superfície de baixo
  fica mais áspera, porque a peça começa no vazio.</li>
</ul>

<p>Um detalhe que confunde: esse valor costuma ser <strong>arredondado para um múltiplo da
altura de camada</strong>. Então, se você mexer de 0,01 em 0,01, pode não mudar nada. Ajuste
de uma altura de camada por vez, e confira no preview.</p>

<h2>2. Camadas de interface (top interface layers)</h2>

<p>São as camadas sólidas no topo do suporte, que formam a "mesinha" onde a peça se apoia.</p>

<ul>
  <li><strong>Menos camadas:</strong> imprime mais rápido, gasta menos material — e o
  padrão do suporte pode marcar a superfície de baixo.</li>
  <li><strong>Mais camadas:</strong> superfície de baixo mais lisa e base mais estável.</li>
</ul>

<p>Zerar as camadas de interface é uma estratégia válida quando o que você quer é remoção
fácil acima de tudo — típico de PLA sobre PLA.</p>

<h2>3. Espaçamento da interface (top interface spacing)</h2>

<p>É o vão horizontal entre as linhas da interface. Só faz efeito se você tiver pelo menos
uma camada de interface.</p>

<ul>
  <li><strong>Menor espaçamento:</strong> interface mais densa, superfície mais lisa — e
  mais difícil de remover.</li>
  <li><strong>Maior espaçamento:</strong> interface mais rala, sai fácil — superfície de
  baixo mais marcada.</li>
</ul>

<p>Ajuste em passos de 0,05 a 0,1&nbsp;mm e teste.</p>

<div class="article-note">
  <p><strong>Mude uma coisa por vez.</strong> Essas três regulagens interagem, e mexer nas
  três juntas torna impossível saber qual resolveu. Teste numa peça pequena, não na
  impressão de oito horas.</p>
</div>

<h2>4. O truque de material diferente</h2>

<p>Se a impressora tem mais de um material disponível, dá pra imprimir <strong>só a
interface do suporte em outro material</strong>. PETG e PLA praticamente não aderem um ao
outro, então uma interface de PETG embaixo de uma peça de PLA solta quase sozinha,
deixando a superfície lisa.</p>

<p>É a solução mais limpa que existe para o problema — com o custo de uma troca de
filamento e algum desperdício na purga.</p>

<h2>5. Suporte em árvore</h2>

<p>O suporte em árvore toca a peça em menos pontos, gasta menos material e costuma sair
mais fácil que o suporte tradicional em grade. Funciona especialmente bem em figura
orgânica — braço estendido, asa, capa. Em peça com grandes áreas planas no ar, o suporte
normal ainda é mais confiável.</p>

<h2>6. O melhor suporte é o que não existe</h2>

<p>Antes de ajustar qualquer coisa, gire a peça. Saliências de até cerca de <strong>45
graus</strong> imprimem sem suporte nenhum: cada camada se apoia o suficiente na anterior.
Mudar a orientação na mesa muitas vezes elimina o suporte inteiro — e, de quebra, melhora
a resistência da peça, porque as camadas passam a trabalhar na direção certa do esforço.</p>

<p>É por isso que, aqui, a gente decide a orientação antes de qualquer outra regulagem.
Dois minutos olhando a peça economizam uma hora de pós-processamento.</p>
""",
    },
    {
        "slug": "costura",
        "categoria": "Acabamento",
        "tempo": "5 min",
        "titulo": "A costura da peça: onde ela aparece e como escondê-la",
        "lead": "Aquela linha vertical na lateral não é defeito — é onde cada camada começa. Dá pra controlar onde ela cai.",
        "resumo": "Nearest, aligned, back e random: o que cada modo faz, por que aleatório costuma piorar, e as duas ferramentas que realmente resolvem.",
        "corpo": """
<p>Toda camada da parede externa começa e termina em algum ponto. Nesse ponto o bico
pressuriza e despressuriza, e fica uma marca mínima. Empilhadas, essas marcas formam a
<strong>costura</strong>: a linha vertical que você vê na lateral de um cilindro.</p>

<p>Costura não é defeito de impressão. Ela sempre existe. A pergunta certa não é como
eliminar, e sim onde deixar.</p>

<h2>Os quatro modos</h2>

<h3>Mais próximo (nearest)</h3>
<p>Escolhe um ponto próximo da posição atual do bico, preferindo lugares pouco visíveis
como quinas côncavas, e evitando saliências. Como depende de onde o bico está, a costura
pode andar de camada para camada. Bom padrão geral.</p>

<h3>Alinhado (aligned)</h3>
<p>Procura pontos adequados e tenta empilhá-los, criando uma linha vertical consistente.
Ainda desvia quando precisa evitar uma saliência. É o que dá o resultado mais previsível
em peça cilíndrica.</p>

<h3>Atrás (back)</h3>
<p>Joga a costura para o fundo da mesa (Y+), independente da orientação do modelo. Simples
e eficaz: gire a peça na mesa e a costura muda de face. Útil quando a peça tem um lado que
ninguém vai ver.</p>

<h3>Aleatório (random)</h3>
<p>Espalha os pontos pela superfície. A ideia é não ter linha nenhuma — mas, na prática,
em superfície lisa isso troca uma linha discreta por <strong>pontinhos espalhados pela peça
inteira</strong>, que costumam incomodar mais. Funciona melhor em peça com textura, onde os
pontos somem.</p>

<div class="article-note">
  <p><strong>Na dúvida:</strong> cilindro e peça de revolução pedem alinhado. Figura com
  frente e costas definidas pede atrás, com a costura nas costas. Aleatório só em
  superfície já texturizada.</p>
</div>

<h2>As duas ferramentas que realmente resolvem</h2>

<h3>Pintar a costura (seam painting)</h3>
<p>Em vez de escolher uma regra, você pinta no modelo exatamente onde quer a costura. É o
controle real: numa figura, dá pra empurrar a costura para dentro de uma dobra da roupa,
atrás da orelha, na junção de duas peças. Dá trabalho e vale a pena em peça de exposição.</p>

<h3>Costura em bisel (scarf joint seam)</h3>
<p>Em vez de só mudar o ponto, essa opção espalha a transição ao longo de um trecho da
parede, sobrepondo o início e o fim em rampa. Em superfície curva, isso dissolve a marca
em vez de mudá-la de lugar. É a melhor opção para cilindro e vaso.</p>

<h2>Velocidade também conta</h2>

<p>Parede externa rápida demais piora a costura e o acabamento geral, porque o sistema de
pressão do bico não acompanha a mudança de velocidade nas quinas. Baixar só a parede
externa — mantendo o preenchimento rápido — custa pouco tempo e melhora bastante o que
se vê.</p>

<p>É o mesmo princípio da calibração de fluxo dinâmico: o que você perde em velocidade na
parte visível, você compensa correndo solto no que fica escondido.</p>

<h2>O que a gente faz nas peças daqui</h2>

<p>Nas figuras da <a href="galeria.html">galeria</a>, a costura fica nas costas ou pintada
dentro de uma dobra. Em peça cilíndrica, costura em bisel. E em peça funcional, onde
ninguém vai reparar, deixa no automático — gastar tempo escondendo costura de um gancho
de parede é tempo que o cliente paga sem motivo.</p>
""",
    },
    {
        "slug": "velocidade-e-aceleracao",
        "categoria": "Qualidade",
        "tempo": "7 min",
        "titulo": "Ondulação e fantasma na peça: é velocidade, não a impressora",
        "lead": "Aquela ondinha que se repete depois de cada quina tem nome, causa e solução — e quase nunca é defeito de máquina.",
        "resumo": "Ringing e ghosting explicados: por que acelerar demais estraga a superfície, quais velocidades usar na parede externa e o que o input shaper resolve de verdade.",
        "corpo": """
<p>Você imprime um cubo e, logo depois de cada quina, a parede fica com uma ondulação que
vai sumindo aos poucos. Isso é <strong>ringing</strong> (ou ghosting): a estrutura da
impressora vibrou na mudança de direção, e o bico registrou essa vibração no plástico.</p>

<p>É o defeito que mais faz gente achar que precisa trocar de impressora. Quase sempre é
regulagem.</p>

<h2>Por que acontece</h2>

<p>Para fazer uma quina, o bico precisa parar numa direção e sair noutra. Quanto mais rápido
isso acontece, maior a força envolvida — e toda estrutura cede um pouco. O eixo balança, a
oscilação demora alguns milímetros para amortecer, e cada camada grava a mesma onda no mesmo
lugar. Empilhadas, viram aquele padrão de eco.</p>

<p>Três coisas controlam isso: <strong>velocidade</strong>, <strong>aceleração</strong> e
<strong>rigidez da máquina</strong>. As duas primeiras você muda no slicer em dois minutos.</p>

<h2>1. A parede externa é a única que precisa ser lenta</h2>

<p>Essa é a ideia central, e ela economiza muito tempo: <strong>devagar só no que aparece</strong>.
A parede externa é a única superfície que o olho vê. Parede interna, preenchimento e
deslocamento podem correr solto — ninguém nunca vai olhar.</p>

<p>Pontos de partida para a parede externa:</p>

<ul>
  <li><strong>PLA:</strong> 60 a 90&nbsp;mm/s</li>
  <li><strong>PETG:</strong> 40 a 60&nbsp;mm/s</li>
  <li><strong>TPU:</strong> 25 a 40&nbsp;mm/s</li>
</ul>

<p>O preenchimento pode ir a 120–150&nbsp;mm/s sem prejuízo nenhum. Como a parede externa é
uma fração pequena do tempo total, baixar só ela custa pouco e muda muito o resultado.</p>

<h2>2. Aceleração importa mais que velocidade de ponta</h2>

<p>Aqui está o detalhe que quase ninguém ajusta. Em peça pequena, o bico nem chega na
velocidade programada: ele passa o tempo todo acelerando e freando. Nesse caso, quem define
o acabamento é a <strong>aceleração</strong>, não a velocidade máxima.</p>

<p>Faixas típicas numa máquina rápida de pórtico:</p>

<ul>
  <li><strong>Parede externa:</strong> 3.000 a 5.000&nbsp;mm/s²</li>
  <li><strong>Parede interna:</strong> 6.000 a 10.000&nbsp;mm/s²</li>
  <li><strong>Deslocamento:</strong> 15.000 a 20.000&nbsp;mm/s²</li>
</ul>

<div class="article-note">
  <p><strong>Teste rápido:</strong> imprima um cubo pequeno com um pino saliente numa face.
  Se a ondulação aparece depois do pino e vai sumindo, é ringing. Baixe só a aceleração da
  parede externa e imprima de novo — a diferença aparece na hora.</p>
</div>

<h2>3. Input shaper: o que ele faz e o que não faz</h2>

<p>Impressoras modernas têm compensação de vibração — <em>input shaper</em>, <em>vibration
compensation</em>, o nome muda de marca para marca. A ideia é medir a frequência natural com
que a máquina vibra e antecipar o comando de movimento para cancelar essa oscilação.</p>

<p>Funciona muito bem, e permite correr mais rápido mantendo o acabamento. Mas:</p>

<ul>
  <li>Precisa ser <strong>calibrado</strong>, não só ligado. A calibração mede a sua máquina,
  no seu lugar.</li>
  <li>Calibre com a <strong>mesa aquecida</strong> e a peça montada como vai imprimir: a
  frequência muda com a temperatura e com o peso.</li>
  <li>A impressora precisa estar numa <strong>superfície estável</strong>. Mesa bamba ou
  estante de MDF fina sabotam a calibração — e todo o resto.</li>
  <li>Parafuso solto no carro do bico também. Vale conferir antes de calibrar.</li>
</ul>

<p>O input shaper não conserta estrutura frouxa. Ele compensa a vibração que a máquina tem,
não a que você adicionou.</p>

<h2>4. "Parede externa por último"</h2>

<p>Uma opção simples com efeito grande: imprimir a parede externa <strong>depois</strong> das
internas, em vez de antes. A externa passa a se apoiar em material já depositado, em vez de
no vazio, e sai mais lisa, com quinas mais definidas.</p>

<p>Em peça multicolorida ajuda ainda mais, porque reduz a chance de o material de uma cor
borrar na superfície visível.</p>

<h2>A ordem em que vale mexer</h2>

<ol>
  <li>Baixe a velocidade da parede externa.</li>
  <li>Baixe a aceleração da parede externa.</li>
  <li>Ligue "parede externa por último".</li>
  <li>Calibre a compensação de vibração.</li>
  <li>Só então pense em hardware.</li>
</ol>

<p>Uma mudança de cada vez, sempre — senão você não sabe qual resolveu, e a próxima peça
volta a dar problema sem você entender por quê.</p>
""",
    },
    {
        "slug": "calibracao-fluxo",
        "categoria": "Calibração",
        "tempo": "7 min",
        "titulo": "Fluxo e pressure advance: duas calibrações, dois problemas diferentes",
        "lead": "Elas têm nome parecido e resolvem coisas opostas. Trocar uma pela outra é perder tarde inteira.",
        "resumo": "Flow ratio ajusta quanto material sai; pressure advance ajusta a resposta na mudança de velocidade. O que cada uma conserta e como medir.",
        "corpo": """
<p>Duas calibrações aparecem juntas em todo tutorial e são constantemente confundidas:
<strong>taxa de fluxo</strong> (flow ratio) e <strong>dinâmica de fluxo</strong> (pressure
advance, ou valor K). Nomes parecidos, trabalhos completamente diferentes.</p>

<div class="article-note">
  <p><strong>Em uma linha:</strong> fluxo é <em>quanto</em> material sai. Pressure advance é
  <em>quando</em> ele sai.</p>
</div>

<h2>Taxa de fluxo: quanto material sai</h2>

<p>O slicer calcula quanto plástico precisa para cada linha. A taxa de fluxo é o fator que
corrige esse cálculo para o seu filamento real — porque o diâmetro varia de rolo para rolo,
e cada tipo de plástico incha de um jeito ao sair do bico.</p>

<h3>O que o fluxo errado causa</h3>

<ul>
  <li><strong>Sub-extrusão</strong> (fluxo baixo): vão entre as linhas, topo que não fecha,
  peça frágil.</li>
  <li><strong>Sobre-extrusão</strong> (fluxo alto): topo com relevo e rugosidade, dimensão
  maior que o projeto, quina "inchada", encaixe que não entra.</li>
</ul>

<h3>Como medir</h3>

<p>O jeito mais direto: imprima um <strong>cubo de parede única</strong> (sem preenchimento,
sem topo) e meça a espessura da parede com paquímetro em vários pontos. Compare com a largura
de linha configurada. Se mediu mais, abaixe o fluxo na mesma proporção; se mediu menos, suba.</p>

<p>Faixas em que a maioria dos filamentos cai:</p>

<ul>
  <li><strong>PLA:</strong> 0,96 a 0,99</li>
  <li><strong>PETG:</strong> 0,93 a 0,97</li>
  <li><strong>PLA silk:</strong> 0,90 a 0,95 — silk costuma precisar de bem menos fluxo,
  e é o que explica aquele topo rugoso que muita gente aceita como característica do
  material.</li>
</ul>

<h2>Pressure advance: quando o material sai</h2>

<p>Dentro do bico existe pressão. Quando o bico acelera, a pressão precisa subir para a
extrusão acompanhar — e isso leva um instante. Quando ele freia para fazer uma quina, a
pressão continua lá e o plástico continua saindo por mais um pouco.</p>

<p>O resultado, sem compensação: <strong>falta material no começo de cada linha reta e sobra
na quina</strong>. É por isso que a quina fica com uma bolinha e o início da parede fica fino.</p>

<p>O pressure advance antecipa isso: pressuriza antes de acelerar e alivia antes de frear.</p>

<h3>Como reconhecer</h3>

<ul>
  <li><strong>Valor baixo demais:</strong> quina abaulada, com acúmulo de material.</li>
  <li><strong>Valor alto demais:</strong> quina afundada, com falha logo depois dela.</li>
  <li><strong>No ponto:</strong> a quina sai viva, com a mesma espessura da parede reta.</li>
</ul>

<h3>Como medir</h3>

<p>Com um teste de torre: a impressora sobe variando o valor camada a camada e você olha em
que altura a quina ficou melhor. A maioria dos slicers modernos já traz esse teste pronto.</p>

<p>Faixas de partida em impressora de acionamento direto:</p>

<ul>
  <li><strong>PLA:</strong> 0,02 a 0,05</li>
  <li><strong>PETG:</strong> 0,03 a 0,06</li>
  <li><strong>TPU:</strong> 0,015 a 0,03</li>
</ul>

<p>Esses números são ponto de partida, não preset. O valor certo depende do conjunto bico,
extrusor e filamento — e é por isso que a calibração se refaz a cada rolo novo de um
material diferente.</p>

<h2>Qual delas resolve o seu problema</h2>

<ul>
  <li>Topo rugoso, dimensão errada, encaixe apertado → <strong>fluxo</strong></li>
  <li>Quina com bolinha ou afundada, parede que começa fina → <strong>pressure advance</strong></li>
  <li>Ondulação depois da quina, que vai sumindo → nenhuma das duas: é
  <a href="guia-velocidade-e-aceleracao.html">velocidade e aceleração</a></li>
</ul>

<h2>Calibre uma vez, salve o perfil</h2>

<p>Calibração não é tarefa recorrente se você for organizado. Calibre uma vez por
combinação de filamento e bico, <strong>salve como perfil com nome</strong>, e pronto. Aqui o
studio mantém um perfil por rolo de material — é o que permite prometer o mesmo acabamento
em peça repetida, meses depois.</p>

<p>Se você só quer a peça pronta, isso tudo já está feito: é só
<a href="orcamento.html">pedir um orçamento</a>.</p>
""",
    },
    {
        "slug": "topo-liso",
        "categoria": "Acabamento",
        "tempo": "5 min",
        "titulo": "Topo liso de verdade: ironing e o que mais importa",
        "lead": "A superfície de cima é a que mais entrega impressão malfeita — e a que tem a solução mais direta.",
        "resumo": "Linhas monotônicas, ironing e calibração de fluxo: as três coisas que transformam um topo rugoso em superfície lisa, e quando não vale a pena usar.",
        "corpo": """
<p>Parede com linha de camada todo mundo aceita — faz parte do processo. Mas topo rugoso,
com linha cruzada e ondulação, é o que faz a peça parecer malfeita. E é justamente onde um
ajuste pequeno muda muito.</p>

<h2>1. Linhas monotônicas: o ajuste gratuito</h2>

<p>O padrão de preenchimento do topo pode ser feito de duas formas. No modo comum, o bico vai
e volta em zigue-zague, alternando o sentido — e linhas impressas em sentidos opostos
refletem a luz de maneira diferente, criando aquele efeito de faixas alternadas.</p>

<p>No modo <strong>monotônico</strong>, todas as linhas do topo correm no mesmo sentido. O
tempo de impressão é praticamente o mesmo, e a superfície fica visivelmente mais uniforme.</p>

<p>É a melhoria mais barata que existe: um clique, custo zero. Se o seu slicer tem a opção,
deixe ligada sempre.</p>

<h2>2. Ironing: passar a ferro de verdade</h2>

<p>O <em>ironing</em> faz o bico passar mais uma vez por cima da camada superior já pronta,
quase sem extrudar, só com o calor e o peso. O plástico amolece de leve e preenche os vales
entre as linhas.</p>

<p>Configuração que funciona bem:</p>

<ul>
  <li><strong>Tipo:</strong> só nas superfícies de topo. Ironing em tudo é desperdício de
  tempo enorme.</li>
  <li><strong>Padrão:</strong> retilíneo.</li>
  <li><strong>Velocidade:</strong> 30 a 60&nbsp;mm/s.</li>
  <li><strong>Fluxo:</strong> 10 a 20%. Mais que isso acumula material e piora.</li>
  <li><strong>Espaçamento de linha:</strong> em torno de 0,10 a 0,15&nbsp;mm.</li>
</ul>

<div class="article-note">
  <p><strong>Ironing não é mágica.</strong> Ele alisa, mas custa tempo — às vezes vários
  minutos por superfície. E em peça com muitas áreas planas pequenas, o ganho não compensa.
  Use onde existe uma superfície plana grande e visível.</p>
</div>

<h2>3. O fluxo precisa estar certo antes</h2>

<p>Essa é a parte que faz gente desistir do ironing achando que não funciona. Se o fluxo
estiver alto, o topo já sai com material sobrando — e passar o ferro em cima só empurra esse
excesso para os lados, formando relevo.</p>

<p>A ordem certa é: <strong>calibrar o fluxo primeiro</strong>, ver o topo melhorar sozinho,
e só então ligar o ironing para o acabamento final. Se você ainda não calibrou, comece por
<a href="guia-calibracao-fluxo.html">fluxo e pressure advance</a>.</p>

<h2>4. Camada mais fina ajuda no topo também</h2>

<p>Com camada de 0,12 a 0,16&nbsp;mm, cada linha do topo é mais estreita e o vale entre elas
é menor — o topo já sai melhor antes de qualquer ironing. Em 0,28&nbsp;mm, nem o ferro
resolve direito.</p>

<p>Mais sobre isso em <a href="guia-altura-de-camada.html">altura de camada</a>.</p>

<h2>5. Velocidade do topo</h2>

<p>Mesma lógica da parede externa: o topo é superfície visível, então vale ir devagar nele.
Entre 30 e 50&nbsp;mm/s é uma faixa confortável. O restante da peça segue rápido.</p>

<h2>A receita completa</h2>

<ol>
  <li>Calibre o fluxo.</li>
  <li>Ligue linhas monotônicas no topo.</li>
  <li>Baixe a velocidade do topo para 30–50&nbsp;mm/s.</li>
  <li>Use camada de 0,12 a 0,16&nbsp;mm se o acabamento importa.</li>
  <li>Ligue ironing só nas superfícies de topo.</li>
</ol>

<p>Nessa ordem. Começar pelo ironing com o fluxo errado é o caminho mais rápido para concluir,
erradamente, que a sua impressora não dá conta.</p>
""",
    },
    {
        "slug": "paredes-e-preenchimento",
        "categoria": "Resistência",
        "tempo": "6 min",
        "titulo": "O que deixa a peça forte (e não é o preenchimento)",
        "lead": "Subir o preenchimento para 50% é o reflexo de todo mundo — e quase sempre a escolha errada.",
        "resumo": "Parede conta mais que preenchimento, giroide distribui força em todas as direções, e a orientação na mesa é o fator que mais pesa de todos.",
        "corpo": """
<p>Peça quebrou, o reflexo é subir o preenchimento. 20%, 40%, 60%. O tempo de impressão
dispara, o gasto de filamento dobra — e muitas vezes a peça quebra de novo no mesmo lugar.</p>

<p>Porque o preenchimento quase nunca é o problema.</p>

<h2>1. Parede conta mais que preenchimento</h2>

<p>Pense numa viga. A resistência à flexão vem do material que está <strong>longe do
centro</strong>, não do que está no miolo. Numa peça impressa, isso quer dizer: o que segura é
a casca.</p>

<p>Trocar 15% para 30% de preenchimento adiciona material no lugar que menos trabalha. Trocar
2 paredes por 4 adiciona material exatamente onde o esforço é maior — e costuma gastar
<em>menos</em> plástico e <em>menos</em> tempo que a subida de preenchimento equivalente.</p>

<div class="article-note">
  <p><strong>Regra prática:</strong> antes de subir o preenchimento, suba o número de
  paredes. Três a quatro paredes com 15% de preenchimento é mais forte, mais rápido e mais
  barato que duas paredes com 40%.</p>
</div>

<h2>2. Giroide: a escolha padrão</h2>

<p>O padrão de preenchimento muda como a força se distribui. O giroide é uma malha
tridimensional que não tem direção preferencial — ele resiste de forma parecida em qualquer
sentido, não cria pontos de concentração e não precisa de deslocamento a cada troca de
direção.</p>

<p>Para peça de uso geral, giroide a 15% é um ponto de partida difícil de bater. Padrões
retilíneos são mais rápidos, mas resistem bem em uma direção e mal na outra.</p>

<h2>3. A orientação na mesa é o que mais pesa</h2>

<p>Esta é a parte decisiva, e é a que não custa nada.</p>

<p>Peça impressa é feita de camadas coladas uma na outra. Dentro de uma camada o material é
contínuo e forte; <strong>entre camadas, a ligação é bem mais fraca</strong>. Uma peça impressa
em FDM é anisotrópica: ela tem direção.</p>

<p>Isso significa que a mesma peça, com o mesmo preenchimento e as mesmas paredes, pode
quebrar com a mão ou aguentar peso — dependendo só de como foi posicionada na mesa.</p>

<p>A regra: <strong>deite a peça de modo que o esforço principal corra ao longo das camadas,
não através delas</strong>. Um gancho que vai puxar para baixo não pode ser impresso em pé,
porque o puxão vai exatamente na direção da emenda entre camadas.</p>

<p>De quebra, deitar costuma reduzir ou eliminar o suporte — veja
<a href="guia-suportes.html">suportes que saem fácil</a>.</p>

<h2>4. Onde o preenchimento importa de verdade</h2>

<p>Ele não é inútil. O preenchimento importa quando:</p>

<ul>
  <li>a peça é <strong>grande e precisa resistir a compressão</strong>, como um pé ou um
  calço;</li>
  <li>o <strong>topo precisa de apoio</strong> para fechar bem — preenchimento baixo demais
  deixa o topo afundar entre as linhas;</li>
  <li>a peça vai levar <strong>parafuso ou inserto</strong> e precisa de material onde a
  rosca morde.</li>
</ul>

<p>Fora desses casos, 15% resolve.</p>

<h2>5. Camada não é o caminho</h2>

<p>Camada fina não deixa a peça mais forte de forma automática — e camada grossa demais
deixa mais fraca, porque a adesão entre camadas cai. Fique abaixo de 75–80% do diâmetro do
bico e esqueça a altura de camada como variável de resistência.</p>

<h2>Resumo para peça funcional</h2>

<ol>
  <li>Oriente a peça pensando em como ela vai ser puxada ou torcida.</li>
  <li>3 a 4 paredes.</li>
  <li>Giroide a 15%.</li>
  <li>Material adequado — PETG ou ABS, não PLA, se vai pegar esforço ou calor.</li>
  <li>Preenchimento só sobe se houver motivo específico.</li>
</ol>

<p>Essa combinação cobre a grande maioria das peças funcionais que saem daqui. Se a sua peça
precisa de um estudo mais a fundo, a gente conversa sobre isso na
<a href="empresas.html">página de empresas</a>.</p>
""",
    },
    {
        "slug": "tolerancia-de-encaixe",
        "categoria": "Projeto",
        "tempo": "5 min",
        "titulo": "Peças que encaixam: a folga certa entre duas partes",
        "lead": "O modelo estava certo e mesmo assim não entrou. O problema é que o plástico não sai do bico com a medida do desenho.",
        "resumo": "Por que a peça sai sempre um pouco maior, qual folga usar como partida, e o método de três passos pra acertar encaixe sem imprimir dez vezes.",
        "corpo": """
<p>Você modela um pino de 10&nbsp;mm e um furo de 10&nbsp;mm. Imprime. O pino não entra. Mede
tudo: o furo saiu com 9,8 e o pino com 10,2.</p>

<p>Não é erro de modelagem, e normalmente não é erro da impressora. É o processo.</p>

<h2>Por que a peça sai diferente do desenho</h2>

<p>Três efeitos somam na mesma direção:</p>

<ul>
  <li><strong>Inchaço na saída:</strong> o plástico sai do bico sob pressão e expande um
  pouco antes de esfriar. A linha fica mais larga que o programado.</li>
  <li><strong>Contração ao esfriar:</strong> todo plástico encolhe ao solidificar, e a taxa
  muda com o material. ABS encolhe bem mais que PLA.</li>
  <li><strong>Pé de elefante:</strong> as primeiras camadas ficam espremidas contra a mesa
  pelo peso e pelo calor, e a base sai com uma saia para fora.</li>
</ul>

<p>Resultado: dimensão externa tende a sair maior, dimensão interna (furo) tende a sair menor.
Os dois erros se somam justamente no encaixe.</p>

<h2>A folga de partida</h2>

<p>Para encaixe entre duas peças impressas, <strong>0,2&nbsp;mm de folga total</strong> é o
ponto de partida que funciona na maioria dos casos. Ou seja: se o furo é de 10&nbsp;mm, o
pino sai com 9,8.</p>

<p>Ajuste a partir daí conforme o uso:</p>

<ul>
  <li><strong>0,1&nbsp;mm</strong> — encaixe sob pressão, que entra com força e não sai mais.</li>
  <li><strong>0,2&nbsp;mm</strong> — encaixe justo, que entra com a mão e segura.</li>
  <li><strong>0,3 a 0,4&nbsp;mm</strong> — peça que precisa girar ou deslizar, como
  dobradiça ou tampa de rosca.</li>
  <li><strong>0,5&nbsp;mm ou mais</strong> — quando entra um componente comprado, tipo
  rolamento ou ímã, e você não quer forçar.</li>
</ul>

<p>Com ABS, aumente: o material encolhe mais e de forma menos previsível.</p>

<h2>Compensação de pé de elefante</h2>

<p>Quase todo slicer tem um ajuste de <em>elephant foot compensation</em> que encolhe as
primeiras camadas de propósito para cancelar o esmagamento. Algo em torno de
<strong>0,15&nbsp;mm</strong> costuma resolver.</p>

<p>Sem isso, mesmo com a folga certa o encaixe trava nos primeiros milímetros — e você fica
procurando erro no lugar errado.</p>

<h2>O método de três passos</h2>

<p>Em vez de reimprimir a peça inteira a cada tentativa:</p>

<ol>
  <li><strong>Calibre a dimensão.</strong> Imprima um cubo de 20&nbsp;mm e meça os três
  lados. Se está consistentemente maior, acerte o
  <a href="guia-calibracao-fluxo.html">fluxo</a> — fluxo alto engorda tudo.</li>
  <li><strong>Imprima só o encaixe.</strong> Corte do modelo apenas a região do pino e do
  furo e imprima essa peça de teste, que leva minutos em vez de horas.</li>
  <li><strong>Teste e itere.</strong> Mude a folga em passos de 0,05&nbsp;mm. Duas ou três
  rodadas resolvem, e cada rodada custa quase nada.</li>
</ol>

<div class="article-note">
  <p><strong>Uma cor por peça, no teste.</strong> Em impressão multicolorida, a troca de
  material muda levemente a extrusão na região da troca. Para calibrar encaixe, imprima o
  teste numa cor só e aplique as cores depois, na peça final.</p>
</div>

<h2>Dois detalhes que salvam o encaixe</h2>

<ul>
  <li><strong>Chanfre a entrada.</strong> Um chanfro de 0,5&nbsp;mm na boca do furo e na
  ponta do pino guia a montagem e perdoa muito desvio. É a melhoria de projeto com melhor
  retorno que existe.</li>
  <li><strong>Furo redondo sai oval.</strong> Furo pequeno impresso na vertical costuma sair
  ligeiramente menor e com facetas. Se precisa de precisão, modele o furo um pouco maior ou
  deixe para acabar com broca.</li>
</ul>

<p>Se você vai pedir uma peça com encaixe aqui no studio, mande junto a informação de
<strong>como as partes devem se comportar</strong> — se é para prender firme, girar ou sair
e voltar. É essa informação, e não a medida do desenho, que define a folga que a gente usa.</p>
""",
    },
    {
        "slug": "bico-entupido",
        "categoria": "Manutenção",
        "tempo": "6 min",
        "titulo": "Bico entupido: como reconhecer, resolver e evitar",
        "lead": "Entupimento quase nunca é azar. É filamento úmido, temperatura errada ou manutenção atrasada.",
        "resumo": "Os sinais que aparecem antes da falha, as oito causas mais comuns e o que fazer em cada uma — incluindo a tabela de secagem por material.",
        "corpo": """
<p>Entupimento raramente acontece do nada. Ele avisa antes, e quem conhece os sinais
interrompe a impressão a tempo em vez de perder oito horas.</p>

<h2>Os sinais de que vem entupimento</h2>

<ul>
  <li><strong>Extrusor estalando:</strong> o motor tenta empurrar, não consegue, e pula.
  É o aviso mais claro.</li>
  <li><strong>Sub-extrusão:</strong> as linhas ficam finas, com vão entre elas.</li>
  <li><strong>Linhas faltando:</strong> trechos onde não saiu nada.</li>
  <li><strong>Topo áspero:</strong> a superfície superior fica irregular, sem fechar.</li>
  <li><strong>Filamento saindo torto:</strong> em vez de descer reto, ele enrola para o
  lado assim que sai do bico — sinal de bico sujo ou parcialmente obstruído.</li>
</ul>

<h2>As oito causas, em ordem de frequência</h2>

<h3>1. Filamento úmido</h3>
<p>É a causa número um, e a mais subestimada. Plástico absorve água do ar; dentro do bico
essa água vira vapor, forma bolha, estoura e deixa resíduo. O resultado é extrusão
instável, estalo e fiapo.</p>

<p>PETG e náilon são muito higroscópicos e precisam de cuidado constante. PLA absorve menos,
mas também absorve. Guarde sempre em saco fechado com sílica.</p>

<h3>2. Temperatura errada</h3>
<p>Baixa demais aumenta a pressão necessária e causa sub-extrusão. Alta demais degrada o
plástico dentro do bico, que carboniza e forma crosta. Os dois extremos entopem — por
caminhos diferentes.</p>

<h3>3. Filamento ruim</h3>
<p>Filamento barato costuma ter diâmetro irregular e contaminação. Um trecho mais grosso
trava; uma impureza vira tampão.</p>

<h3>4. Retração exagerada</h3>
<p>Retração muito longa puxa plástico amolecido para cima, para a zona de transição onde
ele endurece e trava. Em impressora de acionamento direto — como as Bambu — os valores são
bem menores que os de sistemas Bowden: algo entre 0,5 e 1,0&nbsp;mm resolve. Copiar valor
de tutorial de Bowden é receita de entupimento.</p>

<h3>5. Heat creep</h3>
<p>O calor sobe pelo caminho do filamento e amolece plástico onde ele deveria estar frio e
rígido. Quase sempre é ventoinha do dissipador parada, suja ou com o fluxo de ar bloqueado.
É a causa que mais aparece em impressão longa: funciona por horas e entope no fim.</p>

<h3>6. Troca de material sem purgar</h3>
<p>Resíduo de um material de alta temperatura dentro do bico quando você passa para um de
baixa: o resto antigo não derrete e vira obstrução. Depois de ABS, PC ou qualquer filamento
mais quente, faça uma limpeza a frio (<em>cold pull</em>) antes de voltar para PLA.</p>

<h3>7. Bico errado para o filamento</h3>
<p>Filamento abrasivo — fibra de carbono, brilho metálico, glow — <strong>come bico de
latão</strong>. O furo vai abrindo e deformando até a extrusão ficar irregular. Esses
materiais pedem bico de aço endurecido ou rubi. Filamentos com carga também costumam ir
melhor em bico de 0,6&nbsp;mm ou maior.</p>

<h3>8. Falta de manutenção</h3>
<p>Limpeza a frio periódica e uma passada no caminho do filamento previnem a maioria dos
casos. É manutenção de dez minutos que evita uma troca de hotend.</p>

<h2>Tabela de secagem</h2>

<p>Se o filamento está parado há semanas ou o ambiente é úmido, seque antes de imprimir.
Valores de partida:</p>

<ul>
  <li><strong>PLA:</strong> 50 a 55&nbsp;°C por cerca de 8&nbsp;h</li>
  <li><strong>PETG:</strong> 60 a 65&nbsp;°C por cerca de 8&nbsp;h</li>
  <li><strong>ABS / ASA:</strong> 75 a 85&nbsp;°C por cerca de 8&nbsp;h</li>
</ul>

<p>Dá pra secar em estufa, desidratador de alimentos ou secador próprio. Secar na mesa
aquecida funciona, mas exige cobrir o rolo com uma caixa e virar de lado a cada poucas
horas, senão só a parte de baixo seca.</p>

<div class="article-note">
  <p><strong>Cuidado com a temperatura:</strong> não suba perto da temperatura de
  amolecimento do próprio material. PLA passando de 60&nbsp;°C começa a colar as voltas do
  rolo umas nas outras, e aí o filamento não desenrola mais.</p>
</div>

<h2>Por que isso importa pra quem compra</h2>

<p>Tudo nesta página é trabalho que acontece antes da sua peça começar. Filamento seco e
guardado direito, bico certo para cada material, manutenção em dia — é o que faz a
diferença entre a peça que você viu na foto e uma com fiapo, falha de camada e superfície
irregular.</p>
""",
    },
]


def head(title, desc, canonical):
    t, d = html.escape(title, quote=True), html.escape(desc, quote=True)
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{t}</title>
<meta name="description" content="{d}">
<meta name="theme-color" content="#0d0d10">
<meta property="og:type" content="article">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="https://weslley11.github.io/Zanshin3dStudio/{canonical}">
<link rel="canonical" href="https://weslley11.github.io/Zanshin3dStudio/{canonical}">

<link rel="icon" type="image/png" href="assets/img/brand/icon.png">
<link rel="apple-touch-icon" href="assets/img/brand/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
</head>
<body>

<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
"""


def header(ativo):
    ATUAL = ' aria-current="page"'
    itens = "\n".join(
        '        <li><a href="%s" class="nav-link%s"%s>%s</a></li>'
        % (u, " active" if u == ativo else "", ATUAL if u == ativo else "", n)
        for u, n in NAV
    )
    return f"""
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
{itens}
        <li><a href="contato.html" class="nav-link btn-nav">Contato</a></li>
      </ul>
    </nav>
  </div>
</header>
"""


RODAPE = """
<footer class="site-footer">
  <div class="container">
    <nav class="footer-nav" aria-label="Páginas por público">
      <a href="presentes.html">Presentes personalizados</a>
      <a href="colecionaveis.html">Colecionáveis e figuras</a>
      <a href="gamer.html">Acessórios gamer e setup</a>
      <a href="empresas.html">Empresas e protótipos</a>
    </nav>
  </div>
  <div class="container footer-inner">
    <div class="footer-brand">
      <img src="assets/img/brand/logo-horizontal-dark-bg.png" alt="Zanshin 3D Studio" class="logo-img footer-logo-img">
    </div>
    <p>© <span id="year"></span> Zanshin 3D Studio · Jaraguá do Sul, SC</p>
    <div class="footer-social">
      <a href="https://wa.me/5547991677070" target="_blank" rel="noopener" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24"><path d="M20.5 3.5a11 11 0 0 0-17.4 13.2L2 21.5l4.9-1.3A11 11 0 0 0 20.5 3.5Z"/></svg>
      </a>
      <a href="https://www.instagram.com/zanshin_3dstudio/" target="_blank" rel="noopener" aria-label="Instagram">
        <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>
      </a>
    </div>
  </div>
</footer>

<a class="whatsapp-float" href="https://wa.me/5547991677070" target="_blank" rel="noopener" aria-label="Fale conosco no WhatsApp" id="floatWhatsapp">
  <svg viewBox="0 0 24 24"><path d="M20.5 3.5a11 11 0 0 0-17.4 13.2L2 21.5l4.9-1.3A11 11 0 0 0 20.5 3.5Z"/><path d="M8.5 8.4c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .5.4.2.5.6 1.6.7 1.7.1.1.1.3 0 .5-.1.2-.2.3-.3.5-.2.2-.3.3-.1.6.2.3.8 1.3 1.8 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.2.4-.2.6-.1.2.1 1.5.7 1.8.8.3.1.5.2.5.3.1.4.1.8-.1 1.2-.2.4-1.1 1-1.9 1.1-.6.1-1.3.1-4.2-1-3.5-1.4-5.7-4.9-5.9-5.1-.2-.2-1.4-1.8-1.4-3.5 0-1.6.9-2.4 1.2-2.7Z" fill="var(--bg)" stroke="none"/></svg>
</a>

<script src="js/script.js"></script>
</body>
</html>
"""


def pagina_artigo(a, anterior, proximo):
    nav = []
    if anterior:
        nav.append(f'<a href="guia-{anterior["slug"]}.html">← {html.escape(anterior["titulo"])}</a>')
    nav.append('<a href="guia.html">Todos os artigos</a>')
    if proximo:
        nav.append(f'<a href="guia-{proximo["slug"]}.html">{html.escape(proximo["titulo"])} →</a>')

    return (
        head(f'{a["titulo"]} — Zanshin 3D Studio', a["resumo"], f'guia-{a["slug"]}.html')
        + header("guia.html")
        + f"""
<main id="conteudo">
  <article class="article">
    <div class="container">
      <div class="article-head reveal">
        <p class="eyebrow"><a href="guia.html" style="color:inherit">Guia</a> · {a["categoria"]}</p>
        <h1>{html.escape(a["titulo"])}</h1>
        <p class="article-lead">{html.escape(a["lead"])}</p>
        <div class="article-meta">
          <span>Leitura de {a["tempo"]}</span>
          <span>Escrito pela Zanshin 3D Studio, em Jaraguá do Sul</span>
        </div>
      </div>

      <div class="article-body reveal">
{a["corpo"].strip()}

        <div class="article-cta">
          <h2>Prefere que a gente imprima pra você?</h2>
          <p>Você manda a ideia ou o arquivo, a gente cuida de todo o resto — inclusive de tudo
          que está escrito aqui em cima.</p>
          <a href="orcamento.html" class="btn btn-primary">Fazer um orçamento</a>
          <a href="https://wa.me/{WA}" class="btn btn-ghost" target="_blank" rel="noopener">Chamar no WhatsApp</a>
        </div>
      </div>

      <nav class="article-nav" aria-label="Outros artigos">
        {"".join(nav)}
      </nav>
    </div>
  </article>
</main>
"""
        + RODAPE
    )


def pagina_indice():
    cards = "\n".join(
        f"""        <a href="guia-{a["slug"]}.html" class="guide-card reveal">
          <p class="guide-card-meta"><span>{a["categoria"]}</span><span>{a["tempo"]}</span></p>
          <h3>{html.escape(a["titulo"])}</h3>
          <p>{html.escape(a["resumo"])}</p>
          <span class="guide-card-go">Ler</span>
        </a>"""
        for a in ARTIGOS
    )

    return (
        head(
            "Guia de impressão 3D — Zanshin 3D Studio",
            "Artigos práticos sobre impressão 3D escritos pela Zanshin 3D Studio: altura de camada, primeira camada, suportes, costura e manutenção do bico.",
            "guia.html",
        )
        + header("guia.html")
        + f"""
<main id="conteudo">
  <section class="page-hero center">
    <div class="container">
      <p class="eyebrow reveal">Conteúdo aberto</p>
      <h1 class="reveal">Guia de impressão 3D</h1>
      <p class="section-lead reveal">
        O que a gente aprendeu imprimindo peça de verdade, escrito sem enrolação.
        Se você tem um problema agora, comece pelo diagnóstico. Se quer entender o porquê,
        os artigos vão a fundo em cada tema.
      </p>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="guide-entry">
        <a href="guia-problemas.html" class="guide-entry-card reveal">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/><path d="M11 8v3.5"/><path d="M11 14.2v.1"/></svg>
          <h3>Minha impressão deu problema</h3>
          <p>Vinte sintomas, do que descola da mesa ao que quebra na mão. Ache o seu, abra, e
          siga a lista na ordem — ela vai do que mais resolve para o que menos resolve.</p>
          <span class="guide-card-go">Abrir o diagnóstico</span>
        </a>
        <a href="guia-referencia.html" class="guide-entry-card reveal">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14.5h18M9 9v11"/></svg>
          <h3>Valores de partida por material</h3>
          <p>Temperatura, ventoinha, velocidade, fluxo e secagem numa tabela só — mais as
          regulagens que não dependem do material. Para consultar com a impressora na frente.</p>
          <span class="guide-card-go">Abrir a tabela</span>
        </a>
      </div>

      <div class="guide-grid">
{cards}
      </div>

      <p class="gallery-note reveal center">
        Não quer lidar com nada disso? <a href="orcamento.html">Peça um orçamento</a> que a
        gente imprime pra você.
      </p>
    </div>
  </section>
</main>
"""
        + RODAPE
    )


if __name__ == "__main__":
    open(os.path.join(ROOT, "guia.html"), "w", encoding="utf-8").write(pagina_indice())
    print(f"guia.html ({len(ARTIGOS)} artigos)")
    for i, a in enumerate(ARTIGOS):
        p = pagina_artigo(a, ARTIGOS[i - 1] if i else None,
                          ARTIGOS[i + 1] if i + 1 < len(ARTIGOS) else None)
        nome = f'guia-{a["slug"]}.html'
        open(os.path.join(ROOT, nome), "w", encoding="utf-8").write(p)
        print(f'  {nome:<34} {len(p) // 1024} KB')
