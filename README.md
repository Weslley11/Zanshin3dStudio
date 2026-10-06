# Zanshin 3D Studio

Site institucional da **Zanshin 3D Studio** — impressão 3D sob encomenda em
Jaraguá do Sul, SC. HTML/CSS/JS puro, sem build, sem dependências.

Site multi-página: `index.html` (home) mais uma página por seção —
`sobre.html`, `servicos.html`, `materiais.html` (guia + quiz), `orcamento.html`
(calculadora com envio para WhatsApp), `galeria.html`, `faq.html`,
`contato.html` — e `pedidos.html` (painel de acompanhamento). O header, o
menu e o rodapé se repetem em cada arquivo (é tudo estático, sem
templating), então uma mudança neles precisa ser replicada manualmente em
todas as páginas.

## Como visualizar localmente

Não precisa instalar nada. Duas opções:

1. Abra `index.html` diretamente no navegador; ou
2. Suba um servidor local (evita alguns bloqueios de navegador):
   ```bash
   python3 -m http.server 8080
   ```
   e acesse `http://localhost:8080`.

## Antes de publicar: dados a atualizar

Todo o contato do site é centralizado em **`js/script.js`**, no objeto
`CONFIG` (topo do arquivo):

```js
const CONFIG = {
  whatsappNumber: "5547991677070", // 55 + DDD + número, só dígitos
  instagramUser: "zanshin_3dstudio", // usuário do Instagram, sem @
  pricing: { ... } // valores da calculadora de orçamento
};
```

- **`whatsappNumber`** e **`instagramUser`** alimentam automaticamente todos
  os botões/links de WhatsApp e Instagram da página (menu, seção de
  contato, botão flutuante e o botão gerado pela calculadora) — já
  preenchidos com os dados reais.
- **`pricing`** calcula o orçamento a partir do custo real (filamento +
  energia) vezes uma margem:
  - `filamentCostPerKg`, `energyTariff` e `printerPowerWatts` vieram dos
    valores que você passou (R$100/kg, R$1,80/kWh, 180W da P2S).
  - `marginMultiplier` está em **3.5**: o custo direto de cada peça
    (filamento + energia) vezes 3,5. Foi o valor que você definiu.
  - `setupFee` e `finishFee` continuam sendo valores de exemplo meus
    (taxa fixa por pedido e acréscimo por acabamento) — ajuste à vontade.
  - a fórmula completa está em `estimatePrice()` no `js/script.js`.

## Galeria: como adicionar uma peça

Toda peça mora num lugar só: `js/pecas-data.js`. A galeria, a faixa em
movimento da home, as landing pages e as páginas de peça são todas derivadas
dele — **não edite `galeria.html` nem as landing pages à mão**, porque a
próxima regeneração desfaz.

1. Coloque a foto em `assets/img/gallery/nome-da-peca.jpg` (quadrada, de
   preferência 1200×1200, peça inteira no quadro).
2. Em `js/pecas-data.js`, copie um bloco de peça, troque o `id` (é o que vai
   na URL `peca.html?id=...`, precisa ser único) e aponte a foto como
   **`.webp`**, não `.jpg`:
   ```js
   { src: "assets/img/gallery/nome-da-peca.webp", alt: "Descrição para leitores de tela" },
   ```
3. Rode:
   ```bash
   python3 tools/build.py
   ```
   Ele converte a foto, apaga o `.jpg`, e regenera galeria, faixa, landing
   pages, guia e sitemap.

Para a peça aparecer numa landing page ou na faixa da home, acrescente o `id`
na lista correspondente em `tools/gera_landing.py` ou `tools/gera_faixa.py`
antes de rodar o build.

### Por que cada foto tem dois arquivos

`nome.webp` (1200 px) e `nome-600.webp` (600 px). Os cards da galeria são
exibidos com no máximo ~500 px físicos, mesmo em celular de tela densa, então
usam a versão de 600 — isso cortou cerca de 80% do peso de cada página. A de
1200 só é baixada onde a foto aparece grande: o destaque da home e a foto
principal da página de peça, e mesmo ali o navegador escolhe a menor quando a
tela não precisa da maior.

As partes da home escritas à mão (destaque, cards de público e os 6 cards da
seção de galeria) não são geradas: se trocar uma peça ali, edite `index.html`
e use o nome `-600.webp` nos cards.

## Guia: como adicionar um artigo

Os artigos ficam na lista `ARTIGOS` de `tools/gera_guia.py`, e o diagnóstico
por sintoma e a tabela de referência em `tools/gera_guia_extra.py`. Edite lá
e rode `python3 tools/build.py`.

## Imagem de capa para compartilhamento (opcional)

Ao compartilhar o link do site no WhatsApp/Instagram/Facebook, essas
plataformas exigem uma imagem PNG/JPG de capa (não aceitam SVG). Se quiser
essa pré-visualização, crie uma imagem de 1200×630px, salve como
`assets/img/og-cover.png` e descomente a tag `og:image` no `<head>` do
`index.html`.

## Publicar o site (grátis)

Qualquer serviço de hospedagem estática funciona, por exemplo:

- **GitHub Pages**: nas configurações do repositório, em *Settings → Pages*,
  selecione a branch e a pasta raiz (`/`).
- **Netlify** ou **Vercel**: conecte o repositório e faça o deploy — não é
  necessário configurar comando de build (site estático).

## Marca

A paleta do site (vermelho `#d01010` e prata `#c7cdd3`, variáveis `--accent`
e `--accent-2` no topo do `css/style.css`) foi extraída da logo oficial.
Os arquivos da logo estão em `assets/img/brand/`:

- `icon.png` — símbolo isolado (favicon e ilustração da seção Sobre)
- `logo-horizontal-dark-bg.png` — versão com texto branco, para fundos
  escuros (usada no cabeçalho e rodapé do site)
- `logo-horizontal-light-bg.png` — versão com texto preto, para fundos
  claros (não usada no site em si, mas disponível para outras aplicações
  da marca, como papelaria ou documentos)
- `apple-touch-icon.png` — ícone para adicionar o site à tela de início do iPhone

## Assistentes personalizados (Claude Code)

Este repositório tem 4 subagentes configurados em `.claude/agents/`, prontos
pra usar sempre que você abrir o Claude Code aqui (em qualquer máquina —
basta clonar o repo):

| Agente | Pra que serve |
|---|---|
| `qa-tester` | Testa o site de verdade (roda local, clica nos fluxos) e reporta bugs — não corrige, só encontra. |
| `devops` | Publica o site: branch → PR → merge → GitHub Pages. Sabe o processo desse projeto e é explícito sobre o que precisa de um clique seu. |
| `ux-designer` | Revisão visual/UX — contraste, espaçamento, mobile. Ajusta coisas pequenas direto, avisa antes de mudar estrutura. |
| `business-assistant` | Escreve conteúdo pra WhatsApp, Instagram e descrições de peça, no tom da Zanshin e com base nos dados reais do site (nunca inventa preço). |

Chame um pelo nome ("usa o agente qa-tester pra conferir essa mudança") ou
deixe o Claude Code puxar automaticamente quando a tarefa combinar com a
descrição do agente. Esses agentes valem só pra este repositório — se você
quiser os mesmos papéis disponíveis em outros projetos seus, copie as pastas
`.claude/agents/*.md` pra `~/.claude/agents/` na sua máquina (config global).

## Painel de pedidos

`pedidos.html` mostra os pedidos em andamento agrupados por status (Orçamento
→ Fila → Imprimindo → Acabamento → Pronto → Entregue), lendo de uma planilha
do Google Sheets — sem servidor, sem banco de dados, sem login pra você
manter.

**Por que duas abas.** O site é público (qualquer um com o link vê a
página). Pra nunca expor nome/telefone/valor de cliente, a planilha usa uma
aba privada (onde você realmente trabalha) e uma aba pública derivada por
fórmula (a única que vira link público). Assim é impossível colar um
telefone sem querer no lugar errado — a aba pública só tem as colunas que
ela busca.

**Passo a passo (uma vez só):**

1. Crie uma planilha nova no [Google Sheets](https://sheets.google.com).
2. Renomeie a primeira aba pra **`Pedidos`** e crie as colunas (linha 1):
   `codigo | cliente | telefone | peca | material | status | previsao | valor | obs`
   — essa aba é só sua, nunca é publicada.
3. Crie uma segunda aba chamada **`Painel`** com estas colunas na linha 1:
   `codigo | peca | material | status | previsao`
   Na linha 2, cole estas fórmulas (uma por coluna) e arraste pra baixo até
   cobrir o número de pedidos que você costuma ter ao mesmo tempo:
   ```
   A2: =Pedidos!A2      (código)
   B2: =Pedidos!D2      (peça)
   C2: =Pedidos!E2      (material)
   D2: =Pedidos!F2      (status)
   E2: =Pedidos!G2      (previsão)
   ```
4. Na coluna **status** (aba `Pedidos`), use sempre um destes textos exatos:
   `Orçamento`, `Fila`, `Imprimindo`, `Acabamento`, `Pronto`, `Entregue`.
5. Publique **só a aba `Painel`**: *Arquivo → Compartilhar → Publicar na
   web* → em "Célula/intervalo" selecione a aba **`Painel`** (não a
   planilha inteira) → formato **CSV** ou **TSV** (os dois funcionam, o
   painel detecta sozinho) → *Publicar*. Copie o link gerado.
6. Cole esse link em `PEDIDOS_CONFIG.sheetCsvUrl`, no topo de
   `js/pedidos.js`.

Pronto — a página busca esse CSV toda vez que alguém abre `pedidos.html`.
Pra atualizar o status de um pedido, edite só a aba `Pedidos`; a aba
`Painel` (e o site) atualiza sozinha.

## Estrutura do projeto

```
index.html             Home
sobre.html              Sobre o studio
servicos.html           Serviços
materiais.html          Guia de materiais + quiz
orcamento.html          Calculadora de orçamento
galeria.html            Galeria completa              (gerada)
peca.html               Página de uma peça, montada por js/peca.js a partir de ?id=
presentes.html, colecionaveis.html, gamer.html, empresas.html
                        Landing pages por público    (geradas)
guia.html, guia-*.html  Guia de impressão 3D         (gerados)
faq.html                Perguntas frequentes
contato.html            Contato
pedidos.html            Painel de pedidos (lê a planilha do Google Sheets)
sitemap.xml, robots.txt Para o Google                (gerados)
css/style.css           Estilos (compartilhado por todas as páginas)
js/script.js             CONFIG, menu mobile, animações, calculadora e quiz de materiais
js/pecas-data.js          Todas as peças da galeria — a fonte de tudo que é gerado
js/peca.js                Monta a página de peça
js/pedidos.js             Config e lógica do painel de pedidos
tools/build.py            Regenera tudo que está marcado como (gerado)
tools/                    Os geradores e o conversor de fotos que o build usa
assets/img/brand/         Arquivos da logo
assets/img/gallery/       Fotos da galeria, em WebP (1200 px e -600)
.claude/agents/           Subagentes personalizados do Claude Code
```
