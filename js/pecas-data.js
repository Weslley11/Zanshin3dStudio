/* ---------------------------------------------------
   Zanshin 3D Studio — dados das peças da galeria
   Uma peça pode ter mais de uma foto (ângulos diferentes).
   Usado pela página peca.html para montar a página de detalhe.
   Pra adicionar uma peça nova: copie um bloco, troque o "id"
   (precisa ser único — é o que vai na URL peca.html?id=...) e
   ajuste o resto. As imagens continuam em assets/img/gallery/.
--------------------------------------------------- */

const PECAS = [
  {
    id: "dragao-laranja",
    titulo: "Dragão articulado laranja",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/dragao-laranja.jpg", alt: "Dragão articulado impresso em 3D em laranja e amarelo, com as asas abertas e membrana translúcida" },
      { src: "assets/img/gallery/dragao-laranja-lateral.jpg", alt: "Dragão articulado laranja visto de lado, mostrando o corpo em segmentos e a cauda" },
      { src: "assets/img/gallery/dragao-laranja-mesa.jpg", alt: "Dragão articulado laranja ainda na mesa da impressora, com as asas recolhidas" },
    ],
    descricao: "Dragão articulado em laranja com as asas em amarelo: a membrana fica mais clara que as nervuras e deixa a luz passar. O corpo é feito de segmentos que dobram um a um, e as asas têm dobradiça perto do ombro. As três fotos mostram a peça de asas abertas, de lado e ainda na mesa da impressora.",
  },
  {
    id: "dragao-verde",
    titulo: "Dragão articulado verde e dourado",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/dragao-verde.jpg", alt: "Dragão articulado comprido impresso em 3D, escamas em degradê verde, azul e dourado, enrolado" },
      { src: "assets/img/gallery/dragao-verde-inteiro.jpg", alt: "O mesmo dragão verde e dourado esticado, mostrando o comprimento todo e a ponta da cauda" },
    ],
    descricao: "Dragão oriental comprido, com escamas em degradê que vai do verde ao dourado conforme a luz bate. Cada escama é modelada separada e o corpo inteiro dobra, então dá pra enrolar ou esticar. A ponta da cauda é uma peça à parte que encaixa.",
  },
  {
    id: "dragao-preto-articulado",
    titulo: "Dragão articulado preto",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/dragao-preto-articulado.jpg", alt: "Dragão articulado preto impresso em 3D, desmontado, mostrando asas, corpo em segmentos e cauda" },
    ],
    descricao: "Dragão articulado em preto fosco, com cabeça de caveira e asas de morcego. As asas têm um desenho marmorizado que aparece no acabamento, e o corpo é montado em segmentos. A foto mostra a peça desmontada, com cada parte separada.",
  },
  {
    id: "dobby",
    titulo: "Dobby",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/dobby.jpg", alt: "Dobby (Harry Potter) impresso em 3D com textura de tricô no corpo inteiro, segurando uma meia preta" },
    ],
    descricao: "Dobby com textura de tricô no corpo inteiro — cada ponto do crochê aparece em relevo, até nas orelhas. Segura a meia preta, e os olhos saem em preto e branco. Impresso em três cores.",
  },
  {
    id: "bone-mario",
    titulo: "Boné do Mario",
    categoria: "Decoração",
    imagens: [
      { src: "assets/img/gallery/bone-mario.jpg", alt: "Boné do Mario impresso em 3D em vermelho com textura de tricô e o M branco na frente" },
      { src: "assets/img/gallery/bone-mario-lateral.jpg", alt: "Boné do Mario visto de lado, mostrando a aba e a textura de tricô acompanhando a curva" },
    ],
    descricao: "Boné do Mario em tamanho de decoração, todo com textura de tricô: os pontos acompanham a curva da copa e mudam de direção na aba. O M vermelho sobre o círculo branco sai em cores separadas, sem pintura.",
  },
  {
    id: "diorama-hollow-knight",
    titulo: "Diorama Hollow Knight",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/diorama-hollow-knight.jpg", alt: "Diorama do Hollow Knight impresso em 3D: coreto preto vazado com o personagem branco sentado num banco" },
    ],
    descricao: "Diorama do Hollow Knight: um coreto de ferro vazado, com arcos e arabescos recortados, cobrindo o personagem sentado no banco. A cúpula, a estrutura e a base de pedra saem em peças separadas, e o contraste do preto com o branco é o que faz a cena.",
  },
  {
    id: "cachorro-fantasma",
    titulo: "Cachorro fantasma",
    categoria: "Decoração",
    imagens: [
      { src: "assets/img/gallery/cachorro-fantasma.jpg", alt: "Cachorro coberto por um lençol de fantasma, impresso em 3D em branco, com coleira e corrente" },
    ],
    descricao: "Cachorro coberto por um lençol de fantasma, com as dobras do pano caindo e só as orelhas e o rabo aparecendo. Vem com coleira e uma corrente comprida de elos soltos, que sai da impressora já montada.",
  },
  {
    id: "ovelha",
    titulo: "Ovelha",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/ovelha.jpg", alt: "Ovelha impressa em 3D com lã texturizada em creme, rosto preto e pernas pretas finas" },
      { src: "assets/img/gallery/ovelha-angulo.jpg", alt: "A mesma ovelha vista de outro ângulo, mostrando o volume da lã e as orelhas" },
    ],
    descricao: "Ovelha com a lã toda texturizada em creme, contrastando com o rosto, as orelhas e as pernas em preto. As pernas são finas e longas, e seguram a peça em pé sem base.",
  },
  {
    id: "cavalo",
    titulo: "Cavalo",
    categoria: "Decoração",
    imagens: [
      { src: "assets/img/gallery/cavalo.jpg", alt: "Estatueta de cavalo impressa em 3D em branco perolado, com a crina e a cauda esculpidas" },
    ],
    descricao: "Cavalo em pé, impresso em branco perolado. A crina e a cauda são esculpidas em mechas separadas, e a musculatura das pernas e do peito fica bem marcada — peça de decoração pra prateleira ou escrivaninha.",
  },
  {
    id: "gato-suporte",
    titulo: "Gato descendo",
    categoria: "Decoração",
    imagens: [
      { src: "assets/img/gallery/gato-suporte.jpg", alt: "Gato impresso em 3D em bronze escuro, em pose de descida, apoiado em degraus sobre uma base" },
    ],
    descricao: "Gato em pose de descida, com as patas apoiadas em degraus que saem de uma haste central. O acabamento bronze escuro realça a curva das costas e do rabo. A peça fica suspensa no ar, presa só pelos apoios.",
  },
  {
    id: "porta-copos-hp",
    titulo: "Porta-copos — Espresso Patronum",
    categoria: "Presentes personalizados",
    imagens: [
      { src: "assets/img/gallery/porta-copos-hp.jpg", alt: "Porta-copos impresso em 3D, preto com o brasão Espresso Patronum em prata com glitter" },
      { src: "assets/img/gallery/porta-copos-hp-texto.jpg", alt: "O segundo porta-copos do conjunto, com a frase Espresso Patronum escrita e uma varinha" },
    ],
    descricao: "Dupla de porta-copos com o trocadilho Espresso Patronum, pra quem é fã de Harry Potter. Um traz o brasão redondo com os óculos e a cicatriz, o outro a frase com a xícara e a varinha. O preto e o prata com glitter saem em cores separadas, sem pintura nem adesivo.",
  },
  {
    id: "jogo-da-velha",
    titulo: "Jogo da velha de bolso",
    categoria: "Presentes personalizados",
    imagens: [
      { src: "assets/img/gallery/jogo-da-velha.jpg", alt: "Jogo da velha impresso em 3D em laranja com as marcações em amarelo, com argola de chaveiro" },
      { src: "assets/img/gallery/jogo-da-velha-tabuleiro.jpg", alt: "O tabuleiro do jogo da velha visto de cima, com as peças X e O encaixadas nas casas" },
    ],
    descricao: "Jogo da velha que cabe no bolso: as nove peças ficam encaixadas nas casas do tabuleiro e giram pra mostrar X ou O, então nada se perde. Vai com argola, pra levar na chave ou na mochila. Impresso em duas cores.",
  },
  {
    id: "caneca-monster",
    titulo: "Caneca Monster",
    categoria: "Acessórios & Utilidades",
    imagens: [
      { src: "assets/img/gallery/caneca-monster.jpg", alt: "Caneca impressa em 3D em rosa, com as três garras vazadas na lateral e alça grande" },
    ],
    descricao: "Caneca com as três garras vazadas na lateral, impressa em rosa. A alça é grande o bastante pra mão inteira e o corpo é reto, com aros em relevo em cima e embaixo. Dá pra fazer na cor que você quiser. É peça decorativa, de prateleira ou porta-canetas: impressão 3D não serve pra contato com bebida.",
  },
  {
    id: "suporte-celular",
    titulo: "Suporte de celular dobrável",
    categoria: "Acessórios & Utilidades",
    imagens: [
      { src: "assets/img/gallery/suporte-celular.jpg", alt: "Dois suportes de celular impressos em 3D, um creme e um verde, com haste articulada e base" },
    ],
    descricao: "Suporte de celular com haste articulada: a inclinação e a altura regulam nas duas juntas, e ele dobra pra ficar plano quando não está em uso. A base larga segura o peso do celular. A foto mostra dois, em creme e verde — a cor é escolha sua.",
  },
  {
    id: "gancho-parede",
    titulo: "Gancho de parede",
    categoria: "Acessórios & Utilidades",
    imagens: [
      { src: "assets/img/gallery/gancho-parede.jpg", alt: "Dois ganchos de parede impressos em 3D em cinza, formato de U com textura canelada" },
      { src: "assets/img/gallery/gancho-parede-preto.jpg", alt: "Gancho de parede na versão preta, visto de lado, mostrando a profundidade e as canaletas" },
      { src: "assets/img/gallery/gancho-parede-impressora.jpg", alt: "Os ganchos de parede recém-impressos, ainda na mesa da impressora" },
    ],
    descricao: "Gancho de parede em formato de U, com as laterais caneladas. Funciona em toalha, bolsa, casaco ou chave. A segunda foto é da versão preta vista de lado, que mostra a profundidade do gancho. Sai em qualquer cor, e dá pra fazer quantos você precisar.",
  },
  {
    id: "suporte-bananas",
    titulo: "Suporte de bananas",
    categoria: "Acessórios & Utilidades",
    imagens: [
      { src: "assets/img/gallery/suporte-bananas.jpg", alt: "Suporte de bananas impresso em 3D em branco, com haste curva e base redonda, com um cacho pendurado" },
    ],
    descricao: "Suporte pra pendurar o cacho de bananas: a haste curva sai da base redonda e deixa a fruta no ar, que é o que atrasa o amadurecimento. A base tem canaleta pra apoiar as bananas que se soltam. Impresso em branco, mas sai em qualquer cor.",
  },
  {
    id: "gengar",
    titulo: "Gengar",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/gengar.jpg", alt: "Gengar (Pokémon) impresso em 3D em cinza metálico, com as espirais fantasmagóricas abertas em volta do corpo" },
      { src: "assets/img/gallery/gengar-angulo.jpg", alt: "Gengar impresso em 3D visto de três quartos, mostrando o volume das espirais e os espinhos das costas" },
    ],
    descricao: "Gengar com as espirais fantasmagóricas abertas em volta do corpo, cada uma terminando em ponta curva. Acabamento cinza metálico, com o sorriso e os dentes bem marcados. As duas fotos mostram a peça de frente e de três quartos.",
  },
  {
    id: "darth-vader",
    titulo: "Darth Vader",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/darth-vader.jpg", alt: "Darth Vader (Star Wars) impresso em 3D em preto metálico, versão cabeçuda com capa" },
    ],
    descricao: "Darth Vader em versão cabeçuda, impresso em preto metálico. O capacete traz o recorte da máscara e a grelha do respirador em relevo, e a capa cai solta dos dois lados do corpo.",
  },
  {
    id: "deadpool",
    titulo: "Deadpool",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/deadpool.jpg", alt: "Deadpool (Marvel) impresso em 3D em vermelho, versão cabeçuda com as mãos na cintura" },
    ],
    descricao: "Deadpool em versão cabeçuda, de mãos na cintura. Impresso em vermelho, com os detalhes da máscara em preto e branco e o cinto com as bolsas em relevo.",
  },
  {
    id: "homem-de-ferro",
    titulo: "Homem de Ferro",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/homem-de-ferro.jpg", alt: "Homem de Ferro (Marvel) impresso em 3D em vermelho, versão cabeçuda com a mão erguida" },
    ],
    descricao: "Homem de Ferro em versão cabeçuda, com a mão erguida. Impresso em vermelho, com as placas da armadura, o reator do peito e a palma da mão em relevo.",
  },
  {
    id: "homem-aranha-streetwear",
    titulo: "Homem-Aranha streetwear",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/homem-aranha-streetwear.jpg", alt: "Homem-Aranha impresso em 3D de jaqueta puffer, moletom com capuz, calça cargo e tênis branco" },
    ],
    descricao: "Homem-Aranha em roupa de rua: jaqueta puffer por cima do moletom com capuz, calça cargo e tênis branco. A máscara vermelha, a roupa escura e os tênis saem em cores separadas, e o acolchoado da jaqueta fica bem marcado.",
  },
  {
    id: "esqueletos-dragao",
    titulo: "Esqueletos de dragão articulados",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/esqueletos-dragao-dourado.jpg", alt: "Esqueleto de dragão articulado impresso em 3D em dourado, de pé com as asas abertas" },
      { src: "assets/img/gallery/esqueletos-dragao.jpg", alt: "Dois esqueletos de dragão articulados impressos em 3D, um dourado maior e um creme menor, lado a lado" },
    ],
    descricao: "Dois esqueletos de dragão lado a lado, um dourado maior e um creme menor. As costelas e as vértebras são vazadas uma a uma, e dá pra ver as juntas articuladas nos ombros, no quadril e na cauda. A mesma peça em dois tamanhos e duas cores.",
  },
  {
    id: "suporte-headset-pistao",
    titulo: "Suporte de headset — pistão",
    categoria: "Acessórios para games",
    imagens: [
      { src: "assets/img/gallery/suporte-headset-pistao.jpg", alt: "Suporte de headset em formato de pistão com biela, impresso em 3D em preto fosco" },
      { src: "assets/img/gallery/suporte-headset-pistao-uso.jpg", alt: "O suporte de headset em uso, com um headset apoiado e o cabo passando pelo furo da base" },
    ],
    descricao: "Suporte de headset em formato de pistão com biela: a base é o pistão com os anéis, e a haste sobe até o apoio em U. Impresso em preto fosco. A segunda foto mostra com o headset apoiado e o cabo passando pelo furo da base.",
  },
  {
    id: "bailarina-classica",
    titulo: "Bailarina clássica",
    categoria: "Decoração",
    imagens: [
      { src: "assets/img/gallery/bailarina-classica.jpg", alt: "Bailarina em ponta sobre base redonda, impressa em 3D em roxo com glitter, braços erguidos" },
      { src: "assets/img/gallery/bailarina-classica-grafite.jpg", alt: "Bailarina em ponta sobre base redonda, impressa em 3D em grafite metálico, em outra pose" },
    ],
    descricao: "Bailarina em ponta sobre base redonda, com o tutu em pregas. As duas fotos são peças diferentes da mesma linha, cada uma numa pose: uma em roxo com glitter e outra em grafite metálico.",
  },
  {
    id: "bailarina-geometrica",
    titulo: "Bailarina geométrica",
    categoria: "Decoração",
    imagens: [
      { src: "assets/img/gallery/bailarina-geometrica.jpg", alt: "Bailarina em versão geométrica impressa em 3D, corpo e tutu formados por facetas planas, em cinza claro" },
    ],
    descricao: "Versão geométrica da bailarina: o corpo e o tutu são formados por facetas planas em vez de curvas, e cada face pega a luz de um jeito. Impressa em cinza claro, com um braço estendido e o outro erguido.",
  },
  {
    id: "gatos-tres",
    titulo: "Trio de gatinhos — não vejo, não ouço, não falo",
    categoria: "Presentes personalizados",
    imagens: [
      { src: "assets/img/gallery/gatos-tres.jpg", alt: "Três gatinhos impressos em 3D em preto, branco e cinza, um cobrindo a boca, outro os olhos e o terceiro as orelhas" },
    ],
    descricao: "Os três gatinhos do ditado: um cobre a boca, outro os olhos e o terceiro as orelhas. Impressos em preto, branco e cinza — mas a cor de cada um é escolha sua. Funcionam juntos como trio ou separados.",
  },
  {
    id: "gatinho-texturizado",
    titulo: "Gatinho texturizado",
    categoria: "Presentes personalizados",
    imagens: [
      { src: "assets/img/gallery/gatinho-texturizado.jpg", alt: "Gatinho sentado impresso em 3D em creme, com textura de tricô no corpo inteiro e cauda volumosa" },
    ],
    descricao: "Gatinho sentado com textura de tricô no corpo inteiro e cauda bem volumosa. Impresso em creme. A foto é de trás, que é de onde dá pra ver melhor a textura e o volume da cauda.",
  },
  {
    id: "chaveiro-minecraft",
    titulo: "Chaveiro de esqueleto — Minecraft",
    categoria: "Presentes personalizados",
    imagens: [
      { src: "assets/img/gallery/chaveiro-minecraft.jpg", alt: "Chaveiro do esqueleto do Minecraft impresso em 3D em marrom texturizado, com argola e correntinha" },
    ],
    descricao: "Chaveiro do esqueleto do Minecraft, com os braços e as pernas articulados e cada bloco do corpo bem marcado. Vai com argola e correntinha, pronto pra usar na chave ou na mochila.",
  },
  {
    id: "encapuzado",
    titulo: "Figura encapuzada",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/encapuzado.jpg", alt: "Figura encapuzada de sobretudo longo impressa em 3D, acabamento prata metálico, vista de frente" },
      { src: "assets/img/gallery/encapuzado-angulo.jpg", alt: "Figura encapuzada impressa em 3D vista de lado, mostrando o caimento do sobretudo e os coldres nas coxas" },
    ],
    descricao: "Figura encapuzada de sobretudo longo, impressa em prata metálico. O capuz cobre o rosto e deixa só a máscara à mostra; dá pra ver a armadura do peito, os coldres presos nas coxas e as fivelas das botas. As duas fotos mostram a peça de frente e de lado.",
  },
  {
    id: "gato-samurai",
    titulo: "Gato samurai",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/gato-samurai.jpg", alt: "Gato samurai impresso em 3D, de quimono e segurando uma katana, acabamento cinza escuro" },
    ],
    descricao: "Gatinho de quimono segurando uma katana, de olhos fechados e cara de calmo. Impresso em cinza escuro acetinado, com as dobras do tecido e a faixa da cintura bem marcadas. A cauda sai curvada pra fora, acompanhando a base.",
  },
  {
    id: "leao",
    titulo: "Leão",
    categoria: "Decoração",
    imagens: [
      { src: "assets/img/gallery/leao.jpg", alt: "Estatueta de leão impressa em 3D, cinza metálico, com textura áspera imitando pelo e juba em mechas" },
    ],
    descricao: "Leão em passo, impresso em cinza metálico. A superfície inteira tem uma textura áspera que imita pelo, e a juba é formada por mechas separadas bem definidas — o contraste entre as duas texturas é o que dá vida à peça.",
  },
  {
    id: "pensador-abstrato",
    titulo: "Escultura abstrata — pensador",
    categoria: "Decoração",
    imagens: [
      { src: "assets/img/gallery/pensador-abstrato.jpg", alt: "Escultura abstrata de figura sentada pensando, impressa em 3D em cinza grafite, vista de frente" },
      { src: "assets/img/gallery/pensador-abstrato-perfil.jpg", alt: "Escultura abstrata do pensador vista de perfil, mostrando o apoio do queixo na mão e as pernas alongadas" },
    ],
    descricao: "Escultura abstrata de uma figura sentada com o queixo apoiado na mão, braços e pernas alongados. Impressa em cinza grafite com textura áspera, que dá um aspecto de pedra em vez de plástico. Tem foto de frente e de perfil.",
  },
  {
    id: "sagrada-familia",
    titulo: "Sagrada Família",
    categoria: "Decoração",
    imagens: [
      { src: "assets/img/gallery/sagrada-familia.jpg", alt: "Escultura abstrata da Sagrada Família impressa em 3D, acabamento dourado, com as figuras formando um arco" },
      { src: "assets/img/gallery/sagrada-familia-bronze.jpg", alt: "A mesma Sagrada Família em acabamento bronze, mostrando o caimento do manto e o menino no colo" },
    ],
    descricao: "Sagrada Família em versão abstrata: duas formas curvas que se abraçam em volta do menino, sem nenhum traço de rosto. As linhas da impressão acompanham a curva e fazem a luz correr pela peça. As duas fotos mostram acabamentos diferentes, dourado e bronze.",
  },
  {
    id: "boneco-articulado-roxo",
    titulo: "Boneco articulado roxo",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/boneco-articulado-roxo.jpg", alt: "Boneco articulado impresso em 3D em filamento roxo com brilho, de braços abertos" },
      { src: "assets/img/gallery/boneco-articulado-roxo-pose.jpg", alt: "O mesmo boneco articulado roxo em outra pose, mostrando as juntas dos braços e das pernas" },
    ],
    descricao: "Boneco articulado em filamento roxo com partículas brilhantes. As juntas dos braços, pernas, quadril e pescoço se mexem, então ele para em pé em qualquer pose — as duas fotos são a mesma peça, só reposicionada.",
  },
  {
    id: "dragao-articulado",
    titulo: "Dragão articulado",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/dragao-articulado.jpg", alt: "Dragão articulado impresso em 3D, enrolado, com escamas em degradê azul, verde e dourado" },
      { src: "assets/img/gallery/dragao-articulado-cabeca.jpg", alt: "Close da cabeça e do corpo do dragão articulado, mostrando as escamas e o degradê de cor" },
    ],
    descricao: "Dragão articulado: sai da impressora já montado e com todas as juntas móveis, dobrando ao longo do corpo inteiro. O filamento com degradê faz a cor mudar do azul ao dourado ao longo das escamas, sem nenhuma pintura.",
  },
  {
    id: "banguela-articulado",
    titulo: "Banguela articulado",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/banguela-articulado.jpg", alt: "Banguela articulado impresso em 3D na cor preta, com os olhos verdes pintados" },
      { src: "assets/img/gallery/banguela-articulado-pecas.jpg", alt: "Banguela articulado desmontado, mostrando as asas, a cauda em segmentos e o corpo separados" },
    ],
    descricao: "Versão articulada do Banguela, em preto fosco com os olhos verdes pintados. O corpo é montado em segmentos e as asas têm dobradiça, então ele mexe e muda de pose. A segunda foto mostra todas as partes separadas.",
  },
  {
    id: "jesus",
    titulo: "Jesus",
    categoria: "Decoração",
    imagens: [
      { src: "assets/img/gallery/jesus.jpg", alt: "Miniatura do Jesus impressa em 3D, sentada, com túnica branca, faixa vermelha e sandálias" },
    ],
    descricao: "Miniatura do Jesus sentado, impressa em várias cores: túnica branca, faixa vermelha, cabelo e sandálias em marrom. Pequena o bastante pra deixar na prateleira, no painel do carro ou na mesa de trabalho.",
  },
  {
    id: "ninja",
    titulo: "Ninja",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/ninja.jpg", alt: "Figura de ninja agachado em posição de combate, impressa em 3D em preto, com katana nas costas" },
      { src: "assets/img/gallery/ninja-lateral.jpg", alt: "Ninja impresso em 3D visto de lado, mostrando a katana e a pose agachada" },
      { src: "assets/img/gallery/ninja-costas.jpg", alt: "Ninja impresso em 3D visto por trás, mostrando o capuz e a bainha da katana" },
    ],
    descricao: "Ninja agachado em posição de combate, com katana nas costas. Impresso em preto, o acabamento acetinado realça as dobras do tecido, o cinto e as amarrações das botas. As três fotos mostram a peça por ângulos diferentes.",
  },
  {
    id: "banguela-furia-luz",
    titulo: "Banguela & Fúria da Luz",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/banguela-furia-luz.jpg", alt: "Banguela (preto) e Fúria da Luz (branca) lado a lado sobre base de pedra cinza, impressos em 3D" },
      { src: "assets/img/gallery/banguela-furia-luz-detalhe.jpg", alt: "Close de Banguela e Fúria da Luz juntos, mostrando os olhos pintados em verde e azul" },
      { src: "assets/img/gallery/banguela-furia-luz-banguela.jpg", alt: "Banguela impresso em 3D na cor preta, de perfil, com as asas recolhidas" },
      { src: "assets/img/gallery/banguela-furia-luz-furia.jpg", alt: "Fúria da Luz impressa em 3D na cor branca, com os olhos azuis pintados" },
    ],
    descricao: "O casal de dragões de Como Treinar o Seu Dragão — Banguela em preto e a Fúria da Luz em branco — sobre uma base de pedra em cinza. Os olhos são pintados à mão: verde nele, azul nela. Impresso em três cores, com as peças montadas sobre a base.",
  },
  {
    id: "trofeu-copa",
    titulo: "Troféu Copa do Mundo",
    categoria: "Decoração & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/trofeu-copa.jpg", alt: "Réplica da taça da Copa do Mundo impressa em 3D, dourada com base verde" },
    ],
    descricao: "Réplica da taça da Copa do Mundo, acabamento dourado com base verde e branca. Peça de destaque pra quem é apaixonado por futebol — funciona bem como decoração ou presente.",
  },
  {
    id: "kratos",
    titulo: "Kratos",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/kratos-figura.jpg", alt: "Figura do Kratos (God of War) impressa em 3D, pintada em tons terrosos com detalhes em vermelho" },
      { src: "assets/img/gallery/kratos-rosto.jpg", alt: "Close do rosto do Kratos impresso em 3D, mostrando a barba, a sobrancelha e a marca vermelha pintadas à mão" },
      { src: "assets/img/gallery/kratos-torso.jpg", alt: "Torso do Kratos impresso em 3D, mostrando a faixa vermelha, o cinto e a ombreira acolchoada" },
      { src: "assets/img/gallery/kratos-busto-natural.jpg", alt: "Busto do Kratos (God of War) impresso em 3D, close-up do rosto e armadura" },
    ],
    descricao: "Figura do Kratos (God of War), pintada em tons terrosos com detalhes em vermelho. Os closes mostram o nível de detalhe do rosto, da barba, da faixa vermelha e das fivelas do cinto — tudo pintado à mão aqui no studio.",
  },
  {
    id: "pomo-de-ouro",
    titulo: "Pomo de Ouro — Harry Potter",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/pomo-de-ouro.jpg", alt: "Pomo de Ouro (Harry Potter) impresso em 3D, dourado, montado em base preta" },
    ],
    descricao: "Pomo de Ouro dourado com asas em camadas, montado em base preta curva — peça pra quem é fã de Harry Potter.",
  },
  {
    id: "chicago-bulls",
    titulo: "Chicago Bulls (NBA)",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/chicago-bulls-frente.jpg", alt: "Mascote do Chicago Bulls (NBA) de frente, moletom vermelho Jumpman, calça preta e tênis branco" },
      { src: "assets/img/gallery/touro-hoodie.jpg", alt: "Mascote do Chicago Bulls (NBA) com moletom vermelho e tênis, impresso em 3D e pintado" },
      { src: "assets/img/gallery/touro-hoodie-detalhe.jpg", alt: "Close-up do mascote do Chicago Bulls (NBA), chifres e argola no nariz em detalhe, moletom Jumpman vermelho" },
    ],
    descricao: "Mascote do Chicago Bulls (NBA) com moletom vermelho estilo Jordan, calça preta e tênis branco. Os chifres brancos, a argola amarela no nariz e o logo Jumpman saem em cores separadas. A última foto é um close do moletom e da argola.",
  },
  {
    id: "goku-shenron",
    titulo: "Goku & Shenron",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/goku-shenron.jpg", alt: "Goku Super Saiyajin (Dragon Ball Z) com o dragão Shenron, diorama impresso em 3D e pintado" },
      { src: "assets/img/gallery/goku-sozinho.jpg", alt: "Goku Super Saiyajin sozinho sobre a base de pedra, ainda na mesa da impressora" },
    ],
    descricao: "Goku Super Saiyajin com o dragão Shenron, diorama pintado à mão em várias cores — peça de destaque pra qualquer estante. A segunda foto mostra o Goku sozinho sobre a base, ainda na mesa da impressora, com o gi rasgado e os punhos em detalhe.",
  },
  {
    id: "batman",
    titulo: "Batman",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/batman.jpg", alt: "Figura do Batman (DC) impressa em 3D e pintada, capa preta e cinto amarelo" },
    ],
    descricao: "Batman clássico, capa e cinto amarelo, acabamento cinza e preto pintado à mão.",
  },
  {
    id: "machado-resident-evil",
    titulo: "Machado — Resident Evil Requiem",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/machado-tatico.jpg", alt: "Réplica do machado do jogo Resident Evil Requiem, impressa em 3D, acabamento preto fosco" },
      { src: "assets/img/gallery/revolver-machado-duo.jpg", alt: "Réplica do machado ao lado da réplica do revólver de Resident Evil Requiem, impressas em 3D" },
    ],
    descricao: "Réplica do machado tático do jogo Resident Evil Requiem, acabamento preto fosco com detalhes de parafusos e recortes fiéis ao design original. A segunda foto mostra o machado ao lado do revólver do mesmo jogo.",
  },
  {
    id: "suporte-ps5-oni",
    titulo: "Suporte de controle PS5 — máscara oni",
    categoria: "Acessórios para games",
    imagens: [
      { src: "assets/img/gallery/suporte-controle-ps5.jpg", alt: "Suporte para controle de PS5 em formato de máscara oni, impresso em 3D" },
    ],
    descricao: "Suporte pra controle de PS5 em formato de máscara oni, com chifres — função e estilo juntos na sua mesa.",
  },
  {
    id: "suporte-ps5-banguela",
    titulo: "Suporte de controle PS5 — Banguela",
    categoria: "Acessórios para games",
    imagens: [
      { src: "assets/img/gallery/toothless-ps5.jpg", alt: "Suporte para controle de PS5 em formato do Banguela (Como Treinar o Seu Dragão), impresso em 3D" },
    ],
    descricao: "Suporte pra controle de PS5 em formato do Banguela (Como Treinar o Seu Dragão), acabamento metálico escuro.",
  },
  {
    id: "banguela",
    titulo: "Banguela",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/toothless-vaso.jpg", alt: "Estatueta do Banguela (Como Treinar o Seu Dragão) impressa em 3D, formato de suporte/vaso" },
    ],
    descricao: "Estatueta do Banguela, acabamento metálico escuro, em formato de suporte decorativo.",
  },
  {
    id: "revolver-resident-evil",
    titulo: "Revólver — Resident Evil Requiem",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/revolver-detalhe.jpg", alt: "Réplica do revólver do jogo Resident Evil Requiem, impressa em 3D, acabamento cinza claro perolado" },
      { src: "assets/img/gallery/revolver-perfil.jpg", alt: "Réplica do revólver do jogo Resident Evil Requiem, impressa em 3D, vista de perfil com cabo preto detalhado" },
      { src: "assets/img/gallery/revolver-machado-duo.jpg", alt: "Réplica do revólver ao lado da réplica do machado de Resident Evil Requiem, impressas em 3D" },
    ],
    descricao: "Réplica do revólver do jogo Resident Evil Requiem, acabamento cinza perolado com cabo preto detalhado. Tem foto de frente, de perfil e ao lado do machado do mesmo jogo.",
  },
  {
    id: "torre-pisa",
    titulo: "Torre de Pisa",
    categoria: "Decoração",
    imagens: [
      { src: "assets/img/gallery/torre-pisa.jpg", alt: "Miniatura da Torre de Pisa impressa em 3D, acabamento bronze" },
    ],
    descricao: "Miniatura da Torre de Pisa, acabamento bronze, com os detalhes das colunas e arcos bem marcados.",
  },
  {
    id: "mascotes-spfc-flamengo",
    titulo: "Mascotes SPFC & Flamengo",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/mascotes-spfc-flamengo.jpg", alt: "Mascotes musculosos do São Paulo FC e do Flamengo, impressos em 3D e pintados" },
      { src: "assets/img/gallery/mascote-spfc.jpg", alt: "Mascote do São Paulo FC sozinho sobre a base com o escudo, dedo em riste e auréola amarela" },
      { src: "assets/img/gallery/mascote-flamengo.jpg", alt: "Mascote do Flamengo sozinho, segurado na mão, mostrando a cabeça de urubu e a camisa rubro-negra" },
    ],
    descricao: "Mascotes musculosos do São Paulo FC e do Flamengo lado a lado, nas cores dos dois times. As outras duas fotos mostram cada um separado: o do São Paulo sobre a base com o escudo, e o do Flamengo na mão, que dá pra sentir o tamanho da peça.",
  },
  {
    id: "bailarina",
    titulo: "Bailarina translúcida",
    categoria: "Decoração",
    imagens: [
      { src: "assets/img/gallery/bailarina.jpg", alt: "Estatueta de bailarina impressa em filamento translúcido" },
    ],
    descricao: "Estatueta de bailarina impressa em filamento translúcido, com efeito de vidro fosco quando a luz passa por trás.",
  },
  {
    id: "capivara-bailarina",
    titulo: "Capivara bailarina — dourada",
    categoria: "Decoração",
    imagens: [
      { src: "assets/img/gallery/capivara-bailarina.jpg", alt: "Estatueta de capivara bailarina impressa em 3D, acabamento dourado" },
      { src: "assets/img/gallery/capivara-bailarina-pecas.jpg", alt: "Capivara bailarina dourada desmontada, mostrando a peça e o pião que a faz girar" },
    ],
    descricao: "Capivara bailarina em acabamento dourado espelhado — um jeito bem-humorado de decorar. A segunda foto mostra a peça desmontada: ela encaixa sobre um pião, então a bailarina roda de verdade.",
  },
  {
    id: "chaveiro-gabi",
    titulo: "Chaveiro personalizado — GABI",
    categoria: "Presentes personalizados",
    imagens: [
      { src: "assets/img/gallery/chaveiro-personalizado-gabi.jpg", alt: "Chaveiro personalizado com o nome GABI, letras brancas sobre base dourada, impresso em 3D" },
    ],
    descricao: "Chaveiro com nome personalizado — troque \"GABI\" pelo nome que você quiser (ou de presente). Rápido de fazer e sempre um sucesso.",
  },
  {
    id: "esqueleto-trex",
    titulo: "Esqueleto de T-Rex",
    categoria: "Decoração",
    imagens: [
      { src: "assets/img/gallery/esqueleto-trex.jpg", alt: "Réplica articulada de esqueleto de T-Rex impressa em 3D, sobre base com hastes de sustentação" },
    ],
    descricao: "Réplica de esqueleto de T-Rex, montada sobre base com hastes de sustentação — peça de destaque pra quem curte paleontologia.",
  },
  {
    id: "batman-armadura",
    titulo: "Batman — armadura",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/batman-armadura.jpg", alt: "Batman em armadura tática impresso em 3D, acabamento metálico grafite, de frente com a capa aberta" },
      { src: "assets/img/gallery/batman-armadura-angulo.jpg", alt: "Batman em armadura tática visto de três quartos, mostrando o volume das ombreiras e o caimento da capa" },
    ],
    descricao: "Versão armadura tática do Batman, acabamento metálico grafite — visual mais pesado e agressivo que o clássico. A segunda foto é de três quartos e mostra melhor o volume das ombreiras e o caimento da capa.",
  },
  {
    id: "mascote-espartano",
    titulo: "Mascote espartano",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/mascote-espartano.jpg", alt: "Mascote guerreiro espartano impresso em 3D, acabamento dourado, com escudo e capacete emplumado" },
      { src: "assets/img/gallery/mascote-espartano-frente.jpg", alt: "Mascote espartano visto de frente, com o escudo erguido e a crista do capacete inteira à mostra" },
    ],
    descricao: "Mascote guerreiro espartano, acabamento dourado, com escudo e capacete emplumado. A segunda foto é de frente e mostra o escudo erguido e a crista do capacete inteira.",
  },
  {
    id: "coelho-laco",
    titulo: "Coelho com laço",
    categoria: "Presentes personalizados",
    imagens: [
      { src: "assets/img/gallery/coelho-laco.jpg", alt: "Coelhinho com laço impresso em 3D, textura canelada, acabamento dourado" },
    ],
    descricao: "Coelhinho fofo com laço, textura canelada, acabamento dourado — presente delicado pra qualquer ocasião.",
  },
  {
    id: "pad-texturizado",
    titulo: "Tapete texturizado",
    categoria: "Acessórios & Utilidades",
    imagens: [
      { src: "assets/img/gallery/pad-texturizado.jpg", alt: "Tapete oval texturizado impresso em 3D, roxo, com três padrões de textura diferentes" },
    ],
    descricao: "Tapete oval com três padrões de textura diferentes, em roxo.",
  },
];
