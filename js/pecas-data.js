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
      { src: "assets/img/gallery/kratos-busto-natural.jpg", alt: "Busto do Kratos (God of War) impresso em 3D, close-up do rosto e armadura" },
    ],
    descricao: "Figura do Kratos (God of War), pintada em tons terrosos com detalhes em vermelho. A segunda foto é um close no busto, mostrando o nível de detalhe do rosto, da barba e da armadura.",
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
      { src: "assets/img/gallery/touro-hoodie.jpg", alt: "Mascote do Chicago Bulls (NBA) com moletom vermelho e tênis, impresso em 3D e pintado" },
      { src: "assets/img/gallery/touro-hoodie-detalhe.jpg", alt: "Close-up do mascote do Chicago Bulls (NBA), chifres e argola no nariz em detalhe, moletom Jumpman vermelho" },
    ],
    descricao: "Mascote do Chicago Bulls (NBA) com moletom vermelho estilo Jordan e tênis branco. A segunda foto é um close mostrando o detalhe do moletom e da argola no nariz.",
  },
  {
    id: "goku-shenron",
    titulo: "Goku & Shenron",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/goku-shenron.jpg", alt: "Goku Super Saiyajin (Dragon Ball Z) com o dragão Shenron, diorama impresso em 3D e pintado" },
    ],
    descricao: "Goku Super Saiyajin com o dragão Shenron, diorama pintado à mão em várias cores — peça de destaque pra qualquer estante.",
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
    ],
    descricao: "Réplica do machado tático do jogo Resident Evil Requiem, acabamento preto fosco com detalhes de parafusos e recortes fiéis ao design original.",
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
    ],
    descricao: "Réplica do revólver do jogo Resident Evil Requiem, acabamento cinza perolado com cabo preto detalhado. Duas fotos: uma de frente, outra de perfil.",
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
    ],
    descricao: "Mascotes musculosos do São Paulo FC e do Flamengo lado a lado, pintados nas cores dos dois times.",
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
    ],
    descricao: "Estatueta de capivara bailarina, acabamento dourado espelhado — um jeito bem-humorado de decorar.",
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
      { src: "assets/img/gallery/batman-armadura.jpg", alt: "Batman em armadura tática impresso em 3D, acabamento metálico grafite" },
    ],
    descricao: "Versão armadura tática do Batman, acabamento metálico grafite — visual mais pesado e agressivo que o clássico.",
  },
  {
    id: "mascote-espartano",
    titulo: "Mascote espartano",
    categoria: "Personagens & Colecionáveis",
    imagens: [
      { src: "assets/img/gallery/mascote-espartano.jpg", alt: "Mascote guerreiro espartano impresso em 3D, acabamento dourado, com escudo e capacete emplumado" },
    ],
    descricao: "Mascote guerreiro espartano, acabamento dourado, com escudo e capacete emplumado.",
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
